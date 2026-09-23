import React, { lazy, Suspense } from 'react';

// Her oyun kendi chunk'ında lazy yükleniyor (MEASURED: statik import'larla bu
// dosya tek başına ~931KB'lık bir chunk'a giriyordu, bkz. AŞAMA 4 bundle
// analizi). Switch case yapısı ve her oyunun prop kontratı DEĞİŞMEDİ —
// yalnızca "ne zaman indirilir" değişti.
const FinancialDetectiveGame = lazy(() => import('./FinancialDetectiveGame'));
const DragDropNeedsGame = lazy(() => import('./DragDropNeedsGame'));
const RiskHunter = lazy(() => import('./RiskHunter'));
const RealDataHunter = lazy(() => import('./RealDataHunter'));
const SpaceShoppingDepot = lazy(() => import('./SpaceShoppingDepot'));
const RiskReturnTradeoff = lazy(() => import('./RiskReturnTradeoff'));
const EconomicTerms = lazy(() => import('./EconomicTerms'));
const MoneyFlow = lazy(() => import('./MoneyFlow'));
const RevenueMatching = lazy(() => import('./RevenueMatching'));
const FutureChoice = lazy(() => import('./FutureChoice'));
const InvestmentMethods = lazy(() => import('./InvestmentMethods'));
const ScamDetector = lazy(() => import('./ScamDetector'));
const FinancialConceptHunt = lazy(() => import('./FinancialConceptHunt'));
const FinancialSystemQuest2 = lazy(() => import('./FinancialSystemQuest2'));
const IncomeTypeAssessment = lazy(() => import('./IncomeTypeAssessment'));
const MediaLiteracyAssessment = lazy(() => import('./MediaLiteracyAssessment'));
const CreditCardAwareness = lazy(() => import('./CreditCardAwareness'));
const CreditCostAnalysis = lazy(() => import('./CreditCostAnalysis'));
const InvestmentOrConsumption = lazy(() => import('./InvestmentOrConsumption'));
const InformationFilter = lazy(() => import('./InformationFilter'));
const MarketDetective = lazy(() => import('./MarketDetective'));
const PortfolioMaster = lazy(() => import('./PortfolioMaster'));
const LegalInvestmentAssessment = lazy(() => import('./LegalInvestmentAssessment'));
const LegalInvestmentAssessment2 = lazy(() => import('./LegalInvestmentAssessment2'));
const EconomicGlossary = lazy(() => import('./EconomicGlossary'));
const MediaGlossaryPuzzle = lazy(() => import('./MediaGlossaryPuzzle'));
const IncomeGlossaryPuzzle = lazy(() => import('./IncomeGlossaryPuzzle'));
const RiskGlossaryPuzzle = lazy(() => import('./RiskGlossaryPuzzle'));
const CreditFinancingGlossaryPuzzle = lazy(() => import('./CreditFinancingGlossaryPuzzle'));
const FraudHuntGlossaryPuzzle = lazy(() => import('./FraudHuntGlossaryPuzzle'));
const LegalInvestmentGlossaryPuzzle = lazy(() => import('./LegalInvestmentGlossaryPuzzle'));
const DebtCreditAssessmentGame = lazy(() => import('./DebtCreditAssessmentGame'));
const DebtCreditAssessmentGame2 = lazy(() => import('./DebtCreditAssessmentGame2'));
const AssetLiabilityGlossaryPuzzle = lazy(() => import('./AssetLiabilityGlossaryPuzzle'));
const AssetIncomeExpenseAssessment = lazy(() => import('./AssetIncomeExpenseAssessment'));
const ShortLongTermImpact = lazy(() => import('./ShortLongTermImpact'));
const ShortLongTermGlossaryPuzzle = lazy(() => import('./ShortLongTermGlossaryPuzzle'));
const InvestmentConsumptionCaseAssessment = lazy(() => import('./InvestmentConsumptionCaseAssessment'));

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
      
      case 'drag_drop_needs':
        return <DragDropNeedsGame onComplete={onComplete} />;

      case 'risk_hunter':
        return <RiskHunter onComplete={onComplete} />;

      case 'real_data_hunter':
        return <RealDataHunter onComplete={onComplete} />;

      case 'space_shopping_depot':
        return <SpaceShoppingDepot onComplete={onComplete} />;

      case 'risk_return_tradeoff':
        return <RiskReturnTradeoff onComplete={onComplete} />;

      case 'economic_terms':
        return <EconomicTerms onComplete={onComplete} />;

      case 'money_flow':
        return <MoneyFlow onComplete={onComplete} />;

      case 'revenue_matching':
        return <RevenueMatching onComplete={onComplete} />;

      case 'future_choice':
        return <FutureChoice onComplete={onComplete} />;

      case 'investment_methods':
        return <InvestmentMethods onComplete={onComplete} />;

      case 'scam_detector':
        return <ScamDetector onComplete={onComplete} />;

      case 'financial_concept_hunt':
        return <FinancialConceptHunt onComplete={onComplete} onBack={onBack} />;

      case 'financial_system_concepts_2':
        return <FinancialSystemQuest2 onComplete={onComplete} onBack={onBack} />;

      case 'income_type_assessment':
        return <IncomeTypeAssessment onComplete={onComplete} onBack={onBack} />;

      case 'media_literacy_assessment':
        return <MediaLiteracyAssessment onComplete={onComplete} onBack={onBack} />;

      case 'credit_card_awareness':
        return <CreditCardAwareness onComplete={onComplete} onBack={onBack} />;

      case 'credit_cost_analysis':
        return <CreditCostAnalysis onComplete={onComplete} />;

      case 'investment_or_consumption':
        return <InvestmentOrConsumption onComplete={onComplete} onBack={onBack} />;

      case 'information_filter':
        return <InformationFilter onComplete={onComplete} onBack={onBack} />;

      case 'market_detective':
        return <MarketDetective onComplete={onComplete} onBack={onBack} />;

      case 'portfolio_master':
        return <PortfolioMaster onComplete={onComplete} onBack={onBack} />;

      case 'legal_investment_assessment':
        return <LegalInvestmentAssessment onComplete={onComplete} onBack={onBack} />;

      case 'legal_investment_assessment_2':
        return <LegalInvestmentAssessment2 onComplete={onComplete} onBack={onBack} />;

      case 'economic_glossary_match':
        return <EconomicGlossary onComplete={onComplete} onBack={onBack} />;

      case 'media_glossary_puzzle':
        return <MediaGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'income_glossary_puzzle':
        return <IncomeGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'risk_glossary_puzzle':
        return <RiskGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'credit_financing_glossary_puzzle':
        return <CreditFinancingGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'fraud_hunt_glossary_puzzle':
        return <FraudHuntGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'legal_investment_glossary_puzzle':
        return <LegalInvestmentGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'debt_credit_assessment':
        return <DebtCreditAssessmentGame onComplete={onComplete} onBack={onBack} />;

      case 'debt_credit_assessment_2':
        return <DebtCreditAssessmentGame2 onComplete={onComplete} onBack={onBack} />;

      case 'asset_liability_glossary_puzzle':
        return <AssetLiabilityGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'asset_income_expense_assessment':
        return <AssetIncomeExpenseAssessment onComplete={onComplete} onBack={onBack} />;

      case 'short_long_term_impact':
        return <ShortLongTermImpact onComplete={onComplete} onBack={onBack} />;

      case 'short_long_term_glossary_puzzle':
        return <ShortLongTermGlossaryPuzzle onComplete={onComplete} onBack={onBack} />;

      case 'investment_consumption_case_assessment':
        return <InvestmentConsumptionCaseAssessment onComplete={onComplete} onBack={onBack} />;

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
      <Suspense fallback={<div className="p-10 text-center text-slate-500">Oyun yükleniyor...</div>}>
        {renderGame()}
      </Suspense>
    </div>
  );
}