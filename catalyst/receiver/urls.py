from django.urls import path
from .views import (
    ReceiverItemRequestView,
    ReceiverDonationOrderView,
    UserItemRequestListView,
    VolunteerActiveOrderView,
    VolunteerMarkPickedUpView,
    VolunteerMarkDeliveredView,
    ReceiverCancelOrderView,
    ReceiverRateVolunteerView,
    VolunteerDashboardStatsView,
    VolunteerOrderHistoryView,
    ApprovedItemRequestListView,
    AvailableDeliveryTasksView,
    AcceptDeliveryTaskView,
    ReceiverMarkDeliveredView,
    ReceiverRecommendationListView,
    RequestRecommendedItemView,
    VolunteerAvailabilityView,
)
from .admin_views import (
    AdminItemRequestListView,
    AdminItemRequestApproveView,
    AdminItemRequestRejectView,
    AdminDonationOrderListView,
    AdminDonationOrderApproveView,
    AdminDonationOrderRejectView,
    AdminDonationOrderFulfillView,
    AdminVolunteerListView,
    AdminAssignVolunteerToOrderView,
    AdminDeleteItemRequestView,
    AdminUpdateItemRequestDeliveryPreferenceView
)

urlpatterns = [
    path('requests/', ReceiverItemRequestView.as_view()),
    path('orders/', ReceiverDonationOrderView.as_view()),
    path('user/<int:user_id>/requests/', UserItemRequestListView.as_view(), name='user-requests'),
    path('item-requests/approved/', ApprovedItemRequestListView.as_view(), name='approved-requests'),
    path('staff/item-requests/', AdminItemRequestListView.as_view()),
    path('staff/item-requests/<int:pk>/approve/',AdminItemRequestApproveView.as_view()),
    path('staff/item-requests/<int:pk>/reject/',AdminItemRequestRejectView.as_view()),
    path('staff/item-requests/<int:pk>/delete/',AdminDeleteItemRequestView.as_view()),
    path('staff/item-requests/<int:pk>/delivery-preference/', AdminUpdateItemRequestDeliveryPreferenceView.as_view()),
    path('staff/donation-orders/',AdminDonationOrderListView.as_view()),
    path('staff/donation-orders/<int:pk>/approve/',AdminDonationOrderApproveView.as_view()),
    path('staff/donation-orders/<int:pk>/reject/',AdminDonationOrderRejectView.as_view()),
    path('staff/donation-orders/<int:pk>/fulfill/',AdminDonationOrderFulfillView.as_view()),
    path(
        "volunteer/tasks/",
        AvailableDeliveryTasksView.as_view(),
        name="volunteer-tasks-available"
    ),
    path(
        "volunteer/tasks/<int:order_id>/accept/",
        AcceptDeliveryTaskView.as_view(),
        name="volunteer-task-accept"
    ),
    path(
        "volunteer/active-order/",
        VolunteerActiveOrderView.as_view(),
        name="volunteer-active-order",
    ),
    path(
        "volunteer/availability/",
        VolunteerAvailabilityView.as_view(),
        name="volunteer-availability",
    ),
    path(
        "volunteer/dashboard-stats/",
        VolunteerDashboardStatsView.as_view(),
    ),
    path(
        "volunteer/history/",
        VolunteerOrderHistoryView.as_view(),
    ),
    path(
        "volunteer/orders/<int:order_id>/picked-up/",
        VolunteerMarkPickedUpView.as_view(),
        name="volunteer-mark-picked-up",
    ),
    path(
        "volunteer/orders/<int:order_id>/delivered/",
        VolunteerMarkDeliveredView.as_view(),
        name="volunteer-mark-delivered",
    ),
    path(
        "orders/<int:order_id>/cancel/",
        ReceiverCancelOrderView.as_view(),
        name="receiver-cancel-order",
    ),
    path(
        "orders/<int:order_id>/mark-delivered/",
        ReceiverMarkDeliveredView.as_view(),
        name="receiver-mark-delivered",
    ),
    path('orders/rate-volunteer/', ReceiverRateVolunteerView.as_view()),
    # Manual Volunteer Assignment (Admin)
    path('staff/volunteers/', AdminVolunteerListView.as_view()),
    path('staff/orders/<int:order_id>/assign-volunteer/', AdminAssignVolunteerToOrderView.as_view()),
    
    # ✅ RECOMMENDED DONATIONS (Receiver)
    path('me/recommended-items/', ReceiverRecommendationListView.as_view(), name='receiver-recommended-items'),
    path('recommendations/<int:recommendation_id>/request/', RequestRecommendedItemView.as_view(), name='request-recommended-item'),
]