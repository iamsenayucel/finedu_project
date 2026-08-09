import { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';

interface EconomicGlossaryProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const ITEM_TYPE = 'GLOSSARY_TERM';

// ─── VERİ ─────────────────────────────────────────────────────────────────────

const PAIRS = [
  {
    id: 1,
    term: 'Kredi',
    definition: 'Bir hayalini gerçekleştirmek veya ihtiyacını karşılamak için bankadan aldığın, daha sonra üzerine faiz eklenerek geri ödemen gereken borç para.',
    emoji: '💳',
    color: 'from-rose-500 to-red-500',
  },
  {
    id: 2,
    term: 'Banka',
    definition: 'Paranı güvenli bir şekilde saklayan ve ihtiyacı olan kişi veya kurumlara borç olarak veren finansal kurum.',
    emoji: '🏦',
    color: 'from-sky-500 to-cyan-500',
  },
  {
    id: 3,
    term: 'Bütçe',
    definition: 'Elindeki paranın nereye harcanacağını önceden planlamanı sağlayan ve gelir ile giderlerini kontrol altında tutmana yardımcı olan plan.',
    emoji: '📝',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 4,
    term: 'Kredi Notu',
    definition: 'Geçmişte borçlarını zamanında ödeyip ödemediğine göre hesaplanan ve bankaların sana finansal açıdan ne kadar güvenebileceğini gösteren puan.',
    emoji: '⭐',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 5,
    term: 'Hazine',
    definition: 'Devletin yol, hastane ve okul gibi kamu hizmetlerini gerçekleştirebilmesi için gerekli olan paranın toplandığı ve yönetildiği yer.',
    emoji: '🏛️',
    color: 'from-slate-600 to-slate-500',
  },
  {
    id: 6,
    term: 'Aracı Kurum',
    definition: 'Borsada yatırımcıların adına hisse senedi gibi yatırım araçlarının alım ve satımını gerçekleştirmeye yardımcı olan, yetkilendirilmiş kurum. Diğer adı Broker.',
    emoji: '🧑‍💼',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 7,
    term: 'Yatırım',
    definition: 'Elindeki parayı zaman içerisinde büyütmek, daha fazla gelir elde etmek veya değerini korumak amacıyla değerlendirme işlemi.',
    emoji: '📈',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 8,
    term: 'Maaş',
    definition: 'Bir kişinin çalışması ve emek vermesi karşılığında işvereninden düzenli olarak aldığı para.',
    emoji: '💵',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 9,
    term: 'Vergi',
    definition: 'Devletin park, yol, okul ve hastane gibi kamu hizmetlerini gerçekleştirebilmesi için vatandaşların kazançlarından devlete verdikleri zorunlu pay.',
    emoji: '🧾',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 10,
    term: 'Net Maaş',
    definition: 'Çalışanın kazancından vergi ve sigorta gibi kesintiler çıkarıldıktan sonra kişinin eline geçen ve kullanabileceği para.',
    emoji: '💰',
    color: 'from-pink-500 to-rose-500',
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const TOTAL = PAIRS.length;
const MAX_SCORE = TOTAL * 10;

// ─── SÜRÜKLENEBİLİR KAVRAM KUTUCUĞU ────────────────────────────────────────────

function TermBox({ pair }: { pair: (typeof PAIRS)[number] }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { id: pair.id },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [pair.id]
  );

  return (
    <motion.div
      ref={drag as any}
      layout
      style={{ opacity: isDragging ? 0.25 : 1 }}
      whileHover={{ scale: 1.05, y: -3 }}
      className={`select-none rounded-xl border-2 border-transparent bg-gradient-to-r ${pair.color} shadow-lg px-4 py-3 flex items-center gap-2 cursor-grab active:cursor-grabbing`}
    >
      <span className="text-xl leading-none">{pair.emoji}</span>
      <span className="font-black text-sm text-white uppercase tracking-wide">{pair.term}</span>
    </motion.div>
  );
}

// ─── TANIM KUTUSU (DROP ZONE) ───────────────────────────────────────────────────

interface DefinitionSlotProps {
  pair: (typeof PAIRS)[number];
  isMatched: boolean;
  isWrongFlash: boolean;
  onDrop: (termId: number, defId: number) => void;
}

function DefinitionSlot({ pair, isMatched, isWrongFlash, onDrop }: DefinitionSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      canDrop: () => !isMatched,
      drop: (dragged: { id: number }) => onDrop(dragged.id, pair.id),
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [isMatched, onDrop, pair.id]
  );

  const isActive = isOver && canDrop;

  return (
    <motion.div
      ref={drop as any}
      layout
      animate={isWrongFlash ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-colors min-h-[128px] ${
        isMatched
          ? 'border-emerald-400 bg-emerald-50'
          : isWrongFlash
          ? 'border-red-400 bg-red-50'
          : isActive
          ? 'border-indigo-400 bg-indigo-50 scale-[1.02] shadow-md'
          : 'border-dashed border-slate-300 bg-white'
      }`}
    >
      <p className="text-sm leading-relaxed font-medium text-slate-700">{pair.definition}</p>

      {isMatched ? (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${pair.color} font-black text-sm text-white w-fit`}>
          <span>{pair.emoji}</span>
          <span>{pair.term}</span>
          <span className="ml-1 text-emerald-100">✓</span>
        </div>
      ) : (
        <div className={`text-xs font-bold ${isActive ? 'text-indigo-500' : isWrongFlash ? 'text-red-500' : 'text-slate-300'}`}>
          {isWrongFlash ? '❌ Yanlış, tekrar dene!' : isActive ? '👆 Bırak!' : 'Kavramı buraya sürükle...'}
        </div>
      )}
    </motion.div>
  );
}

// ─── ANA BİLEŞEN ────────────────────────────────────────────────────────────────

export default function EconomicGlossary({ onComplete, onBack }: EconomicGlossaryProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [poolOrder, setPoolOrder] = useState(() => shuffle(PAIRS.map((p) => p.id)));
  const [matched, setMatched] = useState<Record<number, boolean>>(
    () => Object.fromEntries(PAIRS.map((p) => [p.id, false]))
  );
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongFlashDefId, setWrongFlashDefId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const correctCount = Object.values(matched).filter(Boolean).length;
  const pool = poolOrder.filter((id) => !matched[id]);
  const score = correctCount * 10;

  const handleDrop = useCallback(
    (termId: number, defId: number) => {
      if (termId === defId) {
        setMatched((prev) => {
          const next = { ...prev, [termId]: true };
          const doneCount = Object.values(next).filter(Boolean).length;
          if (doneCount === TOTAL) {
            setTimeout(() => {
              setStage('finished');
              if (onComplete) onComplete(TOTAL * 10);
            }, 400);
          }
          return next;
        });
      } else {
        setWrongCount((w) => w + 1);
        setWrongFlashDefId(defId);
        setToast('😅 Yanlış eşleştirme, tekrar dene!');
        setTimeout(() => setWrongFlashDefId(null), 600);
        setTimeout(() => setToast(null), 1400);
      }
    },
    [onComplete]
  );

  const restart = () => {
    setStage('intro');
    setPoolOrder(shuffle(PAIRS.map((p) => p.id)));
    setMatched(Object.fromEntries(PAIRS.map((p) => [p.id, false])));
    setWrongCount(0);
    setWrongFlashDefId(null);
    setToast(null);
  };

  // ── GİRİŞ ──────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Ekonomi Sözlüğü</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-6">
              10 finansal kavram, 10 tanım! Kavram kutucuklarını doğru tanımın üzerine sürükleyip bırak.
              Doğru eşleştirmeler kilitlenir, yanlışlar havuza geri döner. Hepsini doğru eşleştirebilecek misin?
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStage('playing')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg py-4 px-10 rounded-full shadow-xl border-b-4 border-purple-800 transition-all"
            >
              Oyuna Başla 🚀
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── BİTİŞ ──────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const totalAttempts = TOTAL + wrongCount;
    const accuracy = Math.round((TOTAL / totalAttempts) * 100);
    const perf =
      wrongCount === 0
        ? { icon: '🏆', title: 'Sözlük Ustası!', sub: 'Tek bir yanlış bile yapmadan tamamladın!', grad: 'from-yellow-500 to-amber-400' }
        : wrongCount <= 3
        ? { icon: '🌟', title: 'Harika İş!', sub: 'Ekonomi kavramlarına çok hakimsin.', grad: 'from-indigo-600 to-violet-500' }
        : wrongCount <= 6
        ? { icon: '👍', title: 'İyi İş!', sub: 'Biraz daha pratikle ustalaşırsın.', grad: 'from-blue-600 to-cyan-500' }
        : { icon: '📚', title: 'Tamamlandı!', sub: 'Sözlüğü tekrar gözden geçirmek iyi olabilir.', grad: 'from-slate-600 to-slate-500' };

    return (
      <div className="w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`bg-gradient-to-br ${perf.grad} rounded-3xl p-8 sm:p-10 text-center shadow-2xl`}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-7xl mb-4">
            {perf.icon}
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-1">{perf.title}</h2>
          <p className="text-white/80 mb-6">{perf.sub}</p>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
            <div className="bg-black/20 rounded-2xl px-3 py-4">
              <p className="text-3xl font-black text-white">{TOTAL}/{TOTAL}</p>
              <p className="text-white/60 text-xs font-bold mt-1">Doğru Eşleştirme</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-4">
              <p className="text-3xl font-black text-white">{wrongCount}</p>
              <p className="text-white/60 text-xs font-bold mt-1">Yanlış Deneme</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-4">
              <p className="text-3xl font-black text-white">%{accuracy}</p>
              <p className="text-white/60 text-xs font-bold mt-1">İsabet Oranı</p>
            </div>
          </div>

          <div className="inline-flex flex-col items-center bg-black/20 rounded-2xl px-8 py-4 mb-6">
            <span className="text-5xl font-black text-white">{score}</span>
            <span className="text-white/60 text-sm font-bold">/ {MAX_SCORE} puan</span>
          </div>

          <p className="text-white font-bold mb-6">🎉 Oyunu başarıyla tamamladın!</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="bg-white/20 hover:bg-white/30 text-white font-black py-3 px-10 rounded-full border-2 border-white/30 text-lg backdrop-blur"
            >
              Tekrar Oyna 🔄
            </motion.button>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-black/20 hover:bg-black/30 text-white font-bold py-3 px-8 rounded-full border-2 border-white/20 text-base"
              >
                Ders Listesine Dön
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── OYUN ───────────────────────────────────────────────────────────────────
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shadow-lg flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">📖</span>
            <span className="text-white font-black text-base">Ekonomi Sözlüğü</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 font-black text-xs px-3 py-1.5 rounded-full">
              Doğru Eşleştirme: {correctCount} / {TOTAL}
            </span>
            <span className="bg-red-400/20 border border-red-400/40 text-red-200 font-black text-xs px-3 py-1.5 rounded-full">
              Yanlış Deneme: {wrongCount}
            </span>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 text-center"
            >
              <span className="inline-block bg-red-500 text-white font-black text-sm px-5 py-1.5 rounded-full shadow-lg">
                {toast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* SOL: Kavram Havuzu */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden h-fit">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
              <h3 className="text-white font-black text-sm flex items-center gap-2">
                <span>🃏</span> Kavram Kutucukları
              </h3>
              <p className="text-indigo-200 text-xs mt-0.5">Doğru tanıma sürükle ve bırak</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <AnimatePresence>
                {pool.map((id) => {
                  const pair = PAIRS.find((p) => p.id === id)!;
                  return <TermBox key={pair.id} pair={pair} />;
                })}
              </AnimatePresence>
              {pool.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">Tüm kavramlar eşleştirildi! 🎉</p>
              )}
            </div>
          </div>

          {/* SAĞ: Tanım Kutuları */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAIRS.map((pair) => (
              <DefinitionSlot
                key={pair.id}
                pair={pair}
                isMatched={matched[pair.id]}
                isWrongFlash={wrongFlashDefId === pair.id}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
