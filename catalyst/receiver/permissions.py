from rest_framework.permissions import BasePermission

class IsReceiver(BasePermission):
    """
    Allows access only to users with role = receiver
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role.lower() == 'receiver'
        )
        
class IsAdminOrStaff(BasePermission):
    """
    Allows access only to admin / staff users
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )

