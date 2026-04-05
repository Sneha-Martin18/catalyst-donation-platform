from rest_framework import viewsets, permissions
from .models import LiveCampaign
from .serializers import LiveCampaignSerializer

class LiveCampaignViewSet(viewsets.ModelViewSet):
    queryset = LiveCampaign.objects.all().order_by('-created_at')
    serializer_class = LiveCampaignSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
