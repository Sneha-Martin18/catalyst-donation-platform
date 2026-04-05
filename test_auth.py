#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, r'c:\Users\Sneha Martin\Desktop\CATALYST\catalyst')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

User = get_user_model()

# Try to authenticate existing user
user = authenticate(username='sneha', password='Sneha@123')
print(f'Authenticate sneha with Sneha@123: {user}')

# Try test user if it exists
try:
    user2 = User.objects.get(username='testtoken')
    print(f'testtoken user exists: {user2}')
    print(f'  is_active: {user2.is_active}')
    print(f'  check_password("TestPass123!"): {user2.check_password("TestPass123!")}')
except User.DoesNotExist:
    print('testtoken user does not exist')

# List all users to debug
print("\nAll users:")
for u in User.objects.all():
    print(f"  {u.username} (active: {u.is_active}, has_usable_password: {u.has_usable_password()})")
