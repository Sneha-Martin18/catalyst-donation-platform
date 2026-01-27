from rest_framework import generics
from rest_framework.views import APIView
from .models import Delivery, DeliveryStatusLog
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .serializers import DeliverySerializer, DeliveryRatingSerializer
from .permissions import IsAdmin, IsVolunteerAndAssigned, IsReceiver
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, F
from users.models import User
from rest_framework import generics
from .models import DeliveryLocation,DeliveryRating
from .serializers import DeliveryLocationSerializer
from django.db import transaction
from django.db.models import Avg, Count


ALLOWED_STATUS_TRANSITIONS = {
    'assigned': ['en_route'],
    'en_route': ['picked', 'failed'],
    'picked': ['delivered', 'failed'],
    'delivered': [],
    'failed': [],
}



class AdminDeliveryView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        deliveries = Delivery.objects.all()
        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assignment_type = serializer.validated_data.get('assignment_type')
        delivery_partner = None

        if assignment_type == 'auto':
            volunteers = (
                User.objects
                .filter(role='volunteer', is_active=True)
                .annotate(
                    active_deliveries=Count(
                        'assigned_deliveries',
                        filter=Q(
                            assigned_deliveries__status__in=[
                                'assigned', 'en_route', 'picked'
                            ]
                        )
                    )
                )
                .order_by('active_deliveries')
            )
            delivery_partner = volunteers.first()

        delivery = serializer.save(delivery_partner=delivery_partner)

        return Response(
            DeliverySerializer(delivery).data,
            status=status.HTTP_201_CREATED
        )

class VolunteerDeliveryView(APIView):
    permission_classes = [IsVolunteerAndAssigned]

    def get(self, request):
        deliveries = Delivery.objects.filter(
            delivery_partner=request.user
        )
        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeliveryLocationView(APIView):
    permission_classes = [IsVolunteerAndAssigned]

    def post(self, request):
        serializer = DeliveryLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serializer.save(
            volunteer=request.user
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class DeliveryStatusUpdateView(APIView):

    def get_permissions(self):
        if self.request.user.role == 'admin':
            return [IsAdmin()]
        return [IsVolunteerAndAssigned()]

    def patch(self, request, pk):
        try:
            delivery = Delivery.objects.get(pk=pk)
        except Delivery.DoesNotExist:
            return Response(
                {"error": "Delivery not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {"error": "Status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_status = delivery.status

        # 🔒 Block updates after terminal states
        if current_status in ['delivered', 'failed']:
            return Response(
                {"error": f"Delivery already {current_status}. Status cannot be changed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔒 Prevent duplicate status update
        if new_status == current_status:
            return Response(
                {"error": "Delivery is already in this status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔒 Validate transition
        allowed_next = ALLOWED_STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_next:
            return Response(
                {
                    "error": f"Invalid status transition from '{current_status}' to '{new_status}'"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Atomic update + log
        with transaction.atomic():
            if new_status == 'picked':
                delivery.actual_pickup = timezone.now()
            elif new_status == 'delivered':
                delivery.actual_delivery = timezone.now()
            elif new_status == 'failed':
                delivery.failure_reason = request.data.get('failure_reason', '')

            delivery.status = new_status
            delivery.save()

            DeliveryStatusLog.objects.create(
                delivery=delivery,
                status=new_status,
                updated_by=request.user
            )

        return Response(
            DeliverySerializer(delivery).data,
            status=status.HTTP_200_OK
        )


class DeliveryAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_deliveries = Delivery.objects.count()

        completed = Delivery.objects.filter(
            status='delivered',
            actual_delivery__isnull=False
        )
        failed = Delivery.objects.filter(status='failed')

        on_time = 0
        delayed = 0

        for delivery in completed:
            if delivery.actual_delivery <= delivery.scheduled_pickup + timedelta(hours=24):
                on_time += 1
            else:
                delayed += 1

        volunteer_performance = (
            Delivery.objects
            .filter(status='delivered', delivery_partner__isnull=False)
            .values(
                'delivery_partner__id',
                'delivery_partner__username',
                'delivery_partner__volunteer_code'
            )
            .annotate(completed_count=Count('id'))
            .order_by('-completed_count')
        )

        return Response({
            "total_deliveries": total_deliveries,
            "completed": completed.count(),
            "failed": failed.count(),
            "on_time": on_time,
            "delayed": delayed,
            "volunteer_performance": volunteer_performance
        })
        
class DeliveryTimelineView(APIView):

    def get_permissions(self):
        if self.request.user.role == 'admin':
            return [IsAdmin()]
        return [IsVolunteerAndAssigned()]

    def get(self, request, pk):
        try:
            delivery = Delivery.objects.get(pk=pk)
        except Delivery.DoesNotExist:
            return Response(
                {"error": "Delivery not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        logs = (
            DeliveryStatusLog.objects
            .filter(delivery=delivery)
            .select_related('updated_by')
            .order_by('created_at')
        )

        timeline = [
            {
                "status": log.status,
                "updated_by": log.updated_by.username if log.updated_by else None,
                "timestamp": log.created_at
            }
            for log in logs
        ]

        return Response(
            {
                "delivery_id": delivery.id,
                "current_status": delivery.status,
                "timeline": timeline
            },
            status=status.HTTP_200_OK
        )

class DeliveryRatingCreateView(APIView):
    permission_classes = [IsAuthenticated, IsReceiver]

    def post(self, request):
        serializer = DeliveryRatingSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            delivery = serializer.validated_data['delivery']

            serializer.save(
                receiver=request.user,
                volunteer=delivery.delivery_partner
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class VolunteerRatingsView(APIView):
    permission_classes = [IsAuthenticated, IsVolunteerAndAssigned]

    def get(self, request):
        ratings = DeliveryRating.objects.filter(
            volunteer=request.user
        ).order_by('-created_at')

        avg_rating = ratings.aggregate(
            average=Avg('rating'),
            total=Count('id')
        )

        data = {
            "volunteer_id": request.user.id,
            "volunteer_code": request.user.volunteer_code,
            "average_rating": round(avg_rating['average'], 2) if avg_rating['average'] else None,
            "total_ratings": avg_rating['total'],
            "ratings": [
                {
                    "delivery_id": r.delivery.id,
                    "rating": r.rating,
                    "feedback": r.feedback,
                    "created_at": r.created_at
                }
                for r in ratings
            ]
        }

        return Response(data)