import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Wallet, CreditCard, Calculator, Info, Lock } from 'lucide-react';

interface CreditCostAnalysisProps {
  onComplete?: (score: number) => void;
}

// ── Types ────────────────────────────────────────────────────────────────────

type Stage = 'intro' | 'play' | 'finished';
type FieldKey = 'cashPrice' | 'totalPayment' | 'creditCost';
type FieldStatus = 'idle' | 'correct' | 'incorrect';

interface CaseDef {
  id: number;
  icon: string;
  title: string;
  scenario: string;
  methodLabel: string;
  cashPrice: number;
  monthlyPayment: number | null;
  totalPayment: number;
  correctFeedback: string;
  wrongCostFeedback: string;
}

interface CaseState {
  values: Record<FieldKey, string>;
  status: Record<FieldKey, FieldStatus>;
  messages: Record<FieldKey, string | null>;
  completed: boolean;
}

interface StoredState {
  stage: Stage;
  activeCase: number;
  cases: CaseState[];
}

// ── Case data ────────────────────────────────────────────────────────────────

const CASES: CaseDef[] = [
  {
    id: 1,
    icon: '🎮',
    title: 'Oyun Konsolu ve Taksitlendirme Etkisi',
    scenario: 'Arkadaşlarıyla çevrimiçi oynamak için oyun konsolu almak isteyen öğrenci, ürünü taksitli olarak satın almaktadır.',
    methodLabel: 'Vade: 24 ay',
    cashPrice: 25000,
    monthlyPayment: 1750,
    totalPayment: 42000,
    correctFeedback: 'Doğru hesapladın. 42.000 TL toplam ödemeden 25.000 TL peşin fiyat çıkarıldığında kredi maliyeti 17.000 TL olur. Aylık ödeme düşük görünse bile uzun vade toplam finansman maliyetini artırabilir. Bu tutar ürüne değil, borçlanmaya ödenen bedeldir.',
    wrongCostFeedback: 'Hesaplama adımını tekrar gözden geçirmelisin. Bankaya ödenecek toplam tutardan ürünün peşin fiyatını çıkarmalısın.',
  },
  {
    id: 2,
    icon: '📷',
    title: 'Profesyonel Kamera ve Uzun Vade Maliyeti',
    scenario: 'İçerik üreticisi olmak isteyen öğrenci, profesyonel kamerayı peşinatsız ve uzun vadeli ödeme seçeneğiyle satın almaktadır.',
    methodLabel: 'Vade: 36 ay',
    cashPrice: 30000,
    monthlyPayment: null,
    totalPayment: 52000,
    correctFeedback: "Tebrikler, doğru analiz. 52.000 TL toplam ödemeden 30.000 TL peşin fiyat çıkarıldığında kredi maliyeti 22.000 TL olur. Vade uzadıkça anapara üzerine eklenen toplam faiz yükü artabilir.",
    wrongCostFeedback: "Bankaya ödenecek 52.000 TL'nin 30.000 TL'si kameranın kendi bedelidir. Kredi maliyetini bulmak için toplam ödemeden peşin fiyatı çıkarmalısın.",
  },
  {
    id: 3,
    icon: '✈️',
    title: 'Yurt Dışı Dil Kampı ve Eğitim Finansmanı',
    scenario: 'Öğrenci, yurt dışındaki bir dil kampına katılmak için eğitim kredisi kullanmaktadır.',
    methodLabel: 'Yöntem: Eğitim Kredisi',
    cashPrice: 50000,
    monthlyPayment: null,
    totalPayment: 85000,
    correctFeedback: 'Doğru yanıt. 85.000 TL toplam ödemeden 50.000 TL peşin fiyat çıkarıldığında kredi maliyeti 35.000 TL olur. Eğitim önemli bir yatırım olsa da kredilendirme sonucunda ortaya çıkan finansman maliyeti ayrıca değerlendirilmelidir.',
    wrongCostFeedback: 'Kredi maliyetini bulmak için kampın peşin fiyatı ile bankaya ödenecek toplam tutar arasındaki farkı hesaplamalısın.',
  },
  {
    id: 4,
    icon: '🚲',
    title: 'Elektrikli Bisiklet ve Aylık Ödeme İllüzyonu',
    scenario: 'Öğrenci, aylık ödemeyi düşük tutmak amacıyla elektrikli bisiklet için en uzun vadeli ödeme planını seçmektedir.',
    methodLabel: 'Vade: 48 ay',
    cashPrice: 40000,
    monthlyPayment: null,
    totalPayment: 68000,
    correctFeedback: 'Çok iyi bir hesaplama. 68.000 TL toplam ödemeden 40.000 TL peşin fiyat çıkarıldığında kredi maliyeti 28.000 TL olur. Aylık ödemenin düşük olması, toplam maliyetin düşük olduğu anlamına gelmez.',
    wrongCostFeedback: 'Kredi maliyeti ürünün toplam bedeli değildir. Toplam ödemeden bisikletin peşin fiyatını çıkarmalısın.',
  },
  {
    id: 5,
    icon: '👟',
    title: 'Nakit Avans ve Tüketim Maliyeti',
    scenario: 'Öğrenci, bütçesi uygun olmadığı hâlde sınırlı üretim bir ayakkabıyı taksitli nakit avans kullanarak satın almaktadır.',
    methodLabel: 'Yöntem: Taksitli Nakit Avans',
    cashPrice: 10000,
    monthlyPayment: null,
    totalPayment: 18000,
    correctFeedback: 'Doğru sonuç. 18.000 TL toplam ödemeden 10.000 TL peşin fiyat çıkarıldığında kredi maliyeti 8.000 TL olur. Nakit avans, yüksek finansman maliyeti oluşturabilen bir borçlanma yöntemidir.',
    wrongCostFeedback: 'Toplam ödenecek tutardan ürünün peşin fiyatını çıkarmalısın. Aradaki fark nakit avans kullanımının oluşturduğu kredi maliyetidir.',
  },
];

const GLOSSARY = [
  { term: 'Peşin Fiyat', def: 'Bir malın veya hizmetin taksit ya da kredi kullanılmadan tek seferde ödenen gerçek fiyatıdır.' },
  { term: 'Kredi Maliyeti', def: 'Borç para kullanımı karşılığında anaparanın üzerine eklenen finansman bedelidir.' },
  { term: 'Vade', def: 'Borcun geri ödenmesi için belirlenen toplam süre veya taksit sayısıdır.' },
  { term: 'Nakit Avans', def: 'Kredi kartı limitinden nakit para kullanılmasıdır ve yüksek finansman maliyeti oluşturabilir.' },
  { term: 'Finansman Gideri', def: 'Borçlanma sonucunda oluşan faiz, komisyon ve benzeri ek maliyetlerin genel adıdır.' },
];

const STRATEGY_TIPS = [
  { title: 'Taksit Yanılgısı', desc: 'Düşük aylık taksit, düşük toplam maliyet anlamına gelmez.' },
  { title: 'Vade Etkisi', desc: 'Vade uzadıkça toplam kredi maliyeti artabilir.' },
  { title: 'Toplam Bakış', desc: 'Finansal karar verirken yalnızca aylık ödemeye değil, toplam geri ödemeye bakılmalıdır.' },
  { title: 'Maliyet Farkı', desc: 'Bir ürünün peşin fiyatı ile toplam ödeme arasındaki fark borçlanmanın maliyetidir.' },
  { title: 'Fayda-Maliyet', desc: 'Borçlanmadan önce kredi maliyetinin elde edilecek faydaya değip değmediği değerlendirilmelidir.' },
];

const FIELD_LABELS: Record<FieldKey, string> = {
  cashPrice: 'Peşin Fiyat',
  totalPayment: 'Toplam Ödenecek Tutar',
  creditCost: 'Kredi Maliyeti',
};

// ── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'finedu_credit_cost_analysis_v1';

function loadStored(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed.cases || parsed.cases.length !== CASES.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStored(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage kullanılamıyor — kalıcılık olmadan devam et */
  }
}

function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok say */
  }
}

function createEmptyCaseState(): CaseState {
  return {
    values: { cashPrice: '', totalPayment: '', creditCost: '' },
    status: { cashPrice: 'idle', totalPayment: 'idle', creditCost: 'idle' },
    messages: { cashPrice: null, totalPayment: null, creditCost: null },
    completed: false,
  };
}

// ── Numeric parsing ──────────────────────────────────────────────────────────

function parseTLAmount(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  let s = raw.trim();
  s = s.replace(/TL/gi, '').replace(/₺/g, '');
  s = s.replace(/\s+/g, '');
  s = s.replace(/\./g, '');
  s = s.replace(/,/g, '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const num = Number(s);
  if (Number.isNaN(num) || num < 0) return null;
  return num;
}

function formatTL(n: number) {
  return `${n.toLocaleString('tr-TR')} TL`;
}

const FIELD_FEEDBACK: Record<FieldKey, { correct: string; wrong: (c: CaseDef) => string }> = {
  cashPrice: {
    correct: 'Doğru! Peşin fiyatı doğru belirledin.',
    wrong: () => 'Senaryoda ürünün veya hizmetin borçlanma kullanılmadan ödenecek peşin fiyatını bulmalısın.',
  },
  totalPayment: {
    correct: 'Doğru! Toplam ödeme tutarını doğru belirledin.',
    wrong: () => 'Senaryoda vade sonunda bankaya ödenecek toplam tutarı tekrar kontrol etmelisin.',
  },
  creditCost: {
    correct: 'Doğru! Kredi maliyetini doğru hesapladın.',
    wrong: (c) => c.wrongCostFeedback,
  },
};

// ── Field row ────────────────────────────────────────────────────────────────

interface FieldRowProps {
  fieldKey: FieldKey;
  icon: React.ReactNode;
  value: string;
  status: FieldStatus;
  message: string | null;
  onChange: (value: string) => void;
  onCheck: () => void;
}

function FieldRow({ fieldKey, icon, value, status, message, onChange, onCheck }: FieldRowProps) {
  const locked = status === 'correct';
  return (
    <div className={`bg-slate-800 rounded-xl border p-4 transition-colors ${
      locked ? 'border-emerald-700' : status === 'incorrect' ? 'border-red-800' : 'border-slate-700'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-slate-300 text-sm font-bold">{FIELD_LABELS[fieldKey]}</span>
        {locked && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />}
        {!locked && status === 'incorrect' && <XCircle className="w-4 h-4 text-red-400 ml-auto" />}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !locked) onCheck();
          }}
          placeholder="Örn: 17.000 TL"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-slate-900 border outline-none transition-colors disabled:opacity-70 ${
            locked
              ? 'border-emerald-600 text-emerald-300'
              : status === 'incorrect'
              ? 'border-red-600 text-white'
              : 'border-slate-600 text-white focus:border-blue-500'
          }`}
        />
        {!locked && (
          <button
            onClick={onCheck}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors flex-shrink-0"
          >
            Kontrol Et
          </button>
        )}
      </div>
      {message && (
        <p className={`text-xs mt-2 leading-relaxed ${locked ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>
      )}
    </div>
  );
}

// ── Scenario info panel ──────────────────────────────────────────────────────

function ScenarioInfoPanel({ caseDef }: { caseDef: CaseDef }) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-5">
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-5 py-3 flex items-center gap-3">
        <Info className="w-5 h-5 text-indigo-200 flex-shrink-0" />
        <div>
          <p className="text-white font-bold text-sm">{caseDef.icon} {caseDef.title}</p>
          <p className="text-indigo-200 text-xs">{caseDef.methodLabel}</p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{caseDef.scenario}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700">
            <p className="text-slate-400 text-xs">Peşin Fiyat</p>
            <p className="text-white font-black text-lg">{formatTL(caseDef.cashPrice)}</p>
          </div>
          {caseDef.monthlyPayment !== null && (
            <div className="bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700">
              <p className="text-slate-400 text-xs">Aylık Ödeme</p>
              <p className="text-white font-black text-lg">{formatTL(caseDef.monthlyPayment)}</p>
            </div>
          )}
          <div className="bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700">
            <p className="text-slate-400 text-xs">Toplam Ödenecek Tutar</p>
            <p className="text-white font-black text-lg">{formatTL(caseDef.totalPayment)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CreditCostAnalysis({ onComplete }: CreditCostAnalysisProps) {
  const stored = useMemo(() => loadStored(), []);

  const [stage, setStage] = useState<Stage>(stored?.stage ?? 'intro');
  const [activeCase, setActiveCase] = useState<number>(stored?.activeCase ?? 0);
  const [cases, setCases] = useState<CaseState[]>(
    stored?.cases ?? CASES.map(() => createEmptyCaseState())
  );

  useEffect(() => {
    if (stage === 'intro') return;
    saveStored({ stage, activeCase, cases });
  }, [stage, activeCase, cases]);

  const completedCount = cases.filter((c) => c.completed).length;
  const caseDef = CASES[activeCase];
  const caseState = cases[activeCase];

  const updateValue = (field: FieldKey) => (val: string) => {
    setCases((prev) => {
      const next = [...prev];
      next[activeCase] = {
        ...next[activeCase],
        values: { ...next[activeCase].values, [field]: val },
      };
      return next;
    });
  };

  const checkField = (field: FieldKey) => () => {
    setCases((prev) => {
      const next = [...prev];
      const c = next[activeCase];
      if (c.status[field] === 'correct') return prev;

      const raw = c.values[field];
      const parsed = parseTLAmount(raw);
      const expected =
        field === 'cashPrice'
          ? caseDef.cashPrice
          : field === 'totalPayment'
          ? caseDef.totalPayment
          : caseDef.totalPayment - caseDef.cashPrice;

      let status: FieldStatus = 'incorrect';
      let message: string;
      if (!raw || !raw.trim()) {
        message = 'Bu alan boş bırakılamaz.';
      } else if (parsed === null) {
        message = 'Lütfen geçerli bir TL tutarı gir.';
      } else if (parsed === expected) {
        status = 'correct';
        message = FIELD_FEEDBACK[field].correct;
      } else {
        message = FIELD_FEEDBACK[field].wrong(caseDef);
      }

      const newStatus = { ...c.status, [field]: status };
      const newMessages = { ...c.messages, [field]: message };
      const completed =
        newStatus.cashPrice === 'correct' &&
        newStatus.totalPayment === 'correct' &&
        newStatus.creditCost === 'correct';

      next[activeCase] = { ...c, status: newStatus, messages: newMessages, completed };
      return next;
    });
  };

  const handleCaseAdvance = () => {
    if (activeCase < CASES.length - 1) {
      setActiveCase((i) => i + 1);
    } else {
      onComplete?.(100);
      setStage('finished');
    }
  };

  const handleRestart = () => {
    setStage('intro');
    setActiveCase(0);
    setCases(CASES.map(() => createEmptyCaseState()));
    clearStored();
  };

  // ── INTRO ──────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-1">Kredi Maliyeti Analizi 🧮</h1>
          <p className="text-muted-foreground text-sm">5 vaka · Her vakada 3 doğrulama · Toplam 100 puan</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-blue-700/50 shadow-xl bg-gradient-to-r from-blue-950 to-slate-900 mb-5 px-6 py-6 text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Temel Formül</p>
          <p className="text-white text-xl md:text-2xl font-black">
            Kredi Maliyeti = Toplam Ödenecek Tutar − Peşin Fiyat
          </p>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
            Bir ürün veya hizmet krediyle satın alındığında yalnızca aylık taksite değil; peşin fiyat, toplam geri ödeme
            ve aradaki farkın oluşturduğu gerçek kredi maliyetine bakmalısın.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <div
            className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
          >
            <div className="px-5 py-4 border-b border-cyan-800/40">
              <div className="text-cyan-400 text-base font-black uppercase tracking-widest">📖 Finans Sözlüğü</div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
              {GLOSSARY.map((item, i) => (
                <div key={i}>
                  <div className="text-base font-bold text-cyan-300 mb-1.5">{item.term}</div>
                  <div className="text-sm text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
          >
            <div className="px-5 py-4 border-b border-amber-800/40">
              <div className="text-amber-400 text-base font-black uppercase tracking-widest">🎯 Akıllı Borçlanma Kuralları</div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
              {STRATEGY_TIPS.map((tip, i) => (
                <div key={i}>
                  <div className="text-base font-bold text-amber-300 mb-1.5">{tip.title}</div>
                  <div className="text-sm text-slate-400 leading-relaxed">{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setStage('play')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-purple-800"
          >
            Oyuna Başla 🧮
          </motion.button>
        </div>
      </div>
    );
  }

  // ── FINISHED ───────────────────────────────────────────────────────────
  if (stage === 'finished') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-900/60 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-7xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-1">Analiz Tamamlandı!</h2>
              <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
                Tebrikler! Beş finansman vakasının tamamında peşin fiyatı, toplam ödemeyi ve kredi maliyetini doğru
                belirledin. Artık düşük aylık taksitlerin arkasındaki gerçek toplam maliyeti daha bilinçli
                değerlendirebilirsin.
              </p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl">
                100 / 100 Puan
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Vaka Özetleri</h3>
              {CASES.map((c, idx) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-900/30 border-emerald-700/40"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs mb-0.5">
                      Vaka {idx + 1}: {c.icon} {c.title}
                    </p>
                    <p className="text-white text-sm font-medium">
                      {formatTL(c.totalPayment)} − {formatTL(c.cashPrice)} ={' '}
                      <span className="text-emerald-300 font-black">{formatTL(c.totalPayment - c.cashPrice)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
            >
              Tekrar Oyna 🔄
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAY ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">
        {/* ── Left Panel: Finans Sözlüğü ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-cyan-800/40">
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-0.5">📖 Finans Sözlüğü</div>
              <div className="text-cyan-600 text-xs">{caseDef.title}</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {GLOSSARY.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-cyan-300 mb-1.5">{item.term}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Center: Game card ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Vaka</span>
                <span className="text-slate-300 font-bold text-sm">
                  {activeCase + 1} / {CASES.length}
                </span>
              </div>
              <div className="bg-blue-900/60 text-blue-300 px-4 py-1.5 rounded-full text-sm font-black border border-blue-700/60">
                🧮 {completedCount}/{CASES.length} Tamamlandı
              </div>
            </div>

            <div className="p-6">
              {/* Case navigator */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {CASES.map((c, i) => {
                  const state = cases[i];
                  const unlocked = i <= completedCount;
                  const isActive = i === activeCase;
                  return (
                    <button
                      key={c.id}
                      disabled={!unlocked}
                      onClick={() => unlocked && setActiveCase(i)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        state.completed
                          ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300'
                          : isActive
                          ? 'bg-blue-900/60 border-blue-500 text-blue-200'
                          : unlocked
                          ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {state.completed ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : !unlocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : null}
                      Vaka {i + 1}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCase}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <ScenarioInfoPanel caseDef={caseDef} />

                  <div className="grid gap-4 mb-4">
                    <FieldRow
                      fieldKey="cashPrice"
                      icon={<Wallet className="w-4 h-4 text-blue-400" />}
                      value={caseState.values.cashPrice}
                      status={caseState.status.cashPrice}
                      message={caseState.messages.cashPrice}
                      onChange={updateValue('cashPrice')}
                      onCheck={checkField('cashPrice')}
                    />
                    <FieldRow
                      fieldKey="totalPayment"
                      icon={<CreditCard className="w-4 h-4 text-purple-400" />}
                      value={caseState.values.totalPayment}
                      status={caseState.status.totalPayment}
                      message={caseState.messages.totalPayment}
                      onChange={updateValue('totalPayment')}
                      onCheck={checkField('totalPayment')}
                    />
                    <FieldRow
                      fieldKey="creditCost"
                      icon={<Calculator className="w-4 h-4 text-amber-400" />}
                      value={caseState.values.creditCost}
                      status={caseState.status.creditCost}
                      message={caseState.messages.creditCost}
                      onChange={updateValue('creditCost')}
                      onCheck={checkField('creditCost')}
                    />
                  </div>

                  <AnimatePresence>
                    {caseState.completed && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="rounded-xl px-5 py-4 mb-4 bg-emerald-900/50 border border-emerald-600/50 flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-emerald-200 text-sm leading-relaxed">{caseDef.correctFeedback}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCaseAdvance}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                        >
                          {activeCase < CASES.length - 1 ? 'Sonraki Vaka ➔' : 'Sonuçları Gör 🏆'}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* end center */}

        {/* ── Right Panel: Akıllı Borçlanma Kuralları ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-amber-800/40">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Akıllı Borçlanma Kuralları</div>
              <div className="text-amber-600 text-xs">{caseDef.methodLabel}</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {STRATEGY_TIPS.map((tip, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-amber-300 mb-1.5">{tip.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* end 3-col flex */}
    </div>
  );
}
