// "Kısa ve Uzun Vadeli Finansal Etki" oyunu için merkezi veri.
// Bölüm 1: 5 vakalık çoktan seçmeli (A/B/C) karar-sonuç oyunu.
// Bölüm 2: 4 vakalık sürükle-bırak "Kısa Vadeli / Uzun Vadeli Etki" eşleştirme oyunu.
// Her doğru cevap 10 puan, toplam 9 vaka × 10 = 90 puan.

export const POINTS_PER_CASE = 10;
export const PART1_TOTAL = 5;
export const PART2_TOTAL = 4;
export const TOTAL_CASES = PART1_TOTAL + PART2_TOTAL;
export const MAX_SCORE = POINTS_PER_CASE * TOTAL_CASES;

// ── Bölüm 1: Karar ve Gelecek Sonucu ────────────────────────────────────────

export type McAnswer = 'A' | 'B' | 'C';

export interface McOption {
  id: McAnswer;
  label: string;
  feedback: string;
}

export interface McCase {
  id: number;
  title: string;
  scenario: string;
  question: string;
  options: McOption[];
  correctAnswer: McAnswer;
}

export const PART1_CASES: McCase[] = [
  {
    id: 1,
    title: '💸 Dürtüsel Harcama (Anlık İstek)',
    scenario:
      'Yeni ve çok popüler olan bir oyun/eşya piyasaya çıktı. Elindeki tüm aylık bütçeni veya harçlığını ilk günden bu ürünü almak için harcadın.',
    question: 'Bu kararın önümüzdeki haftalardaki olası sonucu ne olur?',
    correctAnswer: 'A',
    options: [
      {
        id: 'A',
        label: 'Bütçem bittiği için ay sonuna kadar arkadaşlarımla yapacağım sosyal planlara veya acil ihtiyaçlarıma para bulamam.',
        feedback:
          'Tebrikler! Bütçeni planlamadan anlık heveslerle tek seferde harcamak, asıl ihtiyaçların veya sürpriz planların için seni zor durumda bırakır. İsteklerini zamana yaymayı öğrenmelisin.',
      },
      {
        id: 'B',
        label: 'Ailem veya yakınlarım bana anında fazladan ek bütçe sağlar.',
        feedback:
          'Tekrar Düşün! Gerçek hayatta her zaman anında ekstra bütçe bulamayabilirsin. Kendi paranı yönetme sorumluluğunu başkalarından beklememelisin.',
      },
      {
        id: 'C',
        label: 'Ürünü aldığım için hemen daha fazla para kazanmaya başlarım.',
        feedback:
          'Küçük Bir Hata! Sadece tüketim amaçlı (oynamak, kullanmak) alınan eşyalar sana para kazandırmaz, aksine bütçenden eksiltir.',
      },
    ],
  },
  {
    id: 2,
    title: '🐷 Küçük Kaçamakların Maliyeti (Birikim Hedefi)',
    scenario:
      'Uzun zamandır hayalini kurduğun bir bilgisayarı/bisikleti almak için para biriktiriyorsun. Ancak son günlerde her okul/iş çıkışında birikim kumbarandan para alıp pahalı atıştırmalıklar ve kahveler almaya başladın.',
    question: 'Bu alışkanlığının gelecekteki hedefine etkisi ne olur?',
    correctAnswer: 'C',
    options: [
      {
        id: 'A',
        label: 'Hayalindeki eşyayı tam planladığın tarihte satın alırsın.',
        feedback:
          'Dikkat Et! Birikim kumbarandan düzenli olarak para çekersen, hedefine ulaşman matematiksel olarak gecikecektir. Plana sadık kalmalısın.',
      },
      {
        id: 'B',
        label: 'Aldığın atıştırmalıklar zamanla değerlenip sana kar getirir.',
        feedback:
          'Yanılgı! Atıştırmalık veya kahve gibi tüketim harcamaları bir yatırım aracı değildir ve sana finansal bir getiri sağlamaz.',
      },
      {
        id: 'C',
        label: 'Hedefine ulaşma süren aylar, belki de yıllar kadar uzar.',
        feedback:
          '"Damlaya damlaya göl olur" sözü tersine de işler; küçük ve önemsiz görünen harcamalar birleştiğinde en büyük hedeflerini bile geciktirebilir.',
      },
    ],
  },
  {
    id: 3,
    title: '🎬 Abonelik Tuzağı (Görünmez Giderler)',
    scenario:
      'Sadece bir diziyi izlemek için bir film platformunun "1 Ay Ücretsiz Deneme" kampanyasına katıldın ve kart bilgilerini girdin. Ancak diziyi bitirdikten sonra aboneliği iptal etmeyi unuttun.',
    question: 'Aylar sonra banka/hesap hareketlerini kontrol ettiğinde neyle karşılaşırsın?',
    correctAnswer: 'B',
    options: [
      {
        id: 'A',
        label: 'Sadece diziyi izlediğim günlerin ücreti kesilmiş olur.',
        feedback:
          'Gözden Kaçan Detay! Abonelik sistemleri genellikle kullandığın gün kadar değil, aylık paketler halinde bütün olarak ücretlendirilir.',
      },
      {
        id: 'B',
        label: 'Hiç kullanmadığım bir hizmet için hesabımdan aylarca düzenli para çekilmiş olur.',
        feedback:
          'Çok Doğru! İptal edilmeyen "ücretsiz" denemeler otomatik olarak ücretli aboneliğe dönüşür. Kredi kartı ekstrelerini ve dijital üyeliklerini düzenli kontrol etmek "görünmez giderleri" engeller.',
      },
      {
        id: 'C',
        label: 'Platform kullanmadığımı fark edip üyeliğimi kendiliğinden ücretsiz iptal eder.',
        feedback:
          'Biraz İyimser! Platformlar senin hizmeti kullanıp kullanmadığını önemsemez, aboneliği iptal etmek tamamen senin sorumluluğundadır.',
      },
    ],
  },
  {
    id: 4,
    title: '🛡️ Acil Durum Fonunun Gücü (Risk Yönetimi)',
    scenario:
      'Vitrinde gördüğün marka bir tişörtü almak yerine, o parayı "beklenmedik durumlar" için ayırdın ve biriktirdin. Bir sonraki hafta telefonunu düşürdün ve ekranı kırıldı.',
    question: 'Kenara para ayırma kararın bu durumu nasıl etkiler?',
    correctAnswer: 'A',
    options: [
      {
        id: 'A',
        label: 'Tamir masrafını karşılayacak bütçem olduğu için borca girmeden günlük hayatıma devam edebilirim.',
        feedback:
          'Mükemmel! Acil durum fonu tam olarak bunun içindir. Beklenmedik kriz anlarında seni borca girmekten koruyan en güçlü kalkan kendi birikimindir.',
      },
      {
        id: 'B',
        label: 'Tişörtü almadığım için ekran kırılmasaydı para boşa gitmiş olurdu.',
        feedback:
          'Farklı Bir Bakış Açısı! Kötü bir olay yaşanmasa bile birikim yapmak "boşa giden" bir para değildir, senin finansal güvencendir.',
      },
      {
        id: 'C',
        label: 'Yeni bir telefon almak için başkalarından borç istemek zorunda kalırım.',
        feedback:
          'Riskli Hamle! Zaten kenara para ayırdığın için bu krizi kendi başına çözebilirsin; başkalarından borç istemeye gerek kalmaz.',
      },
    ],
  },
  {
    id: 5,
    title: '🤝 Borçlanma ve Planlama (Kredi Bilinci)',
    scenario:
      'Çok gitmek istediğin bir etkinlik için cebinde para yok. Bir arkadaşından borç aldın ve "haftaya öderim" diye söz verdin. Ancak haftaya eline geçecek net bir gelirin veya harçlığın yok.',
    question: 'Önümüzdeki hafta geldiğinde yaşayacağın en olası durum nedir?',
    correctAnswer: 'C',
    options: [
      {
        id: 'A',
        label: 'Arkadaşım borcumu unutur ve bedava etkinliğe gitmiş olurum.',
        feedback:
          'Gerçekçi Değil! Borç, bir sorumluluktur. Unutulmasını ummak veya ödememek güvenilirliğini zedeler ve finansal bir planlama yöntemi olamaz.',
      },
      {
        id: 'B',
        label: 'Etkinliğe gittiğim için borcum kendiliğinden silinir.',
        feedback:
          'Yanlış Eşleştirme! Etkinliğe katılmak sadece anlık bir eğlencedir, arkadaşına olan finansal yükümlülüğünü (borcunu) ortadan kaldırmaz.',
      },
      {
        id: 'C',
        label: 'Borcumu ödeyemediğim için hem güvenilirliğim zedelenir hem de stres yaşarım.',
        feedback:
          'Kesinlikle! Gelecekteki gelirini net olarak bilmeden "nasılsa öderim" diyerek borçlanmak, zamanı geldiğinde büyük bir strese ve ikili ilişkilerde güven kaybına yol açar.',
      },
    ],
  },
];

// ── Bölüm 2: Kısa ve Uzun Vadeli Etki Eşleştirmesi ──────────────────────────

export type ImpactAnswer = 'SHORT' | 'LONG';

export interface ImpactOption {
  id: ImpactAnswer;
  label: string;
  desc: string;
}

export const IMPACT_OPTIONS: ImpactOption[] = [
  { id: 'SHORT', label: 'Kısa Vadeli Etki', desc: 'Etkisini hemen o gün/hafta gösterir' },
  { id: 'LONG', label: 'Uzun Vadeli Etki', desc: 'Etkisi aylar, hatta yıllar sonra ortaya çıkar' },
];

export interface ImpactCase {
  id: number;
  title: string;
  scenario: string;
  correctAnswer: ImpactAnswer;
  correctFeedback: string;
  wrongFeedback: string;
}

export const PART2_CASES: ImpactCase[] = [
  {
    id: 1,
    title: 'Dışarıdan Yemek Söylemek',
    scenario:
      'Evde yemek yapmak veya evden yemek götürmek yerine o gün öğle yemeğini lüks bir restorandan söyledin.',
    correctAnswer: 'SHORT',
    correctFeedback:
      'Doğru Eşleştirme! Bu tekil bir harcamadır. O günkü günlük veya haftalık bütçeni anlık olarak azaltır ancak hayatının geri kalanını derinden etkileyecek uzun vadeli bir finansal krize yol açmaz. (Unutma: Her gün yaparsan işler değişir!)',
    wrongFeedback:
      'Tekrar Düşün! Sadece bir öğün dışarıdan yemek yemek, hayatının geri kalanını veya yıllar sonrasını derinden etkileyecek büyük bir finansal karar değildir. Bu, yalnızca o günkü bütçeni daraltan kısa vadeli bir harcamadır. (Ancak unutma, bunu her gün alışkanlık haline getirirsen uzun vadeli bir probleme dönüşebilir!)',
  },
  {
    id: 2,
    title: 'Düzenli Yatırım / Birikim Yapmaya Başlamak',
    scenario:
      "Eline geçen her gelirin %10'unu hiç dokunmamak üzere bir yatırım veya birikim hesabına aktarma kararı aldın ve bunu uygulamaya başladın.",
    correctAnswer: 'LONG',
    correctFeedback:
      'Harika! Yatırımın gerçek gücü zamanla ortaya çıkar. Bugün kenara ayırdığın o küçük tutarlar, aylar ve yıllar sonra "bileşik getiri" sayesinde sana büyük bir finansal özgürlük olarak geri dönecektir.',
    wrongFeedback:
      'Küçük Bir Karışıklık! Yatırım yapmak anlık bir sonuç vermez. Bugün kenara ayırdığın paranın gerçek gücünü hemen yarın değil, aylar ve yıllar geçtikçe birikerek büyümesiyle görürsün. Bu yüzden etkisi kesinlikle uzun vadeli ve geleceğini şekillendiren bir adımdır.',
  },
  {
    id: 3,
    title: 'Kalitesiz ve Ucuz Ürün Almak (Sahte Tasarruf)',
    scenario:
      'Ayakkabı ihtiyacın var. Kaliteli ve uzun süre dayanacak bir ayakkabı almak yerine, çok ucuz olduğu için kalitesiz malzemeden yapılmış bir ayakkabı tercih ettin.',
    correctAnswer: 'SHORT',
    correctFeedback:
      'Hedefi Vurdun! Anlık olarak tasarruf ettiğini (kısa vadeli rahatlama) düşünebilirsin ama o ürün çok çabuk bozulacağı için kısa süre sonra yeniden para harcamak zorunda kalırsın. Buna finansta "sahte tasarruf" denir.',
    wrongFeedback:
      'Farklı Bir Açıdan Bak! Aldığın bu eşya kalitesiz olduğu için maalesef uzun yıllar dayanamayacak ve çok kısa sürede bozulacaktır. Yani bu kararın etkisi ömür boyu sürmez, aksine seni yakın zamanda tekrar masrafa sokarak kısa vadede etkisini gösterir.',
  },
  {
    id: 4,
    title: 'Eğitime ve Kişisel Gelişime Bütçe Ayırmak',
    scenario:
      'Hafta sonu eğlencesine harcayacağın bütçe ile yabancı dil pratiği yapabileceğin bir kampa veya yeni bir yetenek (örneğin yazılım, tasarım vb.) öğrenebileceğin bir dijital eğitime kayıt oldun.',
    correctAnswer: 'LONG',
    correctFeedback:
      'Çok İyi Bir Vizyon! Eğitime harcanan bütçe asla bir gider değil, aksine en güçlü yatırımdır. Bugün o eğitimde edindiğin yeni bir beceri, ileride sana yepyeni kariyer fırsatları ve sürekli gelir kapıları açarak ömür boyu fayda sağlar.',
    wrongFeedback:
      'Dikkat Et! Eğitime harcadığın para, bütçeni anlık olarak azalttığı için sana kısa vadeli gibi gelmiş olabilir. Ancak orada öğreneceğin yeni bir dil veya beceri, hayatın boyunca karşına çıkacak yeni kariyer fırsatlarını şekillendirir. Bu yüzden eğitimin etkisi her zaman uzun vadeli ve kalıcıdır.',
  },
];

// ── Bilgi Merkezi ────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  term: string;
  def: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'Bütçe', def: 'Belirli bir süre (hafta/ay) için elindeki parayı nasıl dağıtacağını gösteren plandır.' },
  {
    term: 'İstekler ve İhtiyaçlar',
    def: 'Hayatta kalmak ve temel yaşantımızı sürdürmek için zorunlu olan şeyler (ihtiyaçlar) ile hayatımıza keyif katan ama olmazsa da yaşayabileceğimiz şeyler (istekler) arasındaki dengedir.',
  },
  {
    term: 'Dürtüsel Harcama',
    def: 'Üzerine düşünmeden, tamamen o anki duygu ve hevesle aniden yapılan, genellikle bütçeyi zorlayan harcamalardır.',
  },
  {
    term: 'Acil Durum Fonu',
    def: 'Telefonun kırılması, sağlığın bozulması gibi hiç beklenmedik ve aniden gelişen kötü sürprizlere karşı kenarda bekletilen koruyucu paradır.',
  },
  {
    term: 'Sahte Tasarruf',
    def: '"Çok ucuz" olduğu için alınan ama kalitesizliği yüzünden hemen bozulan, bu yüzden tekrar para harcatıp aslında daha pahalıya gelen ürünlerdir.',
  },
  {
    term: 'Görünmez Giderler (Abonelikler)',
    def: 'Her ay hesabından otomatik çekilen ama kullanmadığın için unuttuğun küçük para çıkışlarıdır.',
  },
  {
    term: 'Bileşik Getiri',
    def: 'Biriktirdiğin paranın zamanla değer kazanması ve bu kazandığı değerin de ekstra getiri sağlamasıdır. Para topunun yuvarlandıkça çığa dönüşmesidir.',
  },
];

export interface StrategyTip {
  title: string;
  desc: string;
}

export const STRATEGY_TIPS: StrategyTip[] = [
  {
    title: 'Her Harcama Bir Yolculuktur',
    desc:
      'Cebinden çıkan her para, sadece bir eşya satın almak demek değildir; aynı zamanda gelecekteki "sen" için verilmiş bir karardır. Bugün vitrinde görüp beğendiğin ürünü almak (anlık tatmin), yarın karşına çıkacak dev bir fırsatı kaçırmana sebep olabilir.',
  },
  {
    title: 'Zaman Çizgisi: Kısa Vade ve Uzun Vade',
    desc:
      'Kısa vadeli kararlar etkisini hemen o gün veya o hafta gösterir (örn. dışarıdan yemek söylemek). Uzun vadeli kararların etkisi aylar, hatta yıllar sonra ortaya çıkar (örn. eğitim, düzenli birikim).',
  },
  {
    title: 'Sihirli Formül: Planlama',
    desc:
      'Gelecekteki büyük hedeflerine ulaşmanın tek yolu plan yapmaktır. Bütçendeki payı önce İhtiyaçlar, ardından İstekler ile birikim hedeflerin arasında doğru dağıttığında, sürpriz krizler seni yolundan edemez.',
  },
];

export function getPerformance(correctCount: number): { label: string; sub: string; icon: string; color: string; bg: string } {
  if (correctCount === TOTAL_CASES)
    return { label: 'Geleceğini Planlayan Sensin!', sub: 'Tüm vakalarda kısa/uzun vadeli etkiyi doğru okudun.', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (correctCount >= 7)
    return { label: 'Çok İyi İş!', sub: 'Neredeyse tüm vakalarda doğru karar verdin.', icon: '👍', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (correctCount >= 4)
    return { label: 'Kısmi Anlayış', sub: 'Bazı vakalarda daha dikkatli olabilirdin.', icon: '📘', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', sub: 'Bilgi Merkezi\'ni tekrar incele ve yeniden dene.', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
