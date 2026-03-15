import FinancialDetectiveGame from '../components/games/FinancialDetectiveGame';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <FinancialDetectiveGame 
        // alert'i sildik, yerine console.log koyduk
        onComplete={(puan: number) => console.log(`Oyun bitti, DB'ye gidecek puan: ${puan}`)} 
      />
    </div>
  );
}

export default App;