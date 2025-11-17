from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    def handle(self, *args, **options):
        email = 'test@example.com'
        username = 'testuser'
        password = 'testpassword123'

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists')
            )
            return

        # Create test user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created test user:\n'
                f'  Email: {email}\n'
                f'  Username: {username}\n'
                f'  Password: {password}'
            )
        )
