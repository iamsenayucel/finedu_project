import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropNeedsGameProps {
  onComplete?: (score: number) => void;
}

// OYUN İÇERİKLERİ (PDF'e göre hazırlandı)
const ITEMS = [
  { id: 1, name: 'Ekmek', type: 'IHTIYAC', visual: '/games/ekmek.png', isImage: true },
  { id: 2, name: 'Çikolata', type: 'ISTEK', visual: '🍫', isImage: false },
  { id: 3, name: 'Kuruyemiş', type: 'HEM_IHTIYAC', visual: '/games/kuruyemis.jpg', isImage: true },
  { id: 4, name: 'Süt', type: 'IHTIYAC', visual: '🥛', isImage: false },
  { id: 5, name: 'Oyun Konsolu', type: 'ISTEK', visual: '🎮', isImage: false },
  { id: 6, name: 'Meyve', type: 'HEM_IHTIYAC', visual: '🍎', isImage: false },
];

export default function DragDropNeedsGame({ onComplete }: DragDropNeedsGameProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const currentItem = ITEMS[currentIndex];

  const startGame = () => setStage('playing');

  const handleSelection = (selectedType: string) => {
    if (feedback !== null) return; // Animasyon bitmeden tekrar tıklanmasın

    if (selectedType === currentItem.type) {
      setFeedback('correct');
      setScore(prev => prev + 10);
      
      // Mutlu ses efekti eklenebilir
      setTimeout(() => {
        setFeedback(null);
        nextItem();
      }, 1500);
    } else {
      setFeedback('wrong');
      // Yargılamayan geri bildirim
      setFeedbackMsg(
        selectedType === 'ISTEK' ? 'Bu bizim için bir ihtiyaç olabilir mi, tekrar düşün!' : 
        'Bu bizi çok mutlu eder ama yaşamak için her gün gerekli değildir. 😌'
      );
      
      setTimeout(() => {
        setFeedback(null);
      }, 3000); // 3 saniye hatayı göster, sonra tekrar denemesine izin ver
    }
  };

  const nextItem = () => {
    if (currentIndex < ITEMS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setStage('finished');
      if (onComplete) onComplete(score + 10); // Son sorunun puanıyla beraber bitir
    }
  };

  // --- GİRİŞ EKRANI ---
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center bg-teal-400">
        {/* Senin tasarımın olan arkaplanı buraya çağırıyoruz */}
        <div className="absolute inset-0 bg-[url('/games/intro-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-multiply"></div>
        
        <div className="relative z-10 text-center bg-white/90 p-10 rounded-3xl shadow-xl border-4 border-yellow-400">
          <h1 className="text-4xl md:text-5xl font-black text-teal-600 mb-4 tracking-tight">
            Gerekli mi, İstek mi? 🤔
          </h1>
          <p className="text-xl text-gray-600 mb-8 font-medium">
            Alışveriş sepetimizi doldururken doğru kararları verebilecek misin?
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-2xl font-black py-4 px-12 rounded-full shadow-lg border-b-4 border-yellow-600"
          >
            OYNA 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  // --- OYUN BİTİŞ EKRANI ---
  if (stage === 'finished') {
    return (
      <div className="w-full max-w-4xl mx-auto p-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl shadow-2xl text-center border-8 border-white">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-6">
          <img src="/games/akce.png" alt="Akçe" className="w-32 h-32 drop-shadow-2xl" />
        </motion.div>
        <h2 className="text-5xl font-black text-white mb-4 drop-shadow-md">Süper İş Çıkardın! 🌟</h2>
        <p className="text-2xl text-green-100 font-bold mb-8">İhtiyaçlarını ve isteklerini çok iyi biliyorsun.</p>
        <div className="inline-block bg-white text-teal-600 text-4xl font-black py-4 px-10 rounded-full shadow-xl">
          Kazanılan Puan: {score}
        </div>
      </div>
    );
  }

  // --- OYUN EKRANI ---
  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200">
      
      {/* Üst Bar: İlerleme ve Puan */}
      <div className="bg-white p-4 flex justify-between items-center border-b-2 border-slate-200">
        <div className="flex gap-2">
          {ITEMS.map((_, idx) => (
            <div key={idx} className={`h-3 w-8 rounded-full ${idx <= currentIndex ? 'bg-teal-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-400">
          <span className="text-xl">💰</span>
          <span className="text-xl font-black text-yellow-700">{score}</span>
        </div>
      </div>

      {/* Ana Oyun Alanı */}
      <div className="p-8 flex flex-col items-center min-h-[400px] relative">
        
        {/* Soru / Ürün Alanı */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="mb-12"
          >
            <div className={`w-48 h-48 bg-white rounded-3xl shadow-xl flex items-center justify-center p-4 border-4 
              ${feedback === 'correct' ? 'border-green-500 bg-green-50' : 
                feedback === 'wrong' ? 'border-red-500 bg-red-50' : 'border-white'}
            `}>
              {currentItem.isImage ? (
                <img src={currentItem.visual} alt={currentItem.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-8xl">{currentItem.visual}</span>
              )}
            </div>
            <h3 className="text-3xl font-black text-slate-700 text-center mt-6">{currentItem.name}</h3>
          </motion.div>
        </AnimatePresence>

        {/* Hata Mesajı Baloncuğu */}
        <AnimatePresence>
          {feedback === 'wrong' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-4 rounded-2xl shadow-2xl z-20 w-[80%] text-center text-xl font-bold border-4 border-white"
            >
              {feedbackMsg}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Doğru Mesajı Baloncuğu */}
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl z-20 drop-shadow-2xl"
            >
              ✅
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3 Büyük Buton (Dokunarak Seçim) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto">
          <motion.button 
            whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleSelection('IHTIYAC')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-3xl shadow-lg border-b-8 border-blue-700 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🛒</span>
            <span className="text-xl font-black">İHTİYAÇ</span>
          </motion.button>

          <motion.button 
            whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleSelection('HEM_IHTIYAC')}
            className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-3xl shadow-lg border-b-8 border-purple-700 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🥰</span>
            <span className="text-xl font-black text-center leading-tight">İHTİYAÇ VE<br/>MUTLULUK</span>
          </motion.button>

          <motion.button 
            whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleSelection('ISTEK')}
            className="bg-pink-500 hover:bg-pink-600 text-white p-6 rounded-3xl shadow-lg border-b-8 border-pink-700 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🎁</span>
            <span className="text-xl font-black">İSTEK</span>
          </motion.button>
        </div>

      </div>
    </div>
  );
}