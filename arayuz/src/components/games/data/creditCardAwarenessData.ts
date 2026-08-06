// "Bilinçli Kredi Kartı Kullanımı" ölçme-değerlendirme oyunu için merkezi veri.
// 7 vaka, her biri "Bilinçli Kullanım" / "Hatalı Kullanım" olarak sınıflandırılır.
// Doğru cevap 10 puan, toplam 70 puan. Başarı yüzdesi = (doğru sayısı / 7) × 100.

export const POINTS_PER_CASE = 10;
export const TOTAL_CASES = 7;
export const MAX_SCORE = POINTS_PER_CASE * TOTAL_CASES;

export type UsageAnswer = 'CONSCIOUS' | 'MISUSE';

export interface UsageOption {
  id: UsageAnswer;
  label: string;
}

export const USAGE_OPTIONS: UsageOption[] = [
  { id: 'CONSCIOUS', label: 'Bilinçli Kullanım' },
  { id: 'MISUSE', label: 'Hatalı Kullanım' },
];

export interface CreditCardCase {
  id: number;
  title: string;
  scenario: string;
  correctAnswer: UsageAnswer;
  correctFeedback: string;
  wrongFeedback: string;
}

export const CREDIT_CARD_CASES: CreditCardCase[] = [
  {
    id: 1,
    title: 'Emre\'nin Asgari Ödeme Alışkanlığı',
    scenario:
      'Emre, sosyal hayatında kredi kartını aktif olarak kullanmaktadır. Ay sonu hesap özeti geldiğinde, elinde yeterli nakit olmasına rağmen borcun tamamını ödemek yerine bankanın belirlediği asgari ödeme tutarını yatırmaktadır. Kalan borcu bir sonraki aya devretmektedir.',
    correctAnswer: 'MISUSE',
    correctFeedback:
      'Tebrikler, doğru analiz. Sadece asgari tutarı ödemek borcu kapatmaz. Geriye kalan anaparaya her ay akdi faiz işlemeye devam eder. Bu durum bireyi zamanla içinden çıkılması zor bir borç sarmalına sürükleyebilir.',
    wrongFeedback:
      'Bankanın asgari ödeme seçeneği sunması borcun bittiği anlamına gelmez. Kalan tutara işleyen faiz gelecekteki satın alma gücünü düşürür. Bütçe planlamasında temel hedef, borcun tamamını zamanında ödemektir.',
  },
  {
    id: 2,
    title: 'Ayşe\'nin Bütçe ve Tam Ödeme Stratejisi',
    scenario:
      'Ayşe, aylık harçlık ve gelirine göre bütçe planı yapmıştır. Market ve kırtasiye gibi zorunlu harcamalarını takip edebilmek ve puan kazanmak için kredi kartıyla yapmaktadır. Hesap özeti geldiğinde borcun tamamını son ödeme tarihi geçmeden ödemektedir.',
    correctAnswer: 'CONSCIOUS',
    correctFeedback:
      'Doğru tespit. Kredi kartı ek gelir değil, bir ödeme aracıdır. Ayşe borcunun tamamını zamanında ödediği için faiz ödemez ve düzenli ödeme alışkanlığını korur.',
    wrongFeedback:
      'Kredi kartı kullanmak tek başına olumsuz bir davranış değildir. Bütçe sınırları içinde kalındığında ve borcun tamamı zamanında ödendiğinde güvenli ve takip edilebilir bir ödeme aracıdır.',
  },
  {
    id: 3,
    title: 'Can ve Nakit Avans Tuzağı',
    scenario:
      'Can, sevdiği grubun konser biletlerinin tükenmek üzere olduğunu görür. Banka hesabında parası olmadığı için kredi kartının nakit avans özelliğini kullanarak para çeker ve konser biletini satın alır.',
    correctAnswer: 'MISUSE',
    correctFeedback:
      'Doğru karar. Nakit avans yüksek maliyetli bir borçlanma yöntemidir ve çekildiği andan itibaren faiz işlemeye başlayabilir. Eğlence gibi anlık tüketimler için bu yöntemi kullanmak finansal bir hatadır.',
    wrongFeedback:
      'Konser kısa süren bir deneyimdir ancak nakit avansın oluşturacağı faiz yükü bütçeyi uzun süre etkileyebilir. Zorunlu olmayan tüketim harcamaları için yüksek maliyetli borç kullanılmamalıdır.',
  },
  {
    id: 4,
    title: 'Zeynep\'in Üretim Amaçlı Taksit Planı',
    scenario:
      'Zeynep, lise eğitiminin yanında serbest çalışarak grafik tasarım yapmaktadır. Çalışmalarında kullandığı bilgisayar bozulur. Yeni bilgisayarı peşin alacak parası olmadığı için aylık tasarım gelirini hesaplar ve bütçesini sarsmayacak şekilde 6 aylık taksitle yeni bir iş bilgisayarı satın alır.',
    correctAnswer: 'CONSCIOUS',
    correctFeedback:
      'Çok başarılı bir analiz. Zeynep bu borçlanmayı anlık bir heves için değil, gelir üretmesini sağlayacak bir iş ekipmanı için yapmıştır. Ödeme planını gelirine göre hazırlaması bu işlemi planlı bir yatırım haline getirir.',
    wrongFeedback:
      'Bilgisayar yalnızca tüketim amacıyla alınmamıştır. Zeynep bu cihazla üretim yaparak gelir elde edecektir. Gelir getiren bir araç için bütçeye uygun taksit planı oluşturmak bilinçli bir finansal strateji olabilir.',
  },
  {
    id: 5,
    title: 'Burak\'ın Duygusal Alışverişi',
    scenario:
      'Burak okulda stresli bir gün geçirmiştir. Kendini daha iyi hissetmek için ihtiyacı olmayan pahalı bir marka ayakkabıyı, kredi kartı limitini sonuna kadar kullanarak sipariş eder.',
    correctAnswer: 'MISUSE',
    correctFeedback:
      'Kesinlikle doğru. Bu davranış duygusal harcamaya örnektir. Alışverişten gelen kısa süreli mutluluk geçerken plansız şekilde oluşan borç stresi uzun süre devam edebilir.',
    wrongFeedback:
      'Finansal kararlar anlık duygularla değil, ihtiyaçlar ve bütçe dikkate alınarak verilmelidir. Stres nedeniyle yapılan plansız harcamalar ileride daha büyük finansal kaygılara neden olabilir.',
  },
  {
    id: 6,
    title: 'Ceyda\'nın Gecikmeli Ödemeleri',
    scenario:
      'Ceyda\'nın kredi kartı borcunu ödeyecek parası banka hesabında bulunmaktadır. Ancak ödeme tarihlerini takip etmediği için borcunu her ay son ödeme tarihinden 3–4 gün sonra ödemektedir.',
    correctAnswer: 'MISUSE',
    correctFeedback:
      'Doğru değerlendirme. Borcu ödeyecek para bulunmasına rağmen ödemenin geciktirilmesi gereksiz gecikme maliyetlerine ve ödeme alışkanlığının olumsuz etkilenmesine neden olabilir.',
    wrongFeedback:
      'Borcun birkaç gün geç ödenmesi önemsiz görünmemelidir. Düzenli gecikmeler ek maliyet oluşturabilir ve kişinin finansal geçmişini olumsuz etkileyebilir.',
  },
  {
    id: 7,
    title: 'Mert\'in Dijital Abonelik Yönetimi',
    scenario:
      'Mert\'in eğitim, yazılım ve eğlence platformlarında aylık abonelikleri bulunmaktadır. Bütçesini ve dijital güvenliğini korumak için ana kredi kartı yerine limiti 500 TL olan bir sanal kart oluşturur ve otomatik ödemelerini bu karta bağlar.',
    correctAnswer: 'CONSCIOUS',
    correctFeedback:
      'Zekice bir hareket. Dijital aboneliklerde limiti önceden belirlenmiş sanal kart kullanmak bütçenin kontrol dışına çıkmasını engeller ve ana kart bilgilerini olası güvenlik risklerinden korur.',
    wrongFeedback:
      'Sanal kart ve sınırlı limit kullanımı bir risk yönetimi yöntemidir. Otomatik ödemeleri doğrudan yüksek limitli ana kredi kartına bağlamak yerine kontrollü bir sanal kart kullanmak daha güvenli olabilir.',
  },
];

export interface GlossaryTerm {
  term: string;
  def: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'Hesap Özeti / Ekstre', def: 'Bir ay boyunca yapılan harcamaları, toplam borcu ve son ödeme tarihini gösteren belgedir.' },
  { term: 'Asgari Ödeme Tutarı', def: 'O ay ödenmesi gereken en düşük tutardır. Yalnızca asgari tutarın ödenmesi borcun tamamen kapandığı anlamına gelmez.' },
  { term: 'Nakit Avans', def: 'Kredi kartından nakit para çekme işlemidir. Genellikle yüksek maliyetli bir borçlanma yöntemidir.' },
  { term: 'Kredi Notu / Finansal Sicil', def: 'Kişinin bankalarla olan finansal geçmişi ve ödeme alışkanlıklarıyla ilişkili değerlendirmedir.' },
  { term: 'Gecikme Faizi', def: 'Borcun son ödeme tarihinden sonra ödenmesi durumunda oluşabilecek ek maliyettir.' },
  { term: 'Sanal Kart', def: 'İnternet alışverişleri ve abonelikler için oluşturulan, limiti kullanıcı tarafından belirlenebilen dijital karttır.' },
];

export interface StrategyTip {
  title: string;
  desc: string;
}

export const STRATEGY_TIPS: StrategyTip[] = [
  {
    title: 'Bilinçli Borçlanma',
    desc: 'Gelecekte değer oluşturacak eğitim, gelir üreten iş ekipmanı veya temel ihtiyaçlar için; bütçe ve ödeme planı hesaplanarak yapılan borçlanmadır.',
  },
  {
    title: 'Plansız Borçlanma',
    desc: 'Anlık hevesler, duygusal kararlar veya gösteriş amacıyla yapılan, toplam maliyeti değerlendirilmemiş borçlanmadır.',
  },
  {
    title: 'Kredi Kartı İçin Temel Kural',
    desc: 'Kredi kartı ekstra gelir değildir. Harcamalar aylık bütçeyi aşmamalı ve mümkün olduğunda hesap özeti borcunun tamamı son ödeme tarihinden önce ödenmelidir.',
  },
];

export function getPerformance(correctCount: number): { label: string; sub: string; icon: string; color: string; bg: string } {
  if (correctCount === 7) return { label: 'Bilinçli Kart Kullanıcısı!', sub: 'Tüm vakaları doğru analiz ettin.', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (correctCount >= 5) return { label: 'Çok İyi İş!', sub: 'Neredeyse tüm vakalarda doğru karar verdin.', icon: '👍', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (correctCount >= 3) return { label: 'Kısmi Anlayış', sub: 'Bazı vakalarda daha dikkatli olabilirdin.', icon: '📘', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', sub: 'Bilgi Merkezi\'ni tekrar incele ve yeniden dene.', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}

// Fisher-Yates shuffle — orijinal diziyi bozmadan yeni bir sıralı kopya döner.
export function shuffleCases(cases: CreditCardCase[]): CreditCardCase[] {
  const arr = [...cases];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
