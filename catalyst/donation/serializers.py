import logging
from rest_framework import serializers
from .models import Donation, DonationImage
from receiver.models import DonationOrder, ItemRequest

logger = logging.getLogger(__name__)

# ==================================================
# Donation Image Serializer
# ==================================================

class DonationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationImage
        fields = ["image_url"]


# ==================================================
# Order info exposed to DONOR (read-only)
# ==================================================

class DonationOrderForDonorSerializer(serializers.ModelSerializer):
    receiver_id = serializers.IntegerField(source="receiver.id", read_only=True)
    receiver_name = serializers.CharField(
        source="receiver.get_full_name",
        read_only=True
    )

    class Meta:
        model = DonationOrder
        fields = [
            "receiver_id",
            "receiver_name",
            "delivery_type",
            "created_at",
        ]


# ==================================================
# Main Donation Serializer
# ==================================================

class DonationSerializer(serializers.ModelSerializer):
    donor = serializers.ReadOnlyField(source="donor.id")
    donor_name = serializers.ReadOnlyField(source="donor.username")
    donor_email = serializers.ReadOnlyField(source="donor.email")
    images = DonationImageSerializer(many=True, read_only=True)

    # 👇 NEW: order info for donor
    order = serializers.SerializerMethodField()
    
    # 👇 NEW: donor address with fallback to profile
    donor_address = serializers.SerializerMethodField()

    item_name = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.CharField(max_length=100, required=True)
    
    # Optional fields to support both items and fundraisers
    quantity = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    condition = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    used_duration_months = serializers.IntegerField(
        min_value=0,
        required=False,
        allow_null=True
    )
    pickup_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # Optional: Link to a request being fulfilled
    fulfilled_request = serializers.PrimaryKeyRelatedField(
        queryset=ItemRequest.objects.all(),
        required=False,
        allow_null=True
    )

    # ✅ CATEGORY WHITELIST
    ALLOWED_CATEGORIES = {
        "books": 100,
        "clothing": 50,
        "electronics": 20,
        "furniture": 20,
        "stationary": 200,
        "accessories": 100,
        "food": 500,
        "medical": 50,
        "toys": 100,
    }

    FUNDRAISER_CATEGORIES = [
        "Organization",
        "Medical & Health",
        "Disaster & Emergency Relief",
        "Hunger & Basic Needs",
        "Children & Women Welfare",
        "Environment & Sustainability"
    ]

    class Meta:
        model = Donation
        fields = "__all__"
        read_only_fields = ["donor", "status", "created_at", "updated_at", "raised_amount"]

    # ==================================================
    # 🔁 ORDER INFO (only when ASSIGNED)
    # ==================================================

    def get_order(self, donation):
        if donation.status != "assigned" or donation.donation_type == 'fundraiser':
            return None

        order = DonationOrder.objects.filter(donation=donation).first()
        if not order:
            return None

        return DonationOrderForDonorSerializer(order).data

    # ==================================================
    # � DONOR ADDRESS (pickup location with fallback)
    # ==================================================

    def get_donor_address(self, donation):
        # First, try to use the donation's pickup_address if available
        if donation.pickup_address:
            return donation.pickup_address
        
        # Fallback to donor's profile address
        try:
            return donation.donor.profile.address or "Address not provided"
        except:
            return "Address not provided"

    # ==================================================
    # �🔤 ITEM NAME VALIDATION
    # ==================================================

    def validate_item_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field is required.")
        return value

    # ==================================================
    # 🏷 CATEGORY VALIDATION
    # ==================================================

    def validate_category(self, value):
        value = value.strip()
        dtype = self.initial_data.get("donation_type", "item")

        if dtype == "fundraiser":
            if value not in self.FUNDRAISER_CATEGORIES:
                # Be a bit more flexible if exact match fails
                matches = [c for c in self.FUNDRAISER_CATEGORIES if c.lower() == value.lower()]
                if matches:
                    return matches[0]
                raise serializers.ValidationError(f"Invalid fundraiser category.")
        else:
            if value.lower() not in self.ALLOWED_CATEGORIES:
                raise serializers.ValidationError("Invalid item category.")
            return value.lower()

        return value

    # ==================================================
    # 🔐 CROSS-FIELD + BUSINESS RULES
    # ==================================================

    def validate(self, attrs):
        dtype = attrs.get("donation_type") or self.initial_data.get("donation_type", "item")
        
        if dtype == "item":
            condition = attrs.get("condition")
            used_duration = attrs.get("used_duration_months")
            category = attrs.get("category")
            quantity = attrs.get("quantity")

            if not condition:
                raise serializers.ValidationError({"condition": "Condition is required for items."})
            
            # 📦 Quantity defaults and limits
            if quantity is None:
                attrs["quantity"] = 1
                quantity = 1
                
            if quantity > 500:
                raise serializers.ValidationError({"quantity": "Quantity exceeds allowed limit."})

            # 📦 Category-based quantity limit
            max_qty = self.ALLOWED_CATEGORIES.get(category)
            if max_qty and quantity > max_qty:
                raise serializers.ValidationError({"quantity": f"Maximum quantity for {category} is {max_qty}."})

            # 🕒 used_duration rules
            if condition == "new_unused" and used_duration and used_duration != 0:
                raise serializers.ValidationError({"used_duration_months": "New items must have used duration as 0."})

            if condition != "new_unused" and used_duration is None:
                raise serializers.ValidationError({"used_duration_months": "Used duration is required for used items."})
        
        elif dtype == "fundraiser":
            # For fundraisers, ensure reasonable defaults for item-specific fields if DRF tries to set them to None
            if "quantity" not in attrs or attrs["quantity"] is None:
                attrs["quantity"] = 1
            
            goal_amount = attrs.get("goal_amount")
            if not goal_amount or float(goal_amount) <= 0:
                raise serializers.ValidationError({"goal_amount": "A valid goal amount is required."})

        # ⛔ No edits after verification / assignment
        if self.instance:
            if self.instance.status in ["verified", "assigned"]:
                raise serializers.ValidationError("Verified or assigned donations cannot be edited.")

        return attrs

    # ==================================================
    # 🔁 SAFE UPDATE
    # ==================================================

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ==================================================
# PUBLIC DONATION SERIALIZER (Hides Donor Info)
# ==================================================

class PublicDonationSerializer(DonationSerializer):
    """
    Used for public listing of available donations.
    Hides sensitive donor information.
    """
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Scrub donor details
        data.pop("donor", None)
        data.pop("donor_email", None)
        
        # Replace donor name with Anonymous
        data["donor_name"] = "Anonymous Donor"
        
        return data
