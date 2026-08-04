import { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import {
  CARDS,
  BASKETS,
  SORT_TITLE,
  SORT_INSTRUCTION,
  QUESTIONS,
  EXAM_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_CARD,
  TOTAL_CARD_POINTS,
  TOTAL_QUESTION_POINTS,
  TOTAL_POINTS,
  getPerformance,
  shuffle,
  type SourceCard,
  type BasketId,
} from './data/mediaLiteracyAssessmentData';

interface MediaLiteracyAssessmentProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
const CARD_TYPE = 'ML_CARD';
const TOTAL_STEPS = 1 + QUESTIONS.length;

interface SortState {
  slots: Record<string, string | null>;
  locked: boolean;
}

interface McqAnswerRecord {
  questionId: number;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsEarned: number;
}

function emptySortState(): SortState {
  const slots: Record<string, string | null> = {};
  BASKETS.forEach(b => b.slotIds.forEach(id => (slots[id] = null)));
  return { slots, locked: false };
}

function findCard(id: string | null): SourceCard | null {
  if (!id) return null;
  return CARDS.find(c => c.id === id) ?? null;
}

function slotBasketId(slotId: string): BasketId {
  return BASKETS.find(b => b.slotIds.includes(slotId))!.id;
}

function isSortFilled(slots: Record<string, string | null>): boolean {
  return Object.values(slots).every(v => v !== null);
}

function withCardRemoved(slots: Record<string, string | null>, cardId: string): Record<string, string | null> {
  const next = { ...slots };
  for (const key of Object.keys(next)) {
    if (next[key] === cardId) next[key] = null;
  }
  return next;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function StatTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
      <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
      <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">{label}</p>
    </div>
  );
}

function DragChip({ card, locked }: { card: SourceCard; locked: boolean }) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: CARD_TYPE,
      item: { cardId: card.id },
      canDrag: !locked,
      collect: m => ({ isDragging: m.isDragging() }),
    }),
    [locked, card.id]
  );

  return (
    <div
      ref={dragRef as any}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
    >
      <motion.div
        whileHover={locked ? {} : { scale: 1.02, y: -2 }}
        whileTap={locked ? {} : { scale: 0.98 }}
        className="bg-slate-800 border-2 border-blue-600/50 rounded-xl px-4 py-3 text-white text-xs sm:text-sm font-semibold shadow-md select-none leading-snug"
      >
        {card.label}
      </motion.div>
    </div>
  );
}

function SortSlot({
  slotId,
  card,
  locked,
  reveal,
  onDrop,
  onClear,
}: {
  slotId: string;
  card: SourceCard | null;
  locked: boolean;
  reveal: 'correct' | 'wrong' | null;
  onDrop: (cardId: string, slotId: string) => void;
  onClear: (slotId: string) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: CARD_TYPE,
      canDrop: () => !locked,
      drop: (item: { cardId: string }) => onDrop(item.cardId, slotId),
      collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [locked, slotId, onDrop]
  );

  let boxClass = 'border-dashed border-slate-600 bg-slate-800/50';
  if (reveal === 'correct') boxClass = 'border-solid border-emerald-500 bg-emerald-900/30';
  else if (reveal === 'wrong') boxClass = 'border-solid border-red-500 bg-red-900/30';
  else if (isOver && canDrop) boxClass = 'border-solid border-blue-400 bg-blue-900/30';
  else if (card) boxClass = 'border-solid border-slate-500 bg-slate-800';

  return (
    <div
      ref={dropRef as any}
      className={`relative rounded-xl border-2 p-3 flex items-center justify-center text-center transition-colors min-h-[64px] ${boxClass}`}
    >
      {card ? (
        <>
          <p className="text-white text-xs sm:text-sm font-medium leading-snug px-1">{card.label}</p>
          {!locked && (
            <button
              type="button"
              onClick={() => onClear(slotId)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-500 text-slate-300 text-xs leading-none flex items-center justify-center hover:bg-red-900/60 hover:border-red-500 hover:text-red-300"
            >
              ×
            </button>
          )}
          {reveal === 'correct' && <CheckCircle2 className="absolute -bottom-2 -right-2 w-5 h-5 text-emerald-400 bg-slate-900 rounded-full" />}
          {reveal === 'wrong' && <XCircle className="absolute -bottom-2 -right-2 w-5 h-5 text-red-400 bg-slate-900 rounded-full" />}
        </>
      ) : (
        <span className="text-slate-500 text-xs">Kartı buraya sürükle</span>
      )}
    </div>
  );
}

export default function MediaLiteracyAssessment({ onComplete, onBack }: MediaLiteracyAssessmentProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = sort task, 1..QUESTIONS.length = mcq

  const [sortState, setSortState] = useState<SortState>(emptySortState);
  const [cardOrder, setCardOrder] = useState<string[]>(CARDS.map(c => c.id));

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [mcqLocked, setMcqLocked] = useState(false);
  const [mcqHistory, setMcqHistory] = useState<McqAnswerRecord[]>([]);

  const finalizedRef = useRef(false);

  // ── Sayaç ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, EXAM_DURATION_MS - elapsedMs) : EXAM_DURATION_MS;

  const sortCorrectCount = sortState.locked
    ? Object.entries(sortState.slots).filter(([slotId, cardId]) => {
        const card = findCard(cardId);
        return card && card.correctBasket === slotBasketId(slotId);
      }).length
    : 0;
  const sortPoints = sortState.locked ? sortCorrectCount * POINTS_PER_CARD : 0;
  const mcqPoints = mcqHistory.reduce((sum, r) => sum + r.pointsEarned, 0);
  const score = sortPoints + mcqPoints;

  const finalizeExam = () => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    if (onComplete) onComplete(score);
    setFinishedAt(Date.now());
    setStage('finished');
  };

  useEffect(() => {
    if (stage === 'exam' && startedAt !== null && remainingMs <= 0) {
      finalizeExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, stage]);

  const handleStart = () => {
    const start = Date.now();
    setStartedAt(start);
    setNowTick(start);
    setFinishedAt(null);
    setCurrentIndex(0);
    setSortState(emptySortState());
    setCardOrder(shuffle(CARDS.map(c => c.id)));
    setSelectedOptionId(null);
    setMcqLocked(false);
    setMcqHistory([]);
    finalizedRef.current = false;
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setFinishedAt(null);
    setCurrentIndex(0);
    setSortState(emptySortState());
    setSelectedOptionId(null);
    setMcqLocked(false);
    setMcqHistory([]);
    finalizedRef.current = false;
    setStage('intro');
  };

  // ── Sıralama görevi mantığı ──────────────────────────────────────────────
  const assignCard = (cardId: string, slotId: string) => {
    setSortState(prev => {
      if (prev.locked) return prev;
      const cleared = withCardRemoved(prev.slots, cardId);
      return { ...prev, slots: { ...cleared, [slotId]: cardId } };
    });
  };

  const clearSlot = (slotId: string) => {
    setSortState(prev => (prev.locked ? prev : { ...prev, slots: { ...prev.slots, [slotId]: null } }));
  };

  const lockSort = () => {
    setSortState(prev => (prev.locked ? prev : { ...prev, locked: true }));
  };

  // ── MCQ mantığı ────────────────────────────────────────────────────────
  const currentQuestion = QUESTIONS[currentIndex - 1];
  const isLastStep = currentIndex === TOTAL_STEPS - 1;

  const handleSelect = (optionId: string) => {
    if (mcqLocked) return;
    setSelectedOptionId(optionId);
  };

  const handleConfirmMcq = () => {
    if (mcqLocked || selectedOptionId === null) return;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;
    setMcqLocked(true);
    setMcqHistory(prev => [...prev, { questionId: currentQuestion.id, selectedOptionId, isCorrect, pointsEarned }]);
  };

  const handleNext = () => {
    if (currentIndex === TOTAL_STEPS - 1) {
      finalizeExam();
      return;
    }
    setCurrentIndex(i => i + 1);
    setSelectedOptionId(null);
    setMcqLocked(false);
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
                <Newspaper className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Finansal Medya Okuryazarlığı</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Güvenilir ve güvenilmez bilgi kaynaklarını ayırt et, ardından teyitçilik ve mantık yürütme
                senaryolarını çöz.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  '1. görev: 5 bilgi kaynağı kartını doğru sepete sürükle-bırak ile sınıflandır.',
                  'Her doğru yerleştirilen kart 8 puandır. Sınıflandırma görevi toplam 40 puandır.',
                  'Tüm kartları yerleştirmeden cevabı onaylayamazsın.',
                  '2-5. görevler: 4 çoktan seçmeli sorudur, her sorunun tek doğru cevabı vardır.',
                  'Her doğru soru 15 puandır. Sorular toplam 60 puandır.',
                  'Görevler sırasıyla yapılır; bir görevi tamamlamadan sonrakine geçilemez.',
                  'Toplam puan 100\'dür. Sınav süresi 16 dakikadır.',
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleStart}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-lg sm:text-xl py-4 px-10 sm:px-14 rounded-full shadow-xl border-b-4 border-purple-800 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50"
              >
                Oyunu Başlat 🚀
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const performance = getPerformance(score);
    const mcqCorrectCount = mcqHistory.filter(r => r.isCorrect).length;
    const completionMs = finishedAt && startedAt ? finishedAt - startedAt : 0;

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-gradient-to-br ${performance.bg} rounded-3xl overflow-hidden shadow-2xl border border-slate-700`}>
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-7xl mb-4"
              >
                {performance.icon}
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-1">Değerlendirme Tamamlandı!</h2>
              <p className={`text-xl font-bold mb-4 ${performance.color}`}>{performance.label}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl">
                {score} / {TOTAL_POINTS} Puan
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatTile label="Kart Puanı" value={`${sortPoints}/${TOTAL_CARD_POINTS}`} color="text-emerald-400" />
              <StatTile label="Soru Puanı" value={`${mcqPoints}/${TOTAL_QUESTION_POINTS}`} color="text-blue-400" />
              <StatTile label="Doğru Soru" value={`${mcqCorrectCount}/${QUESTIONS.length}`} color="text-yellow-400" />
              <StatTile label="Süre" value={formatDuration(completionMs)} color="text-amber-400" />
            </div>

            {/* Kart sonuçları */}
            <div className="mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Görev 1 · {SORT_TITLE}</h3>
              <div className="space-y-2">
                {CARDS.map(card => {
                  const placedSlot = Object.entries(sortState.slots).find(([, cardId]) => cardId === card.id);
                  const attempted = !!placedSlot;
                  const isCorrect = attempted && slotBasketId(placedSlot![0]) === card.correctBasket;
                  return (
                    <div
                      key={card.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        !attempted ? 'bg-slate-800/40 border-slate-700' : isCorrect ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
                      }`}
                    >
                      {!attempted ? (
                        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      ) : isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm font-medium mb-1">{card.label}</p>
                        <p className="text-slate-400 text-xs leading-relaxed">{card.note}</p>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ${isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                        +{isCorrect ? POINTS_PER_CARD : 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Soru sonuçları */}
            <div className="space-y-3 mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Görev 2-5 · Teyitçilik ve Mantık Yürütme</h3>
              {QUESTIONS.map((q, idx) => {
                const record = mcqHistory.find(r => r.questionId === q.id);
                const attempted = !!record;
                const correctOption = q.options.find(o => o.id === q.correctOptionId)!;
                const selectedOption = record ? q.options.find(o => o.id === record.selectedOptionId) : null;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      !attempted ? 'bg-slate-800/40 border-slate-700' : record!.isCorrect ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!attempted ? (
                        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      ) : record!.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs mb-1">Soru {idx + 1}</p>
                        {!attempted ? (
                          <p className="text-slate-500 text-xs">Bu soru cevaplanmadı.</p>
                        ) : (
                          <>
                            <p className="text-white text-sm font-medium mb-1">
                              Seçtiğin: {record!.selectedOptionId}) {selectedOption?.label}
                            </p>
                            {!record!.isCorrect && (
                              <p className="text-emerald-300 text-xs mb-1">
                                Doğrusu: {q.correctOptionId}) {correctOption.label}
                              </p>
                            )}
                            <p className="text-slate-400 text-xs leading-relaxed">{q.explanation}</p>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ${record?.isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                        +{record?.pointsEarned ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3.5 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 transition-all"
              >
                Tekrar Oyna 🔄
              </motion.button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-2xl text-sm sm:text-base border border-slate-700 transition-all"
                >
                  Oyunlar Sayfasına Dön
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM ─────────────────────────────────────────────────────────────────
  const pool = cardOrder.filter(id => !Object.values(sortState.slots).includes(id));
  const lastMcqRecord = mcqLocked ? mcqHistory[mcqHistory.length - 1] : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-5xl mx-auto">
        {/* Üst bilgi çubuğu */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
                  <Newspaper className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                  FinEdu
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Medya Okuryazarlığı Değerlendirmesi</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                  Görev {currentIndex + 1} / {TOTAL_STEPS}
                </span>
                <motion.span
                  animate={remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ repeat: remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? Infinity : 0, duration: 1 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border ${
                    remainingMs <= LOW_TIME_THRESHOLD_MS ? 'bg-red-900/60 text-red-300 border-red-600/60' : 'bg-slate-700/60 text-slate-200 border-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> {formatCountdown(remainingMs)}
                </motion.span>
                <span className="bg-blue-900/60 text-blue-300 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border border-blue-700/60">
                  Puan: {score}
                </span>
              </div>
            </div>

            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 ${
                    i === currentIndex
                      ? 'border-blue-400 bg-blue-900/60 text-blue-200'
                      : i < currentIndex
                      ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                      : 'border-slate-600 bg-slate-800 text-slate-400'
                  }`}
                >
                  {i < currentIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Görev kartı */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {currentIndex === 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">Görev 1</span>
                      <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                        Kart başı {POINTS_PER_CARD} puan · toplam {TOTAL_CARD_POINTS} puan
                      </span>
                    </div>

                    <h2 className="text-white font-bold text-base sm:text-lg mb-3">{SORT_TITLE}</h2>
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                      <p className="text-slate-200 text-sm leading-relaxed">{SORT_INSTRUCTION}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
                      {/* Sol: kart havuzu */}
                      <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Kart Havuzu</h3>
                        <div className="flex flex-wrap gap-3">
                          {pool.map(id => (
                            <DragChip key={id} card={findCard(id)!} locked={sortState.locked} />
                          ))}
                          {pool.length === 0 && !sortState.locked && (
                            <p className="text-slate-500 text-xs">Tüm kartlar sepetlere yerleştirildi.</p>
                          )}
                        </div>
                      </div>

                      {/* Sağ: sepetler */}
                      <div className="flex flex-col gap-4">
                        {BASKETS.map(basket => (
                          <div
                            key={basket.id}
                            className={`rounded-2xl border p-4 ${
                              basket.id === 'unreliable' ? 'bg-red-900/10 border-red-700/40' : 'bg-emerald-900/10 border-emerald-700/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-lg">{basket.icon}</span>
                              <span className={`text-xs sm:text-sm font-black uppercase tracking-wide ${basket.id === 'unreliable' ? 'text-red-300' : 'text-emerald-300'}`}>
                                {basket.title}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {basket.slotIds.map(slotId => (
                                <SortSlot
                                  key={slotId}
                                  slotId={slotId}
                                  card={findCard(sortState.slots[slotId])}
                                  locked={sortState.locked}
                                  reveal={
                                    sortState.locked && sortState.slots[slotId]
                                      ? findCard(sortState.slots[slotId])!.correctBasket === basket.id
                                        ? 'correct'
                                        : 'wrong'
                                      : null
                                  }
                                  onDrop={assignCard}
                                  onClear={clearSlot}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!sortState.locked && (
                      <div className="mt-5">
                        <div className="flex justify-center">
                          <motion.button
                            whileHover={isSortFilled(sortState.slots) ? { scale: 1.02 } : {}}
                            whileTap={isSortFilled(sortState.slots) ? { scale: 0.98 } : {}}
                            onClick={lockSort}
                            disabled={!isSortFilled(sortState.slots)}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
                          >
                            Cevabı Onayla ✅
                          </motion.button>
                        </div>
                        {!isSortFilled(sortState.slots) && (
                          <p className="text-center text-slate-500 text-xs mt-2">Tüm kartları sepetlere yerleştirdiğinde aktif olacak.</p>
                        )}
                      </div>
                    )}

                    <AnimatePresence>
                      {sortState.locked && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                          <div
                            className={`rounded-xl px-5 py-3 mb-3 flex items-center gap-3 ${
                              sortCorrectCount === CARDS.length ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-amber-900/50 border border-amber-600/50'
                            }`}
                          >
                            {sortCorrectCount === CARDS.length ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            )}
                            <p className={`text-sm font-bold ${sortCorrectCount === CARDS.length ? 'text-emerald-300' : 'text-amber-300'}`}>
                              {sortCorrectCount} / {CARDS.length} kart doğru sepete yerleşti. +{sortPoints} puan.
                            </p>
                          </div>

                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 mb-4 space-y-3">
                            {CARDS.map(card => {
                              const placedSlot = Object.entries(sortState.slots).find(([, cardId]) => cardId === card.id);
                              const isCorrect = !!placedSlot && slotBasketId(placedSlot[0]) === card.correctBasket;
                              return (
                                <div key={card.id} className="flex items-start gap-2">
                                  {isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                  )}
                                  <p className="text-slate-300 text-xs leading-relaxed">
                                    <span className="font-bold text-slate-200">Sistem Notu: </span>
                                    {card.note}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                          >
                            Sonraki Soru ➔
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">Soru {currentIndex}</span>
                      <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                        {currentQuestion.points} puan
                      </span>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
                      <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">{currentQuestion.prompt}</p>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl px-5 py-4 border border-slate-700 mb-4">
                      <p className="text-white font-bold text-sm sm:text-base">❓ {currentQuestion.question}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {currentQuestion.options.map(option => {
                        const isSelected = selectedOptionId === option.id;
                        const revealed = mcqLocked;
                        let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                        if (revealed && option.id === currentQuestion.correctOptionId) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                        else if (revealed && isSelected) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                        else if (revealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';
                        else if (isSelected) btnClass = 'bg-blue-900/40 border-blue-400 text-blue-100';

                        return (
                          <motion.button
                            key={option.id}
                            whileHover={!revealed ? { scale: 1.005 } : {}}
                            onClick={() => handleSelect(option.id)}
                            disabled={revealed}
                            className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${btnClass}`}
                          >
                            <span className="font-black flex-shrink-0">{option.id})</span>
                            <span className="flex-1 text-sm">{option.label}</span>
                            {revealed && option.id === currentQuestion.correctOptionId && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                            {revealed && isSelected && option.id !== currentQuestion.correctOptionId && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {!mcqLocked && (
                      <div className="flex justify-center mt-5">
                        <motion.button
                          whileHover={selectedOptionId !== null ? { scale: 1.02 } : {}}
                          whileTap={selectedOptionId !== null ? { scale: 0.98 } : {}}
                          onClick={handleConfirmMcq}
                          disabled={selectedOptionId === null}
                          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
                        >
                          Cevabı Onayla ✅
                        </motion.button>
                      </div>
                    )}

                    <AnimatePresence>
                      {mcqLocked && lastMcqRecord && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                          <div
                            className={`rounded-xl px-5 py-3 mb-3 flex items-center gap-3 ${
                              lastMcqRecord.isCorrect ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                            }`}
                          >
                            {lastMcqRecord.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            )}
                            <p className={`text-sm font-bold ${lastMcqRecord.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                              {lastMcqRecord.isCorrect ? 'Doğru!' : 'Yanlış cevap.'} +{lastMcqRecord.pointsEarned} puan.
                            </p>
                          </div>

                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 mb-4">
                            <p className="text-slate-300 text-xs leading-relaxed">
                              <span className="font-bold text-slate-200">Açıklama: </span>
                              {currentQuestion.explanation}
                            </p>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                          >
                            {isLastStep ? 'Sonucu Gör 🏆' : 'Sonraki Soru ➔'}
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
