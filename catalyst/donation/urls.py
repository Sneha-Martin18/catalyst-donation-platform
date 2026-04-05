from django.urls import path
from .views import (
    AdminAssignDonationAPIView,
    AdminVerifyDonationAPIView,
    AvailableDonationsAPIView,
    AvailableFundraisersAPIView,
    DonateToFundraiserAPIView,
    DonationListCreateAPIView,
    DonationDetailAPIView,
    DonationListAllAPIView,
    DonationHistoryAPIView,
    DonationRequestRatioView,
    UserDonationListAPIView,
    AdminDonationApprovalsAPIView,
    AdminCloseFundraiserAPIView,
    ReceiverRecommendationsAPIView,
    ReceiverProfileInsightsAPIView,
    DonationRequestsForItemView,
    DonorApproveRecommendationView,
    DonorRejectRecommendationView,
    DonationImageDeleteAPIView,
)


urlpatterns = [
    # 🔹 Admin approval
    path('admin/approvals/', AdminDonationApprovalsAPIView.as_view(), name='admin-donation-approvals'),
    path('admin/verify/<int:donation_id>/', AdminVerifyDonationAPIView.as_view()),
    path('admin/assign/<int:donation_id>/',AdminAssignDonationAPIView.as_view(),name='admin-assign-donation'),
    path('admin/close-fundraiser/<int:donation_id>/', AdminCloseFundraiserAPIView.as_view(), name='admin-close-fundraiser'),
    

    # 🔹 STATIC routes first
    path('history/', DonationHistoryAPIView.as_view(), name='donation-history'),
    path('all/', DonationListAllAPIView.as_view(), name='donation-list-all'),
    path('user/<int:user_id>/donations/', UserDonationListAPIView.as_view(), name='user-donations'),

    # 🔹 List + create (donor)
    path('', DonationListCreateAPIView.as_view(), name='donation-list-create'),

    # 🔹 Detail (must be LAST)
    path('<int:donation_id>/', DonationDetailAPIView.as_view(), name='donation-detail'),
    path("admin/donation-request-ratio/", DonationRequestRatioView.as_view(), name="donation-request-ratio"),
    path("available/",AvailableDonationsAPIView.as_view(),name="available-donations"),
    path("fundraisers/", AvailableFundraisersAPIView.as_view(), name="available-fundraisers"),
    path("<int:donation_id>/contribute/", DonateToFundraiserAPIView.as_view(), name="contribute-to-fundraiser"),
    path("image/<int:image_id>/", DonationImageDeleteAPIView.as_view(), name="delete-donation-image"),
    
    # 🔹 AI Recommendations
    path('recommendations/', ReceiverRecommendationsAPIView.as_view(), name='receiver-recommendations'),
    path('receiver-insights/', ReceiverProfileInsightsAPIView.as_view(), name='receiver-insights'),
    
    # ✅ RECOMMENDED DONATIONS (Donor)
    path('<int:donation_id>/requests/', DonationRequestsForItemView.as_view(), name='donation-requests'),
    path('recommendations/<int:recommendation_id>/approve/', DonorApproveRecommendationView.as_view(), name='approve-recommendation'),
    path('recommendations/<int:recommendation_id>/reject/', DonorRejectRecommendationView.as_view(), name='reject-recommendation'),
]
