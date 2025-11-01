from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow owners of an object to edit it."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user


class IsContributorOrReadOnly(permissions.BasePermission):
    """Only allow contributors and experts to create content."""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['contributor', 'expert']


class IsExpertOrReadOnly(permissions.BasePermission):
    """Only allow experts to perform certain actions."""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'expert'


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Only allow authors to edit their own content."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user
