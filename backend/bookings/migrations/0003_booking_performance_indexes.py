# Booking performance indexes for customer and barbershop queries

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0002_booking_concurrency_indexes'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['customer', '-booking_time'], name='customer_bookings_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['barbershop', 'booking_status', '-booking_time'], name='barbershop_status_time_idx'),
        ),
    ]
