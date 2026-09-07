import { useState, useEffect, Fragment } from "react";
import { getCached, setCached, invalidateCache } from "../utils/apiCache";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import {
  BookOpen, Award, Users, TrendingUp,
  Target, Play, Lock, Plus, UserPlus, X, GraduationCap, CheckCircle2, Gamepad2,
  Flame, Trophy, BarChart2, AlertCircle, Settings, Heart, MapPin,
  Landmark, LineChart, Coins, Scale, History, PieChart, CreditCard, Smartphone, ShieldCheck, HandCoins, Cloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [completedContents, setCompletedContents] = useState<number[]>([]);
  
  // YENİ: Oyunlaştırma Modalları ve Puan Detayları İçin State'ler
  const [progressDetails, setProgressDetails] = useState<any[]>([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [supportPreference, setSupportPreference] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);

  // --- ÖĞRETMEN STATE'LERİ ---
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", grade_level: "" });
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [studentCode, setStudentCode] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [studentDetail, setStudentDetail] = useState<any>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { "Authorization": `Token ${token}`, "Content-Type": "application/json" };

    try {
      const cachedMe = getCached("me");

      // me cache'deyse atla, progress her zaman taze çek
      const [meRes, progRes] = await Promise.all([
        cachedMe ? Promise.resolve(null) : fetch("https://finedu-project.onrender.com/api/me/", { headers }),
        fetch("https://finedu-project.onrender.com/api/progress/", { headers }),
      ]);

      let meData = cachedMe;
      if (meRes) {
        meData = await meRes.json();
        setCached("me", meData);
      }
      if (meData.user.role === "STUDENT") {
        const surveyRes = await fetch("https://finedu-project.onrender.com/api/survey/pre_survey/status/", { headers });
        if (surveyRes.ok) {
          const surveyData = await surveyRes.json();
          if (!surveyData.is_completed) {
            navigate("/pre-survey");
            return;
          }
        }

        // Öğrenci tüm zorunlu eğitim içeriklerini bitirdiyse ve Son Anket'i
        // henüz doldurmadıysa, panele girmeden önce Son Anket'e yönlendir.
        const completedCount = meData.user.completed_count ?? 0;
        const totalContentCount = meData.user.total_content_count ?? 0;
        if (totalContentCount > 0 && completedCount >= totalContentCount) {
          const postSurveyRes = await fetch("https://finedu-project.onrender.com/api/survey/post_survey/status/", { headers });
          if (postSurveyRes.ok) {
            const postSurveyData = await postSurveyRes.json();
            if (!postSurveyData.is_completed) {
              navigate("/post-survey");
              return;
            }
          }
        }

        const prefRes = await fetch("https://finedu-project.onrender.com/api/student/support-preference/", { headers });
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          setSupportPreference(prefData.preference);
        }
      }

      setUser(meData.user);
      setUnits(meData.units);

      if (progRes.ok) {
        const progData = await progRes.json();
        setProgressDetails(progData);
        let ids: number[] = [];
        if (Array.isArray(progData)) {
          ids = progData.map((p: any) => Number(typeof p === 'object' ? (p.content || p.content_id) : p));
        } else if (progData.completed_contents) {
          ids = progData.completed_contents.map(Number);
        }
        setCompletedContents(ids);
      }

      if (meData.user.role === "TEACHER") {
        // classrooms ve analytics aynı anda başlasın
        Promise.all([fetchClassrooms(headers), fetchAnalytics()]);
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassrooms = async (headers: any) => {
    const classRes = await fetch("https://finedu-project.onrender.com/api/classrooms/", { headers });
    if (classRes.ok) setClassrooms(await classRes.json());
  };

  const fetchAnalytics = async (headers?: any) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLoadingAnalytics(true);
    try {
      const h = headers || { "Authorization": `Token ${token}` };
      const res = await fetch("https://finedu-project.onrender.com/api/analytics/", { headers: h });
      if (res.ok) setAnalytics(await res.json());
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => { fetchData(); }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    invalidateCache();
    navigate("/login");
  };

  const handleUnitClick = (unitId: number | string) => {
    if (unitId === "values-bridge") {
      navigate("/values-bridge");
      return;
    }
    navigate(`/unit/${unitId}`);
  };

  // --- ÖĞRETMEN FONKSİYONLARI ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("https://finedu-project.onrender.com/api/classrooms/", {
      method: "POST", headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(classForm)
    });
    if (res.ok) {
      setShowClassModal(false); setClassForm({ name: "", grade_level: "" });
      fetchClassrooms({ "Authorization": `Token ${token}`, "Content-Type": "application/json" });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch(`https://finedu-project.onrender.com/api/classrooms/${selectedClassId}/add_student/`, {
      method: "POST", headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ student_code: studentCode })
    });
    if (res.ok) {
      fetchClassrooms({ "Authorization": `Token ${token}`, "Content-Type": "application/json" });
      setShowStudentModal(false);
    } 
  };

  const handleStudentClick = async (studentId: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`https://finedu-project.onrender.com/api/student/${studentId}/detail/`, {
      headers: { "Authorization": `Token ${token}` }
    });
    if (res.ok) {
      setStudentDetail(await res.json());
      setShowDetailModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userName="" onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-36 w-full animate-pulse bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-48 animate-pulse bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // --- 1. ÖĞRENCİ PANELİ ---
  if (user?.role === "STUDENT") {
    
    let globalTotal = 0;
    let globalCompleted = 0;
    units.forEach(unit => {
      unit.subtopics?.forEach((sub: any) => {
        sub.contents?.forEach((content: any) => {
          globalTotal++;
          if (completedContents.includes(content.id)) globalCompleted++;
        });
      });
    });
    const overallProgress = globalTotal === 0 ? 0 : Math.round((globalCompleted / globalTotal) * 100);

    // Roadmap: her ünite için ilerleme + kilit durumu (sıradaki tamamlanmamış ünite "current", sonrakiler "locked")
    // Değerler Köprüsü her zaman yolun en sonunda, ayrı bir "bölüm" olarak yer alır ve
    // yalnızca tüm eğitim üniteleri tamamlandığında açılır.
    const unitIconPool = [Landmark, LineChart, Coins, Scale, History, PieChart, CreditCard, Smartphone, ShieldCheck, HandCoins];
    const unitsWithStatus = (() => {
      const withProgress = units.map((unit) => {
        let unitTotal = 0, unitCompleted = 0;
        unit.subtopics?.forEach((sub: any) => {
          sub.contents?.forEach((content: any) => {
            unitTotal++;
            if (completedContents.includes(content.id)) unitCompleted++;
          });
        });
        const progress = unitTotal === 0 ? 0 : Math.round((unitCompleted / unitTotal) * 100);
        const completed = unitTotal > 0 && unitCompleted === unitTotal;
        return { unit, progress, completed };
      });
      let currentIdx = withProgress.findIndex((u) => !u.completed);
      if (currentIdx === -1) currentIdx = withProgress.length;
      const withStatus = withProgress.map((u, idx) => ({
        ...u,
        status: u.completed ? "completed" : idx === currentIdx ? "current" : "locked",
      }));

      const allUnitsCompleted = units.length > 0 && withProgress.every((u) => u.completed);
      const valuesBridgeStatus = !allUnitsCompleted ? "locked" : supportPreference ? "completed" : "current";
      withStatus.push({
        unit: { id: "values-bridge", title: "Değerler Köprüsü" },
        progress: valuesBridgeStatus === "completed" ? 100 : 0,
        completed: valuesBridgeStatus === "completed",
        status: valuesBridgeStatus,
        isValuesBridge: true,
      });

      return withStatus;
    })();
    const roadmapRows: any[][] = [];
    for (let i = 0; i < unitsWithStatus.length; i += 3) {
      roadmapRows.push(unitsWithStatus.slice(i, i + 3));
    }

    return (
      <div className="min-h-screen bg-background relative">
        <Navbar userName={user.first_name || "Öğrenci"} onLogout={handleLogout} streakDays={user.streak_days} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hoş geldin Kartı */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card variant="info" className="mb-8 overflow-visible">
              <CardBody className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-gradient-to-br from-primary to-info p-6 rounded-full shadow-lg shadow-primary/20">
                  <Award className="size-16 text-white drop-shadow" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Merhaba {user.first_name || user.username}! 👋
                  </h2>
                  <p className="text-muted-foreground mb-1">
                    Seviye: <span className="font-semibold text-foreground">
                      {user.grade_level === 'PRIMARY' ? 'İlkokul' :
                       user.grade_level === 'MIDDLE' ? 'Ortaokul' :
                       user.grade_level === 'HIGH' ? 'Lise' :
                       user.grade_level === 'UNIVERSITY_FINANCE' ? 'Üniversite (Finans/İşletme)' :
                       user.grade_level === 'UNIVERSITY_GENERAL' ? 'Üniversite (Genel)' : "Belirtilmemiş"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Öğrenci Kodun: <span className="font-mono font-semibold text-foreground">{user.student_code}</span>
                  </p>
                </div>

                {/* YENİ: TIKLANABİLİR ROZET VE PUAN ALANI */}
                <div className="flex gap-4">
                  <div 
                    onClick={() => setShowBadgesModal(true)}
                    className="text-center cursor-pointer hover:scale-105 transition-transform group"
                  >
                    <div className="bg-success text-success-foreground rounded-xl px-5 py-3 font-black text-3xl mb-1 shadow-md group-hover:shadow-lg transition-all">
                      {user?.earned_badges?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground font-bold group-hover:text-success transition-colors">Rozet</p>
                  </div>
                  
                  <div 
                    onClick={() => setShowScoresModal(true)}
                    className="text-center cursor-pointer hover:scale-105 transition-transform group"
                  >
                    <div className="bg-primary text-primary-foreground rounded-xl px-5 py-3 font-black text-3xl mb-1 shadow-md group-hover:shadow-lg transition-all">
                      {user?.total_score || 0}
                    </div>
                    <p className="text-xs text-muted-foreground font-bold group-hover:text-primary transition-colors">Puan</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <Card>
                <CardBody className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0"><BookOpen className="size-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Toplam Ünite</p>
                    <p className="text-2xl font-bold text-foreground">{units.length}</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Card>
                <CardBody className="flex items-center gap-3">
                  <div className="bg-warning/10 p-3 rounded-lg flex-shrink-0"><Target className="size-5 text-warning" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tamamlama</p>
                    <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <Card>
                <CardBody className="flex items-center gap-3">
                  <div className="bg-success/10 p-3 rounded-lg flex-shrink-0"><Trophy className="size-5 text-success" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Toplam Puan</p>
                    <p className="text-2xl font-bold text-foreground">{user.total_score || 0}</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
              <Card className={user.streak_days > 0 ? "border-orange-200" : ""}>
                <CardBody className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-lg flex-shrink-0"><Flame className="size-5 text-orange-500" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Günlük Seri</p>
                    <p className="text-2xl font-bold text-orange-600">{user.streak_days || 0} gün</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>

          {/* Dinamik Üniteler Listesi - Roadmap */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="size-5 text-primary" /> Eğitim Ünitelerin
              </h3>
            </div>

            {units.length === 0 ? (
               <div className="p-6 bg-warning/10 text-warning rounded-lg border border-warning">
                 Henüz senin seviyene uygun bir ünite eklenmemiş. Lütfen daha sonra tekrar kontrol et!
               </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-sky-50 via-primary/5 to-transparent p-4 sm:p-8">
                <div className="pointer-events-none absolute -top-16 -left-16 size-56 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 size-64 rounded-full bg-amber-200/20 blur-3xl" />
                <Cloud className="pointer-events-none absolute top-4 right-8 size-16 text-white/70 sm:size-24" fill="currentColor" strokeWidth={0} />
                <Cloud className="pointer-events-none absolute bottom-6 left-4 size-12 text-white/60 sm:size-20" fill="currentColor" strokeWidth={0} />

                <div className="relative flex flex-col">
                  {roadmapRows.map((row, rowIndex) => {
                    const reversed = rowIndex % 2 === 1;
                    const isLastRow = rowIndex === roadmapRows.length - 1;

                    return (
                      <div key={rowIndex}>
                        <div className={`flex items-center ${reversed ? "flex-row-reverse" : ""}`}>
                          {row.map((item, i) => {
                            const isLastInRow = i === row.length - 1;
                            const nextItem = row[i + 1];
                            const segmentActive = !!nextItem && item.status !== "locked" && nextItem.status !== "locked";
                            const isVB = !!item.isValuesBridge;
                            const Icon = isVB ? Heart : unitIconPool[(rowIndex * 3 + i) % unitIconPool.length];
                            const vbTooltip = item.status === "locked"
                              ? "Tüm eğitim ünitelerini tamamlayınca açılır"
                              : item.status === "completed"
                              ? "Sosyal sorumluluk tercihini gör ya da değiştir"
                              : "Tebrikler, yolu tamamladın! Bağış yapmaya hak kazandın";

                            return (
                              <Fragment key={item.unit.id}>
                                <motion.div
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.35, delay: 0.06 * (rowIndex * 3 + i) }}
                                  className="relative min-w-0 flex-1"
                                >
                                  {item.status === "current" && (
                                    <span className={`absolute -top-3 left-4 z-10 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-md ${isVB ? "bg-rose-500" : "bg-amber-500"}`}>
                                      {isVB ? "Bağışa Hak Kazandın" : "Devam Ediyor"}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={item.status === "locked"}
                                    onClick={() => handleUnitClick(item.unit.id)}
                                    title={isVB ? vbTooltip : (item.status === "locked" ? "Önceki üniteyi tamamlayınca açılır" : item.unit.title)}
                                    className={`relative flex w-full items-center gap-2 sm:gap-3 rounded-2xl border-2 p-2.5 sm:p-4 text-left shadow-md transition-all
                                      ${item.status === "locked" ? "cursor-not-allowed border-border bg-muted/40 opacity-70" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"}
                                      ${item.status === "completed" ? (isVB ? "border-rose-300 bg-rose-50" : "border-emerald-300 bg-emerald-50") : ""}
                                      ${item.status === "current" ? (isVB ? "border-rose-300 bg-rose-50 ring-2 ring-rose-200" : "border-amber-300 bg-amber-50 ring-2 ring-amber-200") : ""}
                                    `}
                                  >
                                    <div className={`flex size-11 sm:size-12 flex-shrink-0 items-center justify-center rounded-xl shadow-inner
                                      ${item.status === "locked" ? "bg-muted-foreground/10" : ""}
                                      ${item.status === "completed" ? (isVB ? "bg-gradient-to-br from-rose-400 to-pink-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600") : ""}
                                      ${item.status === "current" ? (isVB ? "bg-gradient-to-br from-rose-400 to-pink-500" : "bg-gradient-to-br from-amber-400 to-orange-500") : ""}
                                    `}>
                                      {item.status === "locked" ? (
                                        <Lock className="size-5 text-muted-foreground/50" />
                                      ) : (
                                        <Icon className="size-5 sm:size-6 text-white drop-shadow" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`truncate text-sm sm:text-base font-bold ${item.status === "locked" ? "text-muted-foreground/60" : "text-foreground"}`}>
                                        {item.unit.title}
                                      </p>
                                      <span className={`flex items-center gap-1 text-[11px] sm:text-xs font-semibold ${item.status === "completed" ? (isVB ? "text-rose-600" : "text-emerald-600") : item.status === "current" ? (isVB ? "text-rose-600" : "text-amber-600") : "text-muted-foreground/50"}`}>
                                        {isVB ? (
                                          item.status === "completed" ? "Tercihin kaydedildi" : item.status === "current" ? "Bağış yapmaya hak kazandın!" : (
                                            <span className="flex items-center gap-1"><Lock className="size-2.5" /> Kilitli</span>
                                          )
                                        ) : (
                                          item.status === "completed" ? "Tamamlandı" : item.status === "current" ? `%${item.progress} tamamlandı` : (
                                            <span className="flex items-center gap-1"><Lock className="size-2.5" /> Kilitli</span>
                                          )
                                        )}
                                      </span>
                                    </div>
                                    {item.status === "completed" && (
                                      <span className="absolute -top-2 -right-2 rounded-full bg-white p-0.5 shadow">
                                        <CheckCircle2 className={`size-5 ${isVB ? "text-rose-500" : "text-emerald-500"}`} />
                                      </span>
                                    )}
                                    {item.status === "locked" && (
                                      <span className="absolute -top-2 -right-2 rounded-full border border-border bg-white p-1 shadow">
                                        <Lock className="size-3 text-muted-foreground/50" />
                                      </span>
                                    )}
                                  </button>
                                </motion.div>

                                {!isLastInRow && (
                                  <div className="relative h-1.5 w-4 flex-shrink-0 sm:w-8 md:w-10">
                                    <div className={`h-full w-full rounded-full ${segmentActive ? "bg-gradient-to-r from-emerald-400 to-amber-400" : "bg-muted"}`} />
                                    {segmentActive && (
                                      <Coins className="absolute -top-4 left-1/2 size-4 -translate-x-1/2 text-amber-400 drop-shadow" />
                                    )}
                                  </div>
                                )}
                              </Fragment>
                            );
                          })}
                        </div>

                        {!isLastRow && (
                          <div className={`flex ${reversed ? "flex-row-reverse" : ""}`}>
                            {row.map((_, i) => (
                              <Fragment key={i}>
                                <div className="flex min-w-0 flex-1 justify-center py-1">
                                  {i === row.length - 1 && (
                                    <div
                                      className={`h-8 sm:h-10 w-1.5 rounded-full ${
                                        row[row.length - 1]?.status !== "locked" ? "bg-gradient-to-b from-emerald-400 to-amber-400" : "bg-muted"
                                      }`}
                                    />
                                  )}
                                </div>
                                {i < row.length - 1 && <div className="w-4 flex-shrink-0 sm:w-8 md:w-10" />}
                              </Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* YENİ: ROZET VE PUAN MODALLARI */}
        <AnimatePresence>
          {/* ROZETLERİM MODALI */}
          {showBadgesModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border">
                <div className="flex justify-between items-center p-5 border-b border-border bg-success/10">
                  <h3 className="font-bold text-success flex items-center gap-2 text-xl"><Award className="size-6" /> Rozetlerim</h3>
                  <button onClick={() => setShowBadgesModal(false)} className="p-1 hover:bg-success/20 rounded-full transition-colors text-success"><X className="size-6" /></button>
                </div>
                <div className="p-6 bg-muted/10">
                  {!user?.earned_badges || user.earned_badges.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                      <Award className="size-16 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">Henüz bir rozet kazanamadın.<br/>Eğitim ünitelerini %100 tamamlayarak ilk rozetini kap!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                      {user.earned_badges.map((badge: string, i: number) => (
                        <div key={i} className="flex flex-col items-center justify-center p-5 bg-background border-2 border-warning/30 rounded-2xl shadow-sm text-center hover:border-warning hover:shadow-md transition-all">
                           <div className="text-5xl mb-3 drop-shadow-md">🏆</div>
                           <p className="font-bold text-sm text-foreground">{badge}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* PUAN GEÇMİŞİM MODALI */}
          {showScoresModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border">
                <div className="flex justify-between items-center p-5 border-b border-border bg-primary/10">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xl"><Target className="size-6" /> Puan Geçmişim</h3>
                  <button onClick={() => setShowScoresModal(false)} className="p-1 hover:bg-primary/20 rounded-full transition-colors text-primary"><X className="size-6" /></button>
                </div>
                <div className="p-0">
                  {progressDetails.filter(p => p.score && p.score > 0).length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 px-6">
                      <Gamepad2 className="size-16 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">Henüz puan kazanmadın.<br/>Eğitimdeki etkileşimli oyunları oynayarak hemen puan toplamaya başla!</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border max-h-[50vh] overflow-y-auto">
                      {progressDetails.filter(p => p.score && p.score > 0).map((p, i) => (
                        <li key={i} className="p-5 flex justify-between items-center hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="bg-warning/20 p-2.5 rounded-xl border border-warning/30"><Gamepad2 className="size-5 text-warning"/></div>
                             <span className="font-semibold text-sm text-foreground leading-tight">{p.content__title || "İnteraktif Oyun"}</span>
                          </div>
                          <div className="font-black text-2xl text-success drop-shadow-sm">+{p.score}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="p-5 bg-muted/50 border-t border-border flex justify-between items-center shadow-inner">
                     <span className="font-bold text-muted-foreground">TOPLAM PUAN</span>
                     <span className="font-black text-3xl text-primary drop-shadow-md">{user?.total_score || 0}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- 2. ÖĞRETMEN PANELİ ---
  if (user?.role === "TEACHER") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userName={user.first_name || "Öğretmen"} onLogout={handleLogout} streakDays={undefined} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Öğretmen Paneli</h1>
            <Button variant="info" onClick={() => setShowClassModal(true)}>
              <Plus className="size-4 mr-2" /> Yeni Sınıf Oluştur
            </Button>
          </div>

          {classrooms.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
              <GraduationCap className="size-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold">Henüz Sınıfınız Yok</h3>
              <Button variant="info" className="mt-4" onClick={() => setShowClassModal(true)}>İlk Sınıfımı Oluştur</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((cls) => (
                <Card key={cls.id} className="border-t-4 border-t-info shadow-md hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{cls.name}</h3>
                        <span className="text-xs bg-info/10 text-info px-2 py-1 rounded-full font-semibold">
                          {cls.grade_level === 'PRIMARY' ? 'İlkokul' : 
                           cls.grade_level === 'MIDDLE' ? 'Ortaokul' : 
                           cls.grade_level === 'HIGH' ? 'Lise' : 
                           cls.grade_level === 'UNIVERSITY_FINANCE' ? 'Üniversite (Finans)' : 
                           cls.grade_level === 'UNIVERSITY_GENERAL' ? 'Üniversite (Genel)' : cls.grade_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-full text-xs font-bold">
                        <Users className="size-3" /> {cls.students.length}
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="bg-muted/20 rounded-lg p-2 min-h-[150px] max-h-[250px] overflow-y-auto mb-4 border border-border">
                      {cls.students.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground mt-10">Öğrenci eklenmemiş.</p>
                      ) : (
                        <ul className="space-y-2">
                          {cls.students.map((student: any) => (
                            <li key={student.id} onClick={() => handleStudentClick(student.id)}
                                className="p-3 bg-background rounded-lg border border-border shadow-sm cursor-pointer hover:border-info transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-foreground">{student.first_name} {student.last_name}</span>
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{student.student_code}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-success" style={{ width: `${student.progress}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-success">{student.progress}%</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button variant="outline" fullWidth onClick={() => { setSelectedClassId(cls.id); setShowStudentModal(true); }}>
                      <UserPlus className="size-4 mr-2" /> Öğrenci Kodu ile Ekle
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* LEADERBOARD */}
          {classrooms.length > 0 && (() => {
            const allStudents = classrooms.flatMap((cls: any) => cls.students || []);
            const unique = Array.from(new Map(allStudents.map((s: any) => [s.id, s])).values());
            const sorted = [...unique].sort((a: any, b: any) => (b.total_score || 0) - (a.total_score || 0)).slice(0, 10);
            return (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="size-5 text-yellow-500" />
                  <h2 className="text-xl font-bold text-foreground">Liderlik Tablosu</h2>
                  <span className="text-xs text-muted-foreground ml-1">— tüm sınıflar</span>
                </div>
                <Card>
                  <CardBody className="p-0">
                    <div className="divide-y divide-border">
                      {sorted.map((student: any, idx: number) => (
                        <div key={student.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0
                            ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm">{student.first_name} {student.last_name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-success" style={{ width: `${student.progress}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{student.progress}%</span>
                              {student.streak_days > 0 && (
                                <span className="text-xs text-orange-500 flex items-center gap-0.5">
                                  <Flame className="size-3" />{student.streak_days}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="font-black text-success text-lg">{student.total_score || 0}</div>
                        </div>
                      ))}
                      {sorted.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-8">Henüz sınıflarda öğrenci yok.</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            );
          })()}

          {/* ANALİTİK */}
          <div className="mt-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">İçerik Analizi</h2>
              <span className="text-xs text-muted-foreground ml-1">— en düşük tamamlanma oranları</span>
            </div>
            {isLoadingAnalytics ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-muted rounded-xl" />)}
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                <AlertCircle className="size-10 mx-auto text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Analiz için sınıflara öğrenci ekleyin.</p>
              </div>
            ) : (
              <Card>
                <CardBody className="p-0">
                  <div className="divide-y divide-border">
                    {analytics.map((item: any) => (
                      <div key={item.content_id} className="px-5 py-3 flex items-center gap-4">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${item.content_type === 'VIDEO' ? 'bg-primary/10' : 'bg-warning/10'}`}>
                          {item.content_type === 'VIDEO' ? <TrendingUp className="size-4 text-primary" /> : <Gamepad2 className="size-4 text-warning" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{item.content_title}</p>
                          <p className="text-xs text-muted-foreground">{item.unit_title}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.completion_rate >= 70 ? 'bg-success' : item.completion_rate >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                              style={{ width: `${item.completion_rate}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold w-10 text-right ${item.completion_rate >= 70 ? 'text-success' : item.completion_rate >= 40 ? 'text-warning' : 'text-destructive'}`}>
                            {item.completion_rate}%
                          </span>
                          <span className="text-xs text-muted-foreground">{item.completed_count}/{item.total_students}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* ÖĞRETMEN MODALLARI */}
        <AnimatePresence>
          {showClassModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-background rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-info/10">
                  <h3 className="font-bold text-info">Yeni Sınıf</h3>
                  <button onClick={() => setShowClassModal(false)}><X className="size-5" /></button>
                </div>
                <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                  <Input label="Sınıf Adı" placeholder="5/A" value={classForm.name} onChange={(e) => setClassForm({...classForm, name: e.target.value})} required />
                  <Select label="Seviye" value={classForm.grade_level} onChange={(e) => setClassForm({...classForm, grade_level: e.target.value})} options={[
                    { value: "", label: "Seçiniz" }, 
                    { value: "PRIMARY", label: "İlkokul" }, 
                    { value: "MIDDLE", label: "Ortaokul" }, 
                    { value: "HIGH", label: "Lise" },
                    { value: "UNIVERSITY_FINANCE", label: "Üniversite (Finans)" },
                    { value: "UNIVERSITY_GENERAL", label: "Üniversite (Genel)" }
                  ]} required />
                  <Button type="submit" variant="info" fullWidth>Oluştur</Button>
                </form>
              </motion.div>
            </div>
          )}

          {showStudentModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-background rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-muted/30">
                  <h3 className="font-bold">Öğrenci Ekle</h3>
                  <button onClick={() => setShowStudentModal(false)}><X className="size-5" /></button>
                </div>
                <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                  <Input label="Öğrenci Kodu" placeholder="E07D818B" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} required />
                  <Button type="submit" variant="primary" fullWidth>Ekle</Button>
                </form>
              </motion.div>
            </div>
          )}

          {showDetailModal && studentDetail && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-background rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-primary/10 to-info/10">
                  <h3 className="font-bold text-xl">{studentDetail.first_name} {studentDetail.last_name}</h3>
                  <button onClick={() => setShowDetailModal(false)} className="bg-background p-1.5 rounded-full hover:bg-muted"><X className="size-5" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-muted-foreground">Genel Eğitim İlerlemesi</span>
                      <span className="text-primary">{studentDetail.progress_percent}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${studentDetail.progress_percent}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center gap-4">
                    <div className="bg-background p-2 rounded-full shadow-sm"><Play className="size-5 text-info" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Son Kaldığı Eğitim İçeriği</p>
                      <p className="font-bold text-sm text-foreground">{studentDetail.last_watched}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Award className="size-4 text-warning" /> Kazanılan Rozetler</h4>
                    {studentDetail.earned_badges.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg">Henüz rozet kazanamadı.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {studentDetail.earned_badges.map((badge: string, i: number) => (
                          <span key={i} className="bg-warning/20 text-warning-foreground border border-warning/50 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                            🏆 {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Tamamladığı Bölümler</h4>
                    {studentDetail.completed_contents.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg">Henüz içerik tamamlamadı.</p>
                    ) : (
                      <ul className="text-sm space-y-2 max-h-36 overflow-y-auto pr-2">
                        {studentDetail.completed_contents.map((title: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
                            <div className="size-2 bg-success rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div> 
                            <span className="font-medium text-muted-foreground">{title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- 3. ADMIN PANELİ ---
  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={user?.first_name || "Yönetici"} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card variant="warning" className="mb-8">
            <CardHeader variant="warning">
              <h2 className="text-xl font-bold">Yönetici Paneli</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-warning/10 p-4 rounded-lg">
                  <Settings className="size-8 text-warning" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">İçerik Yönetimi</h3>
                  <p className="text-muted-foreground mb-4">Sisteme yeni üniteler, videolar ve oyunlar eklemek için admin paneline geçiş yapın.</p>
                </div>
              </div>
              <Button variant="warning" onClick={() => navigate("/admin")}>
                <Settings className="size-5 mr-2" /> İçerik Yönetimine Git
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}