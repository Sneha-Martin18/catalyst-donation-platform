from rest_framework import serializers
from analytics.models import AnalyticsReport


class AnalyticsReportSerializer(serializers.ModelSerializer):
    generated_by = serializers.StringRelatedField()

    class Meta:
        model = AnalyticsReport
        fields = "__all__"
