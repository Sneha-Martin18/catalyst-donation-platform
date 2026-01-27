from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAadhaarVerified
from django.db.models import Sum
from django.utils.timezone import now


from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
import cloudinary.uploader

from .models import Donation, DonationImage
from .serializers import DonationSerializer
from .permissions import IsOwnerOrAdmin
from receiver.models import ItemRequest


class DonationListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsAadhaarVerified]
    parser_classes = [MultiPartParser, FormParser]
    
    
    def get(self, request):
        user = request.user

        # Donors see only their own donations
        donations = Donation.objects.filter(donor=user)

        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DonationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 1️⃣ Save donation first
        donation = serializer.save(donor=request.user)

        # 2️⃣ Upload images to cloud
        images = request.FILES.getlist('images')
        
            # ✅ IMAGE LIMIT CHECK (PUT IT HERE)
        if len(images) > 5:
            donation.delete()  # rollback donation creation
            return Response(
                {"error": "Maximum 5 images allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 3️⃣ Upload images to cloud   
        for img in images:
            upload_result = cloudinary.uploader.upload(
                img,
                folder="donations"
            )

            DonationImage.objects.create(
                donation=donation,
                image_url=upload_result['secure_url']
            )

        return Response(
            DonationSerializer(donation).data,
            status=status.HTTP_201_CREATED
        )   
        
        

class DonationDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsAadhaarVerified]

    def get_object(self, donation_id, user):
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
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, donation_id):
        donation = self.get_object(donation_id, request.user)
        serializer = DonationSerializer(donation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, donation_id):
        donation = self.get_object(donation_id, request.user)
        donation.delete()
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
        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
class DonationListAllAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsAadhaarVerified]

    def get(self, request):
        donations = Donation.objects.all()
        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
#___________________DONATION HISTORY VIEW___________________#

class DonationHistoryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, IsAadhaarVerified]

    def get(self, request):
        user = request.user
        
        # only delivered donations for this donor
        donations = Donation.objects.filter(
            donor=user,
            status='delivered'
        ).order_by('-created_at')

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
            status__in=['pending', 'verified', 'assigned']
        ).order_by('created_at')

        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminVerifyDonationAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAadhaarVerified]

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
    permission_classes = [IsAuthenticated, IsAadhaarVerified]

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