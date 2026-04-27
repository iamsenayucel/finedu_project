import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialDetectiveGameProps {
  onComplete?: (score: number) => void;
}

interface AnswerHistory {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface NewsHistory {
  newsTitle: string;
  answers: AnswerHistory[];
  classification: {
    userClass: string;
    correctClass: string;
    isCorrect: boolean;
  };
}

const NEWS_DATA = [
  {
    id: 1,
    title: "Merkez Bankası Faiz Kararı",
    image: "/games/FinancialDetectiveGame/1.png",
    questions: [
      { id: 'q1', text: "Haberde somut veri veya istatistik var mı?", expected: "Evet" },
      { id: 'q2', text: "Haberde uzman veya kurum kaynağı belirtilmiş mi?", expected: "Evet" },
      { id: 'q3', text: "Haber başlığı abartılı mı?", expected: "Hayır" },
      { id: 'q4', text: "Haberde yatırım tavsiyesi var mı?", expected: "Hayır" }
    ],
    correctClass: "GÜVENİLİR",
    feedback: "Haberde resmi kurum açıklaması ve sayısal veri bulunmaktadır. Abartılı ifade veya yatırım vaadi olmadığı için güvenilir bir haber niteliğindedir."
  },
  {
    id: 2,
    title: "Altın Piyasası Yorumu",
    image: "/games/FinancialDetectiveGame/2.png",
    questions: [
      { id: 'q1', text: "Haberde somut veri veya istatistik var mı?", expected: "Evet" },
      { id: 'q2', text: "Haberde uzman veya kurum kaynağı belirtilmiş mi?", expected: "Evet" },
      { id: 'q3', text: "Haber başlığı abartılı mı?", expected: "Hayır" },
      { id: 'q4', text: "Haberde yatırım tavsiyesi var mı?", expected: "Hayır" }
    ],
    correctClass: "GÜVENİLİR",
    feedback: "Haberde veri ve uzman görüşü bulunmaktadır. Kesin kazanç vaadi olmadığı için haber güvenilir kabul edilebilir."
  },
  {
    id: 3,
    title: "Kripto Para Hızla Yükseliyor",
    image: "/games/FinancialDetectiveGame/3.png",
    questions: [
      { id: 'q1', text: "Haberde somut veri veya istatistik var mı?", expected: "Hayır" },
      { id: 'q2', text: "Haberde uzman veya kurum kaynağı belirtilmiş mi?", expected: "Hayır" },
      { id: 'q3', text: "Haber başlığı abartılı mı?", expected: "Evet" },
      { id: 'q4', text: "Haberde yatırım tavsiyesi var mı?", expected: "Hayır" }
    ],
    correctClass: "ŞÜPHELİ",
    feedback: "Haberde somut veri veya güvenilir kurum kaynağı bulunmuyor. Bu nedenle haberin doğruluğu kesin değildir ve dikkatle değerlendirilmelidir."
  },
  {
    id: 4,
    title: "Dijital Altın: Gercekten Altin Mi, Yoksa Dijital Hava Mi?",
    image: "/games/FinancialDetectiveGame/4.png",
    questions: [
      { id: 'q1', text: "Haberde somut veri veya istatistik var mi?", expected: "Hayir" },
      { id: 'q2', text: "Haberde uzman veya kurum kaynagi acikca belirtilmis mi?", expected: "Hayir" },
      { id: 'q3', text: "Haber basligi abartili veya dikkat cekici sekilde kurgulanmis mi?", expected: "Evet" },
      { id: 'q4', text: "Haberde yatirim tavsiyesi niteliginde ifadeler var mi?", expected: "Evet" }
    ],
    correctClass: "SUPHELI",
    feedback: "Haberde belirsiz kaynaklar kullanilmis, dogrulanabilir veri sunulmamis ve yatirim yonlendirmesi iceren ifadeler yer almistir. Bu nedenle icerik supheli olarak degerlendirilmelidir."
  },
  {
    id: 5,
    title: "Yeni Yatırım Platformu Reklamı",
    image: "/games/FinancialDetectiveGame/5.png",
    questions: [
      { id: 'q1', text: "Haberde somut veri veya istatistik var mı?", expected: "Hayır" },
      { id: 'q2', text: "Haberde uzman veya kurum kaynağı belirtilmiş mi?", expected: "Hayır" },
      { id: 'q3', text: "Haber başlığı abartılı mı?", expected: "Evet" },
      { id: 'q4', text: "Haberde yatırım tavsiyesi var mı?", expected: "Evet" }
    ],
    correctClass: "MANİPÜLATİF",
    feedback: "Haberde kesin kazanç vaadi ve yatırım çağrısı bulunmaktadır. Güvenilir kaynak veya veri bulunmadığı için manipülatif bir içerik olabilir."
  }
];

const CLASS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string; glow: string }> = {
  'GÜVENİLİR': {
    label: 'Güvenilir Kaynak',
    icon: '✅',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500',
    glow: 'shadow-emerald-500/20',
  },
  'ŞÜPHELİ': {
    label: 'Şüpheli Kaynak',
    icon: '⚠️',
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-500',
    glow: 'shadow-amber-500/20',
  },
  'SUPHELI': {
    label: 'Şüpheli Kaynak',
    icon: '⚠️',
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-500',
    glow: 'shadow-amber-500/20',
  },
  'MANİPÜLATİF': {
    label: 'Manipülatif / Reklam',
    icon: '🚨',
    color: 'text-red-400',
    bg: 'bg-red-950/60',
    border: 'border-red-500',
    glow: 'shadow-red-500/20',
  },
};

function getScoreRank(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.85) return { label: 'Baş Dedektif', icon: '🏆', color: 'text-yellow-400', desc: 'Finansal haberleri kusursuz analiz ettin!' };
  if (pct >= 0.65) return { label: 'Kıdemli Dedektif', icon: '🔍', color: 'text-blue-400', desc: 'Haberleri iyi değerlendirdin, biraz daha pratikle mükemmel olacaksın.' };
  if (pct >= 0.40) return { label: 'Acemi Dedektif', icon: '🕵️', color: 'text-slate-400', desc: 'Güzel bir başlangıç! Haberleri analiz etmeye devam et.' };
  return { label: 'Stajyer', icon: '📋', color: 'text-orange-400', desc: 'Finansal okuryazarlık için daha fazla pratik yapman gerekiyor.' };
}

export default function FinancialDetectiveGame({ onComplete }: FinancialDetectiveGameProps) {
  const [stage, setStage] = useState<'intro' | 'reading' | 'analyzing' | 'classifying' | 'feedback' | 'finished'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<AnswerHistory[]>([]);
  const [gameHistory, setGameHistory] = useState<NewsHistory[]>([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const currentNews = NEWS_DATA[currentIndex];
  const MAX_SCORE = NEWS_DATA.length * (4 * 10 + 20); // 200

  const handleStartAnalysis = () => {
    setCurrentAnswers([]);
    setStage('analyzing');
  };

  const handleAnswerQuestion = (answer: string) => {
    const currentQ = currentNews.questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.expected;
    setLastAnswerCorrect(isCorrect);
    if (isCorrect) setScore(prev => prev + 10);

    setCurrentAnswers(prev => [...prev, {
      questionText: currentQ.text,
      userAnswer: answer,
      correctAnswer: currentQ.expected,
      isCorrect,
    }]);

    setTimeout(() => {
      setLastAnswerCorrect(null);
      if (currentQuestionIndex < currentNews.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setStage('classifying');
      }
    }, 400);
  };

  const handleClassification = (selectedClass: string) => {
    const isCorrect = selectedClass === currentNews.correctClass;
    if (isCorrect) setScore(prev => prev + 20);

    setGameHistory(prev => [...prev, {
      newsTitle: currentNews.title,
      answers: currentAnswers,
      classification: { userClass: selectedClass, correctClass: currentNews.correctClass, isCorrect },
    }]);

    setStage('feedback');
  };

  const handleNextNews = () => {
    if (currentIndex < NEWS_DATA.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setStage('reading');
    } else {
      if (onComplete) onComplete(score);
      setStage('finished');
    }
  };

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)' }} />

          {/* Glow circles */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 px-8 pt-12 pb-10 flex flex-col md:flex-row items-center gap-8">
            {/* Left: text */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                🕵️ Finansal Dedektif
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                Haber<br />
                <span className="text-amber-400">Dedektifi</span>
              </h1>
              <p className="text-slate-300 text-base leading-relaxed mb-2">
                Finansal haberleri analiz et, gerçeği yalanlardan ayır.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                {NEWS_DATA.length} haber dosyası · {NEWS_DATA.length * 4} analiz sorusu · Maksimum {MAX_SCORE} puan
              </p>

              {/* How to play */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: '📰', label: 'Haberi Oku' },
                  { icon: '🔎', label: 'Soruları Yanıtla' },
                  { icon: '🏷️', label: 'Kaynağı Sınıflandır' },
                ].map((step, i) => (
                  <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <div className="text-slate-300 text-xs font-semibold">{step.label}</div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStage('reading')}
                className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-lg py-4 px-10 rounded-2xl shadow-lg shadow-amber-500/30 border-b-4 border-amber-700 transition-colors"
              >
                <span>Göreve Başla</span>
                <span className="text-xl">🚀</span>
              </motion.button>
            </div>

            {/* Right: big icon */}
            <div className="flex-shrink-0 hidden md:flex items-center justify-center w-56 h-56 rounded-3xl bg-slate-800/60 border border-slate-700">
              <span className="text-9xl select-none">🕵️‍♂️</span>
            </div>
          </div>

          {/* Classification legend */}
          <div className="relative z-10 border-t border-slate-700/60 px-8 py-5">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Haber Sınıflandırma Kriterleri</p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: '✅', label: 'Güvenilir', desc: 'Veri & kaynak mevcut, tarafsız', color: 'text-emerald-400 border-emerald-800 bg-emerald-950/40' },
                { icon: '⚠️', label: 'Şüpheli', desc: 'Kaynak belirsiz veya eksik veri', color: 'text-amber-400 border-amber-800 bg-amber-950/40' },
                { icon: '🚨', label: 'Manipülatif', desc: 'Yatırım vaadi & abartılı ifade', color: 'text-red-400 border-red-800 bg-red-950/40' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm ${item.color}`}>
                  <span>{item.icon}</span>
                  <div>
                    <span className="font-bold">{item.label}</span>
                    <span className="text-slate-500 ml-2 text-xs hidden sm:inline">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const rank = getScoreRank(score, MAX_SCORE);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Score header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 mb-6 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)' }} />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className="text-7xl mb-4"
            >{rank.icon}</motion.div>
            <h2 className="text-3xl font-black text-white mb-1">Görev Tamamlandı!</h2>
            <p className={`text-xl font-bold mb-6 ${rank.color}`}>{rank.label}</p>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">{rank.desc}</p>
            <div className="inline-flex items-center gap-3 bg-amber-500 text-slate-900 font-black text-3xl py-3 px-10 rounded-2xl shadow-lg shadow-amber-500/30">
              {score} <span className="text-lg font-bold opacity-70">/ {MAX_SCORE} puan</span>
            </div>

            {/* Score bar */}
            <div className="mt-6 max-w-xs mx-auto">
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(score / MAX_SCORE) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Case files */}
        <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
          <span className="text-amber-400">📁</span> Dosya Raporu
        </h3>
        <div className="space-y-4">
          {gameHistory.map((historyItem, idx) => {
            const cfg = CLASS_CONFIG[historyItem.classification.correctClass] ?? CLASS_CONFIG['GÜVENİLİR'];
            const correct = historyItem.answers.filter(a => a.isCorrect).length;
            const total = historyItem.answers.length;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-lg"
              >
                {/* File header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                      {idx + 1}
                    </div>
                    <h4 className="text-white font-bold text-sm">{historyItem.newsTitle}</h4>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </div>
                </div>

                {/* Questions summary */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Analiz Soruları</span>
                    <span className="text-slate-400 text-xs">{correct}/{total} doğru</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {historyItem.answers.map((ans, aIdx) => (
                      <div key={aIdx} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${ans.isCorrect ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-red-950/40 border-red-800/50 text-red-300'}`}>
                        <span className="mt-0.5 shrink-0">{ans.isCorrect ? '✅' : '❌'}</span>
                        <div className="min-w-0">
                          <p className="text-slate-300 truncate">{ans.questionText}</p>
                          {!ans.isCorrect && (
                            <p className="text-red-400 mt-0.5">Doğrusu: <strong>{ans.correctAnswer}</strong></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Classification result */}
                  <div className={`mt-3 flex items-center justify-between p-3 rounded-lg border text-sm ${historyItem.classification.isCorrect ? 'bg-emerald-950/40 border-emerald-800/50' : 'bg-red-950/40 border-red-800/50'}`}>
                    <span className="text-slate-400 font-medium">Sınıflandırma:</span>
                    <div className="flex items-center gap-2">
                      <span className={historyItem.classification.isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                        {historyItem.classification.userClass}
                      </span>
                      {!historyItem.classification.isCorrect && (
                        <span className="text-slate-500">→ <strong className="text-emerald-400">{historyItem.classification.correctClass}</strong></span>
                      )}
                      <span>{historyItem.classification.isCorrect ? '✅' : '❌'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ── GAME WRAPPER ───────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* Progress bar header */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3.5 mb-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-black text-sm">🕵️ Dosya</span>
          <div className="flex gap-1.5">
            {NEWS_DATA.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i < currentIndex ? 'bg-amber-400 w-6' : i === currentIndex ? 'bg-amber-300 w-8' : 'bg-slate-700 w-6'
                }`}
              />
            ))}
          </div>
          <span className="text-slate-400 text-xs font-medium">{currentIndex + 1} / {NEWS_DATA.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-sm font-black">
          ⭐ {score} puan
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">

        {/* News image */}
        <div className="border-b border-slate-700/60">
          <img
            src={currentNews.image}
            alt={currentNews.title}
            className="w-full object-contain"
          />
        </div>

        {/* Title bar (below image, not overlaid) */}
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
              📰 Haber Dosyası #{currentNews.id}
            </span>
          </div>
          <h2 className="text-white font-black text-xl leading-snug">{currentNews.title}</h2>
        </div>

        {/* Stage content */}
        <AnimatePresence mode="wait">

          {/* READING */}
          {stage === 'reading' && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="px-6 py-6"
            >
              <p className="text-slate-300 text-center text-base mb-6">
                Haberi dikkatlice incele, ardından analiz sorularını yanıtla.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartAnalysis}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-lg py-4 rounded-2xl shadow-lg shadow-amber-500/20 border-b-4 border-amber-700 transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-xl">🔍</span> Analizi Başlat
              </motion.button>
            </motion.div>
          )}

          {/* ANALYZING */}
          {stage === 'analyzing' && (
            <motion.div
              key={`q-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="px-6 py-6"
            >
              {/* Question progress dots */}
              <div className="flex justify-center gap-2 mb-5">
                {currentNews.questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i < currentQuestionIndex ? 'bg-amber-400 w-5' : i === currentQuestionIndex ? 'bg-amber-300 w-8' : 'bg-slate-700 w-5'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Soru {currentQuestionIndex + 1} / {currentNews.questions.length}
                </p>
                <p className="text-white font-bold text-lg leading-snug">
                  {currentNews.questions[currentQuestionIndex].text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Evet', 'Hayır'].map((answer) => (
                  <motion.button
                    key={answer}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAnswerQuestion(answer)}
                    className={`py-5 rounded-2xl font-black text-lg border-b-4 transition-all flex items-center justify-center gap-2 ${
                      answer === 'Evet'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 shadow-emerald-500/20'
                        : 'bg-red-600 hover:bg-red-500 text-white border-red-800 shadow-red-500/20'
                    } shadow-lg`}
                  >
                    {answer === 'Evet' ? '✔' : '✘'} {answer}
                  </motion.button>
                ))}
              </div>

              {/* Flash feedback */}
              <AnimatePresence>
                {lastAnswerCorrect !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`mt-4 text-center py-2 rounded-xl font-bold text-sm ${lastAnswerCorrect ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'}`}
                  >
                    {lastAnswerCorrect ? '✅ Doğru cevap! +10 puan' : '❌ Yanlış cevap'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CLASSIFYING */}
          {stage === 'classifying' && (
            <motion.div
              key="classifying"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-6"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🏷️</div>
                <h3 className="text-white font-black text-lg">Analizini tamamladın!</h3>
                <p className="text-slate-400 text-sm mt-1">Sence bu haberin kaynağı ne tür bir kaynak?</p>
              </div>

              <div className="space-y-3">
                {[
                  { cls: 'GÜVENİLİR', icon: '✅', label: 'Güvenilir Kaynak', desc: 'Veri, kaynak ve tarafsız dil mevcut', color: 'hover:border-emerald-500 hover:bg-emerald-950/40 hover:text-emerald-300' },
                  { cls: 'ŞÜPHELİ', icon: '⚠️', label: 'Şüpheli Kaynak', desc: 'Kaynak veya veri eksik ya da belirsiz', color: 'hover:border-amber-500 hover:bg-amber-950/40 hover:text-amber-300' },
                  { cls: 'MANİPÜLATİF', icon: '🚨', label: 'Manipülatif / Reklam', desc: 'Yatırım vaadi veya abartılı yönlendirme', color: 'hover:border-red-500 hover:bg-red-950/40 hover:text-red-300' },
                ].map((item) => (
                  <motion.button
                    key={item.cls}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClassification(item.cls)}
                    className={`w-full flex items-center gap-4 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-2xl px-5 py-4 transition-all text-left ${item.color}`}
                  >
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-black text-base">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* FEEDBACK */}
          {stage === 'feedback' && (() => {
            const lastHistory = gameHistory[gameHistory.length - 1];
            const isClassCorrect = lastHistory?.classification.isCorrect;
            const correctCls = currentNews.correctClass;
            const cfg = CLASS_CONFIG[correctCls] ?? CLASS_CONFIG['GÜVENİLİR'];
            const qCorrect = lastHistory?.answers.filter(a => a.isCorrect).length ?? 0;
            const qTotal = lastHistory?.answers.length ?? 0;

            return (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-6 space-y-4"
              >
                {/* Result banner */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isClassCorrect ? 'bg-emerald-950/50 border-emerald-700' : 'bg-red-950/50 border-red-700'}`}>
                  <span className="text-4xl">{isClassCorrect ? '🎉' : '🔎'}</span>
                  <div>
                    <p className={`font-black text-lg ${isClassCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {isClassCorrect ? 'Doğru sınıflandırdın! +20 puan' : 'Yanlış sınıflandırma'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Gerçek tür: <span className={`font-bold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                    </p>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Analiz Soruları</p>
                    <p className="text-white font-black text-2xl">{qCorrect}/{qTotal}</p>
                    <p className="text-amber-400 text-sm font-bold">+{qCorrect * 10} puan</p>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Sınıflandırma</p>
                    <p className={`font-black text-2xl ${isClassCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isClassCorrect ? '✅' : '❌'}
                    </p>
                    <p className="text-amber-400 text-sm font-bold">{isClassCorrect ? '+20 puan' : '+0 puan'}</p>
                  </div>
                </div>

                {/* Feedback text */}
                <div className="bg-blue-950/40 border border-blue-800/50 rounded-2xl p-4">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">💡 Uzman Değerlendirmesi</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{currentNews.feedback}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextNews}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl text-base border-b-4 border-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  {currentIndex < NEWS_DATA.length - 1 ? (
                    <><span>Sonraki Dosya</span><span>➔</span></>
                  ) : (
                    <><span>Nihai Raporu Gör</span><span>🏆</span></>
                  )}
                </motion.button>
              </motion.div>
            );
          })()}

        </AnimatePresence>
      </div>
    </div>
  );
}
