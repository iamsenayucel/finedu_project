// "Finansal Sistem: Kavram Avı" oyunu için merkezi soru verisi.
// Yeni soru eklemek için TERM_POOL'u değiştirmeden bu diziye yeni bir Question ekle.

export type Question = {
  id: number;
  paragraph: string;
  question: string;
  termPool: string[];
  correctAnswers: string[];
};

export const TERM_POOL: string[] = [
  'Banka',
  'Birey',
  'Devlet',
  'Harcama',
  'Maaş',
  'Şirket',
  'Tasarruf',
  'Vergi',
];

export const EXAM_DURATION_MS = 12 * 60 * 1000;
export const POINTS_PER_QUESTION = 25;
export const LOW_TIME_THRESHOLD_MS = 60 * 1000;

export const QUESTIONS: Question[] = [
  {
    id: 1,
    paragraph:
      "Ekonomik ekosistemin varoluşsal temeli, piyasadaki aktörlerin karşılıklı etkileşimine dayanır. Bu karmaşık ağın merkezinde, sistemi başlatan, kendi hür iradesiyle hem çalışıp kazanç sağlayan hem de bu kazancı tüketen ana karakterler yer almaktadır. Diğer tarafta ise bu aktörlerin sosyoekonomik taleplerine yanıt verebilmek amacıyla organize olan, piyasaya inovatif ürün ve hizmetler sunarak gelir elde eden ve istihdam yaratarak çalışanlarına ödeme yapan kurumsal yapılar bulunur. Bu iki unsurun senkronize hareketi, piyasa dinamiklerinin kesintisiz işlemesini sağlar.",
    question:
      "Bu parçada ekonomik ağın merkezinde yer aldığı belirtilen karakterler ile sosyoekonomik taleplere yanıt veren kurumsal yapılar, aşağıdaki kavramlardan hangileriyle ifade edilmektedir?",
    termPool: TERM_POOL,
    correctAnswers: ['Birey', 'Şirket'],
  },
  {
    id: 2,
    paragraph:
      "Modern çalışma hayatında insanın refah düzeyi, yarattığı katma değerin düzenli bir getiriye dönüşmesiyle ölçülür. Profesyonel hayata atılan bir kişinin, harcadığı emeğin ve zamanın karşılığı olarak kendisine periyodik şekilde ödenen düzenli ücret, onun yaşamsal faaliyetlerini sürdürebilmesi için temel kaynaktır. Ancak çağdaş toplumsal düzen anlayışı gereği, bu gelirin bütünü kişinin şahsi tasarrufunda kalmaz; kamu hizmetlerinin devamlılığı ve sistemin sürdürülebilirliği adına, kazanılan bu gelirin yasal çerçevede belirlenmiş bir kısmının en üst otoriteye aktarılması mutlak bir zorunluluk teşkil eder.",
    question:
      "Bu metinde bahsedilen düzenli gelir türü ile bu gelir üzerinden yerine getirilmesi gereken yasal aktarım zorunluluğu, sırasıyla hangi kavramlarla tanımlanmaktadır?",
    termPool: TERM_POOL,
    correctAnswers: ['Maaş', 'Vergi'],
  },
  {
    id: 3,
    paragraph:
      "Çağdaş tüketim kültürü, kitleleri sürekli olarak anlık tatmin duygusuna yönlendirme eğilimindedir. Gündelik yaşamın akışı içerisinde kişiler, temel ihtiyaçlarını ya da kişisel arzularını karşılamak amacıyla kasalarından sürekli bir para çıkışı gerçekleştirirler. Oysa bireysel finansal güvenliğin ve sürdürülebilir refahın anahtarı, anlık hazları erteleyebilme iradesinde gizlidir. Tüm kazancı anlık tüketim sarmalında yok etmek yerine, gelirin belirli bir kısmını gelecekteki potansiyel hedefler veya krizler için planlı bir şekilde biriktirmek, rasyonel bir ekonomik davranış modelidir.",
    question:
      "Parçada eleştirilen kasadan para çıkışı eylemi ve buna karşı önerilen planlı biriktirme modeli, aşağıdaki kavramların hangileriyle eşleşmektedir?",
    termPool: TERM_POOL,
    correctAnswers: ['Harcama', 'Tasarruf'],
  },
  {
    id: 4,
    paragraph:
      "Bireysel birikimlerin ekonomik bir değere dönüşmesi ve piyasa döngüsüne katılması, kurumsal güvence mekanizmalarının varlığına bağlıdır. Finansal aktörler, varlıklarını atıl alanlarda tutmak yerine; fonları için güvenli bir saklama alanı sunan ve likidite açığı olanlara ihtiyaç anında borç (kredi) desteği sağlayan merkezi kurumlara yönelirler. Bu mikroekonomik faaliyetlerin güvence altında gerçekleştiği makro düzlemde ise; vatandaşlarına eğitim, sağlık ve altyapı gibi temel toplumsal hizmetleri sunan ve bu devasa operasyonları sahip olduğu bütçeyle fonlayan en üst yapı tüm mekanizmayı denetler.",
    question:
      "Bu parçada işlevleri açıklanan, fonlar için güvenli saklama alanı sunan merkezler ile makro düzeyde toplumsal hizmetleri fonlayan otorite, aşağıdaki kavramlardan hangileridir?",
    termPool: TERM_POOL,
    correctAnswers: ['Banka', 'Devlet'],
  },
];

export function getBadge(score: number): { label: string; icon: string; color: string } {
  if (score >= 100) return { label: 'Finansal Sistem Uzmanı', icon: '🏆', color: 'text-emerald-400' };
  if (score >= 75) return { label: 'Finansal Sistem Analisti', icon: '🎯', color: 'text-blue-400' };
  if (score >= 50) return { label: 'Finansal Sistem Gözlemcisi', icon: '👍', color: 'text-yellow-400' };
  return { label: 'Finansal Sistem Adayı', icon: '📘', color: 'text-slate-300' };
}

export function isAnswerCorrect(selected: string[], correct: string[]): boolean {
  if (selected.length !== 2 || correct.length !== 2) return false;
  const a = [...selected].sort();
  const b = [...correct].sort();
  return a[0] === b[0] && a[1] === b[1];
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
