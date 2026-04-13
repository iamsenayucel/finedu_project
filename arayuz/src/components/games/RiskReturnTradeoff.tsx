import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskReturnTradeoffProps {
  onComplete?: (score: number) => void;
}

// ─── VERİ ─────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 1,
    image: '/games/RiskReturnTradeoff/1.jpeg',
    question: 'Sence şu an nasıl bir piyasa durumunun içindeyiz?',
    choices: [
      { id: 'A', text: 'İyimser (Boğa Piyasası)', sub: 'Fiyatlar artıyor, her şey yolunda. Tam yatırım zamanı!' },
      { id: 'B', text: 'Kötümser (Ayı Piyasası)', sub: 'Fiyatlar sürekli düşüyor, piyasada korku hakim.' },
      { id: 'C', text: 'Durgun (Yatay Trend)', sub: 'Piyasada yaprak kımıldamıyor, fiyatlar sabit.' },
    ],
    correct: 'A',
    feedbacks: {
      A: { icon: '🌟', title: 'Doğru Teşhis!', type: 'correct', text: 'Coşkulu bir "Boğa Piyasası"nın tam ortasındayız. Herkes kazanıyor, dışarıda tam bir para yağmuru var. Şimdi dümende sen varsın...' },
      B: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Grafiklere bak: fiyatlar yükseliyor, haberler coşkulu. Bu bir Boğa Piyasası.' },
      C: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Piyasa "yatay" değil, roket gibi yukarı çıkıyor. Tekrar incele!' },
    },
  },
  {
    id: 2,
    image: '/games/RiskReturnTradeoff/2.jpeg',
    question: 'Portföyünün %80\'i kasada nakit yatıyor! Piyasa roket gibi uçarken ne yapmalısın?',
    choices: [
      { id: 'A', text: 'HÜCUM — Riski Artır', sub: 'Nakitin bir kısmıyla hemen teknoloji ve şirket hisseleri AL. Bu rüzgarı kaçıramam!' },
      { id: 'B', text: 'İZLEYİCİ KAL — Koru', sub: 'Korkuyorum. Portföy böyle kalsın, başkalarının zengin olmasını uzaktan izleyeyim.' },
      { id: 'C', text: 'PANİK — Sat', sub: 'Bu yükseliş yalan! Küçücük %20\'lik hisseyi de sat, %100 nakite geçip sığınağa gir.' },
    ],
    correct: 'A',
    feedbacks: {
      A: { icon: '🏆', title: 'HARİKA: FIRSATI KAÇIRMADIN!', type: 'correct', text: '"Fırsat Maliyeti" tuzağına düşmedin. Piyasa coşkuyla yükselirken paranı çalıştırdın. Harika bir hamle! 🎖️ Fırsat Avcısı Rozeti kazanıldı!' },
      B: { icon: '❌', title: 'FIRSAT KAÇTI! (Korkaklık)', type: 'wrong', text: 'Güvenli limanda kalmak kriz anlarında iyidir ama dışarıda para yağmuru varken sığınakta beklemek sana sadece zaman kaybettirir. Paran enflasyon karşısında eriyor.' },
      C: { icon: '🚨', title: 'KRİTİK HATA! (Aşırı Korku)', type: 'critical', text: 'Trendin tamamen tersine hareket ettin! Coşkulu piyasada panikle nakite geçmek, seni kâr partisinin dışına itti. İyi bir yatırımcı mantıkla hareket eder, vesveseyle değil!' },
    },
  },
  {
    id: 3,
    image: '/games/RiskReturnTradeoff/3.jpeg',
    question: 'Sence şu an nasıl bir piyasa durumunun içindeyiz?',
    choices: [
      { id: 'A', text: 'İyimser (Boğa Piyasası)', sub: 'Fiyatlar artıyor, her şey yolunda. Tam yatırım zamanı!' },
      { id: 'B', text: 'Kötümser (Ayı Piyasası)', sub: 'Fiyatlar sürekli düşüyor, piyasada korku hakim.' },
      { id: 'C', text: 'Durgun (Yatay Trend)', sub: 'Piyasada yaprak kımıldamıyor, fiyatlar sabit.' },
    ],
    correct: 'B',
    feedbacks: {
      A: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Haberlere bak: fabrikalar duruyor, teknoloji şirketleri kâr uyarısı yapıyor. Bu bir Boğa Piyasası değil.' },
      B: { icon: '📉', title: 'Doğru Teşhis!', type: 'correct', text: '"Ayı Mevsimi"nin tam ortasındayız. Fırtına bulutları toplandı, endeksler kırmızıya boyandı. Şimdi bu fırtınada dümende sen varsın, portföyünü korumak için ne yapacaksın?' },
      C: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Piyasa yatay seyretmiyor, sert düşüyor. Grafiklerdeki kırmızı oklara dikkat et!' },
    },
  },
  {
    id: 4,
    image: '/games/RiskReturnTradeoff/4.jpeg',
    question: 'Portföyünün %90\'ı hisse senetlerinde mahsur kaldı ve eriyor! Nakit oranın sadece %10. Ne yapmalısın?',
    choices: [
      { id: 'A', text: 'TEDBİRLİ — Riski Yönet', sub: 'En çok düşen riskli hisselerden bir kısmını sat, nakit oranını artır. Portföyü hayatta tut!' },
      { id: 'B', text: 'PASİF — Hareketsiz Kal', sub: 'Ekranı kapatıp bakmayacağım. Portföy olduğu gibi kalsın, elbet bir gün yükselir.' },
      { id: 'C', text: 'GÖZÜ KARA — Tehlikeli Hamle', sub: 'Son %10 nakiti de düşen hisselere yatır! Nasılsa çok düştü, buradan dönerse çok kazanırım!' },
    ],
    correct: 'A',
    feedbacks: {
      A: { icon: '🛡️', title: 'TEBRİKLER: LİKİDİTEYİ KURTARDIN!', type: 'correct', text: '"Yüksek Risk Tuzağı"ndan kaçmayı başardın. Sert düşüşlerde hisse azaltıp nakit artırmak sermayeni korur. Fırtına dindiğinde, elindeki nakitle ucuzlamış sağlam şirketleri alacak gücün var!' },
      B: { icon: '📉', title: 'HASAR BÜYÜYOR! (Pasiflik Tuzağı)', type: 'wrong', text: '"Bakmazsam düşmez" mantığı seni korumaz. Portföyünün %90\'ı erirken müdahale etmemek, sermayeni fırtınaya kurban etmektir.' },
      C: { icon: '🚨', title: 'KRİTİK HATA! (Düşen Bıçak)', type: 'critical', text: 'Piyasa sert düşerken eldeki son nakiti de tehlikeye atmak rasyonel bir strateji değil. Nakitini sıfırladın ve piyasanın insafına kaldın!' },
    },
  },
  {
    id: 5,
    image: '/games/RiskReturnTradeoff/5.jpeg',
    question: 'Sence şu an nasıl bir piyasa durumunun içindeyiz?',
    choices: [
      { id: 'A', text: 'İyimser (Boğa Piyasası)', sub: 'Fiyatlar hızla artıyor, herkes coşkulu ve sürekli yeni alımlar yapıyor.' },
      { id: 'B', text: 'Kötümser (Ayı Piyasası)', sub: 'Fiyatlar sürekli düşüyor, piyasada korku hakim ve herkes kaçmaya çalışıyor.' },
      { id: 'C', text: 'Durgun (Yatay Trend)', sub: 'Fiyatlar belirli bir sınırda sıkışmış. Ne net bir yükseliş ne de düşüş var.' },
    ],
    correct: 'C',
    feedbacks: {
      A: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Haberlere bak: "Büyük Sessizlik", "Duraklama Dönemi". Coşkulu bir Boğa Piyasası değil bu.' },
      B: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Panik yok, büyük düşüş yok. Piyasa sıkıcı ama istikrarlı. Bu bir Ayı Piyasası değil.' },
      C: { icon: '🌟', title: 'Doğru Teşhis!', type: 'correct', text: 'Sıkıcı ama kritik bir "Yatay Piyasa"nın ortasındayız. Acemiler heyecan ararken, usta yatırımcılar pusuya yatıp nakit biriktiriyor. Dümende sen varsın...' },
    },
  },
  {
    id: 6,
    image: '/games/RiskReturnTradeoff/6.jpeg',
    question: 'Portföyün yarısı temettü hisselerinde, yarısı kasada. Sosyal medyada "Nova-X" adlı proje birkaç günde %150 kazandırdı. Ne yapmalısın?',
    choices: [
      { id: 'A', text: 'HÜCUM — Nova-X\'e Gir', sub: 'Temettü hisselerimi bozup tüm nakitimi Nova-X\'e yatırmalıyım. Herkes kazanırken bu fırsatı kaçıramam!' },
      { id: 'B', text: 'İZLEYİCİ KAL — Sabret', sub: 'Temettü hisselerimi tutmaya devam edeyim, gelen harçlıkları kasaya ekleyip gerçek fırsat için bekleyeyim.' },
      { id: 'C', text: 'PANİK — %100 Nakite Geç', sub: 'Bu sessizlik ve tuhaf yükselişler beni huzursuz etti. Temettü hisselerini de satıp tamamen nakite geçeyim.' },
    ],
    correct: 'B',
    feedbacks: {
      A: { icon: '🚨', title: 'FOMO TUZAĞINA DÜŞTÜN!', type: 'critical', text: 'Başkaları kazanıyor diye sana düzenli gelir sağlayan çalışan sistemi bozdun. Nova-X gibi hızlı parlayan varlıklar, sen en tepeden aldığında genellikle sert düşüşe geçer.' },
      B: { icon: '🏆', title: 'SABRIN ZAFERİ!', type: 'correct', text: 'Sosyal medyadaki gürültüye kulak asmadın ve stratejine sadık kaldın. Durgun piyasada temettü en iyi dostundur. Piyasa yönünü belli ettiğinde elinde güçlü bir nakit olacak! 🎖️ Soğukkanlı Yatırımcı Rozeti kazanıldı!' },
      C: { icon: '❌', title: 'GEREKSİZ TELAŞ!', type: 'wrong', text: 'Somut bir kriz yokken sana düzenli ödeme yapan güvenli kasanın kilidini kırdın. %100 nakite geçerek o durgun aylarda kazanabileceğin tüm garanti geliri çöpe attın.' },
    },
  },
];

const MAX_SCORE = QUESTIONS.length * 10;

// ─── YARDIMCI ─────────────────────────────────────────────────────────────────

function choiceStyle(id: string, selected: string | null, correct: string) {
  if (!selected) return 'border-slate-600 bg-slate-800/60 hover:border-indigo-400 hover:bg-indigo-900/40 cursor-pointer';
  if (id === correct) return 'border-emerald-400 bg-emerald-900/50 cursor-default';
  if (id === selected && id !== correct) return 'border-red-500 bg-red-900/40 cursor-default';
  return 'border-slate-700 bg-slate-800/30 opacity-40 cursor-default';
}

function choiceLetter(id: string, selected: string | null, correct: string) {
  if (!selected) return { bg: 'bg-slate-700 text-slate-300', icon: id };
  if (id === correct) return { bg: 'bg-emerald-500 text-white', icon: '✓' };
  if (id === selected) return { bg: 'bg-red-500 text-white', icon: '✗' };
  return { bg: 'bg-slate-700 text-slate-500', icon: id };
}

// ─── ANA BİLEŞEN ──────────────────────────────────────────────────────────────

export default function RiskReturnTradeoff({ onComplete }: RiskReturnTradeoffProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const question = QUESTIONS[qIndex];

  const handleSelect = (id: string) => {
    if (selected) return;
    setSelected(id);
    setShowFeedback(true);
    if (id === question.correct) setScore(s => s + 10);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelected(null);
    if (qIndex >= QUESTIONS.length - 1) {
      setStage('finished');
      if (onComplete) onComplete(score + (selected === question.correct ? 0 : 0));
    } else {
      setQIndex(i => i + 1);
    }
  };

  const handleNextAfterScore = () => {
    const finalScore = score;
    setShowFeedback(false);
    setSelected(null);
    if (qIndex >= QUESTIONS.length - 1) {
      setStage('finished');
      if (onComplete) onComplete(finalScore);
    } else {
      setQIndex(i => i + 1);
    }
  };

  const restart = () => {
    setStage('intro');
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setShowFeedback(false);
  };

  const feedback = selected ? question.feedbacks[selected as keyof typeof question.feedbacks] : null;

  // ── GİRİŞ ────────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative"
        style={{ aspectRatio: '16/9' }}>
        <img src="/games/RiskReturnTradeoff/giriş.jpeg" alt="Giriş"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="text-center">
            <p className="text-indigo-300 font-semibold text-sm mb-3 tracking-widest uppercase">
              Finansal Karar Simülasyonu
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 drop-shadow-lg">
              Mirasın Kaderi
            </h1>
            <p className="text-slate-300 text-sm md:text-base mb-7 max-w-lg mx-auto leading-relaxed">
              Piyasayı doğru oku, portföyünü akıllıca yönet. 6 kritik karar seni bekliyor.
            </p>
            <div className="flex items-center justify-center gap-6 mb-7">
              {['📰 Piyasayı Analiz Et', '🎯 Karar Ver', '🏆 Rozet Kazan'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">
                  <span className="text-xs font-bold text-white">{s}</span>
                </div>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setStage('playing')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-black py-3.5 px-12 rounded-full shadow-2xl border-b-4 border-indigo-800">
              OYUNA BAŞLA 🚀
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── BİTİŞ ────────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const pct = Math.round((score / MAX_SCORE) * 100);
    const perf = pct === 100
      ? { icon: '🏆', title: 'Efsanevi Yatırımcı!', sub: 'Tüm kararları mükemmel verdin. Portföy sende güvende!', color: 'from-yellow-600 to-amber-500' }
      : pct >= 66
      ? { icon: '🌟', title: 'Tecrübeli Analist', sub: 'Büyük çoğunluğu doğru okudun. Küçük hatalar öğreticidir.', color: 'from-indigo-600 to-violet-500' }
      : pct >= 33
      ? { icon: '📘', title: 'Gelişen Yatırımcı', sub: 'İyi bir başlangıç! Piyasa okuma becerini geliştirmeye devam et.', color: 'from-blue-600 to-cyan-500' }
      : { icon: '💪', title: 'Piyasa Acemisi', sub: 'Henüz başlangıçsın. Her hata seni daha iyi bir yatırımcı yapar!', color: 'from-slate-600 to-slate-500' };

    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-br ${perf.color} rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full bg-white/10"
                style={{ width: Math.random() * 80 + 20, height: Math.random() * 80 + 20, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }} />
            ))}
          </div>
          <div className="relative z-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="text-7xl mb-4">{perf.icon}</motion.div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{perf.title}</h2>
            <p className="text-white/80 text-base mb-6 max-w-sm mx-auto">{perf.sub}</p>

            {/* Puan göstergesi */}
            <div className="inline-flex flex-col items-center bg-black/25 rounded-2xl px-8 py-4 mb-6">
              <span className="text-5xl font-black text-white">{score}</span>
              <span className="text-white/60 text-sm font-bold">/ {MAX_SCORE} puan</span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto bg-black/20 rounded-full h-3 mb-8">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-3 rounded-full bg-white/70" />
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="bg-white/20 hover:bg-white/30 text-white font-black py-3 px-10 rounded-full border-2 border-white/30 text-lg backdrop-blur">
              Tekrar Oyna 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── OYUN ─────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="bg-slate-900 rounded-t-2xl px-5 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-sm">📰 Mirasın Kaderi</span>
          <div className="flex gap-1">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`h-2 w-6 rounded-full transition-all ${
                i < qIndex ? 'bg-emerald-500' : i === qIndex ? 'bg-indigo-400' : 'bg-slate-700'
              }`} />
            ))}
          </div>
          <span className="text-slate-400 text-xs">{qIndex + 1}/{QUESTIONS.length}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 rounded-full">
          <span className="text-yellow-400 text-sm">⭐</span>
          <span className="text-yellow-300 font-black text-sm">{score}</span>
          <span className="text-yellow-600 text-xs">/ {MAX_SCORE}</span>
        </div>
      </div>

      {/* Haber Görseli */}
      <AnimatePresence mode="wait">
        <motion.div key={qIndex} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
          <div className="relative bg-slate-900">
            <img src={question.image} alt={`Soru ${question.id}`}
              className="w-full object-contain max-h-64"
              draggable={false} />
            {/* Soru numarası rozeti */}
            <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
              SORU {question.id}
            </div>
          </div>

          {/* Soru & Şıklar */}
          <div className="bg-slate-900 px-5 pt-4 pb-5 rounded-b-2xl border-t border-slate-700">
            <h3 className="text-white font-black text-base md:text-lg mb-4 leading-snug">
              {question.question}
            </h3>

            <div className="flex flex-col gap-2.5">
              {question.choices.map((choice) => {
                const letter = choiceLetter(choice.id, selected, question.correct);
                return (
                  <motion.button key={choice.id}
                    whileHover={selected ? {} : { x: 4 }}
                    whileTap={selected ? {} : { scale: 0.98 }}
                    onClick={() => handleSelect(choice.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${choiceStyle(choice.id, selected, question.correct)}`}>
                    <span className={`shrink-0 w-8 h-8 rounded-lg font-black text-sm flex items-center justify-center transition-all ${letter.bg}`}>
                      {letter.icon}
                    </span>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{choice.text}</p>
                      <p className="text-slate-400 text-xs leading-tight mt-0.5">{choice.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Geri Bildirim */}
            <AnimatePresence>
              {showFeedback && feedback && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-4 rounded-xl px-4 py-3 border-l-4 ${
                    feedback.type === 'correct'
                      ? 'bg-emerald-900/50 border-emerald-400'
                      : feedback.type === 'critical'
                      ? 'bg-red-900/50 border-red-500'
                      : 'bg-amber-900/40 border-amber-500'
                  }`}>
                  <p className={`font-black text-sm mb-1 ${
                    feedback.type === 'correct' ? 'text-emerald-300'
                    : feedback.type === 'critical' ? 'text-red-300'
                    : 'text-amber-300'
                  }`}>
                    {feedback.icon} {feedback.title}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">{feedback.text}</p>

                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleNextAfterScore}
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 rounded-lg text-sm transition-colors">
                    {qIndex >= QUESTIONS.length - 1 ? 'Sonuçları Gör 🏁' : 'Sonraki Haber →'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
