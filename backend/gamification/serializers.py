from rest_framework import serializers
from .models import Post, PostLike, PostComment, Message


class PostCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_role     = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model  = PostComment
        fields = ("id", "author", "author_username", "author_role", "content", "created_at")
        read_only_fields = ("id", "author", "created_at")


class PostSerializer(serializers.ModelSerializer):
    author_username   = serializers.CharField(source="author.username", read_only=True)
    author_role       = serializers.CharField(source="author.role", read_only=True)
    likes_count       = serializers.IntegerField(read_only=True)
    comments_count    = serializers.IntegerField(read_only=True)
    post_type_display = serializers.CharField(source="get_post_type_display", read_only=True)
    is_liked_by_me    = serializers.SerializerMethodField()
    image_url         = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = ("id", "author", "author_username", "author_role",
                  "post_type", "post_type_display", "title", "content",
                  "image", "image_url", "link_url", "link_title",
                  "likes_count", "comments_count", "is_liked_by_me",
                  "is_active", "created_at")
        read_only_fields = ("id", "author", "is_active", "created_at")

    def get_is_liked_by_me(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return url.replace("http://minio:9000", "http://192.168.56.102:9000")

    def get_is_liked_by_me(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class MessageSerializer(serializers.ModelSerializer):
    sender_username    = serializers.CharField(source="sender.username", read_only=True)
    recipient_username = serializers.CharField(source="recipient.username", read_only=True)

    class Meta:
        model  = Message
        fields = ("id", "sender", "sender_username", "recipient", "recipient_username",
                  "content", "is_read", "created_at")
        read_only_fields = ("id", "sender", "is_read", "created_at")
