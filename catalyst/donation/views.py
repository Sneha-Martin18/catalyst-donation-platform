from datetime import timedelta
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsVerified
from django.db.models import Sum, Count, Avg, Q
from django.utils.timezone import now
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction


from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
import cloudinary.uploader
from .models import Donation, DonationImage
from .serializers import DonationSerializer, PublicDonationSerializer
from .permissions import IsOwnerOrAdmin
from receiver.models import ItemRequest
from notifications.models import Notification


class DonationListCreateAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        """
        GET  -> Authenticated users can view their donations
        POST -> Only Aadhaar-verified users can create donations
        """
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerified()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        # Donors see only their own donations
        donations = Donation.objects.filter(donor=request.user).order_by('-created_at')

        # Global stats (all user donations)
        stats = donations.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            verified=Count('id', filter=Q(status='verified')),
            assigned=Count('id', filter=Q(status='assigned')),
            delivered=Count('id', filter=Q(status='delivered')),
        )
        
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(donations, request)
        if page is not None:
            serializer = DonationSerializer(page, many=True)
            response = paginator.get_paginated_response(serializer.data)
            response.data['stats'] = stats
            return response

        serializer = DonationSerializer(donations, many=True)
        return Response({
            'results': serializer.data,
            'stats': stats
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DonationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 1️⃣ Save donation first
        donation = serializer.save(donor=request.user)

        # 2️⃣ Get uploaded images
        images = request.FILES.getlist("images")

        # ✅ Image limit check
        if len(images) > 5:
            donation.delete()  # rollback donation creation
            return Response(
                {"error": "Maximum 5 images allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3️⃣ Upload images to Cloudinary
        for img in images:
            upload_result = cloudinary.uploader.upload(
                img,
                folder="donations"
            )

            DonationImage.objects.create(
                donation=donation,
                image_url=upload_result["secure_url"]
            )

        return Response(
            DonationSerializer(donation).data,
            status=status.HTTP_201_CREATED
        )
        

class DonationDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsVerified]

    def get_object(self, donation_id, user):
        if user.role == 'admin':
            return get_object_or_404(Donation, id=donation_id)
        return get_object_or_404(Donation, id=donation_id, donor=user)
    
    def put(self, request, donation_id):
        donation = self.get_object(donation_id, request.user)

        # 🚫 BLOCK EDITING IF NOT PENDING
        if donation.status != 'pending':
            return Response(
                {"detail": "You can only edit donations while they are pending."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DonationSerializer(
            donation,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            donation = serializer.save()

            # Handle new images
            new_images = request.FILES.getlist("images")
            current_image_count = donation.images.count()

            if current_image_count + len(new_images) > 5:
                return Response(
                    {"error": f"Total images cannot exceed 5. Currently have {current_image_count}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            for img in new_images:
                upload_result = cloudinary.uploader.upload(img, folder="donations")
                DonationImage.objects.create(
                    donation=donation,
                    image_url=upload_result["secure_url"]
                )

            return Response(DonationSerializer(donation).data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, donation_id):
        return self.put(request, donation_id)

    def get(self, request, donation_id):
        donation = self.get_object(donation_id, request.user)
        serializer = DonationSerializer(donation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, donation_id):
        donation = self.get_object(donation_id, request.user)
        donation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class DonationImageDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVerified]

    def delete(self, request, image_id):
        image = get_object_or_404(DonationImage, id=image_id)
        donation = image.donation

        # Check permission (owner or admin)
        if request.user != donation.donor and request.user.role != 'admin':
            return Response(status=status.HTTP_403_FORBIDDEN)

        # 🚫 BLOCK EDITING IF NOT PENDING
        if donation.status != 'pending' and request.user.role != 'admin':
             return Response(
                {"detail": "You can only remove images while the donation is pending."},
                status=status.HTTP_403_FORBIDDEN
            )

        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



    
class UserDonationListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all donations from this user
        donations = Donation.objects.filter(donor=user).order_by('-created_at')
        
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(donations, request)
        if page is not None:
            serializer = DonationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
class DonationListAllAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsVerified]

    def get(self, request):
        donations = Donation.objects.all().order_by('-created_at')
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(donations, request)
        if page is not None:
            serializer = DonationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
#___________________DONATION HISTORY VIEW___________________#

class DonationHistoryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsVerified]

    def get(self, request):
        user = request.user
        
        # only delivered donations for this donor
        donations = Donation.objects.filter(
            donor=user,
            status='delivered'
        ).order_by('-created_at')

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(donations, request)
        if page is not None:
            serializer = DonationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# ___________________ ADMIN APPROVALS VIEW ___________________

class AdminDonationApprovalsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request):
        user = request.user

        # Allow only admin
        if user.role != 'admin':
            return Response(
                {"detail": "Not authorized"},
                status=status.HTTP_403_FORBIDDEN
            )

        donations = Donation.objects.filter(
            status__in=['pending', 'verified', 'assigned', 'delivered']
        ).order_by('-created_at')

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(donations, request)
        if page is not None:
            serializer = DonationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminVerifyDonationAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]

    def patch(self, request, donation_id):
        donation = get_object_or_404(Donation, id=donation_id)

        # Only allow verify if pending
        if donation.status != 'pending':
            return Response(
                {"error": "Only pending donations can be verified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = 'verified'
        donation.save()

        return Response(
            {"message": "Donation verified successfully"},
            status=status.HTTP_200_OK
        )
        
class AdminAssignDonationAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVerified]

    def patch(self, request, donation_id):
        donation = get_object_or_404(Donation, id=donation_id)

        if donation.status != 'verified':
            return Response(
                {"error": "Only verified donations can be assigned"},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = 'assigned'
        donation.save()

        return Response(
            {"message": "Donation assigned successfully"},
            status=status.HTTP_200_OK
        )
        
class AdminCloseFundraiserAPIView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def patch(self, request, donation_id):
        # 🛡️ Admin only
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can perform this action"},
                status=status.HTTP_403_FORBIDDEN
            )

        donation = get_object_or_404(Donation, id=donation_id, donation_type='fundraiser')

        # Only allow closing if already verified or pending (though usually verified)
        if donation.status == 'delivered':
             return Response(
                {"error": "Fundraiser is already closed/delivered"},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = 'delivered' # Mark as completed/cut
        donation.save()

        return Response(
            {"message": "Fundraiser closed successfully"},
            status=status.HTTP_200_OK
        )
        
class DonationRequestRatioView(APIView):
    permission_classes = [IsOwnerOrAdmin, IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        since = now() - timedelta(days=days)

        total_donations = (
            Donation.objects
            .filter(
                created_at__gte=since,
                status__in=["verified", "assigned", "delivered"]
            )
            .aggregate(total=Sum("quantity"))["total"] or 0
        )

        total_requests = (
            ItemRequest.objects
            .filter(
                created_at__gte=since,
                status__in=["approved", "completed"]
            )
            .aggregate(total=Sum("quantity"))["total"] or 0
        )

        return Response({
            "donations": total_donations,
            "requests": total_requests,
            "window_days": days
        })
        
class AvailableDonationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search", "")
        category = request.query_params.get("category", "")

        # 📦 Physical items: only verified and not yet ordered
        donations = Donation.objects.filter(
            status="verified",
            donation_type='item'
        ).exclude(
            orders__isnull=False
        )

        if search:
            from django.db.models import Q
            donations = donations.filter(
                Q(item_name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        if category and category != "all":
            donations = donations.filter(category__iexact=category)

        # 🚀 RECOMMENDATION SORTING (Personalized Browse)
        from django.db.models import Case, When, Value, FloatField
        from receiver.models import ItemRequest, RecommendedDonation

        # Check if user has enough history (3+ requests)
        user_requests = ItemRequest.objects.filter(receiver=request.user)
        has_history = user_requests.count() >= 3

        if has_history:
            # 1. Get Preferred Categories (Frequency based)
            preferred_categories = list(
                user_requests.values('category')
                .annotate(count=Count('id'))
                .order_by('-count')
                .values_list('category', flat=True)[:5]
            )

            # 2. Add Annotation for Recommendation Score
            # Prioritize matching categories (Ranked)
            cases = []
            for idx, cat in enumerate(preferred_categories):
                # Score: 1st=5, 2nd=4, 3rd=3, 4th=2, 5th=1
                cases.append(When(category__iexact=cat, then=Value(5 - idx)))
            
            # Items already marked by the background engine as 'suggested' or 'requested' get a huge boost
            recommended_ids = RecommendedDonation.objects.filter(
                receiver=request.user,
                status__in=['suggested', 'requested']
            ).values_list('donation_id', flat=True)

            donations = donations.annotate(
                rec_score=Case(
                    *cases,
                    default=Value(0),
                    output_field=FloatField()
                ),
                is_pre_matched=Case(
                    When(id__in=recommended_ids, then=Value(10)),
                    default=Value(0),
                    output_field=FloatField()
                )
            ).order_by("-is_pre_matched", "-rec_score", "-created_at")
        else:
            donations = donations.order_by("-created_at")

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(donations, request)
        if page is not None:
            serializer = PublicDonationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = PublicDonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AvailableFundraisersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search", "")
        category = request.query_params.get("category", "")

        # 💰 Show only verified fundraisers
        fundraisers = Donation.objects.filter(
            status='verified',
            donation_type='fundraiser'
        )

        if search:
            from django.db.models import Q
            fundraisers = fundraisers.filter(
                Q(item_name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        if category and category != "all":
            fundraisers = fundraisers.filter(category__iexact=category)

        fundraisers = fundraisers.order_by("-created_at")

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(fundraisers, request)
        if page is not None:
            serializer = DonationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DonationSerializer(fundraisers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DonateToFundraiserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, donation_id):
        donation = get_object_or_404(Donation, id=donation_id, donation_type='fundraiser')
        amount = request.data.get("amount")

        if not amount or float(amount) <= 0:
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        donation.raised_amount += Decimal(str(amount))
        
        # If goal reached, mark as delivered (completed)
        if donation.goal_amount and donation.raised_amount >= donation.goal_amount:
            donation.status = 'delivered'
            
        donation.save()

        # SEND RECEIPT EMAIL
        subject = f"Receipt for your contribution to {donation.item_name}"
        message = f"Hello {request.user.first_name or request.user.username},\n\nThank you for your generous contribution of ₹{amount} to the fundraiser '{donation.item_name}'.\n\nYour support helps us make a difference!\n\nTransaction Details:\n- Amount: ₹{amount}\n- Fundraiser: {donation.item_name}\n- Date: {now().strftime('%Y-%m-%d %H:%M:%S')}\n\nThank you,\nTeam Catalyst"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [request.user.email]

        log_entry = f"[{now()}] Contribution to '{donation.item_name}'. User: {request.user.username} ({request.user.email}). Amount: {amount}\n"
        
        with open("mail_debug.log", "a") as logfile:
            logfile.write(log_entry)

        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
            with open("mail_debug.log", "a") as logfile:
                logfile.write(f"  --> [SUCCESS] Email sent to {recipient_list}\n")
            print(f"[SUCCESS] Receipt email sent to {request.user.email}")
        except Exception as e:
            with open("mail_debug.log", "a") as logfile:
                logfile.write(f"  --> [ERROR] {str(e)}\n")
            print(f"[ERROR] Failed to send receipt email: {str(e)}")

        return Response({
            "donation": DonationSerializer(donation).data,
            "recipient_email": request.user.email
        }, status=status.HTTP_200_OK)

# ==================================================
# AI RECOMMENDATION VIEWS
# ==================================================

class ReceiverRecommendationsAPIView(APIView):
    """
    Get AI-powered donation recommendations for receivers
    Based on their request history
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Query params
        limit = int(request.query_params.get('limit', 10))
        
        # Get user's request history
        user_requests_all = ItemRequest.objects.filter(receiver=request.user)
        request_count = user_requests_all.count()
        
        # ❌ Less than 3 requests -> fallback to recent donations
        if request_count < 3:
            donations = Donation.objects.filter(
                status='verified',
                donation_type='item'
            ).exclude(
                orders__isnull=False
            ).exclude(
                donor=request.user # Exclude user's own items
            ).order_by('-created_at')[:limit]
            
            serializer = PublicDonationSerializer(donations, many=True)
            return Response({
                "recommendations": serializer.data,
                "count": len(donations),
                "message": f"You have made {request_count} requests. At least 3 requests are needed for personalized recommendations. Showing recent donations."
            }, status=status.HTTP_200_OK)
        
        # 1️⃣ Build preference profile from request history
        user_requests = user_requests_all
        preferred_categories = list(
            user_requests.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
            .values_list('category', flat=True)[:5]
        )
        
        preferred_conditions = list(
            user_requests.values('condition')
            .annotate(count=Count('id'))
            .order_by('-count')
            .values_list('condition', flat=True)[:3]
        )
        
        avg_quantity = user_requests.aggregate(
            avg_qty=Avg('quantity')
        )['avg_qty'] or 1
        
        # Collect recent request item names for similarity matching
        past_item_names = list(user_requests.values_list('item_name', flat=True)[:20])
        import difflib
        
        # 2️⃣ Get available donations
        available = Donation.objects.filter(
            status='verified',
            donation_type='item'
        ).exclude(
            orders__isnull=False
        ).exclude(
            donor=request.user # Exclude user's own items
        ).order_by('-created_at')
        
        if not available.exists():
            return Response({
                "recommendations": [],
                "count": 0,
                "message": "No donations available at the moment."
            }, status=status.HTTP_200_OK)
        
        # 3️⃣ Score each donation based on user profile
        scored = []
        for donation in available:
            score = 0
            
            # Category match (40%)
            if donation.category in preferred_categories:
                idx = preferred_categories.index(donation.category)
                score += (5 - idx) * 0.08
            
            # Condition match (30%)
            if donation.condition in preferred_conditions:
                idx = preferred_conditions.index(donation.condition)
                score += (3 - idx) * 0.10
            
            # Quantity match (10%)
            if donation.quantity >= avg_quantity:
                score += 0.10
            
            # Freshness bonus (5%) - newer donations get slight boost
            days_old = (now() - donation.created_at).days
            if days_old < 7:
                score += 0.05
            
            # --- Similarity Match (Bonus 15%) ---
            # Using difflib to find best match in recent item names
            best_sim = 0.0
            for name in past_item_names:
                sim = difflib.SequenceMatcher(None, name.lower(), donation.item_name.lower()).ratio()
                if sim > best_sim:
                    best_sim = sim
            
            if best_sim > 0.6: # Threshold for similarity bonus
                score += best_sim * 0.15 # Max 0.15 bonus

            scored.append({'donation': donation, 'score': score})
        
        # 4️⃣ Sort by score & return top matches
        scored.sort(key=lambda x: x['score'], reverse=True)
        recommendations = [item['donation'] for item in scored[:limit]]
        
        serializer = PublicDonationSerializer(recommendations, many=True)
        return Response({
            "recommendations": serializer.data,
            "count": len(recommendations),
            "message": "Personalized recommendations based on your request history"
        }, status=status.HTTP_200_OK)


class ReceiverProfileInsightsAPIView(APIView):
    """
    Get receiver's preference profile and trending items
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_requests = ItemRequest.objects.filter(receiver=request.user)
        
        # ❌ No requests yet
        if not user_requests.exists():
            return Response({
                "profile": None,
                "trending_categories": [],
                "message": "Make some requests to see your preference profile"
            }, status=status.HTTP_200_OK)
        
        # 1️⃣ Build user preference profile
        profile = {
            'preferred_categories': list(
                user_requests.values('category')
                .annotate(count=Count('id'))
                .order_by('-count')
                .values_list('category', flat=True)[:5]
            ),
            'preferred_conditions': list(
                user_requests.values('condition')
                .annotate(count=Count('id'))
                .order_by('-count')
                .values_list('condition', flat=True)[:3]
            ),
            'request_count': user_requests.count(),
            'avg_quantity': round(
                user_requests.aggregate(Avg('quantity'))['quantity__avg'] or 1, 2
            ),
        }
        
        # 2️⃣ Get trending categories across all donations
        trending = Donation.objects.filter(
            status='verified',
            donation_type='item'
        ).values('category').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        trending_list = [
            {
                'category': item['category'],
                'available_count': item['count']
            }
            for item in trending
        ]
        
        return Response({
            "profile": profile,
            "trending_categories": trending_list
        }, status=status.HTTP_200_OK)


# ==================================================
# DONOR RECOMMENDATION MANAGEMENT
# ==================================================

from receiver.models import RecommendedDonation
from receiver.serializers import RecommendedDonationSerializer

class DonationRequestsForItemView(generics.ListAPIView):
    """
    GET /api/donation/<donation_id>/requests/
    
    Donor views all requests (status='requested') for their donation item.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecommendedDonationSerializer

    def get_queryset(self):
        donation_id = self.kwargs['donation_id']
        return RecommendedDonation.objects.filter(
            donation__id=donation_id,
            donation__donor=self.request.user,
            status='requested'
        ).order_by('-similarity_score')


class DonorApproveRecommendationView(APIView):
    """
    POST /api/donation/recommendations/<recommendation_id>/approve/
    
    Donor approves a receiver's request for their donation.
    - Sets status to 'accepted'
    - Marks donation as 'assigned'
    - Rejects other requests for this donation
    - Creates DonationOrder
    - Notifies receiver
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, recommendation_id):
        try:
            rec = RecommendedDonation.objects.select_for_update().get(
                id=recommendation_id, 
                donation__donor=request.user
            )
        except RecommendedDonation.DoesNotExist:
            return Response(
                {"error": "Request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
             
        if rec.status != 'requested':
            return Response(
                {"error": "Request not in pending state"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
             
        # Approve this one
        rec.status = 'accepted'
        rec.save(update_fields=['status'])
        
        # Mark donation as assigned
        donation = rec.donation
        donation.status = 'assigned'
        donation.save(update_fields=['status'])
        
        # Reject other requests for this donation
        RecommendedDonation.objects.filter(
            donation=donation
        ).exclude(id=rec.id).update(status='rejected')

        # Create DonationOrder
        from receiver.models import DonationOrder
        DonationOrder.objects.create(
            donation=donation,
            receiver=rec.receiver,
            status='assigned',
            delivery_type='volunteer'
        )
        
        # Notify Receiver
        Notification.objects.create(
            user=rec.receiver,
            title="Request Approved!",
            message=f"Your request for '{donation.item_name}' has been approved!",
            notification_type="success"
        )

        return Response(
            {"message": "Request approved", "status": "accepted"}, 
            status=status.HTTP_200_OK
        )


class DonorRejectRecommendationView(APIView):
    """
    POST /api/donation/recommendations/<recommendation_id>/reject/
    
    Donor rejects a receiver's request for their donation.
    - Sets status to 'rejected'
    - Notifies receiver
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, recommendation_id):
        try:
            rec = RecommendedDonation.objects.get(
                id=recommendation_id, 
                donation__donor=request.user
            )
        except RecommendedDonation.DoesNotExist:
            return Response(
                {"error": "Request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if rec.status != 'requested':
            return Response(
                {"error": "Can only reject requested items"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
             
        rec.status = 'rejected'
        rec.save(update_fields=['status'])
        
        # Notify Receiver
        Notification.objects.create(
            user=rec.receiver,
            title="Request Rejected",
            message=f"Your request for '{rec.donation.item_name}' was not approved.",
            notification_type="warning"
        )
        
        return Response(
            {"message": "Request rejected", "status": "rejected"}, 
            status=status.HTTP_200_OK
        )
