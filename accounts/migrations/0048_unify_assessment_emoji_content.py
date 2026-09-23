from django.db import migrations

TITLE_UPDATES = {
    'financial_concept_hunt': '📊 Finansal Sistem - Ölçme Değerlendirme 1',
    'financial_system_concepts_2': '📊 Finansal Sistem - Ölçme Değerlendirme 2',
    'legal_investment_assessment': '📊 Yasal Yatırım Araçları - Ölçme ve Değerlendirme',
    'investment_consumption_case_assessment': '📊 Aktif ve Pasif Varlık Mantığı - Ölçme Değerlendirme 1',
    'income_type_assessment': '📊 Gelir Türleri - Ölçme Değerlendirme 1',
    'market_detective': '📊 Risk Getiri Dengesi - Ölçme Değerlendirme 1',
    'portfolio_master': '📊 Risk Getiri Dengesi - Ölçme Değerlendirme 2',
    'debt_credit_assessment_2': '📊 Sağlıklı Borçlanma ve Kredi Kullanımı - Ölçme Değerlendirme 1',
    'debt_credit_assessment': '📊 Sağlıklı Borçlanma ve Kredi Kullanımı - Ölçme Değerlendirme 2',
    'legal_investment_assessment_2': '📊 Finansal Güvenlik Yöntemleri - Ölçme Değerlendirme 1',
    'information_filter': '📊 Finansal Medya Okuryazarlığı - Ölçme Değerlendirme 1',
    'media_literacy_assessment': '📊 Finansal Medya Okuryazarlığı - Ölçme Değerlendirme 2',
}


def rename_titles(apps, schema_editor):
    Content = apps.get_model('accounts', 'Content')
    for game_code, new_title in TITLE_UPDATES.items():
        Content.objects.filter(game_code=game_code).update(title=new_title)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0047_unify_assessment_emoji'),
    ]

    operations = [
        migrations.RunPython(rename_titles, noop),
    ]
