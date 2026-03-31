from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_unit_order'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='streak_days',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='customuser',
            name='last_activity_date',
            field=models.DateField(null=True, blank=True),
        ),
    ]
