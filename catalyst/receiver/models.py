from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from donation.models import Donation
from django.db.models import Q

User = get_user_model()  # custom user model support


# ==================================================
# ITEM REQUEST STATUS (Receiver → Request)
# ==================================================

REQUEST_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("completed", "Completed"),
]


# ==================================================
# MODEL 1: Receiver Item Request
# ==================================================

class ItemRequest(models.Model):

    CONDITION_CHOICES = [
        ("new_unused", "New (Unused)"),
        ("like_new", "Like New"),
        ("gently_used", "Gently Used"),
        ("used_functional", "Used but Functional"),
        ("refurbished", "Refurbished"),
    ]

    DELIVERY_PREF_CHOICES = [
        ("self_pickup", "Self Pickup"),
        ("volunteer", "Volunteer Delivery"),
    ]

    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="item_requests"
    )

    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    condition = models.CharField(
        max_length=100,
        choices=CONDITION_CHOICES,
        default="gently_used",
        blank=True
    )
    delivery_preference = models.CharField(
        max_length=20,
        choices=DELIVERY_PREF_CHOICES,
        default="volunteer"
    )
    used_duration_months = models.CharField(
        max_length=100,
        blank=True,
        help_text="Duration in months (only if item is used)"
    )
    description = models.TextField(blank=True)
    images_required = models.BooleanField(
        default=False,
        help_text="If true, donor must upload images"
    )
    quantity = models.PositiveIntegerField()

    status = models.CharField(
        max_length=20,
        choices=REQUEST_STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request: {self.item_name} by {self.receiver.username} ({self.status})"


# ==================================================
# DONATION ORDER STATUS (Donation → Delivery)
# ==================================================

DONATION_ORDER_STATUS_CHOICES = [
    ("assigned", "Assigned"),      # receiver ordered
    ("picked_up", "Picked Up"),    # volunteer auto-assigned
    ("delivered", "Delivered"),    # completed
    ("canceled", "Canceled"),     # canceled by receiver
]


# ==================================================
# MODEL 2: Donation Order
# ==================================================

class DonationOrder(models.Model):

    DELIVERY_TYPE_CHOICES = [
        ('self_pickup', 'Self Pickup'),
        ('volunteer', 'Volunteer Delivery'),
    ]

    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="receiver_orders"
    )

    # ✅ NEW: Volunteer auto-assignment support
    volunteer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="volunteer_orders"
    )
    
    # ✅ NEW: Custom drop address for this specific order
    drop_address = models.TextField(blank=True, null=True)

    delivery_type = models.CharField(
        max_length=20,
        choices=DELIVERY_TYPE_CHOICES,
        default='volunteer'
    )

    status = models.CharField(
        max_length=20,
        choices=DONATION_ORDER_STATUS_CHOICES,
        default="assigned"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            # ✅ One active order per donation
            models.UniqueConstraint(
                fields=["donation"],
                condition=Q(status__in=["assigned", "picked_up"]),
                name="unique_active_donation_order"
            )
        ]

    def __str__(self):
        return f"DonationOrder #{self.id} ({self.status})"


# ==================================================
# MODEL 3: Volunteer Rating
# ==================================================

class VolunteerRating(models.Model):
    order = models.OneToOneField(
        DonationOrder,
        on_delete=models.CASCADE,
        related_name="rating"
    )
    volunteer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ratings_received"
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ratings_given"
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text="Rating from 1 to 5"
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating for {self.volunteer.username}: {self.rating}"


# ==================================================
# MODEL 4: Recommended Donation
# ==================================================

class RecommendedDonation(models.Model):

    STATUS_CHOICES = [
        ('suggested', 'Suggested'),
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    # Wait, I need to make sure 'donation.Donation' is imported properly or referenced correctly.
    # It is referenced as 'donation.Donation' which is fine since 'donation' app is likely named 'donation'.
    # Actually, line 4 imports Donation model: `from donation.models import Donation`.
    # So I can just use `Donation` directly or use the string reference. 
    # Using 'donation.Donation' is safer for circular imports, but if it is already imported, `Donation` is fine.
    # The existing code uses `Donation` in `DonationOrder`.
    # I'll use `Donation` directly since it's imported.

    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name='recommendations'
    )

    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recommended_donations'
    )

    similarity_score = models.FloatField(default=0.0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='suggested'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('donation', 'receiver')
        ordering = ['-similarity_score', '-created_at']

    def __str__(self):
        return f"Recommendation: {self.donation.item_name} -> {self.receiver.username} ({self.status})"
