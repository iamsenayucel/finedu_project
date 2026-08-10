import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://finedu-project.onrender.com";
const SURVEY_TYPE = "pre_survey";

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
  1: "Finans Sektörü ve Kariyer Seçenekleri",
  2: "Bütçe ve Tasarruf Alışkanlıkları",
  3: "Temel Finansal Farkındalık",
};

const QUESTIONS: SurveyQuestion[] = [
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

export default function PreSurvey() {
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

    fetch(`${API_BASE}/api/survey/${SURVEY_TYPE}/status/`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.is_completed) {
          navigate("/dashboard");
          return;
        }
        const savedAnswers: Record<string, string> = data.answers || {};
        setAnswers(savedAnswers);
        const firstUnanswered = QUESTIONS.findIndex((q) => !savedAnswers[q.id]);
        setCurrentIndex(firstUnanswered === -1 ? QUESTIONS.length - 1 : firstUnanswered);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Anket yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.");
        setIsLoading(false);
      });
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
              <Sparkles className="size-12 text-white" />
            </div>
          </div>
          <Card>
            <CardBody className="py-10">
              <p className="text-xl font-semibold text-foreground leading-relaxed">
                Harika, seni biraz daha yakından tanıdık! Hazırsan, paranın kurallarını yeniden yazacağımız FinEdu macerası başlıyor.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="mt-8"
                onClick={() => navigate("/dashboard")}
              >
                Maceraya Başla <ArrowRight className="size-5 ml-2" />
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
          <h1 className="text-2xl font-bold text-foreground">Ön Anket</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bu bir sınav değil — seni ve beklentilerini tanımak istiyoruz.
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
