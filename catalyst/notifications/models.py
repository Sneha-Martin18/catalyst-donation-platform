from django.db import models
from django.contrib.auth import get_user_model
# Create your models here.

User = get_user_model() #this is used to get the custom user model if any

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('info', 'Information'),    
        ('warning', 'Warning'),
        ('success', 'Success'),
    ]
    
    user = models.ForeignKey(
        User,               
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default='info'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)            
    
    def __str__(self):
      return f"Notification for {self.user} - {self.message[:30]}"