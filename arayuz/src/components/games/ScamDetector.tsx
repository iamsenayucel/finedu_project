import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correct: number;
  ok: string;
  ng: string;
  pts: number;
}

interface Scenario {
  id: string;
  title: string;
  fraudType: string;
  fraudIcon: string;
  image: string;
  description: string;
  questions: Question[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'quickprofit',
    title: 'QuickProfit AI',
    fraudType: 'Sahte Yatırım / Ponzi Düzeni',
    fraudIcon: '💸',
    image: '/games/ScamDetector/1.jpeg',
    description: 'Telegram ve sosyal medyada bir yapay zeka destekli yatırım platformu reklamı çıkıyor. Her ay %300–500 arası garantili kazanç vaat ediyor. "Arkadaşını getir, daha çok kazan" diyor.',
    questions: [
      {
        text: 'Bu ilanda sizi en çok şüphelendirmesi gereken unsur nedir?',
        options: ['Her ay %300–500 garantili kazanç vaadi', 'Yapay zeka teknolojisi kullanıyor olması', 'Telegram üzerinden erişilebilmesi'],
        correct: 0,
        ok: 'Doğru! Garantili ve aşırı yüksek getiri vaadi, yatırım dolandırıcılığının en güçlü işaretidir.',
        ng: 'Gerçek bir yatırım aracı hiçbir zaman garantili yüksek getiri vaat edemez. Bu tür vaatler dolandırıcılığın en belirgin işaretidir.',
        pts: 7,
      },
      {
        text: '"Arkadaşını getir, daha çok kazan" sistemi neyin göstergesi olabilir?',
        options: ['Müşteri memnuniyeti programı', 'Yasal bir pazar yeri ortaklığı', 'Çok katmanlı Ponzi / piramit düzeni'],
        correct: 2,
        ok: 'Doğru! Bu yapı, yeni üyelerden toplanan parayla eskilere ödeme yapılan Ponzi düzeninin klasik özelliğidir.',
        ng: 'Bu "ağ" yapısı, Ponzi/piramit düzenlerinin tipik özelliğidir. Yeni para girişi durduğunda sistem çöker.',
        pts: 7,
      },
      {
        text: 'Bu platforma para yatırmadan önce mutlaka ne yapmalısınız?',
        options: ['En az bir arkadaşa danışmak', 'Platformun BDDK/SPK lisansını sorgulamak', 'Önce küçük bir miktar deneme amaçlı yatırmak'],
        correct: 1,
        ok: 'Doğru! Türkiye\'de yatırım hizmeti sunmak için BDDK/SPK lisansı şarttır.',
        ng: 'BDDK veya SPK\'dan lisanssız hiçbir platforma para yatırılmamalıdır. Lisans sorgulama her zaman ilk adım olmalıdır.',
        pts: 6,
      },
    ],
  },
  {
    id: 'fake_ecommerce',
    title: 'Sahte E-Ticaret Sitesi',
    fraudType: 'Online Alışveriş Dolandırıcılığı',
    fraudIcon: '🛒',
    image: '/games/ScamDetector/2.jpeg',
    description: 'İnternette %90 indirimli Apple Watch satan bir site gördünüz. Site tasarımı gerçek gibi görünüyor. "Stok tükenmeden sipariş ver" yazıyor.',
    questions: [
      {
        text: 'Bu sitedeki en belirgin şüphe işareti nedir?',
        options: ['Apple Watch\'ın yalnızca bir renk seçeneği sunması', '%90 gibi gerçek dışı bir indirim oranı', 'Sitenin mobil uyumlu olması'],
        correct: 1,
        ok: 'Doğru! %90 indirim ürünü neredeyse bedavaya satmak demektir; hiçbir yetkili satıcı böyle bir indirim yapamaz.',
        ng: '%90 indirim, ürünü neredeyse bedavaya satmak demektir. Hiçbir yetkili satıcı böyle bir indirim yapamaz.',
        pts: 7,
      },
      {
        text: 'Ödeme yapmadan önce siteyi doğrulamak için ne yapmalısınız?',
        options: ['Ürün fotoğraflarını Google\'da araştırmak', 'Sitenin resmi iletişim bilgilerini ve kullanıcı yorumlarını kontrol etmek', 'Sosyal medyada kaç takipçisi olduğuna bakmak'],
        correct: 1,
        ok: 'Doğru! Resmi iletişim bilgileri ve güvenilir kaynaklardaki yorumlar, sitenin gerçek olup olmadığını anlamanın en iyi yoludur.',
        ng: 'https tek başına güvenli olduğu anlamına gelmez. Resmi şirket bilgileri, adres, vergi no ve bağımsız kullanıcı yorumları da kontrol edilmelidir.',
        pts: 7,
      },
      {
        text: 'Sahte e-ticaret sitelerinden korunmanın en güvenli yolu nedir?',
        options: ['Alışverişi yalnızca bilinen ve köklü platformlardan yapmak', 'Yalnızca kapıda ödeme seçeneği olan sitelerden alışveriş yapmak', 'Ödemeyi her zaman kripto para ile yapmak'],
        correct: 0,
        ok: 'Doğru! Tanınmış ve resmi e-ticaret platformlarını tercih etmek en güvenli seçenektir.',
        ng: 'Kapıda ödeme de bazen kötüye kullanılabilir. En güvenli yol köklü ve tanınan platformları tercih etmektir.',
        pts: 6,
      },
    ],
  },
  {
    id: 'ptt_phishing',
    title: 'PTT Sahte SMS',
    fraudType: 'SMS Phishing (Smishing)',
    fraudIcon: '📱',
    image: '/games/ScamDetector/3.jpeg',
    description: 'Telefonunuza "Paketiniz bekliyor, teslimat için 5 TL ücret ödemek üzere linke tıklayın" yazan bir SMS geliyor. Gönderen ismi "PTT" görünüyor.',
    questions: [
      {
        text: 'Bu mesajın sahte olduğunu gösteren en güçlü işaret nedir?',
        options: ['SMS ile gönderilmiş olması', 'PTT\'nin kargo takip sistemi bulunması', 'Paket teslimi için link üzerinden ücret talep edilmesi'],
        correct: 2,
        ok: 'Doğru! PTT dahil hiçbir resmi kurum, SMS içindeki bir link üzerinden ücret talep etmez.',
        ng: 'Gerçek kargo şirketleri mesaj içindeki bir link üzerinden ödeme talep etmez. "Ücret ödeme linki" phishing\'in tipik göstergesidir.',
        pts: 7,
      },
      {
        text: 'Bu SMS\'teki linke tıklarsanız ne olabilir?',
        options: ['Gerçekten paketiniz teslim edilebilir', 'Kişisel ve banka bilgileriniz çalınabilir', 'Yalnızca reklam içerikleri görebilirsiniz'],
        correct: 1,
        ok: 'Doğru! Bu tür linkler sizi sahte bir sayfaya yönlendirir ve bilgilerinizi çalmak için tasarlanmıştır.',
        ng: 'SMS phishing saldırılarının amacı kişisel bilgileri, kredi kartı numaralarını veya banka şifrelerini ele geçirmektir.',
        pts: 7,
      },
      {
        text: 'Böyle bir mesaj aldığınızda doğru yaklaşım nedir?',
        options: ['Linke tıklayıp ücreti ödeyerek paketi beklemek', 'Mesajı silerek firmayı sosyal medyadan şikayet etmek', 'Linke tıklamadan resmi PTT sitesini veya müşteri hizmetlerini aramak'],
        correct: 2,
        ok: 'Doğru! Her zaman resmi kanalları kullanın; SMS veya e-posta içindeki linklere tıklamayın.',
        ng: 'Linke asla tıklanmamalı. Resmi PTT web sitesi (ptt.gov.tr) veya müşteri hizmetleri üzerinden durum doğrulanmalıdır.',
        pts: 6,
      },
    ],
  },
  {
    id: 'fake_rental',
    title: 'Sahte Kiralık Ev İlanı',
    fraudType: 'Emlak Dolandırıcılığı',
    fraudIcon: '🏠',
    image: '/games/ScamDetector/4.jpeg',
    description: 'İnternette inanılmaz düşük fiyata geniş bir kiralık daire ilanı var. İlan sahibi "Şu an yurt dışındayım, güven için depozito gönderin, anahtarı kargolayayım" diyor.',
    questions: [
      {
        text: 'Bu ilanda sizi şüphelendirmesi gereken en önemli unsur nedir?',
        options: ['Evin fotoğraflarının profesyonel görünmesi', 'İlan sahibinin yurt dışında olup anahtarı kargolama teklifi', 'İlanın yabancı bir platformda yayınlanmış olması'],
        correct: 1,
        ok: 'Doğru! "Yurt dışındayım, anahtarı kargolarım" ifadesi, emlak dolandırıcılığının en klasik tuzaklarından biridir.',
        ng: '"Yurt dışındayım, anahtarı kargolarım" ifadesi, emlak dolandırıcılığının en klasik senaryolarından biridir. Evi hiç görmeden para göndermeyin.',
        pts: 7,
      },
      {
        text: 'Kiralık ev ararken dolandırıcılıktan korunmak için ne yapmalısınız?',
        options: ['Sadece piyasa fiyatının altındaki ilanları tercih etmek', 'Evi yerinde görmeden asla para veya depozito göndermemek', 'İlan sahibinin kimliğini yalnızca telefon görüşmesiyle doğrulamak'],
        correct: 1,
        ok: 'Doğru! Evi bizzat görmeden ve kira sözleşmesi imzalamadan hiçbir ödeme yapılmamalıdır.',
        ng: 'Telefon görüşmesi doğrulama için yeterli değildir. Evi bizzat görün veya güvenilir biriyle yerinde inceleyin.',
        pts: 7,
      },
      {
        text: 'Piyasa değerinin çok altında bir kira fiyatı gördüğünüzde ne düşünmelisiniz?',
        options: ['Ev sahibi çok iyi kalpli biri olmalı', 'İlanlarda her türlü fiyat bulunabilir, normaldir', 'Bu fiyat, dolandırıcılık tuzağı olabilir'],
        correct: 2,
        ok: 'Doğru! Gerçek dışı derecede düşük fiyatlar dolandırıcılığın en yaygın çekicisi olarak kullanılır.',
        ng: 'Piyasa ortalamasının çok altındaki fiyatlar neredeyse her zaman bir tuzak ya da hata olduğunu gösterir. Şüpheyle yaklaşın.',
        pts: 6,
      },
    ],
  },
  {
    id: 'fake_scholarship',
    title: 'Sahte Burs İlanı',
    fraudType: 'Burs / Hibe Dolandırıcılığı',
    fraudIcon: '🎓',
    image: '/games/ScamDetector/5.jpeg',
    description: 'Sosyal medyada "Gençlere 10.000 TL burs! Başvurmak için 100 TL başvuru ücreti ve banka hesap bilgilerinizi gönderin" şeklinde bir paylaşım görüyorsunuz.',
    questions: [
      {
        text: 'Bu burs ilanındaki en büyük kırmızı bayrak nedir?',
        options: ['Burs miktarının 10.000 TL olması', 'İlanın sosyal medyada yayılmış olması', 'Başvuru için ücret ve banka bilgisi talep edilmesi'],
        correct: 2,
        ok: 'Doğru! Gerçek burs kurumları hiçbir zaman başvuru ücreti istemez ve banka bilgilerini sosyal medya üzerinden talep etmez.',
        ng: 'Gerçek burs kurumları hiçbir zaman başvuru ücreti istemez. Banka bilgisi talep eden her ilan şüphelidir.',
        pts: 7,
      },
      {
        text: 'Meşru bir burs programı hangi kurumlar aracılığıyla duyurulur?',
        options: ['Yalnızca sosyal medya influencer\'ları aracılığıyla', 'Sadece WhatsApp grupları üzerinden', 'Okul, üniversite veya resmi devlet kurumları aracılığıyla'],
        correct: 2,
        ok: 'Doğru! Gerçek burs programları resmi okul/üniversite web siteleri veya kyk.gov.tr gibi platformlarda duyurulur.',
        ng: 'Gerçek burs programları resmi okul/üniversite web siteleri, kyk.gov.tr veya türkiye.gov.tr gibi platformlarda duyurulur.',
        pts: 7,
      },
      {
        text: '"Bursunuzu almak için banka bilgilerinizi paylaşın" diyen bir kurumla karşılaşırsanız ne yapmalısınız?',
        options: ['Bilgileri hemen göndermek, yoksa fırsatı kaçırırsın', 'Kurumu resmi kaynaklardan araştırıp şüpheliyse yetkililere bildirmek', 'Başvuru ücretini ödeyip beklemek'],
        correct: 1,
        ok: 'Doğru! Şüpheli dolandırıcılık girişimlerini Emniyet veya BTK\'ya bildirmek hem sizi hem başkalarını korur.',
        ng: 'Banka bilgilerinizi paylaşmadan önce kurumu bağımsız olarak doğrulayın. Şüpheli ilanları Emniyet veya BTK\'ya bildirebilirsiniz.',
        pts: 6,
      },
    ],
  },
];

const SCAM_PANELS = [
  {
    // Part 1: Ponzi/Sahte Yatırım
    dictionary: [
      { term: 'Ponzi (Piramit) Düzeni', def: 'Gerçek ticaret olmayan, sadece sisteme yeni katılanların parasıyla eski üyelere ödeme yapılan yasadışı dolandırıcılık sistemidir. Yeni kurban gelmediği an çöker.' },
      { term: 'Gerçek Dışı Getiri', def: '"Yüksek kazanç varsa, yüksek risk vardır." Günlük %5 veya aylık %300 gibi rakamlara "Garanti" kelimesi ekleniyorsa, bu matematiğe aykırıdır ve %100 tuzaktır.' },
      { term: 'Zaman Baskısı', def: 'Dolandırıcıların en sevdiği taktiktir. "Sınırlı süre, fırsat bitiyor, hemen tıkla!" diyerek araştırma yapmanı ve mantığını kullanmanı engellemeye çalışırlar.' },
      { term: 'Lisans (Yasal İzin)', def: "Türkiye'de yasal yatırım parası toplayabilmek için devlet kurumlarından (SPK veya BDDK) resmi lisans almak zorunludur. Sosyal medya gruplarından yasal yatırım yapılamaz." },
    ],
    strategyTitle: 'Tehlike İşaretleri',
    strategyTips: [
      { title: '🚩 "Sihirli" Garanti Tuzağı', desc: "İlanda 'Her ay %300-500 garanti kazanç' gibi bir vaat var mı? Seni dünyanın en zenginlerinden daha yüksek faizi 'garanti' eden sistem, seni dolandırıyordur." },
      { title: '🚩 "Arkadaşını Getir" Tuzağı', desc: "Kazancın mantıklı bir ticaretten değil de sürekli yeni insanları sisteme sokmaktan geliyorsa, bu çok katmanlı bir piramit (Ponzi) düzenidir." },
      { title: '🚩 Teknoloji Maskesi', desc: '"Yapay Zeka (AI)", "Kripto Botu" gibi havalı kelimeler mi var? Dolandırıcılar sistemi karmaşık göstererek seni etkiler. Nasıl para kazandığını anlamadığın işe girme.' },
      { title: '🚩 "Önce Güvenlik" Kuralı', desc: '"Birazcık para atıp deneyeyim" demek bile tehlikelidir. Bir platforma para yatırmadan önce mutlaka devletin resmi kurumlarına (SPK/BDDK lisansı var mı?) bakarak sorgula.' },
    ],
  },
  {
    // Part 2: Sahte E-Ticaret
    dictionary: [
      { term: 'Oltalama', def: 'Tasarımı gerçeğine çok benzeyen ama asıl amacı kredi kartı ve şifre bilgilerini çalmak olan sahte web siteleridir.' },
      { term: 'Yapay Sayaç', def: '"Stok tükeniyor! Son 14 dakika!" gibi sayaçlar, mantığını devre dışı bırakıp aceleyle ödeme yapmanı sağlamak için kurulan psikolojik bir baskı taktiğidir.' },
      { term: 'Gölge Şirket', def: '"Hakkımızda", "İletişim", vergi numarası veya açık adresi bulunmayan; paranı aldıktan sonra muhatap bulamayacağın hayalet e-ticaret siteleridir.' },
      { term: 'Alıcı Koruması', def: 'Köklü e-ticaret platformlarının sunduğu sistemdir. Ürün sana ulaşana kadar paran havuzda bekler, dolandırılma ihtimalin sıfıra yakındır.' },
    ],
    strategyTitle: 'Tehlike İşaretleri',
    strategyTips: [
      { title: '🚩 Mantık Filtresi', desc: '"Apple Watch\'ta %90 indirim" gibi uçuk fiyat ekonomik olarak imkansızdır. Bir fiyat gerçek olamayacak kadar iyiyse, emin ol gerçek değildir!' },
      { title: '🚩 Doğrulama Filtresi', desc: 'Site ne kadar profesyonel görünürse görünsün; ödeme yapmadan önce sitenin "İletişim" sayfasına, kayıtlı şirket olup olmadığına ve gerçek kullanıcı şikayetlerine bak.' },
      { title: '🚩 Güvenli Liman Kuralı', desc: 'Sosyal medyada karşına çıkan her süslü linke tıklayıp kart bilgilerini girmek mayın tarlasında yürümektir. Alışverişi yalnızca bilinen ve köklü platformlardan yap.' },
    ],
  },
  {
    // Part 3: SMS Oltalama
    dictionary: [
      { term: 'SMS Oltalama', def: "Dolandırıcıların e-posta yerine doğrudan cep telefonuna SMS atarak seni tuzağa (zararlı bir linke) çekme yöntemidir." },
      { term: 'Başlık Sahteciliği', def: 'Mesajın gönderen kısmında "PTT", "Banka" veya "Devlet" yazması o mesajın gerçek olduğunu kanıtlamaz. Dolandırıcılar teknolojik yazılımlarla gönderici adını maskeleyebilirler.' },
      { term: 'Mikro Ödeme', def: '"5 TL kargo", "9 TL gümrük vergisi" gibi küçük rakamlar sunarlar. Asıl amaç o 5 TL değil; ödeme için gireceğin kredi kartı bilgilerini ve şifreni ele geçirmektir!' },
    ],
    strategyTitle: 'Tehlike İşaretleri',
    strategyTips: [
      { title: '🚩 Mantıksız Talep', desc: 'Devlet kurumları veya resmi kargo şirketleri sana SMS içinde link gönderip "Teslimat için şu linkten 5 TL ödeyin" demez. Link üzerinden para istenmesi, sahte olduğunun en net kanıtıdır.' },
      { title: '🚩 Zehirli Tıklama', desc: 'O linke tıkladığında karşına gerçek bir kargo takip ekranı çıkmaz. Telefonuna casus yazılım (virüs) iner ya da sahte ödeme ekranına yönlendirilip tüm bilgilerin çalınır.' },
      { title: '🚩 Korunma Yolu', desc: "Bir kurumdan borç, kargo veya ceza mesajı aldığında kural şudur: Asla o SMS'in içindeki linke tıklama. Tarayıcını açıp kurumun resmi web sitesine kendin gir veya müşteri hizmetlerini ara." },
    ],
  },
  {
    // Part 4: Sahte Kiralık Ev
    dictionary: [
      { term: 'Kapora (Depozito) Avcılığı', def: 'Olmayan veya başkasına ait bir ev için, "Çok soran var, sen kaporayı gönder evi sana ayırayım" yalanıyla güven verip, parayı aldıktan sonra telefonu engelleme taktiğidir.' },
      { term: 'Hayalet İlan (Çalıntı Görsel)', def: "Dolandırıcıların lüks otel odalarından veya yurtdışındaki emlak sitelerinden çaldıkları aşırı profesyonel fotoğraflarla kurguladıkları sahte ilanlardır." },
      { term: '"Yurtdışındayım" Bahanesi', def: 'Dolandırıcının en büyük zayıflığı evi sana fiziksel olarak gösterememesidir. Bu yüzden "Şu an yurtdışındayım, kaporayı at anahtarı kargolayayım" gibi bahaneler uydururlar.' },
      { term: 'Piyasa Gerçekliği', def: 'Gayrimenkul piyasasında "hayır kurumu" yoktur. Hiç kimse 15.000 TL edecek eşyalı lüks bir evi, tanımadığı birine 5.000 TL\'ye kiralamaz.' },
    ],
    strategyTitle: 'Tehlike İşaretleri',
    strategyTips: [
      { title: '🚩 Mantık Filtresi', desc: 'Milyonluk evini kiraya veren hiç kimse, yüzünü bile görmediği birine anahtarı kargoyla göndermez. "Yurtdışındayım, anahtarı kargolayacağım" en büyük dolandırıcılık işaretidir.' },
      { title: '🚩 Korunma Filtresi', desc: 'Evi kendi gözlerinle görmeden, kapısını açmadan ve ev sahibinin kimliğinden %100 emin olmadan asla kimseye kapora veya depozito göndermemelisin.' },
      { title: '🚩 Gerçeklik Filtresi', desc: 'Şehir merkezinde, eşyalı ve yeni bir dairenin fiyatı piyasa değerinin inanılmaz derecede altındaysa, "Bugün çok şanslıyım" diye düşünme. Bu bir dolandırıcılık tuzağıdır.' },
    ],
  },
  {
    // Part 5: Sahte Burs
    dictionary: [
      { term: 'Ön Ödeme (Dosya Masrafı) Yalanı', def: '"Sana büyük para vereceğiz ama önce sen bize küçük bir işlem/dosya parası gönder" şeklindeki klasik tuzaktır. Sana maddi yardım yapacak kurum, senden asla para istemez!' },
      { term: 'Veri Avcılığı', def: 'Asıl tehlike; T.C. Kimlik numaranı, banka hesap bilgilerini ve şifrelerini ele geçirip senin adına yasal olmayan riskli finansal davranışlar gerçekleştirmektir.' },
      { term: 'Sahte Sosyal İspat', def: 'İlandaki "Bursum hemen yattı, Allah razı olsun" yazan yorumların %100\'ü, seni ikna etmek için bot (sahte) hesaplarla yazılmış kurgulardır.' },
      { term: 'Resmi Kurum', def: 'KYK (Devlet), üniversiteler veya Ticaret Odası\'na kayıtlı köklü vakıflardır. Gerçek burslar ".gov.tr" veya ".edu.tr" veya resmi ".org.tr" uzantılı sitelerden duyurulur.' },
    ],
    strategyTitle: 'Tehlike İşaretleri',
    strategyTips: [
      { title: '🚩 Mantık Filtresi', desc: 'Eğer bir burs ilanı, sana para yatırmak için "başvuru ücreti" veya "banka doğrulama ücreti" talep ediyorsa, bu en büyük kırmızı bayraktır. Paraya ihtiyacı olan öğrenciden para istenmez!' },
      { title: '🚩 Duyuru Kaynağı Doğrulama', desc: 'Gerçek bir burs programı; anonim sosyal medya sayfalarından veya WhatsApp gruplarından dağıtılmaz. Yalnızca okul, üniversite veya resmi devlet kurumları aracılığıyla duyurulur.' },
      { title: '🚩 "Şüphe ve Şikayet" Filtresi', desc: 'Burs vereceğini söyleyen kurum banka şifrelerini veya e-Devlet bilgilerini istiyorsa hemen dur. Bilgilerini asla verme ve şüpheliyse yetkililere (CİMER / Emniyet) bildir.' },
    ],
  },
];

type Stage = 'intro' | 'preview' | 'question' | 'final';
interface Props { onComplete?: (score: number) => void; }

const Bar = ({ cls }: { cls: string }) => (
  <div className={`h-1.5 bg-gradient-to-r ${cls}`} />
);

export default function ScamDetector({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [leavingIntro, setLeavingIntro] = useState(false);
  const [studyPage, setStudyPage] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);

  const sc = SCENARIOS[scenarioIdx];
  const q = sc.questions[questionIdx];
  const panel = SCAM_PANELS[Math.min(scenarioIdx, 4)];

  const handleAnswer = useCallback((optIdx: number) => {
    if (locked) return;
    setLocked(true);
    setSelectedOpt(optIdx);
    const isCorrect = optIdx === q.correct;
    const pts = isCorrect ? q.pts : 0;
    const newScore = score + pts;
    setFeedback({ correct: isCorrect, text: isCorrect ? q.ok : q.ng });
    if (isCorrect) {
      setScore(newScore);
      setCorrectCount(c => c + 1);
    }
    setTimeout(() => {
      setFeedback(null);
      setSelectedOpt(null);
      setLocked(false);
      if (questionIdx + 1 >= sc.questions.length) {
        if (scenarioIdx + 1 >= SCENARIOS.length) {
          onComplete?.(newScore);
          setStage('final');
        } else {
          setScenarioIdx(i => i + 1);
          setQuestionIdx(0);
          setStage('preview');
        }
      } else {
        setQuestionIdx(i => i + 1);
      }
    }, 2200);
  }, [locked, q, questionIdx, sc, scenarioIdx, score, onComplete]);

  const handleReplay = useCallback(() => {
    setStage('intro');
    setScenarioIdx(0);
    setQuestionIdx(0);
    setScore(0);
    setCorrectCount(0);
    setLocked(false);
    setSelectedOpt(null);
    setFeedback(null);
  }, []);

  // ── INTRO: büyük sözlük + strateji inceleme ekranı (sayfalı) ────────────────
  if (stage === 'intro') {
    const studyPanel = SCAM_PANELS[studyPage];
    const isLastPage = studyPage === SCAM_PANELS.length - 1;
    const startGame = () => {
      setLeavingIntro(true);
      setTimeout(() => setStage('preview'), 380);
    };
    const nextPage = () => setStudyPage(p => Math.min(p + 1, SCAM_PANELS.length - 1));
    const prevPage = () => setStudyPage(p => Math.max(p - 1, 0));
    return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Kompakt başlık */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
          <ShieldAlert className="w-3.5 h-3.5" /> Dolandırıcı Avı: Gerçek mi, Tuzak mı?
        </div>
        <p className="text-slate-400 text-sm">
          Oyuna geçmeden önce sözlüğü ve tehlike işaretlerini incele · 5 senaryo · 100 puan
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Sol: Ekonomi Sözlüğü (büyük) */}
        <AnimatePresence mode="wait">
          {!leavingIntro && (
            <motion.div
              key={`dict-${studyPage}`}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-cyan-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #0c2535 0%, #0f172a 100%)' }}
            >
              <div className="px-5 py-4 border-b border-cyan-800/40">
                <div className="text-cyan-400 text-base font-black uppercase tracking-widest">📖 Ekonomi Sözlüğü</div>
              </div>
              <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
                {studyPanel.dictionary.map((item, i) => (
                  <div key={i}>
                    <div className="text-base font-bold text-cyan-300 mb-1.5">{item.term}</div>
                    <div className="text-sm text-slate-400 leading-relaxed">{item.def}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sağ: Tehlike İşaretleri (büyük) */}
        <AnimatePresence mode="wait">
          {!leavingIntro && (
            <motion.div
              key={`strat-${studyPage}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-5 py-4 border-b border-amber-800/40">
                <div className="text-amber-400 text-base font-black uppercase tracking-widest">🎯 Tehlike İşaretleri</div>
                <div className="text-amber-600 text-xs mt-0.5">{studyPanel.strategyTitle}</div>
              </div>
              <div className="px-5 py-4 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
                {studyPanel.strategyTips.map((tip, i) => (
                  <div key={i}>
                    <div className="text-base font-bold text-amber-300 mb-1.5">{tip.title}</div>
                    <div className="text-sm text-slate-400 leading-relaxed">{tip.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!leavingIntro && (
        <>
          {/* Sayfalama */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <button
              onClick={prevPage}
              disabled={studyPage === 0}
              className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm px-3 py-1.5 transition-colors"
            >
              ← Önceki
            </button>
            <div className="flex gap-1.5">
              {SCAM_PANELS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStudyPage(i)}
                  className={`h-2 rounded-full transition-all ${i === studyPage ? 'bg-red-400 w-6' : 'bg-slate-700 w-2 hover:bg-slate-600'}`}
                />
              ))}
            </div>
            <span className="text-slate-500 text-xs font-medium w-14">{studyPage + 1} / {SCAM_PANELS.length}</span>
            <button
              onClick={nextPage}
              disabled={isLastPage}
              className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm px-3 py-1.5 transition-colors"
            >
              Sonraki →
            </button>
          </div>

          <div className="flex justify-center">
            {isLastPage ? (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={startGame}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 px-10 rounded-2xl shadow-lg border-b-4 border-orange-800"
              >
                Oyuna Geç <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={nextPage}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg border-b-4 border-slate-900"
              >
                Sonraki Sayfa <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </>
      )}
    </div>
    );
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────────
  if (stage === 'preview') return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">
        {/* Left Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${scenarioIdx}`}
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
          <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <Bar cls="from-red-600 via-orange-500 to-amber-500" />
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="bg-red-900/50 border border-red-700 text-red-300 text-xs font-bold px-3 py-1 rounded-full">
                    {sc.fraudIcon} {sc.fraudType}
                  </span>
                </div>
                <span className="text-slate-400 text-sm font-bold">{scenarioIdx + 1} / {SCENARIOS.length}</span>
              </div>

              <div className="flex gap-1.5 mb-6">
                {SCENARIOS.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < scenarioIdx ? 'bg-red-500' : i === scenarioIdx ? 'bg-orange-400' : 'bg-slate-700'}`} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={sc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <h2 className="text-white font-black text-2xl mb-4">{sc.title}</h2>

                  <div className="rounded-2xl overflow-hidden border border-slate-700 mb-5 bg-slate-800">
                    <img
                      src={sc.image}
                      alt={sc.title}
                      className="w-full object-contain max-h-72"
                    />
                  </div>

                  <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Senaryo Açıklaması</p>
                    <p className="text-slate-200 text-sm leading-relaxed">{sc.description}</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setStage('question')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-orange-800"
                  >
                    Soruları Yanıtla <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            </div>
            <Bar cls="from-red-600 via-orange-500 to-amber-500" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${scenarioIdx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-amber-800/40">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Tehlike İşaretleri</div>
                <div className="text-amber-600 text-xs">{panel.strategyTitle}</div>
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

  // ── QUESTION ──────────────────────────────────────────────────────────────
  if (stage === 'question') return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start gap-4">
        {/* Left Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${scenarioIdx}`}
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
          <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <Bar cls="from-red-600 via-orange-500 to-amber-500" />
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-orange-900/50 border border-orange-700 text-orange-300 text-xs font-bold px-3 py-1 rounded-full">
                  {sc.fraudIcon} {sc.title}
                </span>
                <span className="text-slate-400 text-sm font-bold">Soru {questionIdx + 1} / {sc.questions.length}</span>
              </div>

              <div className="flex gap-1.5 mb-5">
                {sc.questions.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < questionIdx ? 'bg-orange-500' : i === questionIdx ? 'bg-amber-400' : 'bg-slate-700'}`} />
                ))}
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-700/60 mb-5 bg-slate-800/60">
                <img src={sc.image} alt={sc.title} className="w-full object-contain max-h-48 opacity-90" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={`${scenarioIdx}-${questionIdx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Soru</p>
                    <p className="text-white font-bold text-base leading-relaxed">{q.text}</p>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {q.options.map((opt, i) => {
                      const isCorrectOpt = i === q.correct;
                      const isSelected = selectedOpt === i;
                      const showFb = feedback !== null;
                      return (
                        <motion.button
                          key={i}
                          whileHover={locked ? {} : { scale: 1.01, x: 4 }}
                          whileTap={locked ? {} : { scale: 0.98 }}
                          animate={isSelected && feedback && !feedback.correct ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                          transition={{ duration: 0.3 }}
                          onClick={() => handleAnswer(i)}
                          disabled={locked}
                          className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 border-2 text-left text-sm font-bold transition-all
                            ${showFb
                              ? isCorrectOpt
                                ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                                : isSelected
                                  ? 'border-red-500 bg-red-900/40 text-red-300'
                                  : 'border-slate-700 bg-slate-800/40 text-slate-500 opacity-40'
                              : 'border-slate-600 bg-slate-800 hover:border-orange-500 hover:bg-slate-700 text-white'}`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 border
                            ${showFb && isCorrectOpt ? 'bg-emerald-600 border-emerald-500 text-white'
                              : showFb && isSelected ? 'bg-red-700 border-red-500 text-white'
                              : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {showFb && isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {showFb && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  {feedback && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-3 rounded-xl px-5 py-3.5 border ${feedback.correct ? 'bg-emerald-900/40 border-emerald-700/50' : 'bg-red-900/30 border-red-700/50'}`}>
                      {feedback.correct
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        : <XCircle    className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                      <p className={`text-sm ${feedback.correct ? 'text-emerald-300' : 'text-red-300'}`}>{feedback.text}</p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <Bar cls="from-red-600 via-orange-500 to-amber-500" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 hidden lg:block sticky top-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${scenarioIdx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-amber-800/50 shadow-xl"
              style={{ background: 'linear-gradient(160deg, #1f1200 0%, #0f172a 100%)' }}
            >
              <div className="px-4 py-3.5 border-b border-amber-800/40">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">🎯 Tehlike İşaretleri</div>
                <div className="text-amber-600 text-xs">{panel.strategyTitle}</div>
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

  // ── FINAL ─────────────────────────────────────────────────────────────────
  if (stage === 'final') {
    const total = 15;
    const grade =
      score >= 90 ? { label: 'Mükemmel Dedektif!', color: 'text-emerald-400', icon: '🕵️', msg: 'Tüm dolandırıcılık tuzaklarını başarıyla tespit ettin!' } :
      score >= 70 ? { label: 'İyi İş!',             color: 'text-blue-400',    icon: '🛡️', msg: 'Dolandırıcılık işaretlerini büyük ölçüde fark edebiliyorsun.' } :
      score >= 50 ? { label: 'Fena Değil',           color: 'text-amber-400',   icon: '📘', msg: 'Biraz daha dikkat edersen kendini çok iyi koruyabilirsin.' } :
                   { label: 'Tekrar Dene',           color: 'text-red-400',     icon: '💪', msg: 'Dolandırıcılık yöntemlerini tekrar gözden geçirmeni öneririz.' };
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-slate-700 shadow-2xl overflow-hidden">
          <Bar cls="from-red-600 via-orange-500 to-amber-500" />
          <div className="p-6 md:p-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700 text-center mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className="text-7xl mb-4">{grade.icon}</motion.div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Oyun Tamamlandı</p>
              <h2 className={`text-4xl font-black mb-2 ${grade.color}`}>{grade.label}</h2>
              <p className="text-slate-300 text-sm mb-6">{grade.msg}</p>
              <div className="inline-block bg-slate-900 border border-slate-700 rounded-2xl px-8 py-4">
                <p className="text-5xl font-black text-white">{score} <span className="text-slate-500 text-lg font-normal">/ 100 puan</span></p>
              </div>
              <p className="text-slate-400 text-sm mt-4">{correctCount} / {total} soruyu doğru yanıtladın</p>
            </motion.div>

            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 mb-6">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Tespit Ettiğin Dolandırıcılık Türleri</p>
              <div className="space-y-2.5">
                {SCENARIOS.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-700">
                    <span className="text-xl shrink-0">{s.fraudIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{s.title}</p>
                      <p className="text-slate-400 text-xs truncate">{s.fraudType}</p>
                    </div>
                    <span className="text-slate-500 text-xs font-bold shrink-0">{i + 1}/5</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-4 mb-6">
              <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2">Hatırlatma</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dolandırıcılık vakalarını <span className="text-white font-bold">ALO 157</span> (Tüketici Hattı) veya <span className="text-white font-bold">www.btk.gov.tr</span> üzerinden yetkililere bildirebilirsin.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleReplay}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-orange-800"
            >
              🔄 Tekrar Oyna
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
