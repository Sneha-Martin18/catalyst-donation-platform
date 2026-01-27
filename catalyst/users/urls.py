from django.urls import path
from .views import (
    AdminUserListView,
    RegisterUserView,
    UserProfileView,
    GenerateAadhaarOTPView,
    AadhaarVerifyOTPView,
    AdminToggleUserStatusView,
)

urlpatterns = [
    path('admin/users/', AdminUserListView.as_view()),
    path('admin/users/<int:user_id>/toggle-status/', AdminToggleUserStatusView.as_view()),

    path('register/', RegisterUserView.as_view(), name='user-register'),

    # USER PROFILE (GET + PUT)
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    # AADHAAR
    path('aadhaar/generate-otp/', GenerateAadhaarOTPView.as_view(), name='generate-aadhaar-otp'),
    path('aadhaar/verify-otp/', AadhaarVerifyOTPView.as_view(), name='verify-aadhaar-otp'),
]
