from rest_framework import serializers
from .models import ItemRequest, DonationOrder, VolunteerRating, RecommendedDonation
from donation.models import Donation
from donation.serializers import DonationImageSerializer



#__________serializer for item requests___________

class ItemRequestSerializer(serializers.ModelSerializer):
    
    item_name = serializers.CharField(required=True)
    category = serializers.CharField(required=True)
    condition = serializers.ChoiceField(choices=ItemRequest.CONDITION_CHOICES, required=True, allow_blank=True)
    used_duration_months = serializers.CharField(required=True, allow_blank=True)
    quantity = serializers.IntegerField(min_value=1, required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    fulfillments = serializers.SerializerMethodField()

    class Meta:
        model = ItemRequest
        fields = [
            'id',
            'item_name',
            'category',
            'condition',
            'used_duration_months',
            'quantity',
            'delivery_preference',
            'description',
            'images_required',
            'status',
            'fulfillments',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

    def get_fulfillments(self, obj):
        # Only show verified donations that are NOT yet ordered
        from donation.serializers import PublicDonationSerializer
        donations = obj.fulfillments.filter(status='verified').exclude(orders__isnull=False)
        return PublicDonationSerializer(donations, many=True).data

    #validation for condition and used_duration_months
    
    def validate(self, data):
        condition = data.get('condition')
        used_duration_months = data.get('used_duration_months', '')
        
        # If item is new, no duration should be provided
        if condition == 'new_unused' and used_duration_months:
            raise serializers.ValidationError("Used duration should be empty for new items.")

        # If item is used (not new), duration must be provided
        if condition != 'new_unused' and not used_duration_months:
            raise serializers.ValidationError("Used duration is required for used items.")
        
        return data
    
    
#__________Admin serializer for item requests (Includes Receiver Info)___________

class AdminItemRequestSerializer(ItemRequestSerializer):
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    receiver_email = serializers.CharField(source='receiver.email', read_only=True)
    receiver_id = serializers.IntegerField(source='receiver.id', read_only=True)

    class Meta(ItemRequestSerializer.Meta):
        fields = ItemRequestSerializer.Meta.fields + ['receiver_name', 'receiver_email', 'receiver_id']


#__________serializer for available donation orders___________

class DonationOrderSerializer(serializers.ModelSerializer):
    donation = serializers.PrimaryKeyRelatedField(
        queryset=Donation.objects.filter(status="verified")
    )

    class Meta:
        model = DonationOrder
        fields = [
            "id",
            "donation",
            "drop_address",
            "delivery_type",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def validate_donation(self, donation):
        request = self.context["request"]

        if DonationOrder.objects.filter(
            donation=donation,
            receiver=request.user
        ).exclude(status="canceled").exists():
            raise serializers.ValidationError(
                "You have an active or completed order for this donation."
            )

        # 🔒 Ensure donation is still available
        if donation.status != "verified":
            raise serializers.ValidationError(
                "This donation is no longer available."
            )

        return donation


#__________Basic serializer for Donation (used in DonationOrder)___________        
class BasicDonationSerializer(serializers.ModelSerializer):
    images = DonationImageSerializer(many=True, read_only=True)
    donor_name = serializers.CharField(source='donor.username', read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'item_name',
            'category',
            'condition',
            'used_duration_months',
            'quantity',
            'description',
            'status',
            'pickup_address',
            'images',
            'donor_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

#__________detailed serializer for DonationOrder (includes basic donation info)___________       
class DonationOrderDetailSerializer(serializers.ModelSerializer):
    donation = BasicDonationSerializer(read_only=True)

    volunteer_name = serializers.SerializerMethodField()
    volunteer_phone = serializers.SerializerMethodField()
    receiver_name = serializers.CharField(source="receiver.username", read_only=True)
    has_rated = serializers.SerializerMethodField()

    def get_volunteer_name(self, obj):
        if not obj.volunteer:
            return None
        return obj.volunteer.first_name or obj.volunteer.username

    def get_volunteer_phone(self, obj):
        if obj.volunteer and hasattr(obj.volunteer, 'profile'):
            return obj.volunteer.profile.phone_number
        return None

    def get_has_rated(self, obj):
        return hasattr(obj, 'rating')

    class Meta:
        model = DonationOrder
        fields = [
            'id',
            'donation',
            'volunteer_name',
            'volunteer_phone',
            'receiver_name',
            'delivery_type',
            'status',
            'has_rated',
            'created_at',
            'updated_at'
        ]

class VolunteerActiveOrderSerializer(serializers.ModelSerializer):
    donation_item = serializers.CharField(source="donation.item_name", read_only=True)
    donation_category = serializers.CharField(source="donation.category", read_only=True)
    donation_quantity = serializers.IntegerField(source="donation.quantity", read_only=True)
    donation_condition = serializers.CharField(source="donation.condition", read_only=True)
    receiver_name = serializers.CharField(source="receiver.username", read_only=True)
    # Pickup should be donation.pickup_address (if set) OR donor profile address
    pickup_address = serializers.SerializerMethodField()
    drop_address = serializers.SerializerMethodField()

    class Meta:
        model = DonationOrder
        fields = [
            "id",
            "donation_item",
            "donation_category",
            "donation_quantity",
            "donation_condition",
            "receiver_name",
            "pickup_address",
            "drop_address",
            "status",
            "created_at",
        ]

    def get_pickup_address(self, obj):
        # Prefer specific donation pickup address, fallback to donor profile address
        if obj.donation.pickup_address:
            return obj.donation.pickup_address
        
        # Safe access to profile
        profile = getattr(obj.donation.donor, 'profile', None)
        return profile.address if profile else "Address not provided"

    def get_drop_address(self, obj):
        # Prefer specific order drop address, fallback to receiver profile address
        if obj.drop_address:
            return obj.drop_address
            
        # Safe access to profile
        profile = getattr(obj.receiver, 'profile', None)
        return profile.address if profile else "Address not provided"


class VolunteerRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerRating
        fields = ["id", "order", "rating", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        order = data.get("order")
        user = self.context["request"].user

        # 🔒 Ensure only the receiver can rate
        if order.receiver != user:
            raise serializers.ValidationError("You can only rate orders that you placed.")

        # 🔒 Ensure order is delivered
        if order.status != "delivered":
            raise serializers.ValidationError("You can only rate delivered orders.")

        # 🔒 Ensure order has a volunteer
        if not order.volunteer:
            raise serializers.ValidationError("This order does not have a volunteer assigned.")

        # 🔒 Ensure not already rated
        if VolunteerRating.objects.filter(order=order).exists():
            raise serializers.ValidationError("You have already rated this delivery.")

        return data


# ==================================================
# SERIALIZER FOR RECOMMENDED DONATIONS
# ==================================================

class RecommendedDonationSerializer(serializers.ModelSerializer):
    donation_item = serializers.CharField(source='donation.item_name', read_only=True)
    item_category = serializers.CharField(source='donation.category', read_only=True)
    donation_id = serializers.IntegerField(source='donation.id', read_only=True)
    item_description = serializers.CharField(source='donation.description', read_only=True)
    item_condition = serializers.CharField(source='donation.condition', read_only=True)
    donor_name = serializers.CharField(source='donation.donor.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    donation_images = serializers.SerializerMethodField()

    class Meta:
        model = RecommendedDonation
        fields = [
            'id',
            'donation_id',
            'donation_item',
            'item_category',
            'item_description',
            'item_condition',
            'donor_name',
            'receiver_name',
            'similarity_score',
            'status',
            'donation_images',
            'created_at'
        ]
        read_only_fields = ['similarity_score', 'created_at']

    def get_donation_images(self, obj):
        """Return list of image URLs from the donation"""
        images = obj.donation.images.all()
        return DonationImageSerializer(images, many=True).data
