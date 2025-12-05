from rest_framework import serializers
from .models import Company, Watchlist

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "sector",
            "funding_round",
            "funding",
            "location",
            "num_employees",
            "founding_year",
            "description",
        ]

class WatchlistSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        source="company",
        queryset=Company.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Watchlist
        fields = ["id", "company", "company_id"]

class CompanySummarySerializer(serializers.Serializer):
    company_id = serializers.IntegerField()
    summary = serializers.CharField()
