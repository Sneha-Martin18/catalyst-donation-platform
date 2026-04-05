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

        # Donors or General Users can edit/delete their own donations
        if hasattr(request.user, 'role') and request.user.role.lower() in ['donor', 'user']:
            return obj.donor == request.user  # The models.py actually uses 'donor' for the FK, checking... yes, obj.donor 


        # All others cannot modify
        return False
