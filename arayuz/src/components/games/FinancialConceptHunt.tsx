import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import {
  QUESTIONS,
  EXAM_DURATION_MS,
  POINTS_PER_QUESTION,
  LOW_TIME_THRESHOLD_MS,
  getBadge,
  isAnswerCorrect,
  shuffle,
} from './data/financialConceptHuntData';

interface FinancialConceptHuntProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';
type AnswerMap = Record<number, string[]>;
type QuestionStatus = 'unanswered' | 'in_time' | 'after_time';

interface StoredState {
  startedAt: number;
  currentIndex: number;
  shuffledTerms: Record<number, string[]>;
  scoredAnswers: AnswerMap;
  practiceAnswers: AnswerMap;
  finished: boolean;
  finishedAt: number | null;
}

const STORAGE_KEY = 'fch_exam_session_v1';

function loadStored(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function saveStored(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage kullanılamıyor — kalıcılık olmadan devam et */
  }
}

function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok say */
  }
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

function buildShuffledTerms(): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  QUESTIONS.forEach(q => {
    result[q.id] = shuffle(q.termPool);
  });
  return result;
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function FinancialConceptHunt({ onComplete, onBack }: FinancialConceptHuntProps) {
  const restoredRef = useRef<StoredState | null>(loadStored());
  const restored = restoredRef.current;

  const [stage, setStage] = useState<Stage>(() => {
    if (!restored) return 'intro';
    return restored.finished ? 'finished' : 'exam';
  });
  const [startedAt, setStartedAt] = useState<number | null>(restored?.startedAt ?? null);
  const [currentIndex, setCurrentIndex] = useState<number>(restored?.currentIndex ?? 0);
  const [shuffledTerms, setShuffledTerms] = useState<Record<number, string[]>>(restored?.shuffledTerms ?? {});
  const [scoredAnswers, setScoredAnswers] = useState<AnswerMap>(restored?.scoredAnswers ?? {});
  const [practiceAnswers, setPracticeAnswers] = useState<AnswerMap>(restored?.practiceAnswers ?? {});
  const [finishedAt, setFinishedAt] = useState<number | null>(restored?.finishedAt ?? null);

  const [draft, setDraft] = useState<string[]>([]);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [maxSelectWarning, setMaxSelectWarning] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const warnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = QUESTIONS[currentIndex];

  // ── Kalıcılık: sınav başladıktan sonra her önemli değişiklikte localStorage'a yaz ──
  useEffect(() => {
    if (stage === 'intro' || startedAt === null) return;
    saveStored({
      startedAt,
      currentIndex,
      shuffledTerms,
      scoredAnswers,
      practiceAnswers,
      finished: stage === 'finished',
      finishedAt,
    });
  }, [stage, startedAt, currentIndex, shuffledTerms, scoredAnswers, practiceAnswers, finishedAt]);

  // ── Sayaç: tek interval, her tick'te Date.now() referans alınarak kalan süre yeniden hesaplanır ──
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, EXAM_DURATION_MS - elapsedMs) : EXAM_DURATION_MS;
  const examExpired = startedAt !== null && elapsedMs >= EXAM_DURATION_MS;

  const getStatus = (questionId: number): QuestionStatus => {
    if (practiceAnswers[questionId]) return 'after_time';
    if (scoredAnswers[questionId]) return 'in_time';
    return 'unanswered';
  };

  const displayedAnswer = practiceAnswers[currentQuestion.id] ?? scoredAnswers[currentQuestion.id] ?? [];

  // Soru değişince taslak seçim, o soru için son onaylanmış cevaba döner (onaylanmamış değişiklikler atılır)
  useEffect(() => {
    setDraft(practiceAnswers[currentQuestion.id] ?? scoredAnswers[currentQuestion.id] ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const currentScore = QUESTIONS.reduce((sum, q) => {
    const scored = scoredAnswers[q.id];
    return scored && isAnswerCorrect(scored, q.correctAnswers) ? sum + POINTS_PER_QUESTION : sum;
  }, 0);

  const handleStart = () => {
    const shuffles = buildShuffledTerms();
    const start = Date.now();
    setShuffledTerms(shuffles);
    setStartedAt(start);
    setNowTick(start);
    setCurrentIndex(0);
    setScoredAnswers({});
    setPracticeAnswers({});
    setFinishedAt(null);
    setDraft([]);
    setStage('exam');
  };

  const toggleTerm = (term: string) => {
    setDraft(prev => {
      if (prev.includes(term)) return prev.filter(t => t !== term);
      if (prev.length >= 2) {
        setMaxSelectWarning(true);
        if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
        warnTimeoutRef.current = setTimeout(() => setMaxSelectWarning(false), 2200);
        return prev;
      }
      return [...prev, term];
    });
  };

  const handleConfirm = () => {
    if (draft.length !== 2) return;
    const qid = currentQuestion.id;
    if (!examExpired) {
      setScoredAnswers(prev => ({ ...prev, [qid]: draft }));
    } else {
      setPracticeAnswers(prev => ({ ...prev, [qid]: draft }));
    }
    // Onaylandıktan sonra otomatik olarak sonraki soruya geç (son soruda otomatik bitirme yapılmaz)
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (index < 0 || index >= QUESTIONS.length) return;
    setCurrentIndex(index);
  };

  const handleFinish = () => {
    const finishTime = Date.now();
    if (onComplete) onComplete(currentScore);
    setFinishedAt(finishTime);
    setStage('finished');
  };

  const handleRestart = () => {
    clearStored();
    setStage('intro');
    setStartedAt(null);
    setCurrentIndex(0);
    setShuffledTerms({});
    setScoredAnswers({});
    setPracticeAnswers({});
    setFinishedAt(null);
    setDraft([]);
    setShowReview(false);
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
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                Finansal Sistem Kavramlarını Keşfet
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Ekonomik sistemin temel aktörlerini, gelir ve harcama akışlarını ve finansal kurumları doğru
                kavramlarla eşleştir.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  'Toplam 4 soru bulunmaktadır.',
                  'Her soruda iki kavram seçilmelidir.',
                  'Her doğru soru 25 puandır.',
                  'En yüksek puan 100’dür.',
                  'Sınav süresi 12 dakikadır.',
                  'Süre bittikten sonra sorular cevaplanmaya devam edilebilir.',
                  'Süre bittikten sonra verilen veya değiştirilen cevaplar puana dahil edilmez.',
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
                Sınavı Başlat 🚀
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const badge = getBadge(currentScore);
    const correctCount = QUESTIONS.filter(q => {
      const scored = scoredAnswers[q.id];
      return scored && isAnswerCorrect(scored, q.correctAnswers);
    }).length;
    const incorrectCount = QUESTIONS.length - correctCount;
    const inTimeCount = QUESTIONS.filter(q => getStatus(q.id) === 'in_time').length;
    const afterTimeCount = QUESTIONS.filter(q => getStatus(q.id) === 'after_time').length;
    const completionMs = finishedAt && startedAt ? finishedAt - startedAt : 0;
    const maxScore = QUESTIONS.length * POINTS_PER_QUESTION;

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-7xl mb-4"
              >
                {badge.icon}
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-1">Sınav Tamamlandı!</h2>
              <p className={`text-xl font-bold mb-4 ${badge.color}`}>{badge.label}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl">
                {currentScore} / {maxScore} Puan
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatTile label="Doğru Soru" value={correctCount} color="text-emerald-400" />
              <StatTile label="Yanlış Soru" value={incorrectCount} color="text-red-400" />
              <StatTile label="Süre İçi Cevap" value={inTimeCount} color="text-blue-400" />
              <StatTile label="Süre Sonrası Cevap" value={afterTimeCount} color="text-amber-400" />
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600/50 mb-6 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Tamamlanma Süresi</p>
              <p className="text-white font-black text-lg">{formatDuration(completionMs)}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <button
                onClick={() => setShowReview(v => !v)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base border border-slate-600 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/40"
              >
                {showReview ? 'Cevapları Gizle' : 'Cevapları İncele'} 🔍
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3.5 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50"
              >
                Oyunu Tekrar Başlat 🔄
              </motion.button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-2xl text-sm sm:text-base border border-slate-700 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/40"
                >
                  Oyunlar Sayfasına Dön
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
                    {QUESTIONS.map((q, idx) => {
                      const status = getStatus(q.id);
                      const displayed = practiceAnswers[q.id] ?? scoredAnswers[q.id] ?? [];
                      const displayedCorrect = isAnswerCorrect(displayed, q.correctAnswers);
                      const scored = scoredAnswers[q.id];
                      const pointsEarned = scored && isAnswerCorrect(scored, q.correctAnswers) ? POINTS_PER_QUESTION : 0;
                      const showAfterTimeNote = status === 'after_time' && displayedCorrect;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border ${
                            status === 'unanswered'
                              ? 'bg-slate-800/40 border-slate-700'
                              : displayedCorrect
                              ? 'bg-emerald-900/30 border-emerald-700/40'
                              : 'bg-red-900/30 border-red-700/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {status === 'unanswered' ? (
                              <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                            ) : displayedCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-300 text-xs mb-1">Soru {idx + 1}</p>
                              <p className="text-white text-sm font-medium mb-1">
                                Seçtiklerin: {displayed.length ? displayed.join(', ') : '—'}
                              </p>
                              <p className="text-emerald-300 text-xs mb-1">
                                Doğru kavramlar: {q.correctAnswers.join(', ')}
                              </p>
                              <p className="text-slate-400 text-xs">
                                {status === 'unanswered'
                                  ? 'Cevaplanmadı'
                                  : status === 'in_time'
                                  ? 'Süre içinde cevaplandı'
                                  : 'Süre sonrasında cevaplandı'}
                              </p>
                              {showAfterTimeNote && (
                                <p className="text-amber-300 text-xs mt-1 font-medium">
                                  Doğru cevaplandı ancak süre sonrasında tamamlandığı için puana dahil edilmedi.
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-sm font-black flex-shrink-0 ${
                                pointsEarned ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              +{pointsEarned}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
  const terms = shuffledTerms[currentQuestion.id] ?? currentQuestion.termPool;
  const currentStatus = getStatus(currentQuestion.id);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Üst bilgi çubuğu */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                FinEdu
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">
                Finansal Sistem: Kavram Avı
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                Soru {currentIndex + 1} / {QUESTIONS.length}
              </span>
              <motion.span
                animate={
                  remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0
                    ? { scale: [1, 1.08, 1] }
                    : { scale: 1 }
                }
                transition={{
                  repeat: remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? Infinity : 0,
                  duration: 1,
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border ${
                  remainingMs <= LOW_TIME_THRESHOLD_MS
                    ? 'bg-red-900/60 text-red-300 border-red-600/60'
                    : 'bg-slate-700/60 text-slate-200 border-slate-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {formatCountdown(remainingMs)}
              </motion.span>
              <span className="bg-blue-900/60 text-blue-300 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border border-blue-700/60">
                Puan: {currentScore}
              </span>
            </div>
          </div>

          {/* İlerleme çubuğu */}
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Soru navigasyonu / cevap durumu */}
          <div className="mt-3 flex items-center gap-2">
            {QUESTIONS.map((q, i) => {
              const st = getStatus(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  aria-current={i === currentIndex}
                  aria-label={`Soru ${i + 1} — ${
                    st === 'in_time' ? 'cevaplandı' : st === 'after_time' ? 'süre sonrasında cevaplandı' : 'cevaplanmadı'
                  }`}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                    i === currentIndex
                      ? 'border-blue-400 bg-blue-900/60 text-blue-200'
                      : st === 'in_time'
                      ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
                      : st === 'after_time'
                      ? 'border-amber-600 bg-amber-900/40 text-amber-300 hover:bg-amber-900/60'
                      : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Süre doldu uyarısı */}
      <AnimatePresence>
        {examExpired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 bg-amber-900/40 border border-amber-600/50 rounded-2xl px-5 py-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm font-medium">
              Sınav süresi doldu. Soruları cevaplamaya devam edebilirsiniz ancak bu saatten sonraki cevaplar puana
              dahil edilmeyecektir.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* İki sütunlu içerik: sol %65 soru, sağ %35 kavramlar */}
      <div className="grid grid-cols-1 lg:grid-cols-[13fr_7fr] gap-5 items-start">
        {/* Sol: paragraf + soru */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                    Soru {currentIndex + 1}
                  </span>
                  {currentStatus !== 'unanswered' && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        currentStatus === 'in_time'
                          ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                          : 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                      }`}
                    >
                      {currentStatus === 'in_time' ? 'Cevaplandı' : 'Süre sonrasında cevaplandı'}
                    </span>
                  )}
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{currentQuestion.paragraph}</p>
                </div>

                <div className="bg-slate-800/60 rounded-xl px-5 py-4 border border-slate-700 mb-2">
                  <p className="text-white font-bold text-sm sm:text-base">❓ {currentQuestion.question}</p>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-5">İki kavram seçiniz.</p>

                <AnimatePresence>
                  {maxSelectWarning && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-xs font-bold mb-3"
                      role="alert"
                    >
                      En fazla iki kavram seçebilirsiniz.
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={draft.length === 2 ? { scale: 1.02 } : {}}
                  whileTap={draft.length === 2 ? { scale: 0.98 } : {}}
                  onClick={handleConfirm}
                  disabled={draft.length !== 2}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-base sm:text-lg shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50"
                >
                  Cevabı Onayla ✅
                </motion.button>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <button
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Önceki Soru
                  </button>

                  {currentIndex < QUESTIONS.length - 1 ? (
                    <button
                      onClick={() => goToQuestion(currentIndex + 1)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white font-bold text-sm px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                    >
                      Sonraki Soru <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFinish}
                      className="flex items-center gap-1.5 text-white font-black text-sm px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                    >
                      <Trophy className="w-4 h-4" /> Sonuçları Gör
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sağ: kavram kartları */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 p-5">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Kavramlar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {terms.map(term => {
              const isSelected = draft.includes(term);
              return (
                <motion.button
                  key={term}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleTerm(term)}
                  aria-pressed={isSelected}
                  className={`relative w-full text-left px-5 py-4 rounded-2xl border-2 font-bold text-sm sm:text-base transition-all flex items-center justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 ${
                    isSelected
                      ? 'bg-blue-900/40 border-blue-400 text-blue-100 shadow-lg -translate-y-0.5'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
                  }`}
                >
                  <span>{term}</span>
                  {isSelected ? (
                    <span className="flex items-center gap-1.5 text-blue-300 text-xs font-black bg-blue-950/60 px-2 py-1 rounded-full border border-blue-500/50 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Seçildi
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-slate-500 flex-shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
