from django.core.management.base import BaseCommand
from analytics.utils.prediction_service import predictor

class Command(BaseCommand):
    help = 'Trains the ML model and generates demand predictions'

    def handle(self, *args, **options):
        self.stdout.write("Starting prediction training...")
        success = predictor.train_and_predict()
        if success:
            self.stdout.write(self.style.SUCCESS("Successfully generated predictions."))
        else:
            self.stdout.write(self.style.ERROR("Failed to generate predictions."))
