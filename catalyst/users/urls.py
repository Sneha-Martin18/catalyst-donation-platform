from django.urls import path
from .views import (
    AdminUserListView,
    RegisterUserView,
    UserProfileView,
    GenerateEmailOTPView,
    EmailVerifyOTPView,
    AdminToggleUserStatusView,
    AdminDeleteUserView
)

urlpatterns = [
    path('admin/users/', AdminUserListView.as_view()),
    path('admin/users/<int:user_id>/toggle-status/', AdminToggleUserStatusView.as_view()),
    path('admin/users/<int:user_id>/delete/', AdminDeleteUserView.as_view()),

    path('register/', RegisterUserView.as_view(), name='user-register'),

    # USER PROFILE (GET + PUT)
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    # EMAIL VERIFICATION
    path('email/generate-otp/', GenerateEmailOTPView.as_view(), name='generate-email-otp'),
    path('email/verify-otp/', EmailVerifyOTPView.as_view(), name='verify-email-otp'),
]
