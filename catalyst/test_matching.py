#!/usr/bin/env python
"""Test script to verify recommendation system is working"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from donation.models import Donation
from receiver.models import RecommendedDonation, ItemRequest

User = get_user_model()

print("=" * 80)
print("🧪 TESTING RECOMMENDATION SYSTEM")
print("=" * 80)

# Step 1: Create a receiver with a request
print("\n📋 STEP 1: Creating receiver with item request...")
receiver, created = User.objects.get_or_create(
    username='test_receiver_fresh',
    defaults={
        'email': 'receiver_fresh@test.com',
        'first_name': 'Test',
        'last_name': 'Receiver',
        'is_active': True,
        'role': 'receiver'
    }
)
print(f"  ✅ Receiver: {receiver.username} (Email: {receiver.email})")

# Create item request
request_obj, created = ItemRequest.objects.get_or_create(
    receiver=receiver,
    item_name='Formal Shirt',
    defaults={
        'category': 'clothing',
        'condition': 'gently_used',
        'quantity': 1,
        'status': 'pending'
    }
)
print(f"  ✅ Item Request: {request_obj.item_name} (Status: {request_obj.status})")

# Step 2: Create a donor
print("\n👤 STEP 2: Creating donor...")
donor, created = User.objects.get_or_create(
    username='test_donor_fresh',
    defaults={
        'email': 'donor_fresh@test.com',
        'first_name': 'Test',
        'last_name': 'Donor',
        'is_active': True,
        'role': 'donor'
    }
)
print(f"  ✅ Donor: {donor.username} (Email: {donor.email})")

# Step 3: Create donation (SIGNAL SHOULD TRIGGER HERE)
print("\n🎁 STEP 3: Creating donation (signal should trigger matching)...")
donation = Donation.objects.create(
    donor=donor,
    item_name='Formal Shirt',
    category='clothing',
    description='White formal shirt, brand new',
    condition='like_new',
    quantity=1,
    status='pending'  # This triggers the signal!
)
print(f"  ✅ Donation created: {donation.item_name} (ID: {donation.id})")
print(f"  📊 Status: {donation.status}")
print(f"  📊 Condition: {donation.get_condition_display()}")

# Step 4: Check if recommendations were created
print("\n🔍 STEP 4: Checking if recommendations were created...")
recommendations = RecommendedDonation.objects.filter(donation=donation)
print(f"  📊 Recommendations created: {recommendations.count()}")

if recommendations.count() > 0:
    print(f"\n  ✅ SUCCESS! Recommendations exist:")
    for rec in recommendations:
        print(f"    - Receiver: {rec.receiver.username}")
        print(f"      Status: {rec.status}")
        print(f"      Score: {rec.similarity_score:.2f}")
else:
    print(f"\n  ❌ WARNING: No recommendations created!")
    print(f"\n  🔧 Debugging info:")
    print(f"     - Donation status: {donation.status}")
    print(f"     - Donation category: {donation.category}")
    print(f"     - Item request status: {request_obj.status}")
    print(f"     - Item request category: {request_obj.category}")
    print(f"     - Receiver active: {receiver.is_active}")

# Step 5: Test API endpoint
print("\n🌐 STEP 5: Testing API endpoint...")
from rest_framework.test import APIRequestFactory, force_authenticate
from receiver.views import ReceiverRecommendationListView

factory = APIRequestFactory()
request = factory.get('/api/receiver/me/recommended-items/')
force_authenticate(request, user=receiver)

view = ReceiverRecommendationListView.as_view()
response = view(request)

print(f"  📊 API Status Code: {response.status_code}")
print(f"  📊 Recommendations in response: {len(response.data)}")

if response.status_code == 200 and len(response.data) > 0:
    print(f"\n  ✅ SUCCESS! Recommendation visible via API!")
    for item in response.data:
        print(f"    - {item.get('item_name')} (Score: {item.get('similarity_score')})")
else:
    print(f"\n  ❌ Recommendation not visible via API")

print("\n" + "=" * 80)
print("✅ TEST COMPLETE!")
print("=" * 80)
