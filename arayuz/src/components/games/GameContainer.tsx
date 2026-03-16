import React from 'react';
import FinancialDetectiveGame from './FinancialDetectiveGame';
// İleride buraya başka oyunlar da eklenecek (örn: DragDropGame)

interface GameContainerProps {
  gameCode: string;
  onComplete: (score: number) => void;
  onBack?: () => void; // Oyundan çıkıp listeye dönmek için
}

export default function GameContainer({ gameCode, onComplete, onBack }: GameContainerProps) {
  
  // Gelen oyun koduna göre ilgili React bileşenini seçiyoruz
  const renderGame = () => {
    switch (gameCode) {
      case 'financial_detective':
        return <FinancialDetectiveGame onComplete={onComplete} />;
      
      // İleride yeni oyunlar ekledikçe buraya case'ler eklenecek
      // case 'drag_drop_needs':
      //   return <DragDropNeedsGame onComplete={onComplete} />;
        
      default:
        return (
          <div className="p-10 text-center bg-red-50 text-red-600 rounded-xl border border-red-200">
            <h2 className="text-2xl font-bold mb-2">Oyun Bulunamadı!</h2>
            <p>Sistem "{gameCode}" kodlu oyunu bulamadı. Lütfen admin paneli ayarlarını kontrol edin.</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen py-6">
      {/* Üst Kısım: Geri Dön Butonu */}
      <div className="max-w-4xl mx-auto px-4 mb-4 flex justify-between items-center">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 transition-colors"
          >
            <span className="mr-2">←</span> Ders Listesine Dön
          </button>
        )}
        <div className="px-4 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">
          Etkileşimli Oyun Modu 🎮
        </div>
      </div>

      {/* Oyunun Kendisi */}
      {renderGame()}
    </div>
  );
}