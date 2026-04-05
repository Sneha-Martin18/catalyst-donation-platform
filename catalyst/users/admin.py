from django.contrib import admin
from .models import User, SoftDeleteQuerySet


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'username',
        'email',
        'role',
        'volunteer_code',
        'is_active',
        'is_deleted',
    )
    list_filter = ('role', 'is_active', 'is_deleted')
    search_fields = ('username', 'email', 'volunteer_code')

    def get_queryset(self, request):
        # Use SoftDeleteQuerySet to: 
        # 1. Show all users (including deleted)
        # 2. Ensure bulk delete action performs soft delete
        return SoftDeleteQuerySet(self.model, using=self._db)

    def delete_queryset(self, request, queryset):
        """
        Override default delete action to use our soft delete method.
        """
        queryset.delete()
