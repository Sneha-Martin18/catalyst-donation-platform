"""
Comprehensive test script for the Donation Recommendation System using pytest.

Tests the complete workflow:
1. Create donation item → triggers automatic recommendations
2. Receiver views recommendations
3. Receiver requests an item (suggests → requested)
4. Donor views requests for their donation
5. Donor approves a request (requested → accepted, donation → assigned)
6. Donor rejects a request (requested → rejected)
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from donation.models import Donation
from receiver.models import ItemRequest, RecommendedDonation, DonationOrder
from notifications.models import Notification

User = get_user_model()


@pytest.fixture
def setup_test_environment():
    """Fixture to create test users and item requests."""
    # Create donor
    donor, _ = User.objects.get_or_create(
        username='donor_test',
        defaults={
            'email': 'donor@test.com',
            'password': 'testpass123',
            'is_active': True
        }
    )
    if hasattr(donor, 'profile'):
        donor.profile.is_verified = True
        donor.profile.save()
    
    # Create receivers
    receivers = []
    for i in range(3):
        receiver, _ = User.objects.get_or_create(
            username=f'receiver_{i}',
            defaults={
                'email': f'receiver{i}@test.com',
                'password': 'testpass123',
                'is_active': True,
                'role': 'receiver'
            }
        )
        if hasattr(receiver, 'profile'):
            receiver.profile.is_verified = True
            receiver.profile.save()
        receivers.append(receiver)
    
    # Create item requests from receivers
    item_requests = []
    for i, receiver in enumerate(receivers):
        req, _ = ItemRequest.objects.get_or_create(
            receiver=receiver,
            item_name=f'Test Item {i}',
            defaults={
                'category': 'Electronics' if i < 2 else 'Clothing',
                'condition': 'gently_used',
                'quantity': 1,
                'status': 'pending'
            }
        )
        item_requests.append(req)
    
    return {
        'donor': donor,
        'receivers': receivers,
        'item_requests': item_requests,
        'client': APIClient()
    }


@pytest.mark.django_db
def test_1_create_donation_auto_generates_recommendations(setup_test_environment):
    """Test 1: Create Donation → Auto-Generate Recommendations"""
    env = setup_test_environment
    donor = env['donor']
    client = env['client']
    
    print("\n" + "=" * 80)
    print("DONATION RECOMMENDATION SYSTEM - COMPREHENSIVE TEST")
    print("=" * 80)
    print("\n" + "=" * 80)
    print("TEST 1: Create Donation → Auto-Generate Recommendations")
    print("=" * 80)
    
    client.force_authenticate(user=donor)
    
    donation_data = {
        'item_name': 'Test Donation Item',
        'category': 'Electronics',
        'description': 'A test donation item',
        'condition': 'new',
        'quantity': 1,
        'pickup_address': '123 Main St',
    }
    
    response = client.post('/api/donation/', donation_data)
    print(f"POST /api/donation/ → Status: {response.status_code}")
    
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
    
    donation = Donation.objects.get(id=response.data['id'])
    print(f"✓ Created Donation: {donation.item_name} (ID: {donation.id})")
    print(f"  Status: {donation.status}")
    
    # Check if recommendations were created
    recommendations = RecommendedDonation.objects.filter(donation=donation)
    print(f"\n✓ Auto-generated {recommendations.count()} recommendations:")
    
    for rec in recommendations:
        print(f"  - {rec.receiver.username}: Score {rec.similarity_score:.2f} (Status: {rec.status})")
    
    assert recommendations.count() > 0, "No recommendations created"
    print("✅ TEST 1 PASSED: Recommendations auto-created on donation creation")
    
    return donation


@pytest.mark.django_db
def test_2_receiver_views_recommended_items(setup_test_environment):
    """Test 2: Receiver Views Recommended Items"""
    env = setup_test_environment
    donor = env['donor']
    receivers = env['receivers']
    client = env['client']
    
    print("\n" + "=" * 80)
    print("TEST 2: Receiver Views Recommended Items")
    print("=" * 80)
    
    # Create a donation first
    client.force_authenticate(user=donor)
    donation_data = {
        'item_name': 'Test Item for Recommendations',
        'category': 'Electronics',
        'description': 'Test',
        'condition': 'new',
        'quantity': 1,
        'pickup_address': '123 Main St',
    }
    response = client.post('/api/donation/', donation_data)
    assert response.status_code == 201
    
    # Receiver views recommendations
    receiver = receivers[0]
    client.force_authenticate(user=receiver)
    response = client.get('/api/receiver/me/recommended-items/', format='json')
    print(f"GET /api/receiver/me/recommended-items/ → Status: {response.status_code}")
    
    assert response.status_code == 200
    print("✅ TEST 2 PASSED: Receiver can view recommendations")


@pytest.mark.django_db
def test_3_receiver_requests_item(setup_test_environment):
    """Test 3: Receiver Requests Item (suggested → requested)"""
    env = setup_test_environment
    donor = env['donor']
    receivers = env['receivers']
    client = env['client']
    
    print("\n" + "=" * 80)
    print("TEST 3: Receiver Requests Item")
    print("=" * 80)
    
    # Create a donation
    client.force_authenticate(user=donor)
    donation_data = {
        'item_name': 'Item for Request Test',
        'category': 'Electronics',
        'description': 'Test',
        'condition': 'new',
        'quantity': 1,
        'pickup_address': '123 Main St',
    }
    response = client.post('/api/donation/', donation_data)
    assert response.status_code == 201
    donation = Donation.objects.get(id=response.data['id'])
    
    # Get a recommendation
    rec = RecommendedDonation.objects.filter(
        donation=donation,
        status='suggested'
    ).first()
    
    assert rec is not None, "No suggested recommendation found"
    
    # Receiver requests it
    client.force_authenticate(user=rec.receiver)
    response = client.post(f'/api/receiver/recommendations/{rec.id}/request/', format='json')
    print(f"POST /api/receiver/recommendations/{rec.id}/request/ → Status: {response.status_code}")
    
    assert response.status_code == 200
    rec.refresh_from_db()
    assert rec.status == 'requested'
    print(f"✓ Recommendation status updated: {rec.status}")
    print("✅ TEST 3 PASSED: Receiver successfully requested item")


@pytest.mark.django_db
def test_4_donor_views_requests(setup_test_environment):
    """Test 4: Donor Views Requests for Donation"""
    env = setup_test_environment
    donor = env['donor']
    client = env['client']
    
    print("\n" + "=" * 80)
    print("TEST 4: Donor Views Requests for Donation")
    print("=" * 80)
    
    # Create a donation
    client.force_authenticate(user=donor)
    donation_data = {
        'item_name': 'Donation for Requests View',
        'category': 'Electronics',
        'description': 'Test',
        'condition': 'new',
        'quantity': 1,
        'pickup_address': '123 Main St',
    }
    response = client.post('/api/donation/', donation_data)
    assert response.status_code == 201
    donation = Donation.objects.get(id=response.data['id'])
    
    # Donor views requests
    response = client.get(f'/api/donation/{donation.id}/requests/', format='json')
    print(f"GET /api/donation/{donation.id}/requests/ → Status: {response.status_code}")
    
    assert response.status_code == 200
    print("✅ TEST 4 PASSED: Donor can view requests for donation")


@pytest.mark.django_db
def test_5_donor_approves_request(setup_test_environment):
    """Test 5: Donor Approves a Request"""
    env = setup_test_environment
    donor = env['donor']
    receivers = env['receivers']
    client = env['client']
    
    print("\n" + "=" * 80)
    print("TEST 5: Donor Approves a Request")
    print("=" * 80)
    
    # Create donation, request, then approve
    client.force_authenticate(user=donor)
    donation_data = {
        'item_name': 'Item for Approval Test',
        'category': 'Electronics',
        'description': 'Test',
        'condition': 'new',
        'quantity': 1,
        'pickup_address': '123 Main St',
    }
    response = client.post('/api/donation/', donation_data)
    assert response.status_code == 201
    donation = Donation.objects.get(id=response.data['id'])
    
    # Find a recommendation and have receiver request it
    rec = RecommendedDonation.objects.filter(
        donation=donation,
        status='suggested'
    ).first()
    
    assert rec is not None
    client.force_authenticate(user=rec.receiver)
    response = client.post(f'/api/receiver/recommendations/{rec.id}/request/', format='json')
    assert response.status_code == 200
    
    # Donor approves
    client.force_authenticate(user=donor)
    response = client.post(f'/api/donation/recommendations/{rec.id}/approve/', format='json')
    print(f"POST /api/donation/recommendations/{rec.id}/approve/ → Status: {response.status_code}")
    
    assert response.status_code == 200
    rec.refresh_from_db()
    assert rec.status == 'accepted'
    
    # Verify donation marked as assigned
    donation.refresh_from_db()
    assert donation.status == 'assigned'
    
    # Check DonationOrder created
    order = DonationOrder.objects.filter(donation=donation, receiver=rec.receiver).exists()
    assert order, "DonationOrder not created"
    
    print(f"✓ Recommendation status: {rec.status}")
    print(f"✓ Donation status: {donation.status}")
    print("✅ TEST 5 PASSED: Donor successfully approved request")


@pytest.mark.django_db
def test_6_donor_rejects_request(setup_test_environment):
    """Test 6: Donor Rejects a Request"""
    env = setup_test_environment
    donor = env['donor']
    client = env['client']
    
    print("\n" + "=" * 80)
    print("TEST 6: Donor Rejects a Request")
    print("=" * 80)
    
    # Create donation, request, then reject
    client.force_authenticate(user=donor)
    donation_data = {
        'item_name': 'Item for Rejection Test',
        'category': 'Clothing',
        'description': 'Test',
        'condition': 'gently_used',
        'quantity': 1,
        'pickup_address': '123 Main St',
    }
    response = client.post('/api/donation/', donation_data)
    assert response.status_code == 201
    donation = Donation.objects.get(id=response.data['id'])
    
    # Find recommendation and request it
    rec = RecommendedDonation.objects.filter(
        donation=donation,
        status='suggested'
    ).first()
    
    assert rec is not None
    client.force_authenticate(user=rec.receiver)
    response = client.post(f'/api/receiver/recommendations/{rec.id}/request/', format='json')
    assert response.status_code == 200
    
    # Donor rejects
    client.force_authenticate(user=donor)
    response = client.post(f'/api/donation/recommendations/{rec.id}/reject/', format='json')
    print(f"POST /api/donation/recommendations/{rec.id}/reject/ → Status: {response.status_code}")
    
    assert response.status_code == 200
    rec.refresh_from_db()
    assert rec.status == 'rejected'
    
    print(f"✓ Recommendation status: {rec.status}")
    print("✅ TEST 6 PASSED: Donor successfully rejected request")


@pytest.mark.django_db
def test_all_comprehensive_workflow(setup_test_environment):
    """Final comprehensive test summary."""
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    total_recs = RecommendedDonation.objects.count()
    total_orders = DonationOrder.objects.count()
    total_notifs = Notification.objects.count()
    
    print(f"Total Recommendations: {total_recs}")
    print(f"Total Orders Created: {total_orders}")
    print(f"Total Notifications: {total_notifs}")
    
    print("\n✅ RECOMMENDATION SYSTEM TESTS COMPLETED")
    print("=" * 80)
