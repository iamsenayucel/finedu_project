import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getCached, setCached } from "../utils/apiCache";
import { Navbar } from "../components/Navbar";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import {
  Plus, BookOpen, Video, Gamepad2, Users,
  Trash2, Edit, ChevronDown, ChevronRight, Layers, X, UserPlus,
  ArrowUp, ArrowDown, BarChart2, TrendingUp, AlertTriangle, Award, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GAME_OPTIONS = [
  { value: "financial_detective", label: "🕵️‍♂️ Finansal Haber Dedektifi (10. Sınıf)" },
  { value: "drag_drop_needs", label: "🛒 İstek mi İhtiyaç mı? (İlkokul)" },
  { value: "risk_hunter", label: "🎯 Risk Hunter - Portföy Yöneticisi" },
  { value: "real_data_hunter", label: "🔍 Gerçek Veri Avı - Bilgi Doğrulama" },
  { value: "space_shopping_depot", label: "🚀 Uzay Alışveriş Deposu - İstek & İhtiyaç" },
  { value: "risk_return_tradeoff", label: "📈 Mirasın Kaderi - Risk & Getiri" },
  { value: "economic_terms", label: "💡 Ekonomi Terimleri - Kavram Eşleştirme" }
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"units" | "users" | "reports">("units");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<number | null>(null);

  const [modal, setModal] = useState({
    isOpen: false,
    type: "UNIT",
    action: "ADD",
    parentId: null as number | null, 
    data: null as any
  });

  const [formData, setFormData] = useState({
    title: "", target_grade: "", badge_name: "", contentType: "VIDEO", videoUrl: "",
    gameCode: "", email: "", firstName: "", lastName: "", password: "", role: "STUDENT"
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [sortField, setSortField] = useState<'type' | 'completions' | 'avg_score'>('completions');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const headers = { "Authorization": `Token ${token}` };
      const cachedMe = getCached("me");

      const [meRes, unitsRes, usersRes] = await Promise.all([
        cachedMe ? Promise.resolve(null) : fetch("https://finedu-project.onrender.com/api/me/", { headers }),
        fetch("https://finedu-project.onrender.com/api/units/", { headers }),
        fetch("https://finedu-project.onrender.com/api/users/", { headers })
      ]);

      let meData = cachedMe;
      if (meRes) {
        meData = await meRes.json();
        setCached("me", meData);
      }
      if (meData.user.role !== "ADMIN") {
        return navigate("/dashboard");
      }

      setCurrentUser(meData.user);
      
      const fetchedUnits = await unitsRes.json();
      fetchedUnits.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      fetchedUnits.forEach((u: any) => {
        if(u.subtopics) {
          u.subtopics.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          u.subtopics.forEach((s: any) => {
            if(s.contents) s.contents.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          });
        }
      });

      setUnits(fetchedUnits);
      setUsers(await usersRes.json());
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchReport = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setReportLoading(true);
    try {
      const res = await fetch("https://finedu-project.onrender.com/api/admin-report/", {
        headers: { "Authorization": `Token ${token}` },
      });
      if (res.ok) setReport(await res.json());
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reports" && !report) fetchReport();
  }, [activeTab]);

  const handleMove = async (type: "UNIT" | "SUBTOPIC" | "CONTENT", list: any[], index: number, direction: "UP" | "DOWN") => {
    if ((direction === "UP" && index === 0) || (direction === "DOWN" && index === list.length - 1)) return;

    const newList = [...list];
    const swapIndex = direction === "UP" ? index - 1 : index + 1;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];

    const itemsPayload = newList.map((item, i) => ({ id: item.id, order: i + 1 }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://finedu-project.onrender.com/api/reorder/", {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type, items: itemsPayload })
      });

      if (res.ok) {
        fetchData(); 
      } else {
        console.error("Sıralama kaydedilemedi.");
      }
    } catch (error) {
      console.error("Bağlantı hatası", error);
    }
  };


  const openModal = (type: string, action: string, parentId: number | null = null, data: any = null) => {
    setModal({ isOpen: true, type, action, parentId, data });
    setVideoFile(null); 
    
    if (action === "EDIT" && data && type !== "USER") {
      setFormData({
        title: data.title || data.contentTitle || "",
        target_grade: data.target_grade || "",
        badge_name: data.badge_name || "",
        contentType: data.content_type || "VIDEO",
        videoUrl: data.video_url || "",
        gameCode: data.game_code || "",
        email: "", firstName: "", lastName: "", password: "", role: "STUDENT"
      });
    } else {
      setFormData({ 
        title: "", target_grade: "", badge_name: "", contentType: "VIDEO", videoUrl: "", gameCode: "",
        email: "", firstName: "", lastName: "", password: "", role: "STUDENT"
      });
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.type === "USER") {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) return;
      if (formData.role === "STUDENT" && !formData.target_grade) return;
    }

    setIsSaving(true); 
    const token = localStorage.getItem("token");
    let url = "";
    let method = modal.action === "ADD" ? "POST" : "PUT";
    let isFormData = false;
    let bodyData: any = {};
    let formPayload = new FormData();

    if (modal.type === "UNIT") {
      url = modal.action === "ADD" ? "https://finedu-project.onrender.com/api/units/" : `https://finedu-project.onrender.com/api/units/${modal.data.id}/`;
      bodyData = { title: formData.title, badge_name: formData.badge_name, target_grade: formData.target_grade };
    } else if (modal.type === "SUBTOPIC") {
      url = modal.action === "ADD" ? "https://finedu-project.onrender.com/api/subtopics/add/" : `https://finedu-project.onrender.com/api/subtopics/${modal.data.id}/`;
      bodyData = { title: formData.title, unitId: modal.parentId };
    } else if (modal.type === "CONTENT") {
      isFormData = true; 
      url = modal.action === "ADD" ? "https://finedu-project.onrender.com/api/contents/add/" : `https://finedu-project.onrender.com/api/contents/${modal.data.id}/`;
      let finalTitle = formData.title;
      if (formData.contentType === "GAME") {
        if (!formData.gameCode) { setIsSaving(false); return; }
        const selectedGame = GAME_OPTIONS.find(g => g.value === formData.gameCode);
        finalTitle = selectedGame ? selectedGame.label : "İnteraktif Oyun";
        formPayload.append("game_code", formData.gameCode);
      }
      formPayload.append("contentTitle", finalTitle); 
      formPayload.append("contentType", formData.contentType);
      if (modal.parentId) formPayload.append("subtopicId", String(modal.parentId));
      
      if (formData.contentType === "VIDEO") {
        if (videoFile) formPayload.append("video_file", videoFile);
        else if (modal.action === "ADD") { setIsSaving(false); return; }
      }
    } else if (modal.type === "USER") {
      url = "https://finedu-project.onrender.com/api/register/";
      bodyData = {
        username: formData.email, email: formData.email, first_name: formData.firstName,
        last_name: formData.lastName, password: formData.password, role: formData.role,
        grade_level: formData.role === "STUDENT" ? formData.target_grade : null,
      };
    }

    try {
      const headers: any = { "Authorization": `Token ${token}` };
      if (isFormData) {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, url, true);
          xhr.setRequestHeader("Authorization", `Token ${token}`);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) setUploadProgress(Math.round((event.loaded * 100) / event.total));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
            else reject(JSON.parse(xhr.responseText));
          };
          xhr.onerror = () => reject("Network Error");
          xhr.send(formPayload);
        });
      } else {
        headers["Content-Type"] = "application/json";
        const res = await fetch(url, { method, headers, body: JSON.stringify(bodyData) });
        if (!res.ok) throw new Error("İşlem başarısız");
      }
      setModal({ ...modal, isOpen: false });
      fetchData(); 
      setUploadProgress(0); 
    } catch (error: any) { 
      console.error(error);
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm("Bunu kalıcı olarak silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem("token");
    const endpoints: any = { "UNIT": "units", "SUBTOPIC": "subtopics", "CONTENT": "contents", "USER": "users" };
    try {
      const res = await fetch(`https://finedu-project.onrender.com/api/${endpoints[type]}/${id}/`, {
        method: "DELETE", headers: { "Authorization": `Token ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  if (isLoading) return <div className="p-10 text-center font-bold text-primary">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={currentUser?.first_name || "Admin"} onLogout={() => { localStorage.removeItem("token"); navigate("/login"); }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">İçerik Yönetim Paneli</h1>

        <div className="flex gap-2 mb-6 border-b border-border">
          <button onClick={() => setActiveTab("units")} className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === "units" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <BookOpen className="size-4 inline mr-2" /> Eğitim İçerikleri
          </button>
          <button onClick={() => setActiveTab("users")} className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Users className="size-4 inline mr-2" /> Kullanıcılar
          </button>
          <button onClick={() => setActiveTab("reports")} className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === "reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <BarChart2 className="size-4 inline mr-2" /> Raporlar
          </button>
        </div>

        {activeTab === "units" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-xl font-bold">Mevcut Üniteler</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    placeholder="Ünite, konu veya içerik ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Button variant="primary" onClick={() => openModal("UNIT", "ADD")}>
                  <Plus className="size-4 mr-2" /> Yeni Ünite
                </Button>
              </div>
            </div>

            {searchQuery.trim() && (
              <p className="text-sm text-muted-foreground -mt-2 mb-2">
                "<span className="font-semibold text-foreground">{searchQuery}</span>" için sonuçlar
              </p>
            )}

            <div className="space-y-10">
              {[
                { id: "PRIMARY", label: "İlkokul Seviyesi", color: "text-success", border: "border-success/30" },
                { id: "MIDDLE", label: "Ortaokul Seviyesi", color: "text-info", border: "border-info/30" },
                { id: "HIGH", label: "Lise Seviyesi", color: "text-warning", border: "border-warning/30" },
                { id: "UNIVERSITY_FINANCE", label: "Üniversite (Finans/İşletme)", color: "text-purple-600", border: "border-purple-600/30" },
                { id: "UNIVERSITY_GENERAL", label: "Üniversite (Genel)", color: "text-indigo-500", border: "border-indigo-500/30" },
                { id: "OTHER", label: "Seviyesi Belirtilmemiş", color: "text-muted-foreground", border: "border-border" }
              ].map((grade) => {
                const q = searchQuery.trim().toLowerCase();
                const baseUnits = grade.id === "OTHER"
                  ? units.filter((u: any) => !["PRIMARY", "MIDDLE", "HIGH", "UNIVERSITY_FINANCE", "UNIVERSITY_GENERAL"].includes(u.target_grade))
                  : units.filter((u: any) => u.target_grade === grade.id);

                const gradeUnits = q
                  ? baseUnits.filter((u: any) =>
                      u.title?.toLowerCase().includes(q) ||
                      u.subtopics?.some((st: any) =>
                        st.title?.toLowerCase().includes(q) ||
                        st.contents?.some((c: any) => c.title?.toLowerCase().includes(q))
                      )
                    )
                  : baseUnits;

                if (gradeUnits.length === 0) return null;

                return (
                  <div key={grade.id} className="space-y-4">
                    <div className={`flex items-center gap-3 pb-2 border-b ${grade.border}`}>
                      <h3 className={`text-lg font-bold ${grade.color}`}>{grade.label}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{gradeUnits.length} Ünite</span>
                    </div>

                    {gradeUnits.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2 pl-2">Bu seviyeye henüz ünite eklenmemiş.</p>
                    ) : (
                      <div className="space-y-4 pl-1">
                        {gradeUnits.map((unit: any, index: number) => (
                          <div key={unit.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                            <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors ${expandedUnitId === unit.id ? 'bg-muted/20' : ''}`}
                                 onClick={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)}>
                              <div className="flex items-center gap-3">
                                {expandedUnitId === unit.id ? <ChevronDown className="size-5 text-primary" /> : <ChevronRight className="size-5 text-muted-foreground" />}
                                <div className="bg-primary/10 p-2 rounded-lg"><BookOpen className="size-5 text-primary" /></div>
                                <div>
                                  <h3 className="font-bold text-lg">{unit.title}</h3>
                                  <p className="text-xs text-muted-foreground">{unit.subtopics?.length || 0} Alt Başlık</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {/* ÜNİTE YÖN OKLARI (BÜYÜTÜLDÜ) */}
                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => handleMove("UNIT", gradeUnits, index, "UP")} disabled={index === 0}>
                                  <ArrowUp className="size-5 text-primary" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => handleMove("UNIT", gradeUnits, index, "DOWN")} disabled={index === gradeUnits.length - 1}>
                                  <ArrowDown className="size-5 text-primary" />
                                </Button>
                                
                                <div className="w-px h-6 bg-border mx-1"></div> 
                                
                                <Button variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => openModal("UNIT", "EDIT", null, unit)}>
                                  <Edit className="size-5" />
                                </Button>
                                <Button variant="destructive" size="sm" className="h-10 w-10 p-0" onClick={() => handleDelete("UNIT", unit.id)}>
                                  <Trash2 className="size-5" />
                                </Button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedUnitId === unit.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-muted/5">
                                  <div className="p-4 pl-12 space-y-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-semibold text-muted-foreground">Alt Başlıklar</span>
                                      <Button variant="info" size="sm" onClick={() => openModal("SUBTOPIC", "ADD", unit.id)}>
                                        <Plus className="size-3 mr-1" /> Alt Başlık Ekle
                                      </Button>
                                    </div>

                                    {unit.subtopics?.length === 0 && <p className="text-sm text-muted-foreground italic">Henüz alt başlık yok.</p>}

                                    {unit.subtopics?.map((sub: any, subIndex: number) => (
                                      <div key={sub.id} className="border border-info/20 rounded-lg overflow-hidden bg-background">
                                        <div className={`flex items-center justify-between p-3 cursor-pointer hover:bg-info/5 ${expandedSubtopicId === sub.id ? 'bg-info/10' : ''}`}
                                             onClick={() => setExpandedSubtopicId(expandedSubtopicId === sub.id ? null : sub.id)}>
                                          <div className="flex items-center gap-2">
                                            {expandedSubtopicId === sub.id ? <ChevronDown className="size-4 text-info" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                                            <Layers className="size-4 text-info" />
                                            <span className="font-semibold">{sub.title}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            {/* ALT BAŞLIK YÖN OKLARI (BÜYÜTÜLDÜ) */}
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => handleMove("SUBTOPIC", unit.subtopics, subIndex, "UP")} disabled={subIndex === 0}>
                                              <ArrowUp className="size-5 text-info" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => handleMove("SUBTOPIC", unit.subtopics, subIndex, "DOWN")} disabled={subIndex === unit.subtopics.length - 1}>
                                              <ArrowDown className="size-5 text-info" />
                                            </Button>
                                            
                                            <div className="w-px h-5 bg-border mx-1"></div> 
                                            
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => openModal("SUBTOPIC", "EDIT", null, sub)}>
                                              <Edit className="size-5 text-info" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete("SUBTOPIC", sub.id)}>
                                              <Trash2 className="size-5 text-destructive" />
                                            </Button>
                                          </div>
                                        </div>

                                        <AnimatePresence>
                                          {expandedSubtopicId === sub.id && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-info/20 bg-info/5">
                                              <div className="p-3 pl-10 space-y-2">
                                                <div className="flex justify-between items-center mb-2">
                                                  <span className="text-xs font-semibold text-muted-foreground">İçerikler</span>
                                                  <Button variant="success" size="sm" onClick={() => openModal("CONTENT", "ADD", sub.id)}>
                                                    <Plus className="size-3 mr-1" /> İçerik Ekle
                                                  </Button>
                                                </div>
                                                
                                                {sub.contents?.length === 0 && <p className="text-xs text-muted-foreground italic">İçerik yok.</p>}

                                                {sub.contents?.map((content: any, contentIndex: number) => (
                                                  <div key={content.id} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                                                    <div className="flex items-center gap-2">
                                                      {content.content_type === "VIDEO" ? <Video className="size-4 text-success" /> : <Gamepad2 className="size-4 text-warning" />}
                                                      <span className="text-sm font-medium">{content.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      {/* İÇERİK YÖN OKLARI (BÜYÜTÜLDÜ) */}
                                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => handleMove("CONTENT", sub.contents, contentIndex, "UP")} disabled={contentIndex === 0}>
                                                        <ArrowUp className="size-4 text-success" />
                                                      </Button>
                                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => handleMove("CONTENT", sub.contents, contentIndex, "DOWN")} disabled={contentIndex === sub.contents.length - 1}>
                                                        <ArrowDown className="size-4 text-success" />
                                                      </Button>
                                                      
                                                      <div className="w-px h-4 bg-border mx-1"></div> 
                                                      
                                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => openModal("CONTENT", "EDIT", null, content)}>
                                                        <Edit className="size-4" />
                                                      </Button>
                                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => handleDelete("CONTENT", content.id)}>
                                                        <Trash2 className="size-4" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* KULLANICILAR SEKMESİ */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Sistemdeki Kullanıcılar</h2>
              <Button variant="primary" onClick={() => openModal("USER", "ADD")}>
                <UserPlus className="size-4 mr-2" /> Kullanıcı Ekle
              </Button>
            </div>
            
            <div className="space-y-10">
              {[
                { id: "ADMIN", label: "Yöneticiler", color: "text-warning", border: "border-warning/30" },
                { id: "TEACHER", label: "Öğretmenler", color: "text-info", border: "border-info/30" },
                { id: "STUDENT", label: "Öğrenciler", color: "text-success", border: "border-success/30" }
              ].map((roleGroup) => {
                const roleUsers = users.filter((u: any) => u.role === roleGroup.id);

                return (
                  <div key={roleGroup.id} className="space-y-4">
                    <div className={`flex items-center gap-3 pb-2 border-b ${roleGroup.border}`}>
                      <h3 className={`text-lg font-bold ${roleGroup.color}`}>{roleGroup.label}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {roleUsers.length} Kişi
                      </span>
                    </div>

                    {roleUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2 pl-2">Bu grupta henüz kullanıcı bulunmuyor.</p>
                    ) : (
                      <Card>
                        <CardBody className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                  <th className="px-6 py-3 text-sm font-semibold">Kullanıcı Adı</th>
                                  <th className="px-6 py-3 text-sm font-semibold">E-posta</th>
                                  <th className="px-6 py-3 text-sm font-semibold">Ad Soyad</th>
                                  <th className="px-6 py-3 text-sm font-semibold">Rol</th>
                                  <th className="px-6 py-3 text-sm font-semibold">Seviye</th>
                                  <th className="px-6 py-3 text-sm font-semibold text-right">İşlemler</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {roleUsers.map((u: any) => (
                                  <tr key={u.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 font-medium">{u.username}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                                    <td className="px-6 py-4">{u.first_name} {u.last_name}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        u.role === 'ADMIN' ? 'bg-warning/10 text-warning' : 
                                        u.role === 'TEACHER' ? 'bg-info/10 text-info' : 
                                        'bg-success/10 text-success'
                                      }`}>
                                        {u.role === 'ADMIN' ? 'Yönetici' : 
                                         u.role === 'TEACHER' ? 'Öğretmen' : 
                                         u.role === 'STUDENT' ? 'Öğrenci' : u.role}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      {u.grade_level === 'PRIMARY' ? 'İlkokul' :
                                       u.grade_level === 'MIDDLE' ? 'Ortaokul' :
                                       u.grade_level === 'HIGH' ? 'Lise' :
                                       u.grade_level === 'UNIVERSITY_FINANCE' ? 'Üniv. (Finans)' :
                                       u.grade_level === 'UNIVERSITY_GENERAL' ? 'Üniv. (Genel)' : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {u.id !== currentUser?.id && (
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete("USER", u.id)}>
                                          <Trash2 className="size-4" />
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RAPORLAR SEKMESİ */}
      {activeTab === "reports" && (
        <div className="space-y-6 px-4 md:px-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Platform Raporları</h2>
            <button onClick={fetchReport} className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <Activity className="size-4" /> Yenile
            </button>
          </div>

          {reportLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-pulse bg-muted" />)}
            </div>
          )}

          {report && !reportLoading && (
            <>
              {/* KPI Kartları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Toplam Öğrenci', value: report.summary.total_students, icon: '👥', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Bu Hafta Aktif', value: report.summary.active_this_week, icon: '🔥', color: 'bg-orange-50 border-orange-200 text-orange-700' },
                  { label: 'Toplam Tamamlama', value: report.summary.total_completions, icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { label: 'Ortalama Puan', value: report.summary.avg_score, icon: '⭐', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                ].map((kpi, i) => (
                  <div key={i} className={`rounded-xl border-2 p-4 ${kpi.color}`}>
                    <div className="text-2xl mb-1">{kpi.icon}</div>
                    <div className="text-3xl font-black">{kpi.value}</div>
                    <div className="text-sm font-medium mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Son 7 Gün Aktivite */}
                <Card>
                  <CardBody>
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <Activity className="size-4 text-primary" /> Son 7 Günlük Aktivite
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {report.daily_activity.map((d: any, i: number) => {
                        const max = Math.max(...report.daily_activity.map((x: any) => x.count), 1);
                        const pct = Math.round((d.count / max) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-slate-500">{d.count}</span>
                            <div className="w-full rounded-t-md bg-indigo-500 transition-all" style={{ height: `${Math.max(pct, 4)}%`, minHeight: 4 }} />
                            <span className="text-xs text-slate-400">{d.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>

                {/* Sınıf Dağılımı */}
                <Card>
                  <CardBody>
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary" /> Sınıf Seviyesi Dağılımı
                    </h3>
                    <div className="space-y-3">
                      {report.grade_distribution.map((g: any, i: number) => {
                        const max = Math.max(...report.grade_distribution.map((x: any) => x.count), 1);
                        const pct = Math.round((g.count / max) * 100);
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{g.label}</span>
                              <span className="font-bold text-primary">{g.count} öğrenci</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full">
                              <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Öğrenci */}
                <Card>
                  <CardBody>
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <Award className="size-4 text-yellow-500" /> Top 10 Öğrenci
                    </h3>
                    <div className="space-y-2">
                      {report.top_students.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0
                            ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-muted text-muted-foreground'}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.grade_level} · 🔥 {s.streak_days} gün</p>
                          </div>
                          <span className="font-black text-primary text-sm">{s.total_score} pt</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {/* Risk Altındaki Öğrenciler */}
                <Card>
                  <CardBody>
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <AlertTriangle className="size-4 text-orange-500" /> Risk Altındaki Öğrenciler
                      <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                        7+ gün inaktif
                      </span>
                    </h3>
                    {report.at_risk.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">🎉 Tüm öğrenciler aktif!</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {report.at_risk.map((s: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 border border-orange-100">
                            <span className="text-xl">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                            <span className="text-xs font-bold text-orange-600 shrink-0">{s.last_active}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* İçerik Performans Tablosu */}
              <Card>
                <CardBody>
                  <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                    <BarChart2 className="size-4 text-primary" /> İçerik Performansı
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-bold text-muted-foreground">İçerik</th>
                          <th className="text-left py-2 px-3 font-bold text-muted-foreground">Ünite</th>
                          {(['type', 'completions', 'avg_score'] as const).map((field) => {
                            const labels: Record<string, string> = { type: 'Tür', completions: 'Tamamlama', avg_score: 'Ort. Puan' };
                            const active = sortField === field;
                            return (
                              <th
                                key={field}
                                className="text-center py-2 px-3 font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                                onClick={() => {
                                  if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                  else { setSortField(field); setSortDir('desc'); }
                                }}
                              >
                                <span className="inline-flex items-center gap-1 justify-center">
                                  {labels[field]}
                                  {active ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-slate-300">↕</span>}
                                </span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {[...report.content_stats].sort((a: any, b: any) => {
                          let av = a[sortField];
                          let bv = b[sortField];
                          if (sortField === 'type') { av = av ?? ''; bv = bv ?? ''; }
                          else { av = av ?? 0; bv = bv ?? 0; }
                          if (av < bv) return sortDir === 'asc' ? -1 : 1;
                          if (av > bv) return sortDir === 'asc' ? 1 : -1;
                          return 0;
                        }).map((c: any, i: number) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 px-3 font-medium">{c.title}</td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{c.unit}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.type === 'VIDEO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {c.type === 'VIDEO' ? '🎬 Video' : '🎮 Oyun'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{c.completions}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`font-bold ${c.avg_score >= 70 ? 'text-emerald-600' : c.avg_score >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {c.avg_score > 0 ? c.avg_score : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ORTAK AÇILIR PENCERE (MODAL) FORM */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-lg">
                  {modal.action === "ADD" ? "Yeni " : "Düzenle: "}
                  {modal.type === "UNIT" ? "Ünite" : 
                   modal.type === "SUBTOPIC" ? "Alt Başlık" : 
                   modal.type === "USER" ? "Kullanıcı" : "İçerik"}
                </h3>
                <button onClick={() => setModal({ ...modal, isOpen: false })} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="size-5" />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleModalSubmit} className="space-y-4">
                  
                  {modal.type === "UNIT" && (
                    <>
                      <Input label="Ünite Başlığı" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Rozet Adı" value={formData.badge_name} onChange={(e) => setFormData({...formData, badge_name: e.target.value})} required />
                        <Select label="Eğitim Seviyesi" value={formData.target_grade} onChange={(e) => setFormData({...formData, target_grade: e.target.value})} options={[
                          { value: "", label: "Seçiniz" }, 
                          { value: "PRIMARY", label: "İlkokul" }, 
                          { value: "MIDDLE", label: "Ortaokul" }, 
                          { value: "HIGH", label: "Lise" }, 
                          { value: "UNIVERSITY_FINANCE", label: "Üniversite (Finans/İşletme)" },
                          { value: "UNIVERSITY_GENERAL", label: "Üniversite (Genel)" }
                        ]} required />
                      </div>
                    </>
                  )}

                  {modal.type === "SUBTOPIC" && (
                    <Input label="Alt Başlık Adı" placeholder="Örn: Paranın Tarihi" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                  )}

                  {modal.type === "CONTENT" && (
                    <>
                      <Select label="İçerik Tipi" value={formData.contentType} onChange={(e) => setFormData({...formData, contentType: e.target.value})} options={[
                        { value: "VIDEO", label: "Video" }, { value: "GAME", label: "Oyun" }
                      ]} required />
                      
                      {formData.contentType === "VIDEO" && (
                        <>
                          <Input label="İçerik Başlığı" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Sisteme Video Yükle (.mp4)
                            </label>
                            <input
                              type="file"
                              accept="video/mp4,video/x-m4v,video/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setVideoFile(e.target.files[0]);
                                }
                              }}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            />
                            {modal.action === "EDIT" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Mevcut videoyu değiştirmek istemiyorsanız boş bırakın.
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      {formData.contentType === "GAME" && (
                        <Select 
                          label="Hangi Oyunu Eklemek İstiyorsunuz?" 
                          value={formData.gameCode} 
                          onChange={(e) => setFormData({...formData, gameCode: e.target.value})} 
                          options={[
                            { value: "", label: "Lütfen bir oyun seçin..." },
                            ...GAME_OPTIONS
                          ]} 
                          required 
                        />
                      )}
                    </>
                  )}

                  {modal.type === "USER" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Ad" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                        <Input label="Soyad" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                      </div>
                      <Input label="E-posta" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      <Input label="Şifre" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                        <Select label="Rol" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} options={[
                          { value: "STUDENT", label: "Öğrenci" }, 
                          { value: "TEACHER", label: "Öğretmen" }, 
                          { value: "ADMIN", label: "Yönetici" }
                        ]} />
                        {formData.role === "STUDENT" && (
                          <Select label="Eğitim Seviyesi" value={formData.target_grade} onChange={(e) => setFormData({...formData, target_grade: e.target.value})} options={[
                            { value: "", label: "Seçiniz" }, 
                            { value: "PRIMARY", label: "İlkokul" }, 
                            { value: "MIDDLE", label: "Ortaokul" }, 
                            { value: "HIGH", label: "Lise" }, 
                            { value: "UNIVERSITY", label: "Üniversite" }
                          ]} />
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    {isSaving && uploadProgress > 0 && formData.contentType === "VIDEO" && (
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1 text-muted-foreground font-semibold">
                          <span>Video Yükleniyor...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border">
                          <div 
                            className="bg-primary h-2.5 transition-all duration-300 ease-out" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <Button type="submit" variant="primary" fullWidth disabled={isSaving}>
                      {isSaving ? "İşlem yapılıyor..." : (modal.action === "ADD" ? "Kaydet" : "Güncelle")}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}