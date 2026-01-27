from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta


#___________CREATING MODELS__________

#_________userroles__________
class Role(models.TextChoices):
    DONOR = "donor"
    RECEIVER = "receiver"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    volunteer_code = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        help_text="Human-friendly ID for volunteers (e.g., VOL-001)"
    )
    
    
    date_of_birth = models.DateField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.role == 'volunteer' and not self.volunteer_code:
            last_volunteer = (
                User.objects
                .filter(volunteer_code__isnull=False)
                .order_by('-id')
                .first()
            )

            if last_volunteer and last_volunteer.volunteer_code:
                last_number = int(last_volunteer.volunteer_code.split('-')[1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.volunteer_code = f"VOL-{new_number:03d}"

        super().save(*args, **kwargs)

    
    
    def __str__(self):
        return f"{self.username} ({self.role})"

#_________Aadhaar OTP MODEL_________#   
class AadhaaarOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    session_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

#_________USER PROFILE MODEL_________#   
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    rating = models.FloatField(default=0.0)

# Aadhaar verification
    aadhaar_last4 = models.CharField(max_length=4, blank=True, null=True)
    aadhaar_verified = models.BooleanField(default=False)


    def __str__(self):
        return f"Profile of {self.user.username}"