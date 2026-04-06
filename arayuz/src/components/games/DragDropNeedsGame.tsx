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
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [locked]
  );

  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.25 : 1 }}
      className={`select-none ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="w-44 h-44 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-yellow-300 hover:border-yellow-500 transition-all">
        <span className="text-7xl leading-none">{item.emoji}</span>
        <p className="text-xl font-black text-slate-700 mt-3 text-center leading-tight">{item.name}</p>
      </div>
    </div>
  );
}

// --- SEPET ---
interface BasketProps {
  category: string;
  label: string;
  icon: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  onDrop: (id: number, droppedCat: string) => void;
  feedbackState: 'idle' | 'correct' | 'wrong';
}

function Basket({ category, label, icon, bgClass, borderClass, textClass, onDrop, feedbackState }: BasketProps) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      drop: (dragged: { id: number; category: string }) => onDrop(dragged.id, category),
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [onDrop]
  );

  return (
    <div
      ref={drop as any}
      className={`
        flex-1 min-h-[200px] rounded-3xl border-4 border-dashed flex flex-col items-center justify-center gap-2 p-5 transition-all duration-200
        ${bgClass} ${borderClass}
        ${isOver ? 'scale-105 border-solid shadow-xl' : ''}
        ${feedbackState === 'correct' ? '!border-solid ring-4 ring-green-400' : ''}
        ${feedbackState === 'wrong'   ? '!border-solid ring-4 ring-red-400'   : ''}
      `}
    >
      <span className="text-5xl">{icon}</span>
      <h3 className={`text-2xl font-black text-center ${textClass}`}>{label}</h3>
      {isOver && (
        <p className="text-sm font-bold opacity-60 mt-1">Buraya bırak!</p>
      )}
      <AnimatePresence>
        {feedbackState === 'correct' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-4xl">✅</motion.span>
        )}
        {feedbackState === 'wrong' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-4xl">❌</motion.span>
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
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

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
      setFeedbackMsg(correct ? '🎉 Doğru!' : '😅 Yanlış sepet!');
      if (correct) setScore(newScore);

      setTimeout(() => {
        setFeedbackBasket(null);
        setFeedbackMsg(null);
        if (currentIndex >= items.length - 1) {
          setStage('finished');
          if (onComplete) onComplete(newScore);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 1200);
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

  // --- GİRİŞ EKRANI ---
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
        <img
          src="/games/DragDropNeedsGame/baslangıc.jpeg"
          alt="Başlangıç"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center bg-white/92 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-4 border-yellow-400 max-w-xl mx-4">
          <h1 className="text-3xl md:text-4xl font-black text-teal-700 mb-4">
            🛒 İstek mi, İhtiyaç mı?
          </h1>
          <p className="text-sm md:text-base text-gray-700 mb-7 font-medium leading-relaxed">
            Bilinçli tüketici olma zamanı! Paranı en doğru şekilde kullanabilir misin?
            Ekrana gelen eşyaları <strong className="text-emerald-600">'İhtiyaç'</strong> ve{' '}
            <strong className="text-amber-600">'İstek'</strong> sepetlerine doğru şekilde at,
            alışverişi tamamla!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStage('playing')}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xl font-black py-4 px-12 rounded-full shadow-lg border-b-4 border-yellow-600"
          >
            ALIŞVERİŞE BAŞLA 🛒
          </motion.button>
        </div>
      </div>
    );
  }

  // --- BİTİŞ EKRANI ---
  if (stage === 'finished') {
    const total = items.length * 10;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
        <img
          src="/games/DragDropNeedsGame/son.jpeg"
          alt="Bitiş"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center bg-white/92 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-4 border-green-400 max-w-sm mx-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-3">
            {pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪'}
          </motion.div>
          <h2 className="text-3xl font-black text-green-700 mb-2">
            {pct >= 80 ? 'Harika İş!' : pct >= 50 ? 'İyi İş!' : 'Devam Et!'}
          </h2>
          <p className="text-slate-600 mb-5 font-medium">Alışverişi tamamladın!</p>
          <div className="text-4xl font-black text-teal-600 mb-6">
            {score} / {total} puan
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="bg-teal-500 hover:bg-teal-600 text-white text-lg font-black py-3 px-10 rounded-full shadow-lg border-b-4 border-teal-700"
          >
            Tekrar Oyna 🔄
          </motion.button>
        </div>
      </div>
    );
  }

  // --- OYUN EKRANI ---
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-sky-50 to-teal-50 rounded-3xl overflow-hidden shadow-2xl border-4 border-teal-200">

        {/* Üst Bar */}
        <div className="bg-white px-6 py-3 flex justify-between items-center border-b-2 border-teal-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500">
              {currentIndex + 1} / {items.length}
            </span>
            <div className="flex gap-1">
              {items.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 w-6 rounded-full transition-all ${
                    idx < currentIndex
                      ? 'bg-green-500'
                      : idx === currentIndex
                      ? 'bg-yellow-400'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 px-4 py-1.5 rounded-full border-2 border-yellow-300">
            <span className="text-lg">⭐</span>
            <span className="text-xl font-black text-yellow-700">{score}</span>
          </div>
        </div>

        {/* Oyun Alanı */}
        <div className="p-6 flex flex-col items-center gap-6">

          {/* Yönerge */}
          <p className="text-slate-500 font-semibold text-sm">
            Bu ürünü doğru sepete sürükle ve bırak!
          </p>

          {/* Sürüklenebilir Kart */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: -30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <DraggableCard item={currentItem} locked={isLocked} />
            </motion.div>
          </AnimatePresence>

          {/* Geri Bildirim */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-xl font-black px-6 py-2 rounded-full ${
                  feedbackBasket?.state === 'correct'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {feedbackMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sepetler */}
          <div className="w-full flex gap-4">
            <Basket
              category="IHTIYAC"
              label="İHTİYAÇ"
              icon="💚"
              bgClass="bg-emerald-50"
              borderClass="border-emerald-400"
              textClass="text-emerald-700"
              onDrop={handleDrop}
              feedbackState={
                feedbackBasket?.cat === 'IHTIYAC' ? feedbackBasket.state : 'idle'
              }
            />
            <Basket
              category="ISTEK"
              label="İSTEK"
              icon="⭐"
              bgClass="bg-amber-50"
              borderClass="border-amber-400"
              textClass="text-amber-700"
              onDrop={handleDrop}
              feedbackState={
                feedbackBasket?.cat === 'ISTEK' ? feedbackBasket.state : 'idle'
              }
            />
          </div>

        </div>
      </div>
    </DndProvider>
  );
}
