import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, TrendingUp, ShoppingBag, BookOpen, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import {
  QUESTIONS,
  CLASSIFICATION_OPTIONS,
  GLOSSARY_TERMS,
  STRATEGY_TIPS,
  POINTS_PER_QUESTION,
  TOTAL_QUESTIONS,
  MAX_SCORE,
  getPerformance,
  type Classification,
} from './data/investmentOrConsumptionData';

interface InvestmentOrConsumptionProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'quiz' | 'finished';

interface QuestionResult {
  questionId: number;
  selected: Classification | null;
  correct: boolean;
  points: number;
}

interface Results {
  items: QuestionResult[];
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  totalScore: number;
  successRate: number;
}

const OPTION_ICONS: Record<Classification, React.ComponentType<{ className?: string }>> = {
  CONSUMPTION: ShoppingBag,
  INVESTMENT: TrendingUp,
};

// ── Bilgi Merkezi (sözlük + strateji) — ortak panel içeriği ───────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function InvestmentOrConsumption({ onComplete, onBack }: InvestmentOrConsumptionProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Classification | null>>(() =>
    Object.fromEntries(QUESTIONS.map(q => [q.id, null]))
  );
  const [infoCenterOpen, setInfoCenterOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];
  const answeredFlags = useMemo(() => QUESTIONS.map(q => answers[q.id] !== null), [answers]);
  const totalAnswered = answeredFlags.filter(Boolean).length;
  const allAnswered = totalAnswered === TOTAL_QUESTIONS;

  const selectAnswer = (classification: Classification) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: classification }));
  };

  const handleStart = () => {
    setAnswers(Object.fromEntries(QUESTIONS.map(q => [q.id, null])));
    setQuestionIndex(0);
    setResults(null);
    setConfirmSubmitOpen(false);
    setStage('quiz');
  };

  const handleRestart = () => {
    setAnswers(Object.fromEntries(QUESTIONS.map(q => [q.id, null])));
    setQuestionIndex(0);
    setResults(null);
    setConfirmSubmitOpen(false);
    setStage('intro');
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    const items: QuestionResult[] = QUESTIONS.map(q => {
      const selected = answers[q.id];
      const correct = selected !== null && selected === q.correctAnswer;
      return { questionId: q.id, selected, correct, points: correct ? POINTS_PER_QUESTION : 0 };
    });
    const correctCount = items.filter(r => r.correct).length;
    const blankCount = items.filter(r => r.selected === null).length;
    const wrongCount = items.length - correctCount - blankCount;
    const totalScore = correctCount * POINTS_PER_QUESTION;
    const successRate = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

    const finalResults: Results = { items, correctCount, wrongCount, blankCount, totalScore, successRate };
    setResults(finalResults);
    if (onComplete) onComplete(totalScore);
    setConfirmSubmitOpen(false);
    setStage('finished');
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 p-6 sm:p-8">
          <div className="h-1.5 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4 shadow-lg">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Yatırım mı, Tüketim mi? ⚖️</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
              Günlük hayattaki para kullanım örneklerini doğru sınıflandırabilir misin? Oyuna geçmeden önce
              sözlüğü ve stratejiyi incele · 10 soru · Maks. {MAX_SCORE} puan
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
                'Oyunda 10 soru bulunur. Her soruda günlük yaşamdan bir para kullanım senaryosu yer alır ve yalnızca "Tüketim" ya da "Yatırım" seçeneklerinden biri işaretlenebilir.',
                'Sorular arasında istediğin sırayla gezinebilir ve cevabını sınavı tamamlamadan önce istediğin kadar değiştirebilirsin.',
                'Tüm sorular cevaplanmadan değerlendirmeyi tamamlayamazsın.',
                `Her doğru cevap ${POINTS_PER_QUESTION} puan değerindedir, toplam ${MAX_SCORE} puandır. Yanlış ve boş cevaplar puan kaybettirmez.`,
                'Cevaplarının doğru mu yanlış mı olduğunu, değerlendirmeyi tamamlayana kadar göremezsin. Tüm sonuçlar değerlendirme bittikten sonra birlikte açıklanır.',
                'Değerlendirme gönderildikten sonra cevapların kilitlenir ve değiştirilemez.',
                'Bilgi Merkezi\'ni oyun boyunca istediğin an açabilirsin, bu puanını etkilemez.',
                'İstersen oyunu yeniden başlatabilirsin; bu durumda tüm cevaplar, puan ve sonuçlar sıfırlanır.',
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-purple-800"
            >
              Oyuna Başla ⚖️
            </motion.button>
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
              <p className={`text-base sm:text-lg font-bold mb-4 max-w-xl mx-auto ${performance.color}`}>{performance.label}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl mb-3">
                {results.totalScore} / {MAX_SCORE} Puan
              </div>
              <p className="text-slate-300 text-lg font-bold">Başarı Yüzdesi: %{results.successRate}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-emerald-400">{results.correctCount}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Doğru Cevap</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-red-400">{results.wrongCount}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Yanlış Cevap</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-slate-400">{results.blankCount}</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Boş Cevap</p>
              </div>
            </div>

            <div className="space-y-3 mb-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Soru Soru Sonuçların</h3>
              {QUESTIONS.map((q, idx) => {
                const r = results.items.find(x => x.questionId === q.id)!;
                const selectedLabel = r.selected ? CLASSIFICATION_OPTIONS.find(o => o.id === r.selected)?.label : null;
                const correctLabel = CLASSIFICATION_OPTIONS.find(o => o.id === q.correctAnswer)?.label;
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
                        <p className="text-white text-sm font-medium mb-1">{q.scenario}</p>
                        {r.selected === null ? (
                          <p className="text-slate-500 text-xs mb-1">Bu soru cevaplanmadı.</p>
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

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">

        {/* ── Left Panel: Ekonomi Sözlüğü (sticky, desktop) ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <GlossaryPanel compact />
        </div>

        {/* ── Center: Game card ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 mb-5">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg flex-shrink-0">
                    <Scale className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-black text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                    Yatırım mı, Tüketim mi?
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-300 font-bold text-xs sm:text-sm bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600">
                    Cevaplanan {totalAnswered} / {TOTAL_QUESTIONS}
                  </span>
                  <button
                    onClick={() => setInfoCenterOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 transition-colors lg:hidden"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Bilgi Merkezi
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={!allAnswered}
                    title={!allAnswered ? `Tüm soruları cevaplamadan tamamlayamazsın (kalan ${TOTAL_QUESTIONS - totalAnswered})` : undefined}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-lg transition-all"
                  >
                    Değerlendirmeyi Tamamla 🏁
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(totalAnswered / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>

              <div className="mt-3">
                <NavPills count={QUESTIONS.length} currentIndex={questionIndex} answeredIndexes={answeredFlags} onJump={setQuestionIndex} />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={questionIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="bg-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full">
                      Soru {questionIndex + 1} / {QUESTIONS.length}
                    </span>
                    <span className="ml-auto bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-black border border-blue-700/60">
                      {POINTS_PER_QUESTION} puan
                    </span>
                  </div>

                  <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{currentQuestion.scenario}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {CLASSIFICATION_OPTIONS.map(option => {
                      const Icon = OPTION_ICONS[option.id];
                      const isSelected = answers[currentQuestion.id] === option.id;
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => selectAnswer(option.id)}
                          className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center gap-3 ${
                            isSelected ? 'bg-blue-900/40 border-blue-400 text-blue-100' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="flex-1 text-sm sm:text-base font-bold">{option.label}</span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-6">
                    <button
                      type="button"
                      disabled={questionIndex === 0}
                      onClick={() => setQuestionIndex(i => Math.max(0, i - 1))}
                      className="px-5 py-3 rounded-xl text-sm font-bold border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Önceki Soru
                    </button>
                    {questionIndex < QUESTIONS.length - 1 ? (
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
                        whileHover={allAnswered ? { scale: 1.02 } : {}}
                        whileTap={allAnswered ? { scale: 0.98 } : {}}
                        onClick={() => setConfirmSubmitOpen(true)}
                        disabled={!allAnswered}
                        className="px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg border-b-4 border-blue-800 disabled:border-slate-800 transition-all"
                      >
                        Değerlendirmeyi Tamamla 🏁
                      </motion.button>
                    )}
                  </div>
                </motion.div>
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

      {/* ── Tamamlama onayı ── */}
      <AnimatePresence>
        {confirmSubmitOpen && (
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
              <h3 className="text-white font-black text-lg mb-2">Değerlendirmeyi tamamlamak istiyor musun?</h3>
              <p className="text-slate-400 text-sm mb-5">
                Tamamladıktan sonra cevaplarını değiştiremezsin ve sonuçların hemen ardından gösterilir.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl text-sm border border-slate-700 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3 rounded-xl text-sm shadow-lg border-b-4 border-purple-800 transition-all"
                >
                  Evet, Tamamla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
