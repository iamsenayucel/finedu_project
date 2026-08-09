// "Piyasa Dedektifi & Davranışsal Finans Bitirme Testi" oyunu için merkezi veri.
// Bölüm 1: Piyasa Dedektifi — 5 piyasa senaryosu, Boğa / Ayı / Yatay piyasa döngülerinden biri seçilir (vaka başı 5 puan, toplam 25 puan).
// Bölüm 2: Davranışsal Finans Bitirme Testi — 5 çoktan seçmeli (A-E) soru (soru başı 15 puan, toplam 75 puan).
// Toplam 100 puan, tek kesintisiz süre 25 dakika. Her vaka/soru cevaplandığı anda doğru/yanlış ve açıklama gösterilir.

export const GAME_DURATION_MS = 25 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_CASE = 5;
export const TOTAL_CASE_POINTS = 25;
export const POINTS_PER_QUESTION = 15;
export const TOTAL_QUESTION_POINTS = 75;
export const TOTAL_POINTS = 100;

export type MarketCycleId = 'bull' | 'bear' | 'sideways';

export interface MarketCycleOption {
  id: MarketCycleId;
  label: string;
  icon: string;
}

export const MARKET_CYCLES: MarketCycleOption[] = [
  { id: 'bull', label: 'Boğa Piyasası', icon: '🐂' },
  { id: 'bear', label: 'Ayı Piyasası', icon: '🐻' },
  { id: 'sideways', label: 'Yatay Piyasa', icon: '➖' },
];

export interface MarketCase {
  id: number;
  title: string;
  scenario: string;
  correctCycle: MarketCycleId;
  explanation: string;
}

export const SECTION1_TITLE = 'Piyasa Dedektifi';
export const SECTION1_INSTRUCTION =
  'Aşağıdaki piyasa senaryosunu incele ve piyasanın hangi döngü içinde olduğuna karar ver: Boğa Piyasası, Ayı Piyasası ya da Yatay Piyasa.';

export const MARKET_CASES: MarketCase[] = [
  {
    id: 1,
    title: 'Vaka 1 — Aşırı Risk İştahı',
    scenario:
      'Finansal piyasalarda son 6 aydır sürekli yukarı yönlü bir trend yaşanmaktadır. Ekonomik haber kanalları her gün "Tarihi Zirve" manşetleri atmakta, piyasa okuryazarlığı olmayan bireyler bile kredi çekerek yüksek riskli teknoloji hisselerine yatırım yapmaktadır. Piyasada risk iştahı ve aşırı iyimserlik en üst seviyededir.',
    correctCycle: 'bull',
    explanation:
      'Fiyatların ve coşkunun sürekli arttığı, mantıktan ziyade iyimserliğin piyasayı yukarı taşıdığı dönemdir.',
  },
  {
    id: 2,
    title: 'Vaka 2 — İşlem Hacminde Daralma',
    scenario:
      'Borsadaki günlük işlem hacimleri son ayların en düşük seviyesine gerilemiştir. Fiyat grafikleri incelendiğinde, endeksin dar bir bant arasına sıkıştığı, ne net bir yükseliş ivmesi ne de net bir düşüş trendi gösterdiği görülmektedir. Analistler, piyasada büyük bir "bekle-gör" politikasının ve eylemsizliğin hakim olduğunu belirtmektedir.',
    correctCycle: 'sideways',
    explanation: 'Fiyatların belirli bir sınır içinde sıkıştığı ve hareketliliğin düşük olduğu piyasa dönemidir.',
  },
  {
    id: 3,
    title: 'Vaka 3 — Kurumsal Panik ve FUD',
    scenario:
      'Küresel çapta gelen olumsuz ekonomik verilerin ardından piyasalarda sert bir satış dalgası başlamıştır. Bilançoları çok güçlü ve kârlı olan şirketlerin hisse değerleri bile hızla erimekte, kitleler "fiyatlar sıfırlanacak" korkusuyla (FUD) ellerindeki varlıkları mantıksızca zararına satıp acilen nakde geçmeye çalışmaktadır.',
    correctCycle: 'bear',
    explanation: 'Karamsarlığın, korkunun ve panik satışlarının hakim olduğu düşüş trendidir.',
  },
  {
    id: 4,
    title: 'Vaka 4 — Temettü ve Pasif Bekleyiş',
    scenario:
      'Piyasada uzun süredir hiçbir yükseliş belirtisi olmamasına rağmen, bilinçli bir yatırımcı portföyündeki sağlam şirket hisselerini satmamıştır. Çünkü hisse fiyatları yerinde saysa da yatırımcının ortak olduğu şirketler faaliyetlerine devam edip kâr etmekte ve bu kârı düzenli olarak nakit, yani temettü şeklinde yatırımcısına ödemektedir.',
    correctCycle: 'sideways',
    explanation: 'Durgunluk dönemlerinde temettü gibi pasif gelir kaynakları yatırımcının bekleme sürecini destekleyebilir.',
  },
  {
    id: 5,
    title: 'Vaka 5 — Rasyonel Kopuş ve FOMO',
    scenario:
      'Belirli bir dijital varlığın fiyatı; hiçbir üretime, teknolojik altyapıya veya bilançoya dayanmaksızın sadece sosyal medyadaki rüzgarla kısa sürede %300 artmıştır. "Treni kaçırıyorum, herkes zengin oldu" psikolojisine (FOMO) giren kitleler, hiçbir temel analiz yapmadan tüm birikimlerini bu spekülatif varlığa yatırmaktadır.',
    correctCycle: 'bull',
    explanation:
      'Yükseliş trendlerinin en tehlikeli aşamalarından biridir. FOMO nedeniyle yatırımcılar mantıklı analiz yerine yükselen fiyatları takip ederek karar verebilir.',
  },
];

export interface FinanceOption {
  id: string;
  label: string;
}

export interface FinanceQuestion {
  id: number;
  prompt: string;
  options: FinanceOption[];
  correctOptionId: string;
  explanation: string;
  points: number;
}

export const SECTION2_TITLE = 'Davranışsal Finans Bitirme Testi';
export const SECTION2_INSTRUCTION = 'Aşağıdaki soruyu oku ve A-E seçeneklerinden tek bir doğru cevabı işaretle.';

export const SECTION2_QUESTIONS: FinanceQuestion[] = [
  {
    id: 1,
    prompt:
      'Arda, borsaya girdikten sonraki ilk 6 ayında yaptığı yatırımların sürekli yükseldiğini görmüş ve kendisini finans konusunda çok başarılı sanarak kredi çekip daha fazla yatırım yapmıştır.\n\n7. ayda makroekonomik veriler kötüleşmiş, piyasada sert satışlar başlamış ve Arda borçla yaptığı yatırımlar nedeniyle büyük zarar yaşamıştır.\n\nBu olaydan çıkarılması gereken temel davranışsal finans dersi nedir?',
    options: [
      { id: 'A', label: 'Borsada sadece teknoloji hisselerine yatırım yapılmalıdır.' },
      { id: 'B', label: 'Piyasalar her zaman yükseleceği için kriz anları geçicidir.' },
      { id: 'C', label: 'Piyasalar döngüseldir; sürekli yükseliş veya sürekli düşüş yoktur ve en büyük risklerden biri aşırı özgüvendir.' },
      { id: 'D', label: 'Ayı piyasalarında kredi çekerek yatırım yapmak en mantıklı stratejidir.' },
      { id: 'E', label: 'Nakit tutmak enflasyon karşısında her zaman zarar ettirir.' },
    ],
    correctOptionId: 'C',
    explanation:
      'Piyasalar döngüseldir. Uzun süren yükseliş dönemleri yatırımcıda aşırı özgüven oluşturabilir ve bu durum gereğinden fazla risk alınmasına neden olabilir.',
    points: 15,
  },
  {
    id: 2,
    prompt:
      'Bir şirketin hisse senedi fiyatı yaklaşık bir yıldır aynı fiyat aralığında hareket etmektedir. Şirket ise düzenli olarak kâr etmekte ve hissedarlarına temettü dağıtmaktadır.\n\nAcemi bir yatırımcı piyasadaki hareketsizlikten sıkılarak bu şirketi satıp sosyal medyada popüler olan spekülatif Nova-X fonuna yatırım yapmaktadır.\n\nBu davranış hangisiyle açıklanabilir?',
    options: [
      { id: 'A', label: 'Kriz anında likidite yaratarak fırsatları değerlendirmek' },
      { id: 'B', label: 'Düzenli pasif gelir üreten bir varlığı anlık heyecan ve FOMO uğruna feda etmek' },
      { id: 'C', label: 'Riskleri dağıtarak güvenli limanlara sığınmak' },
      { id: 'D', label: 'Ayı piyasasının yarattığı FUD nedeniyle zararına satış yapmak' },
      { id: 'E', label: 'Enflasyona karşı alım gücünü garanti etmek' },
    ],
    correctOptionId: 'B',
    explanation:
      'Fiyatı yükselmese bile düzenli pasif gelir üreten bir varlığı yalnızca heyecan arayışı nedeniyle terk etmek yanlış yatırım davranışlarından biri olabilir.',
    points: 15,
  },
  {
    id: 3,
    prompt:
      'Boğa piyasasında yatırımcıların "Herkes kazanıyor, ben geri kaldım." düşüncesiyle mantıksız kararlar vermesine FOMO denir.\n\nFOMO\'ya kapılan bir yatırımcının aşağıdaki davranışlardan hangisini göstermesi daha olasıdır?',
    options: [
      { id: 'A', label: 'Tüm parasını güvenli yatırım araçlarında tutması' },
      { id: 'B', label: 'Temettü hisselerini alıp uzun yıllar beklemesi' },
      { id: 'C', label: 'Araştırma yapmadan, yalnızca fiyatı çok hızlı yükseldiği için temeli zayıf bir varlığı zirve fiyatından satın alması' },
      { id: 'D', label: 'Piyasalar yükseliyor diye elindeki tüm varlıkları zararına satması' },
      { id: 'E', label: 'Yatırım kararlarını bağımsız denetim raporlarına göre vermesi' },
    ],
    correctOptionId: 'C',
    explanation:
      'FOMO yaşayan yatırımcı temel analizden çok yükselen fiyatlara odaklanabilir ve yükselişi kaçırmamak için zirve seviyelerden yatırım yapabilir.',
    points: 15,
  },
  {
    id: 4,
    prompt:
      "Zeynep'in elinde bilançosu güçlü bir şirketin hisseleri bulunmaktadır.\n\nSosyal medyada anonim hesapların \"Borsa tamamen çökecek, şirket batacak!\" mesajlarını gördükten sonra panikleyen Zeynep hisselerini %40 zararla satmıştır.\n\nBir ay sonra şirket rekor kâr açıklamış ve hisse eski fiyat seviyesine dönmüştür.\n\nZeynep'in zarar etmesinin temel nedeni nedir?",
    options: [
      { id: 'A', label: 'Yatay piyasanın sıkıcılığından macera araması' },
      { id: 'B', label: "Somut verilere değil, sosyal medyadaki korku ve FUD'a kapılarak panik satışı yapması" },
      { id: 'C', label: 'Düzenli pasif gelir elde etmeye çalışması' },
      { id: 'D', label: 'FOMO nedeniyle zirveden yatırım yapması' },
      { id: 'E', label: 'Nakit oranını fazla yüksek tutması' },
    ],
    correctOptionId: 'B',
    explanation: 'Zeynep şirketin temel verileri yerine sosyal medyadaki korku söylemlerinden etkilenmiş ve panik satışı gerçekleştirmiştir.',
    points: 15,
  },
  {
    id: 5,
    prompt:
      'Finansal piyasalar zaman içerisinde:\n\nAşırı Coşku / Boğa → Panik ve Çöküş / Ayı → Sıkıcı Bekleyiş / Yatay\n\ngibi farklı dönemlerden geçebilir.\n\nBu piyasa döngülerini anlayan bilinçli bir yatırımcının temel yaklaşımı hangisi olmalıdır?',
    options: [
      { id: 'A', label: 'Piyasa yükseldiğinde tüm parasıyla alım yapmak' },
      { id: 'B', label: 'Piyasa düşmeye başladığında hiçbir zaman nakit bulundurmamak' },
      { id: 'C', label: 'Kararları sosyal medyadaki kalabalığın psikolojisine göre vermek' },
      { id: 'D', label: 'Duygularını kontrol ederek farklı piyasa koşullarına uygun dengeli bir portföy yönetmek' },
      { id: 'E', label: 'Yatay piyasalarda bütün parayı tek bir spekülatif alana aktarmak' },
    ],
    correctOptionId: 'D',
    explanation:
      'Bilinçli yatırımcı piyasayı sürekli doğru tahmin etmeye çalışmak yerine farklı piyasa şartlarına karşı hazırlıklı olacak şekilde portföyünü yönetir.',
    points: 15,
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 100) return { label: 'Piyasa Dedektifi Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 75) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
