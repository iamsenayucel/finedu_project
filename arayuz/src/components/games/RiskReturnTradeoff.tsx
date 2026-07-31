import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Award } from 'lucide-react';

interface RiskReturnTradeoffProps {
  onComplete?: (score: number) => void;
}

// ─── VERİ ─────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 1,
    image: '/games/RiskReturnTradeoff/1.jpeg',
    question: 'Sence şu an nasıl bir piyasa durumunun içindeyiz?',
    choices: [
      { id: 'A', text: 'İyimser (Boğa Piyasası)', sub: 'Fiyatlar artıyor, her şey yolunda. Tam yatırım zamanı!' },
      { id: 'B', text: 'Kötümser (Ayı Piyasası)', sub: 'Fiyatlar sürekli düşüyor, piyasada korku hakim.' },
      { id: 'C', text: 'Durgun (Yatay Trend)', sub: 'Piyasada yaprak kımıldamıyor, fiyatlar sabit.' },
    ],
    correct: 'A',
    feedbacks: {
      A: { icon: '🌟', title: 'Doğru Teşhis!', type: 'correct', text: 'Coşkulu bir "Boğa Piyasası"nın tam ortasındayız. Herkes kazanıyor, dışarıda tam bir para yağmuru var. Şimdi dümende sen varsın...' },
      B: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Grafiklere bak: fiyatlar yükseliyor, haberler coşkulu. Bu bir Boğa Piyasası.' },
      C: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Piyasa "yatay" değil, roket gibi yukarı çıkıyor. Tekrar incele!' },
    },
  },
  {
    id: 2,
    image: '/games/RiskReturnTradeoff/2.jpeg',
    question: 'Piyasanın "Boğa" (Yükseliş) trendinde olduğunu doğru bildin. Ama çok büyük bir krizimiz var: Sana miras kalan portföyün %80\'i şu an kasada nakit olarak yatıyor! Dışarıdaki devasa kazanç trenini kaçırıyorsun. Portföyün bu haldeyken ve piyasa roket gibi uçarken, ne yapmalısın?',
    choices: [
      { id: 'A', text: 'HÜCUM (Riski Artır)', sub: '"Güvenli kasanın kilidini kır! Nakitin bir kısmıyla hemen teknoloji ve şirket hisseleri AL. Bu rüzgarı kaçıramam!"' },
      { id: 'B', text: 'İZLEYİCİ KAL (Koru)', sub: '"Korkuyorum. Portföy böyle kalsın, başkalarının zengin olmasını uzaktan izleyeyim."' },
      { id: 'C', text: 'PANİK (Sat)', sub: '"Bu yükseliş yalan! Elimdeki o küçücük %20\'lik hisseyi de sat, %100 nakite geçip sığınağa gir."' },
    ],
    correct: 'A',
    feedbacks: {
      A: { icon: '🏆', title: 'HARİKA: FIRSATI KAÇIRMADIN!', type: 'correct', text: '"Fırsat Maliyeti" tuzağına düşmedin. Piyasa coşkuyla yükselirken paranı yastık altında tutmak yerine yatırıma yönlendirerek paranı çalıştırdın. Harika bir hamle! 🎖️ Fırsat Avcısı Rozeti kazanıldı!' },
      B: { icon: '❌', title: 'FIRSAT KAÇTI! (Korkaklık)', type: 'wrong', text: 'Güvenli limanda kalmak kriz anlarında iyidir ama dışarıda para yağmuru varken sığınakta beklemek sana sadece zaman kaybettirir. Paran enflasyon ve artan fiyatlar karşısında alım gücünü eritiyor. Çok pasif kaldın!' },
      C: { icon: '🚨', title: 'KRİTİK HATA! (Aşırı Korku)', type: 'critical', text: 'Trendin tamamen tersine hareket ettin! Coşkulu piyasada panikle nakite geçmek, seni kâr partisinin dışına itti. İyi bir yatırımcı mantıkla hareket eder, vesveseyle değil!' },
    },
  },
  {
    id: 3,
    image: '/games/RiskReturnTradeoff/3.jpeg',
    question: 'Sence şu an nasıl bir piyasa durumunun içindeyiz?',
    choices: [
      { id: 'A', text: 'İyimser (Boğa Piyasası)', sub: 'Fiyatlar artıyor, her şey yolunda. Tam yatırım zamanı!' },
      { id: 'B', text: 'Kötümser (Ayı Piyasası)', sub: 'Fiyatlar sürekli düşüyor, piyasada korku hakim.' },
      { id: 'C', text: 'Durgun (Yatay Trend)', sub: 'Piyasada yaprak kımıldamıyor, fiyatlar sabit.' },
    ],
    correct: 'B',
    feedbacks: {
      A: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Haberlere bak: fabrikalar duruyor, teknoloji şirketleri kâr uyarısı yapıyor. Bu bir Boğa Piyasası değil.' },
      B: { icon: '📉', title: 'Doğru Teşhis!', type: 'correct', text: 'Maalesef "Ayı Mevsimi"nin tam ortasındayız. Fırtına bulutları toplandı, fabrikalar üretimi durduruyor ve teknoloji devleri kâr uyarısı yapıyor. #BorsaÇöküyor etiketi zirvede ve herkes "Panik Butonu"na basmış durumda. Trend kesinlikle AŞAĞI yönlü ve endeksler kırmızıya boyandı. Şimdi bu fırtınada dümende sen varsın, portföyünü korumak için ne yapacaksın?' },
      C: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Piyasa yatay seyretmiyor, sert düşüyor. Grafiklerdeki kırmızı oklara dikkat et!' },
    },
  },
  {
    id: 4,
    image: '/games/RiskReturnTradeoff/4.jpeg',
    question: 'Piyasanın "Ayı" (Düşüş) trendinde olduğunu ve fırtınanın sertleştiğini doğru bildin. Ancak portföyünün %90\'ı hisse senetlerinde yakalandı ve her saniye eriyor! Üstelik bu düşüşü fırsata çevirecek nakitin (Güvenli Kasa) sadece %10 seviyesinde. Ne yapmalısın?',
    choices: [
      { id: 'A', text: 'TEDBİRLİ (Riski Yönet)', sub: '"Zararın neresinden dönülse kârdır! En çok düşen riskli hisselerden bir kısmını satarak nakit oranını artır. Portföyü hayatta tut!"' },
      { id: 'B', text: 'PASİF (Hareketsiz Kal)', sub: '"Ekranı kapatıp bakmayacağım. Portföy olduğu gibi kalsın, elbet bir gün yükselir. Bu sırada paranın erimesini izle."' },
      { id: 'C', text: 'GÖZÜ KARA (Tehlikeli Hamle)', sub: '"Kalan son %10 nakitini de düşen hisselere yatır! Nasılsa çok düştü, \'buradan dönerse çok kazanırım\' diyerek tüm kurşunlarını harca!"' },
    ],
    correct: 'A',
    feedbacks: {
      A: { icon: '🛡️', title: 'TEBRİKLER: LİKİDİTEYİ KURTARDIN!', type: 'correct', text: '"Yüksek Risk Tuzağı"ndan kaçmayı başardın. Sert düşüşlerde hisse azaltıp nakit artırmak sermayeni korur. Fırtına dindiğinde, elindeki nakitle "ucuzlamış" sağlam şirketleri almak için artık gücün var!' },
      B: { icon: '📉', title: 'HASAR BÜYÜYOR! (Pasiflik Tuzağı)', type: 'wrong', text: 'Yatırımda "bakmazsam düşmez" mantığı seni korumaz. Portföyünün %90\'ı erirken müdahale etmemek, sermayeni fırtınaya kurban etmektir. Toparlanma başladığında yatırım yapacak sermayen kalmamış olabilir.' },
      C: { icon: '🚨', title: 'KRİTİK HATA! (Düşen Bıçak)', type: 'critical', text: 'Finans dünyasında buna "Düşen bıçağı tutmaya çalışmak" denir. Piyasa sert düşerken eldeki son nakiti de tehlikeye atmak rasyonel bir strateji değil, riskli bir duygusal karardır. Nakitini (likiditeni) sıfırladın ve piyasanın insafına kaldın!' },
    },
  },
  {
    id: 5,
    image: '/games/RiskReturnTradeoff/5.jpeg',
    question: 'Sence şu an nasıl bir piyasa durumunun içindeyiz?',
    choices: [
      { id: 'A', text: 'İyimser (Boğa Piyasası)', sub: 'Fiyatlar hızla artıyor, herkes coşkulu ve sürekli yeni alımlar yapıyor.' },
      { id: 'B', text: 'Kötümser (Ayı Piyasası)', sub: 'Fiyatlar sürekli düşüyor, piyasada korku hakim ve herkes kaçmaya çalışıyor.' },
      { id: 'C', text: 'Durgun (Yatay Trend)', sub: 'Fiyatlar belirli bir sınır içinde sıkışmış durumda. Piyasada yaprak kımıldamıyor, ne net bir yükseliş ne de düşüş var.' },
    ],
    correct: 'C',
    feedbacks: {
      A: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Haberlere bak: "Büyük Sessizlik", "Duraklama Dönemi". Coşkulu bir Boğa Piyasası değil bu.' },
      B: { icon: '❌', title: 'Yanlış Teşhis', type: 'wrong', text: 'Panik yok, büyük düşüş yok. Piyasa sıkıcı ama istikrarlı. Bu bir Ayı Piyasası değil.' },
      C: { icon: '🌟', title: 'Doğru Teşhis!', type: 'correct', text: 'Sıkıcı ama bir o kadar da kritik bir "Yatay Piyasa"nın tam ortasındayız. Ekranda fiyatlar sadece yana doğru sürükleniyor. Acemi yatırımcılar sıkıntıdan patlayıp heyecan aramak için yanlış hamleler yaparken, usta yatırımcılar pusuya yatıp nakit biriktiriyor. Şimdi dümende sen varsın... Sabrını mı konuşturacaksın, yoksa can sıkıntısına yenik mi düşeceksin?' },
    },
  },
  {
    id: 6,
    image: '/games/RiskReturnTradeoff/6.jpeg',
    question: 'Piyasanın "Durgun" (Yatay) bir dönemde olduğunu doğru analiz ettin. Aylardır grafikler neredeyse düz bir çizgi halinde ilerliyor. Mevcut portföyün ikiye bölünmüş: Yarısı kasada nakit bekliyor, diğer yarısı sana düzenli küçük ama garanti ödemeler yapan "temettü" hisselerinde. Sosyal medyada herkes "Nova-X" adlı yeni projeyi konuşuyor — sadece birkaç günde %150 değer kazanmış. Ne yapmalısın?',
    choices: [
      { id: 'A', text: 'HÜCUM', sub: '"Düzenli ödeme yapan kasamı (temettü hisselerimi) bozup, elimdeki tüm nakitle birlikte Nova-X\'e girmeliyim. Herkes kazanırken bu fırsatı kaçıramam."' },
      { id: 'B', text: 'İZLEYİCİ KAL', sub: '"Düzenli ödeme yapan temettü hisselerimi tutmaya devam edeyim. Oradan gelen harçlıkları da nakit kısmına ekleyip, piyasada gerçek ve sürdürülebilir bir fırsat görene kadar bekleyeyim."' },
      { id: 'C', text: 'PANİK', sub: '"Piyasadaki bu sessizlik ve Nova-X gibi mantıksız yükselişler beni huzursuz etti. Kesin büyük bir kriz patlayacak. Temettü hisselerini de satıp %100 nakite geçmeli ve dışarıdan izlemeliyim."' },
    ],
    correct: 'B',
    feedbacks: {
      A: { icon: '🚨', title: 'FOMO TUZAĞINA DÜŞTÜN! (Fırsatı Kaçırma Korkusu)', type: 'critical', text: 'Sırf başkaları kazanıyor diye, sana düzenli gelir sağlayan çalışan bir sistemi bozdun. Nova-X gibi hızlı parlayan varlıklar, sen tam en tepeden aldığında genellikle sert düşüşe geçer. Elindeki güvenli gelirden de oldun!' },
      B: { icon: '🏆', title: 'SABRIN ZAFERİ!', type: 'correct', text: 'Sosyal medyadaki gürültüye kulak asmadın ve stratejine sadık kaldın. Durgun piyasalarda "Temettü" senin en iyi dostundur; sen hiçbir şey yapmasan da sana para kazandırır. Bu sabrın sayesinde, piyasa gerçekten yönünü belli ettiğinde elinde harika bir nakit gücü olacak! 🎖️ Soğukkanlı Yatırımcı Rozeti kazanıldı!' },
      C: { icon: '❌', title: 'GEREKSİZ TELAŞ!', type: 'wrong', text: 'Ortada somut bir kriz yokken, sırf piyasa sıkıcı ve tuhaf hissettiriyor diye sana düzenli ödeme yapan güvenli kasanın kilidini kırdın. %100 nakite geçerek, o durgun aylarda kazanabileceğin tüm garanti geliri çöpe atmış oldun.' },
    },
  },
];

const MAX_SCORE = QUESTIONS.length * 10;

// ─── YARDIMCI ─────────────────────────────────────────────────────────────────

function choiceStyle(id: string, selected: string | null, correct: string) {
  if (!selected) return 'border-slate-600 bg-slate-800/60 hover:border-indigo-400 hover:bg-indigo-900/40 cursor-pointer';
  if (id === correct) return 'border-emerald-400 bg-emerald-900/50 cursor-default';
  if (id === selected && id !== correct) return 'border-red-500 bg-red-900/40 cursor-default';
  return 'border-slate-700 bg-slate-800/30 opacity-40 cursor-default';
}

function choiceLetter(id: string, selected: string | null, correct: string) {
  if (!selected) return { bg: 'bg-slate-700 text-slate-300', icon: id };
  if (id === correct) return { bg: 'bg-emerald-500 text-white', icon: '✓' };
  if (id === selected) return { bg: 'bg-red-500 text-white', icon: '✗' };
  return { bg: 'bg-slate-700 text-slate-500', icon: id };
}

// ─── Yan panel verisi ─────────────────────────────────────────────────────────
const MIRAS_PANELS = [
  {
    dictionary: [
      { term: 'Boğa Piyasası', def: 'Fiyatların sürekli yükseldiği, yatırımcıların aşırı iyimser olduğu ve sürekli alım yaptığı piyasa dönemidir.' },
      { term: 'Faiz İndirimi', def: 'Merkez bankasının paranın maliyetini düşürmesidir. İnsanlar bankaya para yatırmak yerine borsaya veya ticarete yönelir, piyasa canlanır.' },
      { term: 'Tarihi Zirve', def: 'Bir endeksin (örn: BİST 100) bugüne kadar ulaştığı en yüksek puan veya fiyat seviyesidir.' },
    ],
    strategyTitle: 'Dedektif Köşesi',
    strategyTips: [
      { title: 'Coşkulu Başlıklar', desc: '"Rekor", "Zirve", "Para Yağmuru" kelimeleri piyasanın adeta bir parti havasında olduğunu gösterir.' },
      { title: 'Grafik Yönü', desc: 'Ekranda roketler uçuşuyor ve trend çizgisi net bir şekilde "Yukarı"yı gösteriyor.' },
      { title: 'Uzman Psikolojisi', desc: 'Sosyal medyadaki "Herkes kazanıyor, sen neredesin?" baskısı, tam bir boğa piyasası (FOMO) işaretidir.' },
    ],
  },
  {
    dictionary: [
      { term: '💼 Güvenli Kasa (%80)', def: 'Paran sadece yatar. Düşmez ama yükselen enflasyon ve piyasa karşısında erir (Fırsat Maliyeti).' },
      { term: '💼 Dengeli Şirket (%10)', def: 'Sağlam adımlarla büyüyen, güvenilir şirket hisseleridir.' },
      { term: '💼 Uçuş Teknolojileri (%10)', def: 'Piyasayı yukarı taşıyan ana motordur. En çok kazandıran ama aynı zamanda en riskli olan gruptur.' },
    ],
    strategyTitle: 'Boğa Piyasasında Ne Yapmalı?',
    strategyTips: [
      { title: 'Fırsat Maliyetinden Kaç', desc: "Dışarıda para yağarken, paranın %80'ini kasada uyutmak en büyük zarardır. Rüzgarı arkana al." },
      { title: 'Hücuma Geç (Riski Artır)', desc: 'Güvenli kasanın kilidini kırmalısın. Nakdin bir kısmıyla hemen yükselen trende (teknoloji ve şirket hisselerine) katıl.' },
      { title: 'Panik Yapma, Satma', desc: '"Bu yükseliş yalan" diyerek elindeki hisseyi satıp tamamen nakde geçmek, seni bu coşkulu partinin tamamen dışına atar.' },
    ],
  },
  {
    dictionary: [
      { term: 'Ayı Piyasası', def: 'Fiyatların sürekli düştüğü, karamsarlığın hakim olduğu ve yatırımcıların panikle kaçtığı piyasa dönemidir.' },
      { term: 'Panik Satışı', def: '"Daha da düşecek" korkusuyla mantıksızca her şeyi zararına satmasıdır.' },
      { term: 'Kurşun Kalmadı (Likidite Krizi)', def: 'Piyasada nakit paranın (kurşunun) tükenmesi, kimsenin alım yapacak gücünün kalmaması durumudur.' },
    ],
    strategyTitle: 'Dedektif Köşesi',
    strategyTips: [
      { title: 'Korku Manşetleri', desc: '"Çöküş", "Sıfırlanıyoruz", "Sert Çakıldı" kelimeleri sistemde büyük bir kriz olduğunu haykırıyor.' },
      { title: 'Grafik Yönü', desc: 'Tüm endeksler kırmızıya boyanmış (Örn: NASDAQ -%12.30) ve oklar şelale gibi aşağı iniyor.' },
      { title: 'Uzman Uyarısı', desc: '"Düzeltme değil, tam bir çöküş" ifadesi, bu düşüşün kısa süreli olmadığını kanıtlar.' },
    ],
  },
  {
    dictionary: [
      { term: '💼 Güvenli Kasa (%10)', def: 'Kriz anlarında cankurtaran simidindir, ancak sende şu an çok az var.' },
      { term: '💼 Dengeli Şirket (%40)', def: 'Sağlam olsalar da genel piyasa çöküşünden onlar da yara alır ve erir.' },
      { term: '💼 Uçuk Teknoloji (%50)', def: 'Krizlerde en hızlı çakılan, en çok değer kaybeden riskli varlıklardır.' },
    ],
    strategyTitle: 'Ayı Piyasasında Ne Yapmalı?',
    strategyTips: [
      { title: 'Zararın Neresinden Dönülse Kârdır', desc: "Portföyün %90'ı eriyen varlıklarda! Bekleyip \"Elbet yükselir\" demek paranı sıfırlayabilir." },
      { title: 'Nakit Oranını Artır (Tedbir Al)', desc: 'En çok düşen uçuk teknolojilerden bir kısmını satarak kasadaki nakit (kurşun) miktarını artırmalısın.' },
      { title: 'Kahramanlık Yapma (Gözü Kara Olma)', desc: 'Kalan son %10 nakitini de "Nasılsa çok düştü" diyerek batan gemiye yatırmak, tüm cephaneni çöpe atmaktır.' },
    ],
  },
  {
    dictionary: [
      { term: 'Yatay Trend', def: 'Fiyatların belirli bir sınır içinde sıkıştığı, ne net bir yükselişin ne de net bir düşüşün olduğu sıkıcı dönemdir.' },
      { term: 'FOMO (Fırsatı Kaçırma Korkusu)', def: '"Herkes kazanıyor ben geri kaldım" korkusuyla aniden parlayan bir şeye para yatırma psikolojisidir.' },
      { term: 'Pasif Gelir (Temettü)', def: 'Sen uyurken bile, şirketlerin kârından sana düzenli olarak ödediği yorulmadan kazanılan paradır.' },
    ],
    strategyTitle: 'Dedektif Köşesi',
    strategyTips: [
      { title: 'Uyku Modu', desc: '"Büyük Sessizlik", "Duraklama" kelimeleri ve esneyen yatırımcı görseli piyasanın uykuda olduğunu gösterir.' },
      { title: 'Grafik Yönü', desc: 'Çizgiler hastanedeki düz kalp atışı (EKG) cihazı gibi, hiçbir hareket yok.' },
      { title: 'Uzman Tavsiyesi', desc: '"Sıkıntıdan işlem yapmayın, portföyü eritmeyin" uyarısı, hareketsiz kalmanın şu an en iyi hareket olduğunu söyler.' },
    ],
  },
  {
    dictionary: [
      { term: '💼 Temettü Hisseleri (%50)', def: 'Fiyatı artmasa da sana düzenli olarak nakit harçlık (pasif gelir) ödeyen altın yumurtlayan tavuklardır.' },
      { term: '💼 Güvenli Kasa (%40)', def: 'Piyasada gerçek bir fırsat (düşüş veya yükseliş) çıktığında kullanmak üzere pusuya yatmış nakit cephanen.' },
      { term: '💼 Macera Fonu / Nova-X (Tuzak)', def: 'Yatay piyasanın sıkıntısından doğan, bir anda %150 artan ama altı boş, aşırı riskli ve spekülatif bir tuzaktır.' },
    ],
    strategyTitle: 'Durgun Piyasada Ne Yapmalı?',
    strategyTips: [
      { title: 'Altın Yumurtlayan Tavuğu Kesme', desc: 'Düzenli ödeme yapan temettü hisselerini satıp, geçici heveslere (Nova-X) girmek elindeki hazır geliri yok eder.' },
      { title: 'Sabırlı Ol, İzleyici Kal', desc: 'Temettü hisselerini tut. Oradan gelen harçlıkları kasaya ekle ve piyasada gerçek bir yön oluşana kadar bekle.' },
      { title: 'Sıkıntıdan Panikleme', desc: 'Piyasada hiçbir şey olmuyor diye huzursuzlanıp tüm portföyü bozmak, acemi yatırımcıların yaptığı en büyük hatadır.' },
    ],
  },
];

// ─── ANA BİLEŞEN ──────────────────────────────────────────────────────────────

export default function RiskReturnTradeoff({ onComplete }: RiskReturnTradeoffProps) {
  const [stage, setStage] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const question = QUESTIONS[qIndex];

  const handleSelect = (id: string) => {
    if (selected) return;
    setSelected(id);
    setShowFeedback(true);
    if (id === question.correct) setScore(s => s + 10);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelected(null);
    if (qIndex >= QUESTIONS.length - 1) {
      setStage('finished');
      if (onComplete) onComplete(score + (selected === question.correct ? 0 : 0));
    } else {
      setQIndex(i => i + 1);
    }
  };

  const handleNextAfterScore = () => {
    const finalScore = score;
    setShowFeedback(false);
    setSelected(null);
    if (qIndex >= QUESTIONS.length - 1) {
      setStage('finished');
      if (onComplete) onComplete(finalScore);
    } else {
      setQIndex(i => i + 1);
    }
  };

  const restart = () => {
    setStage('intro');
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setShowFeedback(false);
  };

  const feedback = selected ? question.feedbacks[selected as keyof typeof question.feedbacks] : null;

  // ── GİRİŞ ────────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    const introPanel = MIRAS_PANELS[0];
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
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

                <div className="p-10 text-center">
                  <div className="flex justify-center items-center gap-3 mb-6">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                      <TrendingUp className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="w-20 h-20 bg-violet-600/20 rounded-2xl flex items-center justify-center border border-violet-500/30">
                      <Target className="w-10 h-10 text-violet-400" />
                    </div>
                    <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Award className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>

                  <h1 className="text-4xl font-black text-white mb-2">Mirasın Kaderi</h1>
                  <p className="text-slate-400 text-sm uppercase tracking-widest mb-6">Finansal Karar Simülasyonu</p>

                  <div className="bg-slate-700/50 rounded-2xl p-6 mb-8 border border-slate-600/50 text-left max-w-xl mx-auto">
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      <span className="text-white font-bold">Görevin:</span> Piyasa koşullarını doğru analiz et ve portföyünü akıllıca yönet. Her karar seni ya kazanca taşır ya da zarara uğratır.
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        'Piyasa haberini oku ve analiz et',
                        'Mevcut piyasa trendini teşhis et',
                        'Portföyün için doğru hamleyi yap',
                        'Rozetini kazan ve skoru yükselt',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mb-8 text-slate-400 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{QUESTIONS.length}</div>
                      <div>Karar</div>
                    </div>
                    <div className="w-px h-8 bg-slate-600" />
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{MAX_SCORE}</div>
                      <div>Maks. Puan</div>
                    </div>
                    <div className="w-px h-8 bg-slate-600" />
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">2</div>
                      <div>Rozet</div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setStage('playing')}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xl py-4 px-14 rounded-full shadow-xl border-b-4 border-violet-800"
                  >
                    OYUNA BAŞLA 🚀
                  </motion.button>
                </div>

                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
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

  // ── BİTİŞ ────────────────────────────────────────────────────────────────────
  if (stage === 'finished') {
    const pct = Math.round((score / MAX_SCORE) * 100);
    const perf = pct === 100
      ? { icon: '🏆', title: 'Efsanevi Yatırımcı!', sub: 'Tüm kararları mükemmel verdin. Portföy sende güvende!', color: 'from-yellow-600 to-amber-500' }
      : pct >= 66
      ? { icon: '🌟', title: 'Tecrübeli Analist', sub: 'Büyük çoğunluğu doğru okudun. Küçük hatalar öğreticidir.', color: 'from-indigo-600 to-violet-500' }
      : pct >= 33
      ? { icon: '📘', title: 'Gelişen Yatırımcı', sub: 'İyi bir başlangıç! Piyasa okuma becerini geliştirmeye devam et.', color: 'from-blue-600 to-cyan-500' }
      : { icon: '💪', title: 'Piyasa Acemisi', sub: 'Henüz başlangıçsın. Her hata seni daha iyi bir yatırımcı yapar!', color: 'from-slate-600 to-slate-500' };

    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-br ${perf.color} rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full bg-white/10"
                style={{ width: Math.random() * 80 + 20, height: Math.random() * 80 + 20, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }} />
            ))}
          </div>
          <div className="relative z-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="text-7xl mb-4">{perf.icon}</motion.div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{perf.title}</h2>
            <p className="text-white/80 text-base mb-6 max-w-sm mx-auto">{perf.sub}</p>

            {/* Puan göstergesi */}
            <div className="inline-flex flex-col items-center bg-black/25 rounded-2xl px-8 py-4 mb-6">
              <span className="text-5xl font-black text-white">{score}</span>
              <span className="text-white/60 text-sm font-bold">/ {MAX_SCORE} puan</span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto bg-black/20 rounded-full h-3 mb-8">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-3 rounded-full bg-white/70" />
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="bg-white/20 hover:bg-white/30 text-white font-black py-3 px-10 rounded-full border-2 border-white/30 text-lg backdrop-blur">
              Tekrar Oyna 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── OYUN ─────────────────────────────────────────────────────────────────────
  const panel = MIRAS_PANELS[qIndex];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">

        {/* Left Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${qIndex}`}
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
      {/* Header bar */}
      <div className="bg-slate-900 rounded-t-2xl px-5 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-sm">📰 Mirasın Kaderi</span>
          <div className="flex gap-1">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`h-2 w-6 rounded-full transition-all ${
                i < qIndex ? 'bg-emerald-500' : i === qIndex ? 'bg-indigo-400' : 'bg-slate-700'
              }`} />
            ))}
          </div>
          <span className="text-slate-400 text-xs">{qIndex + 1}/{QUESTIONS.length}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 rounded-full">
          <span className="text-yellow-400 text-sm">⭐</span>
          <span className="text-yellow-300 font-black text-sm">{score}</span>
          <span className="text-yellow-600 text-xs">/ {MAX_SCORE}</span>
        </div>
      </div>

      {/* Haber Görseli */}
      <AnimatePresence mode="wait">
        <motion.div key={qIndex} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
          <div className="relative bg-slate-900">
            <img src={question.image} alt={`Soru ${question.id}`}
              className="w-full object-contain max-h-96"
              draggable={false} />
            {/* Soru numarası rozeti */}
            <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
              SORU {question.id}
            </div>
          </div>

          {/* Soru & Şıklar */}
          <div className="bg-slate-900 px-5 pt-4 pb-5 rounded-b-2xl border-t border-slate-700">
            <h3 className="text-white font-black text-base md:text-lg mb-4 leading-snug">
              {question.question}
            </h3>

            <div className="flex flex-col gap-2.5">
              {question.choices.map((choice) => {
                const letter = choiceLetter(choice.id, selected, question.correct);
                return (
                  <motion.button key={choice.id}
                    whileHover={selected ? {} : { x: 4 }}
                    whileTap={selected ? {} : { scale: 0.98 }}
                    onClick={() => handleSelect(choice.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${choiceStyle(choice.id, selected, question.correct)}`}>
                    <span className={`shrink-0 w-8 h-8 rounded-lg font-black text-sm flex items-center justify-center transition-all ${letter.bg}`}>
                      {letter.icon}
                    </span>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{choice.text}</p>
                      <p className="text-slate-400 text-xs leading-tight mt-0.5">{choice.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Geri Bildirim */}
            <AnimatePresence>
              {showFeedback && feedback && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-4 rounded-xl px-4 py-3 border-l-4 ${
                    feedback.type === 'correct'
                      ? 'bg-emerald-900/50 border-emerald-400'
                      : feedback.type === 'critical'
                      ? 'bg-red-900/50 border-red-500'
                      : 'bg-amber-900/40 border-amber-500'
                  }`}>
                  <p className={`font-black text-sm mb-1 ${
                    feedback.type === 'correct' ? 'text-emerald-300'
                    : feedback.type === 'critical' ? 'text-red-300'
                    : 'text-amber-300'
                  }`}>
                    {feedback.icon} {feedback.title}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">{feedback.text}</p>

                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleNextAfterScore}
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 rounded-lg text-sm transition-colors">
                    {qIndex >= QUESTIONS.length - 1 ? 'Sonuçları Gör 🏁' : 'Sonraki Haber →'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${qIndex}`}
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
