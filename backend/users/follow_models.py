import uuid
from django.db import models
from users.models import User


class UserFollow(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower   = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following  = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = "user_follows"
        unique_together = [["follower", "following"]]

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"
