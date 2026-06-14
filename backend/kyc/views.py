from rest_framework import generics, status, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from users.permissions import IsAdmin
from users.models import User
from .models import KYCDocument, KYCReview
from .serializers import KYCDocumentSerializer, KYCReviewSerializer


class KYCDocumentUploadView(generics.CreateAPIView):
    """L'utilisateur uploade ses documents KYC."""
    serializer_class   = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [parsers.MultiPartParser]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MyKYCView(generics.ListAPIView):
    """L'utilisateur voit ses documents KYC soumis."""
    serializer_class   = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return KYCDocument.objects.filter(user=self.request.user)


class AdminKYCListView(generics.ListAPIView):
    """Admin voit tous les utilisateurs avec KYC en attente."""
    permission_classes = [IsAdmin]

    def get(self, request):
        pending_users = User.objects.filter(
            kyc_status=User.KYCStatus.PENDING
        ).prefetch_related("kyc_documents")

        data = []
        for user in pending_users:
            data.append({
                "id":         str(user.id),
                "username":   user.username,
                "email":      user.email,
                "role":       user.role,
                "created_at": user.created_at,
                "documents":  KYCDocumentSerializer(
                    user.kyc_documents.all(), many=True, context={"request": request}
                ).data,
            })
        return Response(data)


class AdminKYCApproveView(APIView):
    """Admin approuve ou rejette un KYC."""
    permission_classes = [IsAdmin]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        approved = request.data.get("approved", True)
        note     = request.data.get("note", "")

        user.kyc_status = User.KYCStatus.APPROVED if approved else User.KYCStatus.REJECTED
        user.save()

        KYCReview.objects.update_or_create(
            user=user,
            defaults={"reviewer": request.user, "approved": approved, "note": note}
        )

        return Response({
            "detail": f"KYC {'approuvé' if approved else 'rejeté'} pour {user.username}."
        })
