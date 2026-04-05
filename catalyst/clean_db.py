#!/usr/bin/env python
"""Clean database script for testing"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, '.')
django.setup()

from donation.models import Donation
from receiver.models import RecommendedDonation, ItemRequest
from notifications.models import Notification

print("=" * 80)
print("🧹 DATABASE CLEANUP")
print("=" * 80)

# Show what's being deleted
print("\n🔍 EXISTING DATA:")
print(f"  Donations: {Donation.objects.count()}")
print(f"  Recommendations: {RecommendedDonation.objects.count()}")
print(f"  Item Requests: {ItemRequest.objects.count()}")
print(f"  Notifications: {Notification.objects.count()}")

# Delete all
print("\n🗑️  DELETING...")
Donation.objects.all().delete()
print("  ✅ Deleted all donations")

RecommendedDonation.objects.all().delete()
print("  ✅ Deleted all recommendations")

ItemRequest.objects.all().delete()
print("  ✅ Deleted all item requests")

Notification.objects.all().delete()
print("  ✅ Deleted all notifications")

# Verify
print("\n✅ AFTER CLEANUP:")
print(f"  Donations: {Donation.objects.count()}")
print(f"  Recommendations: {RecommendedDonation.objects.count()}")
print(f"  Item Requests: {ItemRequest.objects.count()}")
print(f"  Notifications: {Notification.objects.count()}")

print("\n✅ DATABASE CLEANED! You can now test the recommendation system fresh.")
print("=" * 80)
