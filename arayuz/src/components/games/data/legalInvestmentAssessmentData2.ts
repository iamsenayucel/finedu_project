// "Siber Güvenlik ve Dolandırıcılık Tespiti – Ölçme ve Değerlendirme" (Yasal Yatırım Yöntemleri 2) için merkezi veri.
// Bölüm 1: Siber Dedektif Vaka Analizleri — 4 dijital dolandırıcılık vakasında en mantıklı kararı
//           üç seçenek arasından (A/B/C) bulma; sırayla oynanır ve cevaplandıktan sonra değiştirilemez
//           (vaka başı 10 puan, toplam 40 puan).
// Bölüm 2: Siber Güvenlik Bitirme Testi — 12 TYT formatında çoktan seçmeli soruda beş seçenek arasından
//           (A/B/C/D/E) doğru cevabı bulma; sırayla oynanır ve cevaplandıktan sonra değiştirilemez
//           (soru başı 5 puan, toplam 60 puan).
// Toplam 100 puan, tek kesintisiz süre 25 dakika.

export const GAME_DURATION_MS = 25 * 60 * 1000;
export const LOW_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export const POINTS_PER_QUESTION1 = 10;
export const TOTAL_SECTION1_POINTS = 40;
export const POINTS_PER_QUESTION2 = 5;
export const TOTAL_SECTION2_POINTS = 60;
export const TOTAL_POINTS = 100;

export interface CaseOption {
  id: 'A' | 'B' | 'C';
  label: string;
}

export interface CaseQuestion {
  id: number;
  title: string;
  scenario: string;
  task: string;
  options: CaseOption[];
  correctOptionId: 'A' | 'B' | 'C';
  explanation: string;
}

export const SECTION1_TITLE = 'Siber Dedektif Vaka Analizleri';
export const SECTION1_INSTRUCTION =
  'Ekrana gelen dijital dolandırıcılık vakasını bir dedektif gibi incele. Durum karşısında alman gereken en mantıklı kararı üç seçenek arasından seç. Bir vakayı cevapladıktan sonra cevabını değiştiremezsin.';

export const SECTION1_QUESTIONS: CaseQuestion[] = [
  {
    id: 1,
    title: 'Vaka 1 — Mucizevi Kazanç İlanı',
    scenario:
      'Sosyal medyada karşına bir reklam çıktı: "Yapay Zeka (AI) destekli alım-satım botumuzla her ay %300 GARANTİ kazanç! Üstelik getirdiğin her 3 arkadaşın için ekstra komisyon!"',
    task: 'Bu ilandaki sistemin yasadışı bir "Ponzi (Piramit) Düzeni" olduğunu kanıtlayan en büyük iki işaret nedir?',
    options: [
      { id: 'A', label: 'Yapay zeka kullanılması ve sosyal medyada reklam yapması.' },
      { id: 'B', label: 'Sistemde sadece dolar ile işlem yapılması.' },
      {
        id: 'C',
        label:
          'Matematiğe aykırı bir faizin "garanti" edilmesi ve kazancın sisteme "yeni kurbanlar (arkadaşlar)" sokmaya bağlanması.',
      },
    ],
    correctOptionId: 'C',
    explanation: 'Gerçek bir ticaret yok. Para sadece yeni girenlerin cebinden çıkıp eskilere ödeniyor.',
  },
  {
    id: 2,
    title: 'Vaka 2 — Panik Yaratan E-Ticaret Sitesi',
    scenario:
      'Tıkladığın bir link seni tanımadığın bir e-ticaret sitesine götürdü. Normalde 50.000 TL olan bir bilgisayar 8.000 TL\'ye satılıyor ve ekranda kocaman kırmızı bir sayaç geriye sayıyor: "Fırsatın bitmesine SON 04:12 DAKİKA!"',
    task: 'Dolandırıcıların ekrana koyduğu bu "Yapay Sayaç" ile asıl hedeflediği şey nedir?',
    options: [
      { id: 'A', label: 'Sitenin teknolojik olarak gelişmiş olduğunu göstermek.' },
      { id: 'B', label: 'Depodaki gerçek stok miktarını müşteriye şeffafça sunmak.' },
      {
        id: 'C',
        label:
          'Sende panik (Zaman Baskısı) yaratarak mantığını devre dışı bırakmak ve siteyi araştırmadan aceleyle kart bilgilerini girmeni sağlamak.',
      },
    ],
    correctOptionId: 'C',
    explanation:
      'Mantık Filtresi ve Zaman Baskısı bir arada çalışır. Gerçek olamayacak kadar ucuzsa ve seni acele ettiriyorsa, o bir tuzaktır.',
  },
  {
    id: 3,
    title: 'Vaka 3 — Acil Durum SMS\'i (Oltalama)',
    scenario:
      'Telefonuna şöyle bir SMS geldi: "BAKANLIK: Hakkınızda icra takibi başlatılmıştır. Dosya masrafı olan 15 TL\'yi hemen ödemek için linke tıklayın: http://turkiye-gov-ceza-odeme.xyz"',
    task: 'Bu mesajı aldığında uygulaman gereken en doğru güvenlik protokolü hangisidir?',
    options: [
      {
        id: 'A',
        label: 'Linke ASLA tıklamayıp, yeni bir sekme açarak kurumun resmi web sitesine kendim girmek veya e-Devlet\'i kontrol etmek.',
      },
      { id: 'B', label: '15 TL çok küçük bir rakam olduğu için (Mikro Ödeme) risk alıp linkten hemen ödemeyi yapmak.' },
      { id: 'C', label: 'Gönderen kısmında "Bakanlık" yazdığı için mesajın tamamen güvenli olduğuna inanmak.' },
    ],
    correctOptionId: 'A',
    explanation:
      'Dolandırıcılar başlık kısmına istedikleri kurumun adını yazabilir (Başlık Sahteciliği). Amaç o 15 TL\'yi değil, gireceğin kredi kartı bilgilerini çalmaktır.',
  },
  {
    id: 4,
    title: 'Vaka 4 — Karşılıksız Burs Tuzağı',
    scenario:
      'Bir WhatsApp grubunda "Karşılıksız Eğitim Bursu Başvurusu" ilanı gördün. İletişime geçtiğinde sana "Bursunuz onaylandı, ancak hesabınızı doğrulamak ve banka işlem ücreti için bize önce 250 TL göndermeniz gerekiyor" dediler.',
    task: 'Bu durumda devrede olması gereken "Mantık Filtresi" kuralı aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', label: 'Burs veren kurumlar her zaman WhatsApp üzerinden iletişim kurarlar.' },
      { id: 'B', label: 'Banka işlem ücretleri normaldir, 250 TL gönderip her ay burs almak kârlıdır.' },
      {
        id: 'C',
        label: 'Sana maddi yardım (burs/kredi) yapacak olan hiçbir gerçek kurum, senden ön ödeme veya dosya masrafı talep etmez!',
      },
    ],
    correctOptionId: 'C',
    explanation: 'Paraya ihtiyacı olan bir öğrenciden para istenmez. Bu klasik bir "Ön Ödeme (Dosya Masrafı)" yalanıdır.',
  },
];

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
}

export interface QuizQuestion {
  id: number;
  title: string;
  question: string;
  options: QuizOption[];
  correctOptionId: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
}

export const SECTION2_TITLE = 'Siber Güvenlik Bitirme Testi';
export const SECTION2_INSTRUCTION =
  'Vakalardan edindiğin pratik tecrübeleri şimdi teorik bilgiyle kanıtlama zamanı! Her soru için tek doğru seçeneği beş şık arasından işaretle. Bir soruyu cevapladıktan sonra cevabını değiştiremezsin.';

export const SECTION2_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    title: 'Soru 1',
    question:
      'Tasarımı ve web adresi, güvendiğiniz gerçek bir banka veya alışveriş sitesine çok benzeyen; ancak asıl amacı o siteye girdiğiniz şifreleri, T.C. Kimlik numaranızı ve kredi kartı bilgilerinizi arka planda kopyalamak olan sahte web siteleri kurulmaktadır. Dijital dolandırıcılık literatüründe bu yönteme ne ad verilir?',
    options: [
      { id: 'A', label: 'Ponzi Düzeni' },
      { id: 'B', label: 'Oltalama (Phishing)' },
      { id: 'C', label: 'Yapay Sayaç' },
      { id: 'D', label: 'Açığa Satış' },
      { id: 'E', label: 'Konsolidasyon' },
    ],
    correctOptionId: 'B',
    explanation: 'Kullanıcıyı sahte linklerle sahte sitelere çekerek bilgilerini çalma (avlama) işlemine Oltalama denir.',
  },
  {
    id: 2,
    title: 'Soru 2',
    question:
      'Bir yatırım platformu size çok yüksek kazançlar vaat ediyorsa, "Önce Güvenlik Kuralı" gereği sisteme 1 TL bile yatırmadan önce ilk kontrol etmeniz gereken hayati bir unsur vardır. "Birazcık para atıp deneyeyim" demek bile büyük bir hatadır. Türkiye sınırları içerisinde yatırım amacıyla para toplayan bir kurumun güvenilirliğini teyit etmek için aşağıdakilerden hangisine sahip olması ZORUNLUDUR?',
    options: [
      { id: 'A', label: 'Sosyal medyada 1 milyondan fazla takipçi' },
      { id: 'B', label: 'Şirket CEO\'sunun yabancı uyruklu olması' },
      { id: 'C', label: 'SPK (Sermaye Piyasası Kurulu) veya BDDK gibi resmi devlet kurumlarından alınmış yasal faaliyet lisansı' },
      { id: 'D', label: 'Yapay zeka teknolojisi kullanması' },
      { id: 'E', label: 'Referans getirene ekstra bonus dağıtması' },
    ],
    correctOptionId: 'C',
    explanation: 'Yasal yatırım kurumları devletin sıkı denetimi altındadır. Resmi lisansı olmayan hiçbir platforma para emanet edilmez.',
  },
  {
    id: 3,
    title: 'Soru 3',
    question:
      'Emlak veya ikinci el eşya piyasasında dolandırıcıların en büyük zayıflığı, satmaya veya kiralamaya çalıştıkları ürünü size fiziksel olarak gösterememeleridir. Bu zayıflığı örtbas etmek için dolandırıcıların en sık başvurduğu bahane aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', label: '"Ürünün garantisi az önce bitti."' },
      { id: 'B', label: '"Ben şu an yurtdışındayım / şehir dışındayım, çok soran var, sen kaporayı at ben anahtarı/ürünü sana kargolayacağım."' },
      { id: 'C', label: '"Ürünü sadece elden teslim edebilirim, gelip görebilirsiniz."' },
      { id: 'D', label: '"Fiyatı piyasa değerinin çok üzerinde."' },
      { id: 'E', label: '"Ödemeyi sadece resmi şirket hesabıma kabul ediyorum."' },
    ],
    correctOptionId: 'B',
    explanation: 'Olmayan bir malı (Hayalet İlan) satmanın tek yolu fiziksel buluşmayı engellemektir. Görmediğiniz bir mala asla kapora gönderilmez.',
  },
  {
    id: 4,
    title: 'Soru 4',
    question:
      'Finansal piyasaların değişmez bir altın kuralı vardır: "Yüksek getiri beklentisi, yüksek riski beraberinde getirir." Eğer bir ilan veya sistem, yatırımcılara hem çok yüksek kazanç sunup hem de "Kesinlikle risk yok, %100 Garanti" diyorsa, bu durum aşağıdakilerden hangisinin göstergesidir?',
    options: [
      { id: 'A', label: 'Sistemin devlet güvencesinde olduğunun' },
      { id: 'B', label: 'Yatırımın tamamen yasal ve risksiz olduğunun' },
      { id: 'C', label: 'Sistemin matematiğe ve ekonominin doğasına aykırı, yasadışı bir dolandırıcılık (Gerçek Dışı Getiri) tuzağı olduğunun' },
      { id: 'D', label: 'Sistemin düşük enflasyon ortamında çalıştığının' },
      { id: 'E', label: 'Piyasa uzmanlarının doğru tahminler yaptığının' },
    ],
    correctOptionId: 'C',
    explanation: 'Risksiz varlıkların (örn: mevduat, tahvil) getirisi her zaman sınırlıdır. Mucizevi yüksek faizler "garanti" edilemez.',
  },
  {
    id: 5,
    title: 'Soru 5',
    question:
      'Ali, sosyal medyada dolaşırken "Ünlü iş adamı açıkladı, bu sistemle günde 5.000 TL kazanıyor" başlıklı bir haber linki görmüştür. Linke tıkladığında çok profesyonel görünen bir siteye gitmiş ve haberin altında "Bugün üye oldum, param anında yattı, Allah razı olsun" yazan yüzlerce yorum okumuştur. Ali bu yorumlara güvenerek sisteme para yatırmış ve dolandırılmıştır. Ali\'nin tuzağa düşmesine neden olan, dolandırıcıların bot (sahte) hesaplarla ürettiği bu psikolojik manipülasyon taktiği nedir?',
    options: [
      { id: 'A', label: 'Sahte Sosyal İspat' },
      { id: 'B', label: 'Likidite Krizi' },
      { id: 'C', label: 'Yaşam Standardı Enflasyonu' },
      { id: 'D', label: 'Fırsat Maliyeti' },
      { id: 'E', label: 'Kredi Notu Manipülasyonu' },
    ],
    correctOptionId: 'A',
    explanation: 'İnsanlar kalabalıkların kararlarına güvenme eğilimindedir. Dolandırıcılar sahte yorumlar (Sosyal İspat) yaratarak kurbanın şüphelerini ortadan kaldırır.',
  },
  {
    id: 6,
    title: 'Soru 6',
    question:
      'Bir sistemde kazancın gerçek bir ürün/hizmet satışından değil, sisteme sürekli yeni katılımcı bulunmasından elde edildiği; yeni katılımcı bulunamadığında matematiksel olarak çökmeye mahkum olan yapıya ne ad verilir?',
    options: [
      { id: 'A', label: 'Girişim Sermayesi' },
      { id: 'B', label: 'Ponzi (Piramit) Düzeni' },
      { id: 'C', label: 'Risk Sermayesi Fonu' },
      { id: 'D', label: 'Melek Yatırımcılık' },
      { id: 'E', label: 'Konsorsiyum' },
    ],
    correctOptionId: 'B',
    explanation: 'Piramit/Ponzi düzenlerinde gerçek bir ekonomik faaliyet yoktur; ödemeler yeni katılımcıların parasıyla yapılır ve yeni katılımcı bulunamadığında sistem çöker.',
  },
  {
    id: 7,
    title: 'Soru 7',
    question:
      'Bankanız SMS ile size bir doğrulama (OTP) kodu gönderir. Telefonla arayan biri, banka çalışanı olduğunu söyleyerek "işleminizi onaylamak için" bu kodu sizden ister. Bu durumda doğru davranış hangisidir?',
    options: [
      { id: 'A', label: 'Kodu hemen söylemek, çünkü bankalar bazen telefonla arar.' },
      {
        id: 'B',
        label:
          'Kodu kimseyle paylaşmamak; hiçbir banka çalışanı SMS doğrulama kodunu telefonda sizden istemez, şüpheli durumda doğrudan bankayı resmi numaradan aramak.',
      },
      { id: 'C', label: 'Kodu sadece WhatsApp üzerinden yazılı olarak paylaşmak daha güvenlidir.' },
      { id: 'D', label: 'Arayan kişiye T.C. kimlik numaranızı da vererek kimliğinizi doğrulamak.' },
      { id: 'E', label: 'Kodu bir kez kullanıldığı için paylaşmakta sakınca yoktur.' },
    ],
    correctOptionId: 'B',
    explanation: 'OTP/doğrulama kodları tek kullanımlık banka anahtarıdır; hiçbir kurum bunu telefonda veya mesajla istemez. Bu istekler "vishing" (sesli oltalama) yöntemidir.',
  },
  {
    id: 8,
    title: 'Soru 8',
    question:
      'Bir kripto cüzdanı uygulaması kurarken size 12 kelimelik bir "kurtarma/seed" ifadesi (recovery phrase) veriliyor. Bu ifadeyle ilgili doğru güvenlik kuralı hangisidir?',
    options: [
      { id: 'A', label: 'Hatırlaması kolay olsun diye sosyal medya hesabınızın biyografisine yazabilirsiniz.' },
      { id: 'B', label: 'Destek almak için "cüzdan destek ekibi" iddiasıyla sizden isteyen herkese güvenle paylaşabilirsiniz.' },
      {
        id: 'C',
        label:
          'Bu ifadeyi kimseyle paylaşmamalı, sadece fiziksel ve güvenli bir ortamda saklamalısınız; çünkü onu bilen herkes cüzdanınızdaki tüm varlıkları ele geçirebilir.',
      },
      { id: 'D', label: 'Ekran görüntüsü alıp bulut yedeğine (otomatik senkron) kaydetmek en güvenlisidir.' },
      { id: 'E', label: 'İfadeyi unutma riskine karşı birden fazla kişiyle paylaşmak güvenliği artırır.' },
    ],
    correctOptionId: 'C',
    explanation: 'Seed phrase, kripto cüzdanının ana anahtarıdır. Bunu bilen herkes cüzdandaki tüm varlıkları sınırsız şekilde transfer edebilir; hiçbir gerçek destek ekibi bunu sizden istemez.',
  },
  {
    id: 9,
    title: 'Soru 9',
    question:
      'Bir kafede masadaki QR kod menü etiketinin üzerine, gerçek etiketle birebir aynı görünen sahte bir QR kod çıkartması yapıştırılmış. Bu kodu okutan müşteriler sahte bir ödeme sitesine yönlendiriliyor. Bu yöntem, dijital dolandırıcılık literatüründe hangi kavramla açıklanır?',
    options: [
      { id: 'A', label: 'Açığa Satış' },
      { id: 'B', label: 'QR Kod Oltalaması (Quishing)' },
      { id: 'C', label: 'Kaldıraçlı İşlem' },
      { id: 'D', label: 'Marj Tamamlama Çağrısı' },
      { id: 'E', label: 'Temettü Dağıtımı' },
    ],
    correctOptionId: 'B',
    explanation: 'QR kod üzerinden yapılan oltalama saldırılarına "quishing" denir; kısa bir bağlantı sahte olsa da göz kontrolüyle fark edilmesi zordur, bu yüzden bilinmeyen QR kodlar taranmadan önce kaynağı doğrulanmalıdır.',
  },
  {
    id: 10,
    title: 'Soru 10',
    question:
      'Vermediğiniz bir siparişle ilgili "Kargonuz elimizde, teslimat adresini güncellemek için X TL ödeme yapın" diyen bir SMS/link geldiğinde doğru davranış nedir?',
    options: [
      { id: 'A', label: 'Ödemeyi hemen linkten yapmak, çünkü küçük bir tutar risksizdir.' },
      {
        id: 'B',
        label: 'Linke tıklamadan, kargo takip numaranızı ve sipariş bilgisini yalnızca kargo şirketinin resmi uygulaması/web sitesinden doğrulamak.',
      },
      { id: 'C', label: 'Linkteki forma kredi kartı bilgilerinizi girip işlemi tamamlamak.' },
      { id: 'D', label: 'Mesajı yanıtlayarak kişisel bilgilerinizi teyit etmek.' },
      { id: 'E', label: 'SMS\'te firma logosu olduğu için güvenilir kabul etmek.' },
    ],
    correctOptionId: 'B',
    explanation: 'Sahte kargo SMS\'leri, gerçek kargo firmalarının link stilini taklit ederek kart bilgisi çalmayı hedefler; teyit her zaman resmi kanaldan yapılmalıdır.',
  },
  {
    id: 11,
    title: 'Soru 11',
    question:
      'Ayşe, tüm hesaplarında (e-posta, banka, sosyal medya) aynı basit şifreyi kullanıyor. Bir gün en az önemli gördüğü bir forum sitesinin şifre veritabanı hacklenip internete sızdırılıyor. Bu durumda Ayşe\'nin karşılaşabileceği en büyük risk nedir?',
    options: [
      { id: 'A', label: 'Sadece forum hesabının kapatılması.' },
      {
        id: 'B',
        label:
          'Dolandırıcıların sızan şifreyi diğer tüm hesaplarında (banka dahil) deneyerek hesap ele geçirmesi ("kimlik bilgisi doldurma" saldırısı).',
      },
      { id: 'C', label: 'Forum sitesinin Ayşe\'den tazminat talep etmesi.' },
      { id: 'D', label: 'Ayşe\'nin internet hızının yavaşlaması.' },
      { id: 'E', label: 'Herhangi bir risk oluşmaz, çünkü forum önemsizdir.' },
    ],
    correctOptionId: 'B',
    explanation: 'Aynı şifrenin birden fazla platformda kullanılması, tek bir sızıntının tüm hesapları tehlikeye atmasına yol açar (credential stuffing). Her hesap için farklı ve güçlü şifre + iki adımlı doğrulama kullanılmalıdır.',
  },
  {
    id: 12,
    title: 'Soru 12',
    question:
      'Bir dijital dolandırıcılık girişimine maruz kaldığınızda veya şüpheli bir SMS/arama aldığınızda, durumu resmi olarak bildirmek için başvurabileceğiniz kurum/mekanizma aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', label: 'Durumu sadece sosyal medyada paylaşıp arkadaşları uyarmak yeterlidir, resmi bildirim gerekmez.' },
      { id: 'B', label: 'İhbarWeb, 155 Polis İmdat veya BTK/ilgili bankanın resmi şikayet hattı gibi resmi kanallara bildirimde bulunmak.' },
      { id: 'C', label: 'Dolandırıcının numarasını arayıp doğrudan hesap vermesini istemek.' },
      { id: 'D', label: 'Hiçbir şey yapmadan parayı unutmak en pratik çözümdür.' },
      { id: 'E', label: 'Şifrenizi değiştirmeden sadece uygulamayı silmek yeterlidir.' },
    ],
    correctOptionId: 'B',
    explanation: 'Dijital dolandırıcılık vakaları resmi mercilere (İhbarWeb, 155, ilgili banka/kurumun şikayet hattı) bildirilmelidir; bu hem mağduriyetin kayıt altına alınmasını hem de başkalarının korunmasını sağlar.',
  },
];

export function getPerformance(score: number): { label: string; icon: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Siber Güvenlik Uzmanı', icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-900/60 to-slate-900' };
  if (score >= 70) return { label: 'Çok İyi İş!', icon: '🎯', color: 'text-blue-400', bg: 'from-blue-900/60 to-slate-900' };
  if (score >= 50) return { label: 'Kısmi Anlayış', icon: '👍', color: 'text-yellow-400', bg: 'from-yellow-900/60 to-slate-900' };
  if (score >= 25) return { label: 'Gelişim Aşamasında', icon: '📘', color: 'text-orange-400', bg: 'from-orange-900/60 to-slate-900' };
  return { label: 'Gelişime İhtiyaç Var', icon: '📚', color: 'text-red-400', bg: 'from-red-900/60 to-slate-900' };
}
