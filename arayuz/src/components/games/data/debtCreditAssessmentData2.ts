// "Borçlanma ve Kredi: Akıllı Tüketici Testi" (Ölçme 2) için merkezi veri.
// Bölüm 1: Matematiksel Karar Alma — 3 vakada vade/kredi maliyeti/fayda-maliyet hesabı yapıp
//           doğru sonucu çoktan seçmeli (A/B/C) olarak bulma; sırayla oynanır ve cevaplandıktan
//           sonra değiştirilemez (soru başı 15 puan, toplam 45 puan).
// Bölüm 2: Danışman Masası — 3 vakada bir satıcı/arkadaş/fenomen cümlesi karşısında öğrencinin
//           savunması gereken doğru danışman yorumunu iki seçenek arasından (A/B) bulma;
//           sırayla oynanır ve cevaplandıktan sonra değiştirilemez (vaka başı 15 puan, toplam 45 puan).
// Toplam 90 puan, tek kesintisiz süre 15 dakika.

export const GAME_DURATION_MS = 15 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_QUESTION1 = 15;
export const TOTAL_SECTION1_POINTS = 45;
export const POINTS_PER_QUESTION2 = 15;
export const TOTAL_SECTION2_POINTS = 45;
export const TOTAL_POINTS = 90;

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
  'Her vakada bir kredi/taksit senaryosu anlatılır. Metni dikkatle oku, gerekli hesaplamayı zihninden veya kağıt üzerinde yap ve doğru sonucu üç seçenek arasından bul. Bir soruyu cevapladıktan sonra cevabını değiştiremezsin.';

export const SECTION1_QUESTIONS: MathQuestion[] = [
  {
    id: 1,
    title: 'Soru 1 — Vade Etkisinin Gerçek Bedeli (Kıyaslama Matematiği)',
    scenario:
      'Can, peşin fiyatı 20.000 TL olan bir oyun bilgisayarı almak istiyor. Mağaza ona iki farklı ödeme planı sunuyor:\nPlan A: 10 ay vade x Aylık 2.400 TL ödeme\nPlan B: 24 ay vade x Aylık 1.400 TL ödeme\nCan, "Aylık 1.400 TL ödemek daha kolay" diyerek Plan B\'yi seçiyor.',
    task: "Can, Plan B'yi seçerek Plan A'ya göre bankaya kaç TL daha fazla \"Kredi Maliyeti\" (finansman gideri) ödemiş olur?",
    options: [
      { id: 'A', label: '1.000 TL' },
      { id: 'B', label: '9.600 TL' },
      { id: 'C', label: '33.600 TL' },
    ],
    correctOptionId: 'B',
    explanation:
      'Plan A toplamda 10 × 2.400 = 24.000 TL öder (kredi maliyeti 24.000 − 20.000 = 4.000 TL). Plan B toplamda 24 × 1.400 = 33.600 TL öder (kredi maliyeti 33.600 − 20.000 = 13.600 TL). Aradaki fark 33.600 − 24.000 = 9.600 TL\'dir. Sadece aylık ödemeler arasındaki farkı (1.000 TL) çıkarmak ya da Plan A\'yı hiç hesaba katmadan Plan B\'nin toplamını (33.600 TL) cevap sanmak yaygın tuzaklardır.',
  },
  {
    id: 2,
    title: 'Soru 2 — Fayda-Maliyet (Yatırım Getirisi) İspatı',
    scenario:
      'Ece, grafik tasarım işleri yapmak için peşin fiyatı 50.000 TL olan profesyonel bir çizim tableti alıyor. 24 ay kredi kullanıyor ve aylık 3.000 TL geri ödeme yapıyor. Ece, bu tabletle yaptığı çizimlerden ayda ortalama 5.000 TL ek gelir elde ediyor.',
    task: "24 ayın sonunda, Ece'nin kredi borcu tamamen bittiğinde tüm bu süreçten elde ettiği Net Kâr (Toplam Gelir − Toplam Gider) kaç TL olur?",
    options: [
      { id: 'A', label: '48.000 TL' },
      { id: 'B', label: '72.000 TL' },
      { id: 'C', label: '120.000 TL' },
    ],
    correctOptionId: 'A',
    explanation:
      'Toplam Gelir = 24 × 5.000 = 120.000 TL. Toplam Gider (kredi ödemesi) = 24 × 3.000 = 72.000 TL. Net Kâr = 120.000 − 72.000 = 48.000 TL. Bankaya ödenen toplam borcu (72.000 TL) kâr sanmak ya da giderleri hiç düşmeden direkt gelire (120.000 TL) odaklanmak yaygın hatalardır.',
  },
  {
    id: 3,
    title: 'Soru 3 — Tersine Mühendislik (Peşin Fiyatı Bulma)',
    scenario:
      'Mert, çok beğendiği bir elektrikli bisikleti "Hiç peşinatsız, ayda sadece 1.500 TL" sloganıyla 36 ay taksitle satın alıyor. Sözleşmeyi imzaladıktan sonra evraklara bakıyor ve bu işlem için tam 14.000 TL "Finansman Gideri" (Kredi Maliyeti) ödeyeceğini fark ediyor.',
    task: "Buna göre bu elektrikli bisikletin kredisiz, çıplak Peşin Fiyatı gerçekte kaç TL'dir?",
    options: [
      { id: 'A', label: '40.000 TL' },
      { id: 'B', label: '54.000 TL' },
      { id: 'C', label: '68.000 TL' },
    ],
    correctOptionId: 'A',
    explanation:
      'Toplam ödenecek tutar 36 × 1.500 = 54.000 TL\'dir. Peşin fiyat, bu toplam tutardan finansman giderinin çıkarılmasıyla bulunur: 54.000 − 14.000 = 40.000 TL. Toplam ödenecek parayı (54.000 TL) direkt peşin fiyat sanmak ya da finansman giderini toplam tutarın üzerine bir daha eklemek (68.000 TL) yaygın hatalardır.',
  },
];

export interface AdvisorOption {
  id: 'A' | 'B';
  label: string;
}

export interface AdvisorCase {
  id: number;
  title: string;
  speakerLabel: string;
  quote: string;
  task: string;
  options: AdvisorOption[];
  correctOptionId: 'A' | 'B';
  explanation: string;
}

export const SECTION2_TITLE = 'Danışman Masası';
export const SECTION2_INSTRUCTION =
  'Her vakada biri seni bir borçlanma kararına yönlendirmeye çalışıyor. Cümleyi oku ve bir finansal danışman olsan hangi yorumu savunacağını iki seçenek arasından bul. Bir vakayı cevapladıktan sonra cevabını değiştiremezsin.';

export const SECTION2_CASES: AdvisorCase[] = [
  {
    id: 1,
    title: 'Vaka 1 — Kurnaz Satıcının İkna Çabası',
    speakerLabel: 'Satıcının Cümlesi:',
    quote:
      'Öğrenci kardeşim, fiyatı hiç dert etme. Kredi kartına 12 ay yerine 36 ay taksit yapalım, bak aylık ödemen 3.000 TL\'den 1.200 TL\'ye düşüyor. Cebinden hissetmeden çıkacak, sudan ucuz!',
    task: 'Öğrencinin Seçmesi Gereken Danışman Yorumu (Hangi kuralı savunmalı?)',
    options: [
      { id: 'A', label: "Haklısın, enflasyon olduğu için ileride 1.200 TL'nin değeri düşecek, bu teklif çok mantıklı." },
      {
        id: 'B',
        label:
          '(Taksit Yanılgısı & Toplam Bakış): Aylık ödemenin düşük görünmesi bir illüzyondur. Vade 3 katına çıktığı için bankaya ödeyeceğim toplam finansman gideri devasa oranda artacaktır. Sadece aylık tutara değil, toplam borca odaklanmalıyım.',
      },
    ],
    correctOptionId: 'B',
    explanation:
      'Aylık taksitin düşmesi, vadenin uzamasından kaynaklanır; bu, toplam ödenecek finansman giderinin arttığı gerçeğini gizleyen bir illüzyondur. Doğru karar, aylık tutar yerine toplam maliyete bakmaktır.',
  },
  {
    id: 2,
    title: 'Vaka 2 — Heyecanlı Arkadaşın Tavsiyesi',
    speakerLabel: 'Arkadaşın Cümlesi:',
    quote:
      'Kanka, yurt dışı dil kampına gitmek için eğitim kredisi çekeceksin anlıyorum ama 50.000 TL için bankaya toplam 85.000 TL geri ödemek tam bir delilik. O parayla 3 tane son model telefon alırdık. Gitme boş ver!',
    task: 'Öğrencinin Seçmesi Gereken Danışman Yorumu',
    options: [
      { id: 'A', label: 'Doğru söylüyorsun, bir hizmet için 35.000 TL kredi maliyeti ödenmez, parayı telefona yatırmak daha kârlı.' },
      {
        id: 'B',
        label:
          '(Fayda - Maliyet): Bu bir tüketim (telefon) değil, yatırım harcamasıdır. Dil kampı sayesinde elde edeceğim dil sertifikası ve yurt dışı vizyonu, gelecekteki kariyerimde bana bu 35.000 TL\'lik faiz maliyetinden çok daha yüksek bir gelir ve fırsat sağlayacaktır.',
      },
    ],
    correctOptionId: 'B',
    explanation:
      'Bir harcamanın maliyetini değerlendirirken sadece anlık tutara değil, o harcamanın gelecekte sağlayacağı faydaya (kariyer, gelir, fırsat) bakmak gerekir. Kendine yatırım niteliğindeki bir eğitim harcaması, tüketim harcamasıyla aynı kefeye konulamaz.',
  },
  {
    id: 3,
    title: 'Vaka 3 — Sosyal Medya Fenomeninin Paylaşımı',
    speakerLabel: 'Fenomenin Cümlesi:',
    quote:
      'Arkadaşlar bu ayakkabılar sınırlı üretim, stoklar bitiyor! Limitiniz yoksa bile hemen uygulamadan taksitli nakit avans çekin, bu fırsat kaçmaz! Nasıl olsa bir şekilde ödersiniz!',
    task: 'Öğrencinin Seçmesi Gereken Danışman Yorumu',
    options: [
      { id: 'A', label: 'Sınırlı üretim olduğu için ileride değerlenebilir, nakit avans çekerek bir nevi yatırım yapmış olurum.' },
      {
        id: 'B',
        label:
          '(Nakit Avans Maliyeti): Bütçede karşılığı olmayan lüks bir tüketim için kredi kartının en yüksek faiz oranına sahip "nakit avans" aracını kullanmak, tamamen duygusal ve plansız bir borç sarmalı yaratır. Fayda sağlamayan bir ürün için bu maliyete katlanılmaz.',
      },
    ],
    correctOptionId: 'B',
    explanation:
      'Nakit avans, kredi kartı borçlanma araçları içinde en yüksek faizli seçenektir. Bütçede karşılığı olmayan, aciliyeti bulunmayan bir tüketim harcaması için bu kaynağı kullanmak, duygusal ve plansız bir borç sarmalının başlangıcıdır.',
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Akıllı Tüketici Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 68) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 45) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 23) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
