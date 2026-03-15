import React, { useState } from 'react';

interface FinancialDetectiveGameProps {
  onComplete?: (score: number) => void;
}

// Hafıza için Tip Tanımlamaları
interface AnswerHistory {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface NewsHistory {
  newsTitle: string;
  answers: AnswerHistory[];
  classification: {
    userClass: string;
    correctClass: string;
    isCorrect: boolean;
  };
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

export default function FinancialDetectiveGame({ onComplete }: FinancialDetectiveGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<'reading' | 'analyzing' | 'classifying' | 'feedback' | 'finished'>('reading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  // KULLANICI YANITLARINI TUTAN YENİ HAFIZA STATE'LERİ
  const [currentAnswers, setCurrentAnswers] = useState<AnswerHistory[]>([]);
  const [gameHistory, setGameHistory] = useState<NewsHistory[]>([]);

  const currentNews = NEWS_DATA[currentIndex];

  const handleStartAnalysis = () => {
    setStage('analyzing');
    setCurrentAnswers([]); // Yeni habere geçerken geçici hafızayı sıfırla
  };

  const handleAnswerQuestion = (answer: string) => {
    const currentQ = currentNews.questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.expected;

    if (isCorrect) setScore(prev => prev + 10);

    // Öğrencinin yanıtını hafızaya ekle
    setCurrentAnswers(prev => [...prev, {
      questionText: currentQ.text,
      userAnswer: answer,
      correctAnswer: currentQ.expected,
      isCorrect: isCorrect
    }]);

    if (currentQuestionIndex < currentNews.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStage('classifying');
    }
  };

  const handleClassification = (selectedClass: string) => {
    const isCorrect = selectedClass === currentNews.correctClass;
    if (isCorrect) setScore(prev => prev + 20);

    // Bu haberin tam raporunu ana hafızaya (Korneye) kaydet
    setGameHistory(prev => [...prev, {
      newsTitle: currentNews.title,
      answers: currentAnswers,
      classification: {
        userClass: selectedClass,
        correctClass: currentNews.correctClass,
        isCorrect: isCorrect
      }
    }]);

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

  // --- YENİ EKLENEN MUHTEŞEM SONUÇ EKRANI (KARNE) ---
  if (stage === 'finished') {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        
        {/* Karne Başlığı */}
        <div className="text-center mb-10 pb-6 border-b-2 border-dashed border-gray-200">
          <h2 className="text-4xl font-extrabold text-slate-800 mb-3">Görev Raporu 🕵️‍♂️</h2>
          <p className="text-lg text-slate-500 mb-6">İncelediğin tüm haberlerin detaylı analizi aşağıdadır.</p>
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-3xl font-black py-4 px-10 rounded-full shadow-lg">
            Toplam Puan: {score}
          </div>
        </div>

        {/* Haberlerin Detaylı Listesi */}
        <div className="space-y-8">
          {gameHistory.map((historyItem, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <h3 className="text-2xl font-bold text-slate-800 mb-5 pb-2 border-b border-slate-200">
                📄 {historyItem.newsTitle}
              </h3>

              {/* Soru Detayları */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-600 mb-3 uppercase tracking-wider text-sm">Soru Analizleri</h4>
                <ul className="space-y-3">
                  {historyItem.answers.map((ans, aIdx) => (
                    <li key={aIdx} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-slate-700 font-medium flex-1 mb-2 sm:mb-0 pr-4">{ans.questionText}</span>
                      <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                        <span className="text-sm text-slate-500">Senin Yanıtın: 
                          <strong className={`ml-1 ${ans.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{ans.userAnswer}</strong>
                        </span>
                        {ans.isCorrect ? (
                          <span className="text-green-500 font-bold bg-green-100 p-1 rounded-full">✅</span>
                        ) : (
                          <span className="text-red-500 text-sm font-bold bg-red-100 px-2 py-1 rounded">❌ Doğrusu: {ans.correctAnswer}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sınıflandırma Detayı */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center">
                <span className="font-bold text-blue-800 mb-2 sm:mb-0">Haberin Gerçek Türü:</span>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-md border border-blue-200 shadow-sm">
                  <span className="text-sm text-slate-600">Seçimin: 
                    <strong className={`ml-1 ${historyItem.classification.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {historyItem.classification.userClass}
                    </strong>
                  </span>
                  {historyItem.classification.isCorrect ? (
                    <span className="text-green-500 font-bold bg-green-100 p-1 rounded-full">✅</span>
                  ) : (
                    <span className="text-red-500 text-sm font-bold bg-red-100 px-2 py-1 rounded">❌ Doğrusu: {historyItem.classification.correctClass}</span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- OYUNUN KENDİ ARAYÜZÜ (DEĞİŞMEDİ) ---
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