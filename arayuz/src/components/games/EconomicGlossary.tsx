import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EconomicGlossaryProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

type Direction = 'across' | 'down';

interface WordDef {
  number: number;
  direction: Direction;
  row: number;
  col: number;
  answer: string;
  clue: string;
}

// ─── BULMACA VERİSİ (PDF'teki "Ekonomi Sözlüğü" bulmacasıyla birebir aynı) ─────

const WORDS: WordDef[] = [
  {
    number: 1,
    direction: 'down',
    row: 1,
    col: 5,
    answer: 'KREDİ',
    clue: 'Bir hayalini gerçekleştirmek veya ihtiyacını karşılamak için bankadan aldığın, ancak daha sonra üzerine biraz ekleme yaparak (faiz) geri ödemek zorunda olduğun borç paradır.',
  },
  {
    number: 2,
    direction: 'down',
    row: 2,
    col: 1,
    answer: 'BANKA',
    clue: 'Paranın güvenle yüzdüğü büyük bir havuz gibidir. İhtiyacın olmadığında paranı senin için güvende tutar, ihtiyacı olanlara ise borç olarak verir.',
  },
  {
    number: 3,
    direction: 'down',
    row: 3,
    col: 8,
    answer: 'BÜTÇE',
    clue: "Paranın patronu olmaktır! Elindeki paranın nereye harcanacağını önceden planlayarak, ay sonunda 'param nereye gitti?' diye şaşırmanı engelleyen plandır.",
  },
  {
    number: 4,
    direction: 'across',
    row: 5,
    col: 1,
    answer: 'KREDİNOTU',
    clue: 'Finansal dünyanın karne notudur! Geçmişte borçlarını zamanında ödeyip ödemediğine göre hesaplanır; bankalar sana güvenirken bu nota bakar.',
  },
  {
    number: 5,
    direction: 'across',
    row: 7,
    col: 3,
    answer: 'HAZİNE',
    clue: 'Ülkenin büyük kumbarasıdır. Yol, hastane ve okul gibi hepimizin kullandığı yerleri yapmak için gereken paranın toplandığı ve saklandığı yerdir.',
  },
  {
    number: 6,
    direction: 'down',
    row: 7,
    col: 4,
    answer: 'ARACIKURUM',
    clue: 'Borsada tek başına işlem yapamayacağın için, senin adına hisse senedi alıp satmana yardımcı olan, devletten onaylı güvenilir köprü şirketlerdir (Diğer adı Broker).',
  },
  {
    number: 7,
    direction: 'across',
    row: 9,
    col: 3,
    answer: 'YATIRIM',
    clue: 'Elindeki parayı bir tohum gibi toprağa ekip, zamanla büyüterek daha fazla para kazanmasını sağlamak ve değerini korumak için yapılan işlemlerdir.',
  },
  {
    number: 8,
    direction: 'down',
    row: 9,
    col: 9,
    answer: 'MAAŞ',
    clue: 'İnsanların bir işte çalışmaları ve emek vermeleri karşılığında, işverenlerinden her ay düzenli olarak kazandıkları paradır.',
  },
  {
    number: 9,
    direction: 'across',
    row: 14,
    col: 2,
    answer: 'VERGİ',
    clue: 'Devletin park, yol, okul ve hastane gibi hepimizin işine yarayan hizmetleri yapabilmesi için vatandaşların kazançlarından devlete verdikleri zorunlu destek payıdır.',
  },
  {
    number: 10,
    direction: 'across',
    row: 16,
    col: 1,
    answer: 'NETMAAŞ',
    clue: 'Çalışan birinin kazandığı paradan devletin kestiği vergiler ve sigorta çıktıktan sonra, kişinin cebine giren ve gerçekten harcayabileceği temiz paradır.',
  },
];

const TOTAL_WORDS = WORDS.length;
const MAX_SCORE = TOTAL_WORDS * 10;

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function wordCells(word: WordDef): { row: number; col: number }[] {
  return Array.from({ length: word.answer.length }, (_, i) => ({
    row: word.direction === 'down' ? word.row + i : word.row,
    col: word.direction === 'across' ? word.col + i : word.col,
  }));
}

const ANSWER_MAP: Record<string, string> = {};
const NUMBER_MAP: Record<string, number> = {};
WORDS.forEach((w) => {
  wordCells(w).forEach((c) => {
    ANSWER_MAP[cellKey(c.row, c.col)] = w.answer[wordCells(w).findIndex((x) => x.row === c.row && x.col === c.col)];
  });
  NUMBER_MAP[cellKey(w.row, w.col)] = w.number;
});

const ALL_ROWS = Object.keys(ANSWER_MAP).map((k) => Number(k.split('-')[0]));
const ALL_COLS = Object.keys(ANSWER_MAP).map((k) => Number(k.split('-')[1]));
const MIN_ROW = Math.min(...ALL_ROWS);
const MAX_ROW = Math.max(...ALL_ROWS);
const MIN_COL = Math.min(...ALL_COLS);
const MAX_COL = Math.max(...ALL_COLS);

function turkishUpper(ch: string): string {
  if (ch === 'i') return 'İ';
  if (ch === 'ı') return 'I';
  return ch.toLocaleUpperCase('tr-TR');
}

function wordsAt(row: number, col: number): WordDef[] {
  return WORDS.filter((w) => wordCells(w).some((c) => c.row === row && c.col === col));
}

function isCellLocked(row: number, col: number, locked: Set<number>): boolean {
  return WORDS.some((w) => locked.has(w.number) && wordCells(w).some((c) => c.row === row && c.col === col));
}

const ACROSS_CLUES = WORDS.filter((w) => w.direction === 'across').sort((a, b) => a.number - b.number);
const DOWN_CLUES = WORDS.filter((w) => w.direction === 'down').sort((a, b) => a.number - b.number);

// ─── ANA BİLEŞEN ────────────────────────────────────────────────────────────────

export default function EconomicGlossary({ onComplete, onBack }: EconomicGlossaryProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [lockedWords, setLockedWords] = useState<Set<number>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongFlashWord, setWrongFlashWord] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('across');

  const lockedWordsRef = useRef(lockedWords);
  useEffect(() => {
    lockedWordsRef.current = lockedWords;
  }, [lockedWords]);

  const flashingRef = useRef<Set<number>>(new Set());
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeWord = useMemo(() => {
    if (!selected) return null;
    const candidates = wordsAt(selected.row, selected.col);
    return candidates.find((w) => w.direction === activeDirection) || candidates[0] || null;
  }, [selected, activeDirection]);

  // ── Kelime bittiğinde otomatik kontrol ──────────────────────────────────────
  useEffect(() => {
    WORDS.forEach((word) => {
      if (lockedWords.has(word.number) || flashingRef.current.has(word.number)) return;
      const cells = wordCells(word);
      const filled = cells.every((c) => (letters[cellKey(c.row, c.col)] || '') !== '');
      if (!filled) return;

      const attempt = cells.map((c) => letters[cellKey(c.row, c.col)]).join('');
      if (attempt === word.answer) {
        setLockedWords((prev) => new Set(prev).add(word.number));
      } else {
        flashingRef.current.add(word.number);
        setWrongCount((w) => w + 1);
        setWrongFlashWord(word.number);
        setTimeout(() => {
          setWrongFlashWord(null);
          setLetters((prev) => {
            const next = { ...prev };
            cells.forEach((c) => {
              if (!isCellLocked(c.row, c.col, lockedWordsRef.current)) {
                delete next[cellKey(c.row, c.col)];
              }
            });
            return next;
          });
          flashingRef.current.delete(word.number);
        }, 700);
      }
    });
  }, [letters, lockedWords]);

  // ── Tamamlanma kontrolü ──────────────────────────────────────────────────────
  useEffect(() => {
    if (lockedWords.size === TOTAL_WORDS && stage === 'playing') {
      setTimeout(() => {
        setStage('finished');
        if (onComplete) onComplete(MAX_SCORE);
      }, 400);
    }
  }, [lockedWords, stage, onComplete]);

  const focusCell = (row: number, col: number) => {
    inputRefs.current[cellKey(row, col)]?.focus();
  };

  const selectCell = (row: number, col: number) => {
    const candidates = wordsAt(row, col);
    if (candidates.length === 0) return;
    let direction = candidates.find((w) => w.direction === activeDirection)?.direction;
    if (selected && selected.row === row && selected.col === col && candidates.length > 1) {
      direction = candidates.find((w) => w.direction !== activeDirection)!.direction;
    }
    if (!direction) direction = candidates[0].direction;
    setSelected({ row, col });
    setActiveDirection(direction);
    focusCell(row, col);
  };

  const jumpToWord = (word: WordDef) => {
    setSelected({ row: word.row, col: word.col });
    setActiveDirection(word.direction);
    focusCell(word.row, word.col);
  };

  const handleChange = (row: number, col: number, raw: string) => {
    if (isCellLocked(row, col, lockedWordsRef.current)) return;
    const ch = raw.slice(-1);
    if (!ch) {
      setLetters((prev) => {
        const next = { ...prev };
        delete next[cellKey(row, col)];
        return next;
      });
      return;
    }
    if (!/[a-zA-ZçÇğĞıİiIöÖşŞüÜ]/.test(ch)) return;
    const upper = turkishUpper(ch);
    setLetters((prev) => ({ ...prev, [cellKey(row, col)]: upper }));

    if (activeWord) {
      const cells = wordCells(activeWord);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      const next = cells[idx + 1];
      if (next) {
        setSelected({ row: next.row, col: next.col });
        focusCell(next.row, next.col);
      }
    }
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !letters[cellKey(row, col)] && activeWord) {
      const cells = wordCells(activeWord);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      const prevCell = cells[idx - 1];
      if (prevCell && !isCellLocked(prevCell.row, prevCell.col, lockedWordsRef.current)) {
        setLetters((prev) => {
          const next = { ...prev };
          delete next[cellKey(prevCell.row, prevCell.col)];
          return next;
        });
        setSelected({ row: prevCell.row, col: prevCell.col });
        focusCell(prevCell.row, prevCell.col);
      }
      return;
    }
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
    };
    if (dirs[e.key]) {
      e.preventDefault();
      const [dr, dc] = dirs[e.key];
      let r = row + dr;
      let c = col + dc;
      while (r >= MIN_ROW && r <= MAX_ROW && c >= MIN_COL && c <= MAX_COL) {
        if (ANSWER_MAP[cellKey(r, c)]) {
          selectCell(r, c);
          return;
        }
        r += dr;
        c += dc;
      }
    }
  };

  const restart = () => {
    setStage('intro');
    setLetters({});
    setLockedWords(new Set());
    setWrongCount(0);
    setWrongFlashWord(null);
    setSelected(null);
    setActiveDirection('across');
    flashingRef.current.clear();
  };

  const correctCount = lockedWords.size;
  const score = correctCount * 10;

  // ── GİRİŞ ──────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-6 sm:p-8 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Ekonomi Sözlüğü</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-4">
              Klasik bir çapraz bulmaca! Sağdaki ipuçlarını oku, karşılık gelen kavramı bulmacadaki kutucuklara
              yaz. Bir kelimeyi tamamen doldurduğunda otomatik olarak kontrol edilir: doğruysa kilitlenir ve
              yeşile döner, yanlışsa kutucuklar kısa bir uyarıyla boşalır ve tekrar deneyebilirsin.
            </p>
            <p className="text-slate-500 text-xs mb-6">
              İpucu: bir kutuya tıklayıp yazmaya başla, ok tuşlarıyla dolaş, aynı kutuya tekrar tıklayarak
              yatay/dikey yön değiştirebilirsin.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStage('playing')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg py-4 px-10 rounded-full shadow-xl border-b-4 border-purple-800 transition-all"
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
        ? { icon: '🌟', title: 'Harika İş!', sub: 'Ekonomi kavramlarına çok hakimsin.', grad: 'from-indigo-600 to-violet-500' }
        : wrongCount <= 6
        ? { icon: '👍', title: 'İyi İş!', sub: 'Biraz daha pratikle ustalaşırsın.', grad: 'from-blue-600 to-cyan-500' }
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
              <p className="text-white/60 text-xs font-bold mt-1">Doğru Kelime</p>
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

          <p className="text-white font-bold mb-6">🎉 Bulmacayı başarıyla tamamladın!</p>

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
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">📖</span>
          <span className="text-white font-black text-base">Ekonomi Sözlüğü</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 font-black text-xs px-3 py-1.5 rounded-full">
            Doğru Kelime: {correctCount} / {TOTAL_WORDS}
          </span>
          <span className="bg-red-400/20 border border-red-400/40 text-red-200 font-black text-xs px-3 py-1.5 rounded-full">
            Yanlış Deneme: {wrongCount}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* SOL: Bulmaca Izgarası */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex justify-center overflow-x-auto">
          <div
            className="inline-grid gap-[3px]"
            style={{
              gridTemplateRows: `repeat(${MAX_ROW - MIN_ROW + 1}, 34px)`,
              gridTemplateColumns: `repeat(${MAX_COL - MIN_COL + 1}, 34px)`,
            }}
          >
            {Array.from({ length: MAX_ROW - MIN_ROW + 1 }).map((_, ri) =>
              Array.from({ length: MAX_COL - MIN_COL + 1 }).map((_, ci) => {
                const row = MIN_ROW + ri;
                const col = MIN_COL + ci;
                const key = cellKey(row, col);
                const isCell = !!ANSWER_MAP[key];
                if (!isCell) {
                  return <div key={key} style={{ gridRow: ri + 1, gridColumn: ci + 1 }} />;
                }
                const number = NUMBER_MAP[key];
                const locked = isCellLocked(row, col, lockedWords);
                const inWrongFlash = wrongFlashWord !== null && wordCells(WORDS.find((w) => w.number === wrongFlashWord)!).some((c) => c.row === row && c.col === col);
                const isSelected = selected?.row === row && selected?.col === col;
                const isInActiveWord = activeWord ? wordCells(activeWord).some((c) => c.row === row && c.col === col) : false;

                return (
                  <div key={key} style={{ gridRow: ri + 1, gridColumn: ci + 1 }} className="relative">
                    {number && <span className="absolute top-0 left-0.5 text-[8px] font-black text-slate-500 z-10 leading-none">{number}</span>}
                    <motion.input
                      ref={(el) => {
                        inputRefs.current[key] = el;
                      }}
                      animate={inWrongFlash ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      type="text"
                      maxLength={1}
                      value={letters[key] || ''}
                      readOnly={locked}
                      onChange={(e) => handleChange(row, col, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(row, col, e)}
                      onFocus={() => selectCell(row, col)}
                      onClick={() => selectCell(row, col)}
                      className={`w-[34px] h-[34px] text-center font-black text-sm uppercase rounded-md border-2 outline-none transition-colors ${
                        locked
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-700 cursor-default'
                          : inWrongFlash
                          ? 'bg-red-100 border-red-400 text-red-700'
                          : isSelected
                          ? 'bg-indigo-100 border-indigo-500 text-slate-800'
                          : isInActiveWord
                          ? 'bg-indigo-50 border-indigo-200 text-slate-800'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: İpuçları */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5">
              <h3 className="text-white font-black text-sm">➡️ Soldan Sağa</h3>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {ACROSS_CLUES.map((w) => {
                const done = lockedWords.has(w.number);
                return (
                  <button
                    key={w.number}
                    onClick={() => jumpToWord(w)}
                    className={`text-left text-xs leading-relaxed p-2 rounded-lg border transition-colors ${
                      done
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 line-through'
                        : activeWord?.number === w.number
                        ? 'bg-indigo-50 border-indigo-300 text-slate-700'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-black mr-1">{w.number}.</span>
                    {w.clue}
                    {done && <span className="ml-1">✅</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5">
              <h3 className="text-white font-black text-sm">⬇️ Yukarıdan Aşağıya</h3>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {DOWN_CLUES.map((w) => {
                const done = lockedWords.has(w.number);
                return (
                  <button
                    key={w.number}
                    onClick={() => jumpToWord(w)}
                    className={`text-left text-xs leading-relaxed p-2 rounded-lg border transition-colors ${
                      done
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 line-through'
                        : activeWord?.number === w.number
                        ? 'bg-indigo-50 border-indigo-300 text-slate-700'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-black mr-1">{w.number}.</span>
                    {w.clue}
                    {done && <span className="ml-1">✅</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {wrongFlashWord !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-center"
          >
            <span className="inline-block bg-red-500 text-white font-black text-sm px-5 py-1.5 rounded-full shadow-lg">
              😅 Yanlış eşleştirme, tekrar dene!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
