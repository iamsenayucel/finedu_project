import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';

type Stage = 'intro' | 'matching' | 'scenarios' | 'risk' | 'risk_summary' | 'final';
type RiskId = 'dusuk' | 'dusuk_orta' | 'orta' | 'orta_yuksek' | 'yuksek';
interface Props { onComplete?: (score: number) => void; }

const CONCEPTS = [
  { id: 'hisse',  name: 'Hisse Senedi',   icon: '📊', desc: 'Bir şirketin küçük bir kısmına ortak olmayı sağlayan yatırım aracıdır. Şirket büyürse yatırımcı da kazanç elde edebilir.' },
  { id: 'vadeli', name: 'Vadeli Mevduat', icon: '🏦', desc: 'Parayı bankada belirli süre tutarak faiz geliri kazanılan düşük riskli yatırım yöntemidir.' },
  { id: 'altin',  name: 'Altın',          icon: '🥇', desc: 'Birikimi korumak için sık tercih edilen yatırım araçlarından biridir. Değeri zamanla değişebilir.' },
  { id: 'tahvil', name: 'Devlet Tahvili', icon: '📜', desc: 'Devlete belirli süre para verilip vade sonunda faiz getirisi alınan yatırım aracıdır.' },
  { id: 'fon',    name: 'Yatırım Fonu',   icon: '📈', desc: 'Paranın uzmanlar tarafından farklı yatırım araçlarında değerlendirilmesini sağlayan sistemdir.' },
  { id: 'bes',    name: 'BES',            icon: '🏛️', desc: 'Uzun vadeli birikim yapmayı sağlayan emeklilik sistemidir. Devlet katkısı desteği bulunur.' },
  { id: 'doviz',  name: 'Döviz',          icon: '💱', desc: 'Dolar ve euro gibi yabancı para birimlerine yatırım yapma yöntemidir. Kur değişimine göre kazanç veya zarar oluşabilir.' },
];

const SCENARIOS = [
  { id: 'ece',         person: 'Ece',           avatar: '👩‍🎓',
    story: 'Ece, gelecekte maddi güvence oluşturmak ve emeklilik döneminde ek gelir elde etmek istiyor. Ayrıca yatırdığı paraya devletin de katkı sağladığını öğrenince ilgisi artıyor.',
    question: 'Bu durumda Ece için en uygun yatırım aracı hangisidir?',
    options: ['Vadeli Mevduat', 'BES', 'Altın'], correct: 1,
    ok: 'Doğru! BES uzun vadeli birikim yapmayı sağlar ve devlet katkısı içerir.',
    ng: 'Bu seçenek daha çok kısa/orta vadeli ya da farklı amaçlı bir yatırım aracıdır. Uzun vadeli emeklilik sistemi hedeflenmelidir.' },
  { id: 'can',         person: 'Can',           avatar: '👨‍💼',
    story: 'Can, parasını riske atmadan değerlendirmek istiyor. Bankaya belirli bir süre dokunmamak şartıyla yatırarak hem parasını korumak hem de üzerine faiz geliri kazanmak istiyor.',
    question: 'Can hangi yatırım aracını tercih etmelidir?',
    options: ['Yatırım Fonu', 'Vadeli Mevduat', 'Hisse Senedi'], correct: 1,
    ok: 'Doğru! Vadeli mevduatta para bankada belirli süre kalır ve faiz kazandırır.',
    ng: 'Bu seçenekler daha fazla risk içerebilir veya farklı yatırım mantığına dayanır.' },
  { id: 'selin',       person: 'Selin',         avatar: '👩‍💻',
    story: 'Selin, yatırım yaparken tek bir ürüne bağlı kalmak istemiyor. Riskini azaltmak için parasının farklı alanlara dağıtıldığı ve uzmanlar tarafından yönetilen bir sistem tercih etmek istiyor.',
    question: 'Selin için en uygun yatırım aracı hangisidir?',
    options: ['Yatırım Fonu', 'Döviz', 'Altın'], correct: 0,
    ok: 'Doğru! Yatırım fonu, paranın farklı araçlara dağıtılarak yönetilmesini sağlar.',
    ng: 'Bu seçenekler tek bir varlığa yatırım yapma veya para birimi değişimiyle ilgilidir.' },
  { id: 'mert',        person: 'Mert',          avatar: '👨‍🚀',
    story: 'Mert, gelecekte değer kazanacağını düşündüğü bir teknoloji şirketine ortak olmak istiyor. Şirket büyüdükçe kazanç elde etmeyi hedefliyor.',
    question: 'Mert hangi yatırım aracını seçmelidir?',
    options: ['Devlet Tahvili', 'Hisse Senedi', 'Vadeli Mevduat'], correct: 1,
    ok: 'Doğru! Hisse senedi şirket ortaklığı anlamına gelir ve değer artışıyla kazanç sağlar.',
    ng: 'Bu seçenekler sabit getirili veya borç verme mantığına dayalıdır.' },
  { id: 'belirsizlik', person: 'Genel Senaryo', avatar: '🌍',
    story: 'Ekonomide belirsizliklerin arttığı dönemlerde insanlar paralarının değer kaybetmesini istemez. Bu yüzden genellikle değerini koruma özelliğiyle bilinen bir yatırım aracına yönelirler.',
    question: 'Bu durumda en uygun yatırım aracı hangisidir?',
    options: ['Altın', 'Yatırım Fonu', 'BES'], correct: 0,
    ok: 'Doğru! Altın, özellikle belirsizlik dönemlerinde değer koruma aracı olarak tercih edilir.',
    ng: 'Bu seçenekler daha çok uzun vadeli birikim veya çeşitlendirilmiş yatırım sistemleridir.' },
];

const RISK_LEVELS: { id: RiskId; label: string; dot: string; cls: string }[] = [
  { id: 'dusuk',       label: 'Düşük',       dot: '🟢', cls: 'border-emerald-600 bg-emerald-900/20 hover:bg-emerald-800/40 text-emerald-300' },
  { id: 'dusuk_orta',  label: 'Düşük-Orta',  dot: '🟡', cls: 'border-teal-500    bg-teal-900/20    hover:bg-teal-800/40    text-teal-300'    },
  { id: 'orta',        label: 'Orta',         dot: '🟠', cls: 'border-amber-600   bg-amber-900/20   hover:bg-amber-800/40   text-amber-300'   },
  { id: 'orta_yuksek', label: 'Orta-Yüksek', dot: '🔶', cls: 'border-orange-600  bg-orange-900/20  hover:bg-orange-800/40  text-orange-300'  },
  { id: 'yuksek',      label: 'Yüksek',       dot: '🔴', cls: 'border-red-600     bg-red-900/20     hover:bg-red-800/40     text-red-300'     },
];

const RISK_ITEMS: { id: string; name: string; icon: string; desc: string; risk: RiskId }[] = [
  { id: 'vadeli', name: 'Vadeli Mevduat', icon: '🏦', desc: 'Para bankada belirli süre tutulur ve faiz getirisi genellikle sabittir.',             risk: 'dusuk'       },
  { id: 'tahvil', name: 'Devlet Tahvili', icon: '📜', desc: 'Devlete borç verilir, vade sonunda faiz alınır; devlet güvencesi vardır.',             risk: 'dusuk_orta'  },
  { id: 'altin',  name: 'Altın',          icon: '🥇', desc: 'Değerini koruyabilir ancak piyasa koşullarına göre yükselip düşebilir.',               risk: 'orta'        },
  { id: 'fon',    name: 'Yatırım Fonu',   icon: '📈', desc: 'Birçok yatırım aracına dağıtıldığı için risk tek bir alana bağlı değildir.',           risk: 'orta'        },
  { id: 'hisse',  name: 'Hisse Senedi',   icon: '📊', desc: 'Şirketin performansına bağlıdır; yüksek kazanç mümkün ama kayıp riski de büyüktür.',   risk: 'yuksek'      },
  { id: 'doviz',  name: 'Döviz',          icon: '💱', desc: 'Kur değişimlerine bağlı olarak hızlı değer kazanabilir veya kaybedebilir.',             risk: 'orta_yuksek' },
];

const RISK_GROUPS = [
  { dot: '🟢', label: 'Düşük Risk',  items: 'Vadeli Mevduat / Devlet Tahvili', text: 'Çünkü kazanç daha öngörülebilir ve devlet/banka güvencesi vardır.',        cls: 'border-emerald-500/40 bg-emerald-900/20' },
  { dot: '🟡', label: 'Orta Risk',   items: 'Altın / Yatırım Fonu',            text: 'Çünkü değer değişebilir ama tamamen kontrolsüz değildir, risk dengelenir.', cls: 'border-amber-500/40   bg-amber-900/20'   },
  { dot: '🔴', label: 'Yüksek Risk', items: 'Hisse Senedi / Döviz',            text: 'Çünkü piyasa koşullarına bağlı olarak hızlı yükselip düşebilir.',          cls: 'border-red-500/40     bg-red-900/20'     },
];

const INVESTMENT_PANELS = {
  tools: {
    dictionary: [
      { term: 'Birikim', def: 'Kazanılan paranın anında harcanmayıp, gelecekteki bir hedef veya güvence için kenara ayrılmış halidir.' },
      { term: 'Vade', def: "Paranın bankada veya devlette 'kilitli' kalması için baştan anlaşılan süredir. Süre dolmadan parayı çekersen faiz kazancını kaybedersin." },
      { term: 'Portföy Yöneticisi', def: 'Piyasaları ve grafikleri senin yerine okuyup, paranı en doğru araçlara dağıtarak yöneten lisanslı finans profesyonelidir.' },
      { term: 'Devlet Katkısı', def: 'Sen geleceğin için para biriktirdikçe, devletin de seni teşvik etmek amacıyla kendi kasasından senin hesabına eklediği karşılıksız paradır.' },
      { term: 'Kâr Payı', def: 'Ticaret yapan bir kurumun elde ettiği kazancı (veya zararı), oraya para yatıran kişilerle bölüşme durumudur.' },
    ],
    strategyTitle: 'Yatırım Araçları',
    strategyTips: [
      { title: 'Hisse Senedi', desc: "Borsadaki şirketlerin küçük bir parçasıdır. Şirkete 'ortak' olursun; şirket büyürse sen de kazanırsın." },
      { title: 'Vadeli Mevduat', desc: 'Paranı bir süreliğine bankaya emanet etmektir. Süre sonunda garantili ve düşük riskli faiz getirisi sağlar.' },
      { title: 'Devlet Tahvili', desc: "Devletin, belirli bir süre sonra faiziyle geri ödemek üzere kendi vatandaşından resmi olarak borç almasıdır." },
      { title: 'Yatırım Fonu', desc: 'İçinde farklı yatırım araçlarının bulunduğu ve paranı profesyonel uzmanların yönettiği finansal sepettir.' },
      { title: 'BES (Bireysel Emeklilik)', desc: 'Gelecekteki rahatlığın için kurulan, en büyük avantajı devlet katkısı olan uzun vadeli birikim sistemidir.' },
    ],
  },
  risk: {
    dictionary: [
      { term: 'Devlet/Banka Güvencesi', def: 'Paranın batma ihtimalinin neredeyse sıfır olmasıdır. Bir devletin borcunu ödeyememesi çok ekstrem bir durumdur, bu yüzden en güvenli yapılar bunlardır.' },
      { term: 'Sabit Getiri', def: 'Gelecekte ne kadar kazanacağını bugünden kuruşu kuruşuna bilmektir. Sürpriz yoktur; bu da stresi ve riski ortadan kaldırır.' },
      { term: 'Riski Dağıtmak', def: "Tüm yumurtaları aynı sepete koymamaktır. Bir sistemin içinde ne kadar farklı araç varsa, çöküş riski o kadar azalır." },
      { term: 'Piyasa Koşulları (Volatilite)', def: 'Fiyatların dünyadaki haberlere, savaşlara veya krizlere göre saniyeler içinde aşağı veya yukarı sert hareketler yapabilmesidir.' },
      { term: 'Performans Bağımlılığı', def: 'Kazancının, başkalarının (örneğin bir şirketin CEO\'sunun) alacağı kararlara bağlı olması durumudur. Kontrol sende değilse risk yüksektir.' },
    ],
    strategyTitle: 'Risk Dağılım Haritası',
    strategyTips: [
      { title: '🟢 Düşük Risk', desc: 'Sürpriz sevmeyenler içindir. Getiri baştan bellidir, kayıp riski yoktur. → Vadeli Mevduat (banka güvencesi), Devlet Tahvili (devlet güvencesi).' },
      { title: '🟡 Orta Risk', desc: 'Fiyatlar dalgalanır ama tamamen kontrolden çıkmaz. → Altın (tarih boyunca sıfırlanmamıştır), Yatırım Fonu (uzmanlar yönetir, risk törpülenir).' },
      { title: '🔴 Yüksek Risk', desc: 'Çok kazandırabilir ama bir gecede büyük paralar da kaybettirebilir. → Hisse Senedi (performansa bağlı), Döviz (tahmin edilmesi en zor alan).' },
    ],
  },
};

const PTS_MATCH    = 5;
const PTS_SCENARIO = 7;
const PTS_RISK     = 5;

const Bar = ({ cls }: { cls: string }) => <div className={`h-1.5 bg-gradient-to-r ${cls}`} />;

export default function InvestmentMethods({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [leavingIntro, setLeavingIntro] = useState(false);
  const [studyPage, setStudyPage] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  const [matchScore,    setMatchScore]    = useState(0);
  const [scenarioScore, setScenarioScore] = useState(0);
  const [riskScore,     setRiskScore]     = useState(0);

  // Level 1
  const shuffled = useMemo(() => [...CONCEPTS].sort(() => Math.random() - 0.5), [replayKey]);
  const [matchIdx,    setMatchIdx]    = useState(0);
  const [matched,     setMatched]     = useState<Set<string>>(new Set());
  const [clickedId,   setClickedId]   = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<'correct' | 'wrong' | null>(null);
  const [matchLocked, setMatchLocked] = useState(false);

  // Level 2
  const [scenarioIdx,    setScenarioIdx]    = useState(0);
  const [scenarioResult, setScenarioResult] = useState<{ correct: boolean; text: string } | null>(null);
  const [scenarioLocked, setScenarioLocked] = useState(false);

  // Level 3
  const [riskIdx,    setRiskIdx]    = useState(0);
  const [riskResult, setRiskResult] = useState<{ correct: boolean } | null>(null);
  const [riskLocked, setRiskLocked] = useState(false);
  const [clickedRisk, setClickedRisk] = useState<RiskId | null>(null);

  const totalScore = matchScore + scenarioScore + riskScore;

  const handleMatchClick = useCallback((conceptId: string) => {
    if (matchLocked || matched.has(conceptId)) return;
    const current = shuffled[matchIdx];
    const ok = conceptId === current.id;
    setClickedId(conceptId);
    setMatchResult(ok ? 'correct' : 'wrong');
    setMatchLocked(true);
    if (ok) {
      setMatchScore(s => s + PTS_MATCH);
      setMatched(prev => new Set([...prev, conceptId]));
    }
    setTimeout(() => {
      setClickedId(null);
      setMatchResult(null);
      setMatchLocked(false);
      if (matchIdx + 1 >= shuffled.length) setStage('scenarios');
      else setMatchIdx(i => i + 1);
    }, ok ? 1500 : 2200);
  }, [matchLocked, matched, shuffled, matchIdx]);

  const handleScenarioClick = useCallback((optIdx: number) => {
    if (scenarioLocked) return;
    const s = SCENARIOS[scenarioIdx];
    const ok = optIdx === s.correct;
    setScenarioResult({ correct: ok, text: ok ? s.ok : s.ng });
    setScenarioLocked(true);
    if (ok) setScenarioScore(sc => sc + PTS_SCENARIO);
    setTimeout(() => {
      setScenarioResult(null);
      setScenarioLocked(false);
      if (scenarioIdx + 1 >= SCENARIOS.length) setStage('risk');
      else setScenarioIdx(i => i + 1);
    }, 2200);
  }, [scenarioLocked, scenarioIdx]);

  const handleRiskClick = useCallback((riskId: RiskId) => {
    if (riskLocked) return;
    const item = RISK_ITEMS[riskIdx];
    const ok = riskId === item.risk;
    setClickedRisk(riskId);
    setRiskResult({ correct: ok });
    setRiskLocked(true);
    if (ok) setRiskScore(rs => rs + PTS_RISK);
    setTimeout(() => {
      setClickedRisk(null);
      setRiskResult(null);
      setRiskLocked(false);
      if (riskIdx + 1 >= RISK_ITEMS.length) setStage('risk_summary');
      else setRiskIdx(i => i + 1);
    }, 1800);
  }, [riskLocked, riskIdx]);

  const handleReplay = useCallback(() => {
    setReplayKey(k => k + 1);
    setStage('intro');
    setMatchScore(0); setScenarioScore(0); setRiskScore(0);
    setMatchIdx(0); setMatched(new Set());
    setClickedId(null); setMatchResult(null); setMatchLocked(false);
    setScenarioIdx(0); setScenarioResult(null); setScenarioLocked(false);
    setRiskIdx(0); setRiskResult(null); setRiskLocked(false); setClickedRisk(null);
  }, []);

  // ── INTRO: büyük sözlük + strateji inceleme ekranı (sayfalı) ────────────────
  if (stage === 'intro') {
    const studyPages = [
      { ...INVESTMENT_PANELS.tools, dictTitle: '📖 Ekonomi Sözlüğü', stratIcon: '🎯' },
      { ...INVESTMENT_PANELS.risk, dictTitle: '📖 Ekonomi Sözlüğü', stratIcon: '⚖️' },
    ];
    const introPanel = studyPages[studyPage];
    const isLastPage = studyPage === studyPages.length - 1;
    const startGame = () => {
      setLeavingIntro(true);
      setTimeout(() => setStage('matching'), 380);
    };
    const nextPage = () => setStudyPage(p => Math.min(p + 1, studyPages.length - 1));
    const prevPage = () => setStudyPage(p => Math.max(p - 1, 0));
    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Kompakt başlık */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
            💹 Yasal Yatırım Yöntemleri
          </div>
          <p className="text-slate-400 text-sm">
            Oyuna geçmeden önce sözlüğü ve yatırım araçlarını incele · 3 seviye · 100 puan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Sol: Ekonomi Sözlüğü (büyük) */}
          <AnimatePresence mode="wait">
            {!leavingIntro && (
              <motion.div
                key={`dict-${studyPage}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
                style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
              >
                <div className="px-5 py-4 border-b border-cyan-800/40">
                  <div className="text-cyan-400 text-base font-black uppercase tracking-widest">{introPanel.dictTitle}</div>
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

          {/* Sağ: Yatırım Araçları / Risk Haritası (büyük) */}
          <AnimatePresence mode="wait">
            {!leavingIntro && (
              <motion.div
                key={`strat-${studyPage}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
                style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
              >
                <div className="px-5 py-4 border-b border-amber-800/40">
                  <div className="text-amber-400 text-base font-black uppercase tracking-widest">{introPanel.stratIcon} {introPanel.strategyTitle}</div>
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
          <>
            {/* Sayfalama */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={prevPage}
                disabled={studyPage === 0}
                className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm px-3 py-1.5 transition-colors"
              >
                ← Önceki
              </button>
              <div className="flex gap-1.5">
                {studyPages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStudyPage(i)}
                    className={`h-2 rounded-full transition-all ${i === studyPage ? 'bg-emerald-400 w-6' : 'bg-slate-700 w-2 hover:bg-slate-600'}`}
                  />
                ))}
              </div>
              <span className="text-slate-500 text-xs font-medium w-14">{studyPage + 1} / {studyPages.length}</span>
              <button
                onClick={nextPage}
                disabled={isLastPage}
                className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm px-3 py-1.5 transition-colors"
              >
                Sonraki →
              </button>
            </div>

            <div className="flex justify-center">
              {isLastPage ? (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={startGame}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 px-10 rounded-2xl shadow-lg border-b-4 border-teal-800"
                >
                  Oyuna Geç <ArrowRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={nextPage}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg border-b-4 border-slate-900"
                >
                  Sonraki Sayfa <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── MATCHING ──────────────────────────────────────────────────────────────
  if (stage === 'matching') {
    const current = shuffled[matchIdx];
    const panel = INVESTMENT_PANELS.tools;
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
                {panel.dictionary.map((item, i) => (
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
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
              <Bar cls="from-emerald-500 via-teal-500 to-blue-500" />
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <span className="bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                    Seviye 1 — Kavram Eşleştirme
                  </span>
                  <span className="text-slate-400 text-sm font-bold">{matchIdx + 1} / {shuffled.length}</span>
                </div>

                <div className="flex gap-1.5 mb-6">
                  {shuffled.map((c, i) => (
                    <div key={c.id} className={`h-1.5 flex-1 rounded-full transition-all ${matched.has(c.id) ? 'bg-emerald-500' : i === matchIdx ? 'bg-teal-400' : 'bg-slate-700'}`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={current.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Bu açıklama hangi yatırım aracına aittir?</p>
                    <p className="text-white text-base leading-relaxed font-medium">{current.desc}</p>
                    {matchResult === 'wrong' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-2.5">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-red-300 text-sm font-bold">
                          Doğru cevap: <span className="text-white">{current.icon} {current.name}</span>
                        </span>
                      </motion.div>
                    )}
                    {matchResult === 'correct' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300 text-sm font-bold">+{PTS_MATCH} puan kazandın!</span>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Yatırım araçları</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CONCEPTS.map(c => {
                    const isAlreadyMatched = matched.has(c.id);
                    const isClickedCorrect = clickedId === c.id && matchResult === 'correct';
                    const isClickedWrong   = clickedId === c.id && matchResult === 'wrong';
                    const isShowCorrect    = matchResult === 'wrong' && c.id === current.id;
                    const showAny          = matchResult !== null;
                    return (
                      <motion.button
                        key={c.id}
                        whileHover={isAlreadyMatched || matchLocked ? {} : { scale: 1.03 }}
                        whileTap={isAlreadyMatched || matchLocked ? {} : { scale: 0.97 }}
                        animate={isClickedWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                        transition={{ duration: 0.3 }}
                        onClick={() => handleMatchClick(c.id)}
                        disabled={isAlreadyMatched || matchLocked}
                        className={`flex items-center gap-2 rounded-xl px-3 py-3 border-2 text-sm font-bold transition-all
                          ${isAlreadyMatched  ? 'opacity-30 cursor-not-allowed border-emerald-800 bg-emerald-900/10 text-emerald-400' :
                            isClickedCorrect  ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300' :
                            isClickedWrong    ? 'border-red-500 bg-red-900/40 text-red-300' :
                            isShowCorrect     ? 'border-emerald-400 bg-emerald-900/30 text-emerald-300 ring-1 ring-emerald-400/40' :
                            showAny           ? 'opacity-40 cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500' :
                            'border-slate-600 bg-slate-800 hover:border-teal-500 hover:bg-slate-700 text-white'}`}
                      >
                        <span className="text-lg shrink-0">{c.icon}</span>
                        <span className="leading-tight">{c.name}</span>
                        {isAlreadyMatched && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
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
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Yatırım Araçları</div>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SCENARIOS ─────────────────────────────────────────────────────────────
  if (stage === 'scenarios') {
    const s = SCENARIOS[scenarioIdx];
    const panel = INVESTMENT_PANELS.tools;
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
                {panel.dictionary.map((item, i) => (
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
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
              <Bar cls="from-blue-500 via-indigo-500 to-purple-500" />
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <span className="bg-blue-900/50 border border-blue-700 text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                    Seviye 2 — Senaryolar
                  </span>
                  <span className="text-slate-400 text-sm font-bold">{scenarioIdx + 1} / {SCENARIOS.length}</span>
                </div>
                <div className="flex gap-1.5 mb-6">
                  {SCENARIOS.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < scenarioIdx ? 'bg-blue-500' : i === scenarioIdx ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-5">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">{s.avatar}</span>
                        <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Senaryo</p>
                          <p className="text-white font-black text-lg">{s.person}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">{s.story}</p>
                      <p className="text-white font-bold text-sm">💬 {s.question}</p>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {s.options.map((opt, i) => {
                        const isCorrectOpt = i === s.correct;
                        const showFb = scenarioResult !== null;
                        return (
                          <motion.button
                            key={i}
                            whileHover={scenarioLocked ? {} : { scale: 1.01, x: 4 }}
                            whileTap={scenarioLocked ? {} : { scale: 0.98 }}
                            onClick={() => handleScenarioClick(i)}
                            disabled={scenarioLocked}
                            className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 border-2 text-left text-sm font-bold transition-all
                              ${showFb
                                ? isCorrectOpt ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300' : 'border-slate-700 bg-slate-800/40 text-slate-500 opacity-50'
                                : 'border-slate-600 bg-slate-800 hover:border-blue-500 hover:bg-slate-700 text-white'}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 border
                              ${showFb && isCorrectOpt ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                            {showFb && isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {scenarioResult && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 rounded-xl px-5 py-3.5 border ${scenarioResult.correct ? 'bg-emerald-900/40 border-emerald-700/50' : 'bg-red-900/30 border-red-700/50'}`}>
                        {scenarioResult.correct
                          ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          : <XCircle    className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                        <p className={`text-sm ${scenarioResult.correct ? 'text-emerald-300' : 'text-red-300'}`}>{scenarioResult.text}</p>
                      </motion.div>
                    )}
                  </motion.div>
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
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Yatırım Araçları</div>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RISK ──────────────────────────────────────────────────────────────────
  if (stage === 'risk') {
    const item = RISK_ITEMS[riskIdx];
    const correctLevel = RISK_LEVELS.find(l => l.id === item.risk)!;
    const panel = INVESTMENT_PANELS.risk;
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
                {panel.dictionary.map((item_d, i) => (
                  <div key={i}>
                    <div className="text-sm font-bold text-cyan-300 mb-1.5">{item_d.term}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{item_d.def}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="flex-1 min-w-0">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
              <Bar cls="from-amber-500 via-orange-500 to-red-500" />
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <span className="bg-amber-900/50 border border-amber-700 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                    Seviye 3 — Risk Seviyeleri
                  </span>
                  <span className="text-slate-400 text-sm font-bold">{riskIdx + 1} / {RISK_ITEMS.length}</span>
                </div>
                <div className="flex gap-1.5 mb-6">
                  {RISK_ITEMS.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < riskIdx ? 'bg-amber-500' : i === riskIdx ? 'bg-orange-400' : 'bg-slate-700'}`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Bu yatırım aracının risk seviyesi nedir?</p>
                      <div className="flex items-center gap-4">
                        <span className="text-5xl shrink-0">{item.icon}</span>
                        <div>
                          <p className="text-white font-black text-2xl">{item.name}</p>
                          <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                        </div>
                      </div>
                      {riskResult && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 border ${riskResult.correct ? 'bg-emerald-900/40 border-emerald-700/50' : 'bg-red-900/30 border-red-700/50'}`}>
                          {riskResult.correct
                            ? <><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /><span className="text-emerald-300 text-sm font-bold">+{PTS_RISK} puan!</span></>
                            : <><XCircle    className="w-4 h-4 text-red-400 shrink-0" /><span className="text-red-300 text-sm font-bold">Doğru cevap: {correctLevel.dot} {correctLevel.label}</span></>
                          }
                        </motion.div>
                      )}
                    </div>

                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Risk seviyesini seç</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {RISK_LEVELS.map(rl => {
                        const isClicked  = clickedRisk === rl.id;
                        const isCorrect  = rl.id === item.risk;
                        const showResult = riskResult !== null;
                        return (
                          <motion.button
                            key={rl.id}
                            whileHover={riskLocked ? {} : { scale: 1.05, y: -2 }}
                            whileTap={riskLocked ? {} : { scale: 0.95 }}
                            animate={isClicked && !riskResult?.correct ? { x: [0, -5, 5, -3, 3, 0] } : {}}
                            transition={{ duration: 0.3 }}
                            onClick={() => handleRiskClick(rl.id)}
                            disabled={riskLocked}
                            className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 border-2 text-xs font-bold transition-all
                              ${showResult
                                ? isCorrect  ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300'
                                  : isClicked ? 'border-red-500 bg-red-900/40 text-red-300'
                                  : 'border-slate-700 bg-slate-800/40 text-slate-600 opacity-40'
                                : rl.cls}`}
                          >
                            <span className="text-base">{rl.dot}</span>
                            <span className="leading-tight text-center">{rl.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
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
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Risk Dağılım Haritası</div>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RISK SUMMARY ──────────────────────────────────────────────────────────
  if (stage === 'risk_summary') return (
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
              {INVESTMENT_PANELS.risk.dictionary.map((item, i) => (
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
          <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <Bar cls="from-amber-500 via-orange-500 to-red-500" />
            <div className="p-6 md:p-8">
              <div className="text-center mb-8">
                <span className="bg-orange-900/50 border border-orange-700 text-orange-300 text-xs font-bold px-3 py-1 rounded-full">
                  Risk Seviyeleri Özeti
                </span>
                <h2 className="text-white font-black text-2xl mt-4 mb-2">Yatırım Araçlarının Risk Grupları</h2>
                <p className="text-slate-400 text-sm">Her grubun neden o risk seviyesinde olduğuna bakalım:</p>
              </div>
              <div className="space-y-4 mb-8">
                {RISK_GROUPS.map((g, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                    className={`rounded-2xl p-5 border ${g.cls}`}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xl">{g.dot}</span>
                      <span className="text-white font-black text-base">{g.label}</span>
                      <span className="ml-auto text-slate-400 text-xs font-bold bg-slate-800/80 px-2 py-0.5 rounded-full shrink-0">{g.items}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{g.text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onComplete?.(totalScore); setStage('final'); }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-teal-800"
              >
                Sonuçları Gör <ArrowRight className="w-5 h-5" />
              </motion.button>
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
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Risk Dağılım Haritası</div>
              <div className="text-amber-600 text-xs">{INVESTMENT_PANELS.risk.strategyTitle}</div>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3.5">
              {INVESTMENT_PANELS.risk.strategyTips.map((tip, i) => (
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

  // ── FINAL ─────────────────────────────────────────────────────────────────
  if (stage === 'final') {
    const grade =
      totalScore >= 90 ? { label: 'Mükemmel!',   color: 'text-emerald-400', icon: '🏆', msg: 'Yatırım araçlarını çok iyi tanıyorsun.' } :
      totalScore >= 70 ? { label: 'İyi İş!',      color: 'text-blue-400',    icon: '⭐', msg: 'Temel kavramları iyi kavradın.' } :
      totalScore >= 50 ? { label: 'Fena Değil',   color: 'text-amber-400',   icon: '📘', msg: 'Biraz daha pratik yaparsan çok iyi olacaksın.' } :
                         { label: 'Tekrar Dene',  color: 'text-red-400',     icon: '💪', msg: 'Yatırım araçlarını tekrar gözden geçirmen faydalı olur.' };
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-slate-700 shadow-2xl overflow-hidden">
          <Bar cls="from-emerald-500 via-teal-500 to-blue-500" />
          <div className="p-6 md:p-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700 text-center mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className="text-7xl mb-4">{grade.icon}</motion.div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Oyun Tamamlandı</p>
              <h2 className={`text-4xl font-black mb-2 ${grade.color}`}>{grade.label}</h2>
              <p className="text-slate-300 text-sm mb-6">{grade.msg}</p>
              <div className="inline-block bg-slate-900 border border-slate-700 rounded-2xl px-8 py-4">
                <p className="text-5xl font-black text-white">{totalScore} <span className="text-slate-500 text-lg font-normal">/ 100 puan</span></p>
              </div>
            </motion.div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 mb-6">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Puan Dağılımı</p>
              <div className="space-y-3">
                {[
                  { label: 'Kavram Eşleştirme', score: matchScore,    max: 35, color: 'bg-emerald-500' },
                  { label: 'Senaryolar',         score: scenarioScore, max: 35, color: 'bg-blue-500'    },
                  { label: 'Risk Seviyeleri',    score: riskScore,     max: 30, color: 'bg-amber-500'   },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <span className="font-black text-white">{item.score} / {item.max}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className={`h-2 ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleReplay}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-purple-800"
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
