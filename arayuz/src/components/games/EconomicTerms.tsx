import { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';

interface EconomicTermsProps {
  onComplete?: (score: number) => void;
}

const ITEM_TYPE = 'TERM';

// ─── VERİ ─────────────────────────────────────────────────────────────────────

const PAIRS = [
  {
    id: 1,
    term: 'Tasarruf',
    definition: 'Gelirin bir kısmını gelecekte kullanmak üzere biriktirmektir.',
    emoji: '🐷',
    color: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 2,
    term: 'Maaş',
    definition: 'Yapılan iş karşılığında düzenli olarak kazanılan paradır.',
    emoji: '💵',
    color: 'from-blue-500 to-indigo-500',
    light: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    id: 3,
    term: 'Şirket',
    definition: 'Üretim yaparak kazanç sağlar ve çalışanlarına maaş öder.',
    emoji: '🏢',
    color: 'from-violet-500 to-purple-500',
    light: 'bg-violet-50 border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    id: 4,
    term: 'Banka',
    definition: 'Paranın güvenli bir şekilde saklanmasını sağlar ve ihtiyaç olduğunda kredi desteği sunar.',
    emoji: '🏦',
    color: 'from-sky-500 to-cyan-500',
    light: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
  },
  {
    id: 5,
    term: 'Vergi',
    definition: 'Kazanılan gelirin belirli bir kısmının devlete aktarılmasıdır.',
    emoji: '🧾',
    color: 'from-orange-500 to-amber-500',
    light: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
  },
  {
    id: 6,
    term: 'Harcama',
    definition: 'İhtiyaç ve istekler için para harcama sürecidir.',
    emoji: '🛍️',
    color: 'from-pink-500 to-rose-500',
    light: 'bg-pink-50 border-pink-200',
    badge: 'bg-pink-100 text-pink-700',
  },
  {
    id: 7,
    term: 'Birey',
    definition: 'Çalışarak gelir elde eden ve harcama yapan kişidir.',
    emoji: '🧑',
    color: 'from-yellow-500 to-orange-400',
    light: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 8,
    term: 'Devlet',
    definition: 'Toplum için hizmet sunar ve bu hizmetleri finanse etmek için vergi toplar.',
    emoji: '🏛️',
    color: 'from-slate-600 to-slate-500',
    light: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-700',
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const MAX_SCORE = PAIRS.length * 10;

// ─── SÜRÜKLENEBILIR KAVRAM KARTI ──────────────────────────────────────────────

function TermCard({ pair, placed }: { pair: typeof PAIRS[0]; placed: boolean }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { id: pair.id },
      canDrag: !placed,
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [placed]
  );

  return (
    <motion.div
      ref={drag as any}
      layout
      style={{ opacity: isDragging ? 0.2 : 1 }}
      whileHover={placed ? {} : { scale: 1.05, y: -3 }}
      className={`
        select-none rounded-2xl border-2 px-4 py-3 flex items-center gap-3 transition-all
        ${placed
          ? 'border-slate-200 bg-white opacity-40 cursor-default'
          : `bg-gradient-to-r ${pair.color} border-transparent shadow-lg cursor-grab active:cursor-grabbing`
        }
      `}
    >
      <span className="text-2xl leading-none">{pair.emoji}</span>
      <span className={`font-black text-sm leading-tight ${placed ? 'text-slate-400' : 'text-white'}`}>
        {pair.term}
      </span>
      {placed && <span className="ml-auto text-slate-300 text-xs">✓</span>}
    </motion.div>
  );
}

// ─── TANIM KUTUSU (DROP ZONE) ─────────────────────────────────────────────────

interface DefinitionBoxProps {
  pair: typeof PAIRS[0];
  droppedTermId: number | null;
  onDrop: (termId: number, defId: number) => void;
  onRemove: (defId: number) => void;
  validationState: 'idle' | 'correct' | 'wrong';
}

function DefinitionBox({ pair, droppedTermId, onDrop, onRemove, validationState }: DefinitionBoxProps) {
  const droppedPair = droppedTermId !== null ? PAIRS.find(p => p.id === droppedTermId) : null;
  const isEmpty = droppedTermId === null;

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      canDrop: () => isEmpty,
      drop: (dragged: { id: number }) => onDrop(dragged.id, pair.id),
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [isEmpty, onDrop, pair.id]
  );

  const isActive = isOver && canDrop;

  return (
    <motion.div
      ref={drop as any}
      layout
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-200 min-h-[100px] flex flex-col gap-3
        ${isEmpty && !isActive ? 'border-dashed border-slate-300 bg-white' : ''}
        ${isActive ? 'border-indigo-400 bg-indigo-50 scale-[1.02] shadow-md' : ''}
        ${!isEmpty && validationState === 'idle' ? `${pair.light} border-2` : ''}
        ${validationState === 'correct' ? 'border-emerald-400 bg-emerald-50' : ''}
        ${validationState === 'wrong' ? 'border-red-400 bg-red-50' : ''}
      `}
    >
      {/* Tanım metni */}
      <p className={`text-sm leading-relaxed font-medium ${isEmpty ? 'text-slate-500' : 'text-slate-700'}`}>
        {pair.definition}
      </p>

      {/* Bırakılan kavram */}
      {!isEmpty && droppedPair && (
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${droppedPair.badge} font-black text-sm`}>
            <span>{droppedPair.emoji}</span>
            <span>{droppedPair.term}</span>
          </div>
          <div className="flex items-center gap-2">
            {validationState === 'correct' && <span className="text-emerald-500 font-black text-lg">✅</span>}
            {validationState === 'wrong'   && <span className="text-red-500 font-black text-lg">❌</span>}
            {validationState === 'idle' && (
              <button
                onClick={() => onRemove(pair.id)}
                className="text-slate-300 hover:text-red-400 font-black text-sm w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center transition-all"
              >✕</button>
            )}
          </div>
        </div>
      )}

      {/* Boşken ipucu */}
      {isEmpty && (
        <div className={`text-xs font-bold transition-all ${isActive ? 'text-indigo-500' : 'text-slate-300'}`}>
          {isActive ? '👆 Bırak!' : 'Kavramı buraya sürükle...'}
        </div>
      )}
    </motion.div>
  );
}

// ─── Yan panel verisi ─────────────────────────────────────────────────────────
const ECONOMIC_PANEL = {
  dictionary: [
    { term: 'Bütçe', def: 'Gelirlerin ve giderlerin önceden planlanmasıdır. Paranın nereye gittiğini merak etmek yerine, ona nereye gideceğini söylemektir.' },
    { term: 'Brüt / Net Kazanç', def: 'Brüt, vergiler kesilmeden önceki büyük rakamdır. Net ise vergiler ödendikten sonra senin cebine giren temiz paradır.' },
    { term: 'Enflasyon', def: 'Piyasada satılan ürün ve hizmetlerin fiyatlarının sürekli artmasıdır. Tasarruf ettiğin paranın alım gücü durduğu yerde erir.' },
    { term: 'Yatırım', def: 'Parayı enflasyona karşı korumak ve büyütmek için finansal araçlarda (hisse, fon vb.) değerlendirme işidir.' },
  ],
  strategyTitle: 'Eşleştirme Rehberi',
  institutions: [
    { term: 'Birey', def: 'Sistemi başlatan ana karakterdir. Hem çalışıp kazanır hem de o parayı harcar.' },
    { term: 'Şirket', def: 'Ürün/hizmet geliştirir, para kazanır ve seni işe alarak ödeme yapar.' },
    { term: 'Banka', def: 'Paran için güvenli bir saklama alanı ve ihtiyaç anında borç (kredi) merkezidir.' },
    { term: 'Devlet', def: 'Topluma yol, okul, hastane gibi hizmetler sunan ve bunları fonlayan otoritedir.' },
  ],
  movements: [
    { term: 'Maaş', def: 'Harcadığın emeğin ve zamanının karşılığında sana ödenen düzenli ücrettir.' },
    { term: 'Harcama', def: 'İhtiyaçlarını veya arzularını karşılamak için paranın senden çıkış anıdır.' },
    { term: 'Tasarruf', def: 'Kazancının hepsini tüketmeyip, yarına hazırlık için kenara ayırmaktır.' },
    { term: 'Vergi', def: 'Toplum hizmetlerinin sürebilmesi için, kazancından yetkili otoriteye verilen yasal paydır.' },
  ],
};

// ─── ANA BİLEŞEN ──────────────────────────────────────────────────────────────

export default function EconomicTerms({ onComplete }: EconomicTermsProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [leavingIntro, setLeavingIntro] = useState(false);
  const [shuffledTerms] = useState(() => shuffle(PAIRS));
  const [shuffledDefs] = useState(() => shuffle(PAIRS));
  // defId → termId eşleşmesi
  const [matches, setMatches] = useState<Record<number, number | null>>(
    () => Object.fromEntries(PAIRS.map(p => [p.id, null]))
  );
  const [validation, setValidation] = useState<Record<number, 'idle' | 'correct' | 'wrong'>>(
    () => Object.fromEntries(PAIRS.map(p => [p.id, 'idle']))
  );
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const placedTermIds = Object.values(matches).filter(v => v !== null) as number[];
  const allPlaced = placedTermIds.length === PAIRS.length;
  const correctCount = Object.values(validation).filter(v => v === 'correct').length;

  const handleDrop = useCallback((termId: number, defId: number) => {
    setMatches(prev => {
      const next = { ...prev };
      // Eğer bu kavram başka bir tanımda zaten varsa, oradan kaldır
      Object.keys(next).forEach(key => {
        if (next[Number(key)] === termId) next[Number(key)] = null;
      });
      next[defId] = termId;
      return next;
    });
    setChecked(false);
    setValidation(Object.fromEntries(PAIRS.map(p => [p.id, 'idle'])));
  }, []);

  const handleRemove = useCallback((defId: number) => {
    setMatches(prev => ({ ...prev, [defId]: null }));
    setChecked(false);
    setValidation(Object.fromEntries(PAIRS.map(p => [p.id, 'idle'])));
  }, []);

  const checkAnswers = () => {
    let correct = 0;
    const newVal: Record<number, 'idle' | 'correct' | 'wrong'> = {};
    PAIRS.forEach(pair => {
      const dropped = matches[pair.id];
      if (dropped === null) { newVal[pair.id] = 'idle'; return; }
      if (dropped === pair.id) { newVal[pair.id] = 'correct'; correct++; }
      else newVal[pair.id] = 'wrong';
    });
    setValidation(newVal);
    setChecked(true);
    const finalScore = correct * 10;
    setScore(finalScore);
    if (correct === PAIRS.length) {
      setTimeout(() => { setStage('finished'); if (onComplete) onComplete(finalScore); }, 1000);
    }
  };

  const finishGame = () => {
    setStage('finished');
    if (onComplete) onComplete(score);
  };

  const restart = () => {
    setStage('intro');
    setMatches(Object.fromEntries(PAIRS.map(p => [p.id, null])));
    setValidation(Object.fromEntries(PAIRS.map(p => [p.id, 'idle'])));
    setChecked(false);
    setScore(0);
  };

  // ── GİRİŞ: büyük sözlük + strateji inceleme ekranı ──────────────────────────
  if (stage === 'intro') {
    const startGame = () => {
      setLeavingIntro(true);
      setTimeout(() => setStage('playing'), 380);
    };
    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Kompakt başlık */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-1">💡 Ekonomi Terimleri</h1>
          <p className="text-muted-foreground text-sm">
            Oyuna geçmeden önce sözlüğü ve rehberi incele · 8 terim · Her doğru eşleşme 10 puan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Sol: Ekonomi Sözlüğü (büyük) */}
          <AnimatePresence>
            {!leavingIntro && (
              <motion.div
                key="dict"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
                style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
              >
                <div className="px-5 py-4 border-b border-cyan-800/40">
                  <div className="text-cyan-400 text-base font-black uppercase tracking-widest">📖 Ekonomi Sözlüğü</div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
                  {ECONOMIC_PANEL.dictionary.map((item, i) => (
                    <div key={i}>
                      <div className="text-base font-bold text-cyan-300 mb-1.5">{item.term}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{item.def}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sağ: Eşleştirme Rehberi (büyük) */}
          <AnimatePresence>
            {!leavingIntro && (
              <motion.div
                key="strat"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 80 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
                style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
              >
                <div className="px-5 py-4 border-b border-amber-800/40">
                  <div className="text-amber-400 text-base font-black uppercase tracking-widest">🎯 {ECONOMIC_PANEL.strategyTitle}</div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
                  <div className="text-amber-400 text-sm font-semibold">Kurumlar ve Kişiler</div>
                  {ECONOMIC_PANEL.institutions.map((item, i) => (
                    <div key={i}>
                      <div className="text-base font-bold text-amber-300 mb-1.5">{item.term}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{item.def}</div>
                    </div>
                  ))}
                  <div className="border-t border-amber-900/30 my-1" />
                  <div className="text-amber-400 text-sm font-semibold">Paranın Hareketleri</div>
                  {ECONOMIC_PANEL.movements.map((item, i) => (
                    <div key={i}>
                      <div className="text-base font-bold text-amber-300 mb-1.5">{item.term}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{item.def}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!leavingIntro && (
          <div className="flex justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl py-4 px-12 rounded-full shadow-2xl transition-colors">
              OYUNA GEÇ 🚀
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  // ── BİTİŞ ──────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const pct = Math.round((score / MAX_SCORE) * 100);
    const perf = pct === 100
      ? { icon: '🏆', title: 'Ekonomi Dahisi!', sub: 'Tüm kavramları mükemmel eşleştirdin!', grad: 'from-yellow-500 to-amber-400' }
      : pct >= 75
      ? { icon: '🌟', title: 'Harika İş!', sub: 'Ekonomiyi çok iyi biliyorsun.', grad: 'from-indigo-600 to-violet-500' }
      : pct >= 50
      ? { icon: '👍', title: 'İyi Başlangıç!', sub: 'Biraz daha pratik yaparak ustalaşırsın.', grad: 'from-blue-600 to-cyan-500' }
      : { icon: '📚', title: 'Öğrenmeye Devam!', sub: 'Her deneme seni bir adım ileriye taşır.', grad: 'from-slate-600 to-slate-500' };

    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`bg-gradient-to-br ${perf.grad} rounded-3xl p-10 text-center shadow-2xl`}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="text-7xl mb-4">{perf.icon}</motion.div>
          <h2 className="text-3xl font-black text-white mb-2">{perf.title}</h2>
          <p className="text-white/80 mb-6">{perf.sub}</p>
          <div className="inline-flex flex-col items-center bg-black/20 rounded-2xl px-8 py-4 mb-6">
            <span className="text-5xl font-black text-white">{score}</span>
            <span className="text-white/60 text-sm font-bold">/ {MAX_SCORE} puan</span>
          </div>
          <div className="w-full max-w-xs mx-auto bg-black/20 rounded-full h-3 mb-8">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-3 rounded-full bg-white/70" />
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={restart}
            className="bg-white/20 hover:bg-white/30 text-white font-black py-3 px-10 rounded-full border-2 border-white/30 text-lg backdrop-blur">
            Tekrar Oyna 🔄
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── OYUN ───────────────────────────────────────────────────────────────────
  return (
    <DndProvider backend={HTML5Backend}>
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
              {ECONOMIC_PANEL.dictionary.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-cyan-300 mb-1.5">{item.term}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <span className="text-white font-black text-base">Ekonomi Terimleri</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-indigo-200 text-xs font-bold">
              {placedTermIds.length} / {PAIRS.length} eşleştirildi
            </span>
            {checked && (
              <div className={`text-xs font-black px-3 py-1 rounded-full ${
                correctCount === PAIRS.length ? 'bg-emerald-400 text-emerald-900' : 'bg-yellow-400 text-yellow-900'
              }`}>
                {correctCount} / {PAIRS.length} doğru
              </div>
            )}
            <div className="flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/40 px-3 py-1 rounded-full">
              <span className="text-yellow-300 text-sm">⭐</span>
              <span className="text-yellow-200 font-black text-sm">{score}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* SOL: Kavram Kartları */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3">
              <h3 className="text-white font-black text-sm flex items-center gap-2">
                <span>🃏</span> Kavramlar
              </h3>
              <p className="text-indigo-200 text-xs mt-0.5">Doğru tanıma sürükle ve bırak</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {shuffledTerms.map(pair => (
                <TermCard key={pair.id} pair={pair} placed={placedTermIds.includes(pair.id)} />
              ))}
            </div>
          </div>

          {/* SAĞ: Tanım Kutuları */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shuffledDefs.map(pair => (
                <DefinitionBox
                  key={pair.id}
                  pair={pair}
                  droppedTermId={matches[pair.id]}
                  onDrop={handleDrop}
                  onRemove={handleRemove}
                  validationState={validation[pair.id]}
                />
              ))}
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={checkAnswers}
                disabled={!allPlaced || checked}
                className={`flex-1 font-black py-3 px-6 rounded-xl shadow text-base transition-all border-b-4 ${
                  allPlaced && !checked
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-800 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                }`}>
                {!allPlaced
                  ? `${PAIRS.length - placedTermIds.length} kavram kaldı...`
                  : checked
                  ? `${correctCount}/${PAIRS.length} Doğru ✓`
                  : '🔍 Cevapları Kontrol Et'}
              </motion.button>

              {checked && correctCount < PAIRS.length && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={finishGame}
                  className="font-black py-3 px-5 rounded-xl shadow text-base bg-emerald-600 hover:bg-emerald-500 text-white border-b-4 border-emerald-800 cursor-pointer">
                  Bitir 🏁
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={restart}
                className="bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-5 rounded-xl shadow border-2 border-slate-200 text-sm">
                🔄 Sıfırla
              </motion.button>
            </div>

            {/* Geri bildirim */}
            <AnimatePresence>
              {checked && correctCount < PAIRS.length && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold text-center">
                  ❌ işaretli tanımları düzelt ve tekrar dene! ({correctCount}/{PAIRS.length} doğru)
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-amber-800/40">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 {ECONOMIC_PANEL.strategyTitle}</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3">
              <div className="text-amber-400 text-xs font-semibold mb-0.5">Kurumlar ve Kişiler</div>
              {ECONOMIC_PANEL.institutions.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-amber-300 mb-1.5">{item.term}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
              <div className="border-t border-amber-900/30 my-1" />
              <div className="text-amber-400 text-xs font-semibold mb-0.5">Paranın Hareketleri</div>
              {ECONOMIC_PANEL.movements.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-amber-300 mb-1.5">{item.term}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      </div>
    </DndProvider>
  );
}
