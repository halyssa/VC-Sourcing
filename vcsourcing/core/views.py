from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Company
from .serializers import CompanySerializer

@api_view(['GET'])
def health(request):
    payload = {"status": "ok"}
    return Response(payload)

class CompanyListView(generics.ListAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name','funding_round', 'location', 'funding', 'num_employees', 'founding_year', 'growth_percentage']