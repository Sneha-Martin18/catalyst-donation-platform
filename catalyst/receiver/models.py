from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from donation.models import Donation
from django.db.models import Q, UniqueConstraint

User = get_user_model() #this is used to get the custom user model if any


# Create your models here.

REQUEST_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('completed', 'Completed'),
]

#____________M O D E L 1 ____________
#__________Receiver Request Model___________

class ItemRequest(models.Model):
    
    CONDITION_CHOICES = [
        ('new_unused', 'New (Unused)'),
        ('like_new', 'Like New'),
        ('gently_used', 'Gently Used'),
        ('used_functional', 'Used but Functional'),
        ('refurbished', 'Refurbished'),
    ]
    
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='item_requests'
    )
    
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    condition = models.CharField(max_length=100, blank=True, choices = CONDITION_CHOICES, default='gently_used')
    used_duration_months = models.CharField(max_length=100, blank=True, help_text="Duration in months (only if item is used)")
    description = models.TextField(blank=True)
    images_required = models.BooleanField(default=False, help_text="If true, donor must upload images")
    quantity = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=REQUEST_STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request: {self.item_name} by {self.receiver.username} ({self.status})"
    
    
#____________M O D E L 2 ____________
#__________Donation order Model___________

class DonationOrder(models.Model):
    
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='donation_orders'
    )
    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name='donation_orders'
    )
    status = models.CharField(
        max_length=20,
        choices=REQUEST_STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['donation'],
                condition=Q(status__in=['pending', 'approved']),
                name='unique_receiver_donation_order'
            )
        ]
    
    def __str__(self):
        return f"DonationOrder #{self.id} - {self.status}"