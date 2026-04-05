from rest_framework import serializers
from analytics.models import AnalyticsReport, DemandPrediction


class AnalyticsReportSerializer(serializers.ModelSerializer):
    generated_by = serializers.StringRelatedField()

    class Meta:
        model = AnalyticsReport
        fields = "__all__"


class DemandPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandPrediction
        fields = "__all__"
