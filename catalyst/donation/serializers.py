import re
from rest_framework import serializers
from .models import Donation, DonationImage


class DonationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationImage
        fields = ["image_url"]


class DonationSerializer(serializers.ModelSerializer):
    donor = serializers.ReadOnlyField(source="donor.id")
    images = DonationImageSerializer(many=True, read_only=True)

    item_name = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(max_length=100, required=True)
    quantity = serializers.IntegerField(min_value=1, required=True)
    condition = serializers.ChoiceField(
        choices=Donation.CONDITION_CHOICES,
        required=True
    )
    used_duration_months = serializers.IntegerField(
        min_value=0,
        required=False,
        allow_null=True
    )

    # ✅ CATEGORY WHITELIST
    ALLOWED_CATEGORIES = {
        "books": 100,
        "clothes": 50,
        "electronics": 5,
        "furniture": 5,
        "stationery": 200,
    }

    class Meta:
        model = Donation
        fields = "__all__"
        read_only_fields = ["donor", "status", "created_at", "updated_at"]

    # 🔤 ITEM NAME VALIDATIONS
    def validate_item_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Item name cannot be empty.")

        # Must contain at least one alphabet
        if not re.search(r"[A-Za-z]", value):
            raise serializers.ValidationError(
                "Item name must contain at least one alphabet."
            )

        # No special characters
        if not re.match(r"^[A-Za-z0-9 ]+$", value):
            raise serializers.ValidationError(
                "Item name cannot contain special characters."
            )

        # No repeated characters like aaaaa, 11111
        if re.search(r"(.)\1{3,}", value):
            raise serializers.ValidationError(
                "Item name contains repeated characters."
            )

        return value

    # 🏷 CATEGORY VALIDATION (trim, lowercase, whitelist)
    def validate_category(self, value):
        value = value.strip().lower()

        if value not in self.ALLOWED_CATEGORIES:
            raise serializers.ValidationError(
                "Invalid category. Please select a valid category."
            )

        return value

    # 🔐 CROSS-FIELD + BUSINESS RULES
    def validate(self, attrs):
        condition = attrs.get("condition")
        used_duration = attrs.get("used_duration_months")
        category = attrs.get("category")
        quantity = attrs.get("quantity")

        # ⛔ No edits after approval or assignment
        if self.instance:
            if self.instance.status == "approved":
                raise serializers.ValidationError(
                    "Approved donations cannot be edited."
                )

            if self.instance.status == "assigned":
                raise serializers.ValidationError(
                    "Assigned donations cannot be edited."
                )

        # 📦 Quantity upper bound (global)
        if quantity > 500:
            raise serializers.ValidationError({
                "quantity": "Quantity exceeds allowed limit."
            })

        # 📦 Category-based quantity limit
        max_qty = self.ALLOWED_CATEGORIES.get(category)
        if max_qty and quantity > max_qty:
            raise serializers.ValidationError({
                "quantity": f"Maximum quantity for {category} is {max_qty}."
            })

        # 🕒 used_duration rules
        # New items → must be exactly 0
        if condition == "new":
            if used_duration != 0:
                raise serializers.ValidationError({
                    "used_duration_months": "New items must have used duration as 0."
                })

        # Used items → duration required
        if condition != "new":
            if used_duration is None:
                raise serializers.ValidationError({
                    "used_duration_months": "Used duration is required for used items."
                })

        # Category-based max usage duration
        if category == "electronics" and used_duration is not None:
            if used_duration > 120:
                raise serializers.ValidationError({
                    "used_duration_months": "Electronics cannot exceed 120 months of usage."
                })

        if category == "books" and used_duration is not None:
            if used_duration > 240:
                raise serializers.ValidationError({
                    "used_duration_months": "Books cannot exceed 240 months of usage."
                })

        return attrs

    # 🔁 SAFE UPDATE
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
