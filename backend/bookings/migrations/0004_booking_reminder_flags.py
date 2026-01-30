# Booking reminder push flags for 24h/1h Celery tasks

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_booking_performance_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='notification_sent_24h',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='booking',
            name='notification_sent_1h',
            field=models.BooleanField(default=False),
        ),
    ]
