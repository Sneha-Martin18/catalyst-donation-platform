from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'username',
        'email',
        'role',
        'volunteer_code',
        'is_active',
    )
    list_filter = ('role', 'is_active')
    search_fields = ('username', 'email', 'volunteer_code')
