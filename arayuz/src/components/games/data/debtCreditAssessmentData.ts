// "Borçlanma ve Kredi" ölçme değerlendirmesi için merkezi veri.
// Bölüm 1: Finansal Dedektif — 5 senaryoda kasıtlı olarak yapılmış finansal hatayı bulma, çoktan
//           seçmeli (A/B/C), sırayla oynanır ve cevaplandıktan sonra değiştirilemez (soru başı 12 puan, toplam 60 puan).
// Bölüm 2: Strateji Eşleştirmesi — 8 finansal durum kartını sürükle-bırak ile "Planlı Borçlanmanın
//           Artıları" veya "Plansız Borçlanmanın Dezavantajları" kutusuna ayırma (kart başı 5 puan, toplam 40 puan).
// Toplam 100 puan, tek kesintisiz süre 25 dakika.

export const GAME_DURATION_MS = 25 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 5 * 60 * 1000;

export const POINTS_PER_QUESTION1 = 12;
export const TOTAL_SECTION1_POINTS = 60;
export const POINTS_PER_CARD2 = 5;
export const TOTAL_SECTION2_POINTS = 40;
export const TOTAL_POINTS = 100;

export interface DetectiveOption {
  id: 'A' | 'B' | 'C';
  label: string;
}

export interface DetectiveQuestion {
  id: number;
  title: string;
  scenario: string;
  task: string;
  options: DetectiveOption[];
  correctOptionId: 'A' | 'B' | 'C';
  explanation: string;
}

export const SECTION1_TITLE = 'Finansal Dedektif';
export const SECTION1_INSTRUCTION =
  'Her vakada bir finansal senaryo anlatılır. Metni dikkatle oku ve senaryonun içinde kasıtlı olarak yapılmış finansal hatayı üç seçenek arasından bul. Bir soruyu cevapladıktan sonra cevabını değiştiremezsin.';

export const SECTION1_QUESTIONS: DetectiveQuestion[] = [
  {
    id: 1,
    title: 'Vaka 1 — "Zengin Hissi"',
    scenario:
      'Kaan, maaş hesabında 2.000 TL olmasına rağmen, kredi kartında 30.000 TL limiti olduğunu görünce kendini çok rahat hisseder. "Nasıl olsa 30 bin liram var" diyerek aylardır ertelediği 15.000 TL\'lik oyun konsolunu tek çekim satın alır.',
    task: 'Buradaki Finansal Hata Nedir?',
    options: [
      { id: 'A', label: "Kaan'ın oyun konsolunu tek çekim alması." },
      { id: 'B', label: 'Kaan\'ın kredi kartı limitini "kendi parası" veya "ek gelir" zannetmesi.' },
      { id: 'C', label: "Kaan'ın maaş hesabında sadece 2.000 TL tutması." },
    ],
    correctOptionId: 'B',
    explanation:
      'Kredi kartı limiti, bankanın sana tanıdığı bir borçlanma imkânıdır; senin kazandığın ya da sahip olduğun bir gelir değildir. Limiti "ek gelir" gibi görmek, harcama gücünü olduğundan yüksek algılamana ve kontrolsüzce borca girmene neden olur.',
  },
  {
    id: 2,
    title: 'Vaka 2 — "Gereksiz Faiz Yükü"',
    scenario:
      'Selin, ay sonunda gelen 4.000 TL\'lik kredi kartı ekstresini inceler. Vadesiz hesabında 6.000 TL nakit parası bulunmaktadır. Ancak "Nakit param cebimde kalsın" düşüncesiyle bankanın belirlediği 800 TL\'lik asgari ödemeyi yapar.',
    task: 'Buradaki Finansal Hata Nedir?',
    options: [
      { id: 'A', label: "Selin'in vadesiz hesabında çok para tutması." },
      { id: 'B', label: "Selin'in 4.000 TL harcama yapmış olması." },
      { id: 'C', label: 'Nakit gücü varken borcun tamamını kapatmayıp, kalan tutara gereksiz faiz işlemesine izin vermesi.' },
    ],
    correctOptionId: 'C',
    explanation:
      'Elinde borcu tamamen kapatacak nakit varken sadece asgari ödemeyi yapmak, kalan bakiyeye yüksek kredi kartı faizi işlemesine neden olur. Bu, gereksiz yere cepten para çıkmasına yol açan plansız bir tercihtir.',
  },
  {
    id: 3,
    title: 'Vaka 3 — "Yanlış Kaynaktan Acil Nakit"',
    scenario:
      'Ozan, arkadaşlarıyla çıkacağı hafta sonu tatili için acil nakde sıkışır. Vadesiz hesabında parası yoktur ve tatil masrafı 3.000 TL tutacaktır. Çözüm olarak kredi kartını ATM\'ye takar ve 3.000 TL Nakit Avans çeker.',
    task: 'Buradaki Finansal Hata Nedir?',
    options: [
      { id: 'A', label: "Ozan'ın arkadaşlarıyla tatile çıkması." },
      { id: 'B', label: "Tatil gibi acil olmayan ve lüks sayılacak bir tüketim için, faizi en yüksek borçlanma aracı olan Nakit Avans'ı kullanması." },
      { id: 'C', label: 'ATM yerine banka şubesinden parayı çekmemesi.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Nakit avans, kredi kartı borçlanma araçları içinde en yüksek faizli ve en maliyetli seçenektir. Ertelenebilir, lüks sayılacak bir harcama için bu kaynağın kullanılması ciddi bir finansal hatadır.',
  },
  {
    id: 4,
    title: 'Vaka 4 — "Bütçe Körlüğü"',
    scenario:
      'Merve, serbest çalışarak aylık ortalama 5.000 TL kazanmaktadır. Mağazada gördüğü 12.000 TL\'lik bir çantayı çok beğenir. Satıcı "Hiç peşinat yok, ayda sadece 2.000 TL taksitle" deyince Merve hemen kabul eder. Ancak mevcut zorunlu ev ve ulaşım giderleri zaten aylık 4.000 TL\'dir.',
    task: 'Buradaki Finansal Hata Nedir?',
    options: [
      { id: 'A', label: 'Aylık sabit giderlerini (4.000 TL) hesaba katmadan, gelirinin (5.000 TL) kalan kısmını aşacak bir taksit (2.000 TL) yükünün altına girmesi.' },
      { id: 'B', label: 'Çantayı peşin almak yerine taksitlendirmesi.' },
      { id: 'C', label: 'Satıcının sunduğu kampanyaya güvenmesi.' },
    ],
    correctOptionId: 'A',
    explanation:
      'Merve\'nin kullanılabilir geliri 5.000 - 4.000 = 1.000 TL\'dir; 2.000 TL\'lik taksit bu tutarı aşmaktadır. Yeni bir taksit yüküne girmeden önce sabit giderler düşüldükten sonra kalan gelire bakılmalıdır.',
  },
  {
    id: 5,
    title: 'Vaka 5 — "Zamanlama Hatası"',
    scenario:
      'Aykut, ödemeleri konusunda çok titizdir ve borçlarının her zaman tamamını öder. Ancak ödeme tarihlerini aklında tutmak yerine "aylık maaşı yattığında" toplu ödeme yapar. Bu ay kredi kartının son ödeme tarihi ayın 5\'i iken, Aykut maaş günü olan ayın 10\'unda borcun tamamını kapatır.',
    task: 'Buradaki Finansal Hata Nedir?',
    options: [
      { id: 'A', label: 'Borcun sadece asgari tutarını değil, tamamını ödemesi.' },
      { id: 'B', label: 'Maaşını alır almaz ödeme yapması.' },
      { id: 'C', label: 'Son ödeme tarihini kaçırdığı için borcun tamamını ödese bile kredi siciline "gecikmeli ödeme" kaydı işletmesi.' },
    ],
    correctOptionId: 'C',
    explanation:
      'Borcun tamamını ödemek tek başına yeterli değildir; ödemenin son ödeme tarihinden önce yapılması gerekir. Aksi halde borç kapansa bile kredi sicilinde gecikme kaydı oluşur ve bu durum gelecekteki kredi başvurularını olumsuz etkiler.',
  },
];

export type BasketId = 'planned' | 'unplanned';

export interface BasketOption {
  id: BasketId;
  label: string;
  icon: string;
}

export const BASKETS: BasketOption[] = [
  { id: 'planned', label: 'Planlı Borçlanmanın Artıları', icon: '🟢' },
  { id: 'unplanned', label: 'Plansız Borçlanmanın Dezavantajları', icon: '🔴' },
];

export interface StrategyCard {
  id: number;
  text: string;
  correctBasket: BasketId;
  explanation: string;
}

export const SECTION2_TITLE = 'Strateji Eşleştirmesi';
export const SECTION2_INSTRUCTION =
  'Ekranda karışık sırada 8 farklı finansal durum kartı göreceksin. Her kartı sürükleyerek "Planlı Borçlanmanın Artıları" veya "Plansız Borçlanmanın Dezavantajları" kutusuna bırak. Kartı bıraktıktan sonra istersen başka bir kutuya taşıyarak fikrini değiştirebilirsin.';

export const SOURCE_CARDS: StrategyCard[] = [
  {
    id: 1,
    text: 'Bütçe hesabı yapılmadığı için gelecekteki kazancımıza (henüz kazanmadığımız paraya) kontrolsüzce ipotek koyar.',
    correctBasket: 'unplanned',
    explanation: 'Bütçe planı olmadan girilen borç, henüz elde edilmemiş geleceğe dair geliri riske atar; bu plansız borçlanmanın temel dezavantajlarından biridir.',
  },
  {
    id: 2,
    text: 'Gelire uygun taksitlendirildiği için zamanında geri ödenir ve bankalar nezdindeki "Kredi Notumuzu" (finansal sicili) yükseltir.',
    correctBasket: 'planned',
    explanation: 'Gelire uygun planlanan bir taksit zamanında ödenebildiği için finansal sicili güçlendirir; bu planlı borçlanmanın bir artısıdır.',
  },
  {
    id: 3,
    text: 'Acil durum fonu ayrılmadan borca girildiği için, öngörülemeyen bir kriz anında ödenemez hale gelir ve büyük bir stres yaratır.',
    correctBasket: 'unplanned',
    explanation: 'Acil durum fonu düşünülmeden alınan borç, beklenmedik bir krizde ödenemez hale gelebilir; bu plansız borçlanmanın riskidir.',
  },
  {
    id: 4,
    text: 'İhtiyaç duyulan bir ürünün fiyatını, enflasyonist dönemlerde bugünden sabitleyip akıllıca bir alım yapmamızı sağlar.',
    correctBasket: 'planned',
    explanation: 'Fiyatı bugünden sabitlemek, enflasyona karşı akılcı bir strateji olduğu için planlı borçlanmanın bir avantajıdır.',
  },
  {
    id: 5,
    text: 'Anlık heveslerle yapıldığında; yüksek nakit avans, gecikme faizi ve vade farkı gibi gereksiz maliyetlerin altında ezilmeye neden olur.',
    correctBasket: 'unplanned',
    explanation: 'Anlık hevesle girilen borçlanma, yüksek maliyetli araçların (nakit avans, gecikme faizi) kullanılmasına yol açar; bu plansız borçlanmanın dezavantajıdır.',
  },
  {
    id: 6,
    text: 'Büyük harcamaları gelire göre aylara bölerek günlük nakit akışımızı (paramızın yönetimini) dengede tutmamıza yardımcı olur.',
    correctBasket: 'planned',
    explanation: 'Büyük bir harcamayı gelire göre aylara bölmek nakit akışını dengede tutar; bu planlı borçlanmanın bir artısıdır.',
  },
  {
    id: 7,
    text: 'Nasıl ödeneceği baştan düşünülmediği için psikolojik olarak bitmek bilmeyen bir "borçlu hissetme" baskısı ve yorgunluğu yaratır.',
    correctBasket: 'unplanned',
    explanation: 'Geri ödeme planı baştan düşünülmeden girilen borç, sürekli bir "borçlu hissetme" baskısı yaratır; bu plansız borçlanmanın dezavantajıdır.',
  },
  {
    id: 8,
    text: 'Bütçe planı yapılarak bilgisayar, eğitim gibi peşin alınamayacak ancak ileride kazanç getirecek "üretim araçlarına" güvenle ulaşmamızı sağlar.',
    correctBasket: 'planned',
    explanation: 'Bütçe planıyla desteklenen borçlanma, ileride kazanç getirecek üretim araçlarına güvenle ulaşmayı sağlar; bu planlı borçlanmanın bir artısıdır.',
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 100) return { label: 'Kredi ve Borçlanma Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 75) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
