from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LiveCampaignViewSet

router = DefaultRouter()
router.register(r'live', LiveCampaignViewSet, basename='live-campaign')

urlpatterns = [
    path('', include(router.urls)),
]
