import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { GraduationCap, ArrowRight, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://finedu-project.onrender.com";
const SURVEY_TYPE = "post_survey";

interface SurveyOption {
  key: string;
  label: string;
}

interface SurveyQuestion {
  id: string;
  section: 1 | 2 | 3;
  text: string;
  options: SurveyOption[];
}

const SECTION_TITLES: Record<number, string> = {
  1: "Kariyer Vizyonu ve Sektöre İlgi",
  2: "Bütçe ve Tasarruf Alışkanlıkları",
  3: "Temel Finansal Farkındalık",
};

const QUESTIONS: SurveyQuestion[] = [
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

const COMPLETION_MESSAGE =
  "FinEdu programını başarıyla tamamladın, tebrikler! 🏆 Gelişimini görmek harika. Artık o sıkıcı kuralları bir kenara bırakıp, öğrendiğin yeni nesil finans taktiklerini gerçek hayatta kendi bütçen için uygulama vakti!";

export default function PostSurvey() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { "Authorization": `Token ${token}`, "Content-Type": "application/json" };

    const init = async () => {
      try {
        // Öğrenci, zorunlu tüm eğitim içeriklerini tamamlamadan Son Anket'e erişemez.
        const meRes = await fetch(`${API_BASE}/api/me/`, { headers });
        const meData = await meRes.json();
        if (meRes.ok && meData.user?.role === "STUDENT") {
          const completed = meData.user.completed_count ?? 0;
          const total = meData.user.total_content_count ?? 0;
          if (total === 0 || completed < total) {
            navigate("/dashboard");
            return;
          }
        }

        const statusRes = await fetch(`${API_BASE}/api/survey/${SURVEY_TYPE}/status/`, { headers });
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error();

        if (statusData.is_completed) {
          navigate("/dashboard");
          return;
        }
        const savedAnswers: Record<string, string> = statusData.answers || {};
        setAnswers(savedAnswers);
        const firstUnanswered = QUESTIONS.findIndex((q) => !savedAnswers[q.id]);
        setCurrentIndex(firstUnanswered === -1 ? QUESTIONS.length - 1 : firstUnanswered);
        setIsLoading(false);
      } catch {
        setError("Anket yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.");
        setIsLoading(false);
      }
    };

    init();
  }, [navigate]);

  const question = QUESTIONS[currentIndex];
  const selectedOption = answers[question?.id];
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  const handleSelect = async (optionKey: string) => {
    if (isSaving) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionKey }));
    setIsSaving(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/survey/${SURVEY_TYPE}/answer/`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: question.id, selected_option: optionKey }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("Cevabın kaydedilemedi. Lütfen tekrar dene.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!selectedOption) return;

    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    setIsFinishing(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/survey/${SURVEY_TYPE}/complete/`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      setShowTransition(true);
    } catch {
      setError("Anket tamamlanamadı. Lütfen tekrar dene.");
    } finally {
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
        <div className="h-64 w-full max-w-xl animate-pulse bg-muted rounded-2xl" />
      </div>
    );
  }

  if (showTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg text-center"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-primary to-indigo-600 p-5 rounded-2xl shadow-lg">
              <Trophy className="size-12 text-white" />
            </div>
          </div>
          <Card>
            <CardBody className="py-10">
              <p className="text-xl font-semibold text-foreground leading-relaxed">
                {COMPLETION_MESSAGE}
              </p>
              <Button
                variant="primary"
                size="lg"
                className="mt-8"
                onClick={() => navigate("/dashboard")}
              >
                Panele Dön <ArrowRight className="size-5 ml-2" />
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="bg-gradient-to-br from-primary to-indigo-600 p-3 rounded-xl shadow-lg">
              <GraduationCap className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Son Anket</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bu bir sınav değil — eğitim sürecinin sana kattıklarını birlikte değerlendirelim.
          </p>
        </div>

        <Card>
          <CardBody>
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                <span className="text-primary">{SECTION_TITLES[question.section]}</span>
                <span>{currentIndex + 1} / {QUESTIONS.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full bg-gradient-to-r from-primary to-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-lg font-semibold text-foreground mb-5 leading-relaxed">
                  {question.text}
                </h2>

                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = selectedOption === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleSelect(option.key)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-start gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 size-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {option.key}
                        </span>
                        <span className="text-sm text-foreground leading-snug">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedOption || isFinishing}
                onClick={handleNext}
              >
                {isLastQuestion ? (isFinishing ? "Kaydediliyor..." : "Anketi Tamamla") : "İleri"}
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
