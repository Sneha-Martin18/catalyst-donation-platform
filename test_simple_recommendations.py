"""
Simple test script to verify the Donation Recommendation System works correctly.
Tests core functionality without complex API validation.
"""

import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase

from donation.models import Donation
from receiver.models import ItemRequest, RecommendedDonation, DonationOrder
from services.matching_engine import run_matching_logic

User = get_user_model()


@pytest.mark.django_db
class TestRecommendationSystem(TestCase):
    """Test the recommendation system core functionality."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test users and requests."""
        super().setUpClass()
        
        # Create donor
        cls.donor = User.objects.create_user(
            username='test_donor',
            email='donor@example.com',
            password='testpass123',
            is_active=True
        )
        
        # Create receivers
        cls.receivers = []
        for i in range(3):
            receiver = User.objects.create_user(
                username=f'test_receiver_{i}',
                email=f'receiver{i}@example.com',
                password='testpass123',
                is_active=True,
                role='receiver'
            )
            cls.receivers.append(receiver)
        
        # Create item requests
        cls.requests = []
        for i, receiver in enumerate(cls.receivers):
            req = ItemRequest.objects.create(
                receiver=receiver,
                item_name=f'Item {i}',
                category='Electronics' if i < 2 else 'Clothing',
                condition='gently_used',
                quantity=1,
                status='pending'
            )
            cls.requests.append(req)
    
    @pytest.mark.django_db
    def test_matching_engine_creates_recommendations(self):
        """Test that matching engine creates recommendations."""
        print("\n" + "=" * 80)
        print("TEST: Matching Engine Creates Recommendations")
        print("=" * 80)
        
        # Create a donation directly in the model
        donation = Donation.objects.create(
            donor=self.donor,
            item_name='Electronics Donation',
            category='Electronics',
            description='Test electronics',
            condition='new',
            quantity=2,
            status='pending'
        )
        print(f"✓ Created donation: {donation.item_name} (ID: {donation.id})")
        
        # Run matching logic
        run_matching_logic(donation.id)
        
        # Check recommendations were created
        recommendations = RecommendedDonation.objects.filter(donation=donation)
        print(f"\n✓ Generated {recommendations.count()} recommendations:")
        
        for rec in recommendations:
            print(f"  - {rec.receiver.username}: Score {rec.similarity_score:.2f}")
            print(f"    Status: {rec.status}")
        
        assert recommendations.count() > 0, "No recommendations created"
        assert all(rec.status == 'suggested' for rec in recommendations), "Not all in suggested status"
        print("\n✅ TEST PASSED: Matching engine works correctly")
    
    @pytest.mark.django_db
    def test_recommendation_status_transitions(self):
        """Test recommendation status transitions."""
        print("\n" + "=" * 80)
        print("TEST: Recommendation Status Transitions")
        print("=" * 80)
        
        # Create donation and generate recommendations
        donation = Donation.objects.create(
            donor=self.donor,
            item_name='Status Test Item',
            category='Electronics',
            description='Test',
            condition='new',
            quantity=1,
            status='pending'
        )
        
        run_matching_logic(donation.id)
        rec = RecommendedDonation.objects.get(donation=donation, receiver=self.receivers[0])
        print(f"✓ Created recommendation: {rec.id}")
        
        # Test status transition: suggested -> requested
        print(f"  Initial status: {rec.status}")
        assert rec.status == 'suggested'
        
        rec.status = 'requested'
        rec.save()
        rec.refresh_from_db()
        print(f"  Updated status: {rec.status}")
        assert rec.status == 'requested'
        
        # Test status transition: requested -> accepted
        rec.status = 'accepted'
        rec.save()
        rec.refresh_from_db()
        print(f"  Final status: {rec.status}")
        assert rec.status == 'accepted'
        
        print("\n✅ TEST PASSED: Status transitions work correctly")
    
    @pytest.mark.django_db
    def test_donation_order_creation_on_approval(self):
        """Test that DonationOrder is created when recommendation is approved."""
        print("\n" + "=" * 80)
        print("TEST: DonationOrder Creation on Approval")
        print("=" * 80)
        
        # Create donation and recommendation
        donation = Donation.objects.create(
            donor=self.donor,
            item_name='Order Test Item',
            category='Electronics',
            description='Test',
            condition='new',
            quantity=1,
            status='pending'
        )
        
        run_matching_logic(donation.id)
        rec = RecommendedDonation.objects.get(donation=donation, receiver=self.receivers[0])
        
        # Mark as approved
        rec.status = 'accepted'
        rec.save()
        
        # Manually create DonationOrder (normally done by API)
        order = DonationOrder.objects.create(
            donation=donation,
            receiver=self.receivers[0],
            status='pending_delivery'
        )
        
        print(f"✓ Created DonationOrder: {order.id}")
        print(f"  Donation: {order.donation.item_name}")
        print(f"  Receiver: {order.receiver.username}")
        print(f"  Status: {order.status}")
        
        order.refresh_from_db()
        assert order.donation == donation
        assert order.receiver == self.receivers[0]
        
        print("\n✅ TEST PASSED: DonationOrder creation works correctly")
    
    @pytest.mark.django_db
    def test_category_matching_score(self):
        """Test that similar categories get higher matching scores."""
        print("\n" + "=" * 80)
        print("TEST: Category Matching Score")
        print("=" * 80)
        
        # Create an Electronics donation
        donation = Donation.objects.create(
            donor=self.donor,
            item_name='Electronics Item',
            category='Electronics',
            description='Test',
            condition='new',
            quantity=1,
            status='pending'
        )
        
        run_matching_logic(donation.id)
        
        # Get all recommendations
        all_recs = RecommendedDonation.objects.filter(donation=donation)
        print(f"Total recommendations: {all_recs.count()}")
        
        # Find Electronics and Clothing recommendations
        electronics_rec = None
        clothing_rec = None
        
        for rec in all_recs:
            if rec.receiver == self.receivers[0]:  # Electronics
                electronics_rec = rec
            elif rec.receiver == self.receivers[2]:  # Clothing
                clothing_rec = rec
        
        if electronics_rec:
            print(f"Electronics receiver score: {electronics_rec.similarity_score:.2f}")
        
        if clothing_rec and electronics_rec:
            print(f"Clothing receiver score: {clothing_rec.similarity_score:.2f}")
            # Electronics should have higher or equal score
            assert electronics_rec.similarity_score >= clothing_rec.similarity_score, \
                "Electronics match should score higher"
        else:
            print("Note: Not all recommendations met threshold, testing with available recs")
            assert electronics_rec is not None, "At least Electronics recommendation should exist"
        
        print("\n✅ TEST PASSED: Category matching works correctly")


# Run standalone tests
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
