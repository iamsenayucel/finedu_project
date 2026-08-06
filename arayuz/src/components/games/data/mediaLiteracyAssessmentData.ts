// "Finansal Medya Okuryazarlığı" ölçme-değerlendirme oyunu için merkezi veri.
// Bölüm 1: Dedektif Panosu — 5 vaka, her biri 3 sınıflandırma seçeneğinden biriyle etiketlenir (vaka başı 8 puan, toplam 40 puan).
// Bölüm 2: Finansal Okuryazarlık Testi — 4 çoktan seçmeli soru (soru başı 15 puan, toplam 60 puan).
// Toplam 100 puan, tek kesintisiz süre 20 dakika.

export const EXAM_DURATION_MS = 20 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_CASE = 8;
export const TOTAL_CASE_POINTS = 40;
export const POINTS_PER_QUESTION = 15;
export const TOTAL_QUESTION_POINTS = 60;
export const TOTAL_POINTS = 100;

export type ClassificationId = 'reliable' | 'suspicious' | 'manipulative';

export interface ClassificationOption {
  id: ClassificationId;
  label: string;
  icon: string;
}

export const CLASSIFICATIONS: ClassificationOption[] = [
  { id: 'reliable', label: 'Güvenilir Kaynak', icon: '🟢' },
  { id: 'suspicious', label: 'Şüpheli Kaynak', icon: '🟡' },
  { id: 'manipulative', label: 'Manipülatif / Reklam', icon: '🔴' },
];

export interface DetectiveCase {
  id: number;
  text: string;
  correctClassification: ClassificationId;
  explanation: string;
}

export const SECTION1_TITLE = 'Dedektif Panosu';
export const SECTION1_INSTRUCTION =
  'Aşağıdaki beş finansal haber ya da sosyal medya içeriğini incele ve her biri için tek bir sınıflandırma seç: Güvenilir Kaynak, Şüpheli Kaynak ya da Manipülatif / Reklam.';

export const SECTION1_CASES: DetectiveCase[] = [
  {
    id: 1,
    text: '"TÜİK verilerine göre, tüketici fiyat endeksi geçen yılın aynı ayına oranla %45 seviyesinde gerçekleşti."',
    correctClassification: 'reliable',
    explanation:
      'Somut matematiksel veri bulunmaktadır. Kaynak, resmî bir devlet kurumudur. Duygu sömürüsü yapılmamakta ve okuyucuya herhangi bir yatırım işlemi yaptırılmaya çalışılmamaktadır.',
  },
  {
    id: 2,
    text: 'Sosyal medyada "KriptoKurdu_99": "X Coin yarın 100 katına çıkacak! Evinizi satın, bütün paranızı bu projeye basın! Treni kaçırmayın!" dedi.',
    correctClassification: 'manipulative',
    explanation:
      'Kaynak anonimdir. Aşırı duygu ve heyecan ifadeleri kullanılmaktadır. FOMO, yani fırsatı kaçırma korkusu yaratılmakta ve okuyucuya doğrudan riskli bir finansal eylem yaptırılmaya çalışılmaktadır.',
  },
  {
    id: 3,
    text: 'Kulislerde konuşulan iddialara ve sızdırılan belgelere göre, Merkez Bankası yarın faizleri 500 baz puan indirecekmiş.',
    correctClassification: 'suspicious',
    explanation:
      'İçerikte sayısal bir iddia bulunmasına rağmen şeffaf ve doğrulanabilir bir kaynak verilmemektedir. "Kulislerde konuşulanlar" ve "sızdırılan belgeler" gibi ifadeler kaynağın belirsiz olduğunu göstermektedir.',
  },
  {
    id: 4,
    text: 'Dünya Bankası\'nın yayımladığı resmî "Küresel Beklentiler" raporuna göre, bu yıl küresel büyüme hızının %2,4\'e gerilemesi öngörülüyor.',
    correctClassification: 'reliable',
    explanation:
      'Bilgi, uluslararası ve resmî bir kurum tarafından yayımlanan, metodolojisi incelenebilen ve denetlenebilir bir rapora dayanmaktadır.',
  },
  {
    id: 5,
    text: 'Yeni nesil Bulut Madenciliği sistemimize 1.000 TL yatırarak ayda 5.000 TL garanti gelir elde edin! Sıfır risk, kaybetmek yok! Hemen üye olun.',
    correctClassification: 'manipulative',
    explanation:
      '"Sıfır risk", "garanti gelir" ve olağan dışı yüksek kazanç gibi ifadeler kullanılmaktadır. Kullanıcı acele etmeye zorlanmakta ve gerçekçi olmayan finansal vaatler sunulmaktadır.',
  },
];

export interface AssessmentOption {
  id: string;
  label: string;
}

export interface AssessmentQuestion {
  id: number;
  prompt: string;
  options: AssessmentOption[];
  correctOptionId: string;
  explanation: string;
  points: number;
}

export const SECTION2_TITLE = 'Finansal Okuryazarlık Testi';
export const SECTION2_INSTRUCTION = 'Aşağıdaki dört soruyu oku ve tek bir doğru seçeneği işaretle.';

export const SECTION2_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    prompt:
      'Lise öğrencisi Can, dijital varlıklara ilgi duymaktadır. Sosyal medyada gezinirken bir dijital proje hakkında "Yüzyılın Fırsatı! Çok Kazandıracak!" yazılı gösterişli grafikler görmüştür. Strateji Merkezi kurallarını hatırlayan Can, bu projenin ne işe yaradığını, teknolojik altyapısını ve arkasındaki ekibi gerçekten öğrenmek istemektedir.\n\nBuna göre Can, sadece "süper kazanç" vadeden grafiklere aldanmamak için projenin hangi resmî veya teknik belgesini incelemelidir?',
    options: [
      { id: 'A', label: 'Sosyal medya fenomenlerinin yorumlarını' },
      { id: 'B', label: 'Şirketin reklam amaçlı hazırlattığı Advertorial haberleri' },
      { id: 'C', label: 'Projenin bağımsız analizi olan teknik raporunu, yani Whitepaper\'ı' },
      { id: 'D', label: 'İsimsiz kaynakların WhatsApp gruplarındaki duyumlarını' },
      { id: 'E', label: 'Sadece yukarı doğru çizilmiş fiyat grafiklerini' },
    ],
    correctOptionId: 'C',
    explanation:
      'Gerçek projelerin arkasında yalnızca kazanç vaatleri değil, projenin amacı, çalışma şekli, teknolojik altyapısı ve ekibi hakkında bilgi veren teknik bir rapor bulunmalıdır.',
    points: 15,
  },
  {
    id: 2,
    prompt:
      'Bir yatırımcı, piyasalarda dolaşan "Acil durum! Sistem yarın çöküyor, şirket batıyor, elindeki her şeyi zararına da olsa sat!" şeklindeki anonim bir haberi okuyup paniklemiş ve yatırımlarını büyük bir zararla satmıştır. İki gün sonra ise haberin tamamen yalan olduğu ve piyasayı düşürüp ucuza mal toplamak isteyen spekülatörler tarafından çıkarıldığı anlaşılmıştır.\n\nYatırımcının tuzağına düştüğü, yatırımcıyı "panikle satışa" zorlayan manipülasyon taktiği hangisidir?',
    options: [
      { id: 'A', label: 'FUD — Korku, Belirsizlik ve Şüphe' },
      { id: 'B', label: 'FOMO — Fırsatı Kaçırma Korkusu' },
      { id: 'C', label: 'Gizli Reklam — Advertorial' },
      { id: 'D', label: 'Sıfır Risk Yalanı' },
      { id: 'E', label: 'Bağımsız Denetim — Audit' },
    ],
    correctOptionId: 'A',
    explanation:
      'İnsanları paniğe sürüklemek, bir yatırım aracını kötülemek veya insanların ellerindeki yatırımları aceleyle sattırmak amacıyla yayılan kanıtsız söylentiler FUD olarak adlandırılır.',
    points: 15,
  },
  {
    id: 3,
    prompt:
      'Bir ekonomi haberi okunurken "Dedektif Kontrol Listesi"nin dördüncü adımı olan "Bana Ne Yaptırmak İstiyor?" kuralı uygulanmaktadır. Haberde "Hemen bu hisseyi alın, kesin kazandıracak" gibi yönlendirmeler tespit edilmiştir.\n\nBu durumla karşılaşan bilinçli bir finansal okuryazarın çıkarması gereken temel sonuç hangisidir?',
    options: [
      { id: 'A', label: 'Haberin resmî ve tarafsız bir devlet kurumu tarafından hazırlandığı' },
      { id: 'B', label: 'Yazının objektif analizden ziyade okuyucuya doğrudan bir finansal eylem yaptırmayı hedefleyen yatırım tavsiyesi veya manipülasyon olduğu' },
      { id: 'C', label: 'Haberdeki verilerin bağımsız denetim şirketleri tarafından kesin olarak onaylandığı' },
      { id: 'D', label: 'Haberin volatilite kuralına uygun olduğu' },
      { id: 'E', label: 'Yazının yalnızca somut veri ve istatistiklere dayanarak bilgi verdiği' },
    ],
    correctOptionId: 'B',
    explanation:
      'Güvenilir bir analiz piyasa hakkında bilgi verir ve kararı okuyucuya bırakır. İçerik doğrudan "al", "sat" veya "hemen yatırım yap" gibi emirler veriyorsa bunun yönlendirme veya yatırım tavsiyesi olabileceği düşünülmelidir.',
    points: 15,
  },
  {
    id: 4,
    prompt:
      'Sosyal medyada yüzü ve gerçek adı olmayan "Kullanıcı_8472" isimli bir profil, "Bu sisteme girdim, evimde oturarak bir haftada %100 kazanç elde ettim. Kaybetme ihtimali yok, kontenjan dolmadan hemen tıklayın!" şeklinde bir mesaj paylaşmıştır.\n\nBu kısa mesajda, finansal dedektiflik stratejilerine göre aşağıdaki tehlike veya yalan işaretlerinden hangisi yoktur?',
    options: [
      { id: 'A', label: 'Anonim Kaynak' },
      { id: 'B', label: 'Zaman Tuzağı' },
      { id: 'C', label: 'Sıfır Risk Yalanı' },
      { id: 'D', label: 'Sahte Sosyal İspat' },
      { id: 'E', label: 'Somut Veri ve İstatistik' },
    ],
    correctOptionId: 'E',
    explanation:
      'Mesajda anonim kaynak, zaman baskısı, sıfır risk vaadi ve sahte bir başarı hikâyesi bulunmaktadır. Ancak iddiayı destekleyen resmî, doğrulanabilir ve denetlenebilir bir veri veya rapor bulunmamaktadır.',
    points: 15,
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 100) return { label: 'Medya Okuryazarlığı Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 75) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
