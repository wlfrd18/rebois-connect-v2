from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import User
from .follow_models import UserFollow
from .serializers import UserSerializer


class PublicProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        is_followed = UserFollow.objects.filter(
            follower=request.user, following=user
        ).exists()

        followers_count  = UserFollow.objects.filter(following=user).count()
        following_count  = UserFollow.objects.filter(follower=user).count()

        return Response({
            "id":               str(user.id),
            "username":         user.username,
            "first_name":       user.first_name,
            "last_name":        user.last_name,
            "role":             user.role,
            "bio":              getattr(user, "bio", ""),
            "avatar":           request.build_absolute_uri(user.avatar.url) if hasattr(user, "avatar") and user.avatar else None,
            "kyc_status":       user.kyc_status,
            "is_followed_by_me": is_followed,
            "followers_count":  followers_count,
            "following_count":  following_count,
        })


class FollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        if target == request.user:
            return Response({"detail": "Vous ne pouvez pas vous suivre vous-même."}, status=400)

        follow, created = UserFollow.objects.get_or_create(
            follower=request.user, following=target
        )
        if not created:
            follow.delete()
            return Response({"following": False})
        return Response({"following": True})


class MembersListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search", "")
        users  = User.objects.filter(is_active=True).exclude(id=request.user.id)

        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        data = []
        for u in users[:50]:
            followers_count = UserFollow.objects.filter(following=u).count()
            is_followed     = UserFollow.objects.filter(follower=request.user, following=u).exists()
            data.append({
                "id":               str(u.id),
                "username":         u.username,
                "first_name":       u.first_name,
                "last_name":        u.last_name,
                "role":             u.role,
                "avatar":           request.build_absolute_uri(u.avatar.url) if hasattr(u, "avatar") and u.avatar else None,
                "followers_count":  followers_count,
                "is_followed_by_me": is_followed,
            })
        return Response(data)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        for field in ["first_name", "last_name", "bio"]:
            if field in request.data:
                setattr(user, field, request.data[field])

        if "username" in request.data:
            new_username = request.data["username"]
            if User.objects.exclude(id=user.id).filter(username=new_username).exists():
                return Response({"username": ["Ce nom d'utilisateur est déjà pris."]}, status=400)
            user.username = new_username

        if "avatar" in request.FILES:
            user.avatar = request.FILES["avatar"]

        user.save()
        return Response({
            "id":         str(user.id),
            "username":   user.username,
            "first_name": user.first_name,
            "last_name":  user.last_name,
            "role":       user.role,
            "bio":        getattr(user, "bio", ""),
        })
