import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import {
  ArrowLeft, Video, Gamepad2, CheckCircle2,
  Award, Lock, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Özel Video Oynatıcı
import { VideoPlayer } from "../components/VideoPlayer";
// YENİ: Oyun Yönlendiriciyi İçe Aktarıyoruz
import GameContainer from "../../components/games/GameContainer";

// Eski YouTube linkleri için yardımcı fonksiyon
const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const videoIdMatch = url.match(/[?&]v=([^&]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : url.split('/').pop();
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
};

export default function UnitDetail() {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [user, setUser] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeContent, setActiveContent] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { "Authorization": `Token ${token}`, "Content-Type": "application/json" };

        const userRes = await fetch("https://finedu-project.onrender.com/api/me/", { headers });
        const userData = await userRes.json();
        setUser(userData.user);

        const unitRes = await fetch(`https://finedu-project.onrender.com/api/units/${unitId}/`, { headers });
        if (!unitRes.ok) throw new Error("Ünite bulunamadı");
        const unitData = await unitRes.json();
        setUnit(unitData);

        const progressRes = await fetch("https://finedu-project.onrender.com/api/progress/", { headers });
        const progressData = await progressRes.json();
        setCompletedIds(progressData);

      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [unitId, navigate]);

  const markAsCompleted = async (contentId: number) => {
    if (completedIds.includes(contentId)) return;
    
    setIsCompleting(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://finedu-project.onrender.com/api/progress/", {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: contentId })
      });

      if (res.ok) {
        setCompletedIds(prev => [...prev, contentId]);
        alert("Harika! Bu içeriği başarıyla tamamladın. 🎉"); 
      }
    } catch (error) {
      console.error("Kaydedilemedi", error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-primary">İçerikler Yükleniyor...</div>;
  if (!unit) return <div className="text-center p-10">Ünite bulunamadı.</div>;

  const allContents = unit.subtopics?.flatMap((st: any) => st.contents) || [];
  const totalContents = allContents.length;
  const unitCompletedCount = allContents.filter((c: any) => completedIds.includes(c.id)).length;
  const progressPercentage = totalContents === 0 ? 0 : Math.round((unitCompletedCount / totalContents) * 100);

  // YENİ: EĞER SEÇİLEN İÇERİK BİR OYUN İSE, EKRANI TAMAMEN OYUNA ÇEVİRİYORUZ
  if (activeContent && activeContent.content_type === "GAME") {
    return (
      <GameContainer
        gameCode={activeContent.game_code}
        onComplete={(score: number) => {
          // Oyun bittiğinde arka planda videoyla aynı API'ye "bitirdi" sinyali gidiyor
          markAsCompleted(activeContent.id);
        }}
        onBack={() => setActiveContent(null)} // Listeye geri dönme butonu
      />
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar userName={user?.first_name || "Öğrenci"} onLogout={() => navigate("/login")} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="size-4 mr-2" /> Panele Dön
        </Button>

        {/* Ünite Başlığı */}
        <Card variant="success" className="mb-8">
          <CardBody>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="bg-success/10 p-6 rounded-xl"><Award className="size-12 text-success" /></div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{unit.title}</h1>
                <p className="text-muted-foreground mb-4">{unit.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{unitCompletedCount} / {totalContents} içerik tamamlandı</span>
                  <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} className="h-full bg-gradient-to-r from-success to-emerald-500" />
                  </div>
                  <span className="font-semibold text-success">{progressPercentage}%</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* İçerik Listesi */}
        <div className="space-y-6">
          {unit.subtopics?.map((subtopic: any, index: number) => (
            <Card key={subtopic.id} variant="info">
              <CardHeader variant="info"><h3 className="text-lg font-bold">{index + 1}. {subtopic.title}</h3></CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-border">
                  {subtopic.contents?.map((content: any) => {
                    const contentIndex = allContents.findIndex((c: any) => c.id === content.id);
                    const isCompleted = completedIds.includes(content.id);
                    const isLocked = contentIndex > 0 && !completedIds.includes(allContents[contentIndex - 1].id);

                    return (
                      <div key={content.id} className={`p-4 transition-colors ${isLocked ? 'opacity-50 bg-muted/20' : 'hover:bg-muted/50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${isLocked ? 'bg-muted' : (content.content_type === "VIDEO" ? "bg-primary/10" : "bg-warning/10")}`}>
                            {isLocked ? <Lock className="size-5 text-muted-foreground" /> : 
                             content.content_type === "VIDEO" ? <Video className={`size-5 ${isCompleted ? "text-success" : "text-primary"}`} /> : 
                             <Gamepad2 className={`size-5 ${isCompleted ? "text-success" : "text-warning"}`} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">{content.title}</h4>
                              {isCompleted && <CheckCircle2 className="size-5 text-success" />}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {content.content_type === "VIDEO" ? "Video İçerik" : "Etkileşimli Oyun"}
                            </div>
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant={isCompleted ? "outline" : (content.content_type === "VIDEO" ? "primary" : "warning")}
                              disabled={isLocked}
                              onClick={() => {
                                // YENİ: Artık içerik ne olursa olsun (Video/Oyun) içeriği state'e atıyoruz, alerti sildik!
                                setActiveContent(content); 
                              }}
                            >
                              {isLocked ? "Kilitli" : (content.content_type === "VIDEO" ? (isCompleted ? "Tekrar İzle" : "İzle") : (isCompleted ? "Tekrar Oyna" : "Oyna"))}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* VİDEO MODALI (YENİ: Sadece içerik tipi VIDEO ise bu pencere açılır) */}
      <AnimatePresence>
        {activeContent && activeContent.content_type === "VIDEO" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
              
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Video className="size-5 text-primary" />
                  {activeContent.title}
                </h3>
                <button onClick={() => setActiveContent(null)} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="size-6 text-muted-foreground" />
                </button>
              </div>
              
              {/* OYNATICI ALANI */}
              <div className="w-full bg-black flex flex-col justify-center items-center relative min-h-[300px]">
                {activeContent.video_file ? (
                  <div className="w-full h-full p-4">
                    <VideoPlayer 
                      // Render eklentisi SİLİNDİ! Sadece Cloudinary'den gelen temiz link kullanılıyor.
                      videoUrl={activeContent.video_file} 
                      onComplete={() => {
                        markAsCompleted(activeContent.id);
                      }}
                    />
                  </div>
                ) : activeContent.video_url ? (
                  <div className="w-full aspect-video">
                    <iframe
                      src={getEmbedUrl(activeContent.video_url)}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title={activeContent.title}
                    ></iframe>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-white p-10">Video bulunamadı veya yüklenmemiş.</div>
                )}
              </div>

              <div className="p-4 bg-muted/30 flex justify-between items-center border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {activeContent.video_file 
                    ? "Video tamamen bittiğinde ilerlemeniz otomatik olarak kaydedilecektir." 
                    : "Videoyu dikkatlice izledikten sonra tamamla butonuna basabilirsin."}
                </p>
                {(!activeContent.video_file && activeContent.video_url) && (
                  <Button 
                    variant="success" 
                    onClick={() => markAsCompleted(activeContent.id)} 
                    disabled={isCompleting || completedIds.includes(activeContent.id)}
                  >
                    <CheckCircle2 className="size-5 mr-2" />
                    {completedIds.includes(activeContent.id) ? "Tamamlandı" : (isCompleting ? "Kaydediliyor..." : "Videoyu Bitirdim")}
                  </Button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}