
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Company, Watchlist

User = get_user_model()


class Command(BaseCommand):
    help = "Seed sample watchlist entries"

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(username="testuser")
        user.set_password("testpassword")
        user.save()

        companies = Company.objects.all()[:3]  # first few companies

        for company in companies:
            Watchlist.objects.get_or_create(user=user, company=company)

        self.stdout.write(self.style.SUCCESS("Seeded sample watchlist entries."))