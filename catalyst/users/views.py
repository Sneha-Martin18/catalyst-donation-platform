from django.contrib.auth import get_user_model
import random

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
)
from .permissions import IsAdmin
from .models import EmailOTP, UserProfile

User = get_user_model()

# =========================
# USER REGISTRATION        
# =========================

class RegisterUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# ADMIN — LIST USERS
# =========================

class AdminUserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(users, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# USER PROFILE (GET / PUT)
# =========================

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=request.user)
        
        serializer = UserSerializer(request.user)
        data = serializer.data
        
        # Flatten profile data into root object to match frontend flattened expectation
        profile_data = data.pop('profile', {})
        if profile_data:
            # We want to keep is_verified from the serialized output (which comes from SerializerMethodField)
            # but address, phone_number, etc. from profile_data
            data.update(profile_data)
            
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Update User fields
        if "first_name" in request.data:
            request.user.first_name = request.data.get("first_name", "")
        if "last_name" in request.data:
            request.user.last_name = request.data.get("last_name", "")
        if "date_of_birth" in request.data:
            request.user.date_of_birth = request.data.get("date_of_birth")

        request.user.save()

        # Update Profile fields
        if "phone_number" in request.data:
            profile.phone_number = request.data.get("phone_number", "")
        if "address" in request.data:
            profile.address = request.data.get("address", "")
        if "profile_picture" in request.FILES:
            profile.profile_picture = request.FILES["profile_picture"]

        profile.save()

        # Use serializer for consistent and flattened response
        serializer = UserSerializer(request.user)
        data = serializer.data
        
        profile_data = data.pop('profile', {})
        if profile_data:
            data.update(profile_data)
            
        return Response(data, status=status.HTTP_200_OK)


# =========================
# EMAIL OTP GENERATION
# =========================

class GenerateEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create profile if not exists
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Remove old OTPs
        EmailOTP.objects.filter(user=request.user).delete()

        # Update profile state
        profile.is_verified = False
        profile.save()

        # Generate new OTP
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.create(user=request.user, otp=otp)

        # SEND ACTUAL EMAIL
        subject = "Your Catalyst Verification Code"
        message = f"Hello {request.user.username},\n\nYour 6-digit verification code is: {otp}\n\nThis code is valid for 10 minutes."
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]

        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
            print(f"[SUCCESS] OTP email sent to {email}")
        except Exception as e:
            print(f"[ERROR] Failed to send email: {str(e)}")
            # In development, we still want to see it in console if email fails
            print(f"[FALLBACK] OTP for {email}: {otp}")

        return Response(
            {"message": "OTP has been sent to your email address."},
            status=status.HTTP_200_OK,
        )


# =========================
# EMAIL OTP VERIFICATION
# =========================

class EmailVerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        otp_entered = str(request.data.get("otp", "")).strip()

        if not otp_entered:
            return Response(
                {"error": "OTP required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch latest OTP
        record = (
            EmailOTP.objects.filter(user=request.user)
            .order_by("-created_at")
            .first()
        )

        if not record:
            return Response(
                {"error": "No active OTP found. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.is_expired():
            record.delete()
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.otp != otp_entered:
            return Response(
                {"error": "Incorrect OTP. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark Verified
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.is_verified = True
        profile.save()
        
        user = request.user
        user.is_verified = True
        user.is_active = True
        user.save()

        # Cleanup
        record.delete()

        return Response(
            {"message": "Email verified successfully"},
            status=status.HTTP_200_OK,
        )


# =========================
# ADMIN — TOGGLE USER STATUS
# =========================

class AdminToggleUserStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.id == request.user.id:
            return Response(
                {"detail": "Admin cannot block themselves"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = not user.is_active
        user.save()

        return Response(
            {
                "id": user.id,
                "is_active": user.is_active,
            },
            status=status.HTTP_200_OK,
        )


class AdminDeleteUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.id == request.user.id:
            return Response(
                {"detail": "Admin cannot delete themselves"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()

        return Response(
            {"detail": "User deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


# =========================
# SAMPLE PROTECTED VIEW
# =========================

class MyProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"message": f"Hello {request.user.username}!"},
            status=status.HTTP_200_OK,
        )
