import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
django.setup()

from donation.models import Donation

try:
    d = Donation.objects.last()
    if d:
        print(f"Latest Donation ID: {d.id}")
        print(f"Item Name: {d.item_name}")
        print(f"Fulfilled Request: {d.fulfilled_request}")
        print(f"Fulfilled Request ID: {d.fulfilled_request_id}")
    else:
        print("No donations found.")
except Exception as e:
    print(f"Error: {e}")
