import uuid
from django.db import models
from users.models import User


class Post(models.Model):

    class PostType(models.TextChoices):
        FORMATION  = "formation",  "Formation"
        ANNONCE    = "annonce",    "Annonce"
        ASTUCE     = "astuce",     "Astuce"
        PARTAGE    = "partage",    "Partage"
        ACTUALITE  = "actualite",  "Actualité"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    post_type  = models.CharField(max_length=15, choices=PostType.choices, default=PostType.PARTAGE)
    title      = models.CharField(max_length=200, blank=True)
    content    = models.TextField()
    image     = models.ImageField(upload_to="posts/images/", null=True, blank=True)
    media_file = models.FileField(upload_to="posts/media/", null=True, blank=True)
    link_url   = models.URLField(blank=True)
    link_title = models.CharField(max_length=200, blank=True)

    is_active        = models.BooleanField(default=True)
    deleted_by_admin = models.BooleanField(default=False)
    delete_reason    = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "posts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.username} — {self.get_post_type_display()}"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()


class PostLike(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post       = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_posts")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table      = "post_likes"
        unique_together = [["post", "user"]]


class PostComment(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post       = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    content    = models.TextField()
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "post_comments"
        ordering = ["created_at"]


class Message(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    content    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
