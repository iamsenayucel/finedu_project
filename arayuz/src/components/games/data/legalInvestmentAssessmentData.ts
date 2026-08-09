// "Yasal Yatırım Yöntemleri – Ölçme ve Değerlendirme" oyunu için merkezi veri.
// Bölüm 1: Kavram Eşleştirme — 4 soru, soru başı 10 puan, toplam 40 puan.
// Bölüm 2: Senaryo Analizi — 4 senaryo, senaryo başı 10 puan, toplam 40 puan.
// Bölüm 3: Risk Dağılımı — 6 yatırım aracının anket/matris mantığıyla risk sınıflandırması, toplam 20 puan.
// Toplam 100 puan, tek kesintisiz süre 25 dakika.

export const GAME_DURATION_MS = 25 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_SECTION1_QUESTION = 10;
export const TOTAL_SECTION1_POINTS = 40;
export const POINTS_PER_SECTION2_QUESTION = 10;
export const TOTAL_SECTION2_POINTS = 40;
export const TOTAL_SECTION3_POINTS = 20;
export const TOTAL_POINTS = 100;

export const SECTION_LABELS = ['Kavram Eşleştirme', 'Senaryo Analizi', 'Risk Dağılımı'];

// ── Bölüm 1: Kavram Eşleştirme ───────────────────────────────────────────────

export interface ConceptQuestion {
  id: number;
  description: string;
  options: string[];
  correctAnswer: string;
}

export const SECTION1_TITLE = 'Kavram Eşleştirme';
export const SECTION1_INSTRUCTION =
  'Aşağıdaki açıklamanın hangi yatırım aracına ait olduğunu seçeneklerden seç. Her soru yalnızca bir kez cevaplanabilir.';

export const SECTION1_QUESTIONS: ConceptQuestion[] = [
  {
    id: 1,
    description:
      'İçinde farklı yatırım araçlarının (hisse, tahvil, altın vb.) bulunduğu ve paranı senin yerine lisanslı finans profesyonellerinin yönettiği risksizleştirilmiş finansal sepettir.',
    options: ['Hisse Senedi', 'Vadeli Mevduat', 'Yatırım Fonu', 'Döviz'],
    correctAnswer: 'Yatırım Fonu',
  },
  {
    id: 2,
    description:
      'Devletin, belirli bir süre sonra faiziyle birlikte geri ödemek üzere kendi vatandaşından resmi olarak borç aldığı, devlet güvencesindeki yatırım aracıdır.',
    options: ['BES', 'Altın', 'Devlet Tahvili', 'Hisse Senedi'],
    correctAnswer: 'Devlet Tahvili',
  },
  {
    id: 3,
    description:
      'Gelecekteki rahatlığın için kurulan, en büyük avantajı senin yatırdığın paraya ek olarak devletin de kendi kasasından "Devlet Katkısı" eklediği uzun vadeli birikim sistemidir.',
    options: ['Vadeli Mevduat', 'BES (Bireysel Emeklilik)', 'Yatırım Fonu', 'Döviz'],
    correctAnswer: 'BES (Bireysel Emeklilik)',
  },
  {
    id: 4,
    description:
      'Borsada işlem gören bir şirketin küçük bir parçasıdır. Bunu aldığında o şirkete ortak olursun; şirket büyürse kazanırsın, batarsa kaybedersin.',
    options: ['Devlet Tahvili', 'Hisse Senedi', 'Altın', 'Vadeli Mevduat'],
    correctAnswer: 'Hisse Senedi',
  },
];

export const SECTION1_PANEL = {
  dictionary: [
    { term: 'Risk', def: 'Bir yatırımın beklenen getiriyi sağlayamama ya da değer kaybetme ihtimalidir.' },
    { term: 'Getiri', def: 'Bir yatırımdan belirli bir süre sonunda elde edilen kazanç veya kayıptır.' },
    { term: 'Vade', def: 'Bir yatırımın veya borcun sona erdiği, paranın geri alınabildiği süredir.' },
  ],
  strategyTitle: 'Kavramları Ayırt Et',
  strategyTips: [
    { title: 'Kim Yönetiyor?', desc: 'Paranı bizzat sen mi yönetiyorsun yoksa bir profesyonel/kurum mu? Bu ayrım birçok aracı birbirinden ayırır.' },
    { title: 'Kim Garanti Ediyor?', desc: 'Devlet güvencesi olan araçlarla piyasa riskine açık araçları karıştırma.' },
    { title: 'Tekil mi, Sepet mi?', desc: 'Tek bir şirkete mi ortak oluyorsun, yoksa birden fazla aracı bir arada barındıran bir sepete mi yatırım yapıyorsun?' },
  ],
};

// ── Bölüm 2: Senaryo Analizi ─────────────────────────────────────────────────

export interface ScenarioQuestion {
  id: number;
  person: string;
  title: string;
  quote: string;
  correctAnswer: string;
  rationale: string;
}

export const SECTION2_TITLE = 'Senaryo Analizi';
export const SECTION2_INSTRUCTION =
  'Kişinin finansal hedeflerine ve risk yaklaşımına en uygun yatırım aracını seç.';

export const SCENARIO_OPTIONS: string[] = [
  'Hisse Senedi',
  'Vadeli Mevduat',
  'Yatırım Fonu',
  'Döviz',
  'BES',
  'Altın',
  'Devlet Tahvili',
];

export const SECTION2_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 1,
    person: 'Mert',
    title: 'Garanti Peşindeki Mert',
    quote:
      'Ben sürprizleri hiç sevmem. Paramın batma ihtimali sıfır olmalı. Gelecekte ne kadar kazanacağımı bugünden kuruşu kuruşuna bilmek istiyorum. Stres bana göre değil.',
    correctAnswer: 'Vadeli Mevduat',
    rationale: 'Mert düşük risk tercih eden bir yatırımcıdır.',
  },
  {
    id: 2,
    person: 'Zeynep',
    title: 'Meşgul Zeynep',
    quote:
      'Çok yoğun çalışıyorum, grafikleri izleyecek vaktim yok. Paramı farklı araçlara dağıtmak, yani riski dağıtmak istiyorum ama bunu benim yerime uzmanlar yapsın.',
    correctAnswer: 'Yatırım Fonu',
    rationale: 'Zeynep profesyoneller tarafından yönetilen ve farklı yatırım araçlarını bir arada bulundurabilen bir yatırım aracına ihtiyaç duymaktadır.',
  },
  {
    id: 3,
    person: 'Burak',
    title: 'Gözü Kara Burak',
    quote:
      'Ben risk almayı severim! Bir şirketin kârına ortak olmak istiyorum. Kısa vadede paramın düşmesi beni korkutmaz, ben büyük kazançların peşindeyim.',
    correctAnswer: 'Hisse Senedi',
    rationale: 'Burak yüksek risk almaya isteklidir ve doğrudan şirket performansına ortak olmak istemektedir.',
  },
  {
    id: 4,
    person: 'Ece',
    title: 'Geleceği Düşünen Ece',
    quote:
      'Gelecekte maddi güvence oluşturmak ve emeklilik dönemimde rahat etmek istiyorum. Ayrıca yatırdığım paraya devletin de karşılıksız destek/katkı sağladığını öğrenince ilgim çok arttı.',
    correctAnswer: 'BES',
    rationale: "Emeklilik hedefi ve devlet katkısı doğrudan BES'i (Bireysel Emeklilik Sistemi) işaret etmektedir.",
  },
];

export const SECTION2_PANEL = {
  dictionary: [
    { term: 'Yatırımcı Profili', def: 'Bir kişinin risk toleransına, hedeflerine ve vadeye göre şekillenen yatırım tercihi eğilimidir.' },
    { term: 'Risk Toleransı', def: 'Bir yatırımcının değer kaybı ihtimaline ne kadar dayanabildiğini gösteren kişisel eşiktir.' },
    { term: 'Çeşitlendirme', def: 'Riski azaltmak için paranın tek bir araca değil, birden fazla araca dağıtılmasıdır.' },
  ],
  strategyTitle: 'Kişiyi Doğru Oku',
  strategyTips: [
    { title: 'Anahtar İfadeleri Yakala', desc: '"Sıfır risk", "vaktim yok", "büyük kazanç", "emeklilik" gibi ifadeler doğrudan doğru araca işaret eder.' },
    { title: 'Hedefi Belirle', desc: 'Kişi kısa vadeli güvenlik mi, uzun vadeli birikim mi, yoksa yüksek getiri mi istiyor?' },
    { title: 'Duyguyu Değil İhtiyacı Değerlendir', desc: 'Kararını kişinin heyecanına değil, açıkça belirttiği ihtiyaca göre ver.' },
  ],
};

// ── Bölüm 3: Risk Dağılımı ───────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';

export const RISK_LEVELS: { id: RiskLevel; label: string; color: string }[] = [
  { id: 'low', label: 'Düşük Risk', color: 'emerald' },
  { id: 'medium', label: 'Orta Risk', color: 'amber' },
  { id: 'high', label: 'Yüksek Risk', color: 'red' },
];

export interface InvestmentInstrument {
  id: string;
  label: string;
  correctRisk: RiskLevel;
}

export const SECTION3_TITLE = 'Risk Dağılımı';
export const SECTION3_INSTRUCTION =
  'Aşağıdaki 6 yatırım aracının her biri için "Düşük Risk", "Orta Risk" veya "Yüksek Risk" seçeneklerinden yalnızca birini seç. Tamamlamadan önce seçimini istediğin kadar değiştirebilirsin.';

export const INSTRUMENTS: InvestmentInstrument[] = [
  { id: 'vadeli_mevduat', label: 'Vadeli Mevduat', correctRisk: 'low' },
  { id: 'devlet_tahvili', label: 'Devlet Tahvili', correctRisk: 'low' },
  { id: 'altin', label: 'Altın', correctRisk: 'medium' },
  { id: 'yatirim_fonu', label: 'Yatırım Fonu', correctRisk: 'medium' },
  { id: 'hisse_senedi', label: 'Hisse Senedi', correctRisk: 'high' },
  { id: 'doviz', label: 'Döviz', correctRisk: 'high' },
];

export const SECTION3_PANEL = {
  dictionary: [
    { term: 'Düşük Risk', def: 'Anaparanın korunma ihtimalinin yüksek, getiri dalgalanmasının çok az olduğu yatırım seviyesidir.' },
    { term: 'Orta Risk', def: 'Belirli ölçüde değer dalgalanması taşıyan, hem kazanç hem kayıp ihtimali barındıran seviyedir.' },
    { term: 'Yüksek Risk', def: 'Getiri potansiyeli yüksek olmakla birlikte, değer kaybı ihtimalinin de belirgin olduğu seviyedir.' },
  ],
  strategyTitle: 'Sınıflandırma İpucu',
  strategyTips: [
    { title: 'Güvenceyi Sorgula', desc: 'Devlet güvencesi olan araçlar genellikle düşük risklidir.' },
    { title: 'Dalgalanmayı Düşün', desc: 'Değeri günlük/anlık değişen araçlar (borsa, döviz) daha yüksek risk taşır.' },
    { title: 'Sepet Etkisini Unutma', desc: 'Birden fazla araca dağıtılmış sepetler (yatırım fonu) genelde tek bir varlıktan daha dengelidir.' },
  ],
};

// ── Performans / sonuç ────────────────────────────────────────────────────────

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Yatırım Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 70) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
