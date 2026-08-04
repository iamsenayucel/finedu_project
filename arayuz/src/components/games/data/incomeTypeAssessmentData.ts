// "Gelir Türü: Ölçme Değerlendirme" oyunu için merkezi soru verisi.
// 7 soru, tek doğru cevaplı çoktan seçmeli. İlk 6 soru 15'er puan, 7. soru 10 puandır (toplam 100).

export const EXAM_DURATION_MS = 28 * 60 * 1000;
export const TOTAL_POINTS = 100;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

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
      'Finansal okuryazarlıkta gelir, iki temel mantığa ayrılır. Birinci modelde kişinin kazancı, doğrudan harcadığı zamana ve emeğe bağlıdır; çalışmayı bıraktığı an nakit akışı da durur. İkinci modelde ise bir kez kurulan sistem veya yapılan yatırım, kişi uyurken bile hesabına nakit akışı sağlamaya devam eder.',
    question:
      'Bu parçada bahsedilen "emeğe bağlı gelir" ve "sisteme bağlı gelir" modelleri sırasıyla aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', label: 'Brüt Gelir – Net Gelir' },
      { id: 'B', label: 'Aktif Gelir – Pasif Gelir' },
      { id: 'C', label: 'Harcama – Tasarruf' },
      { id: 'D', label: 'Bireysel Gelir – Kurumsal Gelir' },
      { id: 'E', label: 'Freelance Çalışma – Maaşlı Çalışma' },
    ],
    correctOptionId: 'B',
    explanation: 'Gelirin zamana ve emeğe bağlı olduğu model Aktif, kurulan sistemin para ürettiği model ise Pasif gelirdir.',
    points: 15,
  },
  {
    id: 2,
    prompt:
      'Günümüzde pek çok genç, kendi çalışma saatlerini belirlemek için "freelance" (serbest) çalışmayı tercih ediyor. Ancak bu model, dışarıdan göründüğü gibi kişiye tam bir finansal özgürlük sağlamaz. Çünkü freelance çalışan bir grafik tasarımcısı, bilgisayarını kapatıp tatile çıktığında hesabına giren nakit akışı da o an kesilir.',
    question: 'Bu duruma göre, freelance çalışmanın finansal olarak hangi denklemden kurtulamadığı söylenebilir?',
    options: [
      { id: 'A', label: 'Sistem = Para' },
      { id: 'B', label: 'Tasarruf = Yatırım' },
      { id: 'C', label: 'Harcama = Bütçe' },
      { id: 'D', label: 'Zaman = Para' },
      { id: 'E', label: 'Vergi = Gelir' },
    ],
    correctOptionId: 'D',
    explanation:
      'Freelance çalışanlar da işi bıraktığında parası kesildiği için kazançları harcadıkları zamana, yani "Zaman = Para" denklemine bağlıdır.',
    points: 15,
  },
  {
    id: 3,
    prompt:
      'Yazılımcı Kerem, 3 ay boyunca geceli gündüzlü çalışarak bir mobil oyun geliştirdi. Bu yorucu süreçte hiç para kazanamadı. Ancak oyunu mağazaya yükledikten sonra, kendisi başka işlerle uğraşsa bile oyunu her indirildiğinde hesabına otomatik olarak para yatmaya başladı.',
    question: "Kerem'in yaşadığı bu süreç, finansal stratejilerde hangi durumun en net örneğidir?",
    options: [
      { id: 'A', label: 'Aktif çabanın zamanla pasif gelire dönüşmesinin' },
      { id: 'B', label: 'Hisse senedi alarak temettü (kâr payı) elde edilmesinin' },
      { id: 'C', label: 'Bankadaki paranın faiz getirisi sağlamasının' },
      { id: 'D', label: 'Sabit maaşlı kurumsal bir işe geçiş yapılmasının' },
      { id: 'E', label: 'Tüm gelirlerin devlete vergi olarak aktarılmasının' },
    ],
    correctOptionId: 'A',
    explanation: 'Dijital ürünler başta yoğun aktif efor ister, ancak ürün tamamlandıktan sonra sürekli kazandıran bir pasif gelire dönüşür.',
    points: 15,
  },
  {
    id: 4,
    prompt:
      'Borsada işlem gören dev bir enerji şirketinin yıl sonu kârına ortak olmak istiyorsunuz. Ancak gidip şirketin kapısını çalamazsınız. Bunun yerine o şirketin küçük bir payını temsil eden "dijital tapusunu" satın almalı ve yıl sonunda dağıtılacak o nakit ödemeyi beklemelisiniz.',
    question: 'Bu parçada "dijital tapu" ve "yıl sonu nakit ödemesi" olarak tanımlanan kavramlar sırasıyla hangileridir?',
    options: [
      { id: 'A', label: 'Kredi – Faiz Getirisi' },
      { id: 'B', label: 'Bütçe – Vergi' },
      { id: 'C', label: 'Hisse Senedi – Temettü (Kâr Payı)' },
      { id: 'D', label: 'Tasarruf – Enflasyon' },
      { id: 'E', label: 'Aracı Kurum – Telif Hakkı' },
    ],
    correctOptionId: 'C',
    explanation: 'Borsadaki ortaklık tapusu Hisse Senedi, yıl sonunda elde edilen kârdan alınan pay ise Temettüdür.',
    points: 15,
  },
  {
    id: 5,
    prompt:
      "I. Bir kuryenin teslimat başına aldığı ücret. II. Zeynep'in bankadaki parasından gelen aylık faiz. III. Mert'in YouTube videosundan kazandığı aylık izlenme geliri. IV. Elif'in bir markaya logo tasarlayarak kazandığı proje bedeli.",
    question: 'Yukarıdaki örneklerden hangileri, kişinin doğrudan efor sarf ettiği "Aktif Gelir" modeline girmektedir?',
    options: [
      { id: 'A', label: 'I ve II' },
      { id: 'B', label: 'I ve IV' },
      { id: 'C', label: 'II ve III' },
      { id: 'D', label: 'III ve IV' },
      { id: 'E', label: 'I, II ve IV' },
    ],
    correctOptionId: 'B',
    explanation: 'Kuryelik (I) ve logo tasarımı (IV) fiili emek gerektiren aktif gelirlerdir. Faiz (II) ve izlenme geliri (III) ise pasif gelirdir.',
    points: 15,
  },
  {
    id: 6,
    prompt:
      '100.000 TL birikimi olan Can, parasını evdeki kasasında saklamaktadır. Ancak enflasyon nedeniyle parasının alım gücü her geçen gün erimektedir. Can\'ın bu erimeyi durdurması ve parasını "kendisi için çalışır" duruma getirmesi gerekmektedir.',
    question: 'Can, parasını "pasif gelir" üreten bir sisteme dahil etmek için aşağıdakilerden hangisini yapmalıdır?',
    options: [
      { id: 'A', label: 'Parasını kasadan çıkarıp teknolojik aletler satın almalıdır.' },
      { id: 'B', label: 'Parasını bankaya yatırarak vade sonunda "Faiz Getirisi" sağlamalıdır.' },
      { id: 'C', label: 'Mevcut işinden ayrılıp freelance (serbest) bir ekibe katılmalıdır.' },
      { id: 'D', label: 'Akşamları öğrencilere özel ders vererek aktif mesaisini artırmalıdır.' },
      { id: 'E', label: 'Elindeki nakit parayı vergi dairesine devretmelidir.' },
    ],
    correctOptionId: 'B',
    explanation: 'Yastık altındaki parayı sisteme sokup pasif gelir elde etmenin en temel yolu, o paranın bankada faiz veya yatırım getirisi sağlamasıdır.',
    points: 15,
  },
  {
    id: 7,
    prompt:
      'Dijital dünyada pasif gelir elde etmenin en yaygın yolu "Telif / İzlenme Hakkı" kazanmaktır. Satışa çıkan bir e-kitap veya yayınlanan bir video, siz uyurken bile para kazandırabilir. Ancak birçok kişi bu kazancın sihirli bir şekilde ortaya çıktığını sanır; oysa o ürünün yaratılış aşaması aylar süren yoğun bir alın teri ve mesai gerektirir.',
    question: 'Bu parçadan "Telif / İzlenme Hakkı" ile ilgili aşağıdaki yargıların hangisi çıkarılamaz?',
    options: [
      { id: 'A', label: 'Ürün tamamlandıktan sonra zaman kısıtlaması olmadan kazanç sağlar.' },
      { id: 'B', label: 'Temelinde, parayı sistemin ürettiği pasif gelir mantığı yatmaktadır.' },
      { id: 'C', label: 'Üretici, ürün piyasadayken aktif olarak çalışmasa da gelir elde edebilir.' },
      { id: 'D', label: 'Başlangıç (üretim) aşamasında hiçbir aktif emek ve çaba gerektirmez.' },
      { id: 'E', label: 'Dijital eserler sayesinde kişiye otomatik bir nakit akışı oluşturur.' },
    ],
    correctOptionId: 'D',
    explanation: 'Dijital ürünler sihirli bir şekilde var olmaz; ortaya çıkana kadar (üretim aşamasında) çok ciddi aktif emek ve çaba gerektirir.',
    points: 10,
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 100) return { label: 'Gelir Türü Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 75) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
