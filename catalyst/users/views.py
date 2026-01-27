from django.contrib.auth import get_user_model
import random

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
)
from .permissions import IsAdmin
from .models import AadhaaarOTP, UserProfile

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
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# USER PROFILE (GET / PUT)
# =========================

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "role": request.user.role,
                "date_of_birth": request.user.date_of_birth,
                "volunteer_code": request.user.volunteer_code,

                # PROFILE DATA
                "address": profile.address,
                "phone_number": profile.phone_number,
                "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
                "rating": profile.rating,
                "aadhaar_last4": profile.aadhaar_last4,
                "aadhaar_verified": profile.aadhaar_verified,
            },
            status=status.HTTP_200_OK,
        )

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

        # Return updated profile
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "role": request.user.role,
                "date_of_birth": request.user.date_of_birth,
                "volunteer_code": request.user.volunteer_code,
                "address": profile.address,
                "phone_number": profile.phone_number,
                "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
                "rating": profile.rating,
                "aadhaar_last4": profile.aadhaar_last4,
                "aadhaar_verified": profile.aadhaar_verified,
            },
            status=status.HTTP_200_OK,
        )


# =========================
# AADHAAR OTP GENERATION
# =========================

class GenerateAadhaarOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        aadhaar_last4 = request.data.get("aadhaar_last4")

        if not aadhaar_last4 or len(aadhaar_last4) != 4 or not aadhaar_last4.isdigit():
            return Response(
                {"error": "Invalid Aadhaar last 4 digits"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Remove old OTPs
        AadhaaarOTP.objects.filter(user=request.user).delete()

        profile.aadhaar_last4 = aadhaar_last4
        profile.aadhaar_verified = False
        profile.save()

        otp = str(random.randint(100000, 999999))
        AadhaaarOTP.objects.create(user=request.user, otp=otp)

        print(f"[MOCK UIDAI OTP] OTP for {request.user.username}: {otp}")

        return Response(
            {"message": "OTP sent successfully", "otp": otp},
            status=status.HTTP_200_OK,
        )


# =========================
# AADHAAR OTP VERIFICATION
# =========================

class AadhaarVerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp_entered = request.data.get("otp")

        if not otp_entered:
            return Response(
                {"error": "OTP required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record = (
            AadhaaarOTP.objects.filter(user=request.user)
            .order_by("-created_at")
            .first()
        )

        if not record:
            return Response(
                {"error": "OTP not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.is_expired():
            record.delete()
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.otp != otp_entered:
            return Response(
                {"error": "Incorrect OTP"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = request.user.profile
        profile.aadhaar_verified = True
        profile.save()

        record.delete()

        return Response(
            {"message": "Aadhaar verified successfully"},
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
