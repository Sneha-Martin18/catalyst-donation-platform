from django.contrib.auth.models import AbstractUser, UserManager
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
    USER = "user"

# Custom QuerySet to handle Bulk Soft Delete
class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(is_deleted=True, is_active=False)

# Custom Manager to handle Soft Delete
class SoftDeleteUserManager(UserManager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    volunteer_code = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        help_text="Human-friendly ID for volunteers (e.g., VOL-001)"
    )
    
    
    date_of_birth = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    # Soft Delete Field
    is_deleted = models.BooleanField(default=False)

    objects = SoftDeleteUserManager()
    all_objects = UserManager()  # Access to all users including deleted ones

    def save(self, *args, **kwargs):
        if self.role in [Role.VOLUNTEER, Role.USER] and not self.volunteer_code:
            last_volunteer = (
                User.all_objects  # Use all_objects to ensure uniqueness even if soft deleted
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

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete the user.
        """
        self.is_deleted = True
        self.is_active = False  # Deactivate the user so they can't login
        self.save(using=using)
    
    
    def __str__(self):
        return f"{self.username} ({self.role})"

#_________Email OTP MODEL_________#   
class EmailOTP(models.Model):
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

# Email verification
    is_verified = models.BooleanField(default=False)
    
    # Volunteer availability status
    is_available = models.BooleanField(default=False, help_text="Whether the volunteer is available for tasks")


    def __str__(self):
        return f"Profile of {self.user.username}"