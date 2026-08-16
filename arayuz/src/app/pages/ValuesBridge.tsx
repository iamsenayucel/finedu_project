import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getCached, setCached, invalidateCache } from "../utils/apiCache";
import { Navbar } from "../components/Navbar";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import {
  Heart, Info, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, HeartHandshake,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupportOrganization {
  id: number;
  name: string;
  description: string;
  impact_text: string;
  logo_url: string | null;
  display_order: number;
}

interface SupportPreference {
  id: number;
  organization: SupportOrganization;
  selected_at: string;
}

export default function ValuesBridge() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<SupportOrganization[]>([]);
  const [currentPreference, setCurrentPreference] = useState<SupportPreference | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [pendingOrg, setPendingOrg] = useState<SupportOrganization | null>(null);
  const [submittingOrgId, setSubmittingOrgId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [successOrg, setSuccessOrg] = useState<SupportOrganization | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    setIsLoading(true);
    setLoadError(false);
    try {
      const headers = { "Authorization": `Token ${token}` };
      const cachedMe = getCached("me");

      const [meRes, orgsRes, prefRes] = await Promise.all([
        cachedMe ? Promise.resolve(null) : fetch("https://finedu-project.onrender.com/api/me/", { headers }),
        fetch("https://finedu-project.onrender.com/api/support-organizations/", { headers }),
        fetch("https://finedu-project.onrender.com/api/student/support-preference/", { headers }),
      ]);

      let meData = cachedMe;
      if (meRes) {
        meData = await meRes.json();
        setCached("me", meData);
      }
      setUser(meData.user);

      if (!orgsRes.ok || !prefRes.ok) throw new Error("Sunucudan veri alınamadı.");

      const orgsData = await orgsRes.json();
      const prefData = await prefRes.json();

      setOrganizations(orgsData);
      setCurrentPreference(prefData.preference);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    invalidateCache();
    navigate("/login");
  };

  const submitPreference = async (org: SupportOrganization) => {
    setPendingOrg(null);
    setSubmitError("");
    setSubmittingOrgId(org.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://finedu-project.onrender.com/api/student/support-preference/", {
        method: "PUT",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: org.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Tercih kaydedilemedi. Lütfen tekrar deneyin.");
      }

      const data = await res.json();
      setCurrentPreference(data.preference);
      setSuccessOrg(org);
    } catch (error: any) {
      setSubmitError(error.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmittingOrgId(null);
    }
  };

  const handleSelect = (org: SupportOrganization) => {
    if (submittingOrgId !== null) return;
    if (currentPreference && currentPreference.organization.id === org.id) return;

    if (currentPreference) {
      setPendingOrg(org);
    } else {
      submitPreference(org);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userName="" onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-24 w-full animate-pulse bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 animate-pulse bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userName={user?.first_name || ""} onLogout={handleLogout} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Değerler Köprüsü yüklenemedi</h2>
          <p className="text-muted-foreground mb-6">Sunucuya ulaşılamadı. Lütfen bağlantını kontrol edip tekrar dene.</p>
          <Button variant="primary" onClick={fetchData}>
            <RefreshCw className="size-4 mr-2" /> Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={user?.first_name || "Öğrenci"} onLogout={handleLogout} streakDays={user?.streak_days} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Değerler Köprüsü: Sen Hangisine Destek Olmak İstersin?
          </h1>
          <div className="inline-flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-2.5 max-w-2xl mx-auto text-left">
            <Info className="size-4 text-info flex-shrink-0 mt-0.5" />
            <span>
              Bu bölüm gerçek bir bağış işlemi içermez. Seçimin, sosyal sorumluluk tercihlerini
              anlamak amacıyla FinEdu içerisinde kaydedilir.
            </span>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          {/* SOL PANEL */}
          <div className="w-64 hidden lg:block sticky top-24 flex-shrink-0">
            <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
              <CardBody>
                <h3 className="font-bold text-cyan-700 mb-2 text-sm">Gücünü Paylaş, Dünyayı Değiştir!</h3>
                <p className="text-xs text-cyan-900/80 leading-relaxed">
                  Finansal başarı sadece ne kadar kazandığınla değil, bu kazancınla topluma nasıl
                  bir değer kattığınla ölçülür. Elde ettiğin finansal güç, başkalarının hayatına
                  dokunabilmen için sana verilmiş bir fırsattır.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* MERKEZ */}
          <div className="flex-1 min-w-0">
            {currentPreference && (
              <div className="mb-6 flex items-center gap-3 bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3">
                <CheckCircle2 className="size-5 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  Mevcut tercihin: {currentPreference.organization.name}
                </span>
              </div>
            )}

            {submitError && (
              <div className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3">
                <AlertTriangle className="size-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{submitError}</span>
              </div>
            )}

            {organizations.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
                <HeartHandshake className="size-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground">Şu anda listelenecek bir kurum yok</h3>
                <p className="text-muted-foreground mt-1">Lütfen daha sonra tekrar kontrol et.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organizations.map((org, index) => {
                  const isSelected = currentPreference?.organization.id === org.id;
                  const isSubmitting = submittingOrgId === org.id;

                  return (
                    <motion.div key={org.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 * index }}>
                      <Card className={isSelected ? "ring-2 ring-success border-success/40" : ""}>
                        <CardBody>
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 rounded-lg flex-shrink-0 ${isSelected ? "bg-success/10" : "bg-primary/10"}`}>
                              {org.logo_url ? (
                                <img src={org.logo_url} alt={org.name} className="size-8 object-contain" />
                              ) : (
                                <Heart className={`size-8 ${isSelected ? "text-success" : "text-primary"}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-foreground mb-1">{org.name}</h4>
                              <p className="text-sm text-muted-foreground">{org.description}</p>
                            </div>
                          </div>

                          <p className="text-sm text-foreground/80 bg-muted/30 rounded-lg p-3 mb-4 italic">
                            {org.impact_text}
                          </p>

                          {isSelected ? (
                            <Button variant="success" size="sm" fullWidth disabled className="opacity-100">
                              <CheckCircle2 className="size-4 mr-2" /> Mevcut Tercihin
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              disabled={submittingOrgId !== null}
                              onClick={() => handleSelect(org)}
                            >
                              {isSubmitting ? (
                                <>
                                  <RefreshCw className="size-4 mr-2 animate-spin" /> Kaydediliyor...
                                </>
                              ) : (
                                <>
                                  <Heart className="size-4 mr-2" /> Bu Kurumu Desteklemek İsterim
                                </>
                              )}
                            </Button>
                          )}
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SAĞ PANEL */}
          <div className="w-64 hidden lg:block sticky top-24 flex-shrink-0">
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardBody>
                <h3 className="font-bold text-amber-700 mb-2 text-sm">Bilinçli Kazanç, Sosyal Katkı</h3>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Kazancını bilinçli yönetmek, yalnızca kendi ihtiyaçlarını karşılamak demek
                  değildir. Kendi etki alanını seç ve bu farkındalığı bugün hissetmeye başla!
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* DEĞİŞİKLİK ONAY MODALI */}
      <AnimatePresence>
        {pendingOrg && currentPreference && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-background rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-border">
              <div className="p-6">
                <h3 className="font-bold text-lg text-foreground mb-2">Tercihini Değiştir</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Şu an tercihin: <span className="font-semibold text-foreground">{currentPreference.organization.name}</span>.
                  {" "}Bunun yerine <span className="font-semibold text-foreground">{pendingOrg.name}</span> kurumunu
                  seçmek istediğine emin misin?
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" fullWidth onClick={() => setPendingOrg(null)}>Vazgeç</Button>
                  <Button variant="primary" fullWidth onClick={() => submitPreference(pendingOrg)}>Evet, Değiştir</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BAŞARI POPUP */}
      <AnimatePresence>
        {successOrg && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border">
              <div className="flex flex-col items-center text-center p-6 border-b border-border bg-success/10">
                <div className="bg-success/20 p-3 rounded-full mb-3">
                  <Sparkles className="size-8 text-success" />
                </div>
                <h3 className="font-bold text-xl text-foreground">Harika Bir Seçim!</h3>
                <p className="text-sm text-success font-semibold mt-1">Sosyal sorumluluk tercihin kaydedildi.</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Finansal kaynakların yalnızca kişisel ihtiyaçlar için değil, toplumsal fayda
                  oluşturmak için de kullanılabileceğini düşünmen finansal farkındalığın önemli bir
                  parçasıdır.
                </p>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">
                  <span className="font-semibold">{successOrg.name}</span> seçildi. {successOrg.impact_text}
                </p>
                <Button variant="primary" fullWidth onClick={() => setSuccessOrg(null)}>Tamam</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
