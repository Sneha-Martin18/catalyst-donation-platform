#!/usr/bin/env python
"""Test what the analytics recommendation endpoint returns"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from donation.models import Donation, DonationImage
from receiver.models import ItemRequest
from rest_framework.test import APIRequestFactory, force_authenticate
from analytics.views import ReceiverRecommendationsAPIView

User = get_user_model()

print("=" * 80)
print("📊 TESTING ANALYTICS RECOMMENDATION ENDPOINT")
print("=" * 80)

# Clear old data
print("\n🧹 Cleaning old data...")
Donation.objects.all().delete()
ItemRequest.objects.all().delete()

# Create test data
print("\n📋 Creating test data...")
receiver = User.objects.create_user(
    username='analytics_receiver',
    email='analytics_receiver@test.com',
    password='Test@1234'
)

# Create receiver's request
request_obj = ItemRequest.objects.create(
    receiver=receiver,
    item_name='Formal Shirt',
    category='clothing',
    condition='gently_used',
    quantity=1,
    status='pending'
)

donor = User.objects.create_user(
    username='analytics_donor',
    email='analytics_donor@test.com',
    password='Test@1234'
)

# Create VERIFIED donation (important for analytics endpoint)
donation = Donation.objects.create(
    donor=donor,
    item_name='Formal Shirt',
    category='clothing',
    description='White formal shirt',
    condition='gently_used',
    quantity=1,
    status='verified'  # MUST be 'verified' for analytics
)

# Add images
image1 = DonationImage.objects.create(
    donation=donation,
    image_url='https://example.com/shirt1.jpg'
)
image2 = DonationImage.objects.create(
    donation=donation,
    image_url='https://example.com/shirt2.jpg'
)

print(f"✅ Donation created: {donation.item_name} (Status: {donation.status})")
print(f"✅ Images: {donation.images.count()}")

# Test analytics endpoint
print("\n🌐 Testing analytics recommendation endpoint...")
factory = APIRequestFactory()
request = factory.get('/api/analytics/recommendations/?limit=10')
force_authenticate(request, user=receiver)

view = ReceiverRecommendationsAPIView.as_view()
response = view(request)

print(f"📊 API Status: {response.status_code}")

if response.status_code == 200:
    data = response.data
    print(f"\n📦 Response structure:")
    print(f"   - Message: {data.get('message')}")
    print(f"   - Count: {data.get('count')}")
    print(f"   - Recommendations count: {len(data.get('recommendations', []))}")
    
    recs = data.get('recommendations', [])
    if recs:
        item = recs[0]
        print(f"\n🎁 First Recommendation:")
        print(f"   - Item Name: {item.get('item_name')}")
        print(f"   - Category: {item.get('category')}")
        print(f"   - Condition: {item.get('condition')}")
        print(f"   - Donor Name: {item.get('donor_name')}")
        
        # Check for images
        images = item.get('images', [])
        print(f"\n   📸 Images field: {len(images)} images")
        
        if images:
            print("   ✅ Images are included!")
            for img in images:
                print(f"      - {img.get('image_url')}")
        else:
            print("   ⚠️ No images found")
            print(f"\n   Full item keys: {list(item.keys())}")
    else:
        print("❌ No recommendations returned")
else:
    print(f"❌ API Error: {response.data}")

print("\n" + "=" * 80)
