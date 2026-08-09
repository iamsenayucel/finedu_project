import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle, GripVertical, Lock } from 'lucide-react';
import {
  GAME_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_CARD,
  TOTAL_CARD_POINTS,
  POINTS_PER_QUESTION,
  TOTAL_QUESTION_POINTS,
  TOTAL_POINTS,
  BASKETS,
  SOURCE_CARDS,
  SECTION1_TITLE,
  SECTION1_INSTRUCTION,
  SECTION2_TITLE,
  SECTION2_INSTRUCTION,
  SECTION2_QUESTIONS,
  getPerformance,
  type BasketId,
} from './data/informationFilterData';

interface InformationFilterProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type FinishReason = 'timeout' | 'user';

const CARD_TYPE = 'SOURCE_CARD';

const BASKET_ACTIVE_STYLES: Record<BasketId, string> = {
  reliable: 'border-emerald-400 bg-emerald-900/20',
  suspicious: 'border-amber-400 bg-amber-900/20',
  manipulative: 'border-red-400 bg-red-900/20',
};

interface CardResult {
  cardId: number;
  placed: BasketId | null;
  correct: boolean;
  points: number;
}

interface QuestionResult {
  questionId: number;
  selected: string | null;
  correct: boolean;
  points: number;
}

interface ExamResults {
  cardResults: CardResult[];
  cardsCorrect: number;
  cardsWrong: number;
  cardsBlank: number;
  cardScore: number;
  questionResults: QuestionResult[];
  questionsCorrect: number;
  questionsWrong: number;
  questionsBlank: number;
  questionScore: number;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalScore: number;
  usedMs: number;
  remainingMs: number;
  reason: FinishReason;
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

function NavPills({
  count,
  currentIndex,
  answeredIndexes,
  onJump,
}: {
  count: number;
  currentIndex: number;
  answeredIndexes: boolean[];
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 transition-colors ${
            i === currentIndex
              ? 'border-blue-400 bg-blue-900/60 text-blue-200'
              : answeredIndexes[i]
              ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
              : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
          }`}
        >
          {answeredIndexes[i] && i !== currentIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
        </button>
      ))}
    </div>
  );
}

// ── Sürüklenebilir kaynak kartı ──────────────────────────────────────────────
function SourceCardBox({
  card,
  locked,
  result,
}: {
  card: (typeof SOURCE_CARDS)[number];
  locked: boolean;
  result?: CardResult;
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: CARD_TYPE,
      item: { id: card.id },
      canDrag: !locked,
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [locked, card.id]
  );

  let borderClass = 'border-slate-600 bg-slate-800';
  if (result) {
    borderClass = result.correct ? 'border-emerald-500 bg-emerald-900/30' : 'border-red-500 bg-red-900/30';
  }

  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`select-none ${locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className={`rounded-xl border-2 px-4 py-3 transition-colors ${borderClass}`}>
        <div className="flex items-start gap-2">
          {!locked && <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />}
          {result &&
            (result.correct ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            ))}
          <p className="text-slate-100 text-xs sm:text-sm leading-relaxed">{card.text}</p>
        </div>
        {result && (
          <p className={`mt-2 text-xs leading-relaxed pl-6 ${result.correct ? 'text-emerald-300' : 'text-red-300'}`}>
            {card.explanation}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sepet bırakma alanı ──────────────────────────────────────────────────────
function BasketDropZone({
  basket,
  cardsInBasket,
  locked,
  onDropCard,
  results,
}: {
  basket: (typeof BASKETS)[number];
  cardsInBasket: (typeof SOURCE_CARDS)[number][];
  locked: boolean;
  onDropCard: (cardId: number, basketId: BasketId) => void;
  results: CardResult[] | null;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: CARD_TYPE,
      canDrop: () => !locked,
      drop: (dragged: { id: number }) => onDropCard(dragged.id, basket.id),
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [locked, onDropCard, basket.id]
  );

  const activeHighlight =
    isOver && canDrop ? BASKET_ACTIVE_STYLES[basket.id] : 'border-slate-700 bg-slate-800/60';

  return (
    <div ref={drop as any} className={`rounded-2xl border-2 p-4 min-h-[160px] flex flex-col gap-3 transition-colors ${activeHighlight}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{basket.icon}</span>
        <span className="text-white font-black text-sm">{basket.label}</span>
        <span className="ml-auto text-slate-400 text-xs font-bold">{cardsInBasket.length} kart</span>
      </div>
      {cardsInBasket.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic py-6 border-2 border-dashed border-slate-700 rounded-xl">
          Kartı buraya sürükle
        </div>
      )}
      <div className="flex flex-col gap-2">
        {cardsInBasket.map((card) => (
          <SourceCardBox key={card.id} card={card} locked={locked} result={results?.find((r) => r.cardId === card.id)} />
        ))}
      </div>
    </div>
  );
}

export default function InformationFilter({ onComplete, onBack }: InformationFilterProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [activeSection, setActiveSection] = useState<1 | 2>(1);

  const [placements, setPlacements] = useState<Record<number, BasketId | null>>(() =>
    Object.fromEntries(SOURCE_CARDS.map((c) => [c.id, null]))
  );
  const [checked1, setChecked1] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers2, setAnswers2] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null]))
  );

  const [blankWarning, setBlankWarning] = useState(false);
  const [results, setResults] = useState<ExamResults | null>(null);

  const finalizedRef = useRef(false);

  // ── Sayaç: oyun başladığında çalışır, iki bölüm boyunca kesintisiz devam eder ──
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, GAME_DURATION_MS - elapsedMs) : GAME_DURATION_MS;

  const buildResults = (reason: FinishReason, usedMs: number): ExamResults => {
    const cardResults: CardResult[] = SOURCE_CARDS.map((c) => {
      const placed = placements[c.id];
      const correct = placed !== null && placed === c.correctBasket;
      return { cardId: c.id, placed, correct, points: correct ? POINTS_PER_CARD : 0 };
    });
    const cardsCorrect = cardResults.filter((r) => r.correct).length;
    const cardsBlank = cardResults.filter((r) => r.placed === null).length;
    const cardsWrong = cardResults.length - cardsCorrect - cardsBlank;
    const cardScore = cardsCorrect * POINTS_PER_CARD;

    const questionResults: QuestionResult[] = SECTION2_QUESTIONS.map((q) => {
      const selected = answers2[q.id];
      const correct = selected !== null && selected === q.correctOptionId;
      return { questionId: q.id, selected, correct, points: correct ? q.points : 0 };
    });
    const questionsCorrect = questionResults.filter((r) => r.correct).length;
    const questionsBlank = questionResults.filter((r) => r.selected === null).length;
    const questionsWrong = questionResults.length - questionsCorrect - questionsBlank;
    const questionScore = questionResults.reduce((sum, r) => sum + r.points, 0);

    const totalScore = Math.max(0, Math.min(TOTAL_POINTS, cardScore + questionScore));

    return {
      cardResults,
      cardsCorrect,
      cardsWrong,
      cardsBlank,
      cardScore,
      questionResults,
      questionsCorrect,
      questionsWrong,
      questionsBlank,
      questionScore,
      totalCorrect: cardsCorrect + questionsCorrect,
      totalWrong: cardsWrong + questionsWrong,
      totalBlank: cardsBlank + questionsBlank,
      totalScore,
      usedMs,
      remainingMs: Math.max(0, GAME_DURATION_MS - usedMs),
      reason,
    };
  };

  const finalizeGame = (reason: FinishReason) => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    const finishedAt = Date.now();
    const usedMs = startedAt !== null ? finishedAt - startedAt : 0;
    const finalResults = buildResults(reason, usedMs);
    setResults(finalResults);
    if (onComplete) onComplete(finalResults.totalScore);
    setBlankWarning(false);
    setStage('finished');
  };

  useEffect(() => {
    if (stage === 'exam' && startedAt !== null && remainingMs <= 0) {
      finalizeGame('timeout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, stage]);

  const handleStart = () => {
    const start = Date.now();
    setStartedAt(start);
    setNowTick(start);
    setActiveSection(1);
    setPlacements(Object.fromEntries(SOURCE_CARDS.map((c) => [c.id, null])));
    setChecked1(false);
    setQuestionIndex(0);
    setAnswers2(Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null])));
    setResults(null);
    finalizedRef.current = false;
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setActiveSection(1);
    setPlacements(Object.fromEntries(SOURCE_CARDS.map((c) => [c.id, null])));
    setChecked1(false);
    setQuestionIndex(0);
    setAnswers2(Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null])));
    setResults(null);
    setBlankWarning(false);
    finalizedRef.current = false;
    setStage('intro');
  };

  const handleDropCard = useCallback(
    (cardId: number, basketId: BasketId) => {
      if (checked1) return;
      setPlacements((prev) => ({ ...prev, [cardId]: basketId }));
    },
    [checked1]
  );

  const placedCount = useMemo(() => Object.values(placements).filter((v) => v !== null).length, [placements]);
  const allPlaced = placedCount === SOURCE_CARDS.length;

  const liveCardResults: CardResult[] = useMemo(
    () =>
      SOURCE_CARDS.map((c) => {
        const placed = placements[c.id];
        const correct = placed !== null && placed === c.correctBasket;
        return { cardId: c.id, placed, correct, points: correct ? POINTS_PER_CARD : 0 };
      }),
    [placements]
  );
  const cardScoreSoFar = liveCardResults.filter((r) => r.correct).length * POINTS_PER_CARD;

  const handleCheckSection1 = () => {
    if (!allPlaced) return;
    setChecked1(true);
  };

  const selectOption = (questionId: number, optionId: string) => {
    setAnswers2((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const answered2 = useMemo(() => SECTION2_QUESTIONS.map((q) => answers2[q.id] !== null), [answers2]);
  const allQuestionsAnswered = answered2.every(Boolean);
  const totalAnswered = placedCount + answered2.filter(Boolean).length;
  const totalItems = SOURCE_CARDS.length + SECTION2_QUESTIONS.length;

  const attemptSubmitTest = () => {
    if (!allQuestionsAnswered) {
      setBlankWarning(true);
      return;
    }
    finalizeGame('user');
  };

  const currentQuestion = SECTION2_QUESTIONS[questionIndex];

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
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Bilgi Filtresi</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Karşına çıkan finansal içeriklerin kaynak güvenilirliğini analiz et; ardından finansal okuryazarlık
                testini çöz.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  `Oyun iki bölümden oluşur: Bölüm 1 - ${SECTION1_TITLE}, Bölüm 2 - ${SECTION2_TITLE}.`,
                  `Bölüm 1'de 5 vaka vardır. Her kartı sürükleyerek "Güvenilir Kaynak", "Şüpheli Kaynak" ya da "Manipülatif / Reklam" panosuna bırakırsın. Bırakınca yanlış olursa kartı istediğin an başka bir panoya taşıyabilirsin. 5 vakanın tamamını yerleştirdikten sonra "Cevapları Kontrol Et" ile sonuçlar kesinleşir. Doğru sınıflandırma ${POINTS_PER_CARD} puan, toplam ${TOTAL_CARD_POINTS} puandır.`,
                  `Bölüm 2'de 5 seçenekli 4 soru vardır. Doğru cevap ${POINTS_PER_QUESTION} puan, toplam ${TOTAL_QUESTION_POINTS} puandır. Testi teslim edebilmek için tüm soruları cevaplamış olman gerekir; boş soru varsa sistem seni uyarır.`,
                  `Toplam süre ${GAME_DURATION_MS / 60000} dakikadır ve oyun başladığında kesintisiz işlemeye başlar. Bölümler arasında geçiş süreyi durdurmaz veya sıfırlamaz.`,
                  'Süre dolduğunda oyun o ana kadarki cevaplarınla otomatik olarak tamamlanır; yerleştirilmemiş kartlar ve boş sorular 0 puan alır.',
                  `Toplam puan ${TOTAL_POINTS}'dir. Bölüm 1 kesinleştikten ve oyun tamamlandıktan sonra cevaplar değiştirilemez.`,
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
  if (stage === 'finished' && results) {
    const performance = getPerformance(results.totalScore);

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
              <p className={`text-xl font-bold mb-1 ${performance.color}`}>{performance.label}</p>
              <p className="text-slate-400 text-xs mb-4">
                {results.reason === 'timeout' ? 'Süre dolduğu için otomatik tamamlandı.' : 'Tarafınızca tamamlandı.'}
              </p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl">
                {results.totalScore} / {TOTAL_POINTS} Puan
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <StatTile label="Bölüm 1 Puanı" value={`${results.cardScore}/${TOTAL_CARD_POINTS}`} color="text-emerald-400" />
              <StatTile label="Bölüm 2 Puanı" value={`${results.questionScore}/${TOTAL_QUESTION_POINTS}`} color="text-blue-400" />
              <StatTile label="Kullanılan Süre" value={formatDuration(results.usedMs)} color="text-amber-400" />
              <StatTile label="Kalan Süre" value={formatDuration(results.remainingMs)} color="text-purple-400" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatTile label="Toplam Doğru" value={results.totalCorrect} color="text-emerald-400" />
              <StatTile label="Toplam Yanlış" value={results.totalWrong} color="text-red-400" />
              <StatTile label="Toplam Boş" value={results.totalBlank} color="text-slate-400" />
            </div>

            {/* Bölüm 1 sonuçları */}
            <div className="mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Bölüm 1 · {SECTION1_TITLE} ({results.cardsCorrect}/{SOURCE_CARDS.length} doğru)
              </h3>
              <div className="space-y-2">
                {SOURCE_CARDS.map((c) => {
                  const r = results.cardResults.find((x) => x.cardId === c.id)!;
                  const placedLabel = r.placed ? BASKETS.find((b) => b.id === r.placed)?.label : null;
                  const correctLabel = BASKETS.find((b) => b.id === c.correctBasket)?.label;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        r.placed === null
                          ? 'bg-slate-800/40 border-slate-700'
                          : r.correct
                          ? 'bg-emerald-900/30 border-emerald-700/40'
                          : 'bg-red-900/30 border-red-700/40'
                      }`}
                    >
                      {r.placed === null ? (
                        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      ) : r.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs mb-1">Kart {c.id}</p>
                        <p className="text-white text-xs sm:text-sm font-medium mb-1">{c.text}</p>
                        {r.placed === null ? (
                          <p className="text-slate-500 text-xs mb-1">Bu kart yerleştirilmedi.</p>
                        ) : (
                          <p className="text-slate-300 text-xs mb-1">
                            Seçtiğin: <span className="font-semibold">{placedLabel}</span>
                            {!r.correct && (
                              <>
                                {' '}
                                · Doğrusu: <span className="text-emerald-300 font-semibold">{correctLabel}</span>
                              </>
                            )}
                          </p>
                        )}
                        <p className="text-slate-400 text-xs leading-relaxed">{c.explanation}</p>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>
                        +{r.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bölüm 2 sonuçları */}
            <div className="space-y-3 mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Bölüm 2 · {SECTION2_TITLE} ({results.questionsCorrect}/{SECTION2_QUESTIONS.length} doğru)
              </h3>
              {SECTION2_QUESTIONS.map((q, idx) => {
                const r = results.questionResults.find((x) => x.questionId === q.id)!;
                const correctOption = q.options.find((o) => o.id === q.correctOptionId)!;
                const selectedOption = r.selected ? q.options.find((o) => o.id === r.selected) : null;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      r.selected === null ? 'bg-slate-800/40 border-slate-700' : r.correct ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {r.selected === null ? (
                        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      ) : r.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs mb-1">Soru {idx + 1}</p>
                        {r.selected === null ? (
                          <p className="text-slate-500 text-xs">Bu soru cevaplanmadı.</p>
                        ) : (
                          <>
                            <p className="text-white text-sm font-medium mb-1">
                              Seçtiğin: {r.selected}) {selectedOption?.label}
                            </p>
                            {!r.correct && (
                              <p className="text-emerald-300 text-xs mb-1">
                                Doğrusu: {q.correctOptionId}) {correctOption.label}
                              </p>
                            )}
                          </>
                        )}
                        <p className="text-slate-400 text-xs leading-relaxed">{q.explanation}</p>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>+{r.points}</span>
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
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Üst bilgi çubuğu */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
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
              <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Bilgi Filtresi</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                Cevaplanan {totalAnswered} / {totalItems}
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
            </div>
          </div>

          {/* Bölüm sekmeleri */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection(1)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-colors ${
                activeSection === 1 ? 'border-blue-400 bg-blue-900/50 text-blue-100' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              Bölüm 1 · {SECTION1_TITLE} ({placedCount}/{SOURCE_CARDS.length})
            </button>
            <button
              type="button"
              disabled={!checked1}
              onClick={() => checked1 && setActiveSection(2)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-colors flex items-center justify-center gap-1.5 ${
                !checked1
                  ? 'border-slate-800 bg-slate-800/50 text-slate-600 cursor-not-allowed'
                  : activeSection === 2
                  ? 'border-blue-400 bg-blue-900/50 text-blue-100'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {!checked1 && <Lock className="w-3 h-3" />}
              Bölüm 2 · {SECTION2_TITLE} ({answered2.filter(Boolean).length}/{SECTION2_QUESTIONS.length})
            </button>
          </div>

          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(totalAnswered / totalItems) * 100}%` }}
            />
          </div>

          {activeSection === 2 && (
            <div className="mt-3">
              <NavPills count={SECTION2_QUESTIONS.length} currentIndex={questionIndex} answeredIndexes={answered2} onJump={setQuestionIndex} />
            </div>
          )}
        </div>
      </div>

      {/* Görev kartı */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeSection === 1 ? (
              <motion.div key="section1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                    {placedCount} / {SOURCE_CARDS.length} kart yerleştirildi
                  </span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {POINTS_PER_CARD} puan / kart
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION1_INSTRUCTION}</p>

                <DndProvider backend={HTML5Backend}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    {BASKETS.map((basket) => (
                      <BasketDropZone
                        key={basket.id}
                        basket={basket}
                        cardsInBasket={SOURCE_CARDS.filter((c) => placements[c.id] === basket.id)}
                        locked={checked1}
                        onDropCard={handleDropCard}
                        results={checked1 ? liveCardResults : null}
                      />
                    ))}
                  </div>

                  {!allPlaced && (
                    <div className="mb-5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Kaynak Kartları</p>
                      <div className="flex flex-col gap-2">
                        {SOURCE_CARDS.filter((c) => placements[c.id] === null).map((card) => (
                          <SourceCardBox key={card.id} card={card} locked={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </DndProvider>

                {checked1 ? (
                  <div className="rounded-xl px-5 py-3 mb-4 bg-emerald-900/40 border border-emerald-600/40 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-emerald-300 text-sm font-bold">Bölüm 1 Puanı: {cardScoreSoFar} / {TOTAL_CARD_POINTS}</span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(2)}
                      className="px-6 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border-b-4 border-purple-800 transition-all"
                    >
                      Bölüm 2'ye Geç →
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={allPlaced ? { scale: 1.02 } : {}}
                    whileTap={allPlaced ? { scale: 0.98 } : {}}
                    disabled={!allPlaced}
                    onClick={handleCheckSection1}
                    className={`w-full py-4 rounded-2xl text-lg font-black shadow-lg transition-all ${
                      allPlaced
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-b-4 border-purple-800'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {allPlaced ? 'Cevapları Kontrol Et ✅' : `Tüm kartları yerleştir (${placedCount}/${SOURCE_CARDS.length})`}
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`question-${questionIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                    Soru {questionIndex + 1} / {SECTION2_QUESTIONS.length}
                  </span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {currentQuestion.points} puan
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION2_INSTRUCTION}</p>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">{currentQuestion.prompt}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers2[currentQuestion.id] === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.005 }}
                        onClick={() => selectOption(currentQuestion.id, option.id)}
                        className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${
                          isSelected ? 'bg-blue-900/40 border-blue-400 text-blue-100' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
                        }`}
                      >
                        <span className="font-black flex-shrink-0">{option.id})</span>
                        <span className="flex-1 text-sm">{option.label}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 mt-6">
                  <button
                    type="button"
                    disabled={questionIndex === 0}
                    onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                    className="px-5 py-3 rounded-xl text-sm font-bold border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Önceki
                  </button>
                  {questionIndex < SECTION2_QUESTIONS.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setQuestionIndex((i) => i + 1)}
                      className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border-b-4 border-purple-800 transition-all"
                    >
                      Sonraki Soru →
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={attemptSubmitTest}
                      className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-lg border-b-4 border-blue-800 transition-all"
                    >
                      Testi Teslim Et 🏁
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Boş soru uyarısı */}
      <AnimatePresence>
        {blankWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-white font-black text-lg mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Boş sorular var
              </h3>
              <p className="text-slate-400 text-sm mb-5">
                Testi teslim edebilmek için {SECTION2_QUESTIONS.length - answered2.filter(Boolean).length} soruyu daha
                cevaplaman gerekiyor.
              </p>
              <button
                type="button"
                onClick={() => setBlankWarning(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3 rounded-xl text-sm shadow-lg border-b-4 border-purple-800 transition-all"
              >
                Tamam, Devam Et
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
