import { useState } from "react";
import { Link, useNavigate } from "react-router"; 
import { GraduationCap, LogIn, User, Lock, AlertCircle } from "lucide-react"; 
import { Button } from "../components/Button";
import { Card, CardBody } from "../components/Card";
import { motion } from "framer-motion"; 

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout

      const response = await fetch("https://finedu-project.onrender.com/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // DİKKAT: Önce gelen veriyi düz metin (text) olarak alıyoruz ki çökmesin!
      const textData = await response.text();
      let data;
      
      try {
        // Sonra onu JSON'a çevirmeyi deniyoruz
        data = JSON.parse(textData);
      } catch (parseError) {
        // EĞER JSON DEĞİLSE (Örn: HTML veya 404 döndüyse) BURADA YAKALARIZ
        console.error("Sunucudan Gelen Beklenmeyen Yanıt:", textData);
        throw new Error("Sunucu JSON yerine geçersiz bir yanıt (HTML) döndürdü. Konsola (F12) bakın.");
      }

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        // Django'dan dönen hata mesajını yakala (non_field_errors genellikle DRF'in şifre yanlış mesajıdır)
        const errorMsg = data.non_field_errors ? data.non_field_errors[0] : 
                       data.error ? data.error : "Kullanıcı adı veya şifre hatalı!";
        setError(errorMsg);
      }
      
    } catch (err: any) {
      console.error("Giriş Hatası:", err);
      if (err.name === "AbortError") {
        setError("Sunucu yanıt vermiyor (uyku modunda olabilir). Lütfen 30 saniye bekleyip tekrar deneyin.");
      } else {
        setError(err.message || "Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-primary to-indigo-600 p-4 rounded-2xl shadow-lg">
              <GraduationCap className="size-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent mb-2">
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
                disabled={isLoading}
              >
                <LogIn className="size-5 mr-2" />
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Hesabın yok mu?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Kayııt Ol
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