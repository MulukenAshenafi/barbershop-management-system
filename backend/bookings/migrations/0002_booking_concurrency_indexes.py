# Concurrency: unique booked slot per barber/date/start_time, index for availability

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='timeslot',
            index=models.Index(
                fields=['barber', 'date', 'is_booked'],
                name='time_slots_barber_date_booked_idx',
            ),
        ),
        migrations.AddConstraint(
            model_name='timeslot',
            constraint=models.UniqueConstraint(
                condition=models.Q(is_booked=True),
                fields=('barber', 'date', 'start_time'),
                name='unique_booked_slot',
            ),
        ),
    ]
