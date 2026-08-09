import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Landmark } from 'lucide-react';
import {
  GAME_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_SECTION1_QUESTION,
  TOTAL_SECTION1_POINTS,
  POINTS_PER_SECTION2_QUESTION,
  TOTAL_SECTION2_POINTS,
  TOTAL_SECTION3_POINTS,
  TOTAL_POINTS,
  SECTION_LABELS,
  SECTION1_TITLE,
  SECTION1_INSTRUCTION,
  SECTION1_QUESTIONS,
  SECTION1_PANEL,
  SECTION2_TITLE,
  SECTION2_INSTRUCTION,
  SECTION2_QUESTIONS,
  SCENARIO_OPTIONS,
  SECTION2_PANEL,
  SECTION3_TITLE,
  SECTION3_INSTRUCTION,
  INSTRUMENTS,
  RISK_LEVELS,
  SECTION3_PANEL,
  getPerformance,
  type RiskLevel,
} from './data/legalInvestmentAssessmentData';

interface LegalInvestmentAssessmentProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type Section = 1 | 2 | 3;
type FinishReason = 'timeout' | 'user';

interface ItemResult {
  id: number | string;
  label: string;
  selected: string | null;
  correctAnswer: string;
  correct: boolean;
}

interface GameResults {
  section1Results: ItemResult[];
  section1Score: number;
  section1Correct: number;
  section2Results: ItemResult[];
  section2Score: number;
  section2Correct: number;
  section3Results: ItemResult[];
  section3Score: number;
  section3Correct: number;
  quizCorrect: number;
  quizWrong: number;
  quizBlank: number;
  totalScore: number;
  usedMs: number;
  remainingMs: number;
  reason: FinishReason;
}

const RISK_LABEL: Record<RiskLevel, string> = Object.fromEntries(RISK_LEVELS.map((r) => [r.id, r.label])) as Record<RiskLevel, string>;

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

function SidePanel({
  side,
  title,
  subtitle,
  items,
  isDictionary,
}: {
  side: 'left' | 'right';
  title: string;
  subtitle: string;
  items: { term?: string; title?: string; def?: string; desc?: string }[];
  isDictionary: boolean;
}) {
  const theme = isDictionary
    ? {
        gradient: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)',
        border: 'border-cyan-800/50',
        borderB: 'border-cyan-800/40',
        title: 'text-cyan-400',
        subtitle: 'text-cyan-600',
        term: 'text-cyan-300',
      }
    : {
        gradient: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)',
        border: 'border-amber-800/50',
        borderB: 'border-amber-800/40',
        title: 'text-amber-400',
        subtitle: 'text-amber-600',
        term: 'text-amber-300',
      };
  return (
    <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${side}-${title}`}
          initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl overflow-hidden border ${theme.border} shadow-xl`}
          style={{ background: theme.gradient }}
        >
          <div className={`px-4 py-3.5 border-b ${theme.borderB}`}>
            <div className={`${theme.title} text-xs font-bold uppercase tracking-widest mb-0.5`}>{title}</div>
            <div className={`${theme.subtitle} text-xs`}>{subtitle}</div>
          </div>
          <div className="px-4 py-3.5 flex flex-col gap-3.5">
            {items.map((item, i) => (
              <div key={i}>
                <div className={`text-sm font-bold ${theme.term} mb-1.5`}>{item.term ?? item.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{item.def ?? item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function LegalInvestmentAssessment({ onComplete, onBack }: LegalInvestmentAssessmentProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [section, setSection] = useState<Section>(1);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [s1Index, setS1Index] = useState(0);
  const [s1Answers, setS1Answers] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(SECTION1_QUESTIONS.map((q) => [q.id, null]))
  );

  const [s2Index, setS2Index] = useState(0);
  const [s2Answers, setS2Answers] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null]))
  );

  const [s3Answers, setS3Answers] = useState<Record<string, RiskLevel | null>>(() =>
    Object.fromEntries(INSTRUMENTS.map((i) => [i.id, null]))
  );

  const [results, setResults] = useState<GameResults | null>(null);
  const finalizedRef = useRef(false);

  // ── Sayaç: oyun başladığında çalışır, 3 bölüm boyunca kesintisiz devam eder ──
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, GAME_DURATION_MS - elapsedMs) : GAME_DURATION_MS;

  const buildResults = (reason: FinishReason, usedMs: number): GameResults => {
    const section1Results: ItemResult[] = SECTION1_QUESTIONS.map((q) => {
      const selected = s1Answers[q.id];
      const correct = selected !== null && selected === q.correctAnswer;
      return { id: q.id, label: q.description, selected, correctAnswer: q.correctAnswer, correct };
    });
    const section1Correct = section1Results.filter((r) => r.correct).length;
    const section1Score = section1Correct * POINTS_PER_SECTION1_QUESTION;

    const section2Results: ItemResult[] = SECTION2_QUESTIONS.map((q) => {
      const selected = s2Answers[q.id];
      const correct = selected !== null && selected === q.correctAnswer;
      return { id: q.id, label: q.title, selected, correctAnswer: q.correctAnswer, correct };
    });
    const section2Correct = section2Results.filter((r) => r.correct).length;
    const section2Score = section2Correct * POINTS_PER_SECTION2_QUESTION;

    const section3Results: ItemResult[] = INSTRUMENTS.map((ins) => {
      const selected = s3Answers[ins.id];
      const correct = selected !== null && selected === ins.correctRisk;
      return {
        id: ins.id,
        label: ins.label,
        selected: selected ? RISK_LABEL[selected] : null,
        correctAnswer: RISK_LABEL[ins.correctRisk],
        correct,
      };
    });
    const section3Correct = section3Results.filter((r) => r.correct).length;
    const section3Score = Math.round((section3Correct / INSTRUMENTS.length) * TOTAL_SECTION3_POINTS);

    const quizResults = [...section1Results, ...section2Results];
    const quizCorrect = section1Correct + section2Correct;
    const quizBlank = quizResults.filter((r) => r.selected === null).length;
    const quizWrong = quizResults.length - quizCorrect - quizBlank;

    const totalScore = Math.max(0, Math.min(TOTAL_POINTS, section1Score + section2Score + section3Score));

    return {
      section1Results,
      section1Score,
      section1Correct,
      section2Results,
      section2Score,
      section2Correct,
      section3Results,
      section3Score,
      section3Correct,
      quizCorrect,
      quizWrong,
      quizBlank,
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

  const resetAnswers = () => {
    setSection(1);
    setS1Index(0);
    setS1Answers(Object.fromEntries(SECTION1_QUESTIONS.map((q) => [q.id, null])));
    setS2Index(0);
    setS2Answers(Object.fromEntries(SECTION2_QUESTIONS.map((q) => [q.id, null])));
    setS3Answers(Object.fromEntries(INSTRUMENTS.map((i) => [i.id, null])));
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

  const handleAnswerS1 = (option: string) => {
    const q = SECTION1_QUESTIONS[s1Index];
    if (s1Answers[q.id] !== null) return;
    setS1Answers((prev) => ({ ...prev, [q.id]: option }));
  };

  const handleNextS1 = () => {
    if (s1Index < SECTION1_QUESTIONS.length - 1) {
      setS1Index((i) => i + 1);
    } else {
      setSection(2);
    }
  };

  const handleAnswerS2 = (option: string) => {
    const q = SECTION2_QUESTIONS[s2Index];
    if (s2Answers[q.id] !== null) return;
    setS2Answers((prev) => ({ ...prev, [q.id]: option }));
  };

  const handleNextS2 = () => {
    if (s2Index < SECTION2_QUESTIONS.length - 1) {
      setS2Index((i) => i + 1);
    } else {
      setSection(3);
    }
  };

  const handleSelectRisk = (instrumentId: string, level: RiskLevel) => {
    setS3Answers((prev) => ({ ...prev, [instrumentId]: level }));
  };

  const allRiskAnswered = useMemo(() => Object.values(s3Answers).every((v) => v !== null), [s3Answers]);

  const handleFinishSection3 = () => {
    if (!allRiskAnswered) return;
    finalizeGame('user');
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
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Yasal Yatırım Yöntemleri</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Yatırım araçlarını tanı, yatırımcı profillerine uygun aracı belirle ve risk düzeylerine göre sınıflandır.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  `Oyun 3 bölümden oluşur: Bölüm 1 - ${SECTION1_TITLE} (${TOTAL_SECTION1_POINTS} puan), Bölüm 2 - ${SECTION2_TITLE} (${TOTAL_SECTION2_POINTS} puan), Bölüm 3 - ${SECTION3_TITLE} (${TOTAL_SECTION3_POINTS} puan).`,
                  `Bölüm 1'de 4 açıklama gösterilir; hangi yatırım aracına ait olduğunu seçersin. Her doğru cevap ${POINTS_PER_SECTION1_QUESTION} puandır. Bir cevap seçildikten sonra değiştirilemez ve otomatik olarak sonraki soruya geçilir.`,
                  `Bölüm 2'de 4 farklı yatırımcı senaryosu gösterilir; kişinin hedefine ve risk yaklaşımına en uygun aracı seçersin. Her doğru cevap ${POINTS_PER_SECTION2_QUESTION} puandır.`,
                  `Bölüm 3'te 6 yatırım aracının her biri için "Düşük Risk", "Orta Risk" veya "Yüksek Risk" seçeneklerinden birini işaretlersin. Bölümü tamamlamak için 6 aracın tamamını sınıflandırman gerekir; tamamlamadan önce seçimlerini istediğin kadar değiştirebilirsin.`,
                  `Toplam süre ${GAME_DURATION_MS / 60000} dakikadır ve oyun başladığında kesintisiz işlemeye başlar. Bölümler arasında geçiş süreyi durdurmaz.`,
                  'Süre dolduğunda oyun o ana kadarki cevaplarınla otomatik olarak tamamlanır; cevaplanmamış sorular ve sınıflandırılmamış araçlar 0 puan alır.',
                  `Toplam puan ${TOTAL_POINTS}'dir. Bölümler sırasıyla ilerler: Bölüm 1 → Bölüm 2 → Bölüm 3 → Sonuç. Bir sonraki bölüme, mevcut bölüm tamamlanmadan geçilemez.`,
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

    const renderItemList = (items: ItemResult[], pointsEach: number | null) => (
      <div className="space-y-2">
        {items.map((r, idx) => (
          <div
            key={String(r.id)}
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
              <p className="text-slate-300 text-xs mb-1">#{idx + 1}</p>
              <p className="text-white text-xs sm:text-sm font-medium mb-1">{r.label}</p>
              {r.selected === null ? (
                <p className="text-slate-500 text-xs">Cevaplanmadı.</p>
              ) : (
                <p className="text-slate-300 text-xs">
                  Seçtiğin: <span className="font-semibold">{r.selected}</span>
                  {!r.correct && (
                    <>
                      {' '}
                      · Doğrusu: <span className="text-emerald-300 font-semibold">{r.correctAnswer}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            {pointsEach !== null && (
              <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>
                +{r.correct ? pointsEach : 0}
              </span>
            )}
          </div>
        ))}
      </div>
    );

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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <StatTile label="Bölüm 1 Puanı" value={`${results.section1Score}/${TOTAL_SECTION1_POINTS}`} color="text-emerald-400" />
              <StatTile label="Bölüm 2 Puanı" value={`${results.section2Score}/${TOTAL_SECTION2_POINTS}`} color="text-blue-400" />
              <StatTile label="Bölüm 3 Puanı" value={`${results.section3Score}/${TOTAL_SECTION3_POINTS}`} color="text-purple-400" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatTile label="Soru Doğru" value={results.quizCorrect} color="text-emerald-400" />
              <StatTile label="Soru Yanlış" value={results.quizWrong} color="text-red-400" />
              <StatTile label="Risk Doğru" value={`${results.section3Correct}/${INSTRUMENTS.length}`} color="text-amber-400" />
              <StatTile label="Kullanılan Süre" value={formatDuration(results.usedMs)} color="text-slate-300" />
            </div>

            <div className="mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Bölüm 1 · {SECTION1_TITLE} ({results.section1Correct}/{SECTION1_QUESTIONS.length} doğru)
              </h3>
              {renderItemList(results.section1Results, POINTS_PER_SECTION1_QUESTION)}
            </div>

            <div className="mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Bölüm 2 · {SECTION2_TITLE} ({results.section2Correct}/{SECTION2_QUESTIONS.length} doğru)
              </h3>
              {renderItemList(results.section2Results, POINTS_PER_SECTION2_QUESTION)}
            </div>

            <div className="mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Bölüm 3 · {SECTION3_TITLE} ({results.section3Correct}/{INSTRUMENTS.length} doğru)
              </h3>
              {renderItemList(results.section3Results, null)}
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
  const panel = section === 1 ? SECTION1_PANEL : section === 2 ? SECTION2_PANEL : SECTION3_PANEL;

  const topBar = (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
              FinEdu
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Yasal Yatırım Yöntemleri</span>
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
          {SECTION_LABELS.map((label, i) => {
            const idx = (i + 1) as Section;
            const stateClass =
              idx < section
                ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                : idx === section
                ? 'border-blue-400 bg-blue-900/50 text-blue-100'
                : 'border-slate-800 bg-slate-800/50 text-slate-600';
            return (
              <div key={label} className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 text-center ${stateClass}`}>
                {idx < section ? '✓ ' : ''}Bölüm {idx} · {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      {topBar}

      <div className="flex items-start gap-4">
        <SidePanel side="left" title="📖 Finans Sözlüğü" subtitle={panel === SECTION1_PANEL ? SECTION1_TITLE : panel === SECTION2_PANEL ? SECTION2_TITLE : SECTION3_TITLE} items={panel.dictionary} isDictionary />

        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="p-6">
              <AnimatePresence mode="wait">
                {section === 1 && (
                  <motion.div key={`s1-${s1Index}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                        Soru {s1Index + 1} / {SECTION1_QUESTIONS.length}
                      </span>
                      <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                        {POINTS_PER_SECTION1_QUESTION} puan
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION1_INSTRUCTION}</p>

                    <div className="bg-slate-800 rounded-xl px-5 py-4 border border-slate-700 mb-4">
                      <p className="text-white font-bold text-base leading-relaxed">❓ {SECTION1_QUESTIONS[s1Index].description}</p>
                    </div>

                    {(() => {
                      const q = SECTION1_QUESTIONS[s1Index];
                      const answer = s1Answers[q.id];
                      const revealed = answer !== null;
                      return (
                        <>
                          <div className="flex flex-col gap-3">
                            {q.options.map((option) => {
                              const isSelected = answer === option;
                              const isCorrectOption = option === q.correctAnswer;
                              let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                              if (revealed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                              else if (revealed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                              else if (revealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';

                              return (
                                <motion.button
                                  key={option}
                                  whileHover={!revealed ? { scale: 1.01 } : {}}
                                  whileTap={!revealed ? { scale: 0.99 } : {}}
                                  onClick={() => handleAnswerS1(option)}
                                  disabled={revealed}
                                  className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                                >
                                  <span>{option}</span>
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
                                  className={`rounded-xl px-5 py-3 mb-4 flex items-center gap-3 ${
                                    answer === q.correctAnswer ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                                  }`}
                                >
                                  {answer === q.correctAnswer ? (
                                    <>
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                      <p className="text-emerald-300 text-sm font-bold">Doğru! +{POINTS_PER_SECTION1_QUESTION} puan kazandın.</p>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                      <p className="text-red-300 text-sm font-bold">Yanlış cevap. +0 puan. Doğrusu: {q.correctAnswer}</p>
                                    </>
                                  )}
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleNextS1}
                                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                                >
                                  {s1Index < SECTION1_QUESTIONS.length - 1 ? 'Sonraki Soru ➔' : 'Bölüm 2\'ye Geç ➔'}
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </motion.div>
                )}

                {section === 2 && (
                  <motion.div key={`s2-${s2Index}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                        Senaryo {s2Index + 1} / {SECTION2_QUESTIONS.length}
                      </span>
                      <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                        {POINTS_PER_SECTION2_QUESTION} puan
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION2_INSTRUCTION}</p>

                    {(() => {
                      const q = SECTION2_QUESTIONS[s2Index];
                      const answer = s2Answers[q.id];
                      const revealed = answer !== null;
                      return (
                        <>
                          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                            <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                              {q.title}
                            </p>
                            <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic">
                              "{q.quote}"
                            </p>
                            <p className="text-slate-500 text-xs mt-3 text-right">— {q.person}</p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            {SCENARIO_OPTIONS.map((option) => {
                              const isSelected = answer === option;
                              const isCorrectOption = option === q.correctAnswer;
                              let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                              if (revealed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                              else if (revealed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                              else if (revealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';

                              return (
                                <motion.button
                                  key={option}
                                  whileHover={!revealed ? { scale: 1.01 } : {}}
                                  whileTap={!revealed ? { scale: 0.99 } : {}}
                                  onClick={() => handleAnswerS2(option)}
                                  disabled={revealed}
                                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                                >
                                  <span>{option}</span>
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
                                    answer === q.correctAnswer ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                                  }`}
                                >
                                  {answer === q.correctAnswer ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className={`text-sm font-bold ${answer === q.correctAnswer ? 'text-emerald-300' : 'text-red-300'}`}>
                                      {answer === q.correctAnswer
                                        ? `Doğru! +${POINTS_PER_SECTION2_QUESTION} puan kazandın.`
                                        : `Yanlış cevap. +0 puan. Doğrusu: ${q.correctAnswer}`}
                                    </p>
                                    <p className="text-slate-300 text-xs mt-1">{q.rationale}</p>
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleNextS2}
                                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                                >
                                  {s2Index < SECTION2_QUESTIONS.length - 1 ? 'Sonraki Senaryo ➔' : 'Bölüm 3\'e Geç ➔'}
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </motion.div>
                )}

                {section === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                        {Object.values(s3Answers).filter((v) => v !== null).length} / {INSTRUMENTS.length} sınıflandırıldı
                      </span>
                      <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                        {TOTAL_SECTION3_POINTS} puan
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed mb-5">{SECTION3_INSTRUCTION}</p>

                    <div className="flex flex-col gap-3 mb-5">
                      {INSTRUMENTS.map((ins) => (
                        <div key={ins.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                          <p className="text-white font-bold text-sm mb-3">{ins.label}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {RISK_LEVELS.map((level) => {
                              const isSelected = s3Answers[ins.id] === level.id;
                              const colorClasses: Record<string, string> = {
                                emerald: isSelected ? 'border-emerald-400 bg-emerald-900/40 text-emerald-200' : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500',
                                amber: isSelected ? 'border-amber-400 bg-amber-900/40 text-amber-200' : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500',
                                red: isSelected ? 'border-red-400 bg-red-900/40 text-red-200' : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500',
                              };
                              return (
                                <button
                                  key={level.id}
                                  type="button"
                                  onClick={() => handleSelectRisk(ins.id, level.id)}
                                  className={`px-3 py-2.5 rounded-lg border-2 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${colorClasses[level.color]}`}
                                >
                                  {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                                  {level.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={allRiskAnswered ? { scale: 1.02 } : {}}
                      whileTap={allRiskAnswered ? { scale: 0.98 } : {}}
                      disabled={!allRiskAnswered}
                      onClick={handleFinishSection3}
                      className={`w-full py-4 rounded-2xl text-lg font-black shadow-lg transition-all ${
                        allRiskAnswered
                          ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white border-b-4 border-blue-800'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {allRiskAnswered
                        ? 'Oyunu Tamamla ve Sonuçları Gör 🏁'
                        : `Tüm araçları sınıflandır (${Object.values(s3Answers).filter((v) => v !== null).length}/${INSTRUMENTS.length})`}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <SidePanel side="right" title="🎯 Strateji Merkezi" subtitle={panel.strategyTitle} items={panel.strategyTips} isDictionary={false} />
      </div>
    </div>
  );
}
