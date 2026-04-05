import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
django.setup()

from receiver.models import ItemRequest
from donation.models import Donation

# 1. Find the donation
donation = Donation.objects.filter(item_name__icontains="Wooden Study Table").last()
if not donation:
    print("Donation not found.")
else:
    print(f"Found Donation: {donation.item_name} (ID: {donation.id}, Status: {donation.status})")
    print(f"Link: {donation.fulfilled_request}")

    # 2. Find the corresponding APPROVED request
    # Try to find request that matches category/name logic roughly
    req = ItemRequest.objects.filter(
        item_name__icontains=donation.item_name,
        status='approved'
    ).first()

    if req:
        print(f"Found Matching Request: {req.item_name} (ID: {req.id}, Status: {req.status})")
        
        # 3. Create the link
        donation.fulfilled_request = req
        donation.save()
        print("✅ Linked Donation to Request.")

        # 4. Mark request as completed (since donation is verified)
        if donation.status == 'verified':
            req.status = 'completed'
            req.save()
            print("✅ Marked Request as Completed.")
    else:
        print("No matching approved request found.")
