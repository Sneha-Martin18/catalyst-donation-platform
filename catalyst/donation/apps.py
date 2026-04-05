from django.apps import AppConfig

class DonationConfig(AppConfig):
    name = 'donation'

    def ready(self):
        # Implicitly load signals
        import donation.signals
