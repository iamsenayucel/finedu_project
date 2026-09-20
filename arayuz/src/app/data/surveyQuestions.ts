export interface SurveyOption {
  key: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  section: 1 | 2 | 3;
  text: string;
  options: SurveyOption[];
}

export const PRE_SURVEY_SECTION_TITLES: Record<number, string> = {
  1: "Finans Sektörü ve Kariyer Seçenekleri",
  2: "Bütçe ve Tasarruf Alışkanlıkları",
  3: "Temel Finansal Farkındalık",
};

export const PRE_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    section: 1,
    text: "Gelecekteki kariyerini düşündüğünde; parayı yönetmek, piyasaları analiz etmek veya finansal teknolojiler (FinTech) üretmek fikri sana nasıl geliyor?",
    options: [
      { key: "A", label: "Çok heyecan verici, kesinlikle bu sektörde çalışmak/girişim kurmak isterim." },
      { key: "B", label: "İlgimi çekiyor ama kariyer olarak seçip seçmeyeceğimden tam emin değilim." },
      { key: "C", label: "Sadece kendi paramı yönetmek için öğrenmek isterim, kariyer hedefim farklı." },
    ],
  },
  {
    id: "q2",
    section: 1,
    text: "Finans ve ekonomi dünyasında bir rol üstlenecek olsan, hangisi seni daha çok heyecanlandırırdı?",
    options: [
      { key: "A", label: "Finansal veri analisti, yatırım uzmanı veya portföy yöneticisi olmak." },
      { key: "B", label: "Yeni nesil ödeme sistemleri veya finansal uygulamalar geliştiren bir girişimci olmak." },
      { key: "C", label: "Kurumsal bir şirkette klasik muhasebe ve finans departmanında çalışmak." },
      { key: "D", label: "Hiçbiri, bu alanlarda çalışmak bana göre değil." },
    ],
  },
  {
    id: "q3",
    section: 1,
    text: "Günlük hayatında ekonomi haberlerini, girişimcilik ekosistemini veya borsa/kripto gibi piyasa hareketlerini ne sıklıkla takip edersin?",
    options: [
      { key: "A", label: "Düzenli olarak takip ederim, okumayı ve araştırmayı severim." },
      { key: "B", label: "Sadece karşıma çıkarsa veya popüler bir haber olursa okurum." },
      { key: "C", label: "Hiç takip etmem, bu tarz haberler sıkıcı gelir." },
    ],
  },
  {
    id: "q4",
    section: 1,
    text: "Sence Türkiye'de ve dünyada finans sektörünün, özellikle dijital bankacılık ve yatırım araçlarının geleceği ne yönde ilerliyor?",
    options: [
      { key: "A", label: "Hızla büyüyor ve teknolojiyle (yapay zeka, blokzincir) tamamen şekil değiştiriyor; bu değişimin bir parçası olmak isterim." },
      { key: "B", label: "Büyüyor ama geleneksel sistemler de gücünü korumaya devam edecektir." },
      { key: "C", label: "Bu konuda pek bir fikrim veya öngörüm yok." },
    ],
  },
  {
    id: "q5",
    section: 2,
    text: "İstediğin ama şu anki harçlığını aşan pahalı bir eşyayı (örneğin bir ayakkabı veya oyun) almak için ne yaparsın?",
    options: [
      { key: "A", label: "Param yetene kadar sabırla para biriktiririm." },
      { key: "B", label: "Ailemden veya arkadaşlarımdan borç/ekstra para isterim." },
      { key: "C", label: "Vazgeçerim veya unutup başka bir şey alırım." },
    ],
  },
  {
    id: "q6",
    section: 2,
    text: "“Bütçe yapmak” denildiğinde aklına ilk ne geliyor?",
    options: [
      { key: "A", label: "Elime geçen parayı ve harcamalarımı planlamak, kontrolü elime almak." },
      { key: "B", label: "Sadece yetişkinlerin ve şirketlerin yaptığı karmaşık bir iş." },
      { key: "C", label: "Paramı hiç harcamamak, kendimi sürekli kısıtlamak." },
    ],
  },
  {
    id: "q7",
    section: 2,
    text: "Günlük veya haftalık harcamalarını, yani neye ne kadar para verdiğini takip eder misin?",
    options: [
      { key: "A", label: "Evet, not alırım veya zihnimde net bir hesabım vardır." },
      { key: "B", label: "Bazen takip ederim ama çoğu zaman paramın nereye gittiğini anlamam." },
      { key: "C", label: "Hayır, hiç takip etmem." },
    ],
  },
  {
    id: "q8",
    section: 2,
    text: "Beklenmedik bir durum, örneğin kulaklığının bozulması için kenarda duran bir “Acil Durum” paran var mı?",
    options: [
      { key: "A", label: "Evet, böyle durumlar için her zaman köşede biraz param bulunur." },
      { key: "B", label: "Bazen oluyor, bazen sıfırı tüketiyorum." },
      { key: "C", label: "Hayır, acil bir şey olursa ailemden isterim." },
    ],
  },
  {
    id: "q9",
    section: 3,
    text: "Sence ülkemizde paraları (kağıt banknotları) basmakla görevli olan ve enflasyonla (fiyat artışlarıyla) mücadele eden en yetkili kurum aşağıdakilerden hangisidir?",
    options: [
      { key: "A", label: "Türkiye Cumhuriyet Merkez Bankası (TCMB)" },
      { key: "B", label: "Borsa İstanbul (BİST)" },
      { key: "C", label: "Bankacılık Düzenleme ve Denetleme Kurumu (BDDK)" },
    ],
  },
  {
    id: "q10",
    section: 3,
    text: "“Enflasyon” kelimesini daha önce duydun mu? Sence en basit haliyle ne demektir?",
    options: [
      { key: "A", label: "Evet, fiyatların zamanla artması ve paramızın alım gücünün düşmesi demektir." },
      { key: "B", label: "Duydum ama tam olarak ne anlama geldiğini açıklayamam." },
      { key: "C", label: "Hayır, ilk defa duyuyorum." },
    ],
  },
  {
    id: "q11",
    section: 3,
    text: "Kenara ayırdığın paranın değerini koruması ve zamanla artması için yapılan işleme ne ad verilir?",
    options: [
      { key: "A", label: "Yatırım" },
      { key: "B", label: "Kredi" },
      { key: "C", label: "İndirim" },
    ],
  },
  {
    id: "q12",
    section: 3,
    text: "FinEdu projesine katıldıktan sonra en çok hangi konuda “İşte bunu iyi ki öğrendim!” demek istersin?",
    options: [
      { key: "A", label: "Paramı/Harçlığımı doğru yönetme ve bütçe yapma." },
      { key: "B", label: "Tasarruf taktikleri ve kendi işimi kurma (Girişimcilik) fikirleri." },
      { key: "C", label: "Borsa, kripto, fon gibi yatırım dünyasının temel mantığı." },
      { key: "D", label: "Hiçbiri, sadece sertifika/katılım için buradayım." },
    ],
  },
];

export const POST_SURVEY_SECTION_TITLES: Record<number, string> = {
  1: "Kariyer Vizyonu ve Sektöre İlgi",
  2: "Bütçe ve Tasarruf Alışkanlıkları",
  3: "Temel Finansal Farkındalık",
};

export const POST_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    section: 1,
    text: "FinEdu eğitimlerinden sonra; gelecekte finans dünyasında yer almak, yatırım yapmak veya kendi finansal teknolojini (FinTech) üretmek fikri şimdi sana nasıl geliyor?",
    options: [
      { key: "A", label: "Motivasyonum çok arttı! Kesinlikle bu alanda kendimi geliştirmek veya girişim kurmak istiyorum." },
      { key: "B", label: "Eskisine göre daha çok ilgimi çekiyor, kendime uygun fırsatları değerlendirebilirim." },
      { key: "C", label: "Güzel şeyler öğrendim ama kariyer hedefim hala tamamen farklı bir alanda." },
    ],
  },
  {
    id: "q2",
    section: 1,
    text: "Artık sektörün dinamiklerini daha iyi biliyorsun. Eğer finansal bir projede yer alsaydın, en çok hangi kısımda olmayı tercih ederdin?",
    options: [
      { key: "A", label: "Strateji kuran yatırım uzmanı veya yenilikçi bir uygulamanın (FinTech) kurucu girişimcisi olmak." },
      { key: "B", label: "İşin daha geleneksel muhasebe ve kurumsal finans kısmında çalışmak." },
      { key: "C", label: "Hiçbiri, bu tarz roller hala bana pek hitap etmiyor." },
    ],
  },
  {
    id: "q3",
    section: 1,
    text: "Eğitim sürecine başladığımızdan beri haberlerde, sosyal medyada veya çevrende karşılaştığın ekonomi/borsa/girişimcilik içeriklerine olan yaklaşımın değişti mi?",
    options: [
      { key: "A", label: "Evet, eskiden kaydırıp geçerdim ama artık durup okuyorum ve mantığını anlıyorum." },
      { key: "B", label: "Biraz daha fazla dikkatimi çekiyor ama hala düzenli takip ettiğimi söyleyemem." },
      { key: "C", label: "Hayır, bu tarz içerikler hala hiç ilgimi çekmiyor." },
    ],
  },
  {
    id: "q4",
    section: 1,
    text: "Finansal teknolojileri, uygulamaları ve yeni sistemleri tanıdıktan sonra sence gelecekte paramızı yönetme şeklimiz nasıl olacak?",
    options: [
      { key: "A", label: "Teknoloji (yapay zeka vb.) finansı tamamen değiştirecek, bu dijital devrimin bir parçası olmalıyız." },
      { key: "B", label: "Dijitalleşme artacak ama eski geleneksel sistemler de aynen devam edecek." },
      { key: "C", label: "Bu konuda hala pek bir öngörüm yok." },
    ],
  },
  {
    id: "q5",
    section: 2,
    text: "Diyelim ki karşına çok istediğin ama harçlığını aşan pahalı bir ürün çıktı. FinEdu'da öğrendiklerinden sonra bu ürünü almak için uygulayacağın ilk adım ne olurdu?",
    options: [
      { key: "A", label: "Kendi bütçemi gözden geçirip, o ürüne ulaşmak için bir tasarruf planı oluşturmak." },
      { key: "B", label: "Ailemden veya arkadaşlarımdan borç isteyip sonra ödemeye çalışmak." },
      { key: "C", label: "Param yoksa doğrudan vazgeçmek veya unutup gitmek." },
    ],
  },
  {
    id: "q6",
    section: 2,
    text: "Eğitimler bittikten sonra \"Bütçe yapmak\" fikrine olan bakış açın nasıl değişti?",
    options: [
      { key: "A", label: "Artık bunun kendimi kısıtlamak değil, \"paramın kontrolünü elime alıp hedeflerime ulaşmak\" olduğunu biliyorum." },
      { key: "B", label: "Faydalı olduğunu anladım ama hala uygulaması zor ve karmaşık geliyor." },
      { key: "C", label: "Bakış açım değişmedi, hala sıkıcı ve kısıtlayıcı buluyorum." },
    ],
  },
  {
    id: "q7",
    section: 2,
    text: "Kendi harcamalarındaki \"görünmez delikleri\", yani ufak tefek para sızıntılarını fark edip günlük harcamalarını takip etme konusunda bir adım attın mı?",
    options: [
      { key: "A", label: "Evet, harcamalarımı daha dikkatli izlemeye ve not almaya veya aklımda hesaplamaya başladım." },
      { key: "B", label: "Denemeye çalıştım ama sürekli olarak takip etmekte zorlanıyorum." },
      { key: "C", label: "Hayır, hala paramın nereye gittiğini tam olarak takip etmiyorum." },
    ],
  },
  {
    id: "q8",
    section: 2,
    text: "Beklenmedik durumlar, örneğin telefonun kırılması gibi durumlar için bir \"Acil Durum Fonu\" oluşturma fikri sende nasıl bir karşılık buldu?",
    options: [
      { key: "A", label: "Mantığını çok iyi anladım ve köşede acil durumlar için bir miktar para tutmaya/ayırmaya başladım." },
      { key: "B", label: "Neden gerekli olduğunu anladım ama henüz para ayırmaya fırsatım olmadı." },
      { key: "C", label: "Hala böyle bir fon oluşturmayı düşünmüyorum, bir şey olursa ailemden isterim." },
    ],
  },
  {
    id: "q9",
    section: 3,
    text: "Televizyonda \"Faiz kararı açıklandı ve paramızın değerini korumak için yeni önlemler alındı\" haberini duyduğunda, artık sence bu kararı alan en yetkili kurum hangisidir?",
    options: [
      { key: "A", label: "Türkiye Cumhuriyet Merkez Bankası (TCMB)" },
      { key: "B", label: "Borsa İstanbul (BİST)" },
      { key: "C", label: "Bankacılık Düzenleme ve Denetleme Kurumu (BDDK)" },
    ],
  },
  {
    id: "q10",
    section: 3,
    text: "Markete gittiğinde, çok sevdiğin ve geçen ay 50 TL olan bir atıştırmalığın artık 75 TL olduğunu gördün. Paramızın alım gücünü düşüren bu olayın finansal literatürdeki adı nedir?",
    options: [
      { key: "A", label: "Enflasyon" },
      { key: "B", label: "İskonto" },
      { key: "C", label: "Arbitraj" },
    ],
  },
  {
    id: "q11",
    section: 3,
    text: "Kenara ayırdığın tasarruflarının enflasyon karşısında erimesini engellemek ve o parayı senin için \"çalışan\" bir araca dönüştürmek için yapman gereken temel işlem nedir?",
    options: [
      { key: "A", label: "Parayı doğru araçlarda değerlendirerek \"Yatırım\" yapmak." },
      { key: "B", label: "Parayı sadece kumbarada veya vadesiz hesapta nakit olarak bekletmek." },
      { key: "C", label: "Paranın değer kaybedeceğini düşünüp hepsini hemen harcamak." },
    ],
  },
  {
    id: "q12",
    section: 3,
    text: "Bütün bu süreci tamamladığında, FinEdu'nun sana kattığı en değerli kazanım sence hangisi oldu?",
    options: [
      { key: "A", label: "Sadece bütçe yapmayı değil; girişimciliği, finans sektörünün mantığını ve yatırımı keşfedip ufkumu genişletmek." },
      { key: "B", label: "Paramı nereye harcadığımı fark edip, kendi bütçemi daha kontrollü yönetmeyi öğrenmek." },
      { key: "C", label: "Özel bir kazanım hissetmiyorum, sadece eğitimi tamamlamış oldum." },
    ],
  },
];

export const SURVEY_QUESTIONS_BY_TYPE: Record<string, SurveyQuestion[]> = {
  pre_survey: PRE_SURVEY_QUESTIONS,
  post_survey: POST_SURVEY_QUESTIONS,
};

export const SURVEY_SECTION_TITLES_BY_TYPE: Record<string, Record<number, string>> = {
  pre_survey: PRE_SURVEY_SECTION_TITLES,
  post_survey: POST_SURVEY_SECTION_TITLES,
};
