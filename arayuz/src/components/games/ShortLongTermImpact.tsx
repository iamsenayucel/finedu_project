import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Hourglass, BookOpen, CheckCircle2, XCircle, X } from 'lucide-react';
import {
  PART1_CASES,
  PART2_CASES,
  IMPACT_OPTIONS,
  GLOSSARY_TERMS,
  STRATEGY_TIPS,
  POINTS_PER_CASE,
  PART1_TOTAL,
  PART2_TOTAL,
  TOTAL_CASES,
  MAX_SCORE,
  getPerformance,
  type McAnswer,
  type ImpactAnswer,
} from './data/shortLongTermImpactData';

interface ShortLongTermImpactProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Stage = 'intro' | 'part1' | 'part2intro' | 'part2' | 'finished';

interface Part1Record {
  caseId: number;
  title: string;
  selected: McAnswer;
  correct: boolean;
  feedback: string;
}

interface Part2Record {
  caseId: number;
  title: string;
  selected: ImpactAnswer;
  correct: boolean;
  feedback: string;
}

const DRAG_TYPE = 'IMPACT_CARD';

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

// ── Bölüm 2: sürüklenebilir vaka kartı ────────────────────────────────────────

function DraggableCase({ title, scenario, shake }: { title: string; scenario: string; shake: boolean }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPE,
    item: {},
    collect: (m) => ({ isDragging: m.isDragging() }),
  }));

  return (
    <motion.div animate={shake ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : {}} transition={{ duration: 0.5 }}>
      <div
        ref={drag as any}
        style={{ opacity: isDragging ? 0.3 : 1 }}
        className="select-none cursor-grab active:cursor-grabbing bg-slate-800 rounded-2xl border-2 border-purple-400/60 shadow-2xl px-5 py-4 w-72"
      >
        <p className="text-purple-300 text-xs font-black uppercase tracking-wider mb-1.5">{title}</p>
        <p className="text-slate-200 text-sm leading-relaxed">{scenario}</p>
      </div>
    </motion.div>
  );
}

function ImpactDropZone({
  option,
  onDrop,
  isOverState,
}: {
  option: (typeof IMPACT_OPTIONS)[number];
  onDrop: (answer: ImpactAnswer) => void;
  isOverState: 'idle' | 'correct' | 'wrong';
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DRAG_TYPE,
    drop: () => onDrop(option.id),
    collect: (m) => ({ isOver: m.isOver() }),
  }));

  const isShort = option.id === 'SHORT';
  const base = isShort
    ? 'bg-sky-950/40 border-sky-700/60'
    : 'bg-amber-950/40 border-amber-700/60';
  const hover = isShort ? 'bg-sky-900/50 border-sky-400' : 'bg-amber-900/50 border-amber-400';
  const okRing = isOverState === 'correct' ? 'ring-4 ring-emerald-400' : isOverState === 'wrong' ? 'ring-4 ring-red-400' : '';

  return (
    <div
      ref={drop as any}
      className={`relative flex-1 rounded-3xl border-4 min-h-[220px] flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
        isOver ? hover : base
      } ${okRing}`}
    >
      <div className="text-4xl mb-1">{isShort ? '⏱️' : '🌳'}</div>
      <h3 className={`text-lg font-black ${isShort ? 'text-sky-300' : 'text-amber-300'}`}>{option.label}</h3>
      <p className={`text-xs font-medium text-center px-4 ${isShort ? 'text-sky-400/80' : 'text-amber-400/80'}`}>{option.desc}</p>

      <AnimatePresence>
        {isOverState === 'correct' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl drop-shadow-lg">✅</span>
          </motion.div>
        )}
        {isOverState === 'wrong' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl drop-shadow-lg">❌</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function ShortLongTermImpactGame({ onComplete, onBack }: ShortLongTermImpactProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [infoCenterOpen, setInfoCenterOpen] = useState(false);

  // Part 1 state
  const [p1Index, setP1Index] = useState(0);
  const [p1Selected, setP1Selected] = useState<McAnswer | null>(null);
  const [p1Confirmed, setP1Confirmed] = useState(false);
  const [p1History, setP1History] = useState<Part1Record[]>([]);

  // Part 2 state
  const [p2Index, setP2Index] = useState(0);
  const [p2Feedback, setP2Feedback] = useState<{ zone: ImpactAnswer; correct: boolean } | null>(null);
  const [p2Processing, setP2Processing] = useState(false);
  const [p2Shake, setP2Shake] = useState(false);
  const [p2History, setP2History] = useState<Part2Record[]>([]);

  const p1Case = PART1_CASES[p1Index];
  const p2Case = PART2_CASES[p2Index];

  const p1Score = p1History.filter((r) => r.correct).length * POINTS_PER_CASE;
  const p2Score = p2History.filter((r) => r.correct).length * POINTS_PER_CASE;
  const totalScore = p1Score + p2Score;
  const totalCorrect = p1History.filter((r) => r.correct).length + p2History.filter((r) => r.correct).length;

  const handleStart = () => {
    setP1Index(0);
    setP1Selected(null);
    setP1Confirmed(false);
    setP1History([]);
    setP2Index(0);
    setP2Feedback(null);
    setP2Processing(false);
    setP2Shake(false);
    setP2History([]);
    setStage('part1');
  };

  // ── Part 1 handlers ──
  const handleP1Select = (answer: McAnswer) => {
    if (p1Confirmed) return;
    setP1Selected(answer);
  };

  const handleP1Confirm = () => {
    if (p1Selected === null || p1Confirmed) return;
    const option = p1Case.options.find((o) => o.id === p1Selected)!;
    const correct = p1Selected === p1Case.correctAnswer;
    setP1History((prev) => [
      ...prev,
      { caseId: p1Case.id, title: p1Case.title, selected: p1Selected, correct, feedback: option.feedback },
    ]);
    setP1Confirmed(true);
  };

  const handleP1Next = () => {
    setP1Selected(null);
    setP1Confirmed(false);
    if (p1Index < PART1_CASES.length - 1) {
      setP1Index((i) => i + 1);
    } else {
      setStage('part2intro');
    }
  };

  // ── Part 2 handlers ──
  const handleP2Drop = (answer: ImpactAnswer) => {
    if (p2Processing) return;
    setP2Processing(true);
    const correct = answer === p2Case.correctAnswer;
    setP2Feedback({ zone: answer, correct });
    setP2History((prev) => [
      ...prev,
      {
        caseId: p2Case.id,
        title: p2Case.title,
        selected: answer,
        correct,
        feedback: correct ? p2Case.correctFeedback : p2Case.wrongFeedback,
      },
    ]);
    if (!correct) setP2Shake(true);

    setTimeout(() => {
      setP2Feedback(null);
      setP2Shake(false);
      setP2Processing(false);
      if (p2Index < PART2_CASES.length - 1) {
        setP2Index((i) => i + 1);
      } else {
        const finalScore = totalScore + (correct ? POINTS_PER_CASE : 0);
        if (onComplete) onComplete(finalScore);
        setStage('finished');
      }
    }, correct ? 2200 : 2800);
  };

  const handleRestart = () => {
    setStage('intro');
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 p-6 sm:p-8">
          <div className="h-1.5 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 bg-gradient-to-r from-sky-500 via-purple-500 to-amber-500" />
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-sky-600 to-amber-600 p-3 rounded-2xl mb-4 shadow-lg">
              <Hourglass className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Kısa ve Uzun Vadeli Finansal Etki ⏳</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
              Bugün verdiğin kararların yarınki "sen"e etkisini keşfet. Oyuna geçmeden önce sözlüğü ve stratejiyi
              incele · {PART1_TOTAL} karar vakası + {PART2_TOTAL} eşleştirme vakası · Maks. {MAX_SCORE} puan
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
                `Bölüm 1'de ${PART1_TOTAL} karar vakası bulunur. Her vakada bir senaryo okur, üç şıktan (A/B/C) birini seçer ve cevabını onaylarsın. Onayladıktan sonra seçimini değiştiremezsin.`,
                `Bölüm 2'de ${PART2_TOTAL} vaka bulunur. Bu kez bir kararı sürükleyip "Kısa Vadeli Etki" veya "Uzun Vadeli Etki" kutusuna bırakırsın.`,
                `Her doğru cevap ${POINTS_PER_CASE} puan değerindedir, toplam ${MAX_SCORE} puandır. Yanlış cevaplar puan kaybettirmez.`,
                'Her vakadan hemen sonra doğru/yanlış geri bildirimini ve açıklamasını görürsün.',
                "Bilgi Merkezi'ni oyun boyunca istediğin an açabilirsin, bu puanını etkilemez.",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sky-400 mt-0.5">•</span>
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
              className="bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-amber-800"
            >
              Oyuna Başla ⏳
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── PART 2 INTRO (geçiş ekranı) ────────────────────────────────────────────
  if (stage === 'part2intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 p-8 text-center">
          <div className="h-1.5 -mx-8 -mt-8 mb-6 bg-gradient-to-r from-sky-500 via-purple-500 to-amber-500" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="text-6xl mb-4">
            🎯
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Bölüm 1 Tamamlandı!</h2>
          <p className="text-slate-300 mb-1">
            {p1History.filter((r) => r.correct).length} / {PART1_TOTAL} doğru · {p1Score} puan kazandın
          </p>
          <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
            Şimdi Bölüm 2'ye geçiyorsun: {PART2_TOTAL} kararı sürükleyerek "Kısa Vadeli Etki" veya "Uzun Vadeli Etki"
            kutusuna bırakacaksın.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setStage('part2')}
            className="bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white font-black text-lg py-3.5 px-10 rounded-full shadow-xl border-b-4 border-amber-800"
          >
            Bölüm 2'ye Geç →
          </motion.button>
        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const perf = getPerformance(totalCorrect);
    const allHistory = [
      ...p1History.map((r) => ({ ...r, part: 1 as const })),
      ...p2History.map((r) => ({ ...r, part: 2 as const })),
    ];
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-gradient-to-br ${perf.bg} rounded-3xl overflow-hidden shadow-2xl border border-slate-700`}>
          <div className="h-1.5 bg-gradient-to-r from-sky-500 via-purple-500 to-amber-500" />
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
              <h2 className="text-3xl font-black text-white mb-1">Oyun Tamamlandı!</h2>
              <p className={`text-xl font-bold mb-1 ${perf.color}`}>{perf.label}</p>
              <p className="text-slate-400 text-sm mb-6">{perf.sub}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl mb-3">
                {totalScore} / {MAX_SCORE} Puan
              </div>
              <p className="text-slate-300 text-lg font-bold">
                Doğru: {totalCorrect} / {TOTAL_CASES}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-sky-400">{p1Score} puan</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Bölüm 1 — Karar Vakaları</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                <p className="text-xl sm:text-2xl font-black text-amber-400">{p2Score} puan</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">Bölüm 2 — Etki Eşleştirme</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Vaka Vaka Sonuçların</h3>
              {allHistory.map((record, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    record.correct ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {record.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs mb-1">
                        Bölüm {record.part} · {record.title}
                      </p>
                      <p className="text-slate-400 text-xs leading-relaxed">{record.feedback}</p>
                    </div>
                    <span className={`text-sm font-black flex-shrink-0 ${record.correct ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {record.correct ? `+${POINTS_PER_CASE}` : '+0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white font-black py-3.5 rounded-2xl text-sm sm:text-base shadow-lg border-b-4 border-amber-800 transition-all"
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

  // ── PART 1: Karar ve Gelecek Sonucu (çoktan seçmeli) ────────────────────────
  if (stage === 'part1') {
    const lastRecord = p1History[p1History.length - 1];
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
            <GlossaryPanel compact />
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 via-purple-500 to-amber-500" />

              <div className="bg-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-700">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Bölüm 1 · Vaka</span>
                  <div className="flex gap-1.5">
                    {PART1_CASES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-8 rounded-full transition-all duration-300 ${
                          i < p1Index ? 'bg-emerald-500' : i === p1Index ? 'bg-sky-400' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-300 font-bold text-sm">{p1Index + 1} / {PART1_CASES.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInfoCenterOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 transition-colors lg:hidden"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Bilgi Merkezi
                  </button>
                  <div className="bg-sky-900/60 text-sky-300 px-4 py-1.5 rounded-full text-sm font-black border border-sky-700/60">
                    ⏳ {p1Score} puan
                  </div>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={p1Index}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-5">
                      <p className="text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Vaka {p1Index + 1}: {p1Case.title}
                      </p>
                      <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-3">{p1Case.scenario}</p>
                      <p className="text-white text-sm sm:text-base font-bold">{p1Case.question}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {p1Case.options.map((option) => {
                        const isSelected = p1Selected === option.id;
                        const isCorrectOption = option.id === p1Case.correctAnswer;
                        let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                        if (p1Confirmed && isCorrectOption) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                        else if (p1Confirmed && isSelected && !isCorrectOption) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                        else if (p1Confirmed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';
                        else if (isSelected) btnClass = 'bg-sky-900/40 border-sky-400 text-sky-100';

                        return (
                          <motion.button
                            key={option.id}
                            whileHover={!p1Confirmed ? { scale: 1.005 } : {}}
                            whileTap={!p1Confirmed ? { scale: 0.995 } : {}}
                            onClick={() => handleP1Select(option.id)}
                            disabled={p1Confirmed}
                            className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-start justify-between gap-3 ${btnClass}`}
                          >
                            <span>
                              <span className="font-black mr-2">{option.id})</span>
                              <span className="text-sm sm:text-base">{option.label}</span>
                            </span>
                            {p1Confirmed && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                            {p1Confirmed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {!p1Confirmed && (
                      <motion.button
                        whileHover={p1Selected !== null ? { scale: 1.02 } : {}}
                        whileTap={p1Selected !== null ? { scale: 0.98 } : {}}
                        onClick={handleP1Confirm}
                        disabled={p1Selected === null}
                        className="w-full mt-5 bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-60 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-amber-800 disabled:border-slate-800 transition-all"
                      >
                        Cevabını Onayla ✔️
                      </motion.button>
                    )}

                    <AnimatePresence>
                      {p1Confirmed && lastRecord && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                          <div
                            className={`rounded-xl px-5 py-4 mb-4 flex items-start gap-3 ${
                              lastRecord.correct ? 'bg-emerald-900/50 border border-emerald-600/50' : 'bg-red-900/50 border border-red-600/50'
                            }`}
                          >
                            {lastRecord.correct ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className={`text-sm font-bold mb-1 ${lastRecord.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                                {lastRecord.correct ? `Doğru! +${POINTS_PER_CASE} puan kazandın.` : 'Yanlış cevap. +0 puan.'}
                              </p>
                              <p className="text-slate-300 text-sm leading-relaxed">{lastRecord.feedback}</p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleP1Next}
                            className="w-full bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-amber-800"
                          >
                            {p1Index < PART1_CASES.length - 1 ? 'Sonraki Vaka ➔' : 'Bölüm 2\'ye Geç 🎯'}
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
            <StrategyPanel compact />
          </div>
        </div>

        <InfoCenterModal open={infoCenterOpen} onClose={() => setInfoCenterOpen(false)} />
      </div>
    );
  }

  // ── PART 2: Kısa/Uzun Vadeli Etki (sürükle-bırak) ───────────────────────────
  const remaining = PART2_CASES.length - p2Index;
  const progress = (p2Index / PART2_CASES.length) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <GlossaryPanel compact />
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="h-1.5 bg-slate-800">
              <motion.div className="h-full bg-gradient-to-r from-sky-500 to-amber-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>

            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Bölüm 2 · Vaka</span>
                <span className="text-slate-300 font-bold text-sm">{p2Index + 1} / {PART2_CASES.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInfoCenterOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 transition-colors lg:hidden"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Bilgi Merkezi
                </button>
                <div className="bg-amber-900/60 text-amber-300 px-4 py-1.5 rounded-full text-sm font-black border border-amber-700/60">
                  ⏳ {p1Score + p2Score} puan
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-center text-slate-400 text-sm mb-5 font-medium">
                Kararı sürükleyerek doğru vadeye bırak
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <ImpactDropZone
                  option={IMPACT_OPTIONS[0]}
                  onDrop={handleP2Drop}
                  isOverState={p2Feedback?.zone === 'SHORT' ? (p2Feedback.correct ? 'correct' : 'wrong') : 'idle'}
                />

                <div className="flex flex-col items-center justify-center gap-3 flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {p2Case && (
                      <motion.div
                        key={p2Case.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.25 }}
                      >
                        <DraggableCase title={p2Case.title} scenario={p2Case.scenario} shake={p2Shake} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="text-slate-500 text-xs font-medium">{remaining} vaka kaldı</div>
                </div>

                <ImpactDropZone
                  option={IMPACT_OPTIONS[1]}
                  onDrop={handleP2Drop}
                  isOverState={p2Feedback?.zone === 'LONG' ? (p2Feedback.correct ? 'correct' : 'wrong') : 'idle'}
                />
              </div>

              <AnimatePresence>
                {p2Feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-5 rounded-2xl px-5 py-4 flex items-start gap-3 border ${
                      p2Feedback.correct ? 'bg-emerald-900/40 border-emerald-700/50' : 'bg-red-900/40 border-red-700/50'
                    }`}
                  >
                    {p2Feedback.correct ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-black mb-1 ${p2Feedback.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                        {p2Feedback.correct ? `Doğru! +${POINTS_PER_CASE} puan kazandın 🎉` : 'Yanlış kutu!'}
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {p2History[p2History.length - 1]?.feedback}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <StrategyPanel compact />
        </div>
      </div>

      <InfoCenterModal open={infoCenterOpen} onClose={() => setInfoCenterOpen(false)} />
    </div>
  );
}

function InfoCenterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full border border-slate-700">
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
  );
}

// ── Export with DndProvider ──────────────────────────────────────────────────
export default function ShortLongTermImpact({ onComplete, onBack }: ShortLongTermImpactProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ShortLongTermImpactGame onComplete={onComplete} onBack={onBack} />
    </DndProvider>
  );
}
