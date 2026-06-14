from django.contrib import admin
from .models import Post, PostComment, PostLike, Message


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display  = ("author", "post_type", "title", "is_active", "deleted_by_admin", "created_at")
    list_filter   = ("post_type", "is_active", "deleted_by_admin")
    search_fields = ("author__username", "content", "title")
    readonly_fields = ("id", "created_at")

    actions = ["delete_selected_posts"]

    def delete_selected_posts(self, request, queryset):
        queryset.update(is_active=False, deleted_by_admin=True,
                        delete_reason="Supprimé en masse par Admin")
    delete_selected_posts.short_description = "Supprimer les posts sélectionnés"


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display  = ("author", "post", "is_active", "created_at")
    list_filter   = ("is_active",)
    readonly_fields = ("id", "created_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ("sender", "recipient", "is_read", "created_at")
    readonly_fields = ("id", "created_at")
