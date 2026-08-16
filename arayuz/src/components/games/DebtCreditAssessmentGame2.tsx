import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Clock, CheckCircle2, XCircle, AlertTriangle, MessageCircleWarning } from 'lucide-react';
import {
  GAME_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_QUESTION1,
  TOTAL_SECTION1_POINTS,
  SECTION1_TITLE,
  SECTION1_INSTRUCTION,
  SECTION1_QUESTIONS,
  POINTS_PER_QUESTION2,
  TOTAL_SECTION2_POINTS,
  SECTION2_TITLE,
  SECTION2_INSTRUCTION,
  SECTION2_CASES,
  TOTAL_POINTS,
  getPerformance,
} from './data/debtCreditAssessmentData2';

interface DebtCreditAssessmentGame2Props {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type Section = 1 | 2;
type FinishReason = 'timeout' | 'user';

interface Section1Result {
  questionId: number;
  selected: 'A' | 'B' | 'C' | null;
  correct: boolean;
  points: number;
}

interface Section2Result {
  caseId: number;
  selected: 'A' | 'B' | null;
  correct: boolean;
  points: number;
}

interface ExamResults {
  section1: Section1Result[];
  section1Correct: number;
  section1Score: number;
  section2: Section2Result[];
  section2Correct: number;
  section2Score: number;
  totalCorrect: number;
  totalWrong: number;
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

export default function DebtCreditAssessmentGame2({ onComplete, onBack }: DebtCreditAssessmentGame2Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [section, setSection] = useState<Section>(1);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [q1Index, setQ1Index] = useState(0);
  const [answers1, setAnswers1] = useState<Record<number, 'A' | 'B' | 'C' | null>>(() =>
    Object.fromEntries(SECTION1_QUESTIONS.map((q) => [q.id, null]))
  );

  const [q2Index, setQ2Index] = useState(0);
  const [answers2, setAnswers2] = useState<Record<number, 'A' | 'B' | null>>(() =>
    Object.fromEntries(SECTION2_CASES.map((c) => [c.id, null]))
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
    const section1: Section1Result[] = SECTION1_QUESTIONS.map((q) => {
      const selected = answers1[q.id];
      const correct = selected !== null && selected === q.correctOptionId;
      return { questionId: q.id, selected, correct, points: correct ? POINTS_PER_QUESTION1 : 0 };
    });
    const section1Correct = section1.filter((r) => r.correct).length;
    const section1Score = section1Correct * POINTS_PER_QUESTION1;

    const section2: Section2Result[] = SECTION2_CASES.map((c) => {
      const selected = answers2[c.id];
      const correct = selected !== null && selected === c.correctOptionId;
      return { caseId: c.id, selected, correct, points: correct ? POINTS_PER_QUESTION2 : 0 };
    });
    const section2Correct = section2.filter((r) => r.correct).length;
    const section2Score = section2Correct * POINTS_PER_QUESTION2;

    const totalScore = Math.max(0, Math.min(TOTAL_POINTS, section1Score + section2Score));
    const totalCorrect = section1Correct + section2Correct;
    const totalWrong = SECTION1_QUESTIONS.length - section1Correct + (SECTION2_CASES.length - section2Correct);

    return {
      section1,
      section1Correct,
      section1Score,
      section2,
      section2Correct,
      section2Score,
      totalCorrect,
      totalWrong,
      totalScore,
      usedMs,
      remainingMs: Math.max(0, GAME_DURATION_MS - usedMs),
      reason,
    };
  };

  const finalizeExam = (reason: FinishReason) => {
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
      finalizeExam('timeout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, stage]);

  const resetAnswers = () => {
    setSection(1);
    setQ1Index(0);
    setQ2Index(0);
    setAnswers1(Object.fromEntries(SECTION1_QUESTIONS.map((q) => [q.id, null])));
    setAnswers2(Object.fromEntries(SECTION2_CASES.map((c) => [c.id, null])));
    setResults(null);
    finalizedRef.current = false;
  };

  const handleStart = () => {
    resetAnswers();
    const start = Date.now();
    setStartedAt(start);
    setNowTick(start);
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    resetAnswers();
    setStage('intro');
  };

  const handleAnswer1 = (optionId: 'A' | 'B' | 'C') => {
    const q = SECTION1_QUESTIONS[q1Index];
    if (answers1[q.id] !== null) return;
    setAnswers1((prev) => ({ ...prev, [q.id]: optionId }));
  };

  const handleNext1 = () => {
    if (q1Index < SECTION1_QUESTIONS.length - 1) {
      setQ1Index((i) => i + 1);
    } else {
      setSection(2);
    }
  };

  const handleAnswer2 = (optionId: 'A' | 'B') => {
    const c = SECTION2_CASES[q2Index];
    if (answers2[c.id] !== null) return;
    setAnswers2((prev) => ({ ...prev, [c.id]: optionId }));
  };

  const handleNext2 = () => {
    if (q2Index < SECTION2_CASES.length - 1) {
      setQ2Index((i) => i + 1);
    } else {
      finalizeExam('user');
    }
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
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Borçlanma ve Kredi: Akıllı Tüketici Testi</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Gerçek hayattan kredi/taksit senaryolarında doğru hesaplamayı yap; ardından seni yanlış bir borçlanma
                kararına yönlendirmeye çalışan cümleler karşısında doğru danışman yorumunu seç.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  `Oyun 2 bölümden oluşur: Bölüm 1 - ${SECTION1_TITLE} (${TOTAL_SECTION1_POINTS} puan), Bölüm 2 - ${SECTION2_TITLE} (${TOTAL_SECTION2_POINTS} puan).`,
                  `Bölüm 1'de sırayla 3 finansal senaryo (vaka) gösterilir. Vaka metnini okuyup gerekli hesaplamayı yaparak doğru sonucu A, B, C seçeneklerinden birini işaretleyerek bulursun. Bir soruyu cevapladıktan sonra cevabını değiştiremezsin. Her doğru cevap ${POINTS_PER_QUESTION1} puandır.`,
                  `Bölüm 1'in 3 sorusu tamamlanmadan Bölüm 2'ye geçilmez; sorular otomatik olarak sırayla ilerler.`,
                  `Bölüm 2'de sırayla 3 vaka gösterilir. Her vakada bir satıcı, arkadaş ya da sosyal medya fenomeninin seni bir borçlanma kararına yönlendiren cümlesini okur, ardından bir finansal danışman olsan hangi yorumu savunacağını A veya B seçeneğinden birini işaretleyerek belirtirsin. Bir vakayı cevapladıktan sonra cevabını değiştiremezsin. Her doğru cevap ${POINTS_PER_QUESTION2} puandır.`,
                  `Toplam süre ${GAME_DURATION_MS / 60000} dakikadır ve oyun başladığında kesintisiz işlemeye başlar. Bölümler arasında geçiş süreyi durdurmaz.`,
                  'Süre dolduğunda oyun o ana kadarki cevaplarınla otomatik olarak tamamlanır; cevaplanmamış sorular 0 puan alır.',
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

            <div className="grid grid-cols-2 gap-3 mb-3">
              <StatTile label="Bölüm 1 Puanı" value={`${results.section1Score}/${TOTAL_SECTION1_POINTS}`} color="text-emerald-400" />
              <StatTile label="Bölüm 2 Puanı" value={`${results.section2Score}/${TOTAL_SECTION2_POINTS}`} color="text-blue-400" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatTile label="Toplam Doğru" value={results.totalCorrect} color="text-emerald-400" />
              <StatTile label="Toplam Yanlış" value={results.totalWrong} color="text-red-400" />
              <StatTile label="Kullanılan Süre" value={formatDuration(results.usedMs)} color="text-amber-400" />
              <StatTile label="Kalan Süre" value={formatDuration(results.remainingMs)} color="text-purple-400" />
            </div>

            {/* Bölüm 1 sonuçları */}
            <div className="mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Bölüm 1 · {SECTION1_TITLE} ({results.section1Correct}/{SECTION1_QUESTIONS.length} doğru)
              </h3>
              <div className="space-y-2">
                {SECTION1_QUESTIONS.map((q) => {
                  const r = results.section1.find((x) => x.questionId === q.id)!;
                  const selectedLabel = r.selected ? q.options.find((o) => o.id === r.selected)?.label : null;
                  const correctLabel = q.options.find((o) => o.id === q.correctOptionId)?.label;
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        r.selected === null ? 'bg-slate-800/40 border-slate-700' : r.correct ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
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
                        <p className="text-slate-300 text-xs mb-1">{q.title}</p>
                        {r.selected === null ? (
                          <p className="text-slate-500 text-xs mb-1">Bu soru cevaplanmadı.</p>
                        ) : (
                          <p className="text-slate-300 text-xs mb-1">
                            Seçtiğin: <span className="font-semibold">{r.selected}) {selectedLabel}</span>
                            {!r.correct && (
                              <>
                                {' '}
                                · Doğrusu: <span className="text-emerald-300 font-semibold">{q.correctOptionId}) {correctLabel}</span>
                              </>
                            )}
                          </p>
                        )}
                        <p className="text-slate-400 text-xs leading-relaxed">{q.explanation}</p>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>+{r.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bölüm 2 sonuçları */}
            <div className="space-y-2 mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Bölüm 2 · {SECTION2_TITLE} ({results.section2Correct}/{SECTION2_CASES.length} doğru)
              </h3>
              {SECTION2_CASES.map((c) => {
                const r = results.section2.find((x) => x.caseId === c.id)!;
                const selectedLabel = r.selected ? c.options.find((o) => o.id === r.selected)?.label : null;
                const correctLabel = c.options.find((o) => o.id === c.correctOptionId)?.label;
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 ${
                      r.selected === null ? 'bg-slate-800/40 border-slate-700' : r.correct ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
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
                          Seçtiğin: <span className="font-semibold">{r.selected}) {selectedLabel}</span>
                          {!r.correct && (
                            <>
                              {' '}
                              · Doğrusu: <span className="text-emerald-300 font-semibold">{c.correctOptionId}) {correctLabel}</span>
                            </>
                          )}
                        </p>
                      )}
                      <p className="text-slate-400 text-xs leading-relaxed">{c.explanation}</p>
                    </div>
                    <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>+{r.points}</span>
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
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                FinEdu
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Akıllı Tüketici Testi</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 text-center transition-colors ${
                section > 1
                  ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                  : 'border-blue-400 bg-blue-900/50 text-blue-100'
              }`}
            >
              {section > 1 ? '✓ ' : ''}Bölüm 1 · {SECTION1_TITLE} ({Object.values(answers1).filter((v) => v !== null).length}/{SECTION1_QUESTIONS.length})
            </div>
            <div
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 text-center transition-colors ${
                section === 2 ? 'border-blue-400 bg-blue-900/50 text-blue-100' : 'border-slate-800 bg-slate-800/50 text-slate-600'
              }`}
            >
              Bölüm 2 · {SECTION2_TITLE} ({Object.values(answers2).filter((v) => v !== null).length}/{SECTION2_CASES.length})
            </div>
          </div>
        </div>
      </div>

      {/* Görev kartı */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <AnimatePresence mode="wait">
            {section === 1 ? (
              <motion.div
                key={`q1-${q1Index}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">{SECTION1_QUESTIONS[q1Index].title}</span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {POINTS_PER_QUESTION1} puan
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION1_INSTRUCTION}</p>

                {(() => {
                  const q = SECTION1_QUESTIONS[q1Index];
                  const answer = answers1[q.id];
                  const revealed = answer !== null;
                  return (
                    <>
                      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                        <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-3">{q.scenario}</p>
                        <p className="text-blue-300 text-sm font-bold">{q.task}</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {q.options.map((option) => {
                          const isSelected = answer === option.id;
                          const isCorrectOption = option.id === q.correctOptionId;
                          let stateClasses = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                          if (revealed) {
                            if (isSelected && isCorrectOption) stateClasses = 'bg-emerald-900/40 border-emerald-500 text-emerald-100';
                            else if (isSelected && !isCorrectOption) stateClasses = 'bg-red-900/40 border-red-500 text-red-100';
                            else if (isCorrectOption) stateClasses = 'bg-emerald-900/20 border-emerald-700 text-emerald-200';
                            else stateClasses = 'bg-slate-800/60 border-slate-700 text-slate-500';
                          }
                          return (
                            <motion.button
                              key={option.id}
                              whileHover={!revealed ? { scale: 1.005 } : {}}
                              disabled={revealed}
                              onClick={() => handleAnswer1(option.id)}
                              className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${stateClasses} ${
                                revealed ? 'cursor-default' : ''
                              }`}
                            >
                              <span className="font-black flex-shrink-0">{option.id})</span>
                              <span className="flex-1 text-sm">{option.label}</span>
                              {revealed && isSelected && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />}
                              {revealed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-300 flex-shrink-0" />}
                            </motion.button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {revealed && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                            <div
                              className={`rounded-xl px-5 py-4 border ${
                                answer === q.correctOptionId ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
                              }`}
                            >
                              <p className={`font-black text-sm mb-1 ${answer === q.correctOptionId ? 'text-emerald-300' : 'text-red-300'}`}>
                                {answer === q.correctOptionId ? `Doğru! +${POINTS_PER_QUESTION1} puan kazandın 🎉` : 'Yanlış cevap.'}
                              </p>
                              <p className="text-slate-300 text-xs leading-relaxed">{q.explanation}</p>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleNext1}
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                            >
                              {q1Index < SECTION1_QUESTIONS.length - 1 ? 'Sonraki Soru ➔' : "Bölüm 2'ye Geç ➔"}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key={`q2-${q2Index}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">{SECTION2_CASES[q2Index].title}</span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {POINTS_PER_QUESTION2} puan
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION2_INSTRUCTION}</p>

                {(() => {
                  const c = SECTION2_CASES[q2Index];
                  const answer = answers2[c.id];
                  const revealed = answer !== null;
                  return (
                    <>
                      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                        <div className="flex items-start gap-2 mb-2">
                          <MessageCircleWarning className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">{c.speakerLabel}</p>
                        </div>
                        <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic mb-3">"{c.quote}"</p>
                        <p className="text-blue-300 text-sm font-bold">{c.task}</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {c.options.map((option) => {
                          const isSelected = answer === option.id;
                          const isCorrectOption = option.id === c.correctOptionId;
                          let stateClasses = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                          if (revealed) {
                            if (isSelected && isCorrectOption) stateClasses = 'bg-emerald-900/40 border-emerald-500 text-emerald-100';
                            else if (isSelected && !isCorrectOption) stateClasses = 'bg-red-900/40 border-red-500 text-red-100';
                            else if (isCorrectOption) stateClasses = 'bg-emerald-900/20 border-emerald-700 text-emerald-200';
                            else stateClasses = 'bg-slate-800/60 border-slate-700 text-slate-500';
                          }
                          return (
                            <motion.button
                              key={option.id}
                              whileHover={!revealed ? { scale: 1.005 } : {}}
                              disabled={revealed}
                              onClick={() => handleAnswer2(option.id)}
                              className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start gap-3 ${stateClasses} ${
                                revealed ? 'cursor-default' : ''
                              }`}
                            >
                              <span className="font-black flex-shrink-0">{option.id})</span>
                              <span className="flex-1 text-sm">{option.label}</span>
                              {revealed && isSelected && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />}
                              {revealed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-300 flex-shrink-0" />}
                            </motion.button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {revealed && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                            <div
                              className={`rounded-xl px-5 py-4 border ${
                                answer === c.correctOptionId ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
                              }`}
                            >
                              <p className={`font-black text-sm mb-1 ${answer === c.correctOptionId ? 'text-emerald-300' : 'text-red-300'}`}>
                                {answer === c.correctOptionId ? `Doğru! +${POINTS_PER_QUESTION2} puan kazandın 🎉` : 'Yanlış cevap.'}
                              </p>
                              <p className="text-slate-300 text-xs leading-relaxed">{c.explanation}</p>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleNext2}
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                            >
                              {q2Index < SECTION2_CASES.length - 1 ? 'Sonraki Vaka ➔' : 'Değerlendirmeyi Bitir 🏁'}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
