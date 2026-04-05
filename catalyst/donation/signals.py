from django.db.models.signals import post_save
from django.dispatch import receiver
from donation.models import Donation
from services.matching_engine import run_matching_logic
import threading

@receiver(post_save, sender=Donation)
def trigger_matching_engine(sender, instance, created, **kwargs):
    """
    Triggers the AI matching engine when a donation is marked as VERIFIED.
    This ensures receivers are only recommended items that have been approved by staff.
    """
    if instance.status == 'verified':
        # Check if we already have recommendations for this donation
        # to avoid re-running if status is saved as 'verified' multiple times
        from receiver.models import RecommendedDonation
        if not RecommendedDonation.objects.filter(donation=instance).exists():
            # Run matching logic
            run_matching_logic(instance.id)
