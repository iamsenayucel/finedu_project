import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Search, Database, ThumbsUp, Share2, MessageCircle, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

interface RealDataHunterProps {
  onComplete?: (score: number) => void;
}

// ── Types ────────────────────────────────────────────────────────────────────

type Stage = 'intro' | 'step1' | 'step2' | 'step3' | 'step4' | 'finished';

interface AnswerRecord {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// ── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'step1',
    question: 'Bu bilginin doğruluğunu kontrol etmek için ne yaparsın?',
    options: [
      { label: 'Sosyal medyada başka sayfalara bakarım', isCorrect: false },
      { label: 'Güvenilir veri kaynağını kontrol ederim', isCorrect: true },
      { label: 'Habere direkt inanırım', isCorrect: false },
    ],
  },
  {
    id: 'step2',
    question: 'Gerçek enflasyon verisini bulmak için hangi kaynağı seçersin?',
    options: [
      { label: '📊 Resmi veri kurumu sitesi', isCorrect: true },
      { label: '📝 Bir blog sitesi', isCorrect: false },
      { label: '📱 Sosyal medya hesabı', isCorrect: false },
    ],
  },
  {
    id: 'step3',
    question: 'Son açıklanan enflasyon oranı nedir?',
    options: [
      { label: '%5', isCorrect: false },
      { label: '%65', isCorrect: true },
      { label: '%1', isCorrect: false },
    ],
  },
  {
    id: 'step4',
    question: 'Bu haber doğru mu?',
    options: [
      { label: '✅ Doğru bilgi', isCorrect: false },
      { label: '⚠️ Yanıltıcı bilgi', isCorrect: true },
      { label: '🔍 Eksik bilgi', isCorrect: false },
    ],
  },
];

const STEP_LABELS = ['Strateji', 'Kaynak', 'Veri', 'Sonuç'];

// ── Panel data ────────────────────────────────────────────────────────────────

const STEP_PANELS = [
  {
    // step1 — Strateji
    stepLabel: 'Adım 1 · Sosyal Medya İddiası',
    dictionary: [
      { term: 'Enflasyon', def: 'Mal ve hizmetlerin fiyatlarının genel düzeyindeki sürekli artıştır. Paranın alım gücünün düşmesi anlamına gelir.' },
      { term: 'Düşüş Trendi', def: 'Bir ekonomik göstergenin belirli bir zaman dilimi içinde sürekli olarak aşağı yönlü hareket etme eğilimidir.' },
      { term: 'Spekülatif Gönderi', def: 'Kesin bir veriye dayanmayan, genellikle belirli bir algı yaratmak için paylaşılan tahmini veya kışkırtıcı içerikler.' },
    ],
    strategyTitle: 'Tehlike İşaretlerini Tanı',
    strategyTips: [
      { title: 'Aşırı Duygu Kullanımı', desc: '"FLAŞ HABER", 🔥 ve 💚 gibi emojiler genellikle manipülatif gönderilerde dikkat çekmek için abartılı şekilde kullanılır.' },
      { title: 'Kaynak Eksikliği', desc: '"Bu rakamlar ekonominin güçlü toparlandığını gösteriyor" denmiş ama "Hangi kuruma göre?" sorusunun cevabı yok.' },
      { title: 'Stratejik Hamle', desc: '"Doğrulanmamış" ibaresi bir uyarıdır. Platformdaki dedikodulara değil, orijinal kaynağa gitmelisin.' },
    ],
  },
  {
    // step2 — Kaynak
    stepLabel: 'Adım 2 · Kaynak Seçimi',
    dictionary: [
      { term: 'Resmi Veri Kurumu', def: 'Devlet tarafından yasal olarak yetkilendirilmiş, ulusal istatistikleri bilimsel yöntemlerle toplayıp yayınlayan tarafsız kurumlardır (TÜİK, Merkez Bankası).' },
      { term: 'Birincil Kaynak', def: 'Verinin ilk elden üretildiği, doğrudan araştırmayı yapan orijinal kaynaktır. Doğrulamada en güvenilir adımdır.' },
      { term: 'İkincil Kaynak', def: 'Birincil kaynaktaki veriyi alıp yorumlayan, özetleyen veya haberleştiren bloglar, gazeteler veya sosyal medya hesaplarıdır.' },
    ],
    strategyTitle: 'Güvenilirlik Hiyerarşisi',
    strategyTips: [
      { title: 'Sosyal Medya', desc: 'Anonim olabilir, manipülasyona açıktır. En düşük güvenilirlik düzeyi.' },
      { title: 'Blog Siteleri', desc: "Yazarın şahsi yorumunu içerir, veriyi işlerken hata yapılmış olabilir." },
      { title: 'Resmi Kurum (.gov.tr)', desc: "Makroekonomik verilerin yasal birincil merkezidir. URL'nin .gov veya .gov.tr uzantısı güvenilirlik işaretidir." },
    ],
  },
  {
    // step3 — Veri
    stepLabel: 'Adım 3 · Resmi Veri Analizi',
    dictionary: [
      { term: 'TÜFE', def: 'Tüketici Fiyat Endeksi. Hanehalklarının tüketim amacıyla satın aldığı mal ve hizmetlerin fiyatlarındaki değişimi ölçer. "Manşet enflasyon" olarak bilinir.' },
      { term: 'ÜFE', def: 'Üretici Fiyat Endeksi. Üretici düzeyindeki fiyat değişimini ölçer. Gelecekteki tüketici enflasyonunun habercisidir.' },
      { term: 'Yıllık Değişim', def: 'İlgili ayın endeks değerinin, bir önceki yılın aynı ayına göre yüzde kaç değiştiğini gösterir (Örn: Aralık 2024 vs Aralık 2023).' },
    ],
    strategyTitle: 'Tablo Okuma Sanatı',
    strategyTips: [
      { title: 'Dönem Kontrolü', desc: 'Baktığın veri güncel mi? Hangi yıl ve aya ait olduğunu mutlaka kontrol et.' },
      { title: 'Doğru Metriği Seç', desc: 'İddia genel "enflasyon" üzerineyse, halkın hissettiği manşet enflasyon olan TÜFE\'ye odaklanmalısın.' },
      { title: 'Gerçeği Not Al', desc: 'Resmi tablodaki veriyi iddia edilen rakamla karşılaştır. Farkın boyutuna dikkat et.' },
    ],
  },
  {
    // step4 — Sonuç
    stepLabel: 'Adım 4 · Karar ve Sınıflandırma',
    dictionary: [
      { term: 'Yanıltıcı Bilgi', def: 'Gerçeği yansıtmayan, bağlamından koparılmış veya kasıtlı olarak değiştirilmiş istatistiksel verilerin kitlelere sunulması.' },
      { term: 'Eksik Bilgi', def: 'Verinin sadece işe gelen bir kısmının alınıp genel duruma mal edilmesi durumudur (Cherry-picking).' },
      { term: 'Teyitçilik', def: 'Ortaya atılan şüpheli bir iddianın, şeffaf, tarafsız ve tekrarlanabilir bir metodoloji ile doğrulanması süreci.' },
    ],
    strategyTitle: 'Nihai Karar Anı',
    strategyTips: [
      { title: 'İki Veriyi Karşılaştır', desc: 'İddia edilen rakam ile resmi kurumun verisi arasındaki farkın boyutunu incele.' },
      { title: 'Farkın Anlamı', desc: '13 katlık bir uçurum "yuvarlama hatası" değil, kitleleri yanıltmak için kurgulanmış bir senaryodur.' },
      { title: 'Altın Kural', desc: 'Her finansal iddiayı resmi ve birincil kaynaklarla doğrula. Duygusal içerik her zaman şüpheyle karşıla.' },
    ],
  },
];

// ── Performance feedback ─────────────────────────────────────────────────────

function getPerformance(score: number) {
  if (score === 40) return { label: 'Mükemmel Analist!', sub: 'Her adımı doğru tamamladın.', color: 'text-emerald-400', icon: '🏆', bg: 'from-emerald-900/60 to-slate-900' };
  if (score === 30) return { label: 'Çok İyi İş!', sub: 'Neredeyse mükemmeldin.', color: 'text-blue-400', icon: '👍', bg: 'from-blue-900/60 to-slate-900' };
  if (score === 20) return { label: 'Kısmi Anlayış', sub: 'Bazı adımlarda daha dikkatli olabilirdin.', color: 'text-yellow-400', icon: '📘', bg: 'from-yellow-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', sub: 'Tekrar oynayarak stratejileri pekiştir.', color: 'text-red-400', icon: '📚', bg: 'from-red-900/60 to-slate-900' };
}

// ── Fake social media post ────────────────────────────────────────────────────

function FakePost() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-black text-sm">
          EK
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">Ekonomi Kulübü 🇹🇷</p>
          <p className="text-gray-400 text-xs">2 saat önce · 🌐 Herkese Açık</p>
        </div>
        <div className="ml-auto bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          Takip Et
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 py-4">
        <p className="text-gray-800 text-sm leading-relaxed mb-3">
          🚨 <strong>FLAŞ HABER!</strong> Türkiye'de enflasyon büyük düşüş yaşadı!{' '}
          <span className="text-green-600 font-bold">Enflasyon %5'e geriledi!</span> 💚📉
          Bu rakamlar ekonominin güçlü bir şekilde toparlandığını gösteriyor.
          Herkes bunu paylaşsın! 🔥🔥🔥
        </p>

        {/* Fake stat card inside post */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-xs font-bold uppercase tracking-wide">Enflasyon Oranı</p>
              <p className="text-green-600 text-4xl font-black">%5</p>
              <p className="text-green-500 text-xs mt-1">▼ Düşüş trendi devam ediyor</p>
            </div>
            <TrendingDown className="text-green-400 w-12 h-12 opacity-60" />
          </div>
        </div>

        <p className="text-blue-500 text-sm">#enflasyon #ekonomi #türkiye #iyihaber</p>
      </div>

      {/* Post footer */}
      <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-100 text-gray-500 text-sm">
        <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
          <ThumbsUp className="w-4 h-4" /> <span>14.2K</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
          <Share2 className="w-4 h-4" /> <span>3.8K</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-purple-500 transition-colors">
          <MessageCircle className="w-4 h-4" /> <span>892</span>
        </button>
        <div className="ml-auto flex items-center gap-1 text-orange-400 font-bold text-xs">
          <AlertTriangle className="w-3.5 h-3.5" /> Doğrulanmamış
        </div>
      </div>
    </div>
  );
}

// ── Official data panel (shown in step 3) ────────────────────────────────────

function OfficialDataPanel() {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-5 py-3 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-200" />
        <div>
          <p className="text-white font-bold text-sm">Türkiye İstatistik Kurumu (TÜİK)</p>
          <p className="text-blue-200 text-xs">Resmi Fiyat İstatistikleri Bülteni</p>
        </div>
        <div className="ml-auto bg-blue-600/50 text-blue-100 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/40">
          ✓ Resmi Kaynak
        </div>
      </div>

      {/* Data rows */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">Dönem</span>
          <span className="text-white font-bold text-sm">Aralık 2024 (YıllıkDeğişim)</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">Yayın Tarihi</span>
          <span className="text-white font-bold text-sm">03.01.2025</span>
        </div>
        <div className="flex justify-between items-center py-3 bg-slate-700/50 rounded-xl px-4">
          <span className="text-slate-300 font-bold">TÜFE (Yıllık Değişim)</span>
          <span className="text-red-400 font-black text-2xl">%65</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">ÜFE (Yıllık Değişim)</span>
          <span className="text-white font-bold text-sm">%43,8</span>
        </div>
        <div className="flex items-center gap-2 mt-2 bg-blue-900/40 rounded-xl px-4 py-3 border border-blue-700/40">
          <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-blue-300 text-xs">Veriler TÜİK resmi istatistik sisteminden derlenmiştir. tuik.gov.tr</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RealDataHunter({ onComplete }: RealDataHunterProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [leavingIntro, setLeavingIntro] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentStep = STEPS[stepIndex];
  const stageKeys: Stage[] = ['step1', 'step2', 'step3', 'step4'];

  const handleAnswer = (option: { label: string; isCorrect: boolean }) => {
    if (selected !== null) return;
    setSelected(option.label);
    const earned = option.isCorrect ? 10 : 0;
    if (option.isCorrect) setScore(prev => prev + earned);
    setHistory(prev => [...prev, {
      question: currentStep.question,
      userAnswer: option.label,
      correctAnswer: currentStep.options.find(o => o.isCorrect)!.label,
      isCorrect: option.isCorrect,
    }]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setSelected(null);
    setShowFeedback(false);
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
      setStage(stageKeys[stepIndex + 1]);
    } else {
      if (onComplete) onComplete(score);
      setStage('finished');
    }
  };

  const handleRestart = () => {
    setStage('intro');
    setStepIndex(0);
    setScore(0);
    setHistory([]);
    setSelected(null);
    setShowFeedback(false);
  };

  // ── INTRO: büyük sözlük + strateji inceleme ekranı ─────────────────────────
  if (stage === 'intro') {
    const introPanel = STEP_PANELS[0];
    const startGame = () => {
      setLeavingIntro(true);
      setTimeout(() => setStage('step1'), 380);
    };
    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Kompakt başlık */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Gerçek Veri Avı 🔍</h1>
          <p className="text-slate-400 text-sm">
            Oyuna geçmeden önce sözlüğü ve stratejiyi incele · 4 adım · Maks. 40 puan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Sol: Ekonomi Sözlüğü (büyük) */}
          <AnimatePresence>
            {!leavingIntro && (
              <motion.div
                key="dict"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
                style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
              >
                <div className="px-5 py-4 border-b border-cyan-800/40">
                  <div className="text-cyan-400 text-base font-black uppercase tracking-widest">📖 Ekonomi Sözlüğü</div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
                  {introPanel.dictionary.map((item, i) => (
                    <div key={i}>
                      <div className="text-base font-bold text-cyan-300 mb-1.5">{item.term}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{item.def}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sağ: Strateji Merkezi (büyük) */}
          <AnimatePresence>
            {!leavingIntro && (
              <motion.div
                key="strat"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 80 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
                style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
              >
                <div className="px-5 py-4 border-b border-amber-800/40">
                  <div className="text-amber-400 text-base font-black uppercase tracking-widest">🎯 Strateji Merkezi</div>
                  <div className="text-amber-600 text-xs mt-0.5">{introPanel.strategyTitle}</div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
                  {introPanel.strategyTips.map((tip, i) => (
                    <div key={i}>
                      <div className="text-base font-bold text-amber-300 mb-1.5">{tip.title}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{tip.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!leavingIntro && (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-purple-800"
            >
              Oyuna Geç 🔍
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  // ── FINISHED ────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const perf = getPerformance(score);
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-gradient-to-br ${perf.bg} rounded-3xl overflow-hidden shadow-2xl border border-slate-700`}>
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <div className="p-8">
            {/* Score + performance */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-7xl mb-4"
              >
                {perf.icon}
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-1">Analiz Tamamlandı!</h2>
              <p className={`text-xl font-bold mb-4 ${perf.color}`}>{perf.label}</p>
              <p className="text-slate-400 text-sm mb-6">{perf.sub}</p>
              <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-10 rounded-full shadow-xl">
                {score} / 40 Puan
              </div>
            </div>

            {/* Misinformation summary */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-600/50 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" /> Yanıltıcı İddia Özeti
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-red-900/40 rounded-xl p-3 border border-red-700/40">
                  <p className="text-red-300 text-xs mb-1">Sosyal Medya İddiası</p>
                  <p className="text-red-400 font-black text-2xl">%5</p>
                  <p className="text-red-300 text-xs">Enflasyon</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-slate-400 font-black text-xl">≠</div>
                </div>
                <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/40">
                  <p className="text-emerald-300 text-xs mb-1">Resmi TÜİK Verisi</p>
                  <p className="text-emerald-400 font-black text-2xl">%65</p>
                  <p className="text-emerald-300 text-xs">Enflasyon</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-3 text-center">
                Paylaşım, gerçek enflasyon oranını 13 kat düşük göstererek yanıltıcı içerik üretmiştir.
              </p>
            </div>

            {/* Step breakdown */}
            <div className="space-y-3 mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Adım Adım Kararların</h3>
              {history.map((record, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${record.isCorrect ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'}`}>
                  {record.isCorrect
                    ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs mb-0.5">{STEP_LABELS[idx]}:</p>
                    <p className="text-white text-sm font-medium truncate">{record.userAnswer}</p>
                    {!record.isCorrect && (
                      <p className="text-emerald-300 text-xs mt-0.5">Doğrusu: {record.correctAnswer}</p>
                    )}
                  </div>
                  <span className={`text-sm font-black flex-shrink-0 ${record.isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {record.isCorrect ? '+10' : '+0'}
                  </span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
            >
              Tekrar Oyna 🔄
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP SCREENS ─────────────────────────────────────────────────────────
  const panel = STEP_PANELS[stepIndex];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">

        {/* ── Left Panel: Ekonomi Sözlüğü ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${stepIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-cyan-800/40">
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-0.5">📖 Ekonomi Sözlüğü</div>
                <div className="text-cyan-600 text-xs">{panel.stepLabel}</div>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3.5">
                {panel.dictionary.map((item, i) => (
                  <div key={i}>
                    <div className="text-sm font-bold text-cyan-300 mb-1.5">{item.term}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Center: Game card ── */}
        <div className="flex-1 min-w-0">
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Adım</span>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-10 rounded-full transition-all duration-300 ${
                    i < stepIndex ? 'bg-emerald-500' : i === stepIndex ? 'bg-blue-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-slate-300 font-bold text-sm">{stepIndex + 1} / {STEPS.length}</span>
            <span className="text-slate-500 text-xs">— {STEP_LABELS[stepIndex]}</span>
          </div>
          <div className="bg-blue-900/60 text-blue-300 px-4 py-1.5 rounded-full text-sm font-black border border-blue-700/60">
            🔍 {score} puan
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Context panels */}
              <div className="mb-5">
                {(stage === 'step1' || stage === 'step4') && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">
                        Sosyal Medya Paylaşımı
                      </span>
                    </div>
                    <FakePost />
                  </div>
                )}

                {stage === 'step2' && (
                  <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">
                        Doğrulama Aşaması
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Sosyal medyada bir gönderi, <span className="text-red-400 font-bold">enflasyonun %5'e düştüğünü</span> iddia ediyor.
                      Bunu doğrulamak için hangi kaynağa başvurman gerekir?
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {[
                        { icon: '🏛️', label: 'Resmi Kurum', sub: 'tuik.gov.tr', color: 'border-blue-600/40 bg-blue-900/20' },
                        { icon: '📝', label: 'Blog Sitesi', sub: 'ekonomi-blog.com', color: 'border-slate-600 bg-slate-800' },
                        { icon: '📱', label: 'Sosyal Medya', sub: '@ekonomist123', color: 'border-slate-600 bg-slate-800' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                          <div className="text-2xl mb-1">{s.icon}</div>
                          <div className="text-white text-xs font-bold">{s.label}</div>
                          <div className="text-slate-400 text-xs">{s.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stage === 'step3' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        Resmi Veri Kaynağı
                      </span>
                    </div>
                    <OfficialDataPanel />
                  </div>
                )}
              </div>

              {/* Question */}
              <div className="bg-slate-800 rounded-xl px-5 py-4 border border-slate-700 mb-4">
                <p className="text-white font-bold text-base">
                  ❓ {currentStep.question}
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentStep.options.map(option => {
                  const isSelected = selected === option.label;
                  const isRevealed = showFeedback;
                  let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
                  if (isRevealed && option.isCorrect) btnClass = 'bg-emerald-900/60 border-emerald-500 text-emerald-300';
                  else if (isRevealed && isSelected && !option.isCorrect) btnClass = 'bg-red-900/60 border-red-500 text-red-300';
                  else if (isRevealed) btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-60';

                  return (
                    <motion.button
                      key={option.label}
                      whileHover={!isRevealed ? { scale: 1.01 } : {}}
                      whileTap={!isRevealed ? { scale: 0.99 } : {}}
                      onClick={() => handleAnswer(option)}
                      disabled={isRevealed}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                    >
                      <span>{option.label}</span>
                      {isRevealed && option.isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                      {isRevealed && isSelected && !option.isCorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Inline feedback + next button */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4"
                  >
                    <div className={`rounded-xl px-5 py-3 mb-4 flex items-center gap-3 ${
                      history[history.length - 1]?.isCorrect
                        ? 'bg-emerald-900/50 border border-emerald-600/50'
                        : 'bg-red-900/50 border border-red-600/50'
                    }`}>
                      {history[history.length - 1]?.isCorrect
                        ? <><CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" /><p className="text-emerald-300 text-sm font-bold">Doğru! +10 puan kazandın.</p></>
                        : <><XCircle className="w-5 h-5 text-red-400 flex-shrink-0" /><p className="text-red-300 text-sm font-bold">Yanlış cevap. +0 puan.</p></>
                      }
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg border-b-4 border-purple-800"
                    >
                      {stepIndex < STEPS.length - 1 ? 'Sonraki Adım ➔' : 'Sonuçları Gör 🏆'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
        </div>{/* end center */}

        {/* ── Right Panel: Strateji Merkezi ── */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${stepIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-amber-800/40">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Strateji Merkezi</div>
                <div className="text-amber-600 text-xs">{panel.strategyTitle}</div>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3.5">
                {panel.strategyTips.map((tip, i) => (
                  <div key={i}>
                    <div className="text-sm font-bold text-amber-300 mb-1.5">{tip.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>{/* end 3-col flex */}
    </div>
  );
}
