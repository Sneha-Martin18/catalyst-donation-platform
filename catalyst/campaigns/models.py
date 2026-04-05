from django.db import models

class LiveCampaign(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('live', 'Live'),
        ('completed', 'Completed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    food_type = models.CharField(max_length=100, help_text="e.g., Prepared Meals, Dry Rations")
    target_quantity = models.PositiveIntegerField(help_text="Target number of units/meals")
    current_quantity = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    image_url = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=255)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def progress_percentage(self):
        if self.target_quantity == 0:
            return 0
        return min(100, int((self.current_quantity / self.target_quantity) * 100))
