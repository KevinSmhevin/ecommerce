# Generated by Django 5.1.3 on 2024-12-17 16:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payment', '0007_order_courier_order_tracking_number'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='id',
            field=models.BigAutoField(primary_key=True, serialize=False),
        ),
    ]
