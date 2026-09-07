import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { invalidateCache } from "../utils/apiCache";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";
import { Button } from "../components/Button";
import { Card, CardBody } from "../components/Card";
import { motion } from "framer-motion";
import logo from "../../assets/logo.jpeg";

const API_BASE = "https://finedu-project.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  // Sayfa açılınca sunucuyu önceden uyandır
  useEffect(() => {
    fetch(`${API_BASE}/api/health/`, { method: "GET" }).catch(() => {});
  }, []);

  const doLogin = async (timeoutMs: number): Promise<Response> => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_BASE}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });
      clearTimeout(tid);
      return res;
    } catch (e) {
      clearTimeout(tid);
      throw e;
    }
  };

  const redirectAfterLogin = async (token: string) => {
    try {
      const headers = { "Authorization": `Token ${token}` };
      const meRes = await fetch(`${API_BASE}/api/me/`, { headers });
      const meData = await meRes.json();

      if (meRes.ok && meData.user?.role === "STUDENT") {
        const surveyRes = await fetch(`${API_BASE}/api/survey/pre_survey/status/`, { headers });
        const surveyData = await surveyRes.json();
        if (surveyRes.ok && !surveyData.is_completed) {
          navigate("/pre-survey");
          return;
        }

        const completedCount = meData.user.completed_count ?? 0;
        const totalContentCount = meData.user.total_content_count ?? 0;
        if (totalContentCount > 0 && completedCount >= totalContentCount) {
          const postSurveyRes = await fetch(`${API_BASE}/api/survey/post_survey/status/`, { headers });
          const postSurveyData = await postSurveyRes.json();
          if (postSurveyRes.ok && !postSurveyData.is_completed) {
            navigate("/post-survey");
            return;
          }
        }
      }
    } catch {
      // Sunucudan rol/anket bilgisi alınamazsa panele yönlendirmeye devam et
    }
    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setWaking(false);

    let response: Response;

    try {
      response = await doLogin(15000);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // İlk deneme zaman aşımı → sunucu uykuda, otomatik tekrar dene
        setWaking(true);
        try {
          response = await doLogin(60000);
          setWaking(false);
        } catch (retryErr: any) {
          setWaking(false);
          setIsLoading(false);
          setError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
          return;
        }
      } else {
        setIsLoading(false);
        setError(err.message || "Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
        return;
      }
    }

    try {
      const textData = await response.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch {
        console.error("Sunucudan Gelen Beklenmeyen Yanıt:", textData);
        throw new Error("Sunucu geçersiz bir yanıt döndürdü. Lütfen tekrar deneyin.");
      }

      if (response.ok) {
        invalidateCache();
        localStorage.setItem("token", data.token);
        await redirectAfterLogin(data.token);
      } else {
        const errorMsg = data.non_field_errors ? data.non_field_errors[0] :
                         data.error ? data.error : "Kullanıcı adı veya şifre hatalı!";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
      setWaking(false);
    }
  };

  const loadingLabel = waking
    ? "Sunucu uyandırılıyor..."
    : isLoading
    ? "Giriş Yapılıyor..."
    : "Giriş Yap";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full bg-info/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-20 size-80 rounded-full bg-primary/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center mb-4"
          >
            <img src={logo} alt="FinEdu logo" className="h-24 w-24 object-contain drop-shadow-lg" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent mb-2">
            FinEdu'ya Hoş Geldin
          </h1>
          <p className="text-muted-foreground">
            Finansal okuryazarlık yolculuğuna başla
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="size-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {waking && !error && (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <span className="animate-spin">⏳</span>
                  <span>Sunucu uyku modundan uyanıyor, lütfen bekleyin...</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Kullanıcı Adı (veya E-posta)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="Kullanıcı adınızı girin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                className="mt-6"
                disabled={isLoading || waking}
              >
                <LogIn className="size-5 mr-2" />
                {loadingLabel}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Hesabın yok mu?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Kayıt Ol
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 FinEdu. Finansal eğitimde güvenilir ortağınız.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
