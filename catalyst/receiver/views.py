from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAadhaarVerified

from .models import ItemRequest, DonationOrder
from .serializers import (
    ItemRequestSerializer,
    DonationOrderSerializer,
    DonationOrderDetailSerializer
)
from .permissions import IsReceiver


# ==================================================
# Receiver Item Requests (Create + List own requests)
# ==================================================

class ReceiverItemRequestView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsReceiver, IsAadhaarVerified]
    serializer_class = ItemRequestSerializer

    def get_queryset(self):
        # Receiver sees ONLY their own item requests
        return ItemRequest.objects.filter(receiver=self.request.user)

    def perform_create(self, serializer):
        # Attach receiver automatically
        serializer.save(receiver=self.request.user)


# ==================================================
# Receiver Donation Orders (Create + List own orders)
# ==================================================

class ReceiverDonationOrderView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsReceiver, IsAadhaarVerified]

    def get_queryset(self):
        # Receiver sees ONLY their own donation orders
        return DonationOrder.objects.filter(receiver=self.request.user)

    def get_serializer_class(self):
        # GET → detailed serializer (nested donation info)
        if self.request.method == 'GET':
            return DonationOrderDetailSerializer

        # POST → simple create serializer
        return DonationOrderSerializer

    def perform_create(self, serializer):
        # Attach receiver automatically
        serializer.save(receiver=self.request.user)

# ==================================================
# User Item Requests (Get requests from specific user)
# ==================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class UserItemRequestListView(APIView):
    permission_classes = [IsAuthenticated]

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
        
        # Get all requests from this user
        requests_list = ItemRequest.objects.filter(receiver=user).order_by('-created_at')
        serializer = ItemRequestSerializer(requests_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)