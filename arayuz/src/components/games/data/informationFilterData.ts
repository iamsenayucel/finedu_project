// "Bilgi Filtresi" (Finansal Medya Okuryazarlığı) oyunu için merkezi veri.
// Bölüm 1: Dedektif Panosu — 5 vaka, sürükle-bırak ile 3 kategoriye (Güvenilir / Şüpheli / Manipülatif) ayrılır (vaka başı 8 puan, toplam 40 puan).
// Bölüm 2: Finansal Okuryazarlık Testi — 4 çoktan seçmeli soru (soru başı 15 puan, toplam 60 puan).
// Toplam 100 puan, tek kesintisiz süre 20 dakika.

export const GAME_DURATION_MS = 20 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 2 * 60 * 1000;

export const POINTS_PER_CARD = 8;
export const TOTAL_CARD_POINTS = 40;
export const POINTS_PER_QUESTION = 15;
export const TOTAL_QUESTION_POINTS = 60;
export const TOTAL_POINTS = 100;

export type BasketId = 'reliable' | 'suspicious' | 'manipulative';

export interface BasketOption {
  id: BasketId;
  label: string;
  icon: string;
}

export const BASKETS: BasketOption[] = [
  { id: 'reliable', label: 'Güvenilir Kaynak', icon: '🟢' },
  { id: 'suspicious', label: 'Şüpheli Kaynak', icon: '🟡' },
  { id: 'manipulative', label: 'Manipülatif / Reklam', icon: '🔴' },
];

export interface SourceCard {
  id: number;
  text: string;
  correctBasket: BasketId;
  explanation: string;
}

export const SECTION1_TITLE = 'Dedektif Panosu';
export const SECTION1_INSTRUCTION =
  'Aşağıdaki beş vakayı incele ve her kartı sürükleyerek "Güvenilir Kaynak", "Şüpheli Kaynak" ya da "Manipülatif / Reklam" panosuna bırak. İstersen bir kartı bıraktıktan sonra başka bir panoya taşıyarak fikrini değiştirebilirsin.';

export const SOURCE_CARDS: SourceCard[] = [
  {
    id: 1,
    text: 'TÜİK verilerine göre, tüketici fiyat endeksi geçen yılın aynı ayına oranla %45 seviyesinde gerçekleşti.',
    correctBasket: 'reliable',
    explanation:
      'Somut matematiksel veri bulunmaktadır, kaynak resmi bir devlet kurumudur, duygu sömürüsü veya doğrudan yatırım yönlendirmesi yapılmamaktadır.',
  },
  {
    id: 2,
    text: 'Sosyal medyada "KriptoKurdu_99": "X Coin yarın 100 katına çıkacak! Evinizi satın, bütün paranızı bu projeye basın! Treni kaçırmayın!" dedi.',
    correctBasket: 'manipulative',
    explanation:
      'Kaynak anonimdir. Aşırı kazanç vaadi, FOMO oluşturma ve kullanıcıyı doğrudan finansal eyleme yönlendirme bulunmaktadır.',
  },
  {
    id: 3,
    text: 'Kulislerde konuşulan iddialara ve sızdırılan belgelere göre, Merkez Bankası yarın faizleri 500 baz puan indirecekmiş.',
    correctBasket: 'suspicious',
    explanation:
      'Rakam verilmesine rağmen bilginin açık, resmi ve doğrulanabilir bir kaynağı bulunmamaktadır. İsimsiz ve doğrulanmamış kaynaklara dayanmaktadır.',
  },
  {
    id: 4,
    text: "Dünya Bankası'nın yayımladığı resmi 'Küresel Beklentiler' raporuna göre, bu yıl küresel büyüme hızının %2,4'e gerilemesi öngörülüyor.",
    correctBasket: 'reliable',
    explanation: 'Bilgi uluslararası ve resmi bir kurum tarafından yayımlanan, denetlenebilir bir rapora dayanmaktadır.',
  },
  {
    id: 5,
    text: 'Yeni nesil Bulut Madenciliği sistemimize 1.000 TL yatırarak ayda 5.000 TL garanti gelir elde edin! Sıfır risk, kaybetmek yok! Hemen üye olun.',
    correctBasket: 'manipulative',
    explanation:
      '"Sıfır risk", "garanti gelir" ve yüksek kazanç vaatleri kullanılmakta ve kullanıcı hızlı bir finansal karara yönlendirilmektedir.',
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
      'Lise öğrencisi Can, dijital varlıklara ilgi duymaktadır. Sosyal medyada gezinirken bir dijital proje hakkında "Yüzyılın Fırsatı! Çok Kazandıracak!" yazılı gösterişli grafikler görmüştür.\n\nCan, bu projenin ne işe yaradığını, teknolojik altyapısını ve arkasındaki ekibi gerçekten öğrenmek istemektedir.\n\nBuna göre Can, sadece "süper kazanç" vadeden grafiklere aldanmamak için projenin hangi resmi / teknik belgesini incelemelidir?',
    options: [
      { id: 'A', label: 'Sosyal medya fenomenlerinin yorumlarını' },
      { id: 'B', label: 'Şirketin reklam amaçlı hazırlattığı Advertorial haberleri' },
      { id: 'C', label: 'Projenin bağımsız analizi olan teknik raporunu (Whitepaper)' },
      { id: 'D', label: 'İsimsiz kaynakların WhatsApp gruplarındaki duyumlarını' },
      { id: 'E', label: 'Sadece yukarı doğru çizilmiş olan fiyat grafiklerini' },
    ],
    correctOptionId: 'C',
    explanation: "Bir projenin amacı, çalışma yapısı ve teknik altyapısı hakkında bilgi edinmek için teknik raporu/Whitepaper'ı incelenmelidir.",
    points: 15,
  },
  {
    id: 2,
    prompt:
      'Bir yatırımcı, piyasalarda dolaşan:\n\n"Acil durum! Sistem yarın çöküyor, şirket batıyor, elindeki her şeyi zararına da olsa sat!"\n\nşeklindeki anonim bir haberi okuyup paniklemiş ve yatırımlarını büyük bir zararla satmıştır.\n\nİki gün sonra haberin tamamen yalan olduğu ve piyasayı düşürüp ucuza mal toplamak isteyen spekülatörler tarafından çıkarıldığı anlaşılmıştır.\n\nYatırımcıyı "panikle satışa" zorlayan bu manipülasyon taktiği hangisidir?',
    options: [
      { id: 'A', label: 'FUD (Korku, Belirsizlik ve Şüphe)' },
      { id: 'B', label: 'FOMO (Fırsatı Kaçırma Korkusu)' },
      { id: 'C', label: 'Gizli Reklam (Advertorial)' },
      { id: 'D', label: 'Sıfır Risk Yalanı' },
      { id: 'E', label: 'Bağımsız Denetim (Audit)' },
    ],
    correctOptionId: 'A',
    explanation: 'İnsanları korku ve belirsizliğe sürükleyerek finansal karar almaya yönlendirmek için yayılan kanıtsız söylentiler FUD olarak adlandırılır.',
    points: 15,
  },
  {
    id: 3,
    prompt:
      'Bir ekonomi haberi okunurken "Dedektif Kontrol Listesi"nin "Bana Ne Yaptırmak İstiyor?" kuralı uygulanmaktadır.\n\nHaberde:\n\n"Hemen bu hisseyi alın, kesin kazandıracak."\n\ngibi ifadeler bulunmaktadır.\n\nBilinçli bir finansal okuryazarın çıkarması gereken temel sonuç hangisidir?',
    options: [
      { id: 'A', label: 'Haberin resmi ve tarafsız bir devlet kurumu tarafından hazırlandığı' },
      { id: 'B', label: 'Yazının objektif analiz yerine okuyucuya doğrudan finansal eylem yaptırmaya çalışan yatırım tavsiyesi veya manipülasyon olduğu' },
      { id: 'C', label: 'Verilerin bağımsız denetim şirketleri tarafından kesin olarak onaylandığı' },
      { id: 'D', label: 'Haberin yalnızca volatiliteyi açıkladığı' },
      { id: 'E', label: 'Yazının sadece somut veri ve istatistiklere dayandığı' },
    ],
    correctOptionId: 'B',
    explanation: 'Bir içerik okuyucuyu bilgilendirmek yerine doğrudan "al" veya "sat" gibi bir finansal eyleme yönlendiriyorsa yatırım tavsiyesi veya manipülasyon riski taşıdığı düşünülmelidir.',
    points: 15,
  },
  {
    id: 4,
    prompt:
      'Sosyal medyada yüzü ve gerçek adı olmayan "Kullanıcı_8472" isimli bir profil şu mesajı paylaşmıştır:\n\n"Bu sisteme girdim, evimde oturarak 1 haftada %100 kazanç elde ettim. Kaybetme ihtimali yok, kontenjan dolmadan hemen tıklayın!"\n\nBu mesajda finansal dedektiflik stratejilerine göre aşağıdaki tehlike/yalan işaretlerinden hangisi YOKTUR?',
    options: [
      { id: 'A', label: 'Anonim Kaynak' },
      { id: 'B', label: 'Zaman Tuzağı' },
      { id: 'C', label: 'Sıfır Risk Yalanı' },
      { id: 'D', label: 'Sahte Sosyal İspat' },
      { id: 'E', label: 'Somut Veri ve İstatistik' },
    ],
    correctOptionId: 'E',
    explanation: 'Mesajda anonim kaynak, zaman baskısı, sıfır risk iddiası ve başarı hikayesi bulunmaktadır ancak iddiayı doğrulayabilecek resmi ve denetlenebilir somut veri bulunmamaktadır.',
    points: 15,
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 100) return { label: 'Bilgi Filtresi Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 75) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
