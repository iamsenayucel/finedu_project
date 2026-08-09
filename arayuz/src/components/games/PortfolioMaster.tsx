import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import {
  GAME_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_SCENARIO,
  TOTAL_SCENARIO_POINTS,
  POINTS_PER_QUESTION,
  TOTAL_QUESTION_POINTS,
  TOTAL_POINTS,
  PICKS_PER_SCENARIO,
  INVESTMENT_TOOLS,
  MARKET_SCENARIOS,
  SECTION1_TITLE,
  SECTION1_INSTRUCTION,
  SECTION2_TITLE,
  SECTION2_INSTRUCTION,
  SECTION2_QUESTIONS,
  getPerformance,
  type ToolId,
  type ScenarioId,
} from './data/portfolioMasterData';

interface PortfolioMasterProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type FinishReason = 'timeout' | 'completed';

interface ScenarioResult {
  scenarioId: ScenarioId;
  selected: ToolId[];
  answered: boolean;
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
  scenarioResults: ScenarioResult[];
  scenariosCorrect: number;
  scenariosWrong: number;
  scenariosBlank: number;
  scenarioScore: number;
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

const TOTAL_ITEMS = MARKET_SCENARIOS.length + SECTION2_QUESTIONS.length;

function emptySelections(): Record<ScenarioId, ToolId[]> {
  return Object.fromEntries(MARKET_SCENARIOS.map((s) => [s.id, []])) as Record<ScenarioId, ToolId[]>;
}

function emptyAnswers2(): Record<number, string | null> {
  return Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null]));
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

function combosMatch(selected: ToolId[], combo: ToolId[]): boolean {
  if (selected.length !== combo.length) return false;
  const a = [...selected].sort();
  const b = [...combo].sort();
  return a.every((v, i) => v === b[i]);
}

export default function PortfolioMaster({ onComplete, onBack }: PortfolioMasterProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [phase, setPhase] = useState<1 | 2>(1);
  const [selections1, setSelections1] = useState<Record<ScenarioId, ToolId[]>>(emptySelections);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers2, setAnswers2] = useState<Record<number, string | null>>(emptyAnswers2);
  const [pendingOption, setPendingOption] = useState<string | null>(null);

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
    const scenarioResults: ScenarioResult[] = MARKET_SCENARIOS.map((s) => {
      const selected = selections1[s.id] || [];
      const answered = selected.length === PICKS_PER_SCENARIO;
      const correct = answered && s.correctCombos.some((combo) => combosMatch(selected, combo));
      return { scenarioId: s.id, selected, answered, correct, points: correct ? POINTS_PER_SCENARIO : 0 };
    });
    const scenariosCorrect = scenarioResults.filter((r) => r.correct).length;
    const scenariosBlank = scenarioResults.filter((r) => !r.answered).length;
    const scenariosWrong = scenarioResults.length - scenariosCorrect - scenariosBlank;
    const scenarioScore = scenariosCorrect * POINTS_PER_SCENARIO;

    const questionResults: QuestionResult[] = SECTION2_QUESTIONS.map((q) => {
      const selected = answers2[q.id];
      const correct = selected !== null && selected === q.correctOptionId;
      return { questionId: q.id, selected, correct, points: correct ? q.points : 0 };
    });
    const questionsCorrect = questionResults.filter((r) => r.correct).length;
    const questionsBlank = questionResults.filter((r) => r.selected === null).length;
    const questionsWrong = questionResults.length - questionsCorrect - questionsBlank;
    const questionScore = questionResults.reduce((sum, r) => sum + r.points, 0);

    const totalScore = Math.max(0, Math.min(TOTAL_POINTS, scenarioScore + questionScore));

    return {
      scenarioResults,
      scenariosCorrect,
      scenariosWrong,
      scenariosBlank,
      scenarioScore,
      questionResults,
      questionsCorrect,
      questionsWrong,
      questionsBlank,
      questionScore,
      totalCorrect: scenariosCorrect + questionsCorrect,
      totalWrong: scenariosWrong + questionsWrong,
      totalBlank: scenariosBlank + questionsBlank,
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
    setSelections1(emptySelections());
    setQuestionIndex(0);
    setAnswers2(emptyAnswers2());
    setPendingOption(null);
    setResults(null);
    finalizedRef.current = false;
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setPhase(1);
    setSelections1(emptySelections());
    setQuestionIndex(0);
    setAnswers2(emptyAnswers2());
    setPendingOption(null);
    setResults(null);
    finalizedRef.current = false;
    setStage('intro');
  };

  const toggleTool = (scenarioId: ScenarioId, toolId: ToolId) => {
    setSelections1((prev) => {
      const current = prev[scenarioId] || [];
      if (current.includes(toolId)) {
        return { ...prev, [scenarioId]: current.filter((t) => t !== toolId) };
      }
      if (current.length >= PICKS_PER_SCENARIO) return prev;
      return { ...prev, [scenarioId]: [...current, toolId] };
    });
  };

  const scenariosAnswered = useMemo(
    () => MARKET_SCENARIOS.filter((s) => (selections1[s.id] || []).length === PICKS_PER_SCENARIO).length,
    [selections1]
  );
  const totalPicks = useMemo(
    () => MARKET_SCENARIOS.reduce((sum, s) => sum + (selections1[s.id] || []).length, 0),
    [selections1]
  );
  const section1Complete = scenariosAnswered === MARKET_SCENARIOS.length;

  const handleSubmitSection1 = () => {
    if (!section1Complete) return;
    setPhase(2);
  };

  const currentQuestion = SECTION2_QUESTIONS[questionIndex];

  const selectOption = (optionId: string) => {
    setPendingOption(optionId);
  };

  const handleNextQuestion = () => {
    if (pendingOption === null) return;
    setAnswers2((prev) => ({ ...prev, [currentQuestion.id]: pendingOption }));
    setPendingOption(null);
    if (questionIndex < SECTION2_QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      finalizeGame('completed');
    }
  };

  const questionsAnswered = useMemo(() => Object.values(answers2).filter((v) => v !== null).length, [answers2]);
  const totalAnswered = scenariosAnswered + questionsAnswered;

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Portföy Ustası 💼</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Piyasa koşullarına göre doğru yatırım araçlarını seç, ardından portföy yönetimi bitirme testini çöz.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  `Oyun iki bölümden oluşur: Bölüm 1 - ${SECTION1_TITLE}, Bölüm 2 - ${SECTION2_TITLE}.`,
                  `Bölüm 1'de 4 piyasa senaryosu vardır. Her senaryo için 5 yatırım aracından tam olarak 2 tanesini seçmelisin. Doğru senaryo başına ${POINTS_PER_SCENARIO} puan, toplam ${TOTAL_SCENARIO_POINTS} puandır.`,
                  `Bölüm 2'de A-E seçenekli 4 soru vardır. Doğru cevap ${POINTS_PER_QUESTION} puan, toplam ${TOTAL_QUESTION_POINTS} puandır.`,
                  'Bölüm 1\'i tamamlayıp gönderdikten sonra Bölüm 2\'ye geçersin; geri dönüp cevaplarını değiştiremezsin. Sonuçlar ve açıklamalar yalnızca oyun tamamlandığında gösterilir.',
                  `Toplam süre ${GAME_DURATION_MS / 60000} dakikadır ve oyun başladığında kesintisiz işlemeye başlar. İki bölüm aynı süreyi paylaşır, bölüm geçişinde sayaç sıfırlanmaz.`,
                  'Süre dolduğunda oyun o ana kadarki cevaplarınla otomatik olarak tamamlanır; cevaplanmamış senaryo ve sorular 0 puan alır.',
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
              <StatTile label="Bölüm 1 Puanı" value={`${results.scenarioScore}/${TOTAL_SCENARIO_POINTS}`} color="text-emerald-400" />
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
                Bölüm 1 · {SECTION1_TITLE} ({results.scenariosCorrect}/{MARKET_SCENARIOS.length} doğru)
              </h3>
              <div className="space-y-2">
                {MARKET_SCENARIOS.map((s) => {
                  const r = results.scenarioResults.find((x) => x.scenarioId === s.id)!;
                  const selectedLabels = r.selected.map((id) => INVESTMENT_TOOLS.find((t) => t.id === id)?.label).join(' + ');
                  const correctLabels = s.correctCombos
                    .map((combo) => combo.map((id) => INVESTMENT_TOOLS.find((t) => t.id === id)?.label).join(' + '))
                    .join(' veya ');
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        !r.answered
                          ? 'bg-slate-800/40 border-slate-700'
                          : r.correct
                          ? 'bg-emerald-900/30 border-emerald-700/40'
                          : 'bg-red-900/30 border-red-700/40'
                      }`}
                    >
                      {!r.answered ? (
                        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      ) : r.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs mb-1">{s.icon} {s.title}</p>
                        {!r.answered ? (
                          <p className="text-slate-500 text-xs mb-1">Bu senaryo cevaplanmadı.</p>
                        ) : (
                          <p className="text-slate-300 text-xs mb-1">
                            Seçtiğin: <span className="font-semibold">{selectedLabels}</span>
                            {!r.correct && (
                              <>
                                {' '}
                                · Doğrusu: <span className="text-emerald-300 font-semibold">{correctLabels}</span>
                              </>
                            )}
                          </p>
                        )}
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
  const HeaderBar = (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
              FinEdu
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Portföy Ustası</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
              Cevaplanan {totalAnswered} / {TOTAL_ITEMS}
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
            Bölüm 1 · {SECTION1_TITLE} ({scenariosAnswered}/{MARKET_SCENARIOS.length})
          </div>
          <div
            className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-colors ${
              phase === 1 ? 'border-slate-800 bg-slate-800/50 text-slate-600' : 'border-blue-400 bg-blue-900/50 text-blue-100'
            }`}
          >
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
  );

  if (phase === 1) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        {HeaderBar}
        <div className="flex items-start gap-4">
          {/* ── Sol Panel: Yatırım Araçları Sözlüğü ── */}
          <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
            <div
              className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-cyan-800/40">
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-0.5">📖 Yatırım Araçları</div>
                <div className="text-cyan-600 text-xs">Sözlük</div>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3.5">
                {INVESTMENT_TOOLS.map((tool) => (
                  <div key={tool.id}>
                    <div className="text-sm font-bold text-cyan-300 mb-1.5">{tool.icon} {tool.label}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{tool.feature}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Orta: Portföy Matrisi ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              <div className="p-6">
                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION1_INSTRUCTION}</p>

                <div className="flex flex-col gap-4">
                  {MARKET_SCENARIOS.map((scenario) => {
                    const selected = selections1[scenario.id] || [];
                    return (
                      <div key={scenario.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                              <span className="text-xl">{scenario.icon}</span> {scenario.title}
                            </p>
                            <p className="text-slate-400 text-xs leading-relaxed mt-1">{scenario.description}</p>
                          </div>
                          <span
                            className={`flex-shrink-0 text-xs font-black px-3 py-1 rounded-full border ${
                              selected.length === PICKS_PER_SCENARIO
                                ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                                : 'bg-slate-700/60 text-slate-300 border-slate-600'
                            }`}
                          >
                            {selected.length}/{PICKS_PER_SCENARIO}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {INVESTMENT_TOOLS.map((tool) => {
                            const isSelected = selected.includes(tool.id);
                            const isBlocked = !isSelected && selected.length >= PICKS_PER_SCENARIO;
                            return (
                              <motion.button
                                key={tool.id}
                                whileHover={!isBlocked ? { scale: 1.02 } : {}}
                                whileTap={!isBlocked ? { scale: 0.97 } : {}}
                                onClick={() => toggleTool(scenario.id, tool.id)}
                                disabled={isBlocked}
                                className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
                                  isSelected
                                    ? 'bg-blue-900/60 border-blue-400 text-blue-100'
                                    : isBlocked
                                    ? 'bg-slate-800/60 border-slate-700 text-slate-600 opacity-50 cursor-not-allowed'
                                    : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-white'
                                }`}
                              >
                                <div className="text-lg mb-1">{tool.icon}</div>
                                <div className="text-xs font-bold leading-tight">{tool.label}</div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-slate-400 text-xs">Toplam seçim: {totalPicks} / 8</span>
                  <motion.button
                    whileHover={section1Complete ? { scale: 1.02 } : {}}
                    whileTap={section1Complete ? { scale: 0.98 } : {}}
                    onClick={handleSubmitSection1}
                    disabled={!section1Complete}
                    className={`flex-1 sm:flex-none font-black py-3.5 px-8 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 transition-all ${
                      section1Complete
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-purple-800'
                        : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    Bölüm 2'ye Geç ➔
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sağ Panel: Strateji Merkezi ── */}
          <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
            <div
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-amber-800/40">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Strateji Merkezi</div>
                <div className="text-amber-600 text-xs">Portföy Yönetimi İlkeleri</div>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3.5">
                {[
                  { title: 'Risk - Getiri İlişkisi', desc: 'Yüksek getiri potansiyeli taşıyan araçlar genellikle yüksek risk de barındırır.' },
                  { title: 'Sermaye Koruması', desc: 'Belirsizlik dönemlerinde sabit getirili veya güvenli liman araçları sermayeyi korumaya yardımcı olabilir.' },
                  { title: 'Piyasa Döngüsünü Oku', desc: 'Her piyasa koşulu farklı bir risk iştahı gerektirir; senaryoyu dikkatle değerlendir.' },
                ].map((tip, i) => (
                  <div key={i}>
                    <div className="text-sm font-bold text-amber-300 mb-1.5">{tip.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Bölüm 2: Bitirme Testi ──────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto">
      {HeaderBar}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <AnimatePresence mode="wait">
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
                  const isSelected = pendingOption === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => selectOption(option.id)}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${
                        isSelected ? 'bg-blue-900/60 border-blue-400 text-blue-100' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
                      }`}
                    >
                      <span className="font-black flex-shrink-0">{option.id})</span>
                      <span className="flex-1 text-sm">{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={pendingOption !== null ? { scale: 1.02 } : {}}
                whileTap={pendingOption !== null ? { scale: 0.98 } : {}}
                onClick={handleNextQuestion}
                disabled={pendingOption === null}
                className={`w-full font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 mt-5 transition-all ${
                  pendingOption !== null
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-purple-800'
                    : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed'
                }`}
              >
                {questionIndex < SECTION2_QUESTIONS.length - 1 ? 'Sonraki Soru ➔' : 'Sonuçları Gör 🏆'}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
