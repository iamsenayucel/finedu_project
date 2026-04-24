import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskHunterProps {
  onComplete?: (score: number) => void;
}

// Her varlık için hedef aralıklar PDF'e göre tanımlandı
const SCENARIOS = [
  {
    id: 1,
    image: '/games/RiskHunter/1.png',
    correctDirection: 'Dalgalı',
    strategy: 'Dengeli dağılım',
    strategyLogic: 'Dalgalı piyasada tüm paranı tek yere koymazsın. Güvenli yerlere daha çok, riskli yerlere daha az koyarsın.',
    successMsg: 'Dengeli bir yatırım yaptın 💡\nDalgalı piyasada riski dağıtmak en doğru yaklaşımdır.',
    strategyDesc: 'Dalgalı piyasada her varlığa biraz koyulmalı; riskli olanlara az, güvenli olanlara biraz daha fazla.',
    targetRanges: {
      mevduat: { min: 20, max: 30 },
      altin:   { min: 20, max: 30 },
      tahvil:  { min: 15, max: 25 },
      hisse:   { min: 15, max: 25 },
      kripto:  { min: 5,  max: 15 },
    },
    exampleAlloc: { mevduat: 25, altin: 25, tahvil: 20, hisse: 20, kripto: 10 },
    commonMistakes: [
      'Paranın çoğunu kriptoya koymak → çok riskli',
      'Hepsini tek yere koymak',
      'Hiç risk almamak → kazanç fırsatını kaçırır',
    ],
  },
  {
    id: 2,
    image: '/games/RiskHunter/2.png',
    correctDirection: 'Durağan',
    strategy: 'Mevduat + Tahvil + Altın ağırlıklı',
    strategyLogic: 'Piyasa sakinse büyük risk almaya gerek yok. Daha güvenli yatırımlar ön planda olmalı.',
    successMsg: 'Doğru düşündün ✅\nDurağan piyasada güvenli ve dengeli yatırım yapmak en mantıklısıdır.',
    strategyDesc: 'Durağan piyasada ağırlık mevduat, tahvil ve altında olmalı; kripto ve hisse sınırlı tutulmalı.',
    targetRanges: {
      mevduat: { min: 30, max: 40 },
      tahvil:  { min: 20, max: 30 },
      altin:   { min: 15, max: 25 },
      hisse:   { min: 10, max: 20 },
      kripto:  { min: 0,  max: 10 },
    },
    exampleAlloc: { mevduat: 35, tahvil: 25, altin: 20, hisse: 15, kripto: 5 },
    commonMistakes: [
      'Kriptoya çok para koymak → gereksiz risk',
      'Hepsini hisseye koymak',
      'Hiç risk almamak → fırsat kaçırılır',
    ],
  },
  {
    id: 3,
    image: '/games/RiskHunter/3.png',
    correctDirection: 'Düşer',
    strategy: 'Mevduat + Altın ağırlıklı',
    strategyLogic: 'Piyasa düşerken amaç para kazanmak değil, önce parayı korumaktır.',
    successMsg: 'Doğru karar ✅\nDüşen piyasada riskten kaçınarak paranı korudun.',
    strategyDesc: 'Düşen piyasada ağırlık mevduat ve altında olmalı; hisse ve kripto çok az tutulmalı.',
    targetRanges: {
      mevduat: { min: 35, max: 45 },
      altin:   { min: 25, max: 35 },
      tahvil:  { min: 15, max: 25 },
      hisse:   { min: 5,  max: 15 },
      kripto:  { min: 0,  max: 5  },
    },
    exampleAlloc: { mevduat: 40, altin: 30, tahvil: 20, hisse: 7, kripto: 3 },
    commonMistakes: [
      'Hisseye çok para koymak → değer kaybedebilir',
      'Kriptoya yüklenmek → çok riskli',
      'Hepsini riskli yatırımlara koymak',
    ],
  },
  {
    id: 4,
    image: '/games/RiskHunter/4.png',
    correctDirection: 'Yükselir',
    strategy: 'Hisse + Kripto ağırlıklı',
    strategyLogic: 'Piyasa yükselirken fırsatlar artar. Daha fazla kazanmak için biraz daha risk alınabilir.',
    successMsg: 'İyi düşündün 🎯\nYükselen piyasada fırsatları değerlendirdin.',
    strategyDesc: 'Yükselen piyasada ağırlık hisse ve kriptoda olmalı; diğer varlıklar dengeli tutulmalı.',
    targetRanges: {
      hisse:   { min: 30, max: 40 },
      kripto:  { min: 10, max: 20 },
      altin:   { min: 10, max: 20 },
      mevduat: { min: 10, max: 20 },
      tahvil:  { min: 10, max: 20 },
    },
    exampleAlloc: { hisse: 35, kripto: 15, altin: 15, mevduat: 15, tahvil: 20 },
    commonMistakes: [
      'Tüm parayı güvenli yatırımlara koymak → fırsat kaçırılır',
      'Hepsini kriptoya koymak → çok riskli',
      'Tek bir yere yatırım yapmak',
    ],
  },
];

const DIRECTIONS = [
  { label: 'Yükselir', icon: '📈' },
  { label: 'Düşer', icon: '📉' },
  { label: 'Dalgalı', icon: '〰️' },
  { label: 'Durağan', icon: '➡️' },
];

const ASSETS = [
  { key: 'mevduat', label: 'Mevduat', icon: '🏦', barColor: 'bg-blue-500' },
  { key: 'altin', label: 'Altın', icon: '🥇', barColor: 'bg-yellow-500' },
  { key: 'hisse', label: 'Hisse', icon: '📈', barColor: 'bg-green-500' },
  { key: 'kripto', label: 'Kripto', icon: '₿', barColor: 'bg-purple-500' },
  { key: 'tahvil', label: 'Tahvil', icon: '📋', barColor: 'bg-orange-500' },
];

type Stage = 'intro' | 'direction' | 'allocation' | 'feedback' | 'finished';
type AllocMap = { [key: string]: number };

const INITIAL_ALLOC: AllocMap = { mevduat: 20, altin: 20, hisse: 20, kripto: 20, tahvil: 20 };

// Bir değerin [min, max] aralığında olup olmadığını kontrol eder
// Tolerans: aralığın ±5 dışında olursa "yakın" sayılmaz
function inRange(val: number, min: number, max: number): boolean {
  return val >= min && val <= max;
}
function nearRange(val: number, min: number, max: number): boolean {
  return val >= min - 5 && val <= max + 5;
}

function getAllocScore(alloc: AllocMap, scenario: typeof SCENARIOS[0]): number {
  const ranges = scenario.targetRanges as Record<string, { min: number; max: number }>;
  const keys = Object.keys(ranges);

  // Kaç varlık tam aralıkta?
  const exactCount = keys.filter(k => inRange(alloc[k] ?? 0, ranges[k].min, ranges[k].max)).length;
  // Kaç varlık ±5 toleranslı aralıkta?
  const nearCount = keys.filter(k => nearRange(alloc[k] ?? 0, ranges[k].min, ranges[k].max)).length;

  if (exactCount >= 4) return 10;   // 4-5 varlık tam aralıkta → mükemmel
  if (nearCount >= 4) return 10;    // 4-5 varlık yakın aralıkta → mükemmel
  if (exactCount >= 2) return 5;    // 2-3 varlık tam → orta
  if (nearCount >= 3) return 5;     // 3+ varlık yakın → orta
  return 0;
}

function getPerformance(score: number) {
  if (score >= 70) return { label: 'Mükemmel Portföy Yöneticisi', color: 'text-emerald-400', icon: '🏆' };
  if (score >= 50) return { label: 'İyi, ama gelişebilirsin', color: 'text-blue-400', icon: '👍' };
  if (score >= 30) return { label: 'Riskli Kararlar', color: 'text-yellow-400', icon: '⚠️' };
  return { label: 'Gelişime İhtiyaç Var', color: 'text-red-400', icon: '📚' };
}

export default function RiskHunter({ onComplete }: RiskHunterProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [alloc, setAlloc] = useState<AllocMap>(INITIAL_ALLOC);
  const [lastScenarioScore, setLastScenarioScore] = useState(0);

  const scenario = SCENARIOS[scenarioIndex];

  // Redistribute sliders — keep total at 100%
  const handleSlider = (changedKey: string, newValue: number) => {
    const otherKeys = ASSETS.map(a => a.key).filter(k => k !== changedKey);
    const remaining = 100 - newValue;
    const otherTotal = otherKeys.reduce((sum, k) => sum + alloc[k], 0);

    const next: AllocMap = { ...alloc, [changedKey]: newValue };

    if (otherTotal > 0) {
      let distributed = 0;
      otherKeys.forEach((k, i) => {
        if (i < otherKeys.length - 1) {
          const share = Math.round((alloc[k] / otherTotal) * remaining);
          next[k] = Math.max(0, share);
          distributed += share;
        } else {
          next[k] = Math.max(0, remaining - distributed);
        }
      });
    } else {
      const equal = Math.floor(remaining / otherKeys.length);
      otherKeys.forEach((k, i) => {
        next[k] = i === 0 ? remaining - equal * (otherKeys.length - 1) : equal;
      });
    }

    setAlloc(next);
  };

  const handleDirection = (dir: string) => {
    setSelectedDirection(dir);
    setStage('allocation');
  };

  const handleConfirm = () => {
    const dirPts = selectedDirection === scenario.correctDirection ? 10 : 0;
    const allocPts = getAllocScore(alloc, scenario);
    const earned = dirPts + allocPts;
    setLastScenarioScore(earned);
    setTotalScore(prev => prev + earned);
    setStage('feedback');
  };

  const handleNext = () => {
    if (scenarioIndex < SCENARIOS.length - 1) {
      setScenarioIndex(prev => prev + 1);
      setSelectedDirection(null);
      setAlloc(INITIAL_ALLOC);
      setStage('direction');
    } else {
      if (onComplete) onComplete(totalScore);
      setStage('finished');
    }
  };

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
        <img
          src="/games/RiskHunter/giris.png"
          alt="Risk Hunter Giriş"
          className="w-full object-cover"
        />
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2">Risk Hunter 🎯</h1>
          <p className="text-slate-300 mb-1">
            Haberleri analiz et, piyasa yönünü tahmin et, portföyünü dağıt.
          </p>
          <p className="text-slate-400 text-sm mb-6">
            100.000 TL bütçenle 4 senaryo seni bekliyor.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStage('direction')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg border-b-4 border-emerald-700"
          >
            OYUNA BAŞLA 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const perf = getPerformance(totalScore);
    const bands = [
      { label: 'Mükemmel', range: '70–80', color: 'bg-emerald-500', active: totalScore >= 70 },
      { label: 'İyi', range: '50–69', color: 'bg-blue-500', active: totalScore >= 50 && totalScore < 70 },
      { label: 'Riskli', range: '30–49', color: 'bg-yellow-500', active: totalScore >= 30 && totalScore < 50 },
      { label: 'Geliştir', range: '0–29', color: 'bg-red-500', active: totalScore < 30 },
    ];
    return (
      <div className="w-full max-w-4xl mx-auto p-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl text-center border border-slate-700">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-8xl mb-4"
        >
          {perf.icon}
        </motion.div>
        <h2 className="text-4xl font-black text-white mb-3">Görev Tamamlandı!</h2>
        <p className={`text-2xl font-bold mb-8 ${perf.color}`}>{perf.label}</p>
        <div className="inline-block bg-white text-slate-900 text-4xl font-black py-4 px-12 rounded-full shadow-xl mb-8">
          {totalScore} / 80 Puan
        </div>
        <div className="grid grid-cols-4 gap-3">
          {bands.map(b => (
            <div
              key={b.label}
              className={`p-3 rounded-xl text-white text-sm font-bold transition-opacity ${b.active ? b.color : 'bg-slate-700 opacity-40'}`}
            >
              <div>{b.label}</div>
              <div className="text-xs opacity-80 mt-0.5">{b.range} puan</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── SCENARIO WRAPPER ──────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">

      {/* Progress Header */}
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Senaryo</span>
          <div className="flex gap-1.5">
            {SCENARIOS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  i < scenarioIndex ? 'bg-emerald-500' : i === scenarioIndex ? 'bg-blue-400' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <span className="text-slate-300 font-bold text-sm">{scenarioIndex + 1} / {SCENARIOS.length}</span>
        </div>
        <div className="bg-emerald-900/60 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-black border border-emerald-700/60">
          💰 {totalScore} puan
        </div>
      </div>

      {/* Scenario Image */}
      <div className="relative">
        <img
          src={scenario.image}
          alt={`Senaryo ${scenario.id}`}
          className="w-full object-contain"
        />
        {stage === 'allocation' && selectedDirection && (
          <div className="absolute top-3 right-3 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
            Tahminin: <span className="text-blue-300">{selectedDirection}</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* ── DIRECTION ──────────────────────────────────────────────────── */}
        {stage === 'direction' && (
          <motion.div
            key="direction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6"
          >
            <h3 className="text-white font-bold text-lg mb-5 text-center">
              📰 Bu habere göre piyasa ne yönde hareket eder?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIRECTIONS.map(d => (
                <motion.button
                  key={d.label}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleDirection(d.label)}
                  className="bg-slate-700 hover:bg-blue-600 border border-slate-600 hover:border-blue-400 text-white font-bold py-5 rounded-2xl transition-all flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">{d.icon}</span>
                  <span>{d.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ALLOCATION ─────────────────────────────────────────────────── */}
        {stage === 'allocation' && (
          <motion.div
            key="allocation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6"
          >
            <h3 className="text-white font-bold text-lg text-center mb-1">
              💼 100.000 TL'yi nasıl dağıtırsın?
            </h3>
            <p className="text-slate-400 text-sm text-center mb-5">
              Kaydırıcıları kullanarak portföyünü oluştur
            </p>

            <div className="space-y-4 mb-5">
              {ASSETS.map(asset => (
                <div key={asset.key} className="flex items-center gap-3">
                  <div className="w-24 flex items-center gap-2 text-white font-bold text-sm flex-shrink-0">
                    <span className="text-lg">{asset.icon}</span>
                    <span>{asset.label}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={alloc[asset.key]}
                    onChange={e => handleSlider(asset.key, Number(e.target.value))}
                    className="flex-1 accent-emerald-400 cursor-pointer h-2"
                  />
                  <div className={`w-12 text-center text-white text-sm font-black px-2 py-1 rounded-lg flex-shrink-0 ${asset.barColor}`}>
                    {alloc[asset.key]}%
                  </div>
                  <div className="w-24 text-right text-slate-400 text-xs flex-shrink-0">
                    {(alloc[asset.key] * 1000).toLocaleString('tr-TR')} ₺
                  </div>
                </div>
              ))}
            </div>

            {/* Total indicator */}
            <div className="bg-slate-800 rounded-xl p-3 mb-4 flex justify-between items-center border border-slate-700">
              <span className="text-slate-300 text-sm font-medium">Toplam Dağılım</span>
              <span className={`font-black text-lg ${
                Object.values(alloc).reduce((a, b) => a + b, 0) === 100
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}>
                %{Object.values(alloc).reduce((a, b) => a + b, 0)}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-emerald-700 transition-all"
            >
              Kararımı Onayla ✅
            </motion.button>
          </motion.div>
        )}

        {/* ── FEEDBACK ───────────────────────────────────────────────────── */}
        {stage === 'feedback' && (() => {
          const dirPts = selectedDirection === scenario.correctDirection ? 10 : 0;
          const allocPts = getAllocScore(alloc, scenario);
          const ranges = scenario.targetRanges as Record<string, { min: number; max: number }>;

          return (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-4"
            >
              {/* Senaryo puan rozeti */}
              <div className="text-center">
                <div className="text-5xl mb-2">
                  {lastScenarioScore >= 15 ? '🎉' : lastScenarioScore >= 10 ? '👍' : '📚'}
                </div>
                <div className="inline-flex items-center gap-2 bg-slate-700 px-6 py-2.5 rounded-full text-white font-black text-lg border border-slate-600">
                  Bu senaryodan: +{lastScenarioScore} puan
                </div>
              </div>

              {/* Piyasa tahmini + portföy özeti */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border ${dirPts === 10 ? 'bg-emerald-900/50 border-emerald-600' : 'bg-red-900/50 border-red-600'}`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Piyasa Tahmini</div>
                  <div className="text-white text-sm mb-1">Seçimin: <span className="font-bold text-blue-300">{selectedDirection}</span></div>
                  <div className="text-white text-sm mb-2">Doğrusu: <span className="font-bold text-emerald-300">{scenario.correctDirection}</span></div>
                  <div className={`text-sm font-black ${dirPts === 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dirPts === 10 ? '+10 puan ✅' : '0 puan ❌'}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${allocPts === 10 ? 'bg-emerald-900/50 border-emerald-600' : allocPts === 5 ? 'bg-yellow-900/50 border-yellow-600' : 'bg-red-900/50 border-red-600'}`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Portföy Dağılımı</div>
                  <div className="text-slate-300 text-sm mb-1">Strateji: <span className="text-yellow-300 font-bold">{scenario.strategy}</span></div>
                  <div className={`text-sm font-black ${allocPts === 10 ? 'text-emerald-400' : allocPts === 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    +{allocPts} puan {allocPts === 10 ? '✅' : allocPts === 5 ? '〽️' : '❌'}
                  </div>
                </div>
              </div>

              {/* Doğru mantık açıklaması */}
              <div className="bg-blue-900/40 border border-blue-700/50 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">💡 Doğru Mantık</div>
                <p className="text-blue-100 text-sm leading-relaxed">{scenario.strategyLogic}</p>
              </div>

              {/* Öğrencinin dağılımı vs hedef aralıklar */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">📊 Dağılım Analizi</div>
                <div className="space-y-2">
                  {ASSETS.map(asset => {
                    const range = ranges[asset.key];
                    const val = alloc[asset.key] ?? 0;
                    const ok = inRange(val, range.min, range.max);
                    const near = !ok && nearRange(val, range.min, range.max);
                    return (
                      <div key={asset.key} className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-slate-300 font-medium flex items-center gap-1">
                          {asset.icon} {asset.label}
                        </span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-400' : near ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className={`w-8 text-right font-bold ${ok ? 'text-emerald-400' : near ? 'text-yellow-400' : 'text-red-400'}`}>
                          {val}%
                        </span>
                        <span className="text-slate-500 text-xs w-16 text-right">
                          hedef: {range.min}–{range.max}%
                        </span>
                        <span>{ok ? '✅' : near ? '〽️' : '❌'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Örnek doğru dağılım */}
              {allocPts < 10 && (
                <div className="bg-slate-800/40 border border-slate-600 rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">🎯 Örnek Doğru Dağılım</div>
                  <div className="flex flex-wrap gap-2">
                    {ASSETS.map(asset => (
                      <div key={asset.key} className="bg-slate-700 px-3 py-1.5 rounded-lg text-sm">
                        <span className="text-slate-300">{asset.icon} {asset.label}: </span>
                        <span className="text-emerald-300 font-bold">%{(scenario.exampleAlloc as Record<string,number>)[asset.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yaygın hatalar */}
              {allocPts < 10 && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">⚠️ Sık Yapılan Hatalar</div>
                  <ul className="space-y-1">
                    {(scenario.commonMistakes as string[]).map((m, i) => (
                      <li key={i} className="text-red-300 text-xs flex items-start gap-2">
                        <span className="mt-0.5">•</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-blue-800 transition-all"
              >
                {scenarioIndex < SCENARIOS.length - 1 ? 'Sonraki Senaryo ➔' : 'Sonuçları Gör 🏆'}
              </motion.button>
            </motion.div>
          );
        })()}

      </AnimatePresence>
    </div>
  );
}
