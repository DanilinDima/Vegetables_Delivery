# Generated by Django 5.0.4 on 2024-04-09 14:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main_app', '0006_alter_orders_courier'),
    ]

    operations = [
        migrations.AlterField(
            model_name='orders',
            name='courier',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='main_app.couriers'),
        ),
    ]
