from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (PostViewSet, MessageListView, MessageSendView,
                    ConversationsView, AdminDeletePostView)

router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")

urlpatterns = [
    path("", include(router.urls)),
    path("messages/",              MessageListView.as_view(),    name="messages-list"),
    path("messages/send/",         MessageSendView.as_view(),    name="messages-send"),
    path("messages/conversations/", ConversationsView.as_view(), name="conversations"),
    path("admin/posts/<uuid:post_id>/delete/", AdminDeletePostView.as_view(), name="admin-delete-post"),
]
