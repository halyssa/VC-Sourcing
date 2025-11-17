from rest_framework import serializers
from .models import Company, Watchlist

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "name",
            "funding_round",
            "funding",
            "location",
            "num_employees",
            "founding_year",
            "growth_percentage",
        ]

class WatchlistSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source="company",
        write_only=True,
    )

    class Meta:
        model = Watchlist
        fields = ["id", "company", "company_id"]