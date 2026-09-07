// "Yatırım mı, Tüketim mi? Vaka Değerlendirmesi" ölçme-değerlendirme oyunu için merkezi veri.
// 10 vaka, her vakada 2 aşama vardır:
//   1. Aşama: Senaryo "Yatırım Kutusu" / "Tüketim Kutusu" olarak sınıflandırılır.
//   2. Aşama: Ekonomi Sözlüğü / Strateji Merkezi'ne dayanan çoktan seçmeli (A/B/C) soru cevaplanır.
// Her aşama 5 puan değerindedir, toplam 10 vaka × 2 aşama × 5 puan = 100 puan.

export const POINTS_PER_STAGE = 5;
export const TOTAL_CASES = 10;
export const TOTAL_STAGES = TOTAL_CASES * 2;
export const MAX_SCORE = POINTS_PER_STAGE * TOTAL_STAGES;
export const GAME_DURATION_MS = 20 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 2 * 60 * 1000;

export type Classification = 'YATIRIM' | 'TUKETIM';
export type McAnswer = 'A' | 'B' | 'C';

export interface ClassificationOption {
  id: Classification;
  label: string;
  icon: string;
}

export const CLASSIFICATION_OPTIONS: ClassificationOption[] = [
  { id: 'YATIRIM', label: 'Yatırım Kutusu', icon: '💰' },
  { id: 'TUKETIM', label: 'Tüketim Kutusu', icon: '🛍️' },
];

export interface McOption {
  id: McAnswer;
  label: string;
}

export interface AssessmentCase {
  id: number;
  title: string;
  scenario: string;
  correctClassification: Classification;
  classifyCorrectFeedback: string;
  classifyWrongFeedback: string;
  question: string;
  options: McOption[];
  correctAnswer: McAnswer;
  questionCorrectFeedback: string;
  questionWrongFeedback: string;
}

export const ASSESSMENT_CASES: AssessmentCase[] = [
  {
    id: 1,
    title: '🗂️ Uzman Ellere Bırakmak',
    scenario:
      'Kenara ayırdığın birikimi piyasaları takip etmeye vaktin olmadığı için, uzmanların senin yerine farklı araçlarda değerlendirmesi amacıyla bankanın sunduğu bir sepete yatırdın.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Parayı kendi kontrolünde tutmak yerine uzmanlara yönetim için devretmek, geleceğe yönelik bir getiri beklentisiyle yapılan bir yatırım kararıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Burada para harcanıp tüketilmiyor, aksine büyümesi için uzmanlara emanet ediliyor. Bu bir yatırım kararıdır.',
    question:
      "Ekonomi Sözlüğü'ne göre birçok kişinin parasının uzmanlar tarafından değerlendirildiği bu yatırım aracı hangisidir?",
    options: [
      { id: 'A', label: 'Tahvil' },
      { id: 'B', label: 'Yatırım Fonu' },
      { id: 'C', label: 'Vadeli Mevduat' },
    ],
    correctAnswer: 'B',
    questionCorrectFeedback:
      'Kesinlikle doğru! Yatırım fonu, birçok yatırımcının parasını bir araya getirip uzman yöneticiler aracılığıyla farklı varlıklarda değerlendiren ortak bir yatırım aracıdır.',
    questionWrongFeedback:
      "Tekrar düşün! Doğru cevap Yatırım Fonu'dur — birçok kişinin parasının uzmanlarca yönetildiği araç budur.",
  },
  {
    id: 2,
    title: '📱 Gösteriş Tuzağı',
    scenario:
      'Zaten sorunsuz çalışan bir cep telefonun varken, sadece rengini beğendiğin ve yeni çıktığı için elindeki tüm parayla üst model bir telefona geçiş yaptın.',
    correctClassification: 'TUKETIM',
    classifyCorrectFeedback:
      'Doğru! Zaten çalışan bir eşyayı sadece görünüm veya heves için yenilemek, herhangi bir getiri sağlamayan bir tüketim harcamasıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Bu harcama sana gelecekte hiçbir finansal getiri sağlamıyor, sadece anlık bir isteği karşılıyor. Bu bir tüketimdir.',
    question:
      'Strateji Merkezi\'ne göre yalnızca mevcut bir isteği karşılayan bu harcama hangi düşünce yapısının bir sonucudur?',
    options: [
      { id: 'A', label: 'Sadece Bugünü mü Düşünüyor?' },
      { id: 'B', label: 'Geleceğe mi Yatırılıyor?' },
      { id: 'C', label: 'Kendine Sor: İhtiyaç mı?' },
    ],
    correctAnswer: 'A',
    questionCorrectFeedback:
      "Doğru! Sadece mevcut bir isteği karşılayan, geleceğe hiçbir katkısı olmayan harcamalar 'Sadece Bugünü mü Düşünüyor?' sorusunun cevabıdır.",
    questionWrongFeedback:
      "Tekrar düşün! Bu harcama sadece o anki bir isteği tatmin ediyor, geleceğe yatırım yapmıyor. Doğru cevap 'Sadece Bugünü mü Düşünüyor?'dur.",
  },
  {
    id: 3,
    title: '📜 Borç Vererek Kazanmak',
    scenario:
      'Devletin veya büyük bir şirketin borç bulmak amacıyla çıkardığı finansal bir kağıdı satın aldın; planın vade sonunda onlara verdiğin parayı faiziyle geri almak.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Bir kağıt karşılığında borç verip vade sonunda faiziyle geri almayı planlamak, klasik bir yatırım kararıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Burada bir şeyi tüketip harcamıyorsun, aksine parana getiri kazandırmak için borç veriyorsun. Bu bir yatırımdır.',
    question:
      "Ekonomi Sözlüğü'nde devletin veya şirketlerin borç almak için çıkardığı bu araç nasıl adlandırılır?",
    options: [
      { id: 'A', label: 'Tahvil' },
      { id: 'B', label: 'Hisse Senedi' },
      { id: 'C', label: 'Altın' },
    ],
    correctAnswer: 'A',
    questionCorrectFeedback:
      'Doğru! Tahvil, devletin veya şirketlerin borç bulmak için çıkardığı ve vade sonunda faiziyle geri ödenen borçlanma aracıdır.',
    questionWrongFeedback:
      "Tekrar düşün! Doğru cevap Tahvil'dir — devlet veya şirketlerin borçlanma amacıyla çıkardığı araç budur.",
  },
  {
    id: 4,
    title: '🥾 Temel İhtiyaç Kararı',
    scenario:
      'Kış aylarında giymek için eskiyen ve su alan ayakkabının yerine, bütçeni aşmayacak dayanıklı bir kışlık bot aldın.',
    correctClassification: 'TUKETIM',
    classifyCorrectFeedback:
      'Doğru! Temel bir ihtiyacı bütçe dahilinde karşılamak bir tüketim harcamasıdır, ancak bilinçli yapıldığı için sağlıklı bir tüketimdir.',
    classifyWrongFeedback:
      'Tekrar düşün! Bu harcama sana finansal bir getiri sağlamıyor, sadece temel bir ihtiyacını karşılıyor. Bu bir tüketimdir.',
    question: "Strateji Merkezi'ndeki sorulara göre bu harcamanın temel motivasyonu nedir?",
    options: [
      { id: 'A', label: 'Kendine Sor: Gelecek Faydası' },
      { id: 'B', label: 'Kendine Sor: İhtiyaç mı?' },
      { id: 'C', label: 'Geleceğe mi Yatırılıyor?' },
    ],
    correctAnswer: 'B',
    questionCorrectFeedback:
      "Doğru! Bu harcamanın temel motivasyonu 'Kendine Sor: İhtiyaç mı?' sorusudur — eskiyen ve işlevini kaybeden bir eşyanın yerine bütçe dahilinde alınan yenisi temel bir ihtiyaçtır.",
    questionWrongFeedback:
      "Tekrar düşün! Burada gelecek faydası veya yatırım değil, temel bir ihtiyacın karşılanması söz konusu. Doğru cevap 'Kendine Sor: İhtiyaç mı?'dır.",
  },
  {
    id: 5,
    title: '🪙 Değer Koruma İçgüdüsü',
    scenario:
      'Eline geçen toplu parayı harcamak yerine, enflasyona karşı erimesini önlemek amacıyla sarrafiye ürünleri aldın.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Parayı enflasyona karşı korumak veya değerini artırmak amacıyla bir araca yönlendirmek bir yatırım kararıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Burada amaç harcamak değil, paranın değerini korumaktır. Bu bir yatırımdır.',
    question:
      'Ekonomi Sözlüğü\'nde "değerini korumak veya artırmak amacıyla alınabilen" bu araç hangisidir?',
    options: [
      { id: 'A', label: 'Vadeli Mevduat' },
      { id: 'B', label: 'Altın' },
      { id: 'C', label: 'Tahvil' },
    ],
    correctAnswer: 'B',
    questionCorrectFeedback:
      'Doğru! Altın, değerini korumak veya enflasyona karşı artırmak amacıyla tercih edilen geleneksel bir yatırım aracıdır.',
    questionWrongFeedback:
      "Tekrar düşün! Doğru cevap Altın'dır — değer koruma amacıyla en sık tercih edilen araçlardan biridir.",
  },
  {
    id: 6,
    title: '🎓 Kendine Yatırım',
    scenario:
      'Hafta sonu eğlencesine ayıracağın bütçeyi, ileride daha iyi iş bulmanı sağlayacak bir yabancı dil veya yazılım eğitimine kayıt olmak için harcadın.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Kendine, gelecekteki kazanç potansiyelini artıracak bir beceri veya eğitim için harcama yapmak en değerli yatırım türlerinden biridir.',
    classifyWrongFeedback:
      'Tekrar düşün! Bu harcama sana ileride yeni fırsatlar ve gelir potansiyeli sağlıyor. Bu bir yatırımdır.',
    question:
      "Strateji Merkezi'ne göre bu kararı almanı sağlayan ve seni yönlendiren soru kalıbı hangisidir?",
    options: [
      { id: 'A', label: 'Sadece Bugünü mü Düşünüyor?' },
      { id: 'B', label: 'Kendine Sor: İhtiyaç mı?' },
      { id: 'C', label: 'Kendine Sor: Gelecek Faydası' },
    ],
    correctAnswer: 'C',
    questionCorrectFeedback:
      "Doğru! Bu kararı yönlendiren soru kalıbı 'Kendine Sor: Gelecek Faydası'dır — bugünkü harcamanın ileride sana ne kazandıracağını sorgular.",
    questionWrongFeedback:
      "Tekrar düşün! Burada anlık bir istek değil, gelecekteki kazanç potansiyeli düşünülüyor. Doğru cevap 'Kendine Sor: Gelecek Faydası'dır.",
  },
  {
    id: 7,
    title: '🏦 Sabırlı Bekleyiş',
    scenario:
      'Yaz tatilinde çalışarak biriktirdiğin parayı çekmecede bekletmek yerine, üzerine ek getiri sağlamak amacıyla hesabına yatırdın.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Parayı boşta bekletmek yerine ek getiri sağlayacak bir hesaba yönlendirmek bir yatırım kararıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Amaç harcamak değil, paraya ek getiri kazandırmaktır. Bu bir yatırımdır.',
    question:
      "Paranın belirli bir süre bankada tutulması karşılığında faiz kazandıran bu hesap türü Ekonomi Sözlüğü'nde ne olarak geçer?",
    options: [
      { id: 'A', label: 'Hisse Senedi' },
      { id: 'B', label: 'Yatırım Fonu' },
      { id: 'C', label: 'Vadeli Mevduat' },
    ],
    correctAnswer: 'C',
    questionCorrectFeedback:
      'Doğru! Vadeli mevduat, paranın belirli bir süre bankada tutulması karşılığında faiz kazandıran hesap türüdür.',
    questionWrongFeedback:
      "Tekrar düşün! Doğru cevap Vadeli Mevduat'tır — parayı belirli süre bankada tutup faiz kazanmayı sağlayan hesap budur.",
  },
  {
    id: 8,
    title: '🤝 Şirket Ortaklığı',
    scenario:
      'Çok sevdiğin ve yenilikçi projeleriyle gelecekte daha da büyüyeceğine inandığın bir teknoloji firmasına ortak olmak için alım yaptın.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Bir şirkete ortak olup büyümesinden pay almayı beklemek klasik bir yatırım kararıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Burada bir ürün tüketmiyorsun, bir şirketin geleceğine ortak oluyorsun. Bu bir yatırımdır.',
    question:
      "Ekonomi Sözlüğü'nde bir şirketin küçük bir bölümüne ortak olmayı sağlayan bu yatırım aracı hangisidir?",
    options: [
      { id: 'A', label: 'Tahvil' },
      { id: 'B', label: 'Vadeli Mevduat' },
      { id: 'C', label: 'Hisse Senedi' },
    ],
    correctAnswer: 'C',
    questionCorrectFeedback:
      'Doğru! Hisse senedi, bir şirketin küçük bir bölümüne ortak olmanı sağlayan yatırım aracıdır.',
    questionWrongFeedback:
      "Tekrar düşün! Doğru cevap Hisse Senedi'dir — bir şirkete ortak olmanı sağlayan araç budur.",
  },
  {
    id: 9,
    title: '🎮 Dijital Tüketim',
    scenario:
      'Oynadığın mobil oyunda karakterinin sadece görünümünü değiştirecek, sana oyunda kalıcı bir getiri veya ekstra güç sağlamayacak dijital bir kostüm satın aldın.',
    correctClassification: 'TUKETIM',
    classifyCorrectFeedback:
      'Doğru! Sana kalıcı bir getiri veya fayda sağlamayan, sadece anlık bir isteği karşılayan dijital ürünler de tüketim harcamasıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Bu ürün sana hiçbir kalıcı fayda veya getiri sağlamıyor, sadece görünümü değiştiriyor. Bu bir tüketimdir.',
    question:
      "Strateji Merkezi'ne göre yalnızca mevcut bir isteği karşılayan bu harcama hangi mantıkla yapılmıştır?",
    options: [
      { id: 'A', label: 'Sadece Bugünü mü Düşünüyor?' },
      { id: 'B', label: 'Geleceğe mi Yatırılıyor?' },
      { id: 'C', label: 'Kendine Sor: Gelecek Faydası' },
    ],
    correctAnswer: 'A',
    questionCorrectFeedback:
      "Doğru! Bu harcama da 'Sadece Bugünü mü Düşünüyor?' mantığıyla yapılmıştır çünkü sana oyun içinde kalıcı bir avantaj veya getiri sağlamaz.",
    questionWrongFeedback:
      "Tekrar düşün! Bu kostüm sana kalıcı bir güç veya getiri sağlamıyor, sadece görünümü değiştiriyor. Doğru cevap 'Sadece Bugünü mü Düşünüyor?'dur.",
  },
  {
    id: 10,
    title: '🧭 Temel Strateji',
    scenario:
      'Eline geçen parayla anlık bir alışveriş yapmak yerine durup düşündün ve bu paranın ileride sana nasıl bir değer katacağını hesaplayarak birikime yöneldin.',
    correctClassification: 'YATIRIM',
    classifyCorrectFeedback:
      'Doğru! Parayı anlık harcamak yerine gelecekte katacağı değeri hesaplayarak birikime yönlendirmek temel bir yatırım kararıdır.',
    classifyWrongFeedback:
      'Tekrar düşün! Burada anlık bir alışveriş değil, geleceğe yönelik bilinçli bir birikim kararı var. Bu bir yatırımdır.',
    question:
      "Strateji Merkezi'nde seni bu şekilde düşünmeye iten ve harcamanın gelecekte kazanç sağlayıp sağlamayacağını sorgulatan ana soru hangisidir?",
    options: [
      { id: 'A', label: 'Temel Karar Sorusu' },
      { id: 'B', label: 'Kendine Sor: İhtiyaç mı?' },
      { id: 'C', label: 'Geleceğe mi Yatırılıyor?' },
    ],
    correctAnswer: 'A',
    questionCorrectFeedback:
      "Doğru! 'Temel Karar Sorusu', bir harcamanın gelecekte kazanç sağlayıp sağlamayacağını sorgulatan ana sorudur ve her finansal kararın başında sorulmalıdır.",
    questionWrongFeedback:
      "Tekrar düşün! Doğru cevap 'Temel Karar Sorusu'dur — harcamanın geleceğe katkısını sorgulayan ana soru budur.",
  },
];

// ── Bilgi Merkezi ────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  term: string;
  def: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Yatırım Fonu',
    def: "Birçok kişinin parasının bir araya toplanarak uzman fon yöneticileri tarafından hisse, tahvil, altın gibi farklı araçlarda değerlendirildiği ortak yatırım aracı.",
  },
  {
    term: 'Tahvil',
    def: 'Devletin veya şirketlerin borç bulmak amacıyla çıkardığı, vade sonunda anaparayı faiziyle geri ödemeyi taahhüt ettiği borçlanma senedi.',
  },
  {
    term: 'Vadeli Mevduat',
    def: 'Paranın belirli bir süre bankada tutulması karşılığında düzenli faiz kazandıran mevduat hesabı türü.',
  },
  {
    term: 'Altın',
    def: 'Değerini korumak veya enflasyona karşı artırmak amacıyla alınabilen, geleneksel bir değer saklama aracı.',
  },
  {
    term: 'Hisse Senedi',
    def: 'Bir şirketin küçük bir bölümüne ortak olmayı sağlayan, şirket büyüdükçe değer kazanabilen yatırım aracı.',
  },
  {
    term: 'Yatırım',
    def: 'Bugünkü parayı, gelecekte değer kazanması veya getiri sağlaması beklentisiyle bir araca yönlendirme kararıdır.',
  },
  {
    term: 'Tüketim',
    def: 'Anlık bir ihtiyaç veya isteği karşılamak amacıyla yapılan, genellikle geri dönüşü veya getirisi olmayan harcamadır.',
  },
];

export interface StrategyTip {
  title: string;
  desc: string;
}

export const STRATEGY_TIPS: StrategyTip[] = [
  {
    title: 'Temel Karar Sorusu',
    desc:
      '"Bu para bana gelecekte bir değer katacak mı, yoksa sadece bugünkü bir isteğimi mi karşılıyor?" Her harcama kararından önce sorulması gereken ana sorudur.',
  },
  {
    title: 'Kendine Sor: İhtiyaç mı?',
    desc: 'Harcamanın hayatta kalmak veya temel yaşamı sürdürmek için zorunlu mu, yoksa sadece canının çekmesinden mi kaynaklandığını sorgular.',
  },
  {
    title: 'Geleceğe mi Yatırılıyor?',
    desc: 'Harcanan paranın zamanla değer kazanıp kazanmayacağını, sana ek bir getiri sağlayıp sağlamayacağını sorgular.',
  },
  {
    title: 'Kendine Sor: Gelecek Faydası',
    desc: 'Bugün yapılan harcamanın (eğitim, beceri gibi) ileride sana nasıl bir kazanç veya fırsat sağlayacağını sorgular.',
  },
  {
    title: 'Sadece Bugünü mü Düşünüyor?',
    desc: 'Harcamanın yalnızca anlık bir tatmin veya isteği karşılayıp karşılamadığını, geleceğe herhangi bir katkısı olup olmadığını sorgular.',
  },
];

// Fisher-Yates shuffle — orijinal diziyi bozmadan yeni bir sıralı kopya döner.
export function shuffleCases(cases: AssessmentCase[]): AssessmentCase[] {
  const arr = [...cases];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getPerformance(correctCount: number): { label: string; sub: string; icon: string; color: string; bg: string } {
  if (correctCount === TOTAL_STAGES)
    return { label: 'Mantık Ustası!', sub: 'Tüm vaka ve soruları doğru çözdün.', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (correctCount >= 15)
    return { label: 'Çok İyi İş!', sub: 'Neredeyse tüm vakalarda doğru karar verdin.', icon: '👍', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (correctCount >= 10)
    return { label: 'Kısmi Anlayış', sub: 'Bazı vakalarda daha dikkatli olabilirdin.', icon: '📘', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', sub: "Bilgi Merkezi'ni tekrar incele ve yeniden dene.", icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
