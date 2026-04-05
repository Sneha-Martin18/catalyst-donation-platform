from django.db import models
from django.conf import settings
from donation.models import Donation
from receiver.models import ItemRequest

User = settings.AUTH_USER_MODEL


# ==============================
# MAIN DELIVERY MODEL
# ==============================
class Delivery(models.Model):

    ASSIGNMENT_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('auto', 'Automatic'),
    ]

    DELIVERY_STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('en_route', 'En Route'),
        ('picked', 'Picked Up'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]

    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )

    request = models.ForeignKey(
        ItemRequest,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )

    # volunteer = delivery partner
    delivery_partner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_deliveries'
    )

    assignment_type = models.CharField(
        max_length=10,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='manual'
    )

    pickup_address = models.TextField()
    pickup_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    drop_address = models.TextField()
    drop_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    drop_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    scheduled_pickup = models.DateTimeField()
    actual_pickup = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=DELIVERY_STATUS_CHOICES,
        default='assigned'
    )

    # used only if status = failed
    failure_reason = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery #{self.id} - {self.status}"


# ==============================
# DELIVERY STATUS HISTORY (AUDIT)
# ==============================
class DeliveryStatusLog(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name='status_logs'
    )
    status = models.CharField(max_length=20)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delivery {self.delivery.id} → {self.status}"


# ==============================
# PROOF OF DELIVERY
# ==============================
class DeliveryProof(models.Model):
    delivery = models.OneToOneField(
        Delivery,
        on_delete=models.CASCADE,
        related_name='proof'
    )
    image = models.ImageField(upload_to='delivery_proofs/')
    remarks = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proof for Delivery {self.delivery.id}"


# ==============================
# GPS LOCATION TRACKING
# ==============================
class DeliveryLocation(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name='locations'
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Location for Delivery {self.delivery.id}"

class DeliveryRating(models.Model):
    delivery = models.OneToOneField(
        Delivery,
        on_delete=models.CASCADE,
        related_name='rating'
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='given_ratings'
    )

    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_ratings'
    )

    rating = models.PositiveSmallIntegerField(
        help_text="Rating from 1 to 5"
    )

    feedback = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating {self.rating} for Delivery #{self.delivery.id}"
