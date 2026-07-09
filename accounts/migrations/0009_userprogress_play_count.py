from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_customuser_streak'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprogress',
            name='play_count',
            field=models.IntegerField(default=1),
        ),
    ]
