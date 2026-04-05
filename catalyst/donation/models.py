from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


# ___________ DONATION MODEL ___________

class Donation(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('assigned', 'Assigned'),
        ('delivered', 'Delivered'),
    ]

    CONDITION_CHOICES = [
        ('new_unused', 'New (Unused)'),
        ('like_new', 'Like New'),
        ('gently_used', 'Gently Used'),
        ('used_functional', 'Used but Functional'),
        ('refurbished', 'Refurbished'),
    ]

    TYPE_CHOICES = [
        ('item', 'Physical Item'),
        ('fundraiser', 'Fundraiser'),
    ]

    donor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='donations'
    )

    donation_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='item'
    )

    # Link to the request being fulfilled (optional)
    fulfilled_request = models.ForeignKey(
        'receiver.ItemRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fulfillments'
    )

    item_name = models.CharField(max_length=255) # used as title for fundraisers
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)

    quantity = models.PositiveIntegerField(default=1)

    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        blank=True,
        null=True
    )

    used_duration_months = models.PositiveIntegerField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Fundraiser specific fields
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    raised_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    target_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    pickup_address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.item_name} ({self.status})"




# ___________ DONATION IMAGE MODEL ___________

class DonationImage(models.Model):

    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name='images'
    )

    image_url = models.URLField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.donation.item_name}"
