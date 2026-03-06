import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import {
  Plus, BookOpen, Video, Gamepad2, Users,
  Trash2, Edit, ChevronDown, ChevronRight, Layers, X, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"units" | "users">("units");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AĞAÇ YAPISI İÇİN GENİŞLETME DURUMLARI
  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<number | null>(null);

  // TEK BİR MODAL YÖNETİMİ
  const [modal, setModal] = useState({
    isOpen: false,
    type: "UNIT", // 'UNIT' | 'SUBTOPIC' | 'CONTENT' | 'USER'
    action: "ADD", // 'ADD' | 'EDIT'
    parentId: null as number | null, 
    data: null as any
  });

  // Modal form state
  const [formData, setFormData] = useState({
    title: "", target_grade: "", badge_name: "", contentType: "VIDEO", videoUrl: "",
    email: "", firstName: "", lastName: "", password: "", role: "STUDENT"
  });

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const headers = { "Authorization": `Token ${token}` };
      const [meRes, unitsRes, usersRes] = await Promise.all([
        fetch("https://finedu-project.onrender.com/api/me/", { headers }),
        fetch("https://finedu-project.onrender.com/api/units/", { headers }),
        fetch("https://finedu-project.onrender.com/api/users/", { headers })
      ]);

      const meData = await meRes.json();
      if (meData.user.role !== "ADMIN") {
        alert("Yetkisiz giriş!");
        return navigate("/dashboard");
      }
      
      setCurrentUser(meData.user);
      setUnits(await unitsRes.json());
      setUsers(await usersRes.json());
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // MODAL AÇMA YARDIMCISI
  const openModal = (type: string, action: string, parentId: number | null = null, data: any = null) => {
    setModal({ isOpen: true, type, action, parentId, data });
    
    if (action === "EDIT" && data && type !== "USER") {
      setFormData({
        title: data.title || data.contentTitle || "",
        target_grade: data.target_grade || "",
        badge_name: data.badge_name || "",
        contentType: data.content_type || "VIDEO",
        videoUrl: data.video_url || "",
        email: "", firstName: "", lastName: "", password: "", role: "STUDENT"
      });
    } else {
      setFormData({ 
        title: "", target_grade: "", badge_name: "", contentType: "VIDEO", videoUrl: "",
        email: "", firstName: "", lastName: "", password: "", role: "STUDENT"
      });
    }
  };

  // EKLEME VE DÜZENLEME İŞLEMİ (Kaydet Butonu)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modal.type === "USER") {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        return alert("Lütfen Ad, Soyad, E-posta ve Şifre alanlarının hepsini doldurun!");
      }
      if (formData.role === "STUDENT" && !formData.target_grade) {
        return alert("Lütfen öğrenci için bir Eğitim Seviyesi seçin!");
      }
    }

    const token = localStorage.getItem("token");
    let url = "";
    let method = modal.action === "ADD" ? "POST" : "PUT";
    let bodyData: any = {};

    if (modal.type === "UNIT") {
      url = modal.action === "ADD" ? "https://finedu-project.onrender.com/api/units/" : `https://finedu-project.onrender.com/api/units/${modal.data.id}/`;
      bodyData = { title: formData.title, badge_name: formData.badge_name, target_grade: formData.target_grade };
    } 
    else if (modal.type === "SUBTOPIC") {
      url = modal.action === "ADD" ? "https://finedu-project.onrender.com/api/subtopics/add/" : `https://finedu-project.onrender.com/api/subtopics/${modal.data.id}/`;
      bodyData = { title: formData.title, unitId: modal.parentId };
    } 
    else if (modal.type === "CONTENT") {
      url = modal.action === "ADD" ? "https://finedu-project.onrender.com/api/contents/add/" : `https://finedu-project.onrender.com/api/contents/${modal.data.id}/`;
      bodyData = { contentTitle: formData.title, contentType: formData.contentType, videoUrl: formData.videoUrl, subtopicId: modal.parentId };
    }
    else if (modal.type === "USER") {
      url = "https://finedu-project.onrender.com/api/register/";
      bodyData = {
        username: formData.email,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        role: formData.role,
        grade_level: formData.role === "STUDENT" ? formData.target_grade : null,
      };
    }

    try {
      const res = await fetch(url, {
        method, headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setModal({ ...modal, isOpen: false });
        fetchData(); 
        if (modal.type === "USER") alert("Kullanıcı başarıyla oluşturuldu!");
      } else { 
        const errorData = await res.json();
        alert("İşlem başarısız oldu:\n" + (errorData.error || JSON.stringify(errorData))); 
      }
    } catch (error) { 
      console.error(error); 
      alert("Sunucuya bağlanılamadı.");
    }
  };

  // SİLME İŞLEMİ
  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm("Bunu kalıcı olarak silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem("token");
    const endpoints: any = { "UNIT": "units", "SUBTOPIC": "subtopics", "CONTENT": "contents", "USER": "users" };
    
    try {
      const res = await fetch(`https://finedu-project.onrender.com/api/${endpoints[type]}/${id}/`, {
        method: "DELETE", headers: { "Authorization": `Token ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Silme işlemi başarısız.");
      }
    } catch (error) { 
      console.error(error); 
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold text-primary">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={currentUser?.first_name || "Admin"} onLogout={() => { localStorage.removeItem("token"); navigate("/login"); }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">İçerik Yönetim Paneli</h1>

        <div className="flex gap-2 mb-6 border-b border-border">
          <button onClick={() => setActiveTab("units")} className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === "units" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <BookOpen className="size-4 inline mr-2" />
            Eğitim İçerikleri
          </button>
          <button onClick={() => setActiveTab("users")} className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Users className="size-4 inline mr-2" />
            Kullanıcılar
          </button>
        </div>

        {/* ÜNİTELER SEKMESİ */}
        {activeTab === "units" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Mevcut Üniteler</h2>
              <Button variant="primary" onClick={() => openModal("UNIT", "ADD")}>
                <Plus className="size-4 mr-2" /> Yeni Ünite
              </Button>
            </div>

            {/* SEVİYELERE GÖRE GRUPLANMIŞ AĞAÇ YAPISI */}
            <div className="space-y-10">
              {[
                { id: "PRIMARY", label: "İlkokul Seviyesi", color: "text-success", border: "border-success/30" },
                { id: "MIDDLE", label: "Ortaokul Seviyesi", color: "text-info", border: "border-info/30" },
                { id: "HIGH", label: "Lise Seviyesi", color: "text-warning", border: "border-warning/30" },
                { id: "UNIVERSITY_FINANCE", label: "Üniversite (Finans/İşletme)", color: "text-purple-600", border: "border-purple-600/30" },
                { id: "UNIVERSITY_GENERAL", label: "Üniversite (Genel)", color: "text-indigo-500", border: "border-indigo-500/30" },
                { id: "OTHER", label: "Seviyesi Belirtilmemiş", color: "text-muted-foreground", border: "border-border" }
              ].map((grade) => {
                // Bu seviyeye ait olan üniteleri filtrele
                const gradeUnits = grade.id === "OTHER" 
                  ? units.filter((u: any) => !["PRIMARY", "MIDDLE", "HIGH", "UNIVERSITY_FINANCE", "UNIVERSITY_GENERAL"].includes(u.target_grade))
                  : units.filter((u: any) => u.target_grade === grade.id);
                
                // Eğer "Diğer" kategorisinde hiç ünite yoksa o başlığı ekranda gösterme
                if (grade.id === "OTHER" && gradeUnits.length === 0) return null;

                return (
                  <div key={grade.id} className="space-y-4">
                    
                    {/* Seviye Başlığı */}
                    <div className={`flex items-center gap-3 pb-2 border-b ${grade.border}`}>
                      <h3 className={`text-lg font-bold ${grade.color}`}>{grade.label}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {gradeUnits.length} Ünite
                      </span>
                    </div>

                    {gradeUnits.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2 pl-2">Bu seviyeye henüz ünite eklenmemiş.</p>
                    ) : (
                      <div className="space-y-4 pl-1">
                        {gradeUnits.map((unit: any) => (
                          <div key={unit.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                            
                            {/* ÜNİTE BAŞLIĞI */}
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
                                <Button variant="outline" size="sm" onClick={() => openModal("UNIT", "EDIT", null, unit)}><Edit className="size-4" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete("UNIT", unit.id)}><Trash2 className="size-4" /></Button>
                              </div>
                            </div>

                            {/* ALT BAŞLIKLAR (Ünite Genişletildiyse) */}
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

                                    {unit.subtopics?.map((sub: any) => (
                                      <div key={sub.id} className="border border-info/20 rounded-lg overflow-hidden bg-background">
                                        
                                        {/* ALT BAŞLIK BAŞLIĞI */}
                                        <div className={`flex items-center justify-between p-3 cursor-pointer hover:bg-info/5 ${expandedSubtopicId === sub.id ? 'bg-info/10' : ''}`}
                                             onClick={() => setExpandedSubtopicId(expandedSubtopicId === sub.id ? null : sub.id)}>
                                          <div className="flex items-center gap-2">
                                            {expandedSubtopicId === sub.id ? <ChevronDown className="size-4 text-info" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                                            <Layers className="size-4 text-info" />
                                            <span className="font-semibold">{sub.title}</span>
                                          </div>
                                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openModal("SUBTOPIC", "EDIT", null, sub)}><Edit className="size-3.5" /></Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete("SUBTOPIC", sub.id)}><Trash2 className="size-3.5" /></Button>
                                          </div>
                                        </div>

                                        {/* İÇERİKLER (Alt Başlık Genişletildiyse) */}
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

                                                {sub.contents?.map((content: any) => (
                                                  <div key={content.id} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                                                    <div className="flex items-center gap-2">
                                                      {content.content_type === "VIDEO" ? <Video className="size-4 text-success" /> : <Gamepad2 className="size-4 text-warning" />}
                                                      <span className="text-sm font-medium">{content.title}</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openModal("CONTENT", "EDIT", null, content)}><Edit className="size-3" /></Button>
                                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete("CONTENT", content.id)}><Trash2 className="size-3" /></Button>
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
            
            {/* ROLLERE GÖRE GRUPLANMIŞ KULLANICI LİSTESİ */}
            <div className="space-y-10">
              {[
                { id: "ADMIN", label: "Yöneticiler", color: "text-warning", border: "border-warning/30" },
                { id: "TEACHER", label: "Öğretmenler", color: "text-info", border: "border-info/30" },
                { id: "STUDENT", label: "Öğrenciler", color: "text-success", border: "border-success/30" }
              ].map((roleGroup) => {
                // Bu role ait kullanıcıları filtrele
                const roleUsers = users.filter((u: any) => u.role === roleGroup.id);

                return (
                  <div key={roleGroup.id} className="space-y-4">
                    
                    {/* Rol Başlığı */}
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
                      <Input label="İçerik Başlığı" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                      <Select label="İçerik Tipi" value={formData.contentType} onChange={(e) => setFormData({...formData, contentType: e.target.value})} options={[
                        { value: "VIDEO", label: "Video" }, { value: "GAME", label: "Oyun" }
                      ]} required />
                      {formData.contentType === "VIDEO" && (
                        <Input label="Video URL" placeholder="https://www.youtube.com/watch?v=..." value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} required />
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

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button type="submit" variant="primary" fullWidth>
                      {modal.action === "ADD" ? "Kaydet" : "Güncelle"}
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