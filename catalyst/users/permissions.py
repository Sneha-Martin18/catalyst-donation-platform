from rest_framework.permissions import BasePermission

class IsVerified(BasePermission):
    message = "Email verification is required to access this resource."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.role == "admin":
            return True

        # 🔥 CHECK PROFILE, NOT USER
        if hasattr(user, "profile"):
            return user.profile.is_verified is True

        return False
      

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )
        
class IsVolunteer(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return (
            user and
            user.is_authenticated and
            user.role in ["volunteer", "user", "donor", "receiver", "admin"]
        )