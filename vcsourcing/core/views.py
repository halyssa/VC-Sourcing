from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Company, Watchlist
from .serializers import CompanySerializer, WatchlistSerializer
from django.http import JsonResponse
@api_view(['GET'])
def health(request):
    return Response({"status": "ok"}, status=200)

def home(request):
    return JsonResponse({"message": "Welcome to the VC-Sourcing API"})

# List all companies
class CompanyListView(generics.ListAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

# Retrieve a single company by ID
class CompanyDetailView(generics.RetrieveAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
class UserWatchlistView(generics.ListAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs["user_id"]
        if self.request.user.id != user_id:
            # Validation: user can only view their own list
            raise PermissionDenied("You can only view your own watchlist.")
        return Watchlist.objects.filter(user_id=user_id).select_related("company")

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def watchlist_add(request):
    """
    Body: { "company_id": <int> }
    Adds the given company to the authenticated user's watchlist.
    """
    company_id = request.data.get("company_id")
    if not company_id:
        return Response(
            {"detail": "company_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response(
            {"detail": "Company not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Enforce "no duplicates" (model also has unique_together for safety)
    watchlist_item, created = Watchlist.objects.get_or_create(
        user=request.user,
        company=company,
    )

    if not created:
        return Response(
            {"detail": "Company is already in your watchlist."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = WatchlistSerializer(watchlist_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# POST /api/watchlist/remove/
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def watchlist_remove(request):
    """
    Body: { "company_id": <int> }
    Removes the given company from the authenticated user's watchlist.
    """
    company_id = request.data.get("company_id")
    if not company_id:
        return Response(
            {"detail": "company_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        watchlist_item = Watchlist.objects.get(
            user=request.user,
            company_id=company_id,
        )
    except Watchlist.DoesNotExist:
        return Response(
            {"detail": "Watchlist item not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    watchlist_item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)