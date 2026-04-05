from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import ItemRequest, DonationOrder
from .serializers import ItemRequestSerializer, DonationOrderDetailSerializer, AdminItemRequestSerializer
from .permissions import IsAdminOrStaff
from notifications.models import Notification
from services.email_service import send_order_confirmation_email, send_order_approved_email
from users.serializers import UserSerializer

User = get_user_model()

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

        serializer = AdminItemRequestSerializer(queryset, many=True)
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

        # 📧 Send approval email to receiver
        send_order_approved_email(order)

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

        if order.status not in ['approved', 'picked_up']:
            return Response(
                {"error": "Only approved or picked up orders can be completed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Complete order
        order.status = 'delivered'
        order.save(update_fields=['status'])

        # Complete donation
        donation = order.donation
        donation.status = 'delivered'
        donation.save(update_fields=['status'])

        Notification.objects.create(
            user=order.receiver,
            title="Donation Completed",
            message=f"The donation '{donation.item_name}' has been successfully delivered.",
            notification_type="success"
        )

        if order.volunteer:
            Notification.objects.create(
                user=order.volunteer,
                title="Delivery Completed",
                message=f"You have successfully delivered '{donation.item_name}'.",
                notification_type="success"
            )

        return Response(
            {"message": "Donation order completed successfully"},
            status=status.HTTP_200_OK
        )


from django.db.models import Q

class AdminVolunteerListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        # List all active volunteers who are available
        # Including 'user' role because new registrations default to 'user' but can volunteer
        volunteers = User.objects.filter(
            Q(role='volunteer') | Q(role='user'), 
            is_active=True,
            profile__is_available=True
        ).distinct()
        serializer = UserSerializer(volunteers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAssignVolunteerToOrderView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, order_id):
        order = get_object_or_404(DonationOrder, id=order_id)
        volunteer_id = request.data.get('volunteer_id')

        if not volunteer_id:
            return Response(
                {"error": "Volunteer ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        volunteer = get_object_or_404(User.objects.filter(Q(role='volunteer') | Q(role='user')), id=volunteer_id)

        if order.status != 'assigned':
            return Response(
                {"error": "Can only assign volunteers to orders in 'assigned' status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.volunteer = volunteer
        order.status = 'assigned'  # Keep as assigned so volunteer goes through pickup/delivery flow
        order.save(update_fields=['volunteer', 'status'])

        # 🔔 Notify Receiver
        Notification.objects.create(
            user=order.receiver,
            title="Order Out for Delivery",
            message=f"Good news! Your order for '{order.donation.item_name}' has been assigned to a volunteer and is being prepared for delivery.",
            notification_type="info"
        )

        # 🔔 Notify Volunteer
        Notification.objects.create(
            user=volunteer,
            title="New Delivery Assigned",
            message=f"You have been manually assigned a new delivery: '{order.donation.item_name}'. Check your dashboard for details.",
            notification_type="info"
        )

        return Response(
            {"message": f"Volunteer {volunteer.username} assigned to order successfully."},
            status=status.HTTP_200_OK
        )


class AdminDeleteItemRequestView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def delete(self, request, pk):
        item_request = get_object_or_404(ItemRequest, pk=pk)
        
        # log delete
        item_name = item_request.item_name
        receiver_name = item_request.receiver.username
        
        item_request.delete()
        
        return Response(
            {"message": f"Item request '{item_name}' by {receiver_name} deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

class AdminUpdateItemRequestDeliveryPreferenceView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, pk):
        item_request = get_object_or_404(ItemRequest, pk=pk)
        delivery_pref = request.data.get('delivery_preference')

        if not delivery_pref or delivery_pref not in ['self_pickup', 'volunteer']:
            return Response(
                {"error": "Valid delivery_preference ('self_pickup' or 'volunteer') is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        item_request.delivery_preference = delivery_pref
        item_request.save(update_fields=['delivery_preference'])

        return Response(
            {"message": f"Delivery preference updated to {delivery_pref}"},
            status=status.HTTP_200_OK
        )


