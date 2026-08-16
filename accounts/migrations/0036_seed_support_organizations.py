from django.db import migrations


ORGANIZATIONS = [
    {
        'name': 'TEMA Vakfı',
        'description': "Ülkemizin doğasını ve topraklarını korumak, çölleşmeyi önlemek için çalışır.",
        'impact_text': "Bu tercihin, doğanın ve toprağın korunmasına verdiğin önemi gösteriyor.",
        'display_order': 1,
    },
    {
        'name': 'LÖSEV',
        'description': "Lösemili çocuklara sağlık, eğitim ve psikolojik destek sunar.",
        'impact_text': "Bu tercihin, sağlık mücadelesi veren çocuklara destek olmayı önemsediğini gösteriyor.",
        'display_order': 2,
    },
    {
        'name': 'TEGV (Türkiye Eğitim Gönüllüleri Vakfı)',
        'description': "Çocuklara okul dışı zamanlarda nitelikli eğitim desteği verir.",
        'impact_text': "Bu tercihin, çocukların eğitim olanaklarının geliştirilmesine verdiğin önemi gösteriyor.",
        'display_order': 3,
    },
    {
        'name': 'Mehmetçik Vakfı',
        'description': "Şehit ve gazi ailelerine ve çocuklarına destek olur.",
        'impact_text': "Bu tercihin, şehit ve gazi ailelerine destek verilmesini önemsediğini gösteriyor.",
        'display_order': 4,
    },
]


def seed_organizations(apps, schema_editor):
    SupportOrganization = apps.get_model('accounts', 'SupportOrganization')
    for org in ORGANIZATIONS:
        SupportOrganization.objects.get_or_create(
            name=org['name'],
            defaults={
                'description': org['description'],
                'impact_text': org['impact_text'],
                'display_order': org['display_order'],
                'is_active': True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0035_supportorganization_studentsupportpreference'),
    ]

    operations = [
        migrations.RunPython(seed_organizations, migrations.RunPython.noop),
    ]
