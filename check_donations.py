#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
django.setup()

from donation.models import Donation
from receiver.models import DonationOrder

# Check donations
print("=" * 60)
print("DONATIONS IN DATABASE")
print("=" * 60)
donations = Donation.objects.all().order_by('-id')
print(f"Total donations: {donations.count()}\n")

for d in donations[:15]:
    print(f"ID: {d.id}, Status: {d.status}, Item: {d.item_name}")

# Check if donation 43 exists
print("\n" + "=" * 60)
print("CHECKING DONATION ID 43")
print("=" * 60)
try:
    d43 = Donation.objects.get(id=43)
    print(f"✅ Found: ID={d43.id}, Status={d43.status}, Item={d43.item_name}")
except Donation.DoesNotExist:
    print("❌ Donation with ID 43 does NOT exist")

# Check available donations (verified status)
print("\n" + "=" * 60)
print("VERIFIED DONATIONS (AVAILABLE FOR ORDERING)")
print("=" * 60)
verified = Donation.objects.filter(status='verified')
print(f"Total verified: {verified.count()}\n")
for d in verified[:10]:
    print(f"ID: {d.id}, Item: {d.item_name}, Status: {d.status}")

# Check orders
print("\n" + "=" * 60)
print("RECENT ORDERS")
print("=" * 60)
orders = DonationOrder.objects.all().order_by('-created_at')[:10]
print(f"Total orders: {DonationOrder.objects.count()}\n")
for o in orders:
    print(f"Order ID: {o.id}, Donation: {o.donation.id}, Status: {o.status}")
