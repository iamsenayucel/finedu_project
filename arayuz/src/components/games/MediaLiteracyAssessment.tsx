import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, Megaphone } from 'lucide-react';
import {
  SECTION1_TITLE,
  SECTION1_INSTRUCTION,
  SECTION1_CASES,
  CLASSIFICATIONS,
  SECTION2_TITLE,
  SECTION2_INSTRUCTION,
  SECTION2_QUESTIONS,
  EXAM_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  POINTS_PER_CASE,
  TOTAL_CASE_POINTS,
  TOTAL_QUESTION_POINTS,
  TOTAL_POINTS,
  getPerformance,
  type ClassificationId,
} from './data/mediaLiteracyAssessmentData';

interface MediaLiteracyAssessmentProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type FinishReason = 'timeout' | 'user';

interface Section1ItemResult {
  caseId: number;
  selected: ClassificationId | null;
  correct: boolean;
  points: number;
}

interface Section2ItemResult {
  questionId: number;
  selected: string | null;
  correct: boolean;
  points: number;
}

interface ExamResults {
  section1: Section1ItemResult[];
  section1Correct: number;
  section1Wrong: number;
  section1Blank: number;
  section1Score: number;
  section2: Section2ItemResult[];
  section2Correct: number;
  section2Wrong: number;
  section2Blank: number;
  section2Score: number;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalScore: number;
  usedMs: number;
  remainingMs: number;
  reason: FinishReason;
}

const CLASSIFICATION_ICONS: Record<ClassificationId, React.ComponentType<{ className?: string }>> = {
  reliable: ShieldCheck,
  suspicious: ShieldAlert,
  manipulative: Megaphone,
};

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

export default function MediaLiteracyAssessment({ onComplete, onBack }: MediaLiteracyAssessmentProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [activeSection, setActiveSection] = useState<1 | 2>(1);
  const [caseIndex, setCaseIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [answers1, setAnswers1] = useState<Record<number, ClassificationId | null>>(() =>
    Object.fromEntries(SECTION1_CASES.map(c => [c.id, null]))
  );
  const [answers2, setAnswers2] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(SECTION2_QUESTIONS.map(q => [q.id, null]))
  );

  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [results, setResults] = useState<ExamResults | null>(null);

  const finalizedRef = useRef(false);

  // ── Sayaç: oyun başladığında çalışır, iki bölüm boyunca kesintisiz devam eder ──
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, EXAM_DURATION_MS - elapsedMs) : EXAM_DURATION_MS;

  const buildResults = (reason: FinishReason, usedMs: number): ExamResults => {
    const section1: Section1ItemResult[] = SECTION1_CASES.map(c => {
      const selected = answers1[c.id];
      const correct = selected !== null && selected === c.correctClassification;
      return { caseId: c.id, selected, correct, points: correct ? POINTS_PER_CASE : 0 };
    });
    const section1Correct = section1.filter(r => r.correct).length;
    const section1Blank = section1.filter(r => r.selected === null).length;
    const section1Wrong = section1.length - section1Correct - section1Blank;
    const section1Score = section1Correct * POINTS_PER_CASE;

    const section2: Section2ItemResult[] = SECTION2_QUESTIONS.map(q => {
      const selected = answers2[q.id];
      const correct = selected !== null && selected === q.correctOptionId;
      return { questionId: q.id, selected, correct, points: correct ? q.points : 0 };
    });
    const section2Correct = section2.filter(r => r.correct).length;
    const section2Blank = section2.filter(r => r.selected === null).length;
    const section2Wrong = section2.length - section2Correct - section2Blank;
    const section2Score = section2.reduce((sum, r) => sum + r.points, 0);

    const totalScore = Math.max(0, Math.min(TOTAL_POINTS, section1Score + section2Score));

    return {
      section1,
      section1Correct,
      section1Wrong,
      section1Blank,
      section1Score,
      section2,
      section2Correct,
      section2Wrong,
      section2Blank,
      section2Score,
      totalCorrect: section1Correct + section2Correct,
      totalWrong: section1Wrong + section2Wrong,
      totalBlank: section1Blank + section2Blank,
      totalScore,
      usedMs,
      remainingMs: Math.max(0, EXAM_DURATION_MS - usedMs),
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
    setConfirmFinishOpen(false);
    setStage('finished');
  };

  useEffect(() => {
    if (stage === 'exam' && startedAt !== null && remainingMs <= 0) {
      finalizeExam('timeout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, stage]);

  const handleStart = () => {
    const start = Date.now();
    setStartedAt(start);
    setNowTick(start);
    setActiveSection(1);
    setCaseIndex(0);
    setQuestionIndex(0);
    setAnswers1(Object.fromEntries(SECTION1_CASES.map(c => [c.id, null])));
    setAnswers2(Object.fromEntries(SECTION2_QUESTIONS.map(q => [q.id, null])));
    setResults(null);
    finalizedRef.current = false;
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setActiveSection(1);
    setCaseIndex(0);
    setQuestionIndex(0);
    setAnswers1(Object.fromEntries(SECTION1_CASES.map(c => [c.id, null])));
    setAnswers2(Object.fromEntries(SECTION2_QUESTIONS.map(q => [q.id, null])));
    setResults(null);
    setConfirmFinishOpen(false);
    finalizedRef.current = false;
    setStage('intro');
  };

  const selectClassification = (caseId: number, classification: ClassificationId) => {
    setAnswers1(prev => ({ ...prev, [caseId]: classification }));
  };

  const selectOption = (questionId: number, optionId: string) => {
    setAnswers2(prev => ({ ...prev, [questionId]: optionId }));
  };

  const answered1 = useMemo(() => SECTION1_CASES.map(c => answers1[c.id] !== null), [answers1]);
  const answered2 = useMemo(() => SECTION2_QUESTIONS.map(q => answers2[q.id] !== null), [answers2]);
  const totalAnswered = answered1.filter(Boolean).length + answered2.filter(Boolean).length;
  const totalItems = SECTION1_CASES.length + SECTION2_QUESTIONS.length;

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
                Güvenilir, şüpheli ve manipülatif finansal içerikleri ayırt et; ardından finansal okuryazarlık
                bilginle çoktan seçmeli soruları çöz.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  'Oyun iki bölümden oluşur: Bölüm 1 - Dedektif Panosu, Bölüm 2 - Finansal Okuryazarlık Testi.',
                  `Bölüm 1'de 5 vaka vardır. Her vakayı "Güvenilir Kaynak", "Şüpheli Kaynak" ya da "Manipülatif / Reklam" olarak sınıflandırırsın. Doğru sınıflandırma ${POINTS_PER_CASE} puan, toplam ${TOTAL_CASE_POINTS} puandır.`,
                  `Bölüm 2'de 5 seçenekli 4 soru vardır. Doğru cevap 15 puan, toplam ${TOTAL_QUESTION_POINTS} puandır.`,
                  'Toplam süre 20 dakikadır ve oyun başladığında kesintisiz işlemeye başlar. Bölümler arasında geçiş yapman süreyi durdurmaz veya sıfırlamaz.',
                  'Süre dolduğunda oyun o ana kadarki cevaplarınla otomatik olarak tamamlanır; cevaplanmamış sorular 0 puan alır.',
                  'Oyunu bitirmeden önce verdiğin cevapları istediğin kadar değiştirebilirsin. Bölümler arasında geçiş yapman cevaplarını silmez.',
                  `Toplam puan ${TOTAL_POINTS}'dür. Oyun tamamlandıktan sonra cevaplar değiştirilemez ve sonuç yalnızca bir kez gönderilir.`,
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
              <StatTile label="Bölüm 1 Puanı" value={`${results.section1Score}/${TOTAL_CASE_POINTS}`} color="text-emerald-400" />
              <StatTile label="Bölüm 2 Puanı" value={`${results.section2Score}/${TOTAL_QUESTION_POINTS}`} color="text-blue-400" />
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
                Bölüm 1 · {SECTION1_TITLE} ({results.section1Correct}/{SECTION1_CASES.length} doğru)
              </h3>
              <div className="space-y-2">
                {SECTION1_CASES.map(c => {
                  const r = results.section1.find(x => x.caseId === c.id)!;
                  const selectedLabel = r.selected ? CLASSIFICATIONS.find(cl => cl.id === r.selected)?.label : null;
                  const correctLabel = CLASSIFICATIONS.find(cl => cl.id === c.correctClassification)?.label;
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
                        <p className="text-slate-300 text-xs mb-1">Vaka {c.id}</p>
                        <p className="text-white text-xs sm:text-sm font-medium mb-1">{c.text}</p>
                        {r.selected === null ? (
                          <p className="text-slate-500 text-xs mb-1">Bu vaka sınıflandırılmadı.</p>
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
                      <span className={`text-sm font-black flex-shrink-0 ${r.correct ? 'text-emerald-400' : 'text-slate-500'}`}>+{r.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bölüm 2 sonuçları */}
            <div className="space-y-3 mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Bölüm 2 · {SECTION2_TITLE} ({results.section2Correct}/{SECTION2_QUESTIONS.length} doğru)
              </h3>
              {SECTION2_QUESTIONS.map((q, idx) => {
                const r = results.section2.find(x => x.questionId === q.id)!;
                const correctOption = q.options.find(o => o.id === q.correctOptionId)!;
                const selectedOption = r.selected ? q.options.find(o => o.id === r.selected) : null;

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
  const currentCase = SECTION1_CASES[caseIndex];
  const currentQuestion = SECTION2_QUESTIONS[questionIndex];

  return (
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
              <button
                type="button"
                onClick={() => setConfirmFinishOpen(true)}
                className="bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border border-red-700/50 transition-colors"
              >
                Sınavı Bitir
              </button>
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
              Bölüm 1 · {SECTION1_TITLE} ({answered1.filter(Boolean).length}/{SECTION1_CASES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-colors ${
                activeSection === 2 ? 'border-blue-400 bg-blue-900/50 text-blue-100' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              Bölüm 2 · {SECTION2_TITLE} ({answered2.filter(Boolean).length}/{SECTION2_QUESTIONS.length})
            </button>
          </div>

          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(totalAnswered / totalItems) * 100}%` }}
            />
          </div>

          <div className="mt-3">
            {activeSection === 1 ? (
              <NavPills count={SECTION1_CASES.length} currentIndex={caseIndex} answeredIndexes={answered1} onJump={setCaseIndex} />
            ) : (
              <NavPills count={SECTION2_QUESTIONS.length} currentIndex={questionIndex} answeredIndexes={answered2} onJump={setQuestionIndex} />
            )}
          </div>
        </div>
      </div>

      {/* Görev kartı */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeSection === 1 ? (
              <motion.div
                key={`case-${caseIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">Vaka {caseIndex + 1} / {SECTION1_CASES.length}</span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {POINTS_PER_CASE} puan
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION1_INSTRUCTION}</p>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{currentCase.text}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {CLASSIFICATIONS.map(option => {
                    const Icon = CLASSIFICATION_ICONS[option.id];
                    const isSelected = answers1[currentCase.id] === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.005 }}
                        onClick={() => selectClassification(currentCase.id, option.id)}
                        className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center gap-3 ${
                          isSelected ? 'bg-blue-900/40 border-blue-400 text-blue-100' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-sm">
                          {option.icon} {option.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 mt-6">
                  <button
                    type="button"
                    disabled={caseIndex === 0}
                    onClick={() => setCaseIndex(i => Math.max(0, i - 1))}
                    className="px-5 py-3 rounded-xl text-sm font-bold border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Önceki Vaka
                  </button>
                  {caseIndex < SECTION1_CASES.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCaseIndex(i => i + 1)}
                      className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border-b-4 border-purple-800 transition-all"
                    >
                      Sonraki Vaka →
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveSection(2);
                        setQuestionIndex(0);
                      }}
                      className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border-b-4 border-purple-800 transition-all"
                    >
                      Bölüm 2'ye Geç →
                    </motion.button>
                  )}
                </div>
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
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">Soru {questionIndex + 1} / {SECTION2_QUESTIONS.length}</span>
                  <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                    {currentQuestion.points} puan
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4">{SECTION2_INSTRUCTION}</p>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">{currentQuestion.prompt}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map(option => {
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
                    onClick={() => {
                      if (questionIndex === 0) {
                        setActiveSection(1);
                        setCaseIndex(SECTION1_CASES.length - 1);
                      } else {
                        setQuestionIndex(i => i - 1);
                      }
                    }}
                    className="px-5 py-3 rounded-xl text-sm font-bold border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    ← Önceki
                  </button>
                  {questionIndex < SECTION2_QUESTIONS.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setQuestionIndex(i => i + 1)}
                      className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border-b-4 border-purple-800 transition-all"
                    >
                      Sonraki Soru →
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setConfirmFinishOpen(true)}
                      className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-lg border-b-4 border-blue-800 transition-all"
                    >
                      Sınavı Bitir 🏁
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bitirme onayı */}
      <AnimatePresence>
        {confirmFinishOpen && (
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
              <h3 className="text-white font-black text-lg mb-2">Sınavı bitirmek istiyor musun?</h3>
              <p className="text-slate-400 text-sm mb-5">
                Cevaplanmayan {totalItems - totalAnswered} soru/vaka 0 puan alacak. Bitirdikten sonra cevaplarını değiştiremezsin.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmFinishOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl text-sm border border-slate-700 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => finalizeExam('user')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3 rounded-xl text-sm shadow-lg border-b-4 border-purple-800 transition-all"
                >
                  Evet, Bitir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
