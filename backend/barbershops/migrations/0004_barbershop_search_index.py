# Barbershop search index for public discovery

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('barbershops', '0003_staff_invitation_and_soft_delete'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='barbershop',
            index=models.Index(fields=['name', 'city'], name='shop_search_idx'),
        ),
    ]
