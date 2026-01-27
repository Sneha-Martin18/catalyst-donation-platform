from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class AnalyticsReport(models.Model):
    # ---- Identity ----
    title = models.CharField(max_length=255)

    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="analytics_reports"
    )

    generated_at = models.DateTimeField(auto_now_add=True)

    # ---- Time Window ----
    start_date = models.DateField()
    end_date = models.DateField()

    # ---- Snapshot Metrics ----
    total_donations = models.PositiveIntegerField()
    total_requests = models.PositiveIntegerField()
    donation_request_ratio = models.FloatField()

    status_summary = models.CharField(
        max_length=50
    )  # Demand-heavy / Balanced / Supply-heavy

    # ---- Auto-generated Text ----
    executive_summary = models.TextField()
    system_conclusion = models.TextField()

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.title} ({self.start_date} → {self.end_date})"
