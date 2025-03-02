# Generated by Django 5.0.4 on 2024-04-18 14:17

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main_app', '0008_orderproductsdetails_sell_price_per_kilo'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customers',
            name='email',
        ),
        migrations.RemoveField(
            model_name='customers',
            name='first_name',
        ),
        migrations.RemoveField(
            model_name='customers',
            name='last_name',
        ),
        migrations.AddField(
            model_name='customers',
            name='user',
            field=models.OneToOneField(default=2, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='orders',
            name='customer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
        ),
    ]
