from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['name', 'funding_round', 'funding', 'location', 'num_employees', 'founding_year', 'growth_percentage']