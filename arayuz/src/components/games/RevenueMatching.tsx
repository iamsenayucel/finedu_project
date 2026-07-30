import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';

// ─── Drag type ────────────────────────────────────────────────────────────────
const DRAG = 'REVENUE_CARD';
interface CardItem { cardId: string }

// ─── Game data ────────────────────────────────────────────────────────────────
type Category = 'aktif' | 'pasif';

interface IncomeCard {
  id: string;
  img: string;
  label: string;
  cat: Category;
  note: string;
}

const CARDS: IncomeCard[] = [
  {
    id: '1',
    img: '/games/RevenueMatching/1.jpeg',
    label: 'Bir kafede günlük çalışarak para kazanmak',
    cat: 'aktif',
    note: 'Para kazanmak için aktif olarak çalışman gerekir.',
  },
  {
    id: '2',
    img: '/games/RevenueMatching/2.jpeg',
    label: 'Sahip olduğun evi kiraya vererek düzenli gelir elde etmek',
    cat: 'pasif',
    note: 'Ev kiraya verildikten sonra düzenli gelir oluşturur.',
  },
  {
    id: '3',
    img: '/games/RevenueMatching/3.jpeg',
    label: 'Paranı bankaya yatırarak faiz geliri kazanmak',
    cat: 'pasif',
    note: 'Para sen aktif çalışmadan faiz geliri üretir.',
  },
  {
    id: '4',
    img: '/games/RevenueMatching/4.jpeg',
    label: 'Öğrencilere özel ders vererek gelir elde etmek',
    cat: 'aktif',
    note: 'Gelir elde etmek için zamanını ve emeğini kullanırsın.',
  },
  {
    id: '5',
    img: '/games/RevenueMatching/5.jpeg',
    label: 'Freelance tasarım işleri yaparak para kazanmak',
    cat: 'aktif',
    note: 'İşi yaptıkça gelir elde edersin.',
  },
  {
    id: '6',
    img: '/games/RevenueMatching/6.jpeg',
    label: 'Bir mağazada çalışan olarak maaş almak',
    cat: 'aktif',
    note: 'Maaş almak için düzenli çalışman gerekir.',
  },
  {
    id: '7',
    img: '/games/RevenueMatching/7.jpeg',
    label: 'Video içerik üretip izlendikçe gelir kazanmak',
    cat: 'pasif',
    note: 'İçerik üretildikten sonra izlenmeye devam ettikçe gelir oluşabilir.',
  },
  {
    id: '8',
    img: '/games/RevenueMatching/8.jpeg',
    label: 'Mobil uygulama geliştirip kullanıldıkça gelir elde etmek',
    cat: 'pasif',
    note: 'Uygulama yayına alındıktan sonra kullanım üzerinden gelir oluşur.',
  },
  {
    id: '9',
    img: '/games/RevenueMatching/9.jpeg',
    label: 'Hisse senedi alıp şirket kârından pay (temettü) almak',
    cat: 'pasif',
    note: 'Yatırımın üzerinden dönemsel gelir elde edebilirsin.',
  },
  {
    id: '10',
    img: '/games/RevenueMatching/10.jpeg',
    label: 'Kurye olarak teslimat yapıp kazanç sağlamak',
    cat: 'aktif',
    note: 'Para kazanmak için aktif olarak teslimat yapman gerekir.',
  },
];

const PTS = 10;
const MAX_SCORE = CARDS.length * PTS;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPerf(score: number) {
  const pct = score / MAX_SCORE;
  if (pct === 1)    return { label: 'Mükemmel!',      icon: '🏆', color: 'text-yellow-500',  bg: 'bg-yellow-50  border-yellow-300' };
  if (pct >= 0.8)   return { label: 'Harika!',         icon: '🎉', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300' };
  if (pct >= 0.6)   return { label: 'İyi Gidiyorsun!', icon: '👍', color: 'text-blue-600',    bg: 'bg-blue-50    border-blue-300'    };
  return              { label: 'Tekrar Dene!',       icon: '📚', color: 'text-orange-600',  bg: 'bg-orange-50  border-orange-300' };
}

// ─── Draggable card ───────────────────────────────────────────────────────────
function DraggableCard({ card, shake }: { card: IncomeCard; shake: boolean }) {
  const [{ isDragging }, drag] = useDrag<CardItem, void, { isDragging: boolean }>({
    type: DRAG,
    item: { cardId: card.id },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  return (
    <motion.div
      animate={shake ? { x: [0, -12, 12, -12, 12, -6, 6, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <div ref={drag as any} style={{ opacity: isDragging ? 0.3 : 1, cursor: 'grab' }} className="select-none">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-300 hover:border-indigo-500 hover:shadow-indigo-200 hover:shadow-xl transition-all duration-200 w-60">
          <img
            src={card.img}
            alt={card.label}
            className="w-full aspect-square object-cover"
            draggable={false}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ category, count, onDrop }: {
  category: Category;
  count: number;
  onDrop: (cardId: string, cat: Category) => void;
}) {
  const [{ isOver }, drop] = useDrop<CardItem, void, { isOver: boolean }>({
    accept: DRAG,
    drop: ({ cardId }) => onDrop(cardId, category),
    collect: m => ({ isOver: m.isOver() }),
  });

  const isAktif = category === 'aktif';

  return (
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    <div ref={drop as any} className={`relative flex-1 rounded-3xl border-4 min-h-[300px] flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
      isAktif
        ? isOver ? 'bg-blue-100 border-blue-500 shadow-lg shadow-blue-200' : 'bg-blue-50 border-blue-200'
        : isOver ? 'bg-emerald-100 border-emerald-500 shadow-lg shadow-emerald-200' : 'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="text-6xl mb-1">{isAktif ? '💪' : '🌴'}</div>
      <h3 className={`text-xl font-black tracking-wide ${isAktif ? 'text-blue-700' : 'text-emerald-700'}`}>
        {isAktif ? 'AKTİF GELİR' : 'PASİF GELİR'}
      </h3>
      <p className={`text-sm font-medium ${isAktif ? 'text-blue-400' : 'text-emerald-400'}`}>
        {isAktif ? 'Çalışarak kazanılan gelir' : 'Emeksiz akan gelir'}
      </p>
      <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-black ${
        isAktif ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
      }`}>
        {count} kart
      </div>
      {isOver && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 rounded-3xl border-4 border-dashed border-current pointer-events-none"
        />
      )}
    </div>
  );
}

// ─── Side panel data ──────────────────────────────────────────────────────────
const REVENUE_PANEL = {
  dictionary: [
    { term: 'Temettü (Kâr Payı)', def: 'Bir şirketin yıl sonunda elde ettiği kârdan, hisse senedi sahiplerine dağıttığı nakit ödemedir.' },
    { term: 'Hisse Senedi', def: 'Borsada işlem gören dev bir şirkete senin de küçük bir oranda "ortak" olmanı sağlayan dijital tapudur.' },
    { term: 'Faiz Getirisi', def: 'Nakit paranın bankada belirli bir süre bekletilmesi karşılığında, paranın senin için ürettiği ek kazançtır.' },
    { term: 'Freelance (Serbest) Çalışma', def: 'Belirli bir patrona bağlı kalmadan, kendi becerilerini kullanarak proje bazlı iş teslim etme modelidir.' },
    { term: 'Telif / İzlenme Hakkı', def: 'Geliştirdiğin bir uygulamanın veya çektiğin bir videonun, her kullanıldığında sana otomatik olarak ödediği paydır.' },
  ],
  strategyTitle: 'Strateji Merkezi',
  strategyTips: [
    { title: '💪 Aktif Gelir (Zaman = Para)', desc: 'Zamanını ve emeğini doğrudan parayla takas ettiğin modeldir. Çalışmayı bıraktığın an, gelir de anında durur.' },
    { title: '🌴 Pasif Gelir (Sistem = Para)', desc: 'Bir kez emek harcayıp sistem kurduktan sonra, sen uyurken bile hesabına para akmaya devam eden modeldir.' },
    { title: '💡 Dijital Eserler (Özel Durum)', desc: 'Başlangıçta yoğun "aktif" çaba gerektirir. Ürün bittikten sonra aylar boyunca para kazandırıyorsa, bu artık "Pasif Gelir"e dönüşmüştür.' },
  ],
};

// ─── Main game component ──────────────────────────────────────────────────────
interface RevenueMatchingProps { onComplete?: (score: number) => void }

function RevenueMatchingGame({ onComplete }: RevenueMatchingProps) {
  const [stage, setStage] = useState<'intro' | 'game' | 'finished'>('intro');

  // Shuffle once per game
  const [shuffled, setShuffled] = useState<IncomeCard[]>([]);
  const [cardIdx, setCardIdx] = useState(0);

  const [score, setScore]           = useState(0);
  const [correctCount, setCorrect]  = useState(0);
  const [wrongCount, setWrong]      = useState(0);
  const [aktifCount, setAktif]      = useState(0);
  const [pasifCount, setPasif]      = useState(0);

  // Feedback state
  const [shake, setShake]           = useState(false);
  const [feedback, setFeedback]     = useState<{ correct: boolean; note?: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Wrong answers for end-screen recap
  const [wrongCards, setWrongCards] = useState<{ card: IncomeCard; attemptedCat: Category }[]>([]);

  const startGame = () => {
    const s = shuffle(CARDS);
    setShuffled(s);
    setCardIdx(0);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setAktif(0);
    setPasif(0);
    setShake(false);
    setFeedback(null);
    setProcessing(false);
    setWrongCards([]);
    setStage('game');
  };

  const handleDrop = (cardId: string, droppedCat: Category) => {
    if (processing) return;
    const card = shuffled[cardIdx];
    if (!card || card.id !== cardId) return;

    setProcessing(true);
    const correct = droppedCat === card.cat;

    if (correct) {
      setScore(prev => prev + PTS);
      setCorrect(prev => prev + 1);
      if (card.cat === 'aktif') setAktif(prev => prev + 1);
      else setPasif(prev => prev + 1);
      setFeedback({ correct: true });

      setTimeout(() => {
        setFeedback(null);
        if (cardIdx + 1 >= shuffled.length) {
          onComplete?.(score + PTS);
          setStage('finished');
        } else {
          setCardIdx(prev => prev + 1);
        }
        setProcessing(false);
      }, 900);
    } else {
      setWrong(prev => prev + 1);
      setWrongCards(prev => [...prev, { card, attemptedCat: droppedCat }]);
      setShake(true);
      setFeedback({ correct: false, note: card.note });

      setTimeout(() => {
        setShake(false);
        setFeedback(null);
        if (cardIdx + 1 >= shuffled.length) {
          onComplete?.(score);
          setStage('finished');
        } else {
          setCardIdx(prev => prev + 1);
        }
        setProcessing(false);
      }, 2800);
    }
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
          {/* Hero image */}
          <div className="relative">
            <img
              src="/games/RevenueMatching/ana.jpeg"
              alt="Aktif & Pasif Gelir Eşleştirme Oyunu"
              className="w-full object-cover max-h-72"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          </div>

          {/* Info card */}
          <div className="bg-white px-8 py-8 text-center">
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              Aktif & Pasif Gelir Eşleştirme Oyunu
            </h1>
            <p className="text-slate-500 text-base mb-6">
              Gelir kaynaklarını öğren ve doğru kategoriyle eşleştir!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="text-3xl mb-1">💪</div>
                <p className="font-black text-blue-700 text-sm">AKTİF GELİR</p>
                <p className="text-slate-500 text-xs mt-1">Emek & zaman harcayarak kazanılan gelir</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="text-3xl mb-1">🌴</div>
                <p className="font-black text-emerald-700 text-sm">PASİF GELİR</p>
                <p className="text-slate-500 text-xs mt-1">Yatırım veya varlıktan gelen sürekli gelir</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 mb-8 text-slate-500 text-sm">
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">{CARDS.length}</div>
                <div>Kart</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">{MAX_SCORE}</div>
                <div>Maks. Puan</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">+{PTS}</div>
                <div>Doğru başına</div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-lg shadow-indigo-200 border-b-4 border-indigo-800"
            >
              Oyuna Başla 🚀
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── FINISHED ───────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const perf = getPerf(score);
    // Deduplicate wrong cards (show each card once even if tried multiple times)
    const uniqueWrongs = wrongCards.filter(
      (w, i, arr) => arr.findIndex(x => x.card.id === w.card.id) === i
    );

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-white rounded-3xl overflow-hidden shadow-2xl border-2 ${perf.bg}`}>
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-7xl mb-3"
              >{perf.icon}</motion.div>
              <h2 className="text-3xl font-black text-slate-800 mb-1">Oyun Bitti!</h2>
              <p className={`text-xl font-bold mb-4 ${perf.color}`}>{perf.label}</p>
              <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-4xl font-black py-3 px-12 rounded-full shadow-lg">
                {score} / {MAX_SCORE} puan
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-3xl font-black text-slate-800">{correctCount}</p>
                <p className="text-slate-500 text-sm">Doğru</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-1" />
                <p className="text-3xl font-black text-slate-800">{wrongCount}</p>
                <p className="text-slate-500 text-sm">Yanlış Deneme</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                <p className="text-3xl font-black text-slate-800">{score}</p>
                <p className="text-slate-500 text-sm">Toplam Puan</p>
              </div>
            </div>

            {/* Wrong answers recap */}
            {uniqueWrongs.length > 0 && (
              <div className="mb-8">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider mb-3">
                  Yanlış Tahmin Ettiklerin
                </h3>
                <div className="space-y-2">
                  {uniqueWrongs.map(({ card }) => (
                    <div key={card.id} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <img src={card.img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-bold leading-snug">{card.label}</p>
                        <p className={`text-xs font-bold mt-0.5 ${card.cat === 'aktif' ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {card.cat === 'aktif' ? '💪 Aktif Gelir' : '🌴 Pasif Gelir'}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">💡 {card.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replay */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-indigo-800"
            >
              <RotateCcw className="w-5 h-5" /> Tekrar Oyna
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────────────────────
  const currentCard = shuffled[cardIdx];
  const remaining   = shuffled.length - cardIdx;
  const progress    = (cardIdx / shuffled.length) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">
        {/* Left Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-cyan-800/40">
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-0.5">📖 Ekonomi Sözlüğü</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {REVENUE_PANEL.dictionary.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-cyan-300 mb-1.5">{item.term}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">İlerleme</span>
            <div className="flex gap-1">
              {shuffled.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${
                  i < cardIdx ? 'w-4 bg-emerald-400'
                  : i === cardIdx ? 'w-6 bg-indigo-500'
                  : 'w-4 bg-slate-200'
                }`} />
              ))}
            </div>
            <span className="text-slate-600 font-bold text-sm">{cardIdx + 1} / {shuffled.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <CheckCircle className="w-4 h-4" /> {correctCount}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-3 py-1">
              <XCircle className="w-4 h-4" /> {wrongCount}
            </div>
            <div className="bg-indigo-600 text-white font-black text-sm px-4 py-1.5 rounded-full">
              {score} puan
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Instruction */}
          <p className="text-center text-slate-500 text-sm mb-5 font-medium">
            Kartı sürükleyerek doğru gelir kategorisine bırak
          </p>

          {/* Three-column layout: zone | card | zone */}
          <div className="flex gap-4 items-stretch">
            {/* Left zone: Aktif Gelir */}
            <DropZone category="aktif" count={aktifCount} onDrop={handleDrop} />

            {/* Center: Current card */}
            <div className="flex flex-col items-center justify-center gap-4 flex-shrink-0">
              <AnimatePresence mode="wait">
                {currentCard && (
                  <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.25 }}
                  >
                    <DraggableCard card={currentCard} shake={shake} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card label below image */}
              {currentCard && (
                <div className="bg-slate-100 rounded-2xl px-4 py-3 max-w-[240px] text-center border border-slate-200">
                  <p className="text-slate-700 text-sm font-bold leading-snug">{currentCard.label}</p>
                </div>
              )}

              {/* Remaining badge */}
              <div className="text-slate-400 text-xs font-medium">
                {remaining} kart kaldı
              </div>
            </div>

            {/* Right zone: Pasif Gelir */}
            <DropZone category="pasif" count={pasifCount} onDrop={handleDrop} />
          </div>

          {/* Feedback toast */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className={`mt-5 rounded-2xl px-5 py-4 flex items-start gap-3 border ${
                  feedback.correct
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {feedback.correct
                  ? <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                }
                <div>
                  {feedback.correct ? (
                    <p className="text-emerald-700 font-black">Doğru! +{PTS} puan kazandın 🎉</p>
                  ) : (
                    <>
                      <p className="text-red-700 font-black mb-1">Yanlış kategori!</p>
                      <p className="text-slate-600 text-sm">💡 {feedback.note}</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
            style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
          >
            <div className="px-4 py-3.5 border-b border-amber-800/40">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 {REVENUE_PANEL.strategyTitle}</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {REVENUE_PANEL.strategyTips.map((tip, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-amber-300 mb-1.5">{tip.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Export with DndProvider ──────────────────────────────────────────────────
export default function RevenueMatching({ onComplete }: RevenueMatchingProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <RevenueMatchingGame onComplete={onComplete} />
    </DndProvider>
  );
}
