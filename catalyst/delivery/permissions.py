from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsVolunteerAndAssigned(BasePermission):
    """
    Allows access only to volunteers
    AND only for deliveries assigned to them.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'volunteer'
        )

    def has_object_permission(self, request, view, obj):
        # obj is a Delivery instance
        return obj.delivery_partner == request.user
    
class IsReceiver(BasePermission):
    """
    Allows access only to receiver users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'receiver'
        )
