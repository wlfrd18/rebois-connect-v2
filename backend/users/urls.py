from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (RegisterView, MeView, LogoutView, AdminUserListView, AdminUserDetailView,
                    ActivateAccountView, PasswordResetRequestView, PasswordResetConfirmView)
from .profile_views import PublicProfileView, FollowToggleView, MembersListView, UpdateProfileView

urlpatterns = [
    path("register/",                        RegisterView.as_view(),             name="register"),
    path("login/",                           TokenObtainPairView.as_view(),      name="login"),
    path("refresh/",                         TokenRefreshView.as_view(),         name="token_refresh"),
    path("logout/",                          LogoutView.as_view(),               name="logout"),
    path("me/",        MeView.as_view(),           name="me"),
    path("me/update/", UpdateProfileView.as_view(), name="me-update"),
    path("activate/<str:uid>/<str:token>/",  ActivateAccountView.as_view(),      name="activate"),
    path("password-reset/",                  PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/<str:uid>/<str:token>/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("admin/users/",              AdminUserListView.as_view(),   name="admin-users"),
    path("admin/users/<uuid:pk>/",    AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("profile/<str:username>/",        PublicProfileView.as_view(),  name="public-profile"),
    path("profile/<str:username>/follow/", FollowToggleView.as_view(),   name="follow-toggle"),
    path("members/",                       MembersListView.as_view(),     name="members"),
]
