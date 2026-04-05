from django.db import transaction
from django.contrib.auth import get_user_model
from django.db.models import Avg, Q

from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from users.permissions import IsVerified, IsVolunteer
from donation.models import Donation
from .models import ItemRequest, DonationOrder, VolunteerRating
from notifications.models import Notification
from services.email_service import send_order_confirmation_email, send_order_approved_email, send_delivery_completed_email, send_order_picked_up_email
from .serializers import (
    ItemRequestSerializer,
    AdminItemRequestSerializer,
    DonationOrderSerializer,
    DonationOrderDetailSerializer,
    VolunteerActiveOrderSerializer,
    VolunteerRatingSerializer,
)
from .permissions import IsReceiver


User = get_user_model()


# ==================================================
# HELPER: AUTO SELECT AVAILABLE VOLUNTEER
# ==================================================

def select_available_volunteer():
    """
    Selects the oldest idle volunteer.
    Excludes volunteers currently handling a picked-up order.
    """
    busy_volunteer_ids = DonationOrder.objects.filter(
        status="picked_up",
        volunteer__isnull=False
    ).values_list("volunteer_id", flat=True)

    return (
        User.objects
        .filter(role="volunteer")
        .exclude(id__in=busy_volunteer_ids)
        .order_by("date_joined")
        .first()
    )


# ==================================================
# Receiver Item Requests (Create + List own requests)
# ==================================================

class ReceiverItemRequestView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsReceiver]
    serializer_class = ItemRequestSerializer

    def get_queryset(self):
        return ItemRequest.objects.filter(receiver=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(receiver=self.request.user)


# ==================================================
# Receiver Donation Orders (Create + List own orders)
# ==================================================

class ReceiverDonationOrderView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsReceiver]

    def get_queryset(self):
        return DonationOrder.objects.filter(receiver=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        return (
            DonationOrderDetailSerializer
            if self.request.method == "GET"
            else DonationOrderSerializer
        )

    @transaction.atomic
    def perform_create(self, serializer):
        """
        FLOW:
        1️⃣ Create DonationOrder (receiver ordered)
        2️⃣ Mark donation as ASSIGNED
        3️⃣ Send confirmation email to receiver
        4️⃣ Manual volunteer assignment by admin is required
        """

        order = serializer.save(receiver=self.request.user)
        donation = order.donation

        if donation.status != "verified":
            raise ValueError("Donation is no longer available.")

        donation.status = "assigned"
        donation.save(update_fields=["status"])

        # ✅ NEW: If this donation was fulfilling a specific request, mark that request as completed now
        if donation.fulfilled_request:
            donation.fulfilled_request.status = "completed"
            donation.fulfilled_request.save(update_fields=["status"])

        # 📧 Send confirmation email to receiver
        send_order_confirmation_email(order)

        # Manual assignment by admin is now required.
        # Flow stops here until admin assigns a volunteer.


# ==================================================
# User Item Requests (Get requests from specific user)
# ==================================================

class UserItemRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        requests_list = ItemRequest.objects.filter(
            receiver=user
        ).order_by("-created_at")

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(requests_list, request)
        if page is not None:
            serializer = ItemRequestSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ItemRequestSerializer(requests_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================================================
# Volunteer: View Active Delivery
# ==================================================

# ==================================================
# Volunteer: View Active Delivery
# ==================================================

class AvailableDeliveryTasksView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]

    def get(self, request):
        """
        List all donation orders pending volunteer assignment.
        Excludes orders involving the current user (as donor or receiver).
        """
        orders = DonationOrder.objects.filter(
            status="assigned",
            delivery_type="volunteer",
            volunteer__isnull=True
        ).exclude(
            Q(donation__donor=request.user) | Q(receiver=request.user)
        ).order_by("created_at")

        serializer = VolunteerActiveOrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AcceptDeliveryTaskView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]

    @transaction.atomic
    def post(self, request, order_id):
        """
        Assign the current user as volunteer for the order.
        """
        # Check if user already has an active delivery
        active_delivery = DonationOrder.objects.filter(
            volunteer=request.user,
            status__in=["assigned", "picked_up"]
        ).exists()

        if active_delivery:
            return Response(
                {"error": "You already have an active delivery task. Complete it first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = DonationOrder.objects.select_for_update().get(
                id=order_id,
                status="assigned",
                volunteer__isnull=True
            )
        except DonationOrder.DoesNotExist:
            return Response(
                {"error": "Task not found or already assigned."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent donor/receiver from volunteering
        if order.donation.donor == request.user or order.receiver == request.user:
             return Response(
                {"error": "You cannot volunteer for your own transaction."},
                status=status.HTTP_403_FORBIDDEN
            )

        order.volunteer = request.user
        order.save()

        return Response(
            {"message": "Task accepted successfully! Please proceed to pickup."},
            status=status.HTTP_200_OK
        )


class VolunteerActiveOrderView(APIView):
    permission_classes = [IsAuthenticated, IsVerified] # Changed from IsVolunteer to inclusive
    
    def get(self, request):
        """
        Returns the volunteer's current active order (if any)
        """
        # Find order where this user is the volunteer and not delivered/canceled
        order = DonationOrder.objects.filter(
            volunteer=request.user
        ).exclude(status__in=["delivered", "canceled"]).first()
        
        if not order:
            return Response(
                {"detail": "No active delivery assigned."},
                status=status.HTTP_200_OK
            )

        serializer = VolunteerActiveOrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

class VolunteerMarkPickedUpView(APIView):
    permission_classes = [IsAuthenticated, IsVolunteer]

    @transaction.atomic
    def patch(self, request, order_id):
        """
        Marks an assigned order as picked up.
        Sends email notification to receiver.
        """
        try:
            order = DonationOrder.objects.select_for_update().get(
                id=order_id,
                volunteer=request.user,
                status="assigned"
            )
        except DonationOrder.DoesNotExist:
            return Response(
                {"error": "Assigned order not found or not assigned to you."},
                status=status.HTTP_404_NOT_FOUND
            )

        order.status = "picked_up"
        order.save(update_fields=["status"])

        # Update donation status too
        donation = order.donation
        donation.status = "picked_up"
        donation.save(update_fields=["status"])

        # 📧 Send pickup notification email to receiver
        send_order_picked_up_email(order)

        Notification.objects.create(
            user=order.receiver,
            title="Order Picked Up",
            message=f"The volunteer has picked up your donation '{donation.item_name}' and is on the way!",
            notification_type="info"
        )

        return Response(
            {"message": "Order marked as picked up."},
            status=status.HTTP_200_OK
        )


class VolunteerMarkDeliveredView(APIView):
    permission_classes = [IsAuthenticated, IsVolunteer]

    @transaction.atomic
    def patch(self, request, order_id):
        """
        Marks an active order as delivered.
        Cascades:
        - DonationOrder -> delivered
        - Donation -> delivered
        - Sends confirmation emails to receiver and donor
        """

        try:
            order = DonationOrder.objects.select_for_update().get(
                id=order_id,
                volunteer=request.user,
                status__in=["assigned", "picked_up"]  # Allow both statuses
            )
        except DonationOrder.DoesNotExist:
            return Response(
                {"error": "Active order not found or not assigned to you."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update order
        order.status = "delivered"
        order.save(update_fields=["status"])

        # Update donation
        donation = order.donation
        donation.status = "delivered"
        donation.save(update_fields=["status"])

        # 📧 Send delivery completion emails to both receiver and donor
        send_delivery_completed_email(order)

        return Response(
            {"message": "Delivery marked as completed."},
            status=status.HTTP_200_OK
        )


class ReceiverRateVolunteerView(APIView):
    permission_classes = [IsAuthenticated, IsReceiver]

    def post(self, request):
        serializer = VolunteerRatingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.validated_data['order']
            volunteer = order.volunteer

            # ✅ Save the rating
            rating_obj = serializer.save(
                volunteer=volunteer,
                receiver=request.user
            )

            # ✅ Update Volunteer's average rating in UserProfile
            avg_rating = VolunteerRating.objects.filter(volunteer=volunteer).aggregate(Avg('rating'))['rating__avg']
            
            if volunteer.profile:
                volunteer.profile.rating = round(avg_rating, 1) if avg_rating else 0.0
                volunteer.profile.save(update_fields=['rating'])

            # 🔔 Notify Volunteer
            Notification.objects.create(
                user=volunteer,
                title="New Rating Received!",
                message=f"You received a {rating_obj.rating} star rating for your delivery of '{order.donation.item_name}'.",
                notification_type="info"
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReceiverCancelOrderView(APIView):
    permission_classes = [IsAuthenticated, IsReceiver]

    @transaction.atomic
    def patch(self, request, order_id):
        """
        Allows receiver to cancel their order.
        Cascades:
        - DonationOrder -> canceled
        - Donation -> verified (available again)
        - Notify volunteer if assigned
        """
        try:
            order = DonationOrder.objects.select_for_update().get(
                id=order_id,
                receiver=request.user
            )
        except DonationOrder.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status == "delivered":
            return Response(
                {"error": "Cannot cancel a delivered order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order.status == "canceled":
            return Response(
                {"error": "Order is already canceled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update order status
        old_status = order.status
        order.status = "canceled"
        order.save(update_fields=["status"])

        # Update donation status back to verified
        donation = order.donation
        donation.status = "verified"
        donation.save(update_fields=["status"])

        # Notify volunteer if they were already picking up/assigned
        if order.volunteer:
            Notification.objects.create(
                user=order.volunteer,
                title="Order Canceled",
                message=f"The order for '{donation.item_name}' has been canceled by the receiver.",
                notification_type="warning"
            )

        return Response(
            {"message": "Order canceled successfully. The item is now available for others."},
            status=status.HTTP_200_OK
        )


class ReceiverMarkDeliveredView(APIView):
    permission_classes = [IsAuthenticated, IsReceiver]

    @transaction.atomic
    def patch(self, request, order_id):
        """
        Allows receiver to mark a self-pickup order as delivered.
        """
        try:
            order = DonationOrder.objects.select_for_update().get(
                id=order_id,
                receiver=request.user,
                delivery_type="self_pickup",
                status="assigned"
            )
        except DonationOrder.DoesNotExist:
            return Response(
                {"error": "Self-pickup order not found or not in a state to be marked as delivered."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update order status
        order.status = "delivered"
        order.save(update_fields=["status"])

        # Update donation status
        donation = order.donation
        donation.status = "delivered"
        donation.save(update_fields=["status"])

        return Response(
            {"message": "Order marked as delivered successfully! Enjoy your item."},
            status=status.HTTP_200_OK
        )


class VolunteerDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsVolunteer]

    def get(self, request):
        user = request.user
        orders = DonationOrder.objects.filter(volunteer=user)

        active = orders.filter(status__in=["assigned", "picked_up"]).count()
        completed = orders.filter(status="delivered").count()
        canceled = orders.filter(status="canceled").count()
        
        # Get rating from profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        rating = profile.rating

        return Response({
            "active_deliveries": active,
            "completed_deliveries": completed,
            "failed_deliveries": canceled,
            "average_rating": rating
        }, status=status.HTTP_200_OK)


class VolunteerOrderHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsVolunteer]

    def get_queryset(self):
        return DonationOrder.objects.filter(
            volunteer=self.request.user,
            status__in=["delivered", "canceled"]
        ).order_by("-updated_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DonationOrderDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DonationOrderDetailSerializer(queryset, many=True)
        return Response(serializer.data)


# ==================================================
# Donor: View Approved Item Requests from others
# ==================================================

class ApprovedItemRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Show all approved requests so donors can see what is needed
        # Exclude requests made by the donor themselves (optional, but good)
        queryset = ItemRequest.objects.filter(status='approved').exclude(receiver=request.user).order_by("-created_at")
        
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = AdminItemRequestSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminItemRequestSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================================================
# RECOMMENDED DONATIONS
# ==================================================
from .models import RecommendedDonation
from .serializers import RecommendedDonationSerializer
from users.models import UserProfile

class ReceiverRecommendationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsReceiver]
    serializer_class = RecommendedDonationSerializer

    def get_queryset(self):
        # Return suggested and requested items
        return RecommendedDonation.objects.filter(
            receiver=self.request.user,
            status__in=['suggested', 'requested', 'accepted'] 
        ).order_by('-similarity_score', '-created_at')

class RequestRecommendedItemView(APIView):
    permission_classes = [IsAuthenticated, IsReceiver]

    def post(self, request, recommendation_id):
        try:
            rec = RecommendedDonation.objects.get(id=recommendation_id, receiver=request.user)
        except RecommendedDonation.DoesNotExist:
             return Response({"error": "Recommendation not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if rec.status != 'suggested':
            return Response({"error": "Item is not in suggested state"}, status=status.HTTP_400_BAD_REQUEST)
            
        rec.status = 'requested'
        rec.save(update_fields=['status'])
        
        # Notify Donor
        Notification.objects.create(
            user=rec.donation.donor,
            title="New Request for Your Donation",
            message=f"{request.user.username} has requested your '{rec.donation.item_name}'.",
            notification_type="info"
        )

        return Response({"message": "Item requested successfully", "status": "requested"}, status=status.HTTP_200_OK)

class DonorDonationRequestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RecommendedDonationSerializer 

    def get_queryset(self):
        donation_id = self.kwargs['donation_id']
        # Ensure user owns the donation
        return RecommendedDonation.objects.filter(
            donation__id=donation_id,
            donation__donor=self.request.user,
            status='requested'
        ).order_by('-similarity_score')

class DonorApproveRequestView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, recommendation_id):
        try:
            rec = RecommendedDonation.objects.select_for_update().get(
                id=recommendation_id, 
                donation__donor=request.user
            )
        except RecommendedDonation.DoesNotExist:
             return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
             
        if rec.status != 'requested':
             return Response({"error": "Request not in pending state"}, status=status.HTTP_400_BAD_REQUEST)
             
        # Approve this one
        rec.status = 'accepted'
        rec.save(update_fields=['status'])
        
        # Mark donation as assigned
        donation = rec.donation
        donation.status = 'assigned'
        donation.save(update_fields=['status'])
        
        # Reject other requests for this donation
        RecommendedDonation.objects.filter(donation=donation).exclude(id=rec.id).update(status='rejected')

        # Create DonationOrder
        DonationOrder.objects.create(
            donation=donation,
            receiver=rec.receiver,
            status='assigned',
            delivery_type='volunteer' # Defaulting to volunteer as per typical flow
        )
        
        # Notify Receiver
        Notification.objects.create(
            user=rec.receiver,
            title="Request Approved!",
            message=f"Your request for '{donation.item_name}' has been approved!",
            notification_type="success"
        )

        return Response({"message": "Request approved", "status": "accepted"}, status=status.HTTP_200_OK)

class DonorRejectRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, recommendation_id):
        try:
            rec = RecommendedDonation.objects.get(
                id=recommendation_id, 
                donation__donor=request.user
            )
        except RecommendedDonation.DoesNotExist:
             return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

        if rec.status != 'requested':
             return Response({"error": "Can only reject requested items"}, status=status.HTTP_400_BAD_REQUEST)
             
        rec.status = 'rejected'
        rec.save(update_fields=['status'])
        
        Notification.objects.create(
            user=rec.receiver,
            title="Request Rejected",
            message=f"Your request for '{rec.donation.item_name}' was not approved.",
            notification_type="warning"
        )
        
        return Response({"message": "Request rejected", "status": "rejected"}, status=status.HTTP_200_OK)


class VolunteerAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]

    def patch(self, request):
        """
        Update volunteer availability status
        Body: {"is_available": true/false}
        """
        try:
            profile = request.user.profile
        except:
            # Create profile if it doesn't exist
            from users.models import UserProfile
            profile = UserProfile.objects.create(user=request.user)

        is_available = request.data.get('is_available')
        
        if is_available is None:
            return Response(
                {"error": "is_available field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.is_available = bool(is_available)
        profile.save(update_fields=['is_available'])

        return Response(
            {
                "message": f"Availability set to {'available' if profile.is_available else 'unavailable'}",
                "is_available": profile.is_available
            },
            status=status.HTTP_200_OK
        )

    def get(self, request):
        """
        Get volunteer availability status
        """
        try:
            profile = request.user.profile
        except:
            # Create profile if it doesn't exist
            from users.models import UserProfile
            profile = UserProfile.objects.create(user=request.user)

        return Response(
            {"is_available": profile.is_available},
            status=status.HTTP_200_OK
        )
