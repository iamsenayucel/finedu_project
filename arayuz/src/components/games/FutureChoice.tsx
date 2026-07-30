import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type RiskProfile = 'guven' | 'dengeli' | 'risk';
type Stage = 'intro' | 'career_result' | 'investment' | 'investment_result' | 'crisis' | 'final';
interface FutureChoiceProps { onComplete?: (score: number) => void }

// ─── Data ─────────────────────────────────────────────────────────────────────

const DOORS = [
  {
    id: 'guven'    as RiskProfile,
    label: 'Devlet Memurluğu',
    icon: '🏛️',
    sub: 'Güvenli & İstikrarlı',
    grad: 'from-blue-700 via-blue-800 to-blue-950',
    panelBorder: 'border-blue-400/30',
    knob: 'bg-yellow-400',
    shadow: 'shadow-blue-500/50',
    border: 'border-blue-400',
    feedback: 'Stabil bir başlangıç yaptın.',
    feedbackSub: 'Düzenli gelir ve iş güvencesiyle güvenli bir zemin kuruyorsun.',
    feedbackColor: 'text-blue-400',
  },
  {
    id: 'dengeli'  as RiskProfile,
    label: 'Özel Sektör',
    icon: '🏢',
    sub: 'Dinamik & Fırsatlı',
    grad: 'from-purple-700 via-purple-800 to-purple-950',
    panelBorder: 'border-purple-400/30',
    knob: 'bg-yellow-400',
    shadow: 'shadow-purple-500/50',
    border: 'border-purple-400',
    feedback: 'Hem güven hem fırsat arıyorsun.',
    feedbackSub: 'Performansa dayalı kazanç ile hem güvenlik hem büyüme bir arada.',
    feedbackColor: 'text-purple-400',
  },
  {
    id: 'risk'     as RiskProfile,
    label: 'Girişimcilik',
    icon: '🚀',
    sub: 'Özgür & Riskli',
    grad: 'from-orange-600 via-red-700 to-red-950',
    panelBorder: 'border-orange-400/30',
    knob: 'bg-yellow-400',
    shadow: 'shadow-orange-500/50',
    border: 'border-orange-400',
    feedback: 'Belirsiz ama potansiyeli yüksek bir yol.',
    feedbackSub: 'Kendi kurallarını belirliyor, tüm sorumluluğu üstleniyorsun.',
    feedbackColor: 'text-orange-400',
  },
];

const MICRO_OPTIONS = [
  { label: 'Sabit gelir',             icon: '💰' },
  { label: 'Yüksek kazanç ihtimali',  icon: '📈' },
  { label: 'Esneklik',                icon: '🕊️' },
];

const INVEST_OPTIONS = [
  {
    id: 'guven'   as RiskProfile,
    label: 'Bankada Tut',
    icon: '🏦',
    desc: 'Düşük ama garantili getiri',
    badge: 'Düşük Risk',
    badgeCls: 'bg-blue-800/60 text-blue-300 border border-blue-600',
    borderCls: 'border-blue-500',
    bgHover: 'hover:bg-blue-900/40',
    bgBase: 'bg-blue-900/20',
    change: 3000,
    win: true,
    resultNote: 'Yıllık faiz geliri garantili biçimde hesabına eklendi.',
  },
  {
    id: 'dengeli' as RiskProfile,
    label: 'Parayı Böl',
    icon: '⚖️',
    desc: 'Yarısı yatırım, yarısı birikim',
    badge: 'Orta Risk',
    badgeCls: 'bg-purple-800/60 text-purple-300 border border-purple-600',
    borderCls: 'border-purple-500',
    bgHover: 'hover:bg-purple-900/40',
    bgBase: 'bg-purple-900/20',
    change: 7000,
    win: true,
    resultNote: 'Dengeli strateji orta vadede olumlu sonuç verdi.',
  },
  {
    id: 'risk'    as RiskProfile,
    label: 'Tek Riskli Yatırım',
    icon: '🎲',
    desc: 'Büyük kazanç ya da kayıp',
    badge: 'Yüksek Risk',
    badgeCls: 'bg-orange-800/60 text-orange-300 border border-orange-600',
    borderCls: 'border-orange-500',
    bgHover: 'hover:bg-orange-900/40',
    bgBase: 'bg-orange-900/20',
    change: null as number | null,
    win: null as boolean | null,
    resultNote: '',
  },
];

const CRISIS_OPTIONS = [
  {
    id: 'guven'   as RiskProfile,
    dot: '🟢',
    label: 'Yeni Sabit İş Bul',
    icon: '💼',
    feedback: 'Daha güvenli bir yolu tercih ettin.',
    borderCls: 'border-emerald-500',
    bgBase: 'bg-emerald-900/20',
    bgHover: 'hover:bg-emerald-900/50',
    textCls: 'text-emerald-400',
  },
  {
    id: 'dengeli' as RiskProfile,
    dot: '🟡',
    label: 'Ek İş + Küçük Yatırım Yap',
    icon: '📊',
    feedback: 'Dengeli bir strateji kuruyorsun.',
    borderCls: 'border-amber-500',
    bgBase: 'bg-amber-900/20',
    bgHover: 'hover:bg-amber-900/50',
    textCls: 'text-amber-400',
  },
  {
    id: 'risk'    as RiskProfile,
    dot: '🔴',
    label: 'Kendi İşini Kur',
    icon: '🚀',
    feedback: 'Risk alarak fırsat yaratmaya çalışıyorsun.',
    borderCls: 'border-red-500',
    bgBase: 'bg-red-900/20',
    bgHover: 'hover:bg-red-900/50',
    textCls: 'text-red-400',
  },
];

const PROFILES: Record<RiskProfile, {
  title: string; icon: string; color: string; bgGrad: string; borderCls: string;
  tagline: string; desc: string; advice: string;
}> = {
  guven: {
    title: 'Güven Odaklı',
    icon: '🛡️',
    color: 'text-blue-400',
    bgGrad: 'from-blue-900/70 to-slate-900',
    borderCls: 'border-blue-600',
    tagline: 'İstikrar senin önceliğin.',
    desc: 'Kararlarında istikrarı ön planda tutuyorsun. Riskten kaçınarak daha güvenli bir yol izliyorsun.',
    advice: 'Daha fazla kazanmak için küçük ve kontrollü riskler almayı deneyebilirsin.',
  },
  dengeli: {
    title: 'Dengeli Stratejist',
    icon: '⚖️',
    color: 'text-purple-400',
    bgGrad: 'from-purple-900/70 to-slate-900',
    borderCls: 'border-purple-600',
    tagline: 'Risk ve güveni harmanlıyorsun.',
    desc: 'Risk ve güven arasında denge kurabiliyorsun. Bu yaklaşım uzun vadede güçlü sonuçlar sağlayabilir.',
    advice: 'Bu yaklaşım seni uzun vadede güçlü kılar. Gelir çeşitlendirmeye devam et.',
  },
  risk: {
    title: 'Risk Alan Girişimci',
    icon: '🚀',
    color: 'text-orange-400',
    bgGrad: 'from-orange-900/70 to-slate-900',
    borderCls: 'border-orange-600',
    tagline: 'Büyük fırsatlar için risk alıyorsun.',
    desc: 'Yüksek kazanç için risk almaya açıksın. Bu yaklaşım büyük fırsatlar yaratabilir.',
    advice: 'Risk almak güçlü bir özelliktir. Ancak risklerini dağıtarak daha sürdürülebilir ilerleyebilirsin.',
  },
};

// ─── Side panel data ──────────────────────────────────────────────────────────
const FUTURE_PANEL = {
  dictionary: [
    { term: 'Risk Toleransı', def: 'Bir karar alırken veya yatırım yaparken, paranın veya düzeninin kaybolma ihtimaline karşı gösterebildiğin dayanıklılık seviyesidir.' },
    { term: 'Fırsat Maliyeti', def: 'Bir seçeneği tercih ettiğinde, vazgeçtiğin diğer seçeneğin sana sunacağı kazançtır. "Güvenli" yolu seçtiğinde, "Büyük Kazanç" ihtimalinden vazgeçersin.' },
    { term: 'Sabit Gelir', def: 'Piyasalar çökse de, işler kötü gitse de her ayın belirli bir gününde hesaba yatan, miktarı önceden belli olan nakit akışıdır.' },
    { term: 'Portföy Çeşitlendirmesi', def: '"Tüm yumurtaları aynı sepete koymama" kuralıdır. Elindeki sermayeyi güvenli ve riskli alanlara dağıtarak toplam riski düşürme stratejisidir.' },
    { term: 'Esneklik', def: 'Sadece parayla ölçülemeyen; çalışma saatlerini kendin belirleyebilme, kimseye hesap vermeme ve kendi fikirlerini hayata geçirebilme özgürlüğüdür.' },
  ],
  strategyTitle: 'Kariyer Yolları Analizi',
  strategyTips: [
    { title: '🏛 Devlet Memurluğu', desc: '✅ En büyük avantajı düzenli maaş ve yüksek iş güvencesidir. ❌ Dezavantajı gelir tavanının belli olmasıdır.' },
    { title: '🏢 Özel Sektör', desc: '✅ En büyük avantajı performansa dayalı hızlı maaş artışıdır. ❌ Dezavantajı küçülmede işten çıkarılma riskidir.' },
    { title: '🚀 Girişimcilik', desc: '✅ En büyük avantajı özgürlük ve sınırsız kazanç potansiyelidir. ❌ Dezavantajı sabit gelirin olmaması, ilk yıllarda zarar riskidir.' },
  ],
};

function FuturePanels({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">
        {/* Left Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-cyan-800/40">
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-0.5">📖 Ekonomi Sözlüğü</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {FUTURE_PANEL.dictionary.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-cyan-300 mb-1.5">{item.term}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-amber-800/40">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 {FUTURE_PANEL.strategyTitle}</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {FUTURE_PANEL.strategyTips.map((tip, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-amber-300 mb-1.5">{tip.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTL(n: number) {
  return n.toLocaleString('tr-TR') + ' TL';
}

function calcProfile(choices: (RiskProfile | null)[]): RiskProfile {
  const c = { guven: 0, dengeli: 0, risk: 0 };
  choices.forEach(ch => { if (ch) c[ch]++; });
  if (c.guven > c.dengeli && c.guven > c.risk) return 'guven';
  if (c.risk > c.guven && c.risk > c.dengeli) return 'risk';
  return 'dengeli';
}

// ─── Door card ────────────────────────────────────────────────────────────────
function DoorCard({ door, onSelect, disabled }: {
  door: typeof DOORS[number];
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { y: -10, scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`relative flex flex-col items-center rounded-t-3xl rounded-b-xl border-2 ${door.border}
        bg-gradient-to-b ${door.grad} shadow-xl ${door.shadow}
        w-44 h-72 overflow-hidden cursor-pointer select-none focus:outline-none`}
    >
      {/* Inner door panel */}
      <div className={`absolute inset-3 rounded-t-2xl rounded-b-lg border ${door.panelBorder}`} />
      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      {/* Doorknob */}
      <div className={`absolute right-5 top-1/2 w-3.5 h-3.5 rounded-full ${door.knob} shadow-md z-10`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-6 px-3">
        <div className="text-5xl drop-shadow-lg">{door.icon}</div>
        <div className="text-center">
          <p className="text-white font-black text-sm leading-tight drop-shadow">{door.label}</p>
          <p className="text-white/60 text-xs mt-1">{door.sub}</p>
        </div>
        <div className="bg-white/15 border border-white/30 text-white text-xs font-bold py-1.5 px-5 rounded-full">
          Seç
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FutureChoice({ onComplete }: FutureChoiceProps) {
  const [stage, setStage]                   = useState<Stage>('intro');
  const [score, setScore]                   = useState(0);

  const [careerChoice, setCareerChoice]     = useState<RiskProfile | null>(null);
  const [microAnswer, setMicroAnswer]       = useState<string | null>(null);
  const [investChoice, setInvestChoice]     = useState<RiskProfile | null>(null);
  const [investResult, setInvestResult]     = useState<{ change: number; win: boolean } | null>(null);
  const [crisisChoice, setCrisisChoice]     = useState<RiskProfile | null>(null);

  // Animated TL counter
  const [displayTL, setDisplayTL]           = useState(50000);

  useEffect(() => {
    if (stage !== 'investment_result' || !investResult) return;
    const target = 50000 + investResult.change;
    const steps  = 40;
    const stepVal = (target - 50000) / steps;
    let i = 0;
    setDisplayTL(50000);
    const t = setInterval(() => {
      i++;
      if (i >= steps) { setDisplayTL(target); clearInterval(t); }
      else setDisplayTL(v => Math.round(v + stepVal));
    }, 40);
    return () => clearInterval(t);
  }, [stage, investResult]);

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />

          {/* Decorative bg */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-500/8 rounded-full blur-3xl" />
          </div>

          <div className="relative px-8 pt-10 pb-4 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              🎯 Karar Simülasyonu
            </div>
            <h1 className="text-4xl font-black text-white mb-3">
              Geleceğini Seç:<br />
              <span className="text-amber-400">Risk mi, Güven mi?</span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-xl mx-auto mb-2">
              Uzun bir eğitim yolculuğunu geride bıraktın. Artık hayatının en önemli kararlarından birinin eşiğindesin.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-8">
              Vereceğin bu karar; gelirini, yaşam tarzını ve geleceğini doğrudan etkileyecek.
            </p>

            {/* Scenario tags */}
            <div className="flex justify-center gap-3 mb-10 flex-wrap">
              {[
                { icon: '💼', label: 'Kariyer Seçimi' },
                { icon: '💰', label: 'Yatırım Kararı' },
                { icon: '⚡', label: 'Beklenmedik Durum' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-700/60 border border-slate-600 rounded-full px-4 py-1.5 text-slate-300 text-sm">
                  <span>{t.icon}</span>{t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Doors */}
          <div className="relative px-8 pb-6">
            <p className="text-center text-slate-400 text-sm font-bold uppercase tracking-widest mb-6">
              Şimdi düşün: Sen nasıl bir hayat istiyorsun?
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              {DOORS.map(door => (
                <DoorCard
                  key={door.id}
                  door={door}
                  disabled={false}
                  onSelect={() => {
                    setCareerChoice(door.id);
                    setScore(10);
                    setStage('career_result');
                  }}
                />
              ))}
            </div>
          </div>

          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 mt-6" />
        </div>
      </div>
    );
  }

  // ── CAREER RESULT ─────────────────────────────────────────────────────────
  if (stage === 'career_result') {
    const chosen = DOORS.find(d => d.id === careerChoice)!;
    return (
      <FuturePanels>
        <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />

          <AnimatePresence mode="wait">
            <motion.div
              key={microAnswer ? 'micro-done' : 'career-fb'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              {/* Selected door recap */}
              <div className={`bg-gradient-to-br ${chosen.grad} rounded-2xl p-5 mb-6 border ${chosen.border}`}>
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{chosen.icon}</div>
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Seçtiğin yol</p>
                    <p className="text-white font-black text-xl">{chosen.label}</p>
                    <p className="text-white/70 text-sm mt-0.5">{chosen.sub}</p>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-6">
                <p className={`font-black text-lg mb-1 ${chosen.feedbackColor}`}>
                  💬 {chosen.feedback}
                </p>
                <p className="text-slate-400 text-sm">{chosen.feedbackSub}</p>
              </div>

              {/* Micro question */}
              {!microAnswer ? (
                <div>
                  <p className="text-white font-bold text-base mb-4">
                    🧠 Bu seçimin en büyük avantajı nedir?
                    <span className="ml-2 text-slate-500 text-xs font-normal">(düşünceni seç)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {MICRO_OPTIONS.map(opt => (
                      <motion.button
                        key={opt.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMicroAnswer(opt.label)}
                        className="flex flex-col items-center gap-2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-amber-500 rounded-2xl px-4 py-4 text-white font-bold text-sm text-center transition-all"
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-700/50 rounded-xl px-5 py-3 mb-6">
                    <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-amber-300 text-sm font-bold">
                      Cevabın kaydedildi: <span className="text-white">{microAnswer}</span>
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStage('investment')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-base shadow-lg border-b-4 border-purple-800"
                  >
                    Sonraki Senaryo <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </FuturePanels>
    );
  }

  // ── INVESTMENT ────────────────────────────────────────────────────────────
  if (stage === 'investment') {
    return (
      <FuturePanels>
        <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
          <div className="p-8">

            {/* Status panel */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="col-span-3 bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                  Şu an elinde <span className="text-white font-black">50.000 TL</span> birikim var.
                </p>
                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                  Düzenli bir gelirin var ve giderlerini karşılayabiliyorsun.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                  Bu para geleceğin için önemli bir fırsat. Ama nasıl değerlendireceğin tamamen sana bağlı.
                </p>
                <p className="text-white font-bold text-sm mt-4">
                  💰 Bu parayı nasıl değerlendireceksin?
                </p>
              </div>

              {/* Durum Paneli */}
              <div className="col-span-2 bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📊</span>
                  <span className="text-white font-black text-sm">Durum Paneli</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Birikim',         val: '50.000 TL', color: 'text-blue-400'   },
                    { label: 'Aylık Gelir',      val: '18.000 TL', color: 'text-emerald-400' },
                    { label: 'Aylık Gider',      val: '12.000 TL', color: 'text-white'      },
                    { label: 'Kalan (Tasarruf)', val: '6.000 TL',  color: 'text-emerald-400' },
                    { label: 'Risk Toleransı',   val: 'Belirsiz',  color: 'text-amber-400'   },
                    { label: 'Hedef',            val: 'Büyütmek',  color: 'text-slate-300'  },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400 text-xs">{row.label}</span>
                      <span className={`text-xs font-black ${row.color}`}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Investment cards */}
            <div className="grid grid-cols-3 gap-4">
              {INVEST_OPTIONS.map(opt => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    let change = opt.change ?? 0;
                    let win    = opt.win ?? false;
                    if (opt.id === 'risk') {
                      win    = Math.random() > 0.4;
                      change = win ? 20000 : -15000;
                    }
                    setInvestChoice(opt.id);
                    setInvestResult({ change, win });
                    setScore(prev => prev + 10);
                    setStage('investment_result');
                  }}
                  className={`flex flex-col items-center gap-3 rounded-2xl p-5 border-2 text-center transition-all ${opt.bgBase} ${opt.bgHover} ${opt.borderCls}`}
                >
                  <span className="text-4xl">{opt.icon}</span>
                  <p className="text-white font-black text-base">{opt.label}</p>
                  <p className="text-slate-400 text-xs">{opt.desc}</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${opt.badgeCls}`}>
                    {opt.badge}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </FuturePanels>
    );
  }

  // ── INVESTMENT RESULT ─────────────────────────────────────────────────────
  if (stage === 'investment_result' && investResult) {
    const isWin       = investResult.win;
    const finalAmount = 50000 + investResult.change;
    const chosenOpt   = INVEST_OPTIONS.find(o => o.id === investChoice)!;
    const isRisky     = investChoice === 'risk';

    return (
      <FuturePanels>
        <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
          <div className="p-8">

            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-6">
              Yatırım Sonucu
            </p>

            {/* Result card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`rounded-3xl p-8 border-2 text-center mb-6 ${
                isWin
                  ? 'bg-emerald-900/40 border-emerald-500'
                  : 'bg-red-900/40 border-red-500'
              }`}
            >
              <div className="text-5xl mb-3">{isWin ? '📈' : '📉'}</div>

              {/* Counter */}
              <motion.p
                className={`text-5xl font-black mb-2 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {fmtTL(displayTL)}
              </motion.p>

              <div className={`inline-flex items-center gap-2 text-lg font-bold mb-4 ${isWin ? 'text-emerald-300' : 'text-red-300'}`}>
                {isWin
                  ? <><TrendingUp className="w-5 h-5" /> +{fmtTL(investResult.change)}</>
                  : <><TrendingDown className="w-5 h-5" /> {fmtTL(investResult.change)}</>
                }
              </div>

              <p className="text-slate-300 text-sm">
                {isRisky
                  ? (isWin
                    ? 'Riskli yatırım bu sefer çalıştı. Büyük bir kazanç elde ettin!'
                    : 'Riskli yatırım bu sefer ters gitti. Bir kısmını kaybettin.')
                  : chosenOpt.resultNote
                }
              </p>
            </motion.div>

            {/* Small info */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Başlangıç',   val: fmtTL(50000), color: 'text-slate-300' },
                { label: 'Değişim',     val: (isWin ? '+' : '') + fmtTL(investResult.change), color: isWin ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Sonuç',       val: fmtTL(finalAmount), color: isWin ? 'text-emerald-400' : 'text-red-400' },
              ].map(item => (
                <div key={item.label} className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                  <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                  <p className={`font-black text-base ${item.color}`}>{item.val}</p>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStage('crisis')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl text-base shadow-lg border-b-4 border-orange-800"
            >
              Son Senaryo <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </FuturePanels>
    );
  }

  // ── CRISIS ────────────────────────────────────────────────────────────────
  if (stage === 'crisis') {
    return (
      <FuturePanels>
        <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-600" />
          <div className="p-8">

            {/* Crisis header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-800/50 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <h2 className="text-white font-black text-xl">Beklenmeyen Durum: Karar Anı</h2>
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wider mt-0.5">Kriz Senaryosu</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Beklenmedik bir durumla karşılaştın. Ekonomideki dalgalanmalar nedeniyle
                gelirinde düşüş yaşandı. Artık eskisi kadar <strong className="text-white">kazanamıyorsun</strong> ve{' '}
                <strong className="text-white">giderlerini</strong> karşılamakta zorlanmaya başladın.
              </p>
              <p className="text-slate-400 text-sm mt-3">
                Bu durum birçok insan için <strong className="text-white">stresli</strong> olabilir.
                Ama bazıları için de <strong className="text-white">yeni bir başlangıç</strong> anlamına gelir.
              </p>
              <p className="text-white font-bold text-sm mt-4">
                🧭 Şimdi önemli olan şu: Bu duruma nasıl tepki vereceksin?
              </p>
            </motion.div>

            {/* Crisis options */}
            <div className="space-y-3">
              {CRISIS_OPTIONS.map((opt, i) => (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCrisisChoice(opt.id);
                    setScore(prev => prev + 10);
                    setStage('final');
                  }}
                  className={`w-full flex items-center gap-4 rounded-2xl px-6 py-5 border-2 text-left transition-all ${opt.bgBase} ${opt.bgHover} ${opt.borderCls}`}
                >
                  <span className="text-2xl shrink-0">{opt.dot}</span>
                  <span className="text-3xl shrink-0">{opt.icon}</span>
                  <div>
                    <p className="text-white font-black text-base">{opt.label}</p>
                    <p className={`text-xs mt-0.5 ${opt.textCls}`}>
                      {opt.id === 'guven' ? 'Güvenli' : opt.id === 'dengeli' ? 'Dengeli' : 'Riskli'} tercih
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </FuturePanels>
    );
  }

  // ── FINAL ─────────────────────────────────────────────────────────────────
  if (stage === 'final') {
    const crisisOpt = CRISIS_OPTIONS.find(o => o.id === crisisChoice)!;
    const profile   = calcProfile([careerChoice, investChoice, crisisChoice]);
    const prof      = PROFILES[profile];

    const choiceLabels: Record<RiskProfile, { label: string; color: string }> = {
      guven:   { label: 'Güven Odaklı', color: 'text-blue-400'   },
      dengeli: { label: 'Dengeli',      color: 'text-purple-400' },
      risk:    { label: 'Risk Odaklı',  color: 'text-orange-400' },
    };

    const steps = [
      { label: 'Kariyer',   choice: careerChoice,  detail: DOORS.find(d => d.id === careerChoice)?.label },
      { label: 'Yatırım',   choice: investChoice,  detail: INVEST_OPTIONS.find(o => o.id === investChoice)?.label },
      { label: 'Kriz',      choice: crisisChoice,  detail: CRISIS_OPTIONS.find(o => o.id === crisisChoice)?.label },
    ];

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-gradient-to-br ${prof.bgGrad} rounded-3xl border-2 ${prof.borderCls} shadow-2xl overflow-hidden`}>
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
          <div className="p-8">

            {/* Crisis feedback first */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 rounded-xl px-5 py-3 border mb-6 ${crisisOpt.bgBase} ${crisisOpt.borderCls}`}
            >
              <span className="text-xl">{crisisOpt.dot}</span>
              <p className={`font-bold text-sm ${crisisOpt.textCls}`}>
                {crisisOpt.feedback}
              </p>
            </motion.div>

            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-slate-900/70 rounded-3xl p-8 border border-slate-700 text-center mb-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
                className="text-7xl mb-4"
              >
                {prof.icon}
              </motion.div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Finansal Profilin</p>
              <h2 className={`text-4xl font-black mb-2 ${prof.color}`}>{prof.title}</h2>
              <p className="text-slate-300 text-sm italic mb-4">{prof.tagline}</p>

              <div className="inline-block bg-slate-800 border border-slate-700 rounded-2xl px-8 py-4 mb-4">
                <p className="text-4xl font-black text-white">{score} <span className="text-slate-500 text-lg font-normal">/ 30 puan</span></p>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto mb-4">{prof.desc}</p>

              {/* Advice box */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-5 py-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">💡 Kişisel Öneri</p>
                <p className="text-slate-200 text-sm leading-relaxed">{prof.advice}</p>
              </div>
            </motion.div>

            {/* Decision recap */}
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700 mb-6">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Kararlarının Özeti</p>
              <div className="space-y-3">
                {steps.map((s, i) => {
                  const cl = choiceLabels[s.choice as RiskProfile];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs font-black w-5">{i + 1}</span>
                        <div>
                          <p className="text-slate-400 text-xs">{s.label}</p>
                          <p className="text-white text-sm font-bold">{s.detail}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${cl.color}`}>{cl.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Replay */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onComplete?.(score);
                setStage('intro');
                setScore(0);
                setCareerChoice(null);
                setMicroAnswer(null);
                setInvestChoice(null);
                setInvestResult(null);
                setCrisisChoice(null);
                setDisplayTL(50000);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-base shadow-lg border-b-4 border-purple-800"
            >
              🔄 Tekrar Oyna
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
