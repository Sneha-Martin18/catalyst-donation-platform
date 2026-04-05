import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from receiver.models import ItemRequest

User = get_user_model()

class Command(BaseCommand):
    help = 'Generates synthetic historical request data for ML training'

    def handle(self, *args, **options):
        # 1. Get or Create a Receiver
        receiver = User.objects.filter(groups__name='Receivers').first()
        if not receiver:
            receiver = User.objects.first() # Fallback

        if not receiver:
            self.stdout.write(self.style.ERROR("No users found to assign requests to."))
            return

        categories = {
            'Clothes': {'base': 10, 'trend': 2},
            'Books': {'base': 5, 'trend': 1},
            'Electronics': {'base': 2, 'trend': 0.5},
            'Stationary': {'base': 15, 'trend': 3}
        }

        # Clear existing requests to start fresh for demo
        # ItemRequest.objects.all().delete()
        
        # Generate 6 months of data
        end_date = timezone.now()
        start_date = end_date - timedelta(days=180)
        
        requests_count = 0
        
        current_date = start_date
        while current_date <= end_date:
            # For each category, generate some requests
            for cat, params in categories.items():
                # Add some randomness and a slight upward trend
                months_passed = (current_date - start_date).days // 30
                daily_chance = 0.2 # 20% chance of a request per day per category
                
                if random.random() < daily_chance:
                    # Quantity grows slightly over time based on 'trend'
                    quantity = params['base'] + (params['trend'] * months_passed)
                    # Add noise
                    quantity = max(1, int(quantity + random.randint(-5, 5)))
                    
                    req = ItemRequest.objects.create(
                        receiver=receiver,
                        item_name=f"Needed {cat} Bundle",
                        category=cat,
                        quantity=quantity,
                        condition='Good',
                        status='completed', # historical data usually completed
                        description=f"Synthetic data for {cat}"
                    )
                    # Force set the created_at to the past
                    req.created_at = current_date
                    req.save()
                    requests_count += 1
            
            current_date += timedelta(days=2) # Generate data every 2 days

        self.stdout.write(self.style.SUCCESS(f"Successfully generated {requests_count} historical records."))
