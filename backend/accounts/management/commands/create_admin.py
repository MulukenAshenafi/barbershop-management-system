"""
One-time bootstrap: create a Django superuser from env vars (e.g. on Render).
Safe to run multiple times; does nothing if a user with ADMIN_EMAIL already exists.
Credentials: ADMIN_EMAIL, ADMIN_PASSWORD (optional: ADMIN_NAME). No hardcoded secrets.
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create superuser from ADMIN_EMAIL/ADMIN_PASSWORD if not already present (idempotent)."

    def handle(self, *args, **options):
        User = get_user_model()
        email = (os.environ.get("ADMIN_EMAIL") or "").strip()
        password = os.environ.get("ADMIN_PASSWORD") or ""

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    "create_admin: ADMIN_EMAIL and ADMIN_PASSWORD not set; skipping."
                )
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.SUCCESS(f"create_admin: User with email {email!r} already exists; skipping.")
            )
            return

        name = (os.environ.get("ADMIN_NAME") or "Admin").strip()
        User.objects.create_superuser(email=email, password=password, name=name)
        self.stdout.write(self.style.SUCCESS(f"create_admin: Superuser created for {email!r}."))
