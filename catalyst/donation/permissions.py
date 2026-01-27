from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to allow:
    - Donors to edit/delete their own donations
    - Admins to edit/delete any donation
    - Everyone can view donations (GET, HEAD, OPTIONS)
    """

    def has_object_permission(self, request, view, obj):
        # Allow read-only methods for everyone
        if request.method in SAFE_METHODS:
            return True

        # Admins can edit/delete any donation
        if hasattr(request.user, 'role') and request.user.role.lower() == 'admin':
            return True

        # Donors can edit/delete their own donations
        if hasattr(request.user, 'role') and request.user.role.lower() == 'donor':
            return obj.owner == request.user  # Assuming 'owner' field in Donation model

        # All others cannot modify
        return False
