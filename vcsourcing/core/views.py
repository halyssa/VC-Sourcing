from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from .models import Company
from .serializers import CompanySerializer
from django.http import JsonResponse
# Health check endpoint
@api_view(['GET'])
def health(request):
    return Response({"status": "ok"}, status=200)

def home(request):
    return JsonResponse({"message": "Welcome to the VC-Sourcing API"})

# List all companies
class CompanyListView(generics.ListAPIView):
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['funding_round', 'location', 'num_employees', 'founding_year', 'growth_percentage', "funding"]    


# Retrieve a single company by ID
class CompanyDetailView(generics.RetrieveAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

@api_view(['GET'])
def health(request):
    payload = {"status": "ok"}
    return Response(payload)
