import { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';

interface SpaceShoppingDepotProps {
  onComplete?: (score: number) => void;
}

const ITEM_TYPE = 'UZAY_ITEM';

const ALL_ITEMS = [
  { id: 1,  name: 'Uzay Oksijen Tüpü',        category: 'temel',   emoji: '🫧' },
  { id: 2,  name: 'İçme Suyu Tüpü',           category: 'temel',   emoji: '💧' },
  { id: 3,  name: 'Vakumlanmış Ekmek Rulosu', category: 'temel',   emoji: '🍞' },
  { id: 4,  name: 'Süt',                       category: 'temel',   emoji: '🥛' },
  { id: 5,  name: 'Gelişmiş Termal Kıyafet',  category: 'temel',   emoji: '🧥' },
  { id: 6,  name: 'Tıbbi Kit',                 category: 'temel',   emoji: '🩺' },
  { id: 7,  name: 'Uzay Çikolatası',           category: 'eglence', emoji: '🍫' },
  { id: 8,  name: 'Kumandalı Rover',           category: 'eglence', emoji: '🚗' },
  { id: 9,  name: 'Holografik Oyun Sistemi',  category: 'eglence', emoji: '🕹️' },
  { id: 10, name: 'Uzay Sinema Pass',          category: 'eglence', emoji: '🎬' },
  { id: 11, name: 'Uzay Koşu Botları',         category: 'eglence', emoji: '👟' },
  { id: 12, name: 'Galaktik Slime',            category: 'eglence', emoji: '🟢' },
];

type Item = typeof ALL_ITEMS[0];
type SlotState = { item: Item | null };

// Slots 0-5 → temel, 6-11 → eglence
function makeSlots(): SlotState[] {
  return Array.from({ length: 12 }, () => ({ item: null }));
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── DRAGGABLE ITEM ────────────────────────────────────────────────────────────
function DraggableItem({ item, placed }: { item: Item; placed: boolean }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { id: item.id },
      canDrag: !placed,
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [placed]
  );

  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.25 : 1 }}
      className={`
        flex items-center gap-2 bg-white border-2 rounded-xl px-3 py-2 shadow-sm
        transition-all duration-150 select-none
        ${placed
          ? 'border-slate-200 bg-slate-50 opacity-40 cursor-default'
          : 'border-indigo-200 hover:border-indigo-400 hover:shadow-md cursor-grab active:cursor-grabbing'
        }
      `}
    >
      <span className="text-2xl leading-none">{item.emoji}</span>
      <span className={`text-xs font-bold leading-tight ${placed ? 'text-slate-400' : 'text-slate-700'}`}>
        {item.name}
      </span>
      {placed && <span className="ml-auto text-slate-300 text-xs">✓</span>}
    </div>
  );
}

// ─── DROP SLOT ─────────────────────────────────────────────────────────────────
interface SlotProps {
  index: number;
  slot: SlotState;
  category: 'temel' | 'eglence';
  onDrop: (itemId: number, slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
  validationState: 'idle' | 'correct' | 'wrong';
}

function DropSlot({ index, slot, onDrop, onRemove, validationState }: SlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      canDrop: () => slot.item === null,
      drop: (dragged: { id: number }) => onDrop(dragged.id, index),
      collect: (m) => ({
        isOver: m.isOver(),
        canDrop: m.canDrop(),
      }),
    }),
    [slot, index, onDrop]
  );

  const isEmpty = slot.item === null;
  const isActive = isOver && canDrop;

  let borderColor = 'border-slate-200';
  let bg = 'bg-slate-50';
  if (isActive) { borderColor = 'border-indigo-400'; bg = 'bg-indigo-50'; }
  if (!isEmpty && validationState === 'correct') { borderColor = 'border-green-400'; bg = 'bg-green-50'; }
  if (!isEmpty && validationState === 'wrong')   { borderColor = 'border-red-400';   bg = 'bg-red-50';   }

  return (
    <div
      ref={drop as any}
      className={`
        relative flex items-center gap-2 rounded-xl border-2 px-3 py-2 min-h-[44px]
        transition-all duration-150
        ${borderColor} ${bg}
        ${isEmpty && !isActive ? 'border-dashed' : ''}
      `}
    >
      <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{index + 1}</span>

      {isEmpty ? (
        <span className={`text-xs ${isActive ? 'text-indigo-500 font-bold' : 'text-slate-300'}`}>
          {isActive ? 'Bırak!' : 'Boş alan...'}
        </span>
      ) : (
        <>
          <span className="text-xl leading-none">{slot.item!.emoji}</span>
          <span className="text-xs font-bold text-slate-700 leading-tight flex-1">
            {slot.item!.name}
          </span>
          {/* Validation icons */}
          {validationState === 'correct' && <span className="text-green-500 text-sm">✅</span>}
          {validationState === 'wrong'   && <span className="text-red-500 text-sm">❌</span>}
          {/* Remove button (only when idle) */}
          {validationState === 'idle' && (
            <button
              onClick={() => onRemove(index)}
              className="text-slate-300 hover:text-red-400 text-xs font-black leading-none transition-colors"
            >
              ✕
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── ANA BİLEŞEN ───────────────────────────────────────────────────────────────
export default function SpaceShoppingDepot({ onComplete }: SpaceShoppingDepotProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [items] = useState(() => shuffle(ALL_ITEMS));
  const [slots, setSlots] = useState<SlotState[]>(makeSlots);
  const [slotValidation, setSlotValidation] = useState<('idle' | 'correct' | 'wrong')[]>(
    Array(12).fill('idle')
  );
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  // Which item IDs are already placed in a slot?
  const placedIds = slots.filter((s) => s.item !== null).map((s) => s.item!.id);

  const handleDrop = useCallback(
    (itemId: number, slotIndex: number) => {
      const item = ALL_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      setSlots((prev) => {
        const next = [...prev];
        // Remove the item from any previous slot first
        const oldSlotIdx = next.findIndex((s) => s.item?.id === itemId);
        if (oldSlotIdx !== -1) next[oldSlotIdx] = { item: null };
        next[slotIndex] = { item };
        return next;
      });
      // Reset validation when user moves items
      setChecked(false);
      setSlotValidation(Array(12).fill('idle'));
    },
    []
  );

  const handleRemove = useCallback((slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { item: null };
      return next;
    });
    setChecked(false);
    setSlotValidation(Array(12).fill('idle'));
  }, []);

  const checkAnswers = () => {
    let correct = 0;
    const validation: ('idle' | 'correct' | 'wrong')[] = slots.map((slot, idx) => {
      if (!slot.item) return 'idle';
      const expectedCategory = idx < 6 ? 'temel' : 'eglence';
      if (slot.item.category === expectedCategory) {
        correct++;
        return 'correct';
      }
      return 'wrong';
    });
    setSlotValidation(validation);
    setChecked(true);

    const finalScore = correct * 10;
    setScore(finalScore);

    if (correct === 12) {
      setTimeout(() => {
        setStage('finished');
        if (onComplete) onComplete(finalScore);
      }, 1200);
    }
  };

  const reset = () => {
    setSlots(makeSlots());
    setSlotValidation(Array(12).fill('idle'));
    setChecked(false);
    setScore(0);
  };

  const allPlaced = placedIds.length === 12;
  const correctCount = slotValidation.filter((v) => v === 'correct').length;

  // ─── GİRİŞ ───────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-10 text-center shadow-2xl border border-indigo-800 relative overflow-hidden"
        >
          {/* Stars bg */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.7 + 0.2,
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <div className="text-7xl mb-4">🚀</div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
              Uzay Alışveriş Deposu
            </h1>
            <p className="text-indigo-200 text-base md:text-lg mb-2 font-medium max-w-lg mx-auto leading-relaxed">
              Uzay yolculuğuna çıkmadan önce alışverişini tamamla!
            </p>
            <p className="text-indigo-300 text-sm mb-8 max-w-md mx-auto">
              12 ürünü doğru bölmelere yerleştir:{' '}
              <span className="text-emerald-400 font-bold">Temel İhtiyaçlar</span> ve{' '}
              <span className="text-amber-400 font-bold">Eğlenceli İstekler</span>.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStage('playing')}
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-xl font-black py-4 px-12 rounded-full shadow-xl border-b-4 border-indigo-700"
            >
              Depoya Gir 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── BİTİŞ ───────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-10 text-center shadow-2xl border border-indigo-800 relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0 }}
                animate={{ opacity: [0, Math.random() * 0.8 + 0.2, 0] }}
                transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className="text-7xl mb-4">🏆</motion.div>
            <h2 className="text-4xl font-black text-white mb-2">Harika! Depo Tamamlandı!</h2>
            <p className="text-indigo-200 mb-6 font-medium">Tüm ürünleri doğru bölmeye yerleştirdin.</p>
            <div className="text-5xl font-black text-yellow-400 mb-8">{score} / 120 puan</div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setStage('intro'); reset(); }}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-black py-3 px-10 rounded-full shadow-lg border-b-4 border-indigo-700 text-lg"
            >
              Tekrar Oyna 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── OYUN ─────────────────────────────────────────────────────────────────────
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl px-5 py-3 mb-4 flex items-center justify-between border border-indigo-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <span className="text-white font-black text-base">Uzay Alışveriş Deposu</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-indigo-300 font-bold">
              {placedIds.length} / 12 yerleştirildi
            </div>
            {checked && (
              <div className={`text-xs font-black px-3 py-1 rounded-full ${
                correctCount === 12 ? 'bg-green-500 text-white' : 'bg-amber-400 text-amber-900'
              }`}>
                {correctCount} / 12 doğru
              </div>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {/* LEFT: Draggable items */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-4 py-3">
              <h3 className="text-white font-black text-sm flex items-center gap-2">
                <span>📦</span> Ürünler
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Sürükle → Boş alana bırak</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {items.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  placed={placedIds.includes(item.id)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Drop zones */}
          <div className="md:col-span-3 flex flex-col gap-4">

            {/* Category 1: Temel */}
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
                <h3 className="text-white font-black text-sm flex items-center gap-2">
                  <span>🌿</span> Temel İhtiyaçlarımız
                </h3>
                <p className="text-emerald-100 text-xs mt-0.5">Uzayda hayatta kalmak için gerekli</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {slots.slice(0, 6).map((slot, i) => (
                  <DropSlot
                    key={i}
                    index={i}
                    slot={slot}
                    category="temel"
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    validationState={slotValidation[i]}
                  />
                ))}
              </div>
            </div>

            {/* Category 2: Eğlence */}
            <div className="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                <h3 className="text-white font-black text-sm flex items-center gap-2">
                  <span>🎉</span> Eğlenceli İsteklerimiz
                </h3>
                <p className="text-amber-100 text-xs mt-0.5">Keyifli zaman geçirmek için</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {slots.slice(6, 12).map((slot, i) => (
                  <DropSlot
                    key={i + 6}
                    index={i + 6}
                    slot={slot}
                    category="eglence"
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    validationState={slotValidation[i + 6]}
                  />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={checkAnswers}
                disabled={!allPlaced || checked}
                className={`flex-1 font-black py-3 px-6 rounded-xl shadow-md text-base transition-all
                  ${allPlaced && !checked
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-b-4 border-indigo-800 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-slate-300'
                  }`}
              >
                {!allPlaced
                  ? `${12 - placedIds.length} ürün kaldı...`
                  : checked
                  ? `${correctCount}/12 Doğru ✓`
                  : '🔍 Cevapları Kontrol Et'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={reset}
                className="bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-5 rounded-xl shadow border-2 border-slate-200 text-sm"
              >
                🔄 Sıfırla
              </motion.button>
            </div>

            {/* Feedback banner */}
            <AnimatePresence>
              {checked && correctCount < 12 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold text-center"
                >
                  ❌ işaretli ürünleri taşı ve tekrar dene! ({correctCount}/12 doğru)
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
