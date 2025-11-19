from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Company, Watchlist


class Command(BaseCommand):
    help = "Seed a test user and sample watchlist entries"

    def handle(self, *args, **options):
        # Create or get test user
        user, created = User.objects.get_or_create(
            username="testuser",
            defaults={"email": "testuser@example.com"},
        )
        if created:
            user.set_password("testpassword")
            user.save()
            self.stdout.write(self.style.SUCCESS("Created test user testuser/testpassword"))
        else:
            self.stdout.write("Test user already exists.")

        # Ensure some companies exist
        if Company.objects.count() == 0:
            Company.objects.create(
                name="Acme Ventures",
                funding_round="Seed",
                funding=1000000,
                location="San Francisco",
                num_employees=10,
                founding_year=2023,
                growth_percentage=50,
            )
            Company.objects.create(
                name="Beta Capital",
                funding_round="Series A",
                funding=5000000,
                location="New York",
                num_employees=30,
                founding_year=2021,
                growth_percentage=70,
            )
            self.stdout.write(self.style.SUCCESS("Created sample companies."))

        companies = Company.objects.all()[:3]

        for company in companies:
            Watchlist.objects.get_or_create(user=user, company=company)

        self.stdout.write(self.style.SUCCESS("Seeded sample watchlist entries."))
