"""
Pytest configuration and fixtures for CATALYST project.
Handles Django setup, test user creation, and database cleanup.
"""

import os
import sys
import django
import pytest

# Setup Django before pytest runs
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')

# Add catalyst directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'catalyst'))

# Configure Django
django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.db.models.signals import post_save

User = get_user_model()


@pytest.fixture(scope='function')
def test_receiver():
    """Create or retrieve a test receiver user."""
    user, _ = User.objects.get_or_create(
        username='testreceiver',
        defaults={
            'email': 'testreceiver@test.com',
            'first_name': 'Test',
            'last_name': 'Receiver',
            'is_active': True,
            'role': 'receiver'
        }
    )
    return user


@pytest.fixture(scope='function')
def test_donor():
    """Create or retrieve a test donor user."""
    user, _ = User.objects.get_or_create(
        username='donor_test',
        defaults={
            'email': 'donor@test.com',
            'password': 'testpass123',
            'is_active': True,
            'role': 'donor'
        }
    )
    # Ensure profile is verified
    if hasattr(user, 'profile'):
        user.profile.is_verified = True
        user.profile.save()
    return user


@pytest.fixture(scope='function')
def test_receivers_multiple():
    """Create multiple test receiver users."""
    receivers = []
    for i in range(3):
        user, _ = User.objects.get_or_create(
            username=f'receiver_{i}',
            defaults={
                'email': f'receiver{i}@test.com',
                'password': 'testpass123',
                'is_active': True,
                'role': 'receiver'
            }
        )
        if hasattr(user, 'profile'):
            user.profile.is_verified = True
            user.profile.save()
        receivers.append(user)
    return receivers


@pytest.fixture(scope='function', autouse=True)
def reset_test_data(db):
    """
    Clean up test data before each test.
    This prevents duplicate constraint violations.
    """
    # Clean up before test
    test_usernames = ['testreceiver', 'donor_test', 'testdonor0', 'testdonor1', 'testdonor2']
    for username in test_usernames:
        User.objects.filter(username=username).delete()
    
    test_emails = [
        'testreceiver@test.com',
        'donor@test.com',
        'testdonor0@test.com',
        'testdonor1@test.com',
        'testdonor2@test.com',
        'receiver0@test.com',
        'receiver1@test.com',
        'receiver2@test.com'
    ]
    for email in test_emails:
        User.objects.filter(email=email).delete()
    
    yield  # Run the test
    
    # Cleanup after test if needed
    for username in test_usernames:
        User.objects.filter(username=username).delete()
