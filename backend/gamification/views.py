from rest_framework import generics, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from users.permissions import IsAdmin
from .models import Post, PostLike, PostComment, Message
from .serializers import PostSerializer, PostCommentSerializer, MessageSerializer


class PostViewSet(ModelViewSet):
    serializer_class = PostSerializer
    parser_classes   = [parsers.MultiPartParser, parsers.JSONParser]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Post.objects.filter(is_active=True).select_related("author").prefetch_related("likes", "comments")
        post_type = self.request.query_params.get("type")
        if post_type:
            qs = qs.filter(post_type=post_type)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        # Propriétaire ou Admin peut supprimer
        if post.author != request.user and not request.user.is_admin:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.is_admin:
            post.deleted_by_admin = True
            post.delete_reason = request.data.get("reason", "")
        post.is_active = False
        post.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({"liked": False, "likes_count": post.likes_count})
        return Response({"liked": True, "likes_count": post.likes_count})

    @action(detail=True, methods=["get", "post"], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            comments = post.comments.filter(is_active=True)
            return Response(PostCommentSerializer(comments, many=True).data)
        serializer = PostCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(post=post, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageListView(generics.ListAPIView):
    """Liste des conversations de l'utilisateur connecté."""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other = self.request.query_params.get("with")
        if other:
            return Message.objects.filter(
                Q(sender=user, recipient_id=other) |
                Q(sender_id=other, recipient=user)
            )
        return Message.objects.filter(Q(sender=user) | Q(recipient=user))


class MessageSendView(generics.CreateAPIView):
    """Envoyer un message privé."""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class ConversationsView(APIView):
    """Liste des utilisateurs avec qui on a échangé."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import User
        user = request.user
        messages = Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by("-created_at")

        seen = set()
        conversations = []
        for msg in messages:
            other = msg.recipient if msg.sender == user else msg.sender
            if other.id not in seen:
                seen.add(other.id)
                unread = Message.objects.filter(sender=other, recipient=user, is_read=False).count()
                conversations.append({
                    "user": {
                        "id":       str(other.id),
                        "username": other.username,
                        "role":     other.role,
                    },
                    "last_message": msg.content[:50],
                    "last_message_at": msg.created_at,
                    "unread_count": unread,
                })
        return Response(conversations)


class AdminDeletePostView(APIView):
    """Admin supprime un post avec une raison."""
    permission_classes = [IsAdmin]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"detail": "Post introuvable."}, status=404)
        post.is_active        = False
        post.deleted_by_admin = True
        post.delete_reason    = request.data.get("reason", "Violation des règles de la communauté")
        post.save()
        return Response({"detail": "Post supprimé."})
