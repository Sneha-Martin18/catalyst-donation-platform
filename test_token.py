import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
sys.path.insert(0, r'c:\Users\Sneha Martin\Desktop\CATALYST\catalyst')

django.setup()

from django.contrib.auth.models import User
import requests

# Create a test user
username = 'testtoken'
email = 'testtoken@test.com'
password = 'TestPass123!'

try:
    # Delete existing user if any
    User.objects.filter(username=username).delete()
    
    # Create new user
    user = User.objects.create_user(username=username, email=email, password=password)
    print(f"✅ Created user: {username}")
    print(f"   is_active: {user.is_active}")
    print(f"   has_usable_password: {user.has_usable_password()}")
    
    # Try to get token
    print("\n📝 Testing token endpoint...")
    response = requests.post(
        'http://127.0.0.1:8000/api/token/',
        json={'username': username, 'password': password},
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Token obtained!")
        print(f"   Access: {data.get('access')[:20]}...")
    else:
        print(f"❌ Token failed!")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
