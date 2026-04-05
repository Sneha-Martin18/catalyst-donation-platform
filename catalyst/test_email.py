import os
import django
from django.core.mail import send_mail
from django.conf import settings
from dotenv import load_dotenv

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'catalyst.settings')
django.setup()

def test_email():
    print("--- Catalyst Email Connectivity Test ---")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("\n⚠️ WARNING: Your settings are currently using the CONSOLE backend.")
        print("This means emails are only printed to your terminal, not sent to a mailbox.")
        print("To fix this, update your .env file with actual Gmail credentials.")
    
    try:
        print("\nAttempting to send test email...")
        send_mail(
            "Catalyst Test Email",
            "If you are reading this, your SMTP connection is working!",
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER if settings.EMAIL_HOST_USER and '@' in settings.EMAIL_HOST_USER else 'test@example.com'],
            fail_silently=False,
        )
        print("\n✅ SUCCESS: Email sent successfully!")
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        print("\nCommon fixes for Gmail:")
        print("1. Ensure 'App Password' is used, not regular password.")
        print("2. Ensure '2-Step Verification' is ON in your Google Account.")
        print("3. Check if your firewall blocks port 587.")

if __name__ == "__main__":
    test_email()
