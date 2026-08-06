// "Yatırım mı, Tüketim mi?" değerlendirme oyunu için merkezi veri.
// 10 soru, her biri "Tüketim" / "Yatırım" olarak sınıflandırılır.
// Doğru cevap 10 puan, toplam 100 puan. Başarı yüzdesi = (doğru sayısı / 10) × 100.

export const POINTS_PER_QUESTION = 10;
export const TOTAL_QUESTIONS = 10;
export const MAX_SCORE = POINTS_PER_QUESTION * TOTAL_QUESTIONS;

export type Classification = 'CONSUMPTION' | 'INVESTMENT';

export interface ClassificationOption {
  id: Classification;
  label: string;
}

export const CLASSIFICATION_OPTIONS: ClassificationOption[] = [
  { id: 'CONSUMPTION', label: 'Tüketim' },
  { id: 'INVESTMENT', label: 'Yatırım' },
];

export interface ScenarioQuestion {
  id: number;
  scenario: string;
  correctAnswer: Classification;
  explanation: string;
}

export const QUESTIONS: ScenarioQuestion[] = [
  {
    id: 1,
    scenario: 'Bir aylık harçlığını yeni kulaklık almak için kullanmak.',
    correctAnswer: 'CONSUMPTION',
    explanation: 'Kulaklık, mevcut bir ihtiyacı veya isteği karşılamak amacıyla satın alınmaktadır. Gelecekte gelir veya değer artışı oluşturma amacı bulunmamaktadır.',
  },
  {
    id: 2,
    scenario: 'Birikimlerini gelecekte değer kazanacağını düşündüğün bir arsaya yatırmak.',
    correctAnswer: 'INVESTMENT',
    explanation: 'Arsa, gelecekte değer artışı sağlama beklentisiyle satın alınmaktadır. Ancak değer artışı kesin değildir ve yatırım riski bulunmaktadır.',
  },
  {
    id: 3,
    scenario: 'Doğum günü kutlaması için restoranda yemek yemek.',
    correctAnswer: 'CONSUMPTION',
    explanation: 'Restoranda yemek yemek, mevcut bir isteği ve sosyal ihtiyacı karşılayan tüketim harcamasıdır.',
  },
  {
    id: 4,
    scenario: 'Temettü geliri elde etmek amacıyla bir şirketin hisselerini satın almak.',
    correctAnswer: 'INVESTMENT',
    explanation: 'Hisse senedi, şirkete ortak olma ve gelecekte temettü veya değer artışı yoluyla kazanç elde etme amacıyla alınmaktadır.',
  },
  {
    id: 5,
    scenario: 'Yazın giymek için yeni kıyafetler satın almak.',
    correctAnswer: 'CONSUMPTION',
    explanation: 'Kıyafet satın almak, mevcut bir ihtiyacı veya isteği karşılamaya yönelik tüketim harcamasıdır.',
  },
  {
    id: 6,
    scenario: 'Bir daire satın alıp kiraya vererek gelir elde etmeyi planlamak.',
    correctAnswer: 'INVESTMENT',
    explanation: 'Daire, düzenli kira geliri elde etmek amacıyla satın alındığı için yatırım olarak değerlendirilir.',
  },
  {
    id: 7,
    scenario: 'Eğlenmek için konsere bilet almak.',
    correctAnswer: 'CONSUMPTION',
    explanation: 'Konser bileti, eğlence ihtiyacını karşılayan ve gelecekte gelir elde etme amacı taşımayan bir tüketim harcamasıdır.',
  },
  {
    id: 8,
    scenario: 'Gelecekte eğitim masrafların için düzenli olarak BES hesabına para yatırmak.',
    correctAnswer: 'INVESTMENT',
    explanation: 'BES hesabına düzenli para yatırmak, gelecekte kullanılmak üzere birikim oluşturmayı ve parayı değerlendirmeyi amaçlamaktadır.',
  },
  {
    id: 9,
    scenario: 'Kahve içmek için kafeye gitmek.',
    correctAnswer: 'CONSUMPTION',
    explanation: 'Kafede kahve içmek, anlık bir ihtiyacı veya isteği karşılayan tüketim harcamasıdır.',
  },
  {
    id: 10,
    scenario: 'Küçük bir işletmeye ortak olarak kâr elde etmeyi hedeflemek.',
    correctAnswer: 'INVESTMENT',
    explanation: 'Bir işletmeye kâr elde etme amacıyla ortak olmak yatırım faaliyetidir. Ancak işletmenin kâr edeceği garanti değildir.',
  },
];

export interface GlossaryTerm {
  term: string;
  def: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'Hisse Senedi', def: 'Bir şirketin küçük bir bölümüne ortak olmayı sağlayan yatırım aracıdır.' },
  { term: 'Altın', def: 'Değerini korumak veya artırmak amacıyla alınabilen bir yatırım aracıdır.' },
  { term: 'Yatırım Fonu', def: 'Birçok kişinin parasının uzmanlar tarafından farklı yatırımlarda değerlendirilmesidir.' },
  { term: 'Vadeli Mevduat', def: 'Paranın belirli bir süre bankada tutulması karşılığında faiz kazandıran hesaptır.' },
  { term: 'Tahvil', def: 'Devletin veya şirketlerin borç almak için çıkardığı yatırım aracıdır.' },
  { term: 'Temettü', def: 'Bir şirketin elde ettiği kârın ortaklarına dağıttığı paydır.' },
  { term: 'BES', def: 'Gelecek için düzenli birikim yapmayı sağlayan Bireysel Emeklilik Sistemi\'dir.' },
  { term: 'Kira Geliri', def: 'Bir ev veya iş yerini kiraya vererek elde edilen kazançtır.' },
  { term: 'Birikim', def: 'Harcamayıp gelecekte kullanmak için ayrılan paradır.' },
  { term: 'Faiz', def: 'Paranın belirli bir süre sonunda kazandırdığı ek getiridir.' },
];

export interface StrategyTip {
  title: string;
  desc: string;
}

export const STRATEGY_TIPS: StrategyTip[] = [
  {
    title: 'Temel Karar Sorusu',
    desc: '"Bu harcama bana sadece bugün mü fayda sağlıyor, yoksa gelecekte de kazanç sağlayabilir mi?"',
  },
  {
    title: 'Sadece Bugünü mü Düşünüyor?',
    desc: 'Harcama yalnızca mevcut bir ihtiyacı veya isteği karşılıyorsa: Tüketim.',
  },
  {
    title: 'Geleceğe mi Yatırılıyor?',
    desc: 'Harcama gelecekte gelir, kazanç veya değer artışı sağlama amacı taşıyorsa: Yatırım. Unutma, bir yatırımın kesinlikle kazandıracağı garanti değildir.',
  },
  {
    title: 'Kendine Sor: İhtiyaç mı?',
    desc: 'Buna gerçekten ihtiyacım var mı?',
  },
  {
    title: 'Kendine Sor: Gelecek Faydası',
    desc: 'Bu harcama bana gelecekte bir fayda sağlayacak mı?',
  },
  {
    title: 'Kendine Sor: Bütçe Yeterli mi?',
    desc: 'Bu harcamayı yaptıktan sonra bütçem yeterli kalacak mı?',
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Harika! Yatırım ve tüketim arasındaki farkı çok iyi biliyorsun.', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 70) return { label: 'Başarılı! Temel kavramları biliyorsun, birkaç durumu yeniden inceleyebilirsin.', icon: '👍', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'İyi bir başlangıç. Harcamaların gelecekte gelir veya değer artışı sağlayıp sağlamadığını düşünmelisin.', icon: '📘', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Yatırım ve tüketim arasındaki farkı tekrar incelemen faydalı olacaktır.', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
