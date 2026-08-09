// ── Portföy Ustası: Portföy Matrisi ve Bitirme Testi ────────────────────────
// Bölüm 1 (40 puan): 4 piyasa senaryosu x tam olarak 2 yatırım aracı seçimi
// Bölüm 2 (60 puan): 4 çoktan seçmeli soru (A-E)

export const GAME_DURATION_MS = 21 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_SCENARIO = 10;
export const TOTAL_SCENARIO_POINTS = 40;
export const POINTS_PER_QUESTION = 15;
export const TOTAL_QUESTION_POINTS = 60;
export const TOTAL_POINTS = 100;

export const PICKS_PER_SCENARIO = 2;

// ── Yatırım araçları ─────────────────────────────────────────────────────────

export type ToolId = 'mevduat' | 'tahvil' | 'altin' | 'hisse' | 'kripto';

export interface InvestmentTool {
  id: ToolId;
  label: string;
  icon: string;
  feature: string;
}

export const INVESTMENT_TOOLS: InvestmentTool[] = [
  { id: 'mevduat', label: 'Mevduat', icon: '🏦', feature: 'Sabit nakit / çok düşük risk' },
  { id: 'tahvil', label: 'Tahvil', icon: '📜', feature: 'Devlet garantisi / düşük risk' },
  { id: 'altin', label: 'Altın', icon: '🥇', feature: 'Güvenli liman / koruma aracı' },
  { id: 'hisse', label: 'Hisse Senedi', icon: '📈', feature: 'Şirket ortaklığı / yüksek risk' },
  { id: 'kripto', label: 'Kripto Para', icon: '🪙', feature: 'Dijital / aşırı yüksek risk' },
];

// ── Piyasa senaryoları ───────────────────────────────────────────────────────

export type ScenarioId = 'bull' | 'bear' | 'flat' | 'volatile';

export interface MarketScenario {
  id: ScenarioId;
  icon: string;
  title: string;
  description: string;
  correctCombos: ToolId[][];
}

export const MARKET_SCENARIOS: MarketScenario[] = [
  {
    id: 'bull',
    icon: '🐂',
    title: 'Yükseliş Piyasası (Boğa)',
    description: 'Ekonomi büyüyor, şirket kârları ve yatırımcı iştahı artıyor, fiyatlar güçlü şekilde yükseliyor.',
    correctCombos: [['hisse', 'kripto']],
  },
  {
    id: 'bear',
    icon: '🐻',
    title: 'Düşüş Piyasası (Ayı)',
    description: 'Ekonomik daralma, şirket kârlarında gerileme ve fiyatlarda sürekli düşüş yaşanıyor.',
    correctCombos: [
      ['mevduat', 'tahvil'],
      ['mevduat', 'altin'],
      ['tahvil', 'altin'],
    ],
  },
  {
    id: 'flat',
    icon: '➖',
    title: 'Durağan Piyasa (Yatay)',
    description: 'Fiyatlarda belirgin bir yön yok, piyasa dar bir bantta yatay hareket ediyor.',
    correctCombos: [
      ['mevduat', 'tahvil'],
      ['mevduat', 'altin'],
      ['tahvil', 'altin'],
    ],
  },
  {
    id: 'volatile',
    icon: '⚡',
    title: 'Dalgalı Piyasa (Volatil)',
    description: 'Fiyatlar kısa sürede sert şekilde yukarı ve aşağı hareket ediyor, belirsizlik yüksek.',
    correctCombos: [
      ['altin', 'mevduat'],
      ['altin', 'tahvil'],
    ],
  },
];

export const SECTION1_TITLE = 'Portföy Matrisi';
export const SECTION1_INSTRUCTION = 'Her piyasa senaryosu için tam olarak 2 yatırım aracı seç.';

// ── Bölüm 2: Portföy Ustası Bitirme Testi ────────────────────────────────────

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: QuizOption['id'];
  explanation: string;
  points: number;
}

export const SECTION2_TITLE = 'Portföy Ustası Bitirme Testi';
export const SECTION2_INSTRUCTION = 'Doğru seçeneği işaretle.';

export const SECTION2_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt:
      'Yatırım araçlarının getiri potansiyelleri ile barındırdıkları riskler arasında doğrudan bir ilişki vardır. Risk ne kadar yüksekse, potansiyel kayıp veya kazanç da o kadar yüksektir.\n\nI. Kripto Para\nII. Devlet Tahvili\nIII. Hisse Senedi\nIV. Vadeli Mevduat\n\nYukarıdaki yatırım araçlarının en riskliden en güvenliye doğru sıralanışı hangisidir?',
    options: [
      { id: 'A', label: 'I - III - II - IV' },
      { id: 'B', label: 'IV - II - III - I' },
      { id: 'C', label: 'III - I - IV - II' },
      { id: 'D', label: 'I - II - III - IV' },
      { id: 'E', label: 'III - IV - I - II' },
    ],
    correctOptionId: 'A',
    explanation:
      'Kripto para en yüksek riskli araçtır. Hisse senedi yüksek risk taşır ancak kriptoya göre daha düzenlenmiş bir piyasadadır. Devlet tahvili düşük risklidir. Vadeli mevduat ise önceden belirlenen sabit getirisi nedeniyle bu gruptaki en düşük riskli araçtır.',
    points: POINTS_PER_QUESTION,
  },
  {
    id: 2,
    prompt:
      'Küresel bir ekonomik krizin yaşandığı, şirket kârlarının düştüğü ve borsaların hızla gerilediği bir Ayı Piyasası senaryosunda yatırımcıların belirsizlikten korunmak amacıyla yöneldiği ve "güvenli liman" olarak kabul edilen yatırım aracı hangisidir?',
    options: [
      { id: 'A', label: 'Kripto Para' },
      { id: 'B', label: 'Altın' },
      { id: 'C', label: 'Teknoloji Hisseleri' },
      { id: 'D', label: 'Yeni Kurulan Şirketler (Start-up)' },
      { id: 'E', label: 'Risk Sermayesi Fonları' },
    ],
    correctOptionId: 'B',
    explanation: 'Altın, kriz ve belirsizlik dönemlerinde temel güvenli liman araçlarından biri olarak değerlendirilir.',
    points: POINTS_PER_QUESTION,
  },
  {
    id: 3,
    prompt:
      'Durağan (Yatay) bir piyasada fiyatların belirgin şekilde yükselmesinin beklenmediği bir durumda bilinçli bir yatırımcının sermayesini korumak için yapması gereken en doğru stratejik hamle nedir?',
    options: [
      { id: 'A', label: 'Tüm parasıyla yüksek dalgalanma gösteren kripto paralara girmek' },
      { id: 'B', label: 'Bütün hisse senetlerini satıp parayı faizsiz vadesiz hesapta tutmak' },
      { id: 'C', label: 'Portföyde garanti getiri sunan Mevduat ve Tahvil gibi araçların payını artırmak' },
      { id: 'D', label: 'Kriz beklentisiyle portföyün tamamını zararına satmak' },
      { id: 'E', label: 'Sadece teknoloji sektörü hisselerine odaklanmak' },
    ],
    correctOptionId: 'C',
    explanation: 'Yatay piyasa dönemlerinde belirgin fiyat hareketleri olmadığı için sabit getirili araçların portföydeki ağırlığını artırmak sermayenin korunmasına yardımcı olur.',
    points: POINTS_PER_QUESTION,
  },
  {
    id: 4,
    prompt:
      'Bir yatırımcı dalgalı piyasa şartlarında tüm parasını tek bir yatırım aracına yatırmak yerine parasını Mevduat, Altın ve Hisse Senedi gibi farklı yatırım araçlarına dağıtmaktadır.\n\nBu risk azaltma stratejisinin adı nedir?',
    options: [
      { id: 'A', label: 'Konsolidasyon' },
      { id: 'B', label: 'Fırsat Maliyeti' },
      { id: 'C', label: 'Çeşitlendirme' },
      { id: 'D', label: 'Bütçe Disiplini' },
      { id: 'E', label: 'Spekülatif Alım' },
    ],
    correctOptionId: 'C',
    explanation: 'Parayı farklı risk gruplarındaki yatırım araçlarına dağıtarak tek bir varlığa bağımlılığı azaltma stratejisine "Çeşitlendirme" denir.',
    points: POINTS_PER_QUESTION,
  },
];

// ── Performans geri bildirimi ─────────────────────────────────────────────────

export function getPerformance(score: number) {
  if (score >= 90) return { label: 'Portföy Ustası!', sub: 'Piyasa koşullarını ve riskleri ustalıkla yönettin.', color: 'text-emerald-400', icon: '🏆', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 70) return { label: 'Çok İyi İş!', sub: 'Portföy yönetimi konusunda güçlü bir anlayışın var.', color: 'text-blue-400', icon: '👍', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', sub: 'Bazı piyasa koşullarında daha dikkatli olabilirdin.', color: 'text-yellow-400', icon: '📘', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', sub: 'Piyasa döngüleri ve risk yönetimini tekrar gözden geçir.', color: 'text-red-400', icon: '📚', bg: 'from-red-900/60 to-slate-900' };
}
