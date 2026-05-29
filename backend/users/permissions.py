from rest_framework.permissions import BasePermission


class IsMecene(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_mecene)

class IsVolontaire(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_volontaire)

class IsStructure(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_structure)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_admin)

class IsKYCApproved(BasePermission):
    """Bloque toute action si KYC non validé."""
    message = "Votre KYC doit être approuvé pour effectuer cette action."
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.kyc_approved)

class IsMeceneKYC(BasePermission):
    """Mécène avec KYC validé."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_mecene and request.user.kyc_approved)

class IsVolontaireKYC(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_volontaire and request.user.kyc_approved)

class IsStructureKYC(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_structure and request.user.kyc_approved)
