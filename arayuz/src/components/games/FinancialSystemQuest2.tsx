import { Fragment, useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  TASK1,
  TASK2,
  TASK3,
  TASK4,
  TASKS,
  TASK_SHORT_LABELS,
  EXAM_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  getPerformance,
  shuffle,
  TaskCard,
  MatchSlot,
} from './data/financialSystemQuest2Data';

interface FinancialSystemQuest2Props {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';

interface SlotAnswerState {
  slots: Record<string, string | null>;
  locked: boolean;
  correct: boolean | null;
}

interface McqAnswerState {
  selected: string | null;
  locked: boolean;
  correct: boolean | null;
}

const CARD_TYPE = 'FSC2_CARD';

const STORY_TEXT =
  'Finansal sistemde bazı kullanıcılar işlem sıralarını ve para akışlarını yanlış anlamaktadır. Bu hatalar nedeniyle kredi, maaş ve yatırım işlemleri kilitlenmiştir. Finansal Sistem Kontrol Uzmanı olarak görevin, 20 dakika içinde dört vakayı çözmek ve sistemi yeniden çalıştırmaktır.';

// ── Helpers ──────────────────────────────────────────────────────────────────

function findCard(cards: TaskCard[], id: string | null): TaskCard | null {
  if (!id) return null;
  return cards.find(c => c.id === id) ?? null;
}

function isSlotsAttempted(slots: Record<string, string | null>): boolean {
  return Object.values(slots).some(v => v !== null);
}

function isSlotsFilled(slots: Record<string, string | null>): boolean {
  return Object.values(slots).every(v => v !== null);
}

function checkOrder(slots: Record<string, string | null>, correctOrder: string[]): boolean {
  return correctOrder.every((cardId, idx) => slots[String(idx)] === cardId);
}

function checkMatch(slots: Record<string, string | null>, matchSlots: MatchSlot[]): boolean {
  return matchSlots.every(s => slots[s.id] === s.correctCardId);
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

function joinTr(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`;
}

function buildResultMessage(correctIdxs: number[], nonCorrectIdxs: number[]): string {
  if (correctIdxs.length === 4) {
    return 'Tüm görevleri başarıyla tamamladın! Finansal sistemin işleyişini eksiksiz kavradın.';
  }
  if (correctIdxs.length === 0) {
    return 'Bu denemede görevlerin hiçbirini tamamlayamadın. Vaka detaylarını tekrar inceleyip yeniden dene.';
  }
  const correctLabels = correctIdxs.map(i => TASK_SHORT_LABELS[i + 1]);
  const wrongLabels = nonCorrectIdxs.map(i => TASK_SHORT_LABELS[i + 1]);
  const parts: string[] = [];
  const joinedCorrect = joinTr(correctLabels);
  const capitalized = joinedCorrect.charAt(0).toUpperCase() + joinedCorrect.slice(1);
  parts.push(`${capitalized} ${correctLabels.length > 1 ? 'konularını' : 'konusunu'} doğru çözdün.`);
  if (wrongLabels.length) {
    parts.push(`${joinTr(wrongLabels)} ${wrongLabels.length > 1 ? 'konularını' : 'konusunu'} tekrar incelemelisin.`);
  }
  return parts.join(' ');
}

function emptyOrderState(): SlotAnswerState {
  return { slots: { '0': null, '1': null, '2': null }, locked: false, correct: null };
}

function emptyMatchState(): SlotAnswerState {
  return {
    slots: Object.fromEntries(TASK2.slots.map(s => [s.id, null as string | null])),
    locked: false,
    correct: null,
  };
}

function emptyMcqState(): McqAnswerState {
  return { selected: null, locked: false, correct: null };
}

// ── Small shared UI pieces ────────────────────────────────────────────────────

function ComplaintCard({ user, text }: { user: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-5">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-red-50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {user.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-800 text-sm">{user}</p>
          <p className="text-gray-400 text-xs">Destek Talebi · Az önce</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-red-500 font-bold text-xs bg-red-100 px-3 py-1 rounded-full flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" /> Şikâyet
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-gray-800 text-sm leading-relaxed italic">&ldquo;{text}&rdquo;</p>
      </div>
    </div>
  );
}

function FlowDiagram({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 mb-4">
      {labels.map((l, i) => (
        <Fragment key={l}>
          <span className="text-slate-200 text-xs sm:text-sm font-bold bg-slate-700/60 px-3 py-1.5 rounded-full">{l}</span>
          {i < labels.length - 1 && <span className="text-slate-500">→</span>}
        </Fragment>
      ))}
    </div>
  );
}

function DragChip({ card, locked }: { card: TaskCard; locked: boolean }) {
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
        whileHover={locked ? {} : { scale: 1.03, y: -2 }}
        whileTap={locked ? {} : { scale: 0.97 }}
        className="bg-slate-800 border-2 border-blue-600/50 rounded-xl px-4 py-3 text-white text-xs sm:text-sm font-semibold shadow-md select-none"
      >
        {card.label}
      </motion.div>
    </div>
  );
}

function DropTarget({
  slotKey,
  label,
  card,
  locked,
  reveal,
  onDrop,
  onClear,
  compact,
}: {
  slotKey: string;
  label: string;
  card: TaskCard | null;
  locked: boolean;
  reveal: 'correct' | 'wrong' | null;
  onDrop: (cardId: string, slotKey: string) => void;
  onClear: (slotKey: string) => void;
  compact?: boolean;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: CARD_TYPE,
      canDrop: () => !locked,
      drop: (item: { cardId: string }) => onDrop(item.cardId, slotKey),
      collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [locked, slotKey, onDrop]
  );

  let boxClass = 'border-dashed border-slate-600 bg-slate-800/50';
  if (reveal === 'correct') boxClass = 'border-solid border-emerald-500 bg-emerald-900/30';
  else if (reveal === 'wrong') boxClass = 'border-solid border-red-500 bg-red-900/30';
  else if (isOver && canDrop) boxClass = 'border-solid border-blue-400 bg-blue-900/30';
  else if (card) boxClass = 'border-solid border-slate-500 bg-slate-800';

  return (
    <div className={compact ? 'flex flex-col' : 'flex-1 min-w-0 flex flex-col'}>
      {label && (
        <div className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 text-center">
          {label}
        </div>
      )}
      <div
        ref={dropRef as any}
        className={`relative rounded-xl border-2 p-3 flex items-center justify-center text-center transition-colors ${
          compact ? 'min-h-[64px]' : 'min-h-[90px]'
        } ${boxClass}`}
      >
        {card ? (
          <>
            <p className="text-white text-xs sm:text-sm font-medium leading-snug px-1">{card.label}</p>
            {!locked && (
              <button
                type="button"
                onClick={() => onClear(slotKey)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-500 text-slate-300 text-xs leading-none flex items-center justify-center hover:bg-red-900/60 hover:border-red-500 hover:text-red-300"
              >
                ×
              </button>
            )}
            {reveal === 'correct' && (
              <CheckCircle2 className="absolute -bottom-2 -right-2 w-5 h-5 text-emerald-400 bg-slate-900 rounded-full" />
            )}
            {reveal === 'wrong' && (
              <XCircle className="absolute -bottom-2 -right-2 w-5 h-5 text-red-400 bg-slate-900 rounded-full" />
            )}
          </>
        ) : (
          <span className="text-slate-500 text-xs">Kartı buraya sürükle</span>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
      <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
      <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">{label}</p>
    </div>
  );
}

function TaskShell({
  taskNumber,
  title,
  children,
  footer,
  onPrev,
  onNext,
  canPrev,
  isLast,
}: {
  taskNumber: number;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  isLast: boolean;
}) {
  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
            Görev {taskNumber}
          </span>
          <span className="text-slate-500 text-xs">— {title}</span>
          <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
            25 puan
          </span>
        </div>

        {children}

        {footer}

        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Önceki Görev
          </button>
          {!isLast && (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white font-bold text-sm px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Sonraki Görev <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FinancialSystemQuest2({ onComplete, onBack }: FinancialSystemQuest2Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinishWarning, setShowFinishWarning] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const [task1, setTask1] = useState<SlotAnswerState>(emptyOrderState);
  const [task2, setTask2] = useState<SlotAnswerState>(emptyMatchState);
  const [task3, setTask3] = useState<SlotAnswerState>(emptyOrderState);
  const [task4, setTask4] = useState<McqAnswerState>(emptyMcqState);

  const [cardOrder1, setCardOrder1] = useState<string[]>(TASK1.cards.map(c => c.id));
  const [cardOrder2, setCardOrder2] = useState<string[]>(TASK2.cards.map(c => c.id));
  const [cardOrder3, setCardOrder3] = useState<string[]>(TASK3.cards.map(c => c.id));

  const finalizedRef = useRef(false);

  // ── Sayaç ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, EXAM_DURATION_MS - elapsedMs) : EXAM_DURATION_MS;

  const finalizeExam = () => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;

    const t1Correct = task1.locked ? task1.correct === true : checkOrder(task1.slots, TASK1.correctOrder);
    const t2Correct = task2.locked ? task2.correct === true : checkMatch(task2.slots, TASK2.slots);
    const t3Correct = task3.locked ? task3.correct === true : checkOrder(task3.slots, TASK3.correctOrder);
    const t4Correct = task4.locked ? task4.correct === true : task4.selected === TASK4.correctOptionId;

    setTask1(prev => (prev.locked ? prev : { ...prev, locked: true, correct: t1Correct }));
    setTask2(prev => (prev.locked ? prev : { ...prev, locked: true, correct: t2Correct }));
    setTask3(prev => (prev.locked ? prev : { ...prev, locked: true, correct: t3Correct }));
    setTask4(prev => (prev.locked ? prev : { ...prev, locked: true, correct: t4Correct }));

    const finalScore = [t1Correct, t2Correct, t3Correct, t4Correct].filter(Boolean).length * 25;
    if (onComplete) onComplete(finalScore);
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
    setTask1(emptyOrderState());
    setTask2(emptyMatchState());
    setTask3(emptyOrderState());
    setTask4(emptyMcqState());
    setCardOrder1(shuffle(TASK1.cards.map(c => c.id)));
    setCardOrder2(shuffle(TASK2.cards.map(c => c.id)));
    setCardOrder3(shuffle(TASK3.cards.map(c => c.id)));
    finalizedRef.current = false;
    setShowFinishWarning(false);
    setShowReview(false);
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setFinishedAt(null);
    setCurrentIndex(0);
    setTask1(emptyOrderState());
    setTask2(emptyMatchState());
    setTask3(emptyOrderState());
    setTask4(emptyMcqState());
    finalizedRef.current = false;
    setShowFinishWarning(false);
    setShowReview(false);
    setStage('intro');
  };

  const isTaskLocked = (i: number) => (i === 0 ? task1.locked : i === 1 ? task2.locked : i === 2 ? task3.locked : task4.locked);
  const lockedCount = [task1.locked, task2.locked, task3.locked, task4.locked].filter(Boolean).length;
  const liveScore =
    (task1.locked && task1.correct ? 25 : 0) +
    (task2.locked && task2.correct ? 25 : 0) +
    (task3.locked && task3.correct ? 25 : 0) +
    (task4.locked && task4.correct ? 25 : 0);

  const handleFinishClick = () => {
    const unanswered = [0, 1, 2, 3].filter(i => !isTaskLocked(i));
    if (unanswered.length > 0) {
      setShowFinishWarning(true);
      return;
    }
    finalizeExam();
  };

  const assignCard = (
    setter: React.Dispatch<React.SetStateAction<SlotAnswerState>>,
    cardId: string,
    slotKey: string
  ) => {
    setter(prev => {
      if (prev.locked) return prev;
      const cleared = withCardRemoved(prev.slots, cardId);
      return { ...prev, slots: { ...cleared, [slotKey]: cardId } };
    });
  };

  const clearSlot = (setter: React.Dispatch<React.SetStateAction<SlotAnswerState>>, slotKey: string) => {
    setter(prev => (prev.locked ? prev : { ...prev, slots: { ...prev.slots, [slotKey]: null } }));
  };

  const lockTask1 = () =>
    setTask1(prev => (prev.locked ? prev : { ...prev, locked: true, correct: checkOrder(prev.slots, TASK1.correctOrder) }));
  const lockTask2 = () =>
    setTask2(prev => (prev.locked ? prev : { ...prev, locked: true, correct: checkMatch(prev.slots, TASK2.slots) }));
  const lockTask3 = () =>
    setTask3(prev => (prev.locked ? prev : { ...prev, locked: true, correct: checkOrder(prev.slots, TASK3.correctOrder) }));

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Finansal Sistem Kavramlarını Keşfet-2</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">{STORY_TEXT}</p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Görev Bilgileri
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  '4 görev bulunmaktadır.',
                  'Her görev 25 puandır.',
                  "Toplam puan 100'dür.",
                  'Sınav süresi 20 dakikadır.',
                  'Yanlış veya boş cevaplar puan kazandırmaz.',
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-lg sm:text-xl py-4 px-10 sm:px-14 rounded-full shadow-xl border-b-4 border-purple-800 transition-all"
              >
                Göreve Başla 🚀
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const results = [
      { title: TASK1.title, correct: task1.correct === true, attempted: isSlotsAttempted(task1.slots), explanation: TASK1.incorrectFeedback },
      { title: TASK2.title, correct: task2.correct === true, attempted: isSlotsAttempted(task2.slots), explanation: TASK2.correctExplanation },
      { title: TASK3.title, correct: task3.correct === true, attempted: isSlotsAttempted(task3.slots), explanation: TASK3.correctExplanation },
      { title: TASK4.title, correct: task4.correct === true, attempted: task4.selected !== null, explanation: TASK4.correctExplanation },
    ];
    const correctIdxs = results.map((r, i) => (r.correct ? i : -1)).filter(i => i >= 0);
    const nonCorrectIdxs = results.map((r, i) => (!r.correct ? i : -1)).filter(i => i >= 0);
    const wrongCount = results.filter(r => !r.correct && r.attempted).length;
    const emptyCount = results.filter(r => !r.attempted).length;
    const score = correctIdxs.length * 25;
    const performance = getPerformance(score);
    const message = buildResultMessage(correctIdxs, nonCorrectIdxs);
    const usedMs = finishedAt && startedAt ? finishedAt - startedAt : 0;
    const remainingAtFinishMs = Math.max(0, EXAM_DURATION_MS - usedMs);

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
              <h2 className="text-3xl font-black text-white mb-1">Sistem Kontrolü Tamamlandı!</h2>
              <p className={`text-xl font-bold mb-4 ${performance.color}`}>{performance.label}</p>
              <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">{message}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl">
                {score} / 100 Puan
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <StatTile label="Doğru Görev" value={correctIdxs.length} color="text-emerald-400" />
              <StatTile label="Yanlış Görev" value={wrongCount} color="text-red-400" />
              <StatTile label="Boş Görev" value={emptyCount} color="text-slate-400" />
              <StatTile label="Kullanılan Süre" value={formatDuration(usedMs)} color="text-blue-400" />
              <StatTile label="Kalan Süre" value={formatDuration(remainingAtFinishMs)} color="text-amber-400" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <button
                onClick={() => setShowReview(v => !v)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base border border-slate-600 transition-all"
              >
                {showReview ? 'Cevapları Gizle' : 'Cevapları İncele'} 🔍
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3.5 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 transition-all"
              >
                Oyunu Tekrar Başlat 🔄
              </motion.button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-2xl text-sm sm:text-base border border-slate-700 transition-all"
                >
                  Ana Sayfaya Dön
                </button>
              )}
            </div>

            <AnimatePresence>
              {showReview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-6">
                    {results.map((r, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          !r.attempted
                            ? 'bg-slate-800/40 border-slate-700'
                            : r.correct
                            ? 'bg-emerald-900/30 border-emerald-700/40'
                            : 'bg-red-900/30 border-red-700/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!r.attempted ? (
                            <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                          ) : r.correct ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 text-xs mb-1">Görev {idx + 1}</p>
                            <p className="text-white text-sm font-bold mb-1">{r.title}</p>
                            {!r.attempted ? (
                              <p className="text-slate-500 text-xs">Bu görev cevaplanmadı.</p>
                            ) : (
                              !r.correct && <p className="text-slate-400 text-xs leading-relaxed">{r.explanation}</p>
                            )}
                          </div>
                          <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>
                            +{r.correct ? 25 : 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM ─────────────────────────────────────────────────────────────────
  const currentTask = TASKS[currentIndex];
  const pool1 = cardOrder1.filter(id => !Object.values(task1.slots).includes(id));
  const pool2 = cardOrder2.filter(id => !Object.values(task2.slots).includes(id));
  const pool3 = cardOrder3.filter(id => !Object.values(task3.slots).includes(id));
  const allFilled1 = isSlotsFilled(task1.slots);
  const allFilled2 = isSlotsFilled(task2.slots);
  const t3CurrentCorrect = checkOrder(task3.slots, TASK3.correctOrder);

  let taskBody: React.ReactNode = null;
  let taskFooter: React.ReactNode = null;

  if (currentTask.type === 'order' && currentTask.id === 1) {
    taskBody = (
      <>
        <ComplaintCard user={TASK1.complaintUser} text={TASK1.complaintText} />
        <p className="text-slate-300 text-sm mb-4">{TASK1.instruction}</p>
        <div className="mb-2 text-center text-slate-500 text-[11px] font-bold uppercase tracking-widest">
          {TASK1.pipelineLabel}
        </div>
        <div className="flex items-stretch gap-2 sm:gap-3 mb-5">
          {TASK1.slotLabels.map((label, idx) => (
            <Fragment key={idx}>
              <DropTarget
                slotKey={String(idx)}
                label={label}
                card={findCard(TASK1.cards, task1.slots[String(idx)])}
                locked={task1.locked}
                reveal={task1.locked ? (task1.slots[String(idx)] === TASK1.correctOrder[idx] ? 'correct' : 'wrong') : null}
                onDrop={(cardId, slotKey) => assignCard(setTask1, cardId, slotKey)}
                onClear={slotKey => clearSlot(setTask1, slotKey)}
              />
              {idx < TASK1.slotLabels.length - 1 && (
                <div className="flex items-center text-slate-500 font-black text-lg">→</div>
              )}
            </Fragment>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {pool1.map(id => (
            <DragChip key={id} card={findCard(TASK1.cards, id)!} locked={task1.locked} />
          ))}
        </div>
      </>
    );

    taskFooter = (
      <div className="mt-5">
        <div className="flex justify-center mb-3">
          <motion.button
            whileHover={!task1.locked && allFilled1 ? { scale: 1.02 } : {}}
            whileTap={!task1.locked && allFilled1 ? { scale: 0.98 } : {}}
            onClick={lockTask1}
            disabled={task1.locked || !allFilled1}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
          >
            {task1.locked ? 'Cevap Gönderildi' : 'Cevabı Onayla'}
          </motion.button>
        </div>
        <AnimatePresence>
          {task1.locked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl px-5 py-3 flex items-center gap-3 ${
                task1.correct ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
              }`}
            >
              {task1.correct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm font-bold ${task1.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                {task1.correct ? TASK1.correctFeedback : TASK1.incorrectFeedback} {task1.correct ? '+25 puan.' : '+0 puan.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  } else if (currentTask.type === 'match') {
    taskBody = (
      <>
        <ComplaintCard user={TASK2.complaintUser} text={TASK2.complaintText} />
        <p className="text-slate-300 text-sm mb-4">{TASK2.instruction}</p>
        <FlowDiagram labels={TASK2.flowLabels} />
        <div className="flex flex-col gap-3 mb-5">
          {TASK2.slots.map(slot => (
            <div key={slot.id} className="flex items-center gap-3">
              <div className="w-32 sm:w-52 flex-shrink-0 text-slate-300 text-[11px] sm:text-sm font-bold bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center leading-snug">
                {slot.label}
              </div>
              <div className="flex-1">
                <DropTarget
                  slotKey={slot.id}
                  label=""
                  compact
                  card={findCard(TASK2.cards, task2.slots[slot.id])}
                  locked={task2.locked}
                  reveal={task2.locked ? (task2.slots[slot.id] === slot.correctCardId ? 'correct' : 'wrong') : null}
                  onDrop={(cardId, slotKey) => assignCard(setTask2, cardId, slotKey)}
                  onClear={slotKey => clearSlot(setTask2, slotKey)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {pool2.map(id => (
            <DragChip key={id} card={findCard(TASK2.cards, id)!} locked={task2.locked} />
          ))}
        </div>
      </>
    );

    taskFooter = (
      <div className="mt-5">
        <div className="flex justify-center mb-3">
          <motion.button
            whileHover={!task2.locked && allFilled2 ? { scale: 1.02 } : {}}
            whileTap={!task2.locked && allFilled2 ? { scale: 0.98 } : {}}
            onClick={lockTask2}
            disabled={task2.locked || !allFilled2}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
          >
            {task2.locked ? 'Cevap Gönderildi' : 'Cevabı Onayla'}
          </motion.button>
        </div>
        <AnimatePresence>
          {task2.locked && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                className={`rounded-xl px-5 py-3 flex items-center gap-3 mb-3 ${
                  task2.correct ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                }`}
              >
                {task2.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <p className={`text-sm font-bold ${task2.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                  {task2.correct ? 'Tüm eşleştirmeler doğru!' : 'Bir veya daha fazla eşleştirme yanlış.'}{' '}
                  {task2.correct ? '+25 puan.' : '+0 puan.'}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <p className="text-slate-300 text-xs leading-relaxed">{TASK2.correctExplanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  } else if (currentTask.type === 'order_gate') {
    taskBody = (
      <>
        <ComplaintCard user={TASK3.complaintUser} text={TASK3.complaintText} />
        <p className="text-slate-300 text-sm mb-4">{TASK3.instruction}</p>
        <div className="flex items-stretch gap-2 sm:gap-3 mb-5">
          {TASK3.slotLabels.map((label, idx) => (
            <Fragment key={idx}>
              <DropTarget
                slotKey={String(idx)}
                label={label}
                card={findCard(TASK3.cards, task3.slots[String(idx)])}
                locked={task3.locked}
                reveal={task3.locked ? (task3.slots[String(idx)] === TASK3.correctOrder[idx] ? 'correct' : 'wrong') : null}
                onDrop={(cardId, slotKey) => assignCard(setTask3, cardId, slotKey)}
                onClear={slotKey => clearSlot(setTask3, slotKey)}
              />
              {idx < TASK3.slotLabels.length - 1 && (
                <div className="flex items-center text-slate-500 font-black text-lg">→</div>
              )}
            </Fragment>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {pool3.map(id => (
            <DragChip key={id} card={findCard(TASK3.cards, id)!} locked={task3.locked} />
          ))}
        </div>
      </>
    );

    taskFooter = (
      <div className="mt-5">
        <div className="flex justify-center mb-2">
          <motion.button
            whileHover={!task3.locked && t3CurrentCorrect ? { scale: 1.02 } : {}}
            whileTap={!task3.locked && t3CurrentCorrect ? { scale: 0.98 } : {}}
            onClick={lockTask3}
            disabled={task3.locked || !t3CurrentCorrect}
            className={`w-full sm:w-auto font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 transition-all flex items-center justify-center gap-2 mx-auto ${
              task3.locked
                ? 'bg-slate-700 text-slate-300 border-slate-800 cursor-not-allowed opacity-70'
                : t3CurrentCorrect
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-emerald-800'
                : 'bg-slate-700 text-slate-400 border-slate-800 opacity-60 cursor-not-allowed'
            }`}
          >
            {task3.locked ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Satın Alındı
              </>
            ) : t3CurrentCorrect ? (
              <>
                <Unlock className="w-4 h-4" /> {TASK3.gateButtonLabel}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> {TASK3.gateButtonLabel}
              </>
            )}
          </motion.button>
        </div>
        {!task3.locked && !t3CurrentCorrect && (
          <p className="text-center text-slate-500 text-xs mb-3">Doğru sıralamayı oluşturduğunda buton kilidi açılacak.</p>
        )}
        <AnimatePresence>
          {task3.locked && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                className={`rounded-xl px-5 py-3 flex items-center gap-3 mb-3 ${
                  task3.correct ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                }`}
              >
                {task3.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <p className={`text-sm font-bold ${task3.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                  {task3.correct ? 'Doğru sıralama! Hisse satın alma yolu açıldı.' : 'Yanlış sıralama.'}{' '}
                  {task3.correct ? '+25 puan.' : '+0 puan.'}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <p className="text-slate-300 text-xs leading-relaxed">{TASK3.correctExplanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  } else if (currentTask.type === 'mcq') {
    const centerIcons = ['🏛️', '🏢', '🏦'];
    taskBody = (
      <>
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-4">
          {TASK4.centers.map((c, i) => (
            <Fragment key={c}>
              <div className="flex flex-col items-center gap-1 w-20">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-700 to-purple-700 flex items-center justify-center text-xl">
                  {centerIcons[i]}
                </div>
                <span className="text-slate-300 text-[10px] sm:text-[11px] font-bold text-center leading-tight">{c}</span>
              </div>
              <span className="text-slate-500 text-lg">⇄</span>
            </Fragment>
          ))}
          <div className="flex flex-col items-center gap-1 w-20">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl border-2 border-amber-300/60">
              🧍
            </div>
            <span className="text-amber-300 text-[10px] sm:text-[11px] font-black">Birey</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-5">
          {TASK4.actions.map(a => (
            <span key={a} className="bg-slate-700/60 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-600">
              {a}
            </span>
          ))}
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{TASK4.questionIntro}</p>
        </div>

        <div className="bg-slate-800 rounded-xl px-5 py-4 border border-slate-700 mb-4">
          <p className="text-white font-bold text-sm sm:text-base">❓ {TASK4.question}</p>
        </div>

        <div className="flex flex-col gap-3">
          {TASK4.options.map(opt => {
            const isSelected = task4.selected === opt.id;
            const revealed = task4.locked;
            let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
            if (revealed && opt.id === TASK4.correctOptionId) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
            else if (revealed && isSelected) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
            else if (revealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';
            else if (isSelected) btnClass = 'bg-blue-900/40 border-blue-400 text-blue-100';

            return (
              <motion.button
                key={opt.id}
                whileHover={!revealed ? { scale: 1.005 } : {}}
                onClick={() => !task4.locked && setTask4(prev => ({ ...prev, selected: opt.id }))}
                disabled={revealed}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${btnClass}`}
              >
                <span className="font-black flex-shrink-0">{opt.id})</span>
                <span className="flex-1 text-sm">{opt.label}</span>
                {revealed && opt.id === TASK4.correctOptionId && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                {revealed && isSelected && opt.id !== TASK4.correctOptionId && (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      </>
    );

    taskFooter = (
      <div className="mt-5">
        <div className="flex justify-center mb-3">
          <motion.button
            whileHover={!task4.locked && task4.selected ? { scale: 1.02 } : {}}
            whileTap={!task4.locked && task4.selected ? { scale: 0.98 } : {}}
            onClick={() =>
              setTask4(prev => (prev.locked ? prev : { ...prev, locked: true, correct: prev.selected === TASK4.correctOptionId }))
            }
            disabled={task4.locked || !task4.selected}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
          >
            {task4.locked ? 'Cevap Gönderildi' : 'Cevabı Onayla'}
          </motion.button>
        </div>
        <AnimatePresence>
          {task4.locked && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                className={`rounded-xl px-5 py-3 flex items-center gap-3 mb-3 ${
                  task4.correct ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                }`}
              >
                {task4.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <p className={`text-sm font-bold ${task4.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                  {task4.correct ? 'Doğru!' : 'Yanlış cevap.'} {task4.correct ? '+25 puan.' : '+0 puan.'}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <p className="text-slate-300 text-xs leading-relaxed">{TASK4.correctExplanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-4xl mx-auto">
        {/* Üst bilgi çubuğu */}
        <div className="sticky top-0 z-10 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                  FinEdu
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Kavramları Keşfet-2</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                  Soru {currentIndex + 1}/4
                </span>
                <span className="bg-blue-900/60 text-blue-300 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border border-blue-700/60">
                  Puan: {liveScore}/100
                </span>
                <motion.span
                  animate={remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ repeat: remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? Infinity : 0, duration: 1 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border ${
                    remainingMs <= LOW_TIME_THRESHOLD_MS
                      ? 'bg-red-900/60 text-red-300 border-red-600/60'
                      : 'bg-slate-700/60 text-slate-200 border-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Kalan Süre: {formatCountdown(remainingMs)}
                </motion.span>
                <button
                  onClick={handleFinishClick}
                  className="flex items-center gap-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700/50 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Sınavı Bitir
                </button>
              </div>
            </div>

            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(lockedCount / 4) * 100}%` }}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              {[0, 1, 2, 3].map(i => {
                const locked = isTaskLocked(i);
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-current={i === currentIndex}
                    aria-label={`Görev ${i + 1} — ${locked ? 'cevaplandı' : 'cevaplanmadı'}`}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 transition-all ${
                      i === currentIndex
                        ? 'border-blue-400 bg-blue-900/60 text-blue-200'
                        : locked
                        ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {locked ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Görev içeriği */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <TaskShell
              taskNumber={currentIndex + 1}
              title={currentTask.title}
              onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
              onNext={() => setCurrentIndex(i => Math.min(3, i + 1))}
              canPrev={currentIndex > 0}
              isLast={currentIndex === 3}
              footer={taskFooter}
            >
              {taskBody}
            </TaskShell>
          </motion.div>
        </AnimatePresence>

        {/* Cevaplanmamış soru uyarısı */}
        <AnimatePresence>
          {showFinishWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <h3 className="text-white font-black text-lg">Cevaplanmamış Görevler Var</h3>
                </div>
                <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                  {[0, 1, 2, 3]
                    .filter(i => !isTaskLocked(i))
                    .map(i => i + 1)
                    .join(', ')}{' '}
                  numaralı görev(ler) cevaplanmadı. Bu görevler 0 puan olarak değerlendirilecek. Yine de sınavı bitirmek istiyor
                  musunuz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFinishWarning(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl text-sm border border-slate-700 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => {
                      setShowFinishWarning(false);
                      finalizeExam();
                    }}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black py-3 rounded-xl text-sm shadow-lg transition-colors"
                  >
                    Yine de Bitir
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}
