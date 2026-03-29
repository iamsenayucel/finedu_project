import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskHunterProps {
  onComplete?: (score: number) => void;
}

const SCENARIOS = [
  {
    id: 1,
    image: '/games/RiskHunter/1.png',
    correctDirection: 'Yükselir',
    strategy: 'Hisse ağırlıklı',
    strategyKeys: ['hisse'],
    strategyDesc: 'Yükselen piyasada hisse senedi en yüksek getiriyi sunar.',
    isBalanced: false,
  },
  {
    id: 2,
    image: '/games/RiskHunter/2.png',
    correctDirection: 'Düşer',
    strategy: 'Altın + Mevduat ağırlıklı',
    strategyKeys: ['altin', 'mevduat'],
    strategyDesc: 'Düşen piyasada güvenli liman varlıkları sermayeni korur.',
    isBalanced: false,
  },
  {
    id: 3,
    image: '/games/RiskHunter/3.png',
    correctDirection: 'Dalgalı',
    strategy: 'Dengeli dağılım',
    strategyKeys: ['mevduat', 'altin', 'hisse', 'kripto', 'tahvil'],
    strategyDesc: 'Dalgalı piyasada dengeli dağılım riski minimize eder.',
    isBalanced: true,
  },
  {
    id: 4,
    image: '/games/RiskHunter/4.png',
    correctDirection: 'Durağan',
    strategy: 'Mevduat + Tahvil ağırlıklı',
    strategyKeys: ['mevduat', 'tahvil'],
    strategyDesc: 'Durağan piyasada sabit getirili ürünler en güvenli seçimdir.',
    isBalanced: false,
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

function getAllocScore(alloc: AllocMap, scenario: typeof SCENARIOS[0]): number {
  if (scenario.isBalanced) {
    const max = Math.max(...Object.values(alloc));
    if (max <= 30) return 10;
    if (max <= 45) return 5;
    return 0;
  }
  const primaryTotal = scenario.strategyKeys.reduce((sum, k) => sum + (alloc[k] ?? 0), 0);
  if (primaryTotal >= 50) return 10;
  if (primaryTotal >= 30) return 5;
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
          className="w-full object-cover max-h-72"
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
          return (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Scenario score badge */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">
                  {lastScenarioScore >= 15 ? '🎉' : lastScenarioScore >= 10 ? '👍' : '📚'}
                </div>
                <div className="inline-flex items-center gap-2 bg-slate-700 px-6 py-3 rounded-full text-white font-black text-xl border border-slate-600">
                  Bu senaryodan: +{lastScenarioScore} puan
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Direction card */}
                <div className={`p-4 rounded-2xl border ${
                  dirPts === 10
                    ? 'bg-emerald-900/50 border-emerald-600'
                    : 'bg-red-900/50 border-red-600'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Piyasa Tahmini
                  </div>
                  <div className="text-white text-sm mb-1">
                    Seçimin: <span className="font-bold text-blue-300">{selectedDirection}</span>
                  </div>
                  <div className="text-white text-sm mb-2">
                    Doğrusu: <span className="font-bold text-emerald-300">{scenario.correctDirection}</span>
                  </div>
                  <div className={`text-sm font-black ${dirPts === 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dirPts === 10 ? '+10 puan ✅' : '0 puan ❌'}
                  </div>
                </div>

                {/* Allocation card */}
                <div className={`p-4 rounded-2xl border ${
                  allocPts === 10
                    ? 'bg-emerald-900/50 border-emerald-600'
                    : allocPts === 5
                    ? 'bg-yellow-900/50 border-yellow-600'
                    : 'bg-red-900/50 border-red-600'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Portföy Dağılımı
                  </div>
                  <div className="text-slate-300 text-sm mb-1">
                    Önerilen: <span className="text-yellow-300 font-bold">{scenario.strategy}</span>
                  </div>
                  <div className="text-slate-400 text-xs mb-2">{scenario.strategyDesc}</div>
                  <div className={`text-sm font-black ${
                    allocPts === 10 ? 'text-emerald-400' : allocPts === 5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    +{allocPts} puan {allocPts === 10 ? '✅' : allocPts === 5 ? '〽️' : '❌'}
                  </div>
                </div>
              </div>

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
