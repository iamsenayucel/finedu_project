// 1. DÜZELTME: ./ yerine ../ kullanarak bir üst klasöre çıktık
import FinancialDetectiveGame from '../components/games/FinancialDetectiveGame';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 py-10">
      
      {/* 2. DÜZELTME: puan kelimesinin yanına : number yazarak tipini belirttik */}
      <FinancialDetectiveGame 
        onComplete={(puan: number) => alert(`Oyun bitti! Kazanılan Puan: ${puan}`)} 
      />

    </div>
  );
}

export default App;