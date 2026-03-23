import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import {
  BookOpen, Award, Users, Settings, TrendingUp,
  Target, Play, Lock, Plus, UserPlus, X, GraduationCap, CheckCircle2, Gamepad2
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

  const [isLoading, setIsLoading] = useState(true);

  // --- ÖĞRETMEN STATE'LERİ ---
  const [classrooms, setClassrooms] = useState<any[]>([]);
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
      const [meRes, progRes] = await Promise.all([
        fetch("https://finedu-project.onrender.com/api/me/", { headers }),
        fetch("https://finedu-project.onrender.com/api/progress/", { headers })
      ]);
      
      const meData = await meRes.json();
      setUser(meData.user);
      setUnits(meData.units);

      if (progRes.ok) {
        const progData = await progRes.json();
        // YENİ: Puan detaylarını kaydet
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
        fetchClassrooms(headers);
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

  useEffect(() => { fetchData(); }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleUnitClick = (unitId: number) => {
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
    return <div className="min-h-screen flex items-center justify-center text-primary font-bold">Verileriniz yükleniyor...</div>;
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

    return (
      <div className="min-h-screen bg-background relative">
        <Navbar userName={user.first_name || "Öğrenci"} onLogout={handleLogout} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hoş geldin Kartı */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card variant="success" className="mb-8 overflow-visible">
              <CardBody className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-success/10 p-6 rounded-full shadow-inner">
                  <Award className="size-16 text-success" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg"><BookOpen className="size-6 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Ünite</p>
                    <p className="text-2xl font-bold text-foreground">{units.length}</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="bg-warning/10 p-3 rounded-lg"><Target className="size-6 text-warning" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tamamlama</p>
                    <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="bg-info/10 p-3 rounded-lg"><TrendingUp className="size-6 text-info" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Haftalık İlerleme</p>
                    <p className="text-2xl font-bold text-foreground">{globalCompleted > 0 ? "Devam Ediyor" : "Yeni Başladı"}</p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>

          {/* Dinamik Üniteler Listesi */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Eğitim Ünitelerin</h3>
            </div>

            {units.length === 0 ? (
               <div className="p-6 bg-warning/10 text-warning rounded-lg border border-warning">
                 Henüz senin seviyene uygun bir ünite eklenmemiş. Lütfen daha sonra tekrar kontrol et!
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {units.map((unit, index) => {
                  const isLocked = false; 

                  let unitTotal = 0;
                  let unitCompleted = 0;
                  unit.subtopics?.forEach((sub: any) => {
                    sub.contents?.forEach((content: any) => {
                      unitTotal++;
                      if (completedContents.includes(content.id)) unitCompleted++;
                    });
                  });
                  const progress = unitTotal === 0 ? 0 : Math.round((unitCompleted / unitTotal) * 100);

                  return (
                    <motion.div key={unit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 * index }}>
                      <Card className={isLocked ? "opacity-60" : ""}>
                        <CardBody>
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${isLocked ? "bg-muted" : "bg-gradient-to-br from-primary/10 to-indigo-100"}`}>
                              {isLocked ? <Lock className="size-6 text-muted-foreground" /> : <BookOpen className="size-6 text-primary" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-foreground mb-1">{unit.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">Bu ünitedeki konuları tamamla ve rozeti kap!</p>
                              <div className="flex items-center gap-2 text-xs font-semibold text-warning">
                                <Award className="size-4" />
                                <span>{unit.badge_name || "Gizli Rozet"}</span>
                              </div>
                            </div>
                          </div>

                          {!isLocked && (
                            <>
                              <div className="mb-4">
                                <div className="flex justify-between text-xs text-muted-foreground font-bold mb-1">
                                  <span>İlerleme</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary to-indigo-500" />
                                </div>
                              </div>
                              <Button variant="primary" size="sm" fullWidth onClick={() => handleUnitClick(unit.id)}>
                                <Play className="size-4 mr-2" /> İçeriklere Göz At
                              </Button>
                            </>
                          )}
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
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
        <Navbar userName={user.first_name || "Öğretmen"} onLogout={handleLogout} />
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