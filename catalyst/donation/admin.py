from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Donation, DonationImage

class DonationImageInline(admin.TabularInline):
    model = DonationImage
    extra = 1

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('item_name', 'donor', 'category', 'status', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = (
        'item_name',
        'description',
        'category',
        'donor__username',
        'donor__email',
    )
    inlines = [DonationImageInline]
