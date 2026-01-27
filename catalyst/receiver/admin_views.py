from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import ItemRequest, DonationOrder
from .serializers import ItemRequestSerializer, DonationOrderDetailSerializer
from .permissions import IsAdminOrStaff
from notifications.models import Notification

class AdminItemRequestListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        queryset = ItemRequest.objects.all()

        status_param = request.query_params.get('status')
        category_param = request.query_params.get('category')

        if status_param:
            queryset = queryset.filter(status=status_param)

        if category_param:
            queryset = queryset.filter(category=category_param)

        serializer = ItemRequestSerializer(queryset, many=True)
        return Response(serializer.data)

class AdminItemRequestApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, pk):
        item_request = get_object_or_404(ItemRequest, pk=pk)

        if item_request.status != 'pending':
            return Response(
                {"error": "Only pending requests can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )

        item_request.status = 'approved'
        item_request.save(update_fields=['status'])

        Notification.objects.create(
            user=item_request.receiver,
            title="Item Request Approved",
            message=f"Your item request for '{item_request.item_name}' has been approved.",
            notification_type="success"
        )

        return Response(
            {"message": "Item request approved"},
            status=status.HTTP_200_OK
        )

class AdminItemRequestRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, pk):
        item_request = get_object_or_404(ItemRequest, pk=pk)

        if item_request.status != 'pending':
            return Response(
                {"error": "Only pending requests can be rejected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        item_request.status = 'rejected'
        item_request.save(update_fields=['status'])

        Notification.objects.create(
            user=item_request.receiver,
            title="Item Request Rejected",
            message=f"Your item request for '{item_request.item_name}' has been rejected.",
            notification_type="warning"
        )

        return Response(
            {"message": "Item request rejected"},
            status=status.HTTP_200_OK
        )


class AdminDonationOrderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        queryset = DonationOrder.objects.all()

        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        serializer = DonationOrderDetailSerializer(queryset, many=True)
        return Response(serializer.data)



class AdminDonationOrderApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, pk):
        order = get_object_or_404(DonationOrder, pk=pk)

        if order.status != 'pending':
            return Response(
                {"error": "Only pending orders can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'approved'
        order.save(update_fields=['status'])

        Notification.objects.create(
            user=order.receiver,
            title="Donation Order Approved",
            message=f"Your donation order for '{order.donation.item_name}' has been approved.",
            notification_type="success"
        )

        return Response(
            {"message": "Donation order approved"},
            status=status.HTTP_200_OK
        )


class AdminDonationOrderRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, pk):
        order = get_object_or_404(DonationOrder, pk=pk)

        if order.status != 'pending':
            return Response(
                {"error": "Only pending orders can be rejected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'rejected'
        order.save(update_fields=['status'])

        Notification.objects.create(
            user=order.receiver,
            title="Donation Order Rejected",
            message=f"Your donation order for '{order.donation.item_name}' has been rejected.",
            notification_type="warning"
        )

        return Response(
            {"message": "Donation order rejected"},
            status=status.HTTP_200_OK
        )


class AdminDonationOrderFulfillView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, pk):
        order = get_object_or_404(DonationOrder, pk=pk)

        if order.status != 'approved':
            return Response(
                {"error": "Only approved orders can be completed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Complete order
        order.status = 'completed'
        order.save(update_fields=['status'])

        # Complete donation
        donation = order.donation
        donation.status = 'completed'
        donation.save(update_fields=['status'])

        Notification.objects.create(
            user=order.receiver,
            title="Donation Completed",
            message=f"The donation '{donation.item_name}' has been successfully delivered.",
            notification_type="success"
        )

        return Response(
            {"message": "Donation order completed successfully"},
            status=status.HTTP_200_OK
        )

