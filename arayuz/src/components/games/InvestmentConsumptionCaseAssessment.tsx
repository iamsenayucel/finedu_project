import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  ASSESSMENT_CASES,
  CLASSIFICATION_OPTIONS,
  POINTS_PER_STAGE,
  TOTAL_CASES,
  TOTAL_STAGES,
  MAX_SCORE,
  GAME_DURATION_MS,
  LOW_TIME_THRESHOLD_MS,
  getPerformance,
  shuffleCases,
  type AssessmentCase,
  type Classification,
  type McAnswer,
} from './data/investmentConsumptionCaseAssessmentData';

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

interface InvestmentConsumptionCaseAssessmentProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'case' | 'finished';
type SubStage = 'classify' | 'question';

interface StageRecord {
  caseId: number;
  caseTitle: string;
  subStage: SubStage;
  isCorrect: boolean;
  selectedLabel: string;
  correctLabel: string;
  feedback: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InvestmentConsumptionCaseAssessment({ onComplete, onBack }: InvestmentConsumptionCaseAssessmentProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [orderedCases, setOrderedCases] = useState<AssessmentCase[]>(ASSESSMENT_CASES);
  const [caseIndex, setCaseIndex] = useState(0);
  const [subStage, setSubStage] = useState<SubStage>('classify');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [history, setHistory] = useState<StageRecord[]>([]);
  const [classifySelected, setClassifySelected] = useState<Classification | null>(null);
  const [classifyConfirmed, setClassifyConfirmed] = useState(false);
  const [questionSelected, setQuestionSelected] = useState<McAnswer | null>(null);
  const [questionConfirmed, setQuestionConfirmed] = useState(false);

  // ── Sayaç: oyun başladığında çalışır, süre dolunca değerlendirme otomatik biter ──
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [usedMs, setUsedMs] = useState(0);
  const [finishReason, setFinishReason] = useState<'timeout' | 'user'>('user');
  const finalizedRef = useRef(false);

  useEffect(() => {
    if (stage !== 'case' || startedAt === null) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stage, startedAt]);

  const elapsedMs = startedAt !== null ? nowTick - startedAt : 0;
  const remainingMs = startedAt !== null ? Math.max(0, GAME_DURATION_MS - elapsedMs) : GAME_DURATION_MS;

  const currentCase = orderedCases[caseIndex];
  const lastRecord = history[history.length - 1];

  const finalizeAssessment = (reason: 'timeout' | 'user') => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    setUsedMs(startedAt !== null ? Date.now() - startedAt : 0);
    setFinishReason(reason);
    if (onComplete) onComplete(score);
    setStage('finished');
  };

  useEffect(() => {
    if (stage === 'case' && startedAt !== null && remainingMs <= 0) {
      finalizeAssessment('timeout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, stage]);

  const handleStart = () => {
    setOrderedCases(shuffleEnabled ? shuffleCases(ASSESSMENT_CASES) : ASSESSMENT_CASES);
    setCaseIndex(0);
    setSubStage('classify');
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setClassifySelected(null);
    setClassifyConfirmed(false);
    setQuestionSelected(null);
    setQuestionConfirmed(false);
    setUsedMs(0);
    setFinishReason('user');
    finalizedRef.current = false;
    const start = Date.now();
    setStartedAt(start);
    setNowTick(start);
    setStage('case');
  };

  // ── Sınıflandırma (1. Aşama) ──
  const handleClassifySelect = (answer: Classification) => {
    if (classifyConfirmed) return;
    setClassifySelected(answer);
  };

  const handleClassifyConfirm = () => {
    if (classifySelected === null || classifyConfirmed) return;
    const isCorrect = classifySelected === currentCase.correctClassification;
    if (isCorrect) {
      setScore(prev => prev + POINTS_PER_STAGE);
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
    const correctOpt = CLASSIFICATION_OPTIONS.find(o => o.id === currentCase.correctClassification)!;
    const selectedOpt = CLASSIFICATION_OPTIONS.find(o => o.id === classifySelected)!;
    setHistory(prev => [...prev, {
      caseId: currentCase.id,
      caseTitle: currentCase.title,
      subStage: 'classify',
      isCorrect,
      selectedLabel: selectedOpt.label,
      correctLabel: correctOpt.label,
      feedback: isCorrect ? currentCase.classifyCorrectFeedback : currentCase.classifyWrongFeedback,
    }]);
    setClassifyConfirmed(true);
  };

  const handleGoToQuestion = () => {
    setSubStage('question');
  };

  // ── Soru (2. Aşama) ──
  const handleQuestionSelect = (answer: McAnswer) => {
    if (questionConfirmed) return;
    setQuestionSelected(answer);
  };

  const handleQuestionConfirm = () => {
    if (questionSelected === null || questionConfirmed) return;
    const isCorrect = questionSelected === currentCase.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + POINTS_PER_STAGE);
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
    const correctOpt = currentCase.options.find(o => o.id === currentCase.correctAnswer)!;
    const selectedOpt = currentCase.options.find(o => o.id === questionSelected)!;
    setHistory(prev => [...prev, {
      caseId: currentCase.id,
      caseTitle: currentCase.title,
      subStage: 'question',
      isCorrect,
      selectedLabel: selectedOpt.label,
      correctLabel: correctOpt.label,
      feedback: isCorrect ? currentCase.questionCorrectFeedback : currentCase.questionWrongFeedback,
    }]);
    setQuestionConfirmed(true);
  };

  const handleNextCase = () => {
    setClassifySelected(null);
    setClassifyConfirmed(false);
    setQuestionSelected(null);
    setQuestionConfirmed(false);
    if (caseIndex < orderedCases.length - 1) {
      setCaseIndex(prev => prev + 1);
      setSubStage('classify');
    } else {
      finalizeAssessment('user');
    }
  };

  const handleRestart = () => {
    setStage('intro');
    setCaseIndex(0);
    setSubStage('classify');
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setClassifySelected(null);
    setClassifyConfirmed(false);
    setQuestionSelected(null);
    setQuestionConfirmed(false);
    setStartedAt(null);
    setUsedMs(0);
    setFinishReason('user');
    finalizedRef.current = false;
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-1">Yatırım mı, Tüketim mi? Vaka Değerlendirmesi ⚖️</h1>
          <p className="text-muted-foreground text-sm">
            10 vaka × 2 aşama · Maks. {MAX_SCORE} puan · Süre: {Math.round(GAME_DURATION_MS / 60000)} dk
          </p>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6 max-w-3xl mx-auto">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
            📋 Kurallar
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {[
              `Oyunda ${TOTAL_CASES} vaka bulunur. Her vakanın 2 aşaması vardır: önce senaryoyu "Yatırım Kutusu" ya da "Tüketim Kutusu" olarak sınıflandırırsın, sonra bir soruyu cevaplarsın.`,
              `Bir seçim yapmadan sonraki aşamaya geçemezsin. Cevabını onayladıktan sonra seçimini değiştiremezsin.`,
              `Her doğru cevap ${POINTS_PER_STAGE} puan değerindedir, toplam ${TOTAL_STAGES} aşama × ${POINTS_PER_STAGE} puan = ${MAX_SCORE} puandır. Yanlış cevaplar puan kaybettirmez.`,
              `Sonuç ekranında ham puanın yanında (doğru sayısı / ${TOTAL_STAGES}) × 100 formülüyle hesaplanan başarı yüzdesi de gösterilir.`,
              `Toplam süren ${Math.round(GAME_DURATION_MS / 60000)} dakikadır. Süre dolduğunda değerlendirme o ana kadarki puanınla otomatik olarak sona erer.`,
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4">
          <label className="flex items-center gap-3 bg-slate-800/60 border border-slate-600/50 rounded-full px-5 py-2.5 cursor-pointer select-none">
            <span className="text-slate-300 text-sm font-bold">🔀 Vakaları Karıştır</span>
            <button
              type="button"
              role="switch"
              aria-checked={shuffleEnabled}
              onClick={() => setShuffleEnabled(prev => !prev)}
              className={`relative w-11 h-6 rounded-full transition-colors ${shuffleEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${shuffleEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </label>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-purple-800"
          >
            Oyuna Başla ⚖️
          </motion.button>
        </div>
      </div>
    );
  }

  // ── FINISHED ────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const perf = getPerformance(correctCount);
    const successRate = Math.round((correctCount / TOTAL_STAGES) * 100);
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-gradient-to-br ${perf.bg} rounded-3xl overflow-hidden shadow-2xl border border-slate-700`}>
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-7xl mb-4"
              >
                {perf.icon}
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-1">Değerlendirme Tamamlandı!</h2>
              <p className={`text-xl font-bold mb-4 ${perf.color}`}>{perf.label}</p>
              <p className="text-slate-400 text-sm mb-1">{perf.sub}</p>
              <p className="text-slate-500 text-xs mb-6">
                {finishReason === 'timeout' ? 'Süre dolduğu için otomatik tamamlandı.' : 'Tarafınca tamamlandı.'}
              </p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl mb-3">
                {score} / {MAX_SCORE} Puan
              </div>
              <p className="text-slate-300 text-lg font-bold">Başarı Yüzdesi: %{successRate}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-emerald-400">{correctCount}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Doğru Cevap</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-red-400">{wrongCount}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Yanlış Cevap</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-blue-400">{history.length} / {TOTAL_STAGES}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Tamamlanan Aşama</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-amber-400">{formatDuration(usedMs)}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Kullanılan Süre</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Vaka Vaka Kararların</h3>
              {history.map((record, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${record.isCorrect ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'}`}>
                  {record.isCorrect
                    ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs mb-0.5">
                      {record.caseTitle} · {record.subStage === 'classify' ? '1. Aşama: Sınıflandırma' : '2. Aşama: Soru'}
                    </p>
                    <p className="text-white text-sm font-medium">Seçtiğin: {record.selectedLabel}</p>
                    {!record.isCorrect && (
                      <p className="text-emerald-300 text-xs mt-0.5">Doğrusu: {record.correctLabel}</p>
                    )}
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">{record.feedback}</p>
                  </div>
                  <span className={`text-sm font-black flex-shrink-0 ${record.isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {record.isCorrect ? `+${POINTS_PER_STAGE}` : '+0'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
              >
                Tekrar Oyna 🔄
              </motion.button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 rounded-2xl text-lg border border-slate-700 transition-all"
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

  // ── CASE SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-700">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Vaka</span>
            <div className="flex gap-1.5">
              {orderedCases.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-all duration-300 ${
                    i < caseIndex ? 'bg-emerald-500' : i === caseIndex ? 'bg-blue-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-slate-300 font-bold text-sm">{caseIndex + 1} / {orderedCases.length}</span>
            <span className="text-slate-500 text-xs font-bold">· {subStage === 'classify' ? 'Aşama 1/2' : 'Aşama 2/2'}</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              animate={remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ repeat: remainingMs <= LOW_TIME_THRESHOLD_MS && remainingMs > 0 ? Infinity : 0, duration: 1 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black border ${
                remainingMs <= LOW_TIME_THRESHOLD_MS ? 'bg-red-900/60 text-red-300 border-red-600/60' : 'bg-slate-700/60 text-slate-200 border-slate-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> {formatCountdown(remainingMs)}
            </motion.span>
            <div className="bg-blue-900/60 text-blue-300 px-4 py-1.5 rounded-full text-sm font-black border border-blue-700/60">
              ⚖️ {score} puan
            </div>
          </div>
        </div>

        <div className="p-6">
              <AnimatePresence mode="wait">
                {subStage === 'classify' ? (
                  <motion.div
                    key={`${caseIndex}-classify`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Vaka başlık + senaryo */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                      <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Vaka {caseIndex + 1}: {currentCase.title}
                      </p>
                      <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{currentCase.scenario}</p>
                    </div>

                    <p className="text-center text-slate-400 text-sm mb-4 font-medium">
                      Bu durumu doğru kutuya yerleştir
                    </p>

                    {/* Sınıflandırma kutuları */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {CLASSIFICATION_OPTIONS.map((option) => {
                        const isSelected = classifySelected === option.id;
                        const isCorrectOption = option.id === currentCase.correctClassification;
                        let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                        if (classifyConfirmed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                        else if (classifyConfirmed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                        else if (classifyConfirmed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';
                        else if (isSelected) btnClass = 'bg-blue-900/40 border-blue-400 text-blue-100';

                        return (
                          <motion.button
                            key={option.id}
                            whileHover={!classifyConfirmed ? { scale: 1.02 } : {}}
                            whileTap={!classifyConfirmed ? { scale: 0.98 } : {}}
                            onClick={() => handleClassifySelect(option.id)}
                            disabled={classifyConfirmed}
                            className={`flex-1 flex flex-col items-center justify-center gap-2 px-5 py-8 rounded-2xl border-2 font-medium transition-all ${btnClass}`}
                          >
                            <span className="text-4xl">{option.icon}</span>
                            <span className="font-black text-lg">{option.label}</span>
                            {classifyConfirmed && isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                            {classifyConfirmed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Onayla butonu */}
                    {!classifyConfirmed && (
                      <motion.button
                        whileHover={classifySelected !== null ? { scale: 1.02 } : {}}
                        whileTap={classifySelected !== null ? { scale: 0.98 } : {}}
                        onClick={handleClassifyConfirm}
                        disabled={classifySelected === null}
                        className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-60 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
                      >
                        Kutuya Yerleştir ✔️
                      </motion.button>
                    )}

                    {/* Anlık geri bildirim + sonraki aşama */}
                    <AnimatePresence>
                      {classifyConfirmed && lastRecord && lastRecord.subStage === 'classify' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-5"
                        >
                          <div className={`rounded-xl px-5 py-4 mb-4 flex items-start gap-3 ${
                            lastRecord.isCorrect
                              ? 'bg-emerald-900/50 border border-emerald-600/50'
                              : 'bg-red-900/50 border border-red-600/50'
                          }`}>
                            {lastRecord.isCorrect
                              ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            }
                            <div>
                              <p className={`text-sm font-bold mb-1 ${lastRecord.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                                {lastRecord.isCorrect ? `Doğru! +${POINTS_PER_STAGE} puan kazandın.` : `Yanlış kutu. +0 puan. Doğrusu: ${lastRecord.correctLabel}`}
                              </p>
                              <p className="text-slate-300 text-sm leading-relaxed">{lastRecord.feedback}</p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoToQuestion}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                          >
                            Sonraki Soru ➔
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${caseIndex}-question`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Vaka başlık + soru */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                      <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Vaka {caseIndex + 1}: {currentCase.title}
                      </p>
                      <p className="text-white text-sm sm:text-base font-bold leading-relaxed">{currentCase.question}</p>
                    </div>

                    {/* Seçenekler */}
                    <div className="flex flex-col gap-3">
                      {currentCase.options.map((option, idx) => {
                        const isSelected = questionSelected === option.id;
                        const isCorrectOption = option.id === currentCase.correctAnswer;
                        let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                        if (questionConfirmed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                        else if (questionConfirmed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                        else if (questionConfirmed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';
                        else if (isSelected) btnClass = 'bg-blue-900/40 border-blue-400 text-blue-100';

                        return (
                          <motion.button
                            key={option.id}
                            whileHover={!questionConfirmed ? { scale: 1.01 } : {}}
                            whileTap={!questionConfirmed ? { scale: 0.99 } : {}}
                            onClick={() => handleQuestionSelect(option.id)}
                            disabled={questionConfirmed}
                            className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                          >
                            <span>
                              <span className="font-black mr-2">{idx === 0 ? 'A)' : idx === 1 ? 'B)' : 'C)'}</span>
                              {option.label}
                            </span>
                            {questionConfirmed && isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                            {questionConfirmed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Onayla butonu */}
                    {!questionConfirmed && (
                      <motion.button
                        whileHover={questionSelected !== null ? { scale: 1.02 } : {}}
                        whileTap={questionSelected !== null ? { scale: 0.98 } : {}}
                        onClick={handleQuestionConfirm}
                        disabled={questionSelected === null}
                        className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-60 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800 disabled:border-slate-800 transition-all"
                      >
                        Cevabını Onayla ✔️
                      </motion.button>
                    )}

                    {/* Anlık geri bildirim + sonraki vaka */}
                    <AnimatePresence>
                      {questionConfirmed && lastRecord && lastRecord.subStage === 'question' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-5"
                        >
                          <div className={`rounded-xl px-5 py-4 mb-4 flex items-start gap-3 ${
                            lastRecord.isCorrect
                              ? 'bg-emerald-900/50 border border-emerald-600/50'
                              : 'bg-red-900/50 border border-red-600/50'
                          }`}>
                            {lastRecord.isCorrect
                              ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            }
                            <div>
                              <p className={`text-sm font-bold mb-1 ${lastRecord.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                                {lastRecord.isCorrect ? `Doğru! +${POINTS_PER_STAGE} puan kazandın.` : `Yanlış cevap. +0 puan. Doğrusu: ${lastRecord.correctLabel}`}
                              </p>
                              <p className="text-slate-300 text-sm leading-relaxed">{lastRecord.feedback}</p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNextCase}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                          >
                            {caseIndex < orderedCases.length - 1 ? 'Sonraki Vaka ➔' : 'Sonuçları Gör 🏆'}
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
