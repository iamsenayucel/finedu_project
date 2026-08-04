// "Finansal Sistem Kavramlarını Keşfet-2" oyunu için merkezi görev verisi.
// 4 görev, her biri farklı bir etkileşim türü kullanır (sıralama, eşleştirme, kilitli sıralama, çoktan seçmeli).

export const EXAM_DURATION_MS = 20 * 60 * 1000;
export const POINTS_PER_TASK = 25;
export const TOTAL_POINTS = 100;
export const LOW_TIME_THRESHOLD_MS = 2 * 60 * 1000;

export interface TaskCard {
  id: string;
  label: string;
}

export interface OrderTask {
  type: 'order';
  id: 1;
  title: string;
  complaintUser: string;
  complaintText: string;
  instruction: string;
  cards: TaskCard[];
  correctOrder: string[];
  slotLabels: string[];
  pipelineLabel: string;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface MatchSlot {
  id: string;
  label: string;
  correctCardId: string;
}

export interface MatchTask {
  type: 'match';
  id: 2;
  title: string;
  complaintUser: string;
  complaintText: string;
  instruction: string;
  cards: TaskCard[];
  slots: MatchSlot[];
  flowLabels: string[];
  correctExplanation: string;
}

export interface OrderGateTask {
  type: 'order_gate';
  id: 3;
  title: string;
  complaintUser: string;
  complaintText: string;
  instruction: string;
  cards: TaskCard[];
  correctOrder: string[];
  slotLabels: string[];
  gateButtonLabel: string;
  correctExplanation: string;
}

export interface McqOption {
  id: string;
  label: string;
}

export interface McqTask {
  type: 'mcq';
  id: 4;
  title: string;
  questionIntro: string;
  centers: string[];
  actions: string[];
  question: string;
  options: McqOption[];
  correctOptionId: string;
  correctExplanation: string;
}

export type Task = OrderTask | MatchTask | OrderGateTask | McqTask;

export const TASK1: OrderTask = {
  type: 'order',
  id: 1,
  title: 'Kredi Sürecinde Mantık Hatası',
  complaintUser: 'Deniz',
  complaintText:
    "İş kurmak için bankanızdan 100.000 TL talep ettim. İki gün geçmesine rağmen para hesabıma yatmadı. Parayı hemen hesabıma aktarırsanız, belgelerimi size sunup borcumu ödeyebileceğimi, yani kredi notumu kanıtlayacağım. Lütfen parayı serbest bırakın!",
  instruction: 'Deniz, kredi sürecindeki işlem sırasını tersine çevirmektedir. Aşağıdaki üç işlem bloğunu doğru sıraya sürükle.',
  cards: [
    { id: 'inceleme', label: 'Banka, geçmiş borç ödeme alışkanlıklarını ve kredi notunu inceler.' },
    { id: 'basvuru', label: 'Bankaya resmî kredi başvurusu yapılır.' },
    { id: 'teslim', label: 'İnceleme olumlu sonuçlanırsa para kullanıma açılır.' },
  ],
  correctOrder: ['basvuru', 'inceleme', 'teslim'],
  slotLabels: ['Başvuru', 'İnceleme', 'Para Teslimi'],
  pipelineLabel: 'Başvuru → İnceleme → Para Teslimi',
  correctFeedback: 'Kredi süreci başarıyla doğrulandı.',
  incorrectFeedback: 'Kredi, resmî başvuru ve değerlendirme tamamlanmadan kullanıma açılamaz.',
};

export const TASK2: MatchTask = {
  type: 'match',
  id: 2,
  title: 'Beklenti ve Gerçekler',
  complaintUser: 'Mert',
  complaintText:
    "Şirketimle aylık 50.000 TL üzerinden anlaştım. Ancak ay sonunda banka hesabıma 38.000 TL yatırıldı. Şirket paramın 12.000 TL'sine haksız yere el koydu, şikâyetçiyim.",
  instruction: "Mert'in maaşının hangi aşamalardan geçtiğini gösteren kutuları doğru finansal kavramlarla eşleştir.",
  cards: [
    { id: 'net', label: 'Net Maaş' },
    { id: 'brut', label: 'Brüt Maaş' },
    { id: 'kesinti', label: 'Vergi ve Sigorta Kesintisi' },
    { id: 'kredi', label: 'Kredi' },
  ],
  slots: [
    { id: 'sozlesme', label: "Sözleşmede yazan 50.000 TL", correctCardId: 'brut' },
    { id: 'otomatik', label: 'Sistemden otomatik kesilen 12.000 TL', correctCardId: 'kesinti' },
    { id: 'hesap', label: "Mert'in banka hesabına düşen 38.000 TL", correctCardId: 'net' },
  ],
  flowLabels: ['Şirket', 'Brüt Maaş', 'Vergi ve Sigorta Kesintisi', 'Net Maaş', 'Banka Hesabı'],
  correctExplanation:
    'Brüt maaş, vergi ve sigorta kesintileri yapılmadan önceki toplam tutardır. Kesintilerden sonra çalışanın hesabına net maaş yatırılır.',
};

export const TASK3: OrderGateTask = {
  type: 'order_gate',
  id: 3,
  title: 'Yatırım Dünyasına Giriş Kapısı',
  complaintUser: 'Mehmet',
  complaintText:
    "Sisteminiz bozuk! Param var ve hangi şirketin hissesini alacağımı seçtim. Ancak 'Satın Al' butonuna bastığımda hata alıyorum. Neden normal vadesiz hesabımdan doğrudan şirketlerden hisse alamıyorum?",
  instruction: "Mehmet'in borsada işlem yapabilmesi için gerçekleştirmesi gereken adımları doğru sıraya sürükle.",
  cards: [
    { id: 'transfer', label: 'Hesabına yatırım tutarını transfer eder.' },
    { id: 'satinalma', label: 'Seçtiği hisseyi borsa üzerinden satın alır.' },
    { id: 'kayit', label: 'Yasal bir aracı kuruma kayıt olur.' },
  ],
  correctOrder: ['kayit', 'transfer', 'satinalma'],
  slotLabels: ['Aracı Kurum Kaydı', 'Fon Transferi', 'Hisse Satın Alma'],
  gateButtonLabel: 'Satın Al',
  correctExplanation:
    'Borsada hisse alabilmek için önce yasal bir aracı kurumda yatırım hesabı açılmalı, ardından hesaba para aktarılmalıdır.',
};

export const TASK4: McqTask = {
  type: 'mcq',
  id: 4,
  title: 'Finansal Ekosistemin Merkezleri ve Para Akışı',
  questionIntro:
    'Ekonomik sistemde paranın toplandığı ve dağıtıldığı üç ana merkez bulunmaktadır: Devlet/Hazine, Şirketler/Firmalar ve Bankalar/Finans Sektörü. Bireylerin günlük hayatta gerçekleştirdiği finansal eylemler bu merkezlerle doğrudan ilişkilidir.',
  centers: ['Devlet / Hazine', 'Şirketler / Firmalar', 'Bankalar / Finans Sektörü'],
  actions: ['Maaş', 'Vergi', 'Tasarruf', 'Harcama', 'Kredi'],
  question:
    'Finansal eylemlerin doğrudan ilişkili olduğu ana merkezler düşünüldüğünde aşağıdaki ifadelerden hangisi yanlıştır?',
  options: [
    { id: 'A', label: 'Maaşın kaynağı, bireyin çalıştığı ve üretim yapan şirketler veya firmalardır.' },
    { id: 'B', label: 'Vergi, toplumsal hizmetlerin fonlanması için doğrudan Devlet Hazinesine aktarılan paydır.' },
    { id: 'C', label: 'Tasarrufun güvenle saklanması ve büyümesi için bankalara veya finans sektörüne yönlendirilmesi gerekir.' },
    { id: 'D', label: 'Teknolojik bir alet veya kıyafet alındığında harcamanın ana bedeli doğrudan Devlet Hazinesine gider.' },
    { id: 'E', label: 'Kredi, bireyin ihtiyaç anında resmî bir taleple bankalardan aldığı borç paradır.' },
  ],
  correctOptionId: 'D',
  correctExplanation:
    'Bir ürün satın alındığında harcamanın ana bedeli ürünü satan şirkete veya firmaya gider. Devlete yalnızca ilgili vergi payı aktarılır.',
};

export const TASKS: Task[] = [TASK1, TASK2, TASK3, TASK4];

export const TASK_SHORT_LABELS: Record<number, string> = {
  1: 'kredi süreci',
  2: 'maaş akışı',
  3: 'yatırım süreci',
  4: 'finansal ekosistem merkezleri',
};

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 100) return { label: 'Finansal Sistem Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 75) return { label: 'Finansal Sistem Analisti', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Finansal Sistem Adayı', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Eğitimi Tekrar Etmeli', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
