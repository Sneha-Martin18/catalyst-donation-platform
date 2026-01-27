from django.urls import path
from .views import (
    AdminAssignDonationAPIView,
    AdminVerifyDonationAPIView,
    DonationListCreateAPIView,
    DonationDetailAPIView,
    DonationListAllAPIView,
    DonationHistoryAPIView,
    DonationRequestRatioView,
    UserDonationListAPIView,
     AdminDonationApprovalsAPIView,
)


urlpatterns = [
    # 🔹 Admin approval
    path('admin/approvals/', AdminDonationApprovalsAPIView.as_view(), name='admin-donation-approvals'),
    path('admin/verify/<int:donation_id>/', AdminVerifyDonationAPIView.as_view()),
    path('admin/assign/<int:donation_id>/',AdminAssignDonationAPIView.as_view(),name='admin-assign-donation'),
    # 🔹 STATIC routes first
    path('history/', DonationHistoryAPIView.as_view(), name='donation-history'),
    path('all/', DonationListAllAPIView.as_view(), name='donation-list-all'),
    path('user/<int:user_id>/donations/', UserDonationListAPIView.as_view(), name='user-donations'),

    # 🔹 List + create (donor)
    path('', DonationListCreateAPIView.as_view(), name='donation-list-create'),

    # 🔹 Detail (must be LAST)
    path('<int:donation_id>/', DonationDetailAPIView.as_view(), name='donation-detail'),
     path("admin/donation-request-ratio/", DonationRequestRatioView.as_view(), name="donation-request-ratio"),
]
