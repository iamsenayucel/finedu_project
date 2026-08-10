// "Borçlanma ve Kredi" oyunu için merkezi veri.
// Bölüm 1: Matematiksel Karar Alma — 3 finansal senaryo, çoktan seçmeli (A/B/C), sırayla oynanır ve
//           cevaplandıktan sonra değiştirilemez (soru başı 20 puan, toplam 60 puan).
// Bölüm 2: Danışman Masası — 3 vaka, iki danışman yorumundan (A/B) finansal açıdan doğru olanı
//           seçme (vaka başı 20 puan, toplam 60 puan).
// Toplam 120 puan, tek kesintisiz süre 15 dakika.

export const GAME_DURATION_MS = 15 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_QUESTION1 = 20;
export const TOTAL_SECTION1_POINTS = 60;
export const POINTS_PER_QUESTION2 = 20;
export const TOTAL_SECTION2_POINTS = 60;
export const TOTAL_POINTS = 120;

export interface MathOption {
  id: 'A' | 'B' | 'C';
  label: string;
}

export interface MathQuestion {
  id: number;
  title: string;
  scenario: string;
  task: string;
  options: MathOption[];
  correctOptionId: 'A' | 'B' | 'C';
  explanation: string;
}

export const SECTION1_TITLE = 'Matematiksel Karar Alma';
export const SECTION1_INSTRUCTION =
  'Vaka metnini oku, verilen finansal bilgiler üzerinden hesabı yap ve görevdeki soruya en doğru cevabı seç. Bir soruyu cevapladıktan sonra cevabını değiştiremezsin.';

export const SECTION1_QUESTIONS: MathQuestion[] = [
  {
    id: 1,
    title: 'Soru 1 — Vade Etkisinin Gerçek Bedeli',
    scenario:
      'Can, peşin fiyatı 20.000 TL olan bir oyun bilgisayarı almak istiyor. Mağaza iki farklı ödeme planı sunuyor:\n\nPlan A: 10 ay × aylık 2.400 TL\nPlan B: 24 ay × aylık 1.400 TL\n\nCan, "Aylık 1.400 TL ödemek daha kolay." diyerek Plan B\'yi seçiyor.',
    task: 'Can, Plan B\'yi seçerek Plan A\'ya göre bankaya kaç TL daha fazla kredi maliyeti ödemiş olur?',
    options: [
      { id: 'A', label: '1.000 TL' },
      { id: 'B', label: '9.600 TL' },
      { id: 'C', label: '33.600 TL' },
    ],
    correctOptionId: 'B',
    explanation:
      'Plan A toplam ödeme: 10 × 2.400 = 24.000 TL. Plan B toplam ödeme: 24 × 1.400 = 33.600 TL. Aradaki fark: 33.600 - 24.000 = 9.600 TL.',
  },
  {
    id: 2,
    title: 'Soru 2 — Fayda-Maliyet / Yatırım Getirisi',
    scenario:
      'Ece, grafik tasarım işleri yapmak için peşin fiyatı 50.000 TL olan profesyonel bir çizim tableti alıyor. 24 ay kredi kullanıyor ve aylık 3.000 TL geri ödeme yapıyor. Ece bu tabletle yaptığı çizimlerden ayda ortalama 5.000 TL ek gelir elde ediyor.',
    task:
      '24 ayın sonunda Ece\'nin kredi borcu tamamen bittiğinde bu süreçten elde ettiği net kâr kaç TL olur? (Net Kâr = Toplam Gelir - Toplam Gider)',
    options: [
      { id: 'A', label: '48.000 TL' },
      { id: 'B', label: '72.000 TL' },
      { id: 'C', label: '120.000 TL' },
    ],
    correctOptionId: 'A',
    explanation:
      'Toplam gelir: 24 × 5.000 = 120.000 TL. Toplam kredi ödemesi: 24 × 3.000 = 72.000 TL. Net kâr: 120.000 - 72.000 = 48.000 TL.',
  },
  {
    id: 3,
    title: 'Soru 3 — Tersine Mühendislik / Peşin Fiyatı Bulma',
    scenario:
      'Mert, çok beğendiği bir elektrikli bisikleti "Hiç peşinatsız, ayda sadece 1.500 TL" kampanyasıyla 36 ay taksitle satın alıyor. Sözleşmeyi imzaladıktan sonra bu işlem için toplam 14.000 TL finansman gideri ödeyeceğini fark ediyor.',
    task: 'Elektrikli bisikletin kredisiz peşin fiyatı gerçekte kaç TL\'dir?',
    options: [
      { id: 'A', label: '40.000 TL' },
      { id: 'B', label: '54.000 TL' },
      { id: 'C', label: '68.000 TL' },
    ],
    correctOptionId: 'A',
    explanation: 'Toplam ödeme: 36 × 1.500 = 54.000 TL. Peşin fiyat: 54.000 - 14.000 = 40.000 TL.',
  },
];

export interface AdvisorOption {
  id: 'A' | 'B';
  label: string;
}

export interface AdvisorCase {
  id: number;
  title: string;
  personLabel: string;
  quote: string;
  options: AdvisorOption[];
  correctOptionId: 'A' | 'B';
  concept: string;
}

export const SECTION2_TITLE = 'Danışman Masası';
export const SECTION2_INSTRUCTION =
  'Sen bir finansal danışmansın. Önce sana iletilen görüş veya öneriyi oku, ardından sunulan iki danışman yorumundan borçlanma prensiplerine göre finansal açıdan doğru olanı seç.';

export const SECTION2_CASES: AdvisorCase[] = [
  {
    id: 1,
    title: 'Vaka 1 — Kurnaz Satıcının İkna Çabası',
    personLabel: 'Satıcının cümlesi:',
    quote:
      'Öğrenci kardeşim, fiyatı hiç dert etme. Kredi kartına 12 ay yerine 36 ay taksit yapalım, bak aylık ödemen 3.000 TL\'den 1.200 TL\'ye düşüyor. Cebinden hissetmeden çıkacak, sudan ucuz!',
    options: [
      {
        id: 'A',
        label: 'Haklısın, enflasyon olduğu için ileride 1.200 TL\'nin değeri düşecek, bu teklif çok mantıklı.',
      },
      {
        id: 'B',
        label:
          'Aylık ödemenin düşük görünmesi yanıltıcı olabilir. Vade 3 katına çıktığı için toplam finansman gideri önemli ölçüde artabilir. Sadece aylık taksite değil, toplam borca odaklanmalıyım.',
      },
    ],
    correctOptionId: 'B',
    concept: 'Taksit Yanılgısı ve Toplam Bakış',
  },
  {
    id: 2,
    title: 'Vaka 2 — Heyecanlı Arkadaşın Tavsiyesi',
    personLabel: 'Arkadaşın cümlesi:',
    quote:
      'Kanka, yurt dışı dil kampına gitmek için eğitim kredisi çekeceksin anlıyorum ama 50.000 TL için bankaya toplam 85.000 TL geri ödemek tam bir delilik. O parayla 3 tane son model telefon alırdık. Gitme boş ver!',
    options: [
      {
        id: 'A',
        label: 'Doğru söylüyorsun, bir hizmet için 35.000 TL kredi maliyeti ödenmez, parayı telefona yatırmak daha kârlı.',
      },
      {
        id: 'B',
        label:
          'Bu bir tüketim değil, yatırım harcamasıdır. Dil kampı sayesinde elde edeceğim dil sertifikası ve yurt dışı vizyonu gelecekteki kariyerimde bana bu maliyetten daha yüksek gelir ve fırsatlar sağlayabilir.',
      },
    ],
    correctOptionId: 'B',
    concept: 'Fayda-Maliyet değerlendirmesi',
  },
  {
    id: 3,
    title: 'Vaka 3 — Sosyal Medya Fenomeninin Paylaşımı',
    personLabel: 'Fenomenin cümlesi:',
    quote:
      'Arkadaşlar bu ayakkabılar sınırlı üretim, stoklar bitiyor! Limitiniz yoksa bile hemen uygulamadan taksitli nakit avans çekin, bu fırsat kaçmaz! Nasıl olsa bir şekilde ödersiniz!',
    options: [
      {
        id: 'A',
        label: 'Sınırlı üretim olduğu için ileride değerlenebilir, nakit avans çekerek bir nevi yatırım yapmış olurum.',
      },
      {
        id: 'B',
        label:
          'Bütçede karşılığı olmayan lüks bir tüketim için yüksek maliyetli nakit avans kullanmak duygusal ve plansız bir borçlanmaya neden olur. Fayda sağlamayan bir ürün için bu maliyete katlanmak doğru değildir.',
      },
    ],
    correctOptionId: 'B',
    concept: 'Nakit Avans Maliyeti ve Plansız Borçlanma',
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 120) return { label: 'Kredi ve Borçlanma Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 90) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 60) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 30) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
