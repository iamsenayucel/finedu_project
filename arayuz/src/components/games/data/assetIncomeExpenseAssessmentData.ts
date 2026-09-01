// "Senin Varlığın Ne Üretiyor?" ölçme-değerlendirme oyunu için merkezi veri.
// 10 vaka, her biri "Gelir Oluşturan Varlık" / "Gider Oluşturan Varlık" olarak sınıflandırılır.
// Doğru cevap 10 puan, toplam 100 puan. Başarı yüzdesi = (doğru sayısı / 10) × 100.

export const POINTS_PER_CASE = 10;
export const TOTAL_CASES = 10;
export const MAX_SCORE = POINTS_PER_CASE * TOTAL_CASES;

export type AssetAnswer = 'INCOME_ASSET' | 'EXPENSE_ASSET';

export interface AssetOption {
  id: AssetAnswer;
  label: string;
}

export const ASSET_OPTIONS: AssetOption[] = [
  { id: 'INCOME_ASSET', label: 'Gelir Oluşturan Varlık' },
  { id: 'EXPENSE_ASSET', label: 'Gider Oluşturan Varlık' },
];

export interface AssetCase {
  id: number;
  title: string;
  scenario: string;
  correctAnswer: AssetAnswer;
  correctFeedback: string;
  wrongFeedback: string;
}

export const ASSET_CASES: AssetCase[] = [
  {
    id: 1,
    title: '🎮 Oyuncu Bilgisayarı',
    scenario:
      '"Sınava hazırlık" diyerek ailene aldırdığın ama günün 6 saatini oyunla geçirdiğin, üstüne her ay ücretli oyun platformlarına yüksek abonelik ücretleri ödemene neden olan o üst düzey bilgisayar senin için finansal olarak nedir?',
    correctAnswer: 'EXPENSE_ASSET',
    correctFeedback:
      'Tebrikler! Cihazın adı "eğitim aracı" olsa da, kullanım şeklin onu değiştirdi. Üstüne çıkardığı aylık zorunlu masraflarla o senin için sadece gider oluşturan bir varlıktır.',
    wrongFeedback:
      'Eyvah, kendi kendini kandırdın! Belki eğitim amacıyla yola çıktın ama şu an o cihaz sana para kazandırmıyor, aksine oyun abonelikleriyle cebinden sürekli para yiyor. Nakit akışı eksiyse, o bir giderdir.',
  },
  {
    id: 2,
    title: '📱 Akıllı Telefon',
    scenario:
      'Sosyal medya yönetimi ve video kurgu işleri alarak harçlığını çıkarmak için taksitle aldığın, taksitlerini de sadece bu işlerden kazandığın parayla ödediğin yeni nesil telefon senin için finansal olarak nedir?',
    correctAnswer: 'INCOME_ASSET',
    correctFeedback:
      'Harika tespit! Normalde telefonlar tüketim aracıdır ama sen onu bir iş aracına dönüştürüp maliyetinden fazlasını kazandığın için, o telefon senin için gelir oluşturan bir varlığa dönüşmüştür.',
    wrongFeedback:
      'Yanlış karar! Normalde haklısın, telefonlar genelde masraf kapısıdır. Ama dikkat et, burada telefonu kullanarak iş yapıyor ve para kazanıyorsun! Kendi taksidini ödeyen ve üstüne kazandıran her araç senin için çalışan bir işçidir.',
  },
  {
    id: 3,
    title: '🏖 Hisse Senedi',
    scenario:
      'Yaz tatilinde çalışıp biriktirdiğin parayla satın aldığın ve şirket kâr ettikçe her yıl hesabına tıkır tıkır kâr payı (temettü) yatıran köklü bir şirketin hisse senedi senin için finansal olarak nedir?',
    correctAnswer: 'INCOME_ASSET',
    correctFeedback:
      'Doğru! Sahip olduğun bu dijital varlık (hisse) senin yerine çalışıyor ve sen yorulmadan cebine düzenli olarak para koyuyor.',
    wrongFeedback:
      'Hata yaptın! Paranı bir yere bağladın diye o gider olmaz. Bu hisse senden ekstra masraf istemiyor, aksine şirket kâr ettikçe sana ödeme yapıyor. Cebine nakit koyan bir şeye gider diyemeyiz.',
  },
  {
    id: 4,
    title: '🚗 İlk Araba',
    scenario:
      '18 yaşına girer girmez hevesle kredi çekip aldığın; sigortası, kaskosu, vergisi ve benzin masrafı yüzünden sırf ona bakabilmek için hafta sonları ek işe girmene sebep olan o otomobil senin için finansal olarak nedir?',
    correctAnswer: 'EXPENSE_ASSET',
    correctFeedback:
      'Nokta atışı! Arabanın ruhsatı senin adına olabilir, satarsan para da edebilir. Ancak elinde tuttuğun her gün cebinden sürekli nakit çıkardığı için o araç net bir gider oluşturan varlıktır.',
    wrongFeedback:
      'Büyük bir tuzağa düştün! "Araba benim, satarsam para eder" illüzyonuna kapılma. Sen bu arabayla kuryelik veya taksicilik yapmıyorsun. Sadece benzin ve vergi ödüyorsun. Cüzdanını sürekli boşaltan her mülk gider yaratır.',
  },
  {
    id: 5,
    title: '👾 Mobil Oyun',
    scenario:
      'Kendi kendine kodlama öğrenip uygulama mağazasına yüklediğin ve indirenler oynadıkça her ay ufak ufak reklam parası getiren o basit mobil oyun uygulaman senin için finansal olarak nedir?',
    correctAnswer: 'INCOME_ASSET',
    correctFeedback:
      'Çok iyi! Zamanını ve zekanı kullanarak sıfırdan dijital bir varlık yarattın. Artık uyurken bile sana nakit akışı sağlıyor.',
    wrongFeedback:
      'Gözden kaçırdın! Eğer oyunu sadece oynayan sen olsaydın haklıydın, vakit ve şarj gideri olurdu. Ama sen bu oyunu YAZDIN ve sana reklam geliri getiriyor. Cebine nakit girdiği an o artık bir gelir üretecidir.',
  },
  {
    id: 6,
    title: '👗 Tasarım Kıyafet',
    scenario:
      'Sadece mezuniyet balosunda bir gece giyeceğin, sonrasında aylarca dolapta bekleyecek olan ama kredi kartında tam 6 ay boyunca taksidini ödemeye devam edeceğin o çok pahalı marka kıyafet senin için finansal olarak nedir?',
    correctAnswer: 'EXPENSE_ASSET',
    correctFeedback:
      'Kesinlikle. Dolabında asılı duran fiziksel bir eşyan olabilir ama bir kez kullanılıp aylarca borç ödeten bu kıyafet, sadece bütçene gider oluşturan bir varlıktır.',
    wrongFeedback:
      'Maalesef yanlış! Üstünde pahalı bir marka yazması veya seni havalı göstermesi, ona finansal bir değer katmaz. Üstüne 6 ay taksit ödeyeceksin. Bütçenden sürekli para çıkaran ve kazanç sağlamayan hiçbir eşya gelir oluşturmaz.',
  },
  {
    id: 7,
    title: '🏦 Vadeli Fon/Mevduat',
    scenario:
      'Kumbaranda boş boş duran nakit parayı, enflasyona ezilmesin diye bankada risksiz ve düzenli getiri (kâr/faiz) sağlayan bir yatırım hesabına geçirdiğinde, o hesaptaki paran senin için finansal olarak neye dönüşür?',
    correctAnswer: 'INCOME_ASSET',
    correctFeedback:
      'Zekice hamle. Yastık altındaki para durduğu yerde erir. Sen ona bir görev verdin ve cebine ekstra nakit koyan, senin için çalışan bir varlığa dönüştürdün.',
    wrongFeedback:
      'Yanlış değerlendirme! Parayı bankaya bağladın ve anında harcayamıyorsun diye o bir gider olmaz. Aksine, o hesap sana düzenli kâr veriyor. Yani para senin için çalışıp yeni paralar üretiyor.',
  },
  {
    id: 8,
    title: '🚁 Kameralı Drone',
    scenario:
      'İndirimde görüp hevesle satın aldığın ancak profesyonel bir iş (çekim vb.) yapmadığın için köşede duran; üstüne her uçurduğunda kırılan pervaneleri ve bozulan bataryalarıyla sürekli para harcatan drone senin için finansal olarak nedir?',
    correctAnswer: 'EXPENSE_ASSET',
    correctFeedback:
      'Harika analiz. Havalı ve teknolojik bir varlığa sahipsin ama bu varlık sana para kazandırmadığı gibi, sürekli ek masraf çıkararak bütçende kalıcı bir gider oluşturuyor.',
    wrongFeedback:
      'Teknolojinin büyüsüne kapıldın ve yanıldın! Eğer bu drone ile düğün/emlak çekimi yapıp para kazansaydın haklıydın. Ama şu an sadece bozulan parçalarına para ödüyorsun. Cüzdanın için uçan bir kara delik!',
  },
  {
    id: 9,
    title: '🥽 Sanal Gerçeklik Gözlüğü (VR)',
    scenario:
      'Yarı fiyatına buldum diye atladığın ama hakkıyla kullanabilmek için sürekli yeni oyunlar, ücretli eklentiler ve ekstra kollar satın almanı zorunlu kılan cihaz senin için finansal olarak nedir?',
    correctAnswer: 'EXPENSE_ASSET',
    correctFeedback:
      'Tebrikler, tuzağa düşmedin! Cihazı ucuza almış olsan da, kullanımı süresince zorunlu ek masraflar doğurduğu için bütçen adına gider oluşturan bir varlıktır.',
    wrongFeedback:
      'İndirim tuzağına düştün! Ucuza almak veya "kâr ettiğini" sanmak sana para kazandırmadı. Aksine kullanmak için sürekli yeni şeyler alman gerekiyor. Seni sürekli harcamaya ittiği için bu net bir giderdir.',
  },
  {
    id: 10,
    title: '🖨 3D Yazıcı',
    scenario:
      'Okuldaki proje ödevleri için aldığın, ama aynı zamanda diğer öğrencilerin proje parçalarını da ufak bir malzeme+işçilik ücreti karşılığı basarak kendi parasını çıkaran 3D yazıcı senin için finansal olarak nedir?',
    correctAnswer: 'INCOME_ASSET',
    correctFeedback:
      'Vizyoner bir hareket! Normalde sadece masraf kapısı olacak fiziksel bir makineyi fırsata çevirdin. O cihaz artık masrafını çıkarmakla kalmıyor, sana ekstra gelir üretiyor.',
    wrongFeedback:
      'Fırsatı göremedin! Sadece kendi ödevlerini yapsaydın haklıydın, tamamen kırtasiye gideri olurdu. Ama sen diğer öğrencilere baskı yapıp para kazanıyorsun. Makine kendi parasını çıkarıp seni kâra geçirdiği için artık senin için çalışan bir gelir kapısıdır.',
  },
];

export interface GlossaryTerm {
  term: string;
  def: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'Abonelik', def: 'Bir hizmeti kullanmak için her ay kartından otomatik kesilen düzenli para.' },
  { term: 'Taksit / Kredi', def: 'Bir eşyayı peşin alamayıp, parasını aylara bölerek ve genelde üstüne faiz ödeyerek alma işi.' },
  { term: 'Hisse Senedi', def: 'Bir şirkete küçük bir parayla ortak olmanı sağlayan, dijital sahiplik belgesi.' },
  { term: 'Temettü (Kâr Payı)', def: 'Hisse senedini aldığın şirketin, kazandığı paradan sana dağıttığı kâr.' },
  { term: 'Vadeli Hesap / Mevduat', def: 'Paranı bankaya koyduğunda, durduğu yerde erimesin diye üzerine düzenli getiri eklenen yatırım hesabı.' },
  { term: 'Mülkiyet', def: 'Bir eşyanın faturasının veya ruhsatının resmi olarak senin adına olması durumu.' },
];

export interface StrategyTip {
  title: string;
  desc: string;
}

export const STRATEGY_TIPS: StrategyTip[] = [
  {
    title: 'Temel Karar Sorusu',
    desc: '"Bu varlık cebime düzenli nakit mi koyuyor, yoksa cebimden düzenli nakit mi çıkarıyor?" Mülkiyet sende olması, o şeyin otomatik olarak sana kazandırdığı anlamına gelmez.',
  },
  {
    title: '🟢 Gelir Oluşturan Varlık (Aktif Karakterli Varlıklar)',
    desc:
      'Sahibine pozitif nakit akışı sağlayan, zaman içinde kendi içsel değerini artıran veya düzenli getiri üreten ekonomik kaynaklardır. Bu varlıklar sürdürülebilir bir kazanç yaratır ve bireyin toplam servetini kademeli olarak büyütür. Örnek: temettü veren hisse senetleri, gelir üreten dijital varlıklar, kendini amorti eden ekipmanlar.',
  },
  {
    title: '🔴 Gider Oluşturan Varlık (Tüketim Odaklı Mülkiyet)',
    desc:
      'Mülkiyet hakkı kişide bulunmasına rağmen, elde tutulduğu süre boyunca bakım, vergi, kredi faizi veya abonelik gibi operasyonel maliyetler (negatif nakit akışı) doğuran harcama kalemleridir. Genellikle zamanla değer kaybına uğrar ve bireyin finansal kapasitesini daraltır. Örnek: tüketici kredisiyle alınan lüks mallar, sürekli bakım maliyeti yaratan motorlu taşıtlar veya elektronik cihazlar.',
  },
];

// Fisher-Yates shuffle — orijinal diziyi bozmadan yeni bir sıralı kopya döner.
export function shuffleCases(cases: AssetCase[]): AssetCase[] {
  const arr = [...cases];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getPerformance(correctCount: number): { label: string; sub: string; icon: string; color: string; bg: string } {
  if (correctCount === TOTAL_CASES) return { label: 'Varlık Analisti!', sub: 'Tüm vakaları doğru analiz ettin.', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (correctCount >= 7) return { label: 'Çok İyi İş!', sub: 'Neredeyse tüm vakalarda doğru karar verdin.', icon: '👍', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (correctCount >= 4) return { label: 'Kısmi Anlayış', sub: 'Bazı vakalarda daha dikkatli olabilirdin.', icon: '📘', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', sub: 'Bilgi Merkezi\'ni tekrar incele ve yeniden dene.', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
