from rest_framework import serializers
from .models import ItemRequest, DonationOrder
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
    
    class Meta:
        model = ItemRequest
        fields = [
            'id',
            'item_name',
            'category',
            'condition',
            'used_duration_months',
            'quantity',
            'description',
            'images_required',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

    #validation for condition and used_duration_months
    
    def validate(self, data):
        condition = data.get('condition')
        used_duration_months = data.get('used_duration_months')
        
        if condition == 'new' and used_duration_months:
            raise serializers.ValidationError("Used duration should be empty for new items.")

        if condition == 'used' and used_duration_months:
            raise serializers.ValidationError("Used duration is required for used items.")
        
        return data
    
    

#__________serializer for available donation orders___________

class DonationOrderSerializer(serializers.ModelSerializer):
    
    donation = serializers.ReadOnlyField(source='donation.id')
    class Meta:
        model = DonationOrder
        fields = [
            'id',
            'donation',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']
        
        

#__________Basic serializer for Donation (used in DonationOrder)___________        
class BasicDonationSerializer(serializers.ModelSerializer):
    images = DonationImageSerializer(many=True, read_only=True)

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
            'images',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

#__________detailed serializer for DonationOrder (includes basic donation info)___________       
class DonationOrderDetailSerializer(serializers.ModelSerializer):
    donation = BasicDonationSerializer(read_only=True)

    class Meta:
        model = DonationOrder
        fields = [
            'id',
            'donation',
            'status',
            'created_at',
            'updated_at'
        ]
