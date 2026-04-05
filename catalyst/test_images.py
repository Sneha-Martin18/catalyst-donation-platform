#!/usr/bin/env python
"""Test script to verify images are included in recommendation API"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from donation.models import Donation, DonationImage
from receiver.models import RecommendedDonation, ItemRequest
from rest_framework.test import APIRequestFactory, force_authenticate
from receiver.views import ReceiverRecommendationListView

User = get_user_model()

print("=" * 80)
print("🖼️  TESTING IMAGES IN RECOMMENDATION SYSTEM")
print("=" * 80)

# Clear old data
print("\n🧹 Cleaning old data...")
Donation.objects.all().delete()
RecommendedDonation.objects.all().delete()
ItemRequest.objects.all().delete()

# Create test data
print("\n📋 Creating test data...")
receiver = User.objects.create_user(
    username='img_receiver',
    email='img_receiver@test.com',
    password='Test@1234'
)

request_obj = ItemRequest.objects.create(
    receiver=receiver,
    item_name='Formal Shirt',
    category='clothing',
    condition='gently_used',
    quantity=1,
    status='pending'
)

donor = User.objects.create_user(
    username='img_donor',
    email='img_donor@test.com',
    password='Test@1234'
)

print("✅ Test users created")

# Create donation
print("\n🎁 Creating donation with image URLs...")
donation = Donation.objects.create(
    donor=donor,
    item_name='Formal Shirt',
    category='clothing',
    description='White formal shirt',
    condition='like_new',
    quantity=1,
    status='pending'
)

# Manually add DonationImages (simulating uploaded images)
image1 = DonationImage.objects.create(
    donation=donation,
    image_url='https://example.com/shirt1.jpg'
)
image2 = DonationImage.objects.create(
    donation=donation,
    image_url='https://example.com/shirt2.jpg'
)

print(f"✅ Donation created with {donation.images.count()} images")

# Check if recommendation was created
recs = RecommendedDonation.objects.filter(donation=donation)
print(f"\n✅ Recommendations created: {recs.count()}")

# Test API endpoint
print("\n🌐 Testing API endpoint with images...")
factory = APIRequestFactory()
request = factory.get('/api/receiver/me/recommended-items/')
force_authenticate(request, user=receiver)

view = ReceiverRecommendationListView.as_view()
response = view(request)

print(f"📊 API Status: {response.status_code}")
print(f"📊 Response count: {len(response.data) if isinstance(response.data, list) else response.data.get('count', 'N/A')}")

# Check if images are in response
if response.status_code == 200:
    if isinstance(response.data, list):
        items = response.data
    else:
        items = response.data.get('results', [])
    
    if items:
        item = items[0]
        print(f"\n🎁 First Recommendation:")
        print(f"   Item: {item.get('donation_item')}")
        print(f"   Status: {item.get('status')}")
        print(f"   Score: {item.get('similarity_score')}")
        
        # Check for images
        images = item.get('donation_images', [])
        print(f"\n   📸 Images in response: {len(images)}")
        
        if images:
            print("   ✅ SUCCESS! Images are included:")
            for img in images:
                print(f"      - {img.get('image_url')}")
        else:
            print("   ❌ WARNING: No images in donation_images field")
            print(f"\n   Full item response: {item}")
    else:
        print("❌ No recommendations in response")
else:
    print(f"❌ API Error: {response.data}")

print("\n" + "=" * 80)
print("✅ IMAGES TEST COMPLETE!")
print("=" * 80)
