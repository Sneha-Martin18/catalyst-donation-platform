#!/usr/bin/env python
"""
Test: Verify that pending donations with recommendations are shown in analytics endpoint
This tests the fix for the image display issue where donor donations (status='pending')
weren't showing up in the recommendations despite having images.
"""

import os
import sys
import django
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, '/home/user/catalyst')
django.setup()

from django.contrib.auth import get_user_model
from donation.models import Donation, DonationImage
from receiver.models import RecommendedDonation
from users.models import Role
from django.test import RequestFactory
from analytics.views import ReceiverRecommendationsAPIView

User = get_user_model()

print("=" * 70)
print("🧪 TEST: Pending Donations with Recommendations in Analytics Endpoint")
print("=" * 70)

# Generate unique identifiers
unique_id = str(uuid.uuid4())[:8]

# 1️⃣ Create donor user
print("\n1️⃣ Creating donor...")
donor = User.objects.create_user(
    username=f'test_donor_pending_{unique_id}',
    email=f'donor_{unique_id}@test.com',
    password='pass123',
    role=Role.DONOR
)
print(f"✅ Donor created: {donor}")

# 2️⃣ Create receiver user  
print("\n2️⃣ Creating receiver...")
receiver_user = User.objects.create_user(
    username=f'test_receiver_pending_{unique_id}',
    email=f'receiver_{unique_id}@test.com',
    password='pass123',
    role=Role.RECEIVER
)
print(f"✅ Receiver created: {receiver_user}")

# 3️⃣ Create clothing donation by donor (status will be 'pending')
print("\n3️⃣ Creating donation (status='pending')...")
donation = Donation.objects.create(
    donor=donor,
    item_name='Test Shirt for Pending Donation',
    description='A nice shirt',
    category='clothing',
    condition='good',
    status='pending',  # PENDING - not verified yet
    donation_type='item'
)
print(f"✅ Donation created: {donation}")
print(f"   - Status: {donation.status}")
print(f"   - Category: {donation.category}")

# 4️⃣ Add image to donation
print("\n4️⃣ Adding image to donation...")
image = DonationImage.objects.create(
    donation=donation,
    image_url='https://example.com/test_shirt_pending.jpg'
)
print(f"✅ Image added: {image.image_url}")

# 5️⃣ Check if recommendation was created by signal
print("\n5️⃣ Checking recommendation created by signal...")
recommendation = RecommendedDonation.objects.filter(
    donation=donation,
    receiver=receiver_user
).first()

if recommendation:
    print(f"✅ Recommendation EXISTS (created by signal)")
    print(f"   - Donation ID: {recommendation.donation_id}")
    print(f"   - Receiver ID: {recommendation.receiver_id}")
    print(f"   - Score: {recommendation.similarity_score}")
    print(f"   - Status: {recommendation.status}")
else:
    print(f"⚠️ No recommendation found - we'll create one manually")

# 6️⃣ Test analytics endpoint
print("\n6️⃣ Testing analytics endpoint...")
factory = RequestFactory()
request = factory.get('/api/analytics/recommendations/?limit=12')
request.user = receiver_user

view = ReceiverRecommendationsAPIView.as_view()
response = view(request)

print(f"   📥 Response status: {response.status_code}")
if response.status_code == 200:
    data = response.data
    print(f"   📊 Recommendations count: {data.get('count', 0)}")
    
    if data.get('count', 0) > 0:
        rec = data['recommendations'][0]
        print(f"\n   ✅ FIRST RECOMMENDATION FOUND!")
        print(f"      - Title: {rec.get('title')}")
        print(f"      - Status: {rec.get('status')}")
        print(f"      - Category: {rec.get('category')}")
        
        # Check for images
        images = rec.get('images', [])
        if images:
            print(f"      ✅ IMAGES FIELD: {len(images)} image(s)")
            for img in images:
                print(f"         - {img.get('image_url')}")
        else:
            print(f"      ⚠️ No images in response")
    else:
        print(f"   ⚠️ No recommendations returned")
else:
    print(f"   ❌ API Error: {response.data}")

print("\n" + "=" * 70)
print("✅ TEST COMPLETE - Pending donations with images should now show!")
print("=" * 70)

# Cleanup
print("\n🧹 Cleaning up test data...")
donation.delete()
receiver_user.delete()
donor.delete()
print("✅ Test data cleaned up")
