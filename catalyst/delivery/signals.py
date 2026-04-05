from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Delivery
from .utils.geocoder import geocoder

@receiver(pre_save, sender=Delivery)
def geocode_delivery_addresses(sender, instance, **kwargs):
    """
    Auto-populates coordinates for pickup and dropoff if they are empty.
    """
    # Geocode Pickup
    if instance.pickup_address and (not instance.pickup_latitude or not instance.pickup_longitude):
        lat, lng = geocoder.geocode_address(instance.pickup_address)
        if lat and lng:
            instance.pickup_latitude = lat
            instance.pickup_longitude = lng

    # Geocode Drop-off
    if instance.drop_address and (not instance.drop_latitude or not instance.drop_longitude):
        lat, lng = geocoder.geocode_address(instance.drop_address)
        if lat and lng:
            instance.drop_latitude = lat
            instance.drop_longitude = lng
