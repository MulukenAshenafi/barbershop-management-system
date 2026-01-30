# Barbershop geo fields (latitude, longitude) for "barbershops near me"
# Uses Haversine in-app; optional: switch to PostGIS for spatial index (see README).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('barbershops', '0004_barbershop_search_index'),
    ]

    operations = [
        migrations.AddField(
            model_name='barbershop',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
    ]
