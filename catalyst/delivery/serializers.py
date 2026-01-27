from rest_framework import serializers
from .models import (
    Delivery,
    DeliveryStatusLog,
    DeliveryProof,
    DeliveryLocation,
    DeliveryRating,
    
)
from users.models import User

class VolunteerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'volunteer_code']

class DeliverySerializer(serializers.ModelSerializer):
    delivery_partner = VolunteerMiniSerializer(read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'id',
            'assignment_type',
            'pickup_address',
            'drop_address',
            'scheduled_pickup',
            'actual_pickup',
            'actual_delivery',
            'status',
            'failure_reason',
            'created_at',
            'updated_at',
            'donation',
            'request',
            'delivery_partner',
        ]
        read_only_fields = [
            'delivery_partner',
            'status',
            'created_at',
            'updated_at'
        ]

class DeliveryStatusLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = DeliveryStatusLog
        fields = '__all__'
        read_only_fields = ['timestamp']


class DeliveryProofSerializer(serializers.ModelSerializer):

    class Meta:
        model = DeliveryProof
        fields = '__all__'
        read_only_fields = ['uploaded_at']

class DeliveryLocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = DeliveryLocation
        fields = '__all__'
        read_only_fields = ['recorded_at']

class DeliveryRatingSerializer(serializers.ModelSerializer):

    class Meta:
        model = DeliveryRating
        fields = [
            'id',
            'delivery',
            'receiver',
            'volunteer',
            'rating',
            'feedback',
            'created_at'
        ]
        read_only_fields = [
            'receiver',
            'volunteer',
            'created_at'
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5"
            )
        return value

    def validate(self, data):
        request = self.context['request']
        delivery = data.get('delivery')

        # 1️⃣ Delivery must be completed
        if delivery.status != 'delivered':
            raise serializers.ValidationError(
                "You can rate only after delivery is completed"
            )

        # 2️⃣ One rating per delivery (DB already enforces, but we fail early)
        if hasattr(delivery, 'rating'):
            raise serializers.ValidationError(
                "This delivery has already been rated"
            )

        # 3️⃣ Only receiver can rate
        if delivery.request.receiver != request.user:
            raise serializers.ValidationError(
                "Only the receiver can rate this delivery"
            )

        return data
