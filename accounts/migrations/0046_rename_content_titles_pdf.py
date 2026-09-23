from django.db import migrations

TITLE_UPDATES = {
    'economic_terms': '💡 Finansal Sistem Kavramlarını Keşfet - 1',
    'financial_concept_hunt': '🧠 Finansal Sistem - Ölçme Değerlendirme 1',
    'money_flow': '💸 Finansal Sistem Kavramlarını Keşfet - 2',
    'financial_system_concepts_2': '🧭 Finansal Sistem - Ölçme Değerlendirme 2',
    'economic_glossary_match': '📖 Ekonomi Sözlüğü',

    'investment_methods': '💹 Yasal Yatırım Araçlarını Keşfet',
    'legal_investment_assessment': '📊 Yasal Yatırım Araçları - Ölçme ve Değerlendirme',
    'legal_investment_glossary_puzzle': '⚖️ Ekonomi Sözlüğü',

    'asset_income_expense_assessment': '💻 Aktif ve Pasif Varlık Mantığı - 1',
    'investment_consumption_case_assessment': '⚖️ Aktif ve Pasif Varlık Mantığı - Ölçme Değerlendirme 1',
    'asset_liability_glossary_puzzle': '🧩 Ekonomi Sözlüğü',

    'revenue_matching': '💰 Gelir Türleri - 1',
    'income_type_assessment': '💵 Gelir Türleri - Ölçme Değerlendirme 1',
    'future_choice': '🎯 Gelir Türleri - 2',
    'income_glossary_puzzle': '💰 Ekonomi Sözlüğü',

    'short_long_term_impact': '⏳ Kısa ve Uzun Vadeli Finansal Etki - 1',
    'short_long_term_glossary_puzzle': '🧩 Ekonomi Sözlüğü',

    'risk_return_tradeoff': '📈 Risk Getiri Dengesi - 1',
    'market_detective': '🐂 Risk Getiri Dengesi - Ölçme Değerlendirme 1',
    'risk_hunter': '🎯 Risk Getiri Dengesi - 2',
    'portfolio_master': '💼 Risk Getiri Dengesi - Ölçme Değerlendirme 2',
    'risk_glossary_puzzle': '🧩 Ekonomi Sözlüğü',

    'credit_card_awareness': '💳 Sağlıklı Borçlanma ve Kredi Kullanımı - 1',
    'debt_credit_assessment_2': '🧮 Sağlıklı Borçlanma ve Kredi Kullanımı - Ölçme Değerlendirme 1',
    'credit_cost_analysis': '🧮 Sağlıklı Borçlanma ve Kredi Kullanımı - 2',
    'debt_credit_assessment': '🏦 Sağlıklı Borçlanma ve Kredi Kullanımı - Ölçme Değerlendirme 2',
    'credit_financing_glossary_puzzle': '🧩 Ekonomi Sözlüğü',

    'scam_detector': '🕵️ Finansal Güvenlik Yöntemleri - 1',
    'legal_investment_assessment_2': '🔐 Finansal Güvenlik Yöntemleri - Ölçme Değerlendirme 1',
    'fraud_hunt_glossary_puzzle': '🎣 Ekonomi Sözlüğü',

    'real_data_hunter': '🔍 Finansal Medya Okuryazarlığı - 1',
    'information_filter': '🛡️ Finansal Medya Okuryazarlığı - Ölçme Değerlendirme 1',
    'financial_detective': '🕵️‍♂️ Finansal Medya Okuryazarlığı - 2',
    'media_literacy_assessment': '📰 Finansal Medya Okuryazarlığı - Ölçme Değerlendirme 2',
    'media_glossary_puzzle': '🧩 Ekonomi Sözlüğü',
}


def rename_titles(apps, schema_editor):
    Content = apps.get_model('accounts', 'Content')
    for game_code, new_title in TITLE_UPDATES.items():
        Content.objects.filter(game_code=game_code).update(title=new_title)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0045_update_content_titles_pdf'),
    ]

    operations = [
        migrations.RunPython(rename_titles, noop),
    ]
