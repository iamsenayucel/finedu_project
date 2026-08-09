import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Clock, CheckCircle2, XCircle, AlertTriangle, Lock } from 'lucide-react';
import {
  GAME_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_CASE,
  TOTAL_CASE_POINTS,
  POINTS_PER_QUESTION,
  TOTAL_QUESTION_POINTS,
  TOTAL_POINTS,
  MARKET_CYCLES,
  MARKET_CASES,
  SECTION1_TITLE,
  SECTION1_INSTRUCTION,
  SECTION2_TITLE,
  SECTION2_INSTRUCTION,
  SECTION2_QUESTIONS,
  getPerformance,
  type MarketCycleId,
} from './data/marketDetectiveData';

interface MarketDetectiveProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type FinishReason = 'timeout' | 'completed';

interface CaseResult {
  caseId: number;
  selected: MarketCycleId | null;
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
  caseResults: CaseResult[];
  casesCorrect: number;
  casesWrong: number;
  casesBlank: number;
  caseScore: number;
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

const TOTAL_ITEMS = MARKET_CASES.length + SECTION2_QUESTIONS.length;

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

export default function MarketDetective({ onComplete, onBack }: MarketDetectiveProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [phase, setPhase] = useState<1 | 2>(1);
  const [caseIndex, setCaseIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [answers1, setAnswers1] = useState<Record<number, MarketCycleId | null>>(() =>
    Object.fromEntries(MARKET_CASES.map((c) => [c.id, null]))
  );
  const [answers2, setAnswers2] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null]))
  );

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
    const caseResults: CaseResult[] = MARKET_CASES.map((c) => {
      const selected = answers1[c.id];
      const correct = selected !== null && selected === c.correctCycle;
      return { caseId: c.id, selected, correct, points: correct ? POINTS_PER_CASE : 0 };
    });
    const casesCorrect = caseResults.filter((r) => r.correct).length;
    const casesBlank = caseResults.filter((r) => r.selected === null).length;
    const casesWrong = caseResults.length - casesCorrect - casesBlank;
    const caseScore = casesCorrect * POINTS_PER_CASE;

    const questionResults: QuestionResult[] = SECTION2_QUESTIONS.map((q) => {
      const selected = answers2[q.id];
      const correct = selected !== null && selected === q.correctOptionId;
      return { questionId: q.id, selected, correct, points: correct ? q.points : 0 };
    });
    const questionsCorrect = questionResults.filter((r) => r.correct).length;
    const questionsBlank = questionResults.filter((r) => r.selected === null).length;
    const questionsWrong = questionResults.length - questionsCorrect - questionsBlank;
    const questionScore = questionResults.reduce((sum, r) => sum + r.points, 0);

    const totalScore = Math.max(0, Math.min(TOTAL_POINTS, caseScore + questionScore));

    return {
      caseResults,
      casesCorrect,
      casesWrong,
      casesBlank,
      caseScore,
      questionResults,
      questionsCorrect,
      questionsWrong,
      questionsBlank,
      questionScore,
      totalCorrect: casesCorrect + questionsCorrect,
      totalWrong: casesWrong + questionsWrong,
      totalBlank: casesBlank + questionsBlank,
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
    setPhase(1);
    setCaseIndex(0);
    setQuestionIndex(0);
    setRevealed(false);
    setAnswers1(Object.fromEntries(MARKET_CASES.map((c) => [c.id, null])));
    setAnswers2(Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null])));
    setResults(null);
    finalizedRef.current = false;
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setPhase(1);
    setCaseIndex(0);
    setQuestionIndex(0);
    setRevealed(false);
    setAnswers1(Object.fromEntries(MARKET_CASES.map((c) => [c.id, null])));
    setAnswers2(Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null])));
    setResults(null);
    finalizedRef.current = false;
    setStage('intro');
  };

  const currentCase = MARKET_CASES[caseIndex];
  const currentQuestion = SECTION2_QUESTIONS[questionIndex];

  const selectCycle = (cycleId: MarketCycleId) => {
    if (revealed) return;
    setAnswers1((prev) => ({ ...prev, [currentCase.id]: cycleId }));
    setRevealed(true);
  };

  const selectOption = (optionId: string) => {
    if (revealed) return;
    setAnswers2((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    setRevealed(true);
  };

  const handleNext = () => {
    setRevealed(false);
    if (phase === 1) {
      if (caseIndex < MARKET_CASES.length - 1) {
        setCaseIndex((i) => i + 1);
      } else {
        setPhase(2);
      }
    } else {
      if (questionIndex < SECTION2_QUESTIONS.length - 1) {
        setQuestionIndex((i) => i + 1);
      } else {
        finalizeGame('completed');
      }
    }
  };

  const casesAnswered = useMemo(() => Object.values(answers1).filter((v) => v !== null).length, [answers1]);
  const questionsAnswered = useMemo(() => Object.values(answers2).filter((v) => v !== null).length, [answers2]);
  const totalAnswered = casesAnswered + questionsAnswered;

  const liveScore = useMemo(() => {
    let score = 0;
    MARKET_CASES.forEach((c) => {
      if (answers1[c.id] === c.correctCycle) score += POINTS_PER_CASE;
    });
    SECTION2_QUESTIONS.forEach((q) => {
      if (answers2[q.id] === q.correctOptionId) score += q.points;
    });
    return score;
  }, [answers1, answers2]);

  const selectedCycle = revealed ? answers1[currentCase?.id] : null;
  const selectedOption = revealed ? answers2[currentQuestion?.id] : null;

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Piyasa Dedektifi 🐂🐻</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Piyasa senaryolarından hangi döngüde olduğumuzu tespit et, ardından davranışsal finans bitirme testini çöz.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  `Oyun iki bölümden oluşur: Bölüm 1 - ${SECTION1_TITLE}, Bölüm 2 - ${SECTION2_TITLE}.`,
                  `Bölüm 1'de 5 piyasa vakası vardır. Her vaka için Boğa Piyasası, Ayı Piyasası ya da Yatay Piyasa seçeneklerinden birini işaretlersin. Doğru cevap ${POINTS_PER_CASE} puan, toplam ${TOTAL_CASE_POINTS} puandır.`,
                  `Bölüm 2'de A-E seçenekli 5 soru vardır. Doğru cevap ${POINTS_PER_QUESTION} puan, toplam ${TOTAL_QUESTION_POINTS} puandır.`,
                  'Her vaka veya soruyu cevapladığın anda doğru mu yanlış mı olduğunu ve açıklamasını görürsün, ardından sıradakine geçersin. Cevap verdikten sonra o vaka/soruya geri dönüp değiştiremezsin.',
                  `Toplam süre ${GAME_DURATION_MS / 60000} dakikadır ve oyun başladığında kesintisiz işlemeye başlar. İki bölüm aynı süreyi paylaşır, bölüm geçişinde sayaç sıfırlanmaz.`,
                  'Süre dolduğunda oyun o ana kadarki cevaplarınla otomatik olarak tamamlanır; cevaplanmamış vaka ve sorular 0 puan alır.',
                  `Toplam puan ${TOTAL_POINTS}'dir.`,
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
              <StatTile label="Bölüm 1 Puanı" value={`${results.caseScore}/${TOTAL_CASE_POINTS}`} color="text-emerald-400" />
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
                Bölüm 1 · {SECTION1_TITLE} ({results.casesCorrect}/{MARKET_CASES.length} doğru)
              </h3>
              <div className="space-y-2">
                {MARKET_CASES.map((c) => {
                  const r = results.caseResults.find((x) => x.caseId === c.id)!;
                  const selectedLabel = r.selected ? MARKET_CYCLES.find((m) => m.id === r.selected)?.label : null;
                  const correctLabel = MARKET_CYCLES.find((m) => m.id === c.correctCycle)?.label;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        r.selected === null
                          ? 'bg-slate-800/40 border-slate-700'
                          : r.correct
                          ? 'bg-emerald-900/30 border-emerald-700/40'
                          : 'bg-red-900/30 border-red-700/40'
                      }`}
                    >
                      {r.selected === null ? (
                        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      ) : r.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs mb-1">{c.title}</p>
                        {r.selected === null ? (
                          <p className="text-slate-500 text-xs mb-1">Bu vaka cevaplanmadı.</p>
                        ) : (
                          <p className="text-slate-300 text-xs mb-1">
                            Seçtiğin: <span className="font-semibold">{selectedLabel}</span>
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
                const selectedOpt = r.selected ? q.options.find((o) => o.id === r.selected) : null;

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
                              Seçtiğin: {r.selected}) {selectedOpt?.label}
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
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                FinEdu
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Piyasa Dedektifi</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                Cevaplanan {totalAnswered} / {TOTAL_ITEMS}
              </span>
              <span className="bg-blue-900/60 text-blue-300 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border border-blue-700/60">
                🔍 {liveScore} puan
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

          {/* Bölüm göstergesi */}
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-colors ${
                phase === 1 ? 'border-blue-400 bg-blue-900/50 text-blue-100' : 'border-emerald-600 bg-emerald-900/30 text-emerald-300'
              }`}
            >
              {phase > 1 && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
              Bölüm 1 · {SECTION1_TITLE} ({casesAnswered}/{MARKET_CASES.length})
            </div>
            <div
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-colors flex items-center justify-center gap-1.5 ${
                phase === 1
                  ? 'border-slate-800 bg-slate-800/50 text-slate-600'
                  : 'border-blue-400 bg-blue-900/50 text-blue-100'
              }`}
            >
              {phase === 1 && <Lock className="w-3 h-3" />}
              Bölüm 2 · {SECTION2_TITLE} ({questionsAnswered}/{SECTION2_QUESTIONS.length})
            </div>
          </div>

          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(totalAnswered / TOTAL_ITEMS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Görev kartı */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <AnimatePresence mode="wait">
            {phase === 1 ? (
              <motion.div
                key={`case-${caseIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                    Vaka {caseIndex + 1} / {MARKET_CASES.length}
                  </span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {POINTS_PER_CASE} puan
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION1_INSTRUCTION}</p>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                  <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-2">{currentCase.title}</p>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{currentCase.scenario}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {MARKET_CYCLES.map((cycle) => {
                    const isSelected = selectedCycle === cycle.id;
                    const isCorrectOption = cycle.id === currentCase.correctCycle;
                    let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                    if (revealed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                    else if (revealed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                    else if (revealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';

                    return (
                      <motion.button
                        key={cycle.id}
                        whileHover={!revealed ? { scale: 1.01 } : {}}
                        whileTap={!revealed ? { scale: 0.99 } : {}}
                        onClick={() => selectCycle(cycle.id)}
                        disabled={revealed}
                        className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{cycle.icon}</span>
                          {cycle.label}
                        </span>
                        {revealed && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                        {revealed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                      <div
                        className={`rounded-xl px-5 py-3 mb-4 flex items-start gap-3 ${
                          selectedCycle === currentCase.correctCycle
                            ? 'bg-emerald-900/50 border border-emerald-600/50'
                            : 'bg-red-900/50 border border-red-600/50'
                        }`}
                      >
                        {selectedCycle === currentCase.correctCycle ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-bold mb-1 ${selectedCycle === currentCase.correctCycle ? 'text-emerald-300' : 'text-red-300'}`}>
                            {selectedCycle === currentCase.correctCycle ? `Doğru! +${POINTS_PER_CASE} puan kazandın.` : 'Yanlış cevap. +0 puan.'}
                          </p>
                          <p className="text-slate-300 text-xs leading-relaxed">{currentCase.explanation}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                      >
                        {caseIndex < MARKET_CASES.length - 1 ? 'Sonraki Vaka ➔' : "Bölüm 2'ye Geç ➔"}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Soru {questionIndex + 1} / {SECTION2_QUESTIONS.length}
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
                    const isSelected = selectedOption === option.id;
                    const isCorrectOption = option.id === currentQuestion.correctOptionId;
                    let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                    if (revealed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                    else if (revealed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                    else if (revealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';

                    return (
                      <motion.button
                        key={option.id}
                        whileHover={!revealed ? { scale: 1.005 } : {}}
                        onClick={() => selectOption(option.id)}
                        disabled={revealed}
                        className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${btnClass}`}
                      >
                        <span className="font-black flex-shrink-0">{option.id})</span>
                        <span className="flex-1 text-sm">{option.label}</span>
                        {revealed && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                        {revealed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                      <div
                        className={`rounded-xl px-5 py-3 mb-4 flex items-start gap-3 ${
                          selectedOption === currentQuestion.correctOptionId
                            ? 'bg-emerald-900/50 border border-emerald-600/50'
                            : 'bg-red-900/50 border border-red-600/50'
                        }`}
                      >
                        {selectedOption === currentQuestion.correctOptionId ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-bold mb-1 ${selectedOption === currentQuestion.correctOptionId ? 'text-emerald-300' : 'text-red-300'}`}>
                            {selectedOption === currentQuestion.correctOptionId ? `Doğru! +${currentQuestion.points} puan kazandın.` : 'Yanlış cevap. +0 puan.'}
                          </p>
                          <p className="text-slate-300 text-xs leading-relaxed">{currentQuestion.explanation}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                      >
                        {questionIndex < SECTION2_QUESTIONS.length - 1 ? 'Sonraki Soru ➔' : 'Sonuçları Gör 🏆'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
