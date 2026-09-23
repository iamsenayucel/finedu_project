// Tek kaynak: admin panelindeki oyun seçim listesi (value + label).
//
// Bu liste GameContainer.tsx'teki switch case'leriyle 1:1 eşleşmelidir —
// her yeni oyun eklendiğinde üç yer güncellenmelidir:
//   1) bu dosya (admin seçim listesi)
//   2) GameContainer.tsx switch (fiili render)
//   3) backend Content.GAME_CHOICES (accounts/models.py) — sunucu tarafı
//      kabul edilen değerler; accounts/tests.py içindeki
//      GameRegistryConsistencyTests bu dosyadaki her "value"nun backend
//      choices listesinde de bulunduğunu otomatik doğrular.
export interface GameOption {
  value: string;
  label: string;
}

export const GAME_OPTIONS: GameOption[] = [
  { value: "financial_detective", label: "🕵️‍♂️ Finansal Haber Dedektifi (10. Sınıf)" },
  { value: "drag_drop_needs", label: "🛒 İstek mi İhtiyaç mı? (İlkokul)" },
  { value: "risk_hunter", label: "🎯 FinEdu Yatırım Okulu" },
  { value: "real_data_hunter", label: "🔍 Gerçek Veri Avı - Bilgi Doğrulama" },
  { value: "space_shopping_depot", label: "🚀 Uzay Alışveriş Deposu - İstek & İhtiyaç" },
  { value: "risk_return_tradeoff", label: "📈 Mirasın Kaderi - Risk & Getiri" },
  { value: "economic_terms", label: "💡 Ekonomi Terimleri - Kavram Eşleştirme" },
  { value: "money_flow", label: "💸 Para Akışı - Finansal Kurumlar" },
  { value: "revenue_matching", label: "💰 Aktif & Pasif Gelir - Eşleştirme Oyunu" },
  { value: "future_choice", label: "🎯 Geleceğini Seç - Risk mi Güven mi?" },
  { value: "investment_methods", label: "💹 Yasal Yatırım Yöntemleri - Kavram Eşleştirme" },
  { value: "scam_detector", label: "🕵️ Dolandırıcı Avı - Gerçek mi Tuzak mı?" },
  { value: "financial_concept_hunt", label: "📊 Finansal Sistem: Kavram Avı - Ölçme Değerlendirme" },
  { value: "financial_system_concepts_2", label: "📊 Finansal Sistem Kavramlarını Keşfet-2 - Ölçme Değerlendirme" },
  { value: "income_type_assessment", label: "📊 Gelir Türü - Ölçme Değerlendirme" },
  { value: "media_literacy_assessment", label: "📊 Finansal Medya Okuryazarlığı - Ölçme Değerlendirme" },
  { value: "credit_card_awareness", label: "💳 Bilinçli Kredi Kartı Kullanımı" },
  { value: "credit_cost_analysis", label: "🧮 Kredi Maliyeti Analizi" },
  { value: "investment_or_consumption", label: "⚖️ Yatırım mı, Tüketim mi?" },
  { value: "information_filter", label: "🛡️ Bilgi Filtresi - Finansal Medya Okuryazarlığı" },
  { value: "market_detective", label: "🐂 Piyasa Dedektifi & Davranışsal Finans Testi" },
  { value: "portfolio_master", label: "💼 Portföy Ustası - Portföy Matrisi & Bitirme Testi" },
  { value: "legal_investment_assessment", label: "📊 Yasal Yatırım Yöntemleri - Ölçme ve Değerlendirme" },
  { value: "legal_investment_assessment_2", label: "📊 Siber Güvenlik ve Dolandırıcılık Tespiti - Ölçme Değerlendirme" },
  { value: "economic_glossary_match", label: "🧩 Ekonomi Sözlüğü - Sürükle-Bırak Bulmaca" },
  { value: "media_glossary_puzzle", label: "🧩 Finansal Medya Okuryazarlığı - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "income_glossary_puzzle", label: "🧩 Gelir Türleri ve Finansal Kavramlar - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "risk_glossary_puzzle", label: "🧩 Risk Yönetimi ve Piyasa Kavramları - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "credit_financing_glossary_puzzle", label: "🧩 Akademik Kredi ve Finansman - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "fraud_hunt_glossary_puzzle", label: "🧩 Dolandırıcılık Avı - Akademik Finansal Güvenlik (Sürükle-Bırak Bulmaca)" },
  { value: "legal_investment_glossary_puzzle", label: "🧩 Yasal Yatırım ve Finansal Kavramlar - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "debt_credit_assessment", label: "📊 Borçlanma ve Kredi - Ölçme Değerlendirme" },
  { value: "debt_credit_assessment_2", label: "📊 Borçlanma ve Kredi: Akıllı Tüketici Testi - Ölçme Değerlendirme" },
  { value: "asset_liability_glossary_puzzle", label: "🧩 Aktif & Pasif Yönetimi - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "asset_income_expense_assessment", label: "📊 Senin Varlığın Ne Üretiyor? - Ölçme Değerlendirme" },
  { value: "short_long_term_impact", label: "⏳ Kısa ve Uzun Vadeli Finansal Etki - Karar ve Eşleştirme" },
  { value: "short_long_term_glossary_puzzle", label: "🧩 Kısa ve Uzun Vadeli Finansal Etki - Ekonomi Sözlüğü (Sürükle-Bırak Bulmaca)" },
  { value: "investment_consumption_case_assessment", label: "📊 Yatırım mı, Tüketim mi? - Vaka Ölçme Değerlendirmesi" },
];
