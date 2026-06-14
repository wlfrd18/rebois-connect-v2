from django.urls import path
from .views import KYCDocumentUploadView, MyKYCView, AdminKYCListView, AdminKYCApproveView

urlpatterns = [
    path("upload/",              KYCDocumentUploadView.as_view(), name="kyc-upload"),
    path("my-documents/",        MyKYCView.as_view(),             name="kyc-my-docs"),
    path("admin/pending/",       AdminKYCListView.as_view(),      name="kyc-admin-list"),
    path("admin/approve/<uuid:user_id>/", AdminKYCApproveView.as_view(), name="kyc-admin-approve"),
]
