// "Finansal Medya Okuryazarlığı" oyunu için merkezi veri.
// Görev 1: 5 bilgi kaynağı kartını "Güvenilir" / "Güvenilmez" sepetlerine sürükle-bırak ile sınıflandırma (kart başı 8 puan, toplam 40 puan).
// Görev 2-5: TYT formatında 4 çoktan seçmeli soru (soru başı 15 puan, toplam 60 puan). Toplam 100 puan, süre 16 dakika.

export const EXAM_DURATION_MS = 16 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_CARD = 8;
export const TOTAL_CARD_POINTS = 40;
export const POINTS_PER_QUESTION = 15;
export const TOTAL_QUESTION_POINTS = 60;
export const TOTAL_POINTS = 100;

export type BasketId = 'unreliable' | 'reliable';

export interface SourceCard {
  id: string;
  label: string;
  correctBasket: BasketId;
  note: string;
}

export const SORT_TITLE = 'Bilgi Filtresi: Güvenilir mi, Güvenilmez mi?';
export const SORT_INSTRUCTION =
  'İnternette karşılaştığın finansal verileri ve haberleri filtrelemen gerekiyor! Aşağıdaki 5 bilgi kaynağını analiz et ve onları "Güvenilir Kaynaklar" ve "Güvenilmez Kaynaklar" sepetlerine doğru şekilde sürükleyerek bilgi kirliliğini temizle.';

export const CARDS: SourceCard[] = [
  {
    id: 'card1',
    label: 'WhatsApp gruplarında dolaşan "İçeriden sızdırıldı, kriz kapıda!" etiketli isimsiz ses kaydı',
    correctBasket: 'unreliable',
    note: 'Tamamen anonimdir, korku pompalar ve kaynağı belli değildir.',
  },
  {
    id: 'card2',
    label: 'T.C. Merkez Bankası resmi web sitesinden (.gov.tr) indirilen orijinal veri tablosu',
    correctBasket: 'reliable',
    note: "Mükemmel! Verinin üretildiği ilk eldir, yasal ve tarafsız 'Birincil Kaynak'tır.",
  },
  {
    id: 'card3',
    label: 'Kendine "Ekonomi Gurusu" diyen anonim bir sosyal medya fenomeninin kaynak göstermeden attığı tweet',
    correctBasket: 'unreliable',
    note: 'Kişisel çıkarlar veya spekülasyon barındırabilir, manipülasyona tamamen açıktır.',
  },
  {
    id: 'card4',
    label: 'Ulusal bir haber ajansının, resmi enflasyon raporuna dayandırarak sunduğu akşam bülteni',
    correctBasket: 'reliable',
    note: "Kurumsal bir 'İkincil Kaynak'tır. Resmi rapora dayandığı için güvenilirdir.",
  },
  {
    id: 'card5',
    label: 'Dünya Bankası veya TÜİK gibi yasal yetkiye sahip kurumların periyodik araştırma raporları',
    correctBasket: 'reliable',
    note: 'Bilimsel metodoloji ile toplanmış, manipülasyona kapalı ve yasal verilerdir.',
  },
];

export interface Basket {
  id: BasketId;
  title: string;
  icon: string;
  slotIds: string[];
}

// Toplam 5 boşluk: Güvenilmez sepetinde 2, Güvenilir sepetinde 3 (doğru dağılımla birebir eşleşir).
export const BASKETS: Basket[] = [
  { id: 'unreliable', title: 'Güvenilmez Kaynak Sepeti', icon: '🔴', slotIds: ['0', '1'] },
  { id: 'reliable', title: 'Güvenilir Kaynak Sepeti', icon: '🟢', slotIds: ['2', '3', '4'] },
];

export interface AssessmentOption {
  id: string;
  label: string;
}

export interface AssessmentQuestion {
  id: number;
  prompt: string;
  question: string;
  options: AssessmentOption[];
  correctOptionId: string;
  explanation: string;
  points: number;
}

export const QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    prompt:
      'Sosyal medyada yayılan bir haberde, "X şirketinin kârı bu çeyrekte %500 arttı, şirket uçuşa geçti!" ifadeleri kullanılmıştır. Ancak şirketin resmi bilançosu incelendiğinde, şirketin asıl işinden zarar ettiği, bu %500\'lük artışın sadece şirketin merkez binasının satılmasından elde edilen tek seferlik bir gelir olduğu ortaya çıkmıştır. Haberi yapan sayfa, bina satışından hiç bahsetmemiştir.',
    question: 'Bu durum, veri okuryazarlığındaki tehlike işaretlerinden hangisine kesin bir örnektir?',
    options: [
      { id: 'A', label: 'Kaynak Eksikliği' },
      { id: 'B', label: 'Aşırı Duygu Kullanımı' },
      { id: 'C', label: 'Yanıltıcı ve Eksik Bilgi (Cherry-picking)' },
      { id: 'D', label: 'Birincil Kaynak Doğrulaması' },
      { id: 'E', label: 'Resmi Veri İhlali' },
    ],
    correctOptionId: 'C',
    explanation:
      'Bilginin sadece işe gelen, abartılı kısmı alınmış; genel bağlam kasten gizlenerek kitleler yanıltılmıştır. Bu taktiğe cımbızlama/cherry-picking denir.',
    points: 15,
  },
  {
    id: 2,
    prompt:
      'Finansal piyasalarda manipülasyon yapan anonim hesaplar, gönderilerinde genellikle "FLAŞ, ŞOK, İNANILMAZ" gibi kelimeleri ve büyük harfleri sıkça kullanırlar. Araya bolca "roket, ateş, para" emojisi ekleyerek okuyucunun dikkatini rakamlardan çok görsellere çekerler.',
    question:
      'Finansal medya okuryazarlığı ilkelerine göre, bu tarz bir aşırı duygu kullanımının asıl psikolojik amacı aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', label: 'Haberin resmi makamlarca onaylandığını kanıtlamak.' },
      { id: 'B', label: 'Okuyucunun analitik düşünme süresini kısaltıp, haberi sorgulamadan hızla kabul etmesini sağlamak.' },
      { id: 'C', label: 'Devletin istatistik kurumları ile işbirliği içinde olduklarını göstermek.' },
      { id: 'D', label: 'Karmaşık finansal verileri herkesin anlayacağı bir dilde basitleştirmek.' },
      { id: 'E', label: 'Verilerin uluslararası birincil kaynaklardan alındığını vurgulamak.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Duygu sömürüsü, panik ve FOMO (kaçırma korkusu), mantığın devreye girmesini engellemek ve teyitçiliği ortadan kaldırmak için kullanılan en yaygın manipülasyon taktiğidir.',
    points: 15,
  },
  {
    id: 3,
    prompt:
      'Ekonomik verileri araştıran bir lise öğrencisi, aynı konu hakkında üç farklı kaynaktan üç farklı rakam görmüştür.\n\nI. Kendini "ekonomi gurusu" ilan eden bir YouTube yayıncısının videosu\nII. Bir haber sitesinin "Enflasyon rakamları açıklandı" başlıklı makalesi\nIII. Resmi makamların "www.tuik.gov.tr" adresindeki aylık bülteni',
    question: 'Öğrencinin "altın kuralı" uygulayarak gerçeğe ulaşması için hangi numaralı kaynağı referans alması zorunludur?',
    options: [
      { id: 'A', label: 'Yalnız I' },
      { id: 'B', label: 'Yalnız II' },
      { id: 'C', label: 'Yalnız III' },
      { id: 'D', label: 'I ve II' },
      { id: 'E', label: 'II ve III' },
    ],
    correctOptionId: 'C',
    explanation:
      'Her finansal iddia, aracı kurumlardan veya yorumculardan değil, mutlaka resmi ve birincil kaynaklardan (.gov.tr uzantılı sitelerden) doğrulanmalıdır.',
    points: 15,
  },
  {
    id: 4,
    prompt:
      'Finansal okuryazarlığı zayıf olan bireyler, sosyal medyada veya mesajlaşma uygulamalarında karşılaştıkları "Kesin bilgi, yarın döviz fırlayacak, hemen alın!" veya "Ülke batıyor, acil paranızı çekin!" gibi hiçbir dayanağı olmayan duyumları gerçek bir veri gibi kabul edip paniğe kapılabilirler. Ekonomik terminolojide kesin bir veriye dayanmayan, genellikle piyasada korku yaratmak veya kitleleri yönlendirerek haksız kazanç sağlamak için kurgulanan bu tarz içeriklere "Spekülatif Gönderi" adı verilir.',
    question:
      'Buna göre, spekülatif gönderilerin toplumda hızla yayılmasının ve etkili olmasının en temel nedeni aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', label: 'Resmi istatistik kurumlarının bu tür duyumları kendi raporlarında desteklemesi' },
      { id: 'B', label: 'İnsanların mantıklı verilerden ziyade korku, panik ve açgözlülük gibi temel duygularına hitap etmesi' },
      { id: 'C', label: 'İddiaların, üniversitelerin akademik araştırmalarıyla doğrulanabilmesi' },
      { id: 'D', label: 'Blog sitelerinde detaylı ve uzun istatistiksel analizlere dayanması' },
      { id: 'E', label: 'İnsanların bütçe yönetimi ve finansal planlama bilincini artırmaya yönelik olması' },
    ],
    correctOptionId: 'B',
    explanation:
      'Spekülasyon gücünü rasyonel veriden değil; insanın panikleme, fırsatı kaçırma korkusu veya çabuk zengin olma arzusundan (açgözlülük) alır.',
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

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
