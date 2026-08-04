import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { QUESTIONS, EXAM_DURATION_MS, TOTAL_POINTS, LOW_TIME_THRESHOLD_MS, getPerformance } from './data/incomeTypeAssessmentData';

interface IncomeTypeAssessmentProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'exam' | 'finished';

interface AnswerRecord {
  questionId: number;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsEarned: number;
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

export default function IncomeTypeAssessment({ onComplete, onBack }: IncomeTypeAssessmentProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [history, setHistory] = useState<AnswerRecord[]>([]);

  const finalizedRef = useRef(false);
  const currentQuestion = QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  // ── Sayaç ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'exam' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, EXAM_DURATION_MS - elapsedMs) : EXAM_DURATION_MS;

  const score = history.reduce((sum, r) => sum + r.pointsEarned, 0);

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
    setSelectedOptionId(null);
    setLocked(false);
    setHistory([]);
    finalizedRef.current = false;
    setStage('exam');
  };

  const handleRestart = () => {
    setStartedAt(null);
    setFinishedAt(null);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setLocked(false);
    setHistory([]);
    finalizedRef.current = false;
    setStage('intro');
  };

  const handleSelect = (optionId: string) => {
    if (locked) return;
    setSelectedOptionId(optionId);
  };

  const handleConfirm = () => {
    if (locked || selectedOptionId === null) return;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;
    setLocked(true);
    setHistory(prev => [
      ...prev,
      { questionId: currentQuestion.id, selectedOptionId, isCorrect, pointsEarned },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      finalizeExam();
      return;
    }
    setCurrentIndex(i => i + 1);
    setSelectedOptionId(null);
    setLocked(false);
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
                <Coins className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Gelir Türü: Ölçme Değerlendirme</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                Aktif gelir, pasif gelir, zaman-para ilişkisi, hisse senedi, temettü ve faiz getirisi gibi kavramları
                ne kadar iyi kavradığını senaryo tabanlı sorularla ölç.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                📋 Kurallar
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  'Toplam 7 soru bulunmaktadır.',
                  'Her soruda yalnızca bir doğru cevap vardır.',
                  'Sorular sırasıyla cevaplanacaktır.',
                  'Bir cevap seçmeden bir sonraki soruya geçilemez.',
                  'İlk 6 soru 15\'er puan, 7. soru 10 puandır. Toplam 100 puandır.',
                  'Sınav süresi 28 dakikadır.',
                  'Tüm sorular tamamlandığında sonuç ekranı açılacaktır.',
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
    const correctCount = history.filter(r => r.isCorrect).length;
    const incorrectCount = history.filter(r => !r.isCorrect).length;
    const unansweredCount = QUESTIONS.length - history.length;
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
              <StatTile label="Doğru Soru" value={correctCount} color="text-emerald-400" />
              <StatTile label="Yanlış Soru" value={incorrectCount} color="text-red-400" />
              <StatTile label="Boş Soru" value={unansweredCount} color="text-slate-400" />
              <StatTile label="Süre" value={formatDuration(completionMs)} color="text-blue-400" />
            </div>

            <div className="space-y-3 mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Soru Soru Sonuçların</h3>
              {QUESTIONS.map((q, idx) => {
                const record = history.find(r => r.questionId === q.id);
                const attempted = !!record;
                const correctOption = q.options.find(o => o.id === q.correctOptionId)!;
                const selectedOption = record ? q.options.find(o => o.id === record.selectedOptionId) : null;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      !attempted
                        ? 'bg-slate-800/40 border-slate-700'
                        : record!.isCorrect
                        ? 'bg-emerald-900/30 border-emerald-700/40'
                        : 'bg-red-900/30 border-red-700/40'
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
  const lastRecord = locked ? history[history.length - 1] : null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Üst bilgi çubuğu */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                FinEdu
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 font-bold text-sm truncate hidden sm:inline">Gelir Türü Değerlendirmesi</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                Soru {currentIndex + 1} / {QUESTIONS.length}
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
                <Clock className="w-3.5 h-3.5" /> {formatCountdown(remainingMs)}
              </motion.span>
              <span className="bg-blue-900/60 text-blue-300 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border border-blue-700/60">
                Puan: {score}
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

          {/* Soru durumu göstergeleri (salt görsel, gezinme yapılamaz) */}
          <div className="mt-3 flex items-center gap-2">
            {QUESTIONS.map((q, i) => (
              <div
                key={q.id}
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

      {/* Soru kartı */}
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
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                  Soru {currentIndex + 1}
                </span>
                <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                  {currentQuestion.points} puan
                </span>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{currentQuestion.prompt}</p>
              </div>

              <div className="bg-slate-800/60 rounded-xl px-5 py-4 border border-slate-700 mb-4">
                <p className="text-white font-bold text-sm sm:text-base">❓ {currentQuestion.question}</p>
              </div>

              <div className="flex flex-col gap-3">
                {currentQuestion.options.map(option => {
                  const isSelected = selectedOptionId === option.id;
                  const revealed = locked;
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
                      {revealed && option.id === currentQuestion.correctOptionId && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      )}
                      {revealed && isSelected && option.id !== currentQuestion.correctOptionId && (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {!locked && (
                <div className="flex justify-center mt-5">
                  <motion.button
                    whileHover={selectedOptionId !== null ? { scale: 1.02 } : {}}
                    whileTap={selectedOptionId !== null ? { scale: 0.98 } : {}}
                    onClick={handleConfirm}
                    disabled={selectedOptionId === null}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-10 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
                  >
                    Cevabı Onayla ✅
                  </motion.button>
                </div>
              )}

              <AnimatePresence>
                {locked && lastRecord && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5"
                  >
                    <div
                      className={`rounded-xl px-5 py-3 mb-3 flex items-center gap-3 ${
                        lastRecord.isCorrect ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                      }`}
                    >
                      {lastRecord.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <p className={`text-sm font-bold ${lastRecord.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                        {lastRecord.isCorrect ? 'Doğru!' : 'Yanlış cevap.'} +{lastRecord.pointsEarned} puan.
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
                      {isLastQuestion ? 'Sonucu Gör 🏆' : 'Sonraki Soru ➔'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
