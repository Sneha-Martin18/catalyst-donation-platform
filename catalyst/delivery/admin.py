from django.contrib import admin
from .models import (
    Delivery,
    DeliveryStatusLog,
    DeliveryProof,
    DeliveryLocation
)


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'donation',
        'request',
        'delivery_partner',
        'status',
        'assignment_type',
        'scheduled_pickup',
        'created_at',
    )

    list_display_links = ('id', 'request')  # 👈 ADD THIS

    list_filter = ('status', 'assignment_type')
    search_fields = ('id',)



@admin.register(DeliveryStatusLog)
class DeliveryStatusLogAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'status', 'updated_by', 'timestamp')
    list_filter = ('status',)


@admin.register(DeliveryProof)
class DeliveryProofAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'uploaded_at')


@admin.register(DeliveryLocation)
class DeliveryLocationAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'latitude', 'longitude', 'recorded_at')
