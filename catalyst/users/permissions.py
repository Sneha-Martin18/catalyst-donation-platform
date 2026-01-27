from rest_framework.permissions import BasePermission

class IsAadhaarVerified(BasePermission):
    """
    Custom permission to only allow access to users with verified Aadhaar.
    """
    message = "Aadhaar verification is required to access this resource."

    def has_permission(self, request, view):
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        if user.role == 'admin':
            return True
        
        return user.aadhaar_verified

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )