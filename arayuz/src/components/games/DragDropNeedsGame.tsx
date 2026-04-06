import { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropNeedsGameProps {
  onComplete?: (score: number) => void;
}

const ITEM_TYPE = 'CARD';

const ALL_ITEMS = [
  { id: 1,  name: 'Süt',         category: 'IHTIYAC', emoji: '🥛' },
  { id: 2,  name: 'Su',          category: 'IHTIYAC', emoji: '💧' },
  { id: 3,  name: 'Havuç',       category: 'IHTIYAC', emoji: '🥕' },
  { id: 4,  name: 'Ekmek',       category: 'IHTIYAC', emoji: '🍞' },
  { id: 5,  name: 'Zeytin',      category: 'IHTIYAC', emoji: '🫒' },
  { id: 6,  name: 'Elma',        category: 'IHTIYAC', emoji: '🍎' },
  { id: 7,  name: 'Futbol Topu', category: 'ISTEK',   emoji: '⚽' },
  { id: 8,  name: 'Cips',        category: 'ISTEK',   emoji: '🍟' },
  { id: 9,  name: 'Renkli Boya', category: 'ISTEK',   emoji: '🎨' },
  { id: 10, name: 'Oyuncak Ayı', category: 'ISTEK',   emoji: '🧸' },
  { id: 11, name: 'Video Oyun',  category: 'ISTEK',   emoji: '🎮' },
  { id: 12, name: 'Çikolata',    category: 'ISTEK',   emoji: '🍫' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// --- SÜRÜKLENEBILIR KART ---
function DraggableCard({ item, locked }: { item: typeof ALL_ITEMS[0]; locked: boolean }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { id: item.id, category: item.category },
      canDrag: !locked,
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [locked, item]
  );

  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.2 : 1 }}
      className={`select-none transition-opacity ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <motion.div
        whileHover={locked ? {} : { scale: 1.08, y: -4 }}
        className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border-4 border-yellow-300 flex flex-col items-center justify-center gap-1 px-5 py-3"
        style={{ minWidth: 110 }}
      >
        <span className="text-5xl leading-none">{item.emoji}</span>
        <p className="text-base font-black text-slate-800 text-center leading-tight mt-1">
          {item.name}
        </p>
      </motion.div>
    </div>
  );
}

// --- SEPET DROP ZONU (Görsel üzerine bindirilen şeffaf alan) ---
interface BasketZoneProps {
  category: string;
  onDrop: (id: number, droppedCat: string) => void;
  feedbackState: 'idle' | 'correct' | 'wrong';
  style: React.CSSProperties;
  label: string;
}

function BasketZone({ category, onDrop, feedbackState, style, label }: BasketZoneProps) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      drop: (dragged: { id: number; category: string }) => onDrop(dragged.id, category),
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [onDrop]
  );

  return (
    <div
      ref={drop as any}
      style={style}
      className={`absolute rounded-2xl transition-all duration-200 flex flex-col items-center justify-end pb-2 overflow-hidden
        ${isOver ? 'ring-4 ring-white/80 bg-white/20' : 'bg-transparent'}
        ${feedbackState === 'correct' ? 'ring-4 ring-green-400 bg-green-400/25' : ''}
        ${feedbackState === 'wrong'   ? 'ring-4 ring-red-400 bg-red-400/25'   : ''}
      `}
    >
      {/* Sürüklenirken göster */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-3xl font-black text-white drop-shadow-lg bg-black/30 px-3 py-1 rounded-full">
            {label === 'IHTIYAC' ? '💚 Buraya!' : '⭐ Buraya!'}
          </span>
        </motion.div>
      )}
      {/* Geri bildirim */}
      <AnimatePresence>
        {feedbackState === 'correct' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-5xl drop-shadow-lg">✅</span>
          </motion.div>
        )}
        {feedbackState === 'wrong' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-5xl drop-shadow-lg">❌</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- ANA BİLEŞEN ---
export default function DragDropNeedsGame({ onComplete }: DragDropNeedsGameProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [items] = useState(() => shuffle(ALL_ITEMS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedbackBasket, setFeedbackBasket] = useState<{ cat: string; state: 'correct' | 'wrong' } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const currentItem = items[currentIndex];
  const isLocked = feedbackBasket !== null;

  const handleDrop = useCallback(
    (itemId: number, droppedCat: string) => {
      if (isLocked) return;
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const correct = item.category === droppedCat;
      const newScore = correct ? score + 10 : score;

      setFeedbackBasket({ cat: droppedCat, state: correct ? 'correct' : 'wrong' });
      setFeedbackMsg({ text: correct ? '🎉 Doğru sepet!' : '😅 Yanlış sepet!', ok: correct });
      if (correct) setScore(newScore);

      setTimeout(() => {
        setFeedbackBasket(null);
        setFeedbackMsg(null);
        if (currentIndex >= items.length - 1) {
          setStage('finished');
          if (onComplete) onComplete(newScore);
        } else {
          setCurrentIndex((p) => p + 1);
        }
      }, 1100);
    },
    [isLocked, items, currentIndex, score, onComplete]
  );

  const restart = () => {
    setStage('intro');
    setCurrentIndex(0);
    setScore(0);
    setFeedbackBasket(null);
    setFeedbackMsg(null);
  };

  // ─── GİRİŞ EKRANI ─────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative"
           style={{ aspectRatio: '16/9' }}>
        <img
          src="/games/DragDropNeedsGame/baslangıc.jpeg"
          alt="Başlangıç"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Karartma */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Merkez kart */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/93 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-yellow-400 p-6 max-w-md w-full text-center"
          >
            <h1 className="text-2xl md:text-3xl font-black text-teal-700 mb-3">
              🛒 İstek mi, İhtiyaç mı?
            </h1>
            <p className="text-sm md:text-base text-gray-700 mb-5 font-medium leading-relaxed">
              Bilinçli tüketici olma zamanı! Paranı en doğru şekilde kullanabilir misin?
              Ekrana gelen eşyaları{' '}
              <strong className="text-emerald-600">İhtiyaçlar</strong> ve{' '}
              <strong className="text-amber-600">İstekler</strong> sepetine sürükle!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStage('playing')}
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xl font-black py-3 px-10 rounded-full shadow-lg border-b-4 border-yellow-600"
            >
              ALIŞVERİŞE BAŞLA 🛒
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── BİTİŞ EKRANI ─────────────────────────────────────
  if (stage === 'finished') {
    const total = items.length * 10;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative"
           style={{ aspectRatio: '16/9' }}>
        <img
          src="/games/DragDropNeedsGame/son.jpeg"
          alt="Bitiş"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/93 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-green-400 p-7 max-w-xs w-full text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
              className="text-6xl mb-3">
              {pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪'}
            </motion.div>
            <h2 className="text-2xl font-black text-green-700 mb-1">
              {pct >= 80 ? 'Harika!' : pct >= 50 ? 'İyi İş!' : 'Devam Et!'}
            </h2>
            <p className="text-slate-600 text-sm mb-4 font-medium">Alışverişi tamamladın!</p>
            <div className="text-4xl font-black text-teal-600 mb-5">
              {score} / {total}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="bg-teal-500 hover:bg-teal-600 text-white font-black py-2.5 px-8 rounded-full shadow-lg border-b-4 border-teal-700 text-base"
            >
              Tekrar Oyna 🔄
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── OYUN EKRANI ─────────────────────────────────────
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Görsel ile aynı oran */}
      <div
        className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative select-none"
        style={{ aspectRatio: '16/9' }}
      >
        {/* ARKA PLAN GÖRSELİ */}
        <img
          src="/games/DragDropNeedsGame/baslangıc.jpeg"
          alt="Oyun"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* ── SEPET DROP ZONLARI (Görseldeki sepetlerin tam üstüne) ── */}
        {/* Sol sepet: İHTİYAÇLAR */}
        <BasketZone
          category="IHTIYAC"
          label="IHTIYAC"
          onDrop={handleDrop}
          feedbackState={feedbackBasket?.cat === 'IHTIYAC' ? feedbackBasket.state : 'idle'}
          style={{ left: '15%', top: '47%', width: '28%', height: '45%' }}
        />
        {/* Sağ sepet: İSTEKLER */}
        <BasketZone
          category="ISTEK"
          label="ISTEK"
          onDrop={handleDrop}
          feedbackState={feedbackBasket?.cat === 'ISTEK' ? feedbackBasket.state : 'idle'}
          style={{ left: '52%', top: '47%', width: '28%', height: '45%' }}
        />

        {/* ── ÜST BAR: İlerleme + Puan ── */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/85 backdrop-blur rounded-full px-4 py-1.5 shadow-lg">
          <div className="flex gap-1">
            {items.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-5 rounded-full transition-all ${
                  idx < currentIndex ? 'bg-green-500' : idx === currentIndex ? 'bg-yellow-400' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-black text-yellow-700 flex items-center gap-1">
            ⭐ {score}
          </span>
        </div>

        {/* ── ORTADA SÜRÜKLENECEK ÜRÜN ── */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '12%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: -30, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <DraggableCard item={currentItem} locked={isLocked} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── GERİ BİLDİRİM MESAJI ── */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute left-1/2 -translate-x-1/2 font-black text-base px-5 py-1.5 rounded-full shadow-lg
                ${feedbackMsg.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
              style={{ top: '43%' }}
            >
              {feedbackMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ALT: Yönerge ── */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <span className="text-xs font-bold text-white bg-black/40 px-3 py-1 rounded-full backdrop-blur">
            Ürünü doğru sepete sürükle!
          </span>
        </div>
      </div>
    </DndProvider>
  );
}
