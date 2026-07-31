import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CheckCircle, XCircle } from 'lucide-react';

// ─── Drag type tokens ─────────────────────────────────────────────────────────
const CARD = 'CARD';
const STEP = 'STEP';

interface CardDrag { cardId: string; fromZone: string | null }
interface StepDrag { stepId: string; fromSlot: number | null }

// ─── Phase 1: Institution matching ───────────────────────────────────────────
const P1_ZONES = [
  { id: 'devlet',   label: 'Devlet / Hazine',       icon: '🏛️' },
  { id: 'firmalar', label: 'Firmalar / Şirketler',   icon: '🏢' },
  { id: 'finans',   label: 'Finans Sektörü / Banka', icon: '🏦' },
];
const P1_CARDS = [
  { id: 'vergi',    label: 'Vergi',    icon: '📊', correct: 'devlet'   },
  { id: 'harcama',  label: 'Harcama',  icon: '🛒', correct: 'firmalar' },
  { id: 'tasarruf', label: 'Tasarruf', icon: '💰', correct: 'finans'   },
];
const P1_FEEDBACK =
  'Paranın üç temel hedefi: devlete vergi, firmalara harcama, bankaya tasarruf. Bu üç akış ekonominin temel döngüsünü oluşturur.';

// ─── Phase 2: Flow name matching ──────────────────────────────────────────────
const P2_CONNS = [
  { id: 'c1', from: 'Birey',  fromIcon: '👤', to: 'Devlet', toIcon: '🏛️', correct: 'vergi' },
  { id: 'c2', from: 'Şirket', fromIcon: '🏢', to: 'Birey',  toIcon: '👤', correct: 'maas'  },
  { id: 'c3', from: 'Banka',  fromIcon: '🏦', to: 'Birey',  toIcon: '👤', correct: 'kredi' },
];
const P2_FLOWS = [
  { id: 'vergi', label: 'Vergi', icon: '📊' },
  { id: 'maas',  label: 'Maaş',  icon: '💵' },
  { id: 'kredi', label: 'Kredi', icon: '🏧' },
];
const P2_FEEDBACK =
  'Her para akışının bir adı vardır: Birey→Devlet = Vergi, Şirket→Birey = Maaş, Banka→Birey = Kredi.';

// ─── Phase 3: Scenario ordering ───────────────────────────────────────────────
const P3_SCENARIOS = [
  {
    id: 'ali',
    name: "Ali'nin Senaryosu",
    desc: 'Ali bankadan konut kredisi kullanmak istiyor.',
    icon: '🏠',
    color: 'from-blue-600 to-cyan-600',
    steps: [
      { id: 'a1', text: '🙋 Ali bankaya kredi başvurusu yapar' },
      { id: 'a2', text: '🔍 Banka gelir ve kredi notunu değerlendirir' },
      { id: 'a3', text: "💸 Onaylanan tutar Ali'nin hesabına aktarılır" },
    ],
    order: ['a1', 'a2', 'a3'],
    tip: 'Kredi akışı: başvuru → değerlendirme → ödeme sırasını izler.',
  },
  {
    id: 'zeynep',
    name: "Zeynep'in Senaryosu",
    desc: 'Zeynep yeni bir işe başladı; maaşı nasıl alır?',
    icon: '💼',
    color: 'from-purple-600 to-pink-600',
    steps: [
      { id: 'z1', text: '💼 Zeynep şirkette çalışmaya başlar' },
      { id: 'z2', text: '🧾 Şirket vergi ve sigorta kesintisi yapar' },
      { id: 'z3', text: "✅ Net maaş Zeynep'in hesabına yatar" },
    ],
    order: ['z1', 'z2', 'z3'],
    tip: 'Maaş akışı: çalışma → kesintiler → net ödeme sırasını izler.',
  },
  {
    id: 'mehmet',
    name: "Mehmet'in Senaryosu",
    desc: 'Mehmet borsada ilk kez hisse senedi almak istiyor.',
    icon: '📈',
    color: 'from-orange-600 to-red-600',
    steps: [
      { id: 'm1', text: '📱 Mehmet bir aracı kuruma kayıt olur' },
      { id: 'm2', text: '💸 Hesabına yatırım tutarını transfer eder' },
      { id: 'm3', text: '📈 Seçtiği hisseyi borsa üzerinden satın alır' },
    ],
    order: ['m1', 'm2', 'm3'],
    tip: 'Hisse alımı: aracı kurum → para yatırma → hisse satın alma sırasını izler.',
  },
];

const PTS = 10;
const MAX_SCORE = 90;

function getPerf(score: number) {
  const pct = score / MAX_SCORE;
  if (pct >= 0.85) return { label: 'Finans Uzmanı!', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/50 to-slate-900' };
  if (pct >= 0.65) return { label: 'Çok İyi!',        icon: '👍', color: 'text-blue-400',    bg: 'from-blue-900/50 to-slate-900'    };
  if (pct >= 0.40) return { label: 'Gelişiyor...',    icon: '📘', color: 'text-yellow-400',  bg: 'from-yellow-900/50 to-slate-900'  };
  return              { label: 'Pratik Gerekli',     icon: '📚', color: 'text-red-400',     bg: 'from-red-900/50 to-slate-900'     };
}

// ─── Drag-and-drop primitives ─────────────────────────────────────────────────

function DragCard({ cardId, fromZone, disabled, children }: {
  cardId: string; fromZone: string | null; disabled?: boolean; children: React.ReactNode;
}) {
  const [{ isDragging }, drag] = useDrag<CardDrag, void, { isDragging: boolean }>({
    type: CARD,
    item: { cardId, fromZone },
    canDrag: !disabled,
    collect: m => ({ isDragging: m.isDragging() }),
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drag as any} className={isDragging ? 'opacity-30' : 'opacity-100'}
      style={{ cursor: disabled ? 'default' : 'grab' }}>
      {children}
    </div>
  );
}

function CardZone({ onDrop, className, children }: {
  onDrop: (item: CardDrag) => void; className?: string; children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop<CardDrag, void, { isOver: boolean }>({
    accept: CARD,
    drop: item => onDrop(item),
    collect: m => ({ isOver: m.isOver() }),
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drop as any} className={`${className ?? ''} transition-all ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800' : ''}`}>
      {children}
    </div>
  );
}

function DragStep({ stepId, fromSlot, disabled, children }: {
  stepId: string; fromSlot: number | null; disabled?: boolean; children: React.ReactNode;
}) {
  const [{ isDragging }, drag] = useDrag<StepDrag, void, { isDragging: boolean }>({
    type: STEP,
    item: { stepId, fromSlot },
    canDrag: !disabled,
    collect: m => ({ isDragging: m.isDragging() }),
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drag as any} className={isDragging ? 'opacity-30' : 'opacity-100'}
      style={{ cursor: disabled ? 'default' : 'grab' }}>
      {children}
    </div>
  );
}

function StepSlot({ onDrop, className, children }: {
  onDrop: (item: StepDrag) => void; className?: string; children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop<StepDrag, void, { isOver: boolean }>({
    accept: STEP,
    drop: item => onDrop(item),
    collect: m => ({ isOver: m.isOver() }),
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drop as any} className={`${className ?? ''} transition-all ${isOver ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-800' : ''}`}>
      {children}
    </div>
  );
}

function CardPoolZone({ onDrop, className, children }: {
  onDrop: (item: CardDrag) => void; className?: string; children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop<CardDrag, void, { isOver: boolean }>({
    accept: CARD,
    drop: item => onDrop(item),
    collect: m => ({ isOver: m.isOver() }),
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drop as any} className={`${className ?? ''} transition-all ${isOver ? 'ring-2 ring-blue-400/60' : ''}`}>
      {children}
    </div>
  );
}

function PoolZone({ onDrop, className, children }: {
  onDrop: (item: StepDrag) => void; className?: string; children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop<StepDrag, void, { isOver: boolean }>({
    accept: STEP,
    drop: item => onDrop(item),
    collect: m => ({ isOver: m.isOver() }),
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drop as any} className={`${className ?? ''} transition-all ${isOver ? 'ring-2 ring-orange-400/60' : ''}`}>
      {children}
    </div>
  );
}

// ─── Yan panel verisi ─────────────────────────────────────────────────────────
const MONEY_FLOW_PANELS = {
  phase1: {
    dictionary: [
      { term: 'Devlet / Hazine', def: 'Ülkenin kasasıdır. Yol, hastane, okul yapmak için paraya ihtiyaç duyar ve bunu vatandaşlardan toplar.' },
      { term: 'Firmalar / Şirketler', def: 'Üretim yapan yerlerdir. Mal veya hizmet satarak ayakta kalırlar, bunun karşılığında nakit elde ederler.' },
      { term: 'Finans Sektörü / Banka', def: 'Paranın toplandığı ve dağıtıldığı havuzdur. Kullanılmayan parayı güvende tutar ve ihtiyacı olana borç verir.' },
    ],
    strategyTitle: 'Strateji Merkezi',
    strategyTips: [
      { title: 'Vergi Kimin Hakkı?', desc: 'Yaptığın alışverişlerden veya kazandığın maaştan kesilen zorunlu paydır. Bu parayı doğrudan bir "Şirket" alamaz, ülkeyi yöneten asıl kasaya gider.' },
      { title: 'Harcama Nereye Gider?', desc: 'Yeni bir telefon veya kıyafet aldığında, cebinden çıkan para bu ürünü üreten ve satan ticari kurumlara akar.' },
      { title: 'Tasarruf Nerede Bekler?', desc: 'Harcamadığın ve kenara ayırdığın para yastık altında erir. Güvenle büyümesi için finansal bir havuza aktarman gerekir.' },
    ],
  },
  phase2: {
    dictionary: [
      { term: 'Maaş', def: 'Bir bireyin emeği karşılığında, çalıştığı ticari kurumdan her ay düzenli olarak aldığı ödemedir.' },
      { term: 'Kredi', def: 'Bireyin veya şirketin nakit ihtiyacını karşılamak için, ileride faiziyle ödemek şartıyla finansal havuzdan çektiği borç paradır.' },
      { term: 'Vergi', def: 'Bireylerin veya kurumların, kamu hizmetlerinin yürütülebilmesi için devlete ödediği zorunlu katkı payıdır.' },
    ],
    strategyTitle: 'Strateji Merkezi',
    strategyTips: [
      { title: 'Birey ➡️ Devlet', desc: 'Sen devlete çalışmıyorsan devlet sana durduk yere para vermez. Ancak sen, kazancının bir kısmını yasal zorunluluk olarak ona ödersin.' },
      { title: 'Şirket ➡️ Birey', desc: 'Bir şirket durduk yere kimseye para dağıtmaz. Bu para, o şirkette çalışan kişinin emeğinin ve zamanının karşılığıdır.' },
      { title: 'Banka ➡️ Birey', desc: 'Bir birey bankadan yüklü miktarda para alıyorsa, bu genellikle ev/araba almak veya iş kurmak için talep ettiği borç paradır.' },
    ],
  },
  phase3: [
    {
      dictionary: [
        { term: 'Kredi Notu (Skoru)', def: 'Senin geçmişteki borç ödeme alışkanlıklarının karne notudur. Banka, sana güvenip güvenmeyeceğini bu nota bakarak anlar.' },
        { term: 'Kredi Başvurusu', def: 'İhtiyacın olan borç parayı alabilmek için bankaya resmi talepte bulunma sürecidir.' },
      ],
      strategyTitle: 'Strateji Merkezi',
      strategyTips: [
        { title: 'Önce Talep Et', desc: 'Hiçbir banka sen istemeden "Gidip şu eve bakayım" demez. Süreç daima senin ilk adımı atmanla başlar.' },
        { title: 'Sonra Güven Testi', desc: 'Kapıyı çaldıktan sonra banka hemen parayı vermez. Önce "Bu kişi bana paramı geri ödeyebilir mi?" diye senin geçmişini inceler.' },
        { title: 'En Son Teslimat', desc: 'Tüm incelemeler olumlu biterse, ancak o zaman para senin kullanımına açılır.' },
      ],
    },
    {
      dictionary: [
        { term: 'Brüt Maaş', def: 'İşverenin senin için ödediği toplam paradır (Kesintiler yapılmadan önceki büyük rakam).' },
        { term: 'Net Maaş', def: 'Devlet ve sigorta payları kesildikten sonra, doğrudan senin cebine giren harcanabilir paradır.' },
        { term: 'Vergi ve Sigorta Kesintisi', def: 'Yasal olarak, maaşın sana ulaşmadan önce kaynağından (şirket tarafından) kesilen zorunlu ödemelerdir.' },
      ],
      strategyTitle: 'Strateji Merkezi',
      strategyTips: [
        { title: 'Eylemden Önce Kazanç Olmaz', desc: 'Para kazanabilmek için önce o şirketin kapısından içeri adım atmalı ve emeğini ortaya koymalısın.' },
        { title: 'Devletin Payı Önceliklidir', desc: 'Senin paran hesabına geçmeden önce, sistem otomatik olarak yasal kesintileri (vergi vb.) brüt paranın içinden alır.' },
        { title: 'Kalan Senin', desc: 'Tüm yasal yükümlülükler şirket tarafından halledildikten sonra, en son kalan temiz para senin banka hesabına düşer.' },
      ],
    },
    {
      dictionary: [
        { term: 'Aracı Kurum (Broker)', def: 'Senin tek başına borsaya girip hisse alman yasaktır. Senin adına bu işlemi yapmaya devletten yetki almış yasal köprülerdir.' },
        { term: 'Fon Transferi', def: 'Banka hesabındaki normal parayı, yatırım yapabilmek için açtığın özel yatırım hesabına aktarma işlemidir.' },
      ],
      strategyTitle: 'Strateji Merkezi',
      strategyTips: [
        { title: 'Önce Köprüyü Kur', desc: 'Borsada işlem yapabilmek için öncelikle sana yasal olarak kapıyı açacak bir hesaba (aracı kuruma) kayıt olman gerekir.' },
        { title: 'Kasayı Doldur', desc: 'Hesabın açılması yetmez, içi boş bir hesapla yatırım yapamazsın. Kendi bankandan bu yeni yatırım hesabına sermaye (nakit) yollamalısın.' },
        { title: 'Harekete Geç (Alım Yap)', desc: 'Yasal hesabın var, içinde yatırım sermayen de var. Artık piyasaya girip araştırdığın şirketin hissesini sepetine ekleyebilirsin.' },
      ],
    },
  ],
};

// ─── Main game ────────────────────────────────────────────────────────────────

interface MoneyFlowProps { onComplete?: (score: number) => void }

function MoneyFlowGame({ onComplete }: MoneyFlowProps) {
  const [stage, setStage] = useState<'intro' | 'game' | 'finished'>('intro');
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [p3Idx, setP3Idx]     = useState(0);
  const [checked, setChecked] = useState(false);
  const [score, setScore]     = useState(0);

  // Phase 1 state: zoneId → cardId
  const [p1Placed, setP1Placed] = useState<Record<string, string | null>>(
    () => ({ devlet: null, firmalar: null, finans: null })
  );

  // Phase 2 state: connId → flowId
  const [p2Placed, setP2Placed] = useState<Record<string, string | null>>(
    () => ({ c1: null, c2: null, c3: null })
  );

  // Phase 3 state
  const [p3Slots, setP3Slots]           = useState<(string | null)[]>([null, null, null]);
  const [p3DisplayOrder, setP3DisplayOrder] = useState<string[]>([]);

  // Shuffle steps when p3Idx or phase changes
  useEffect(() => {
    if (stage !== 'game' || phase !== 3) return;
    const sc = P3_SCENARIOS[p3Idx];
    const ids = sc.steps.map(s => s.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setP3DisplayOrder(ids);
    setP3Slots([null, null, null]);
    setChecked(false);
  }, [stage, phase, p3Idx]);

  // ── Phase 1 ──────────────────────────────────────────────────────────────────
  const handleP1Drop = useCallback((item: CardDrag, zoneId: string) => {
    setP1Placed(prev => {
      const next = { ...prev };
      if (item.fromZone) next[item.fromZone] = null;
      // displaced card automatically falls back to pool (derived)
      next[zoneId] = item.cardId;
      return next;
    });
  }, []);

  const p1Pool     = P1_CARDS.filter(c => !Object.values(p1Placed).includes(c.id));
  const p1AllFull  = P1_CARDS.every(c => Object.values(p1Placed).includes(c.id));

  const checkP1 = () => {
    let pts = 0;
    P1_ZONES.forEach(z => {
      const cid = p1Placed[z.id];
      const card = P1_CARDS.find(c => c.id === cid);
      if (card && card.correct === z.id) pts += PTS;
    });
    setScore(prev => prev + pts);
    setChecked(true);
  };

  // ── Phase 2 ──────────────────────────────────────────────────────────────────
  const handleP2Drop = useCallback((item: CardDrag, connId: string) => {
    setP2Placed(prev => {
      const next = { ...prev };
      if (item.fromZone) next[item.fromZone] = null;
      next[connId] = item.cardId;
      return next;
    });
  }, []);

  const p2Pool    = P2_FLOWS.filter(f => !Object.values(p2Placed).includes(f.id));
  const p2AllFull = P2_FLOWS.every(f => Object.values(p2Placed).includes(f.id));

  const checkP2 = () => {
    let pts = 0;
    P2_CONNS.forEach(conn => {
      if (p2Placed[conn.id] === conn.correct) pts += PTS;
    });
    setScore(prev => prev + pts);
    setChecked(true);
  };

  const handleP1PoolReturn = useCallback((item: CardDrag) => {
    if (item.fromZone) {
      setP1Placed(prev => ({ ...prev, [item.fromZone!]: null }));
    }
  }, []);

  const handleP2PoolReturn = useCallback((item: CardDrag) => {
    if (item.fromZone) {
      setP2Placed(prev => ({ ...prev, [item.fromZone!]: null }));
    }
  }, []);

  // ── Phase 3 ──────────────────────────────────────────────────────────────────
  const handleP3SlotDrop = useCallback((item: StepDrag, slotIdx: number) => {
    setP3Slots(prev => {
      const next = [...prev];
      const displaced = next[slotIdx];
      if (item.fromSlot !== null && item.fromSlot !== slotIdx) {
        // Swap: put displaced into vacated slot
        next[item.fromSlot] = displaced ?? null;
      } else if (item.fromSlot !== null) {
        // Same slot — no-op
        return prev;
      }
      next[slotIdx] = item.stepId;
      return next;
    });
  }, []);

  const handleP3PoolReturn = useCallback((item: StepDrag) => {
    if (item.fromSlot !== null) {
      setP3Slots(prev => {
        const next = [...prev];
        next[item.fromSlot!] = null;
        return next;
      });
    }
  }, []);

  const sc          = P3_SCENARIOS[p3Idx];
  const p3PoolItems = p3DisplayOrder.filter(id => !p3Slots.includes(id));
  const p3AllFull   = p3Slots.every(s => s !== null);

  const checkP3 = () => {
    const correct = sc.order.every((id, i) => p3Slots[i] === id);
    if (correct) setScore(prev => prev + PTS);
    setChecked(true);
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (phase === 1) {
      setPhase(2);
      setChecked(false);
      setP2Placed({ c1: null, c2: null, c3: null });
    } else if (phase === 2) {
      setPhase(3);
      setChecked(false);
      setP3Idx(0);
    } else if (phase === 3) {
      if (p3Idx < P3_SCENARIOS.length - 1) {
        setP3Idx(prev => prev + 1);
        setChecked(false);
      } else {
        // Finished — score already updated by checkP3
        setStage('finished');
        onComplete?.(score);
      }
    }
  }, [phase, p3Idx, score, onComplete]);

  // ── INTRO ────────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    const introPanel = MONEY_FLOW_PANELS.phase1;
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-start gap-4">

          {/* Left Panel */}
          <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-cyan-800/40">
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-0.5">📖 Ekonomi Sözlüğü</div>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3.5">
                {introPanel.dictionary.map((item, i) => (
                  <div key={i}>
                    <div className="text-sm font-bold text-cyan-300 mb-1.5">{item.term}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{item.def}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
                <div className="p-10 text-center">
                  <div className="flex justify-center items-center gap-3 mb-6">
                    {[
                      { icon: '🏛️', bg: 'bg-blue-600/20',   border: 'border-blue-500/30',   size: 'w-16 h-16 text-3xl' },
                      { icon: '💸', bg: 'bg-purple-600/20', border: 'border-purple-500/30', size: 'w-20 h-20 text-4xl' },
                      { icon: '🏦', bg: 'bg-cyan-600/20',   border: 'border-cyan-500/30',   size: 'w-16 h-16 text-3xl' },
                    ].map((item, i) => (
                      <div key={i} className={`${item.size} ${item.bg} rounded-2xl flex items-center justify-center border ${item.border}`}>
                        {item.icon}
                      </div>
                    ))}
                  </div>

                  <h1 className="text-4xl font-black text-white mb-2">Para Akışı</h1>
                  <p className="text-slate-400 text-sm uppercase tracking-widest mb-8">Finansal Kurumlar ve İşlemler</p>

                  <div className="bg-slate-700/50 rounded-2xl p-6 mb-8 border border-slate-600/50 text-left max-w-xl mx-auto space-y-3">
                    {[
                      { num: 1, icon: '🏛️', label: 'Kurumu Eşleştir',   desc: 'Para türü kartını sürükle, doğru kurumun üzerine bırak',    color: 'text-blue-400'   },
                      { num: 2, icon: '🔀', label: 'Akışı Adlandır',    desc: 'Akış adı kartını sürükle, ilgili ok bağlantısına bırak',    color: 'text-purple-400' },
                      { num: 3, icon: '🔢', label: 'Senaryoyu Sırala',  desc: 'Adım kartlarını sürükle, doğru sıraya yerleştir',          color: 'text-orange-400' },
                    ].map(item => (
                      <div key={item.num} className="flex items-start gap-3 bg-slate-800/60 rounded-xl px-4 py-3">
                        <span className={`shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm font-black ${item.color}`}>{item.num}</span>
                        <div>
                          <span className="text-white font-bold text-sm">{item.label}: </span>
                          <span className="text-slate-400 text-sm">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-8 mb-8 text-slate-400 text-sm">
                    <div className="text-center"><div className="text-3xl font-black text-white">3</div><div>Bölüm</div></div>
                    <div className="w-px h-8 bg-slate-600" />
                    <div className="text-center"><div className="text-3xl font-black text-white">9</div><div>Görev</div></div>
                    <div className="w-px h-8 bg-slate-600" />
                    <div className="text-center"><div className="text-3xl font-black text-white">{MAX_SCORE}</div><div>Maks. Puan</div></div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setStage('game')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-purple-800"
                  >
                    Oyuna Başla 💸
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel */}
          <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-amber-800/40">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 {introPanel.strategyTitle}</div>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3.5">
                {introPanel.strategyTips.map((tip, i) => (
                  <div key={i}>
                    <div className="text-sm font-bold text-amber-300 mb-1.5">{tip.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const perf = getPerf(score);
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`bg-gradient-to-br ${perf.bg} rounded-3xl overflow-hidden shadow-2xl border border-slate-700`}>
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
          <div className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="text-7xl mb-4">{perf.icon}</motion.div>
            <h2 className="text-3xl font-black text-white mb-1">Tamamlandı!</h2>
            <p className={`text-xl font-bold mb-2 ${perf.color}`}>{perf.label}</p>
            <div className="inline-block bg-white text-slate-900 text-4xl font-black py-3 px-12 rounded-full shadow-xl mb-8">
              {score} / {MAX_SCORE} puan
            </div>

            {/* Phase breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { num: 1, label: 'Kurumu Eşleştir', icon: '🏛️', color: 'text-blue-400',   maxPts: 30 },
                { num: 2, label: 'Akışı Adlandır',  icon: '🔀', color: 'text-purple-400', maxPts: 30 },
                { num: 3, label: 'Senaryoyu Sırala',icon: '🔢', color: 'text-orange-400', maxPts: 30 },
              ].map(ph => (
                <div key={ph.num} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 text-center">
                  <div className="text-2xl mb-1">{ph.icon}</div>
                  <p className="text-slate-400 text-xs font-bold mb-1">{ph.label}</p>
                  <p className={`text-xl font-black ${ph.color}`}>
                    {/* We don't track per-phase score separately, so show — */}
                    <span className="text-slate-500 text-sm font-normal">/{ph.maxPts}</span>
                  </p>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setStage('intro');
                setPhase(1);
                setP3Idx(0);
                setChecked(false);
                setScore(0);
                setP1Placed({ devlet: null, firmalar: null, finans: null });
                setP2Placed({ c1: null, c2: null, c3: null });
                setP3Slots([null, null, null]);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3 px-10 rounded-full shadow-lg border-b-4 border-purple-800"
            >
              Tekrar Oyna ↩
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ─────────────────────────────────────────────────────────────────────
  const phaseColors: Record<number, string> = {
    1: 'from-blue-500 to-cyan-500',
    2: 'from-purple-500 to-pink-500',
    3: 'from-orange-500 to-red-500',
  };
  const phaseNames = ['Kurumu Eşleştir', 'Akışı Adlandır', 'Senaryoyu Sırala'];
  const phaseIcons = ['🏛️', '🔀', '🔢'];

  const panel = phase === 1 ? MONEY_FLOW_PANELS.phase1
    : phase === 2 ? MONEY_FLOW_PANELS.phase2
    : MONEY_FLOW_PANELS.phase3[p3Idx];
  const panelKey = phase === 3 ? `3-${p3Idx}` : `${phase}`;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">

        {/* Left Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${panelKey}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Top bar */}
        <div className={`h-1.5 bg-gradient-to-r ${phaseColors[phase]}`} />
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          {/* Phase indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(p => (
              <div key={p} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                p < phase  ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400'
                : p === phase ? `bg-gradient-to-r ${phaseColors[phase]} text-white border-transparent`
                : 'bg-slate-700/40 border-slate-600/50 text-slate-500'
              }`}>
                {p < phase ? '✓' : phaseIcons[p - 1]} {phaseNames[p - 1]}
              </div>
            ))}
          </div>
          <div className="bg-blue-900/60 text-blue-300 px-4 py-1.5 rounded-full text-sm font-black border border-blue-700/60">
            💸 {score} puan
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${p3Idx}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >

              {/* ══ PHASE 1 ════════════════════════════════════════════════════ */}
              {phase === 1 && (
                <div>
                  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400">🏛️</span>
                      <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Kurumu Eşleştir</span>
                    </div>
                    <p className="text-white font-bold text-sm">
                      Para türü kartlarını sürükleyerek doğru kurumun kutusuna bırak.
                    </p>
                  </div>

                  {/* Pool */}
                  <div className="mb-5">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                      Kart Havuzu
                      <span className="ml-2 text-slate-600 font-normal normal-case">← geri almak için buraya bırak</span>
                    </p>
                    <CardPoolZone
                      onDrop={handleP1PoolReturn}
                      className="flex gap-3 flex-wrap min-h-[60px] bg-slate-800/40 rounded-xl p-3 border border-dashed border-slate-600"
                    >
                      {p1Pool.map(card => (
                        <DragCard key={card.id} cardId={card.id} fromZone={null} disabled={checked}>
                          <div className="flex items-center gap-2 bg-slate-700 border-2 border-slate-500 hover:border-blue-400 rounded-xl px-4 py-2.5 text-white font-bold text-sm select-none">
                            <span className="text-xl">{card.icon}</span>
                            {card.label}
                          </div>
                        </DragCard>
                      ))}
                      {p1Pool.length === 0 && (
                        <p className="text-slate-600 text-xs italic self-center px-1">Tüm kartlar yerleştirildi</p>
                      )}
                    </CardPoolZone>
                  </div>

                  {/* Institution zones */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {P1_ZONES.map(zone => {
                      const placedCardId = p1Placed[zone.id];
                      const placedCard   = P1_CARDS.find(c => c.id === placedCardId);
                      const isCorrect    = checked && placedCard?.correct === zone.id;
                      const isWrong      = checked && placedCard && placedCard.correct !== zone.id;

                      return (
                        <CardZone
                          key={zone.id}
                          onDrop={item => handleP1Drop(item, zone.id)}
                          className={`rounded-2xl border-2 p-3 min-h-[110px] flex flex-col items-center justify-center gap-2 ${
                            isCorrect ? 'bg-emerald-900/40 border-emerald-500'
                            : isWrong  ? 'bg-red-900/40 border-red-500'
                            : 'bg-slate-800 border-slate-600 border-dashed'
                          }`}
                        >
                          <div className="text-3xl">{zone.icon}</div>
                          <p className="text-slate-300 text-xs font-bold text-center leading-tight">{zone.label}</p>
                          {placedCard ? (
                            <DragCard cardId={placedCard.id} fromZone={zone.id} disabled={checked}>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border select-none ${
                                isCorrect ? 'bg-emerald-800/60 border-emerald-600 text-emerald-200'
                                : isWrong  ? 'bg-red-800/60 border-red-600 text-red-200'
                                : 'bg-slate-600 border-slate-500 text-white hover:border-blue-400'
                              }`}>
                                <span>{placedCard.icon}</span>
                                {placedCard.label}
                                {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                {isWrong  && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                              </div>
                            </DragCard>
                          ) : (
                            <div className="text-slate-600 text-xs italic">buraya bırak</div>
                          )}
                        </CardZone>
                      );
                    })}
                  </div>

                  {/* Wrong answers reveal */}
                  {checked && (
                    <div className="mb-4 space-y-1">
                      {P1_ZONES.map(zone => {
                        const cid  = p1Placed[zone.id];
                        const card = P1_CARDS.find(c => c.id === cid);
                        if (!card || card.correct === zone.id) return null;
                        const correctZone = P1_ZONES.find(z => z.id === card.correct)!;
                        return (
                          <div key={zone.id} className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-3 py-2">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span><strong>{card.label}</strong> doğru yeri: <strong>{correctZone.label}</strong></span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ PHASE 2 ════════════════════════════════════════════════════ */}
              {phase === 2 && (
                <div>
                  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-400">🔀</span>
                      <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">Akışı Adlandır</span>
                    </div>
                    <p className="text-white font-bold text-sm">
                      Akış adı kartlarını sürükleyerek doğru ok bağlantısının üzerine bırak.
                    </p>
                  </div>

                  {/* Pool */}
                  <div className="mb-5">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                      Kart Havuzu
                      <span className="ml-2 text-slate-600 font-normal normal-case">← geri almak için buraya bırak</span>
                    </p>
                    <CardPoolZone
                      onDrop={handleP2PoolReturn}
                      className="flex gap-3 flex-wrap min-h-[60px] bg-slate-800/40 rounded-xl p-3 border border-dashed border-slate-600"
                    >
                      {p2Pool.map(flow => (
                        <DragCard key={flow.id} cardId={flow.id} fromZone={null} disabled={checked}>
                          <div className="flex items-center gap-2 bg-slate-700 border-2 border-slate-500 hover:border-purple-400 rounded-xl px-4 py-2.5 text-white font-bold text-sm select-none">
                            <span className="text-xl">{flow.icon}</span>
                            {flow.label}
                          </div>
                        </DragCard>
                      ))}
                      {p2Pool.length === 0 && (
                        <p className="text-slate-600 text-xs italic self-center px-1">Tüm kartlar yerleştirildi</p>
                      )}
                    </CardPoolZone>
                  </div>

                  {/* Connection rows */}
                  <div className="space-y-3 mb-5">
                    {P2_CONNS.map(conn => {
                      const placedFlowId = p2Placed[conn.id];
                      const placedFlow   = P2_FLOWS.find(f => f.id === placedFlowId);
                      const isCorrect    = checked && placedFlowId === conn.correct;
                      const isWrong      = checked && placedFlow && placedFlowId !== conn.correct;

                      return (
                        <div key={conn.id} className="flex items-center gap-3 bg-slate-800 rounded-2xl p-3 border border-slate-700">
                          {/* From */}
                          <div className="flex flex-col items-center bg-slate-700/60 rounded-xl px-4 py-2.5 border border-slate-600 min-w-[80px]">
                            <span className="text-2xl">{conn.fromIcon}</span>
                            <span className="text-white text-xs font-black mt-1">{conn.from}</span>
                          </div>

                          {/* Arrow + drop zone */}
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-purple-400">
                              <div className="w-6 h-0.5 bg-purple-500/60" />
                              <span className="text-lg">→</span>
                              <div className="w-6 h-0.5 bg-purple-500/60" />
                            </div>
                            <CardZone
                              onDrop={item => handleP2Drop(item, conn.id)}
                              className={`w-full rounded-xl border-2 px-2 py-2 flex items-center justify-center min-h-[44px] ${
                                isCorrect ? 'bg-emerald-900/40 border-emerald-500'
                                : isWrong  ? 'bg-red-900/40 border-red-500'
                                : 'bg-slate-700/40 border-dashed border-slate-500'
                              }`}
                            >
                              {placedFlow ? (
                                <DragCard cardId={placedFlow.id} fromZone={conn.id} disabled={checked}>
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border select-none ${
                                    isCorrect ? 'bg-emerald-800/60 border-emerald-600 text-emerald-200'
                                    : isWrong  ? 'bg-red-800/60 border-red-600 text-red-200'
                                    : 'bg-slate-600 border-slate-500 text-white hover:border-purple-400'
                                  }`}>
                                    <span>{placedFlow.icon}</span>
                                    {placedFlow.label}
                                    {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                    {isWrong  && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                  </div>
                                </DragCard>
                              ) : (
                                <span className="text-slate-600 text-xs italic">buraya bırak</span>
                              )}
                            </CardZone>
                          </div>

                          {/* To */}
                          <div className="flex flex-col items-center bg-slate-700/60 rounded-xl px-4 py-2.5 border border-slate-600 min-w-[80px]">
                            <span className="text-2xl">{conn.toIcon}</span>
                            <span className="text-white text-xs font-black mt-1">{conn.to}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Wrong reveals */}
                  {checked && (
                    <div className="mb-4 space-y-1">
                      {P2_CONNS.map(conn => {
                        const fid  = p2Placed[conn.id];
                        const flow = P2_FLOWS.find(f => f.id === fid);
                        if (!flow || fid === conn.correct) return null;
                        const correct = P2_FLOWS.find(f => f.id === conn.correct)!;
                        return (
                          <div key={conn.id} className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-3 py-2">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span><strong>{conn.from}→{conn.to}</strong> doğru akış: <strong>{correct.label}</strong></span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ PHASE 3 ════════════════════════════════════════════════════ */}
              {phase === 3 && (
                <div>
                  {/* Scenario header */}
                  <div className={`bg-gradient-to-r ${sc.color} rounded-2xl p-4 mb-5 flex items-center gap-4`}>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl shrink-0">{sc.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Senaryo {p3Idx + 1} / {P3_SCENARIOS.length}</span>
                        {[0, 1, 2].map(i => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i <= p3Idx ? 'bg-white' : 'bg-white/30'}`} />
                        ))}
                      </div>
                      <p className="text-white font-black text-base">{sc.name}</p>
                      <p className="text-white/80 text-sm">{sc.desc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 mb-5">
                    {/* Numbered slots */}
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Adım Sırası</p>
                      <div className="space-y-2">
                        {[0, 1, 2].map(slotIdx => {
                          const stepId = p3Slots[slotIdx];
                          const step   = sc.steps.find(s => s.id === stepId);
                          const isCorrect = checked && stepId === sc.order[slotIdx];
                          const isWrong   = checked && stepId && stepId !== sc.order[slotIdx];

                          return (
                            <StepSlot
                              key={slotIdx}
                              onDrop={item => handleP3SlotDrop(item, slotIdx)}
                              className={`rounded-xl border-2 min-h-[56px] flex items-center gap-2 px-3 ${
                                isCorrect ? 'bg-emerald-900/40 border-emerald-500'
                                : isWrong  ? 'bg-red-900/40 border-red-500'
                                : 'bg-slate-800 border-dashed border-slate-600'
                              }`}
                            >
                              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                isCorrect ? 'bg-emerald-500 text-white'
                                : isWrong  ? 'bg-red-500 text-white'
                                : 'bg-slate-600 text-slate-400'
                              }`}>{slotIdx + 1}</span>
                              {step ? (
                                <DragStep stepId={step.id} fromSlot={slotIdx} disabled={checked}>
                                  <div className={`text-xs font-medium select-none cursor-grab leading-snug ${
                                    isCorrect ? 'text-emerald-200'
                                    : isWrong  ? 'text-red-200'
                                    : 'text-white hover:text-orange-300'
                                  }`}>
                                    {step.text}
                                  </div>
                                </DragStep>
                              ) : (
                                <span className="text-slate-600 text-xs italic">buraya bırak</span>
                              )}
                              {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                              {isWrong  && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                            </StepSlot>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step pool */}
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Adım Havuzu</p>
                      <PoolZone
                        onDrop={handleP3PoolReturn}
                        className="bg-slate-800/40 rounded-xl border border-dashed border-slate-600 p-2 min-h-[180px] space-y-2"
                      >
                        {p3PoolItems.map(id => {
                          const step = sc.steps.find(s => s.id === id)!;
                          return (
                            <DragStep key={id} stepId={step.id} fromSlot={null} disabled={checked}>
                              <div className="flex items-center gap-2 bg-slate-700 border border-slate-500 hover:border-orange-400 rounded-xl px-3 py-2.5 text-white text-xs font-medium select-none cursor-grab">
                                <span className="shrink-0 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-slate-400 text-xs">⠿</span>
                                {step.text}
                              </div>
                            </DragStep>
                          );
                        })}
                        {p3PoolItems.length === 0 && !checked && (
                          <p className="text-slate-600 text-xs italic px-2 pt-2">Tüm adımlar yerleştirildi</p>
                        )}
                        {p3PoolItems.length > 0 && (
                          <p className="text-slate-600 text-xs italic px-2 pt-1">← geri almak için buraya bırak</p>
                        )}
                      </PoolZone>
                    </div>
                  </div>

                  {/* Wrong order reveal */}
                  {checked && !sc.order.every((id, i) => p3Slots[i] === id) && (
                    <div className="mb-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-4 py-3">
                      <p className="text-emerald-300 text-xs font-bold mb-1">Doğru sıra:</p>
                      {sc.order.map((id, i) => {
                        const step = sc.steps.find(s => s.id === id)!;
                        return (
                          <p key={id} className="text-emerald-200 text-xs">{i + 1}. {step.text}</p>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Shared: Check & Feedback ─────────────────────────────────── */}
              <div className="mt-2">
                {/* Check button */}
                {!checked && (
                  <>
                    {phase === 1 && p1AllFull && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={checkP1}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-base border-b-4 border-blue-800"
                      >
                        Kontrol Et ✔
                      </motion.button>
                    )}
                    {phase === 2 && p2AllFull && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={checkP2}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl text-base border-b-4 border-purple-800"
                      >
                        Kontrol Et ✔
                      </motion.button>
                    )}
                    {phase === 3 && p3AllFull && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={checkP3}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl text-base border-b-4 border-orange-800"
                      >
                        Sırayı Kontrol Et ✔
                      </motion.button>
                    )}
                  </>
                )}

                {/* Feedback */}
                <AnimatePresence>
                  {checked && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl px-5 py-4 flex items-start gap-3">
                        <span className="text-blue-400 text-lg shrink-0">💡</span>
                        <p className="text-blue-200 text-sm leading-relaxed">
                          {phase === 1 ? P1_FEEDBACK : phase === 2 ? P2_FEEDBACK : sc.tip}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className={`w-full text-white font-black py-4 rounded-2xl text-base shadow-lg border-b-4 bg-gradient-to-r ${
                          phase === 1 ? 'from-blue-600 to-purple-600 border-purple-800 hover:from-blue-500 hover:to-purple-500'
                          : phase === 2 ? 'from-purple-600 to-pink-600 border-pink-800 hover:from-purple-500 hover:to-pink-500'
                          : 'from-orange-600 to-red-600 border-red-800 hover:from-orange-500 hover:to-red-500'
                        }`}
                      >
                        {phase < 3
                          ? `Bölüm ${phase + 1}'e Geç ➔`
                          : p3Idx < P3_SCENARIOS.length - 1
                          ? `Sonraki Senaryo ➔`
                          : 'Sonuçları Gör 🏆'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${panelKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-amber-800/40">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 {panel.strategyTitle}</div>
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

      </div>
    </div>
  );
}

// ─── Export: wrap in DndProvider ──────────────────────────────────────────────
export default function MoneyFlow({ onComplete }: MoneyFlowProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <MoneyFlowGame onComplete={onComplete} />
    </DndProvider>
  );
}
