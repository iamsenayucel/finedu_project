import React, { useState } from 'react';

// TypeScript için Props (Dışarıdan gelen verilerin) tip tanımı
interface FinancialDetectiveGameProps {
  onComplete?: (score: number) => void;
}

const NEWS_DATA = [
  {
    id: 1,
    title: "Merkez Bankası Faiz Kararı",
    content: "Türkiye Cumhuriyet Merkez Bankası son Para Politikası Kurulu toplantısının ardından politika faizinin %45 seviyesinde sabit tutulduğunu açıkladı. Merkez Bankası tarafından yayımlanan resmi açıklamada enflasyonla mücadele kapsamında sıkı para politikasının sürdürüleceği ifade edildi.",
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
    title: "Yeni Yatırım Platformu Reklamı",
    content: "Bir internet sitesinde yayımlanan haberde 'CryptoMax yatırım platformu' tanıtılıyor. Haberde platformu kullanan herkesin çok kısa sürede yüksek kazanç elde ettiği ve sistemin yatırımcılara garanti gelir sağladığı iddia ediliyor. Ancak haberde herhangi bir finansal kurum, uzman görüşü veya resmi veri yer almıyor.",
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

// Bileşenimize tanımladığımız tipi (FinancialDetectiveGameProps) ekliyoruz
export default function FinancialDetectiveGame({ onComplete }: FinancialDetectiveGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<'reading' | 'analyzing' | 'classifying' | 'feedback' | 'finished'>('reading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  const currentNews = NEWS_DATA[currentIndex];

  const handleStartAnalysis = () => setStage('analyzing');

  // 'answer' parametresinin tipini string olarak belirtiyoruz
  const handleAnswerQuestion = (answer: string) => {
    const isCorrect = answer === currentNews.questions[currentQuestionIndex].expected;
    if (isCorrect) setScore(prev => prev + 10); 

    if (currentQuestionIndex < currentNews.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStage('classifying');
    }
  };

  // 'selectedClass' parametresinin tipini string olarak belirtiyoruz
  const handleClassification = (selectedClass: string) => {
    const isCorrect = selectedClass === currentNews.correctClass;
    if (isCorrect) setScore(prev => prev + 20);
    setStage('feedback');
  };

  const handleNextNews = () => {
    if (currentIndex < NEWS_DATA.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStage('reading');
      setCurrentQuestionIndex(0);
    } else {
      if (onComplete) onComplete(score);
      setStage('finished');
    }
  };

  if (stage === 'finished') {
    return (
      <div className="p-8 text-center bg-green-50 rounded-lg border-2 border-green-400">
        <h2 className="text-3xl font-bold text-green-700 mb-4">Tebrikler Dedektif! 🕵️‍♂️</h2>
        <p className="text-xl">Tüm haberleri başarıyla analiz ettin.</p>
        <p className="text-2xl font-bold mt-4">Toplam Puanın: {score}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <span className="font-bold text-gray-500">Haber Dosyası: {currentIndex + 1} / {NEWS_DATA.length}</span>
        <span className="font-bold text-blue-600">Puan: {score}</span>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-6 border-l-4 border-blue-500">
        <h3 className="text-2xl font-bold mb-3">{currentNews.title}</h3>
        <p className="text-gray-700 text-lg leading-relaxed">{currentNews.content}</p>
      </div>

      {stage === 'reading' && (
        <button onClick={handleStartAnalysis} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
          🔍 Analize Başla
        </button>
      )}

      {stage === 'analyzing' && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-lg font-bold mb-4">Soru {currentQuestionIndex + 1}: {currentNews.questions[currentQuestionIndex].text}</p>
          <div className="flex gap-4">
            <button onClick={() => handleAnswerQuestion('Evet')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg">Evet</button>
            <button onClick={() => handleAnswerQuestion('Hayır')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg">Hayır</button>
          </div>
        </div>
      )}

      {stage === 'classifying' && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <p className="text-lg font-bold mb-4">Analizini tamamladın. Sence bu haberin kaynağı nedir?</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => handleClassification('GÜVENİLİR')} className="bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 font-bold py-3 rounded-lg">✅ Güvenilir Kaynak</button>
            <button onClick={() => handleClassification('ŞÜPHELİ')} className="bg-white border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 font-bold py-3 rounded-lg">⚠️ Şüpheli Kaynak</button>
            <button onClick={() => handleClassification('MANİPÜLATİF')} className="bg-white border-2 border-red-500 text-red-700 hover:bg-red-50 font-bold py-3 rounded-lg">🚨 Manipülatif / Reklam</button>
          </div>
        </div>
      )}

      {stage === 'feedback' && (
        <div className="bg-gray-100 p-6 rounded-lg border border-gray-300 text-center">
          <h4 className="text-xl font-bold mb-3 text-gray-800">Sistem Geri Bildirimi</h4>
          <p className="text-lg text-gray-700 mb-6">{currentNews.feedback}</p>
          <button onClick={handleNextNews} className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition-colors">
            {currentIndex < NEWS_DATA.length - 1 ? 'Sonraki Habere Geç ➔' : 'Sonuçları Gör 🏆'}
          </button>
        </div>
      )}
    </div>
  );
}