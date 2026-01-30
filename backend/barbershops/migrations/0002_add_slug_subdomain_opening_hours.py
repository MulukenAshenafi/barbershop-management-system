# Generated migration: add slug, subdomain, opening_hours, logo, is_verified, subscription_status

from django.db import migrations, models


def generate_subdomain_for_existing(apps, schema_editor):
    """Generate slug and subdomain for existing barbershops."""
    import random
    import string
    Barbershop = apps.get_model('barbershops', 'Barbershop')
    for b in Barbershop.objects.all():
        if not b.slug:
            slug = (b.name or 'shop').lower().replace(' ', '-')
            slug = ''.join(c for c in slug if c in string.ascii_lowercase + string.digits + '-')
            slug = '-'.join(filter(None, slug.split('-')))
            if not slug:
                slug = 'shop'
            base = slug
            n = 0
            while Barbershop.objects.filter(slug=slug).exclude(pk=b.pk).exists():
                n += 1
                slug = f'{base}-{n}'
            b.slug = slug
        if not b.subdomain:
            slug = (b.slug or 'shop').lower()
            suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            subdomain = f'{slug}-{suffix}'
            while Barbershop.objects.filter(subdomain=subdomain).exclude(pk=b.pk).exists():
                suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
                subdomain = f'{slug}-{suffix}'
            b.subdomain = subdomain
        b.save()


class Migration(migrations.Migration):

    dependencies = [
        ('barbershops', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='barbershop',
            name='slug',
            field=models.SlugField(blank=True, db_index=False, max_length=200, null=True, unique=False),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='subdomain',
            field=models.CharField(blank=True, db_index=False, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='opening_hours',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='logo_url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='logo_public_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='barbershop',
            name='subscription_status',
            field=models.CharField(default='trial', max_length=20),
        ),
        migrations.RunPython(generate_subdomain_for_existing, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='barbershop',
            name='slug',
            field=models.SlugField(blank=False, db_index=True, max_length=200, unique=True),
        ),
        migrations.AlterField(
            model_name='barbershop',
            name='subdomain',
            field=models.CharField(blank=True, db_index=True, max_length=50, unique=True),
        ),
    ]
