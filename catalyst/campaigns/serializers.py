from rest_framework import serializers
from .models import LiveCampaign

class LiveCampaignSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = LiveCampaign
        fields = [
            'id', 'title', 'description', 'food_type', 
            'target_quantity', 'current_quantity', 'status', 
            'image_url', 'location', 'start_time', 'end_time', 
            'progress_percentage', 'created_at', 'updated_at'
        ]
