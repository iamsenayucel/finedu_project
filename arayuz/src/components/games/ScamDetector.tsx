import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correct: number;
  ok: string;
  ng: string;
  pts: number;
}

interface Scenario {
  id: string;
  title: string;
  fraudType: string;
  fraudIcon: string;
  image: string;
  description: string;
  questions: Question[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'quickprofit',
    title: 'QuickProfit AI',
    fraudType: 'Sahte Yatırım / Ponzi Düzeni',
    fraudIcon: '💸',
    image: '/games/ScamDetector/1.jpeg',
    description: 'Telegram ve sosyal medyada bir yapay zeka destekli yatırım platformu reklamı çıkıyor. Her ay %300–500 arası garantili kazanç vaat ediyor. "Arkadaşını getir, daha çok kazan" diyor.',
    questions: [
      {
        text: 'Bu ilanda sizi en çok şüphelendirmesi gereken unsur nedir?',
        options: ['Her ay %300–500 garantili kazanç vaadi', 'Yapay zeka teknolojisi kullanıyor olması', 'Telegram üzerinden erişilebilmesi'],
        correct: 0,
        ok: 'Doğru! Garantili ve aşırı yüksek getiri vaadi, yatırım dolandırıcılığının en güçlü işaretidir.',
        ng: 'Gerçek bir yatırım aracı hiçbir zaman garantili yüksek getiri vaat edemez. Bu tür vaatler dolandırıcılığın en belirgin işaretidir.',
        pts: 7,
      },
      {
        text: '"Arkadaşını getir, daha çok kazan" sistemi neyin göstergesi olabilir?',
        options: ['Müşteri memnuniyeti programı', 'Yasal bir pazar yeri ortaklığı', 'Çok katmanlı Ponzi / piramit düzeni'],
        correct: 2,
        ok: 'Doğru! Bu yapı, yeni üyelerden toplanan parayla eskilere ödeme yapılan Ponzi düzeninin klasik özelliğidir.',
        ng: 'Bu "ağ" yapısı, Ponzi/piramit düzenlerinin tipik özelliğidir. Yeni para girişi durduğunda sistem çöker.',
        pts: 7,
      },
      {
        text: 'Bu platforma para yatırmadan önce mutlaka ne yapmalısınız?',
        options: ['En az bir arkadaşa danışmak', 'Platformun BDDK/SPK lisansını sorgulamak', 'Önce küçük bir miktar deneme amaçlı yatırmak'],
        correct: 1,
        ok: 'Doğru! Türkiye\'de yatırım hizmeti sunmak için BDDK/SPK lisansı şarttır.',
        ng: 'BDDK veya SPK\'dan lisanssız hiçbir platforma para yatırılmamalıdır. Lisans sorgulama her zaman ilk adım olmalıdır.',
        pts: 6,
      },
    ],
  },
  {
    id: 'fake_ecommerce',
    title: 'Sahte E-Ticaret Sitesi',
    fraudType: 'Online Alışveriş Dolandırıcılığı',
    fraudIcon: '🛒',
    image: '/games/ScamDetector/2.jpeg',
    description: 'İnternette %90 indirimli Apple Watch satan bir site gördünüz. Site tasarımı gerçek gibi görünüyor. "Stok tükenmeden sipariş ver" yazıyor.',
    questions: [
      {
        text: 'Bu sitedeki en belirgin şüphe işareti nedir?',
        options: ['Apple Watch\'ın yalnızca bir renk seçeneği sunması', '%90 gibi gerçek dışı bir indirim oranı', 'Sitenin mobil uyumlu olması'],
        correct: 1,
        ok: 'Doğru! %90 indirim ürünü neredeyse bedavaya satmak demektir; hiçbir yetkili satıcı böyle bir indirim yapamaz.',
        ng: '%90 indirim, ürünü neredeyse bedavaya satmak demektir. Hiçbir yetkili satıcı böyle bir indirim yapamaz.',
        pts: 7,
      },
      {
        text: 'Ödeme yapmadan önce siteyi doğrulamak için ne yapmalısınız?',
        options: ['Ürün fotoğraflarını Google\'da araştırmak', 'Sitenin resmi iletişim bilgilerini ve kullanıcı yorumlarını kontrol etmek', 'Sosyal medyada kaç takipçisi olduğuna bakmak'],
        correct: 1,
        ok: 'Doğru! Resmi iletişim bilgileri ve güvenilir kaynaklardaki yorumlar, sitenin gerçek olup olmadığını anlamanın en iyi yoludur.',
        ng: 'https tek başına güvenli olduğu anlamına gelmez. Resmi şirket bilgileri, adres, vergi no ve bağımsız kullanıcı yorumları da kontrol edilmelidir.',
        pts: 7,
      },
      {
        text: 'Sahte e-ticaret sitelerinden korunmanın en güvenli yolu nedir?',
        options: ['Alışverişi yalnızca bilinen ve köklü platformlardan yapmak', 'Yalnızca kapıda ödeme seçeneği olan sitelerden alışveriş yapmak', 'Ödemeyi her zaman kripto para ile yapmak'],
        correct: 0,
        ok: 'Doğru! Tanınmış ve resmi e-ticaret platformlarını tercih etmek en güvenli seçenektir.',
        ng: 'Kapıda ödeme de bazen kötüye kullanılabilir. En güvenli yol köklü ve tanınan platformları tercih etmektir.',
        pts: 6,
      },
    ],
  },
  {
    id: 'ptt_phishing',
    title: 'PTT Sahte SMS',
    fraudType: 'SMS Phishing (Smishing)',
    fraudIcon: '📱',
    image: '/games/ScamDetector/3.jpeg',
    description: 'Telefonunuza "Paketiniz bekliyor, teslimat için 5 TL ücret ödemek üzere linke tıklayın" yazan bir SMS geliyor. Gönderen ismi "PTT" görünüyor.',
    questions: [
      {
        text: 'Bu mesajın sahte olduğunu gösteren en güçlü işaret nedir?',
        options: ['SMS ile gönderilmiş olması', 'PTT\'nin kargo takip sistemi bulunması', 'Paket teslimi için link üzerinden ücret talep edilmesi'],
        correct: 2,
        ok: 'Doğru! PTT dahil hiçbir resmi kurum, SMS içindeki bir link üzerinden ücret talep etmez.',
        ng: 'Gerçek kargo şirketleri mesaj içindeki bir link üzerinden ödeme talep etmez. "Ücret ödeme linki" phishing\'in tipik göstergesidir.',
        pts: 7,
      },
      {
        text: 'Bu SMS\'teki linke tıklarsanız ne olabilir?',
        options: ['Gerçekten paketiniz teslim edilebilir', 'Kişisel ve banka bilgileriniz çalınabilir', 'Yalnızca reklam içerikleri görebilirsiniz'],
        correct: 1,
        ok: 'Doğru! Bu tür linkler sizi sahte bir sayfaya yönlendirir ve bilgilerinizi çalmak için tasarlanmıştır.',
        ng: 'SMS phishing saldırılarının amacı kişisel bilgileri, kredi kartı numaralarını veya banka şifrelerini ele geçirmektir.',
        pts: 7,
      },
      {
        text: 'Böyle bir mesaj aldığınızda doğru yaklaşım nedir?',
        options: ['Linke tıklayıp ücreti ödeyerek paketi beklemek', 'Mesajı silerek firmayı sosyal medyadan şikayet etmek', 'Linke tıklamadan resmi PTT sitesini veya müşteri hizmetlerini aramak'],
        correct: 2,
        ok: 'Doğru! Her zaman resmi kanalları kullanın; SMS veya e-posta içindeki linklere tıklamayın.',
        ng: 'Linke asla tıklanmamalı. Resmi PTT web sitesi (ptt.gov.tr) veya müşteri hizmetleri üzerinden durum doğrulanmalıdır.',
        pts: 6,
      },
    ],
  },
  {
    id: 'fake_rental',
    title: 'Sahte Kiralık Ev İlanı',
    fraudType: 'Emlak Dolandırıcılığı',
    fraudIcon: '🏠',
    image: '/games/ScamDetector/4.jpeg',
    description: 'İnternette inanılmaz düşük fiyata geniş bir kiralık daire ilanı var. İlan sahibi "Şu an yurt dışındayım, güven için depozito gönderin, anahtarı kargolayayım" diyor.',
    questions: [
      {
        text: 'Bu ilanda sizi şüphelendirmesi gereken en önemli unsur nedir?',
        options: ['Evin fotoğraflarının profesyonel görünmesi', 'İlan sahibinin yurt dışında olup anahtarı kargolama teklifi', 'İlanın yabancı bir platformda yayınlanmış olması'],
        correct: 1,
        ok: 'Doğru! "Yurt dışındayım, anahtarı kargolarım" ifadesi, emlak dolandırıcılığının en klasik tuzaklarından biridir.',
        ng: '"Yurt dışındayım, anahtarı kargolarım" ifadesi, emlak dolandırıcılığının en klasik senaryolarından biridir. Evi hiç görmeden para göndermeyin.',
        pts: 7,
      },
      {
        text: 'Kiralık ev ararken dolandırıcılıktan korunmak için ne yapmalısınız?',
        options: ['Sadece piyasa fiyatının altındaki ilanları tercih etmek', 'Evi yerinde görmeden asla para veya depozito göndermemek', 'İlan sahibinin kimliğini yalnızca telefon görüşmesiyle doğrulamak'],
        correct: 1,
        ok: 'Doğru! Evi bizzat görmeden ve kira sözleşmesi imzalamadan hiçbir ödeme yapılmamalıdır.',
        ng: 'Telefon görüşmesi doğrulama için yeterli değildir. Evi bizzat görün veya güvenilir biriyle yerinde inceleyin.',
        pts: 7,
      },
      {
        text: 'Piyasa değerinin çok altında bir kira fiyatı gördüğünüzde ne düşünmelisiniz?',
        options: ['Ev sahibi çok iyi kalpli biri olmalı', 'İlanlarda her türlü fiyat bulunabilir, normaldir', 'Bu fiyat, dolandırıcılık tuzağı olabilir'],
        correct: 2,
        ok: 'Doğru! Gerçek dışı derecede düşük fiyatlar dolandırıcılığın en yaygın çekicisi olarak kullanılır.',
        ng: 'Piyasa ortalamasının çok altındaki fiyatlar neredeyse her zaman bir tuzak ya da hata olduğunu gösterir. Şüpheyle yaklaşın.',
        pts: 6,
      },
    ],
  },
  {
    id: 'fake_scholarship',
    title: 'Sahte Burs İlanı',
    fraudType: 'Burs / Hibe Dolandırıcılığı',
    fraudIcon: '🎓',
    image: '/games/ScamDetector/5.jpeg',
    description: 'Sosyal medyada "Gençlere 10.000 TL burs! Başvurmak için 100 TL başvuru ücreti ve banka hesap bilgilerinizi gönderin" şeklinde bir paylaşım görüyorsunuz.',
    questions: [
      {
        text: 'Bu burs ilanındaki en büyük kırmızı bayrak nedir?',
        options: ['Burs miktarının 10.000 TL olması', 'İlanın sosyal medyada yayılmış olması', 'Başvuru için ücret ve banka bilgisi talep edilmesi'],
        correct: 2,
        ok: 'Doğru! Gerçek burs kurumları hiçbir zaman başvuru ücreti istemez ve banka bilgilerini sosyal medya üzerinden talep etmez.',
        ng: 'Gerçek burs kurumları hiçbir zaman başvuru ücreti istemez. Banka bilgisi talep eden her ilan şüphelidir.',
        pts: 7,
      },
      {
        text: 'Meşru bir burs programı hangi kurumlar aracılığıyla duyurulur?',
        options: ['Yalnızca sosyal medya influencer\'ları aracılığıyla', 'Sadece WhatsApp grupları üzerinden', 'Okul, üniversite veya resmi devlet kurumları aracılığıyla'],
        correct: 2,
        ok: 'Doğru! Gerçek burs programları resmi okul/üniversite web siteleri veya kyk.gov.tr gibi platformlarda duyurulur.',
        ng: 'Gerçek burs programları resmi okul/üniversite web siteleri, kyk.gov.tr veya türkiye.gov.tr gibi platformlarda duyurulur.',
        pts: 7,
      },
      {
        text: '"Bursunuzu almak için banka bilgilerinizi paylaşın" diyen bir kurumla karşılaşırsanız ne yapmalısınız?',
        options: ['Bilgileri hemen göndermek, yoksa fırsatı kaçırırsın', 'Kurumu resmi kaynaklardan araştırıp şüpheliyse yetkililere bildirmek', 'Başvuru ücretini ödeyip beklemek'],
        correct: 1,
        ok: 'Doğru! Şüpheli dolandırıcılık girişimlerini Emniyet veya BTK\'ya bildirmek hem sizi hem başkalarını korur.',
        ng: 'Banka bilgilerinizi paylaşmadan önce kurumu bağımsız olarak doğrulayın. Şüpheli ilanları Emniyet veya BTK\'ya bildirebilirsiniz.',
        pts: 6,
      },
    ],
  },
];

type Stage = 'intro' | 'preview' | 'question' | 'final';
interface Props { onComplete?: (score: number) => void; }

const Bar = ({ cls }: { cls: string }) => (
  <div className={`h-1.5 bg-gradient-to-r ${cls}`} />
);

export default function ScamDetector({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);

  const sc = SCENARIOS[scenarioIdx];
  const q = sc.questions[questionIdx];

  const handleAnswer = useCallback((optIdx: number) => {
    if (locked) return;
    setLocked(true);
    setSelectedOpt(optIdx);
    const isCorrect = optIdx === q.correct;
    const pts = isCorrect ? q.pts : 0;
    const newScore = score + pts;
    setFeedback({ correct: isCorrect, text: isCorrect ? q.ok : q.ng });
    if (isCorrect) {
      setScore(newScore);
      setCorrectCount(c => c + 1);
    }
    setTimeout(() => {
      setFeedback(null);
      setSelectedOpt(null);
      setLocked(false);
      if (questionIdx + 1 >= sc.questions.length) {
        if (scenarioIdx + 1 >= SCENARIOS.length) {
          onComplete?.(newScore);
          setStage('final');
        } else {
          setScenarioIdx(i => i + 1);
          setQuestionIdx(0);
          setStage('preview');
        }
      } else {
        setQuestionIdx(i => i + 1);
      }
    }, 2200);
  }, [locked, q, questionIdx, sc, scenarioIdx, score, onComplete]);

  const handleReplay = useCallback(() => {
    setStage('intro');
    setScenarioIdx(0);
    setQuestionIdx(0);
    setScore(0);
    setCorrectCount(0);
    setLocked(false);
    setSelectedOpt(null);
    setFeedback(null);
  }, []);

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (stage === 'intro') return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
        <Bar cls="from-red-600 via-orange-500 to-amber-500" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-red-500/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative px-8 pt-10 pb-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <ShieldAlert className="w-3.5 h-3.5" /> Dolandırıcı Tespiti
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Dolandırıcı Avı:<br />
            <span className="text-orange-400">Gerçek mi, Tuzak mı?</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed max-w-xl mx-auto mb-2">
            5 farklı gerçek dolandırıcılık senaryosunu inceleyecek ve her birindeki tehlike işaretlerini tespit edeceksin.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-8">
            Her senaryo 3 sorudan oluşuyor. Toplam 100 puan üzerinden değerlendirileceksin.
          </p>
          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            {SCENARIOS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center bg-slate-700/60 border border-slate-600 rounded-2xl px-4 py-3">
                <span className="text-xl mb-1">{s.fraudIcon}</span>
                <span className="text-white text-xs font-bold text-center leading-tight max-w-[80px]">{s.title}</span>
                <span className="text-red-400 text-xs font-bold mt-0.5">{i + 1}. Senaryo</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-8 pb-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setStage('preview')}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 px-10 rounded-2xl shadow-lg border-b-4 border-orange-800"
          >
            Oyuna Başla <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
        <Bar cls="from-red-600 via-orange-500 to-amber-500" />
      </div>
    </div>
  );

  // ── PREVIEW ───────────────────────────────────────────────────────────────
  if (stage === 'preview') return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <Bar cls="from-red-600 via-orange-500 to-amber-500" />
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="bg-red-900/50 border border-red-700 text-red-300 text-xs font-bold px-3 py-1 rounded-full">
                {sc.fraudIcon} {sc.fraudType}
              </span>
            </div>
            <span className="text-slate-400 text-sm font-bold">{scenarioIdx + 1} / {SCENARIOS.length}</span>
          </div>

          <div className="flex gap-1.5 mb-6">
            {SCENARIOS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < scenarioIdx ? 'bg-red-500' : i === scenarioIdx ? 'bg-orange-400' : 'bg-slate-700'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={sc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-white font-black text-2xl mb-4">{sc.title}</h2>

              <div className="rounded-2xl overflow-hidden border border-slate-700 mb-5 bg-slate-800">
                <img
                  src={sc.image}
                  alt={sc.title}
                  className="w-full object-contain max-h-72"
                />
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Senaryo Açıklaması</p>
                <p className="text-slate-200 text-sm leading-relaxed">{sc.description}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStage('question')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-orange-800"
              >
                Soruları Yanıtla <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
        <Bar cls="from-red-600 via-orange-500 to-amber-500" />
      </div>
    </div>
  );

  // ── QUESTION ──────────────────────────────────────────────────────────────
  if (stage === 'question') return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <Bar cls="from-red-600 via-orange-500 to-amber-500" />
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <span className="bg-orange-900/50 border border-orange-700 text-orange-300 text-xs font-bold px-3 py-1 rounded-full">
              {sc.fraudIcon} {sc.title}
            </span>
            <span className="text-slate-400 text-sm font-bold">Soru {questionIdx + 1} / {sc.questions.length}</span>
          </div>

          <div className="flex gap-1.5 mb-5">
            {sc.questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < questionIdx ? 'bg-orange-500' : i === questionIdx ? 'bg-amber-400' : 'bg-slate-700'}`} />
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-700/60 mb-5 bg-slate-800/60">
            <img src={sc.image} alt={sc.title} className="w-full object-contain max-h-48 opacity-90" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`${scenarioIdx}-${questionIdx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Soru</p>
                <p className="text-white font-bold text-base leading-relaxed">{q.text}</p>
              </div>

              <div className="space-y-2.5 mb-4">
                {q.options.map((opt, i) => {
                  const isCorrectOpt = i === q.correct;
                  const isSelected = selectedOpt === i;
                  const showFb = feedback !== null;
                  return (
                    <motion.button
                      key={i}
                      whileHover={locked ? {} : { scale: 1.01, x: 4 }}
                      whileTap={locked ? {} : { scale: 0.98 }}
                      animate={isSelected && feedback && !feedback.correct ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleAnswer(i)}
                      disabled={locked}
                      className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 border-2 text-left text-sm font-bold transition-all
                        ${showFb
                          ? isCorrectOpt
                            ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                            : isSelected
                              ? 'border-red-500 bg-red-900/40 text-red-300'
                              : 'border-slate-700 bg-slate-800/40 text-slate-500 opacity-40'
                          : 'border-slate-600 bg-slate-800 hover:border-orange-500 hover:bg-slate-700 text-white'}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 border
                        ${showFb && isCorrectOpt ? 'bg-emerald-600 border-emerald-500 text-white'
                          : showFb && isSelected ? 'bg-red-700 border-red-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {showFb && isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {showFb && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {feedback && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 rounded-xl px-5 py-3.5 border ${feedback.correct ? 'bg-emerald-900/40 border-emerald-700/50' : 'bg-red-900/30 border-red-700/50'}`}>
                  {feedback.correct
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    : <XCircle    className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                  <p className={`text-sm ${feedback.correct ? 'text-emerald-300' : 'text-red-300'}`}>{feedback.text}</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <Bar cls="from-red-600 via-orange-500 to-amber-500" />
      </div>
    </div>
  );

  // ── FINAL ─────────────────────────────────────────────────────────────────
  if (stage === 'final') {
    const total = 15;
    const grade =
      score >= 90 ? { label: 'Mükemmel Dedektif!', color: 'text-emerald-400', icon: '🕵️', msg: 'Tüm dolandırıcılık tuzaklarını başarıyla tespit ettin!' } :
      score >= 70 ? { label: 'İyi İş!',             color: 'text-blue-400',    icon: '🛡️', msg: 'Dolandırıcılık işaretlerini büyük ölçüde fark edebiliyorsun.' } :
      score >= 50 ? { label: 'Fena Değil',           color: 'text-amber-400',   icon: '📘', msg: 'Biraz daha dikkat edersen kendini çok iyi koruyabilirsin.' } :
                   { label: 'Tekrar Dene',           color: 'text-red-400',     icon: '💪', msg: 'Dolandırıcılık yöntemlerini tekrar gözden geçirmeni öneririz.' };
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-slate-700 shadow-2xl overflow-hidden">
          <Bar cls="from-red-600 via-orange-500 to-amber-500" />
          <div className="p-6 md:p-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700 text-center mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className="text-7xl mb-4">{grade.icon}</motion.div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Oyun Tamamlandı</p>
              <h2 className={`text-4xl font-black mb-2 ${grade.color}`}>{grade.label}</h2>
              <p className="text-slate-300 text-sm mb-6">{grade.msg}</p>
              <div className="inline-block bg-slate-900 border border-slate-700 rounded-2xl px-8 py-4">
                <p className="text-5xl font-black text-white">{score} <span className="text-slate-500 text-lg font-normal">/ 100 puan</span></p>
              </div>
              <p className="text-slate-400 text-sm mt-4">{correctCount} / {total} soruyu doğru yanıtladın</p>
            </motion.div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 mb-6">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Tespit Ettiğin Dolandırıcılık Türleri</p>
              <div className="space-y-2.5">
                {SCENARIOS.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-700">
                    <span className="text-xl shrink-0">{s.fraudIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{s.title}</p>
                      <p className="text-slate-400 text-xs truncate">{s.fraudType}</p>
                    </div>
                    <span className="text-slate-500 text-xs font-bold shrink-0">{i + 1}/5</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-4 mb-6">
              <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2">Hatırlatma</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dolandırıcılık vakalarını <span className="text-white font-bold">ALO 157</span> (Tüketici Hattı) veya <span className="text-white font-bold">www.btk.gov.tr</span> üzerinden yetkililere bildirebilirsin.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleReplay}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-orange-800"
            >
              🔄 Tekrar Oyna
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
