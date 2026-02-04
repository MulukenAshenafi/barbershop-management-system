# Generated migration for Django auth: email_verified, is_guest, first_name, last_name, OneTimeToken

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_user_firebase_uid_alter_user_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="first_name",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="user",
            name="last_name",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="user",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="is_guest",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="OneTimeToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token", models.CharField(db_index=True, max_length=64, unique=True)),
                ("purpose", models.CharField(choices=[("email_verification", "Email verification"), ("password_reset", "Password reset"), ("email_change", "Email change")], max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("extra_data", models.JSONField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="one_time_tokens", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "accounts_onetimetoken",
            },
        ),
        migrations.AddIndex(
            model_name="onetimetoken",
            index=models.Index(fields=["token", "purpose"], name="accounts_on_token_8a0f0d_idx"),
        ),
    ]
