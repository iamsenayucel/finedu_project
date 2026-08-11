import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface FraudHuntGlossaryPuzzleProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Direction = 'across' | 'down';

interface WordDef {
  id: string;
  number: number;
  direction: Direction;
  row: number;
  col: number;
  answer: string; // boşluksuz, bulmaca ızgarasında kullanılan hali
  label: string; // cevap kutucuğunda gösterilen hali (boşluklu olabilir)
  clue: string;
}

// ─── BULMACA VERİSİ (sabit yerleşim — değiştirilmemeli) ────────────────────────

const WORDS: WordDef[] = [
  {
    id: 'veri_avciligi',
    number: 1,
    direction: 'across',
    row: 1,
    col: 1,
    answer: 'VERİAVCILIĞI',
    label: 'VERİ AVCILIĞI',
    clue: 'Kişisel verilerin, banka hesap detaylarının ve şifrelerin yetkisiz kişilerce ele geçirilerek, mağdur adına yasa dışı finansal işlemler gerçekleştirilmesi amacıyla yapılan siber saldırı türüdür.',
  },
  {
    id: 'resmi_kurum',
    number: 2,
    direction: 'down',
    row: 1,
    col: 3,
    answer: 'RESMİKURUM',
    label: 'RESMİ KURUM',
    clue: 'Devlet teşkilatları, üniversiteler veya kamu kurumu niteliğindeki kuruluşlardır. Güvenilir finansal destek duyuruları genellikle ".gov.tr" veya ".edu.tr" uzantılı web platformlarından yapılır.',
  },
  {
    id: 'mikro_odeme',
    number: 3,
    direction: 'across',
    row: 4,
    col: 3,
    answer: 'MİKROÖDEME',
    label: 'MİKRO ÖDEME',
    clue: 'Dolandırıcıların, kargo veya gümrük vergisi gibi bahanelerle talep ettikleri çok düşük tutarlı tahsilat işlemidir. Asıl amaç, bu işlem sırasında sisteme girilen kredi kartı bilgilerini kopyalamaktır.',
  },
  {
    id: 'kapora',
    number: 4,
    direction: 'down',
    row: 4,
    col: 5,
    answer: 'KAPORA',
    label: 'KAPORA',
    clue: 'Gayrimenkul veya araç alım-satım süreçlerinde, gerçekte var olmayan veya satıcıya ait olmayan bir mülk için ön ödeme talep edilerek gerçekleştirilen nitelikli dolandırıcılık yöntemidir.',
  },
  {
    id: 'golge_sirket',
    number: 5,
    direction: 'down',
    row: 5,
    col: 9,
    answer: 'GÖLGEŞİRKET',
    label: 'GÖLGE ŞİRKET',
    clue: 'Kurumsal kimliği, açık adresi ve vergi kimlik numarası bulunmayan; tüketicileri mağdur ettikten sonra yasal muhataplık tesis edilemeyen paravan veya hayalet ticari işletmelerdir.',
  },
  {
    id: 'oltalama',
    number: 6,
    direction: 'across',
    row: 7,
    col: 5,
    answer: 'OLTALAMA',
    label: 'OLTALAMA',
    clue: 'Kullanıcıların finansal şifrelerini ele geçirmek amacıyla, meşru ve güvenilir kurumların arayüzleri taklit edilerek oluşturulan sahte web sitesi veya e-posta tuzaklarıdır.',
  },
  {
    id: 'yapay_sayac',
    number: 7,
    direction: 'down',
    row: 8,
    col: 11,
    answer: 'YAPAYSAYAÇ',
    label: 'YAPAY SAYAÇ',
    clue: 'Tüketicide "kıtlık" ve "aciliyet" algısı yaratarak, rasyonel değerlendirme sürecini atlatıp ani satın alma kararı verdirmek üzere kurgulanan geri sayım manipülasyonudur.',
  },
  {
    id: 'lisans',
    number: 8,
    direction: 'down',
    row: 10,
    col: 7,
    answer: 'LİSANS',
    label: 'LİSANS',
    clue: 'Finansal piyasalarda yasal olarak fon toplayabilmek ve faaliyette bulunabilmek için SPK veya BDDK gibi düzenleyici kamu kurumlarından alınması zorunlu olan resmi yetki belgesidir.',
  },
  {
    id: 'ponzi',
    number: 9,
    direction: 'across',
    row: 10,
    col: 11,
    answer: 'PONZİ',
    label: 'PONZİ',
    clue: 'Gerçek bir ticari faaliyete dayanmayan, sisteme yeni katılan üyelerin fonlarıyla eski üyelere ödeme yapılan ve nakit akışı kesildiğinde çöken yasa dışı piramit finansman modelidir.',
  },
  {
    id: 'zaman_baskisi',
    number: 10,
    direction: 'across',
    row: 13,
    col: 1,
    answer: 'ZAMANBASKISI',
    label: 'ZAMAN BASKISI',
    clue: 'Tüketicinin rasyonel karar verme ve araştırma yapma süreçlerini manipüle etmek amacıyla, "sınırlı süre" argümanlarıyla oluşturulan psikolojik manipülasyon taktiğidir.',
  },
];

const TOTAL_WORDS = WORDS.length;
const PTS = 10;
const MAX_SCORE = TOTAL_WORDS * PTS;
const CHIP_TYPE = 'FRAUD_HUNT_GLOSSARY_ANSWER';

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function wordCells(word: WordDef): { row: number; col: number }[] {
  return Array.from({ length: word.answer.length }, (_, i) => ({
    row: word.direction === 'down' ? word.row + i : word.row,
    col: word.direction === 'across' ? word.col + i : word.col,
  }));
}

const NUMBER_MAP: Record<string, number> = {};
const CELL_SET: Record<string, true> = {};
WORDS.forEach((w) => {
  wordCells(w).forEach((c) => {
    CELL_SET[cellKey(c.row, c.col)] = true;
  });
  NUMBER_MAP[cellKey(w.row, w.col)] = w.number;
});

const ALL_ROWS = Object.keys(CELL_SET).map((k) => Number(k.split('-')[0]));
const ALL_COLS = Object.keys(CELL_SET).map((k) => Number(k.split('-')[1]));
const MIN_ROW = Math.min(...ALL_ROWS);
const MAX_ROW = Math.max(...ALL_ROWS);
const MIN_COL = Math.min(...ALL_COLS);
const MAX_COL = Math.max(...ALL_COLS);

const ACROSS_WORDS = WORDS.filter((w) => w.direction === 'across').sort((a, b) => a.number - b.number);
const DOWN_WORDS = WORDS.filter((w) => w.direction === 'down').sort((a, b) => a.number - b.number);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ChipDragItem {
  wordId: string;
}

// ─── Sürüklenebilir cevap kutucuğu ─────────────────────────────────────────────

function AnswerChip({ word }: { word: WordDef }) {
  const [{ isDragging }, drag] = useDrag<ChipDragItem, void, { isDragging: boolean }>({
    type: CHIP_TYPE,
    item: { wordId: word.id },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={drag as any} style={{ opacity: isDragging ? 0.3 : 1 }} className="cursor-grab active:cursor-grabbing select-none">
      <div className="bg-white border-2 border-rose-300 hover:border-rose-500 hover:shadow-md text-rose-700 font-black text-xs sm:text-sm px-3 py-2 rounded-xl shadow-sm transition-all whitespace-nowrap">
        {word.label}
      </div>
    </div>
  );
}

// ─── Tanım / cevap bırakma alanı ────────────────────────────────────────────────

function DefinitionSlot({
  word,
  solved,
  wrongFlash,
  onDropAnswer,
}: {
  word: WordDef;
  solved: boolean;
  wrongFlash: boolean;
  onDropAnswer: (word: WordDef, droppedId: string) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<ChipDragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: CHIP_TYPE,
    canDrop: () => !solved,
    drop: ({ wordId }) => onDropAnswer(word, wordId),
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  });

  return (
    <motion.div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={drop as any}
      animate={wrongFlash ? { x: [0, -6, 6, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border-2 p-2.5 transition-colors ${
        solved
          ? 'bg-emerald-50 border-emerald-300'
          : wrongFlash
          ? 'bg-red-50 border-red-400'
          : isOver && canDrop
          ? 'bg-rose-100 border-rose-400'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <p className="text-xs leading-relaxed text-slate-600">
        <span className="font-black text-slate-800 mr-1">{word.number}.</span>
        {word.clue}
      </p>
      <div
        className={`mt-2 min-h-[30px] rounded-lg border-2 border-dashed flex items-center justify-center px-2 py-1 text-xs font-black tracking-wide ${
          solved
            ? 'border-emerald-400 bg-white text-emerald-700'
            : wrongFlash
            ? 'border-red-400 bg-white text-red-500'
            : 'border-slate-300 bg-white/60 text-slate-400'
        }`}
      >
        {solved ? `✅ ${word.label}` : wrongFlash ? 'Tekrar dene!' : 'Cevabı buraya sürükle'}
      </div>
    </motion.div>
  );
}

// ─── Ana oyun bileşeni ──────────────────────────────────────────────────────────

function FraudHuntGlossaryPuzzleGame({ onComplete, onBack }: FraudHuntGlossaryPuzzleProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [poolOrder, setPoolOrder] = useState<string[]>(() => shuffle(WORDS.map((w) => w.id)));
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongFlashId, setWrongFlashId] = useState<string | null>(null);

  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
  }, []);

  const letters = useMemo(() => {
    const map: Record<string, string> = {};
    WORDS.forEach((w) => {
      if (!solved.has(w.id)) return;
      wordCells(w).forEach((c, i) => {
        map[cellKey(c.row, c.col)] = w.answer[i];
      });
    });
    return map;
  }, [solved]);

  const correctCount = solved.size;
  const score = correctCount * PTS;
  const pool = poolOrder.filter((id) => !solved.has(id));

  useEffect(() => {
    if (stage === 'playing' && solved.size === TOTAL_WORDS) {
      const t = setTimeout(() => {
        setStage('finished');
        onComplete?.(MAX_SCORE);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [solved, stage, onComplete]);

  const handleDropAnswer = (word: WordDef, droppedId: string) => {
    if (solved.has(word.id)) return;
    if (droppedId === word.id) {
      setSolved((prev) => new Set(prev).add(word.id));
    } else {
      setWrongCount((c) => c + 1);
      setWrongFlashId(word.id);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => setWrongFlashId(null), 700);
    }
  };

  const startGame = () => {
    setPoolOrder(shuffle(WORDS.map((w) => w.id)));
    setSolved(new Set());
    setWrongCount(0);
    setWrongFlashId(null);
    setStage('playing');
  };

  const restart = () => {
    startGame();
  };

  // ── GİRİŞ ──────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />
          <div className="p-6 sm:p-8 text-center">
            <div className="text-6xl mb-4">🎣</div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
              Dolandırıcılık Avı — Akademik Finansal Güvenlik
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-4">
              Cevap havuzundaki kavram kutucuklarını sürükleyip doğru tanımın üzerine bırak. Doğru
              eşleştirirsen kavram bulmacadaki ilgili kutucuklara otomatik olarak yazılır ve eşleşme
              kilitlenir. Yanlış bırakırsan kutucuk havuza geri döner, tekrar deneyebilirsin.
            </p>
            <p className="text-slate-500 text-xs mb-6">
              Toplam {TOTAL_WORDS} kavram var. Hepsini doğru eşleştirdiğinde bulmaca tamamlanır.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg py-4 px-10 rounded-full shadow-xl border-b-4 border-red-800 transition-all"
            >
              Bulmacaya Başla 🚀
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── BİTİŞ ──────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const totalAttempts = TOTAL_WORDS + wrongCount;
    const accuracy = Math.round((TOTAL_WORDS / totalAttempts) * 100);
    const perf =
      wrongCount === 0
        ? { icon: '🏆', title: 'Bulmaca Ustası!', sub: 'Tek bir yanlış bile yapmadan tamamladın!', grad: 'from-yellow-500 to-amber-400' }
        : wrongCount <= 3
        ? { icon: '🌟', title: 'Harika İş!', sub: 'Finansal dolandırıcılık kavramlarına çok hakimsin.', grad: 'from-rose-600 to-red-500' }
        : wrongCount <= 6
        ? { icon: '👍', title: 'İyi İş!', sub: 'Biraz daha pratikle ustalaşırsın.', grad: 'from-orange-600 to-rose-500' }
        : { icon: '📚', title: 'Tamamlandı!', sub: 'Sözlüğü tekrar gözden geçirmek iyi olabilir.', grad: 'from-slate-600 to-slate-500' };

    return (
      <div className="w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`bg-gradient-to-br ${perf.grad} rounded-3xl p-8 sm:p-10 text-center shadow-2xl`}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-7xl mb-4">
            {perf.icon}
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-1">{perf.title}</h2>
          <p className="text-white/80 mb-6">{perf.sub}</p>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
            <div className="bg-black/20 rounded-2xl px-3 py-4">
              <p className="text-3xl font-black text-white">{TOTAL_WORDS}/{TOTAL_WORDS}</p>
              <p className="text-white/60 text-xs font-bold mt-1">Doğru Eşleştirme</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-4">
              <p className="text-3xl font-black text-white">{wrongCount}</p>
              <p className="text-white/60 text-xs font-bold mt-1">Yanlış Deneme</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-4">
              <p className="text-3xl font-black text-white">%{accuracy}</p>
              <p className="text-white/60 text-xs font-bold mt-1">İsabet Oranı</p>
            </div>
          </div>

          <div className="inline-flex flex-col items-center bg-black/20 rounded-2xl px-8 py-4 mb-6">
            <span className="text-5xl font-black text-white">{score}</span>
            <span className="text-white/60 text-sm font-bold">/ {MAX_SCORE} puan</span>
          </div>

          <p className="text-white font-bold mb-6">
            🎉 Tebrikler! Tüm kavramları doğru eşleştirerek Dolandırıcılık Avı bulmacasını tamamladın.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="bg-white/20 hover:bg-white/30 text-white font-black py-3 px-10 rounded-full border-2 border-white/30 text-lg backdrop-blur"
            >
              Tekrar Oyna 🔄
            </motion.button>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-black/20 hover:bg-black/30 text-white font-bold py-3 px-8 rounded-full border-2 border-white/20 text-base"
              >
                Ders Listesine Dön
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── OYUN ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-600 rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎣</span>
          <span className="text-white font-black text-base">Dolandırıcılık Avı — Sürükle Bırak Bulmaca</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 font-black text-xs px-3 py-1.5 rounded-full">
            Doğru Eşleştirme: {correctCount} / {TOTAL_WORDS}
          </span>
          <span className="bg-red-400/20 border border-red-400/40 text-red-200 font-black text-xs px-3 py-1.5 rounded-full">
            Yanlış Deneme: {wrongCount}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* SOL: Bulmaca Izgarası */}
        <div className="lg:col-span-2 lg:sticky lg:top-4 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex justify-center overflow-x-auto">
          <div
            className="inline-grid gap-[3px]"
            style={{
              gridTemplateRows: `repeat(${MAX_ROW - MIN_ROW + 1}, 26px)`,
              gridTemplateColumns: `repeat(${MAX_COL - MIN_COL + 1}, 26px)`,
            }}
          >
            {Array.from({ length: MAX_ROW - MIN_ROW + 1 }).map((_, ri) =>
              Array.from({ length: MAX_COL - MIN_COL + 1 }).map((_, ci) => {
                const row = MIN_ROW + ri;
                const col = MIN_COL + ci;
                const key = cellKey(row, col);
                const isCell = !!CELL_SET[key];
                if (!isCell) {
                  return <div key={key} style={{ gridRow: ri + 1, gridColumn: ci + 1 }} />;
                }
                const number = NUMBER_MAP[key];
                const letter = letters[key];

                return (
                  <div
                    key={key}
                    style={{ gridRow: ri + 1, gridColumn: ci + 1 }}
                    className={`relative w-[26px] h-[26px] flex items-center justify-center rounded-md border-2 text-xs font-black uppercase transition-colors ${
                      letter
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    {number && (
                      <span className="absolute top-0 left-0.5 text-[7px] font-black text-slate-500 z-10 leading-none">
                        {number}
                      </span>
                    )}
                    {letter || ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: Cevap havuzu + Tanımlar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Cevap havuzu */}
          <div className="sticky top-4 z-10 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5">
              <h3 className="text-white font-black text-sm">🗂️ Cevap Havuzu</h3>
            </div>
            <div className="p-3 flex flex-wrap gap-2 min-h-[52px]">
              <AnimatePresence>
                {pool.map((id) => {
                  const word = WORDS.find((w) => w.id === id)!;
                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                    >
                      <AnswerChip word={word} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {pool.length === 0 && (
                <p className="text-slate-400 text-xs italic px-1 py-2">Tüm kavramlar eşleştirildi 🎉</p>
              )}
            </div>
          </div>

          {/* Tanımlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5">
                <h3 className="text-white font-black text-sm">➡️ Soldan Sağa</h3>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {ACROSS_WORDS.map((w) => (
                  <DefinitionSlot
                    key={w.id}
                    word={w}
                    solved={solved.has(w.id)}
                    wrongFlash={wrongFlashId === w.id}
                    onDropAnswer={handleDropAnswer}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5">
                <h3 className="text-white font-black text-sm">⬇️ Yukarıdan Aşağıya</h3>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {DOWN_WORDS.map((w) => (
                  <DefinitionSlot
                    key={w.id}
                    word={w}
                    solved={solved.has(w.id)}
                    wrongFlash={wrongFlashId === w.id}
                    onDropAnswer={handleDropAnswer}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DndProvider ile dışa aktarım ───────────────────────────────────────────────

export default function FraudHuntGlossaryPuzzle(props: FraudHuntGlossaryPuzzleProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <FraudHuntGlossaryPuzzleGame {...props} />
    </DndProvider>
  );
}
