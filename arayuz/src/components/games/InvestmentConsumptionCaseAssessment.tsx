import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, BookOpen, CheckCircle, XCircle, X } from 'lucide-react';
import {
  ASSESSMENT_CASES,
  CLASSIFICATION_OPTIONS,
  GLOSSARY_TERMS,
  STRATEGY_TIPS,
  POINTS_PER_STAGE,
  TOTAL_CASES,
  TOTAL_STAGES,
  MAX_SCORE,
  getPerformance,
  shuffleCases,
  type AssessmentCase,
  type Classification,
  type McAnswer,
} from './data/investmentConsumptionCaseAssessmentData';

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

// ── Bilgi Merkezi (kavramlar + stratejiler) — ortak panel içeriği ────────────

function GlossaryPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
      style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
    >
      <div className={`${compact ? 'px-4 py-3.5' : 'px-5 py-4'} border-b border-cyan-800/40`}>
        <div className={`text-cyan-400 ${compact ? 'text-xs' : 'text-base'} font-black uppercase tracking-widest`}>
          📖 Ekonomi Sözlüğü
        </div>
      </div>
      <div className={`${compact ? 'px-4 py-3.5' : 'px-5 py-4'} flex flex-col gap-3.5 max-h-[420px] overflow-y-auto`}>
        {GLOSSARY_TERMS.map((item, i) => (
          <div key={i}>
            <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-cyan-300 mb-1`}>{item.term}</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} text-slate-400 leading-relaxed`}>{item.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
      style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
    >
      <div className={`${compact ? 'px-4 py-3.5' : 'px-5 py-4'} border-b border-amber-800/40`}>
        <div className={`text-amber-400 ${compact ? 'text-xs' : 'text-base'} font-black uppercase tracking-widest`}>
          🎯 Strateji Merkezi
        </div>
      </div>
      <div className={`${compact ? 'px-4 py-3.5' : 'px-5 py-4'} flex flex-col gap-3.5 max-h-[420px] overflow-y-auto`}>
        {STRATEGY_TIPS.map((tip, i) => (
          <div key={i}>
            <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-amber-300 mb-1`}>{tip.title}</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} text-slate-400 leading-relaxed`}>{tip.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
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
  const [infoCenterOpen, setInfoCenterOpen] = useState(false);

  const currentCase = orderedCases[caseIndex];
  const lastRecord = history[history.length - 1];

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
      if (onComplete) onComplete(score);
      setStage('finished');
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
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Yatırım mı, Tüketim mi? Vaka Değerlendirmesi ⚖️</h1>
          <p className="text-slate-400 text-sm">
            Oyuna geçmeden önce Bilgi Merkezi'ni incele · 10 vaka × 2 aşama · Maks. {MAX_SCORE} puan · ~20 dk
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <GlossaryPanel />
          <StrategyPanel />
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6 max-w-3xl mx-auto">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
            📋 Kurallar
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {[
              `Oyunda ${TOTAL_CASES} vaka bulunur. Her vakanın 2 aşaması vardır: önce senaryoyu "Yatırım Kutusu" ya da "Tüketim Kutusu" olarak sınıflandırırsın, sonra Ekonomi Sözlüğü / Strateji Merkezi'ne dayanan bir soruyu cevaplarsın.`,
              `Bir seçim yapmadan sonraki aşamaya geçemezsin. Cevabını onayladıktan sonra seçimini değiştiremezsin.`,
              `Her doğru cevap ${POINTS_PER_STAGE} puan değerindedir, toplam ${TOTAL_STAGES} aşama × ${POINTS_PER_STAGE} puan = ${MAX_SCORE} puandır. Yanlış cevaplar puan kaybettirmez.`,
              `Sonuç ekranında ham puanın yanında (doğru sayısı / ${TOTAL_STAGES}) × 100 formülüyle hesaplanan başarı yüzdesi de gösterilir.`,
              `Bilgi Merkezi'ni oyun boyunca istediğin an açabilirsin, bu puan kaybettirmez.`,
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
              <p className="text-slate-400 text-sm mb-6">{perf.sub}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl mb-3">
                {score} / {MAX_SCORE} Puan
              </div>
              <p className="text-slate-300 text-lg font-bold">Başarı Yüzdesi: %{successRate}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
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
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">

        {/* ── Left Panel: Ekonomi Sözlüğü (sticky, desktop) ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <GlossaryPanel compact />
        </div>

        {/* ── Center: Game card ── */}
        <div className="flex-1 min-w-0">
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
                <button
                  onClick={() => setInfoCenterOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 transition-colors lg:hidden"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Bilgi Merkezi
                </button>
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
        </div>{/* end center */}

        {/* ── Right Panel: Strateji Merkezi (sticky, desktop) ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <StrategyPanel compact />
        </div>

      </div>{/* end 3-col flex */}

      {/* ── Bilgi Merkezi modal (mobil ve her an erişim için) ── */}
      <AnimatePresence>
        {infoCenterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto"
            onClick={() => setInfoCenterOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setInfoCenterOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <GlossaryPanel />
                <StrategyPanel />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
