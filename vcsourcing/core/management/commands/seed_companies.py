from decimal import Decimal
from django.core.management.base import BaseCommand

from core.models import Company


class Command(BaseCommand):
    help = "Seed the database with example companies for demos"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded companies with matching names before seeding",
        )

    def handle(self, *args, **options):
        seed_data = [
            {"name": "Aurora Analytics", "funding_round": "Seed", "funding": Decimal("500000.00"), "location": "San Francisco, CA", "num_employees": 8, "founding_year": 2021, "growth_percentage": 120},
            {"name": "BluePeak Robotics", "funding_round": "Series A", "funding": Decimal("4500000.00"), "location": "Boston, MA", "num_employees": 42, "founding_year": 2018, "growth_percentage": 60},
            {"name": "Cedar Health", "funding_round": "Series B", "funding": Decimal("18000000.00"), "location": "Austin, TX", "num_employees": 120, "founding_year": 2016, "growth_percentage": 35},
            {"name": "Dune Energy", "funding_round": "Seed", "funding": Decimal("750000.00"), "location": "Denver, CO", "num_employees": 12, "founding_year": 2022, "growth_percentage": 200},
            {"name": "Echo Commerce", "funding_round": "Series C", "funding": Decimal("62000000.00"), "location": "New York, NY", "num_employees": 350, "founding_year": 2012, "growth_percentage": 18},
            {"name": "Fjord Security", "funding_round": "Series A", "funding": Decimal("3000000.00"), "location": "Seattle, WA", "num_employees": 30, "founding_year": 2019, "growth_percentage": 55},
            {"name": "Granite Supply", "funding_round": "Series B", "funding": Decimal("15000000.00"), "location": "Chicago, IL", "num_employees": 95, "founding_year": 2015, "growth_percentage": 12},
            {"name": "Helix Bio", "funding_round": "Series D", "funding": Decimal("120000000.00"), "location": "San Diego, CA", "num_employees": 820, "founding_year": 2010, "growth_percentage": 8},
            {"name": "Iris Mobility", "funding_round": "Seed", "funding": Decimal("300000.00"), "location": "Palo Alto, CA", "num_employees": 6, "founding_year": 2023, "growth_percentage": 260},
            {"name": "Juno AI", "funding_round": "Series A", "funding": Decimal("5200000.00"), "location": "London, UK", "num_employees": 48, "founding_year": 2019, "growth_percentage": 72},
            {"name": "Kite Logistics", "funding_round": "Series B", "funding": Decimal("22000000.00"), "location": "Singapore", "num_employees": 210, "founding_year": 2014, "growth_percentage": 25},
            {"name": "Lumen CleanTech", "funding_round": "Series C", "funding": Decimal("48000000.00"), "location": "Berlin, Germany", "num_employees": 180, "founding_year": 2013, "growth_percentage": 30},
            {
                "name": "NovaPay",
                "sector": "Fintech",
                "funding_round": "Seed",
                "funding": Decimal("2500000.00"),
                "location": "New York, USA",
                "num_employees": 18,
                "founding_year": 2023,
                "growth_percentage": 80,
            },
            {
                "name": "FlowBank",
                "sector": "Fintech",
                "funding_round": "Series A",
                "funding": Decimal("12000000.00"),
                "location": "London, UK",
                "num_employees": 55,
                "founding_year": 2021,
                "growth_percentage": 65,
            },
            {
                "name": "InsightGrid AI",
                "sector": "AI/ML",
                "funding_round": "Seed",
                "funding": Decimal("5000000.00"),
                "location": "Toronto, Canada",
                "num_employees": 20,
                "founding_year": 2023,
                "growth_percentage": 85,
            },
            {
                "name": "VectorMind",
                "sector": "AI/ML",
                "funding_round": "Series B",
                "funding": Decimal("30000000.00"),
                "location": "San Francisco, USA",
                "num_employees": 80,
                "founding_year": 2019,
                "growth_percentage": 60,
            },
            {
                "name": "GreenFlux Energy",
                "sector": "Climate/Energy",
                "funding_round": "Seed",
                "funding": Decimal("3500000.00"),
                "location": "Copenhagen, Denmark",
                "num_employees": 16,
                "founding_year": 2022,
                "growth_percentage": 78,
            },
            {
                "name": "SolarLoop",
                "sector": "Climate/Energy",
                "funding_round": "Series A",
                "funding": Decimal("11000000.00"),
                "location": "Austin, USA",
                "num_employees": 35,
                "founding_year": 2020,
                "growth_percentage": 52,
            },
            {
                "name": "BrightCart",
                "sector": "Consumer",
                "funding_round": "Pre-Seed",
                "funding": Decimal("600000.00"),
                "location": "Los Angeles, USA",
                "num_employees": 8,
                "founding_year": 2024,
                "growth_percentage": 88,
            },
            {
                "name": "FleetSync",
                "sector": "Enterprise/B2B",
                "funding_round": "Series A",
                "funding": Decimal("13000000.00"),
                "location": "Chicago, USA",
                "num_employees": 50,
                "founding_year": 2020,
                "growth_percentage": 49,
            },
            {
                "name": "EcoRoute",
                "sector": "Climate/Energy",
                "funding_round": "Seed",
                "funding": Decimal("2300000.00"),
                "location": "Stockholm, Sweden",
                "num_employees": 14,
                "founding_year": 2021,
                "growth_percentage": 74,
            },
            {
                "name": "CareSync",
                "sector": "Healthcare/Bio",
                "funding_round": "Seed",
                "funding": Decimal("2800000.00"),
                "location": "Toronto, Canada",
                "num_employees": 17,
                "founding_year": 2022,
                "growth_percentage": 69,
            },
            {
                "name": "ShopLoop",
                "sector": "Consumer",
                "funding_round": "Series A",
                "funding": Decimal("9000000.00"),
                "location": "Madrid, Spain",
                "num_employees": 32,
                "founding_year": 2020,
                "growth_percentage": 59,
            },
            {
                "name": "TrustRail",
                "sector": "Other",
                "funding_round": "Seed",
                "funding": Decimal("3100000.00"),
                "location": "Zurich, Switzerland",
                "num_employees": 21,
                "founding_year": 2021,
                "growth_percentage": 64,
            },
            {
                "name": "PixelHaven",
                "sector": "Other",
                "funding_round": "Pre-Seed",
                "funding": Decimal("450000.00"),
                "location": "Sydney, Australia",
                "num_employees": 6,
                "founding_year": 2024,
                "growth_percentage": 87,
            },
        ]

        if options.get("clear"):
            names = [d["name"] for d in seed_data]
            Company.objects.filter(name__in=names).delete()
            self.stdout.write(self.style.WARNING(f"Deleted existing companies matching names: {names}"))

        created = 0
        for data in seed_data:
            obj, created_flag = Company.objects.update_or_create(
                name=data["name"],
                defaults={
                    "funding_round": data["funding_round"],
                    "funding": data["funding"],
                    "location": data["location"],
                    "num_employees": data["num_employees"],
                    "founding_year": data["founding_year"],
                    "growth_percentage": data["growth_percentage"],
                },
            )
            if created_flag:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created/updated {len(seed_data)} companies ({created} new)."))
