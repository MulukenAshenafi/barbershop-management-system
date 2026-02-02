# StaffInvitation model and Barbershop.deleted_at (soft delete)

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('barbershops', '0002_add_slug_subdomain_opening_hours'),
    ]

    operations = [
        migrations.AddField(
            model_name='barbershop',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='StaffInvitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('role', models.CharField(choices=[('Barber', 'Barber'), ('Admin', 'Admin')], default='Barber', max_length=20)),
                ('token', models.CharField(db_index=True, max_length=64, unique=True)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('barbershop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='staff_invitations', to='barbershops.barbershop')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_invitations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'barbershop_staff_invitations',
            },
        ),
        migrations.AddIndex(
            model_name='staffinvitation',
            index=models.Index(fields=['email', 'barbershop'], name='barbershop__email_9a1f2a_idx'),
        ),
    ]
