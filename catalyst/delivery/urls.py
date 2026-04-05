from django.urls import path
from .views import (
    AdminDeliveryView,
    DeliveryTimelineView,
    VolunteerDeliveryView,
    DeliveryLocationView,
    DeliveryStatusUpdateView,
    DeliveryAnalyticsView,
    DeliveryRatingCreateView,
    VolunteerRatingsView,
    OptimizedRouteView
)

urlpatterns = [
    # Admin
    path('admin/deliveries/', AdminDeliveryView.as_view(), name='admin-deliveries'),

    # Volunteer
    path('volunteer/deliveries/', VolunteerDeliveryView.as_view(), name='volunteer-deliveries'),
    path('volunteer/optimized-route/', OptimizedRouteView.as_view(), name='volunteer-optimized-route'),

    # GPS tracking
    path('deliveries/location/', DeliveryLocationView.as_view(), name='delivery-location'),
    # Update delivery status
    path('deliveries/<int:pk>/status/', DeliveryStatusUpdateView.as_view(), name='delivery-status-update'),
    # Admin analytics
    path('admin/analytics/', DeliveryAnalyticsView.as_view(), name='delivery-analytics'),
    # Delivery timeline
    path('deliveries/<int:pk>/timeline/', DeliveryTimelineView.as_view(), name='delivery-timeline'),
    # Receiver rates delivery
    path('receiver/rate-delivery/', DeliveryRatingCreateView.as_view(), name='rate-delivery'),
    #
    path('volunteer/ratings/', VolunteerRatingsView.as_view(), name='volunteer-ratings'),
]
