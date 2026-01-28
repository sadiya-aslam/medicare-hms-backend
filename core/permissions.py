

from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Admin')

class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Doctor')

class IsPatient(BasePermission):
    def has_permission(self, request, view):
       
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Patient')