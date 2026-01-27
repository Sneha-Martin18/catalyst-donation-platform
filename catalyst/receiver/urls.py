from django.urls import path
from .views import (
    ReceiverItemRequestView,
    ReceiverDonationOrderView,
    UserItemRequestListView,
)
from .admin_views import ( AdminItemRequestListView, 
                          AdminItemRequestApproveView, 
                          AdminItemRequestRejectView, 
                          AdminDonationOrderListView, 
                          AdminDonationOrderApproveView, 
                          AdminDonationOrderRejectView, 
                          AdminDonationOrderFulfillView,)

urlpatterns = [
    path('requests/', ReceiverItemRequestView.as_view()),
    path('orders/', ReceiverDonationOrderView.as_view()),
    path('user/<int:user_id>/requests/', UserItemRequestListView.as_view(), name='user-requests'),
    path('staff/item-requests/', AdminItemRequestListView.as_view()),
    path('staff/item-requests/<int:pk>/approve/',AdminItemRequestApproveView.as_view()),
    path('staff/item-requests/<int:pk>/reject/',AdminItemRequestRejectView.as_view()),
    path('staff/donation-orders/',AdminDonationOrderListView.as_view()),
    path('staff/donation-orders/<int:pk>/approve/',AdminDonationOrderApproveView.as_view()),
    path('staff/donation-orders/<int:pk>/reject/',AdminDonationOrderRejectView.as_view()),
    path('staff/donation-orders/<int:pk>/fulfill/',AdminDonationOrderFulfillView.as_view()),
]  

