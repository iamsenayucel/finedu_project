import { useState } from "react";
import { Link, useNavigate } from "react-router"; // react-router-dom olabilir, projendeki versiyona göre ayarlarsın
import { GraduationCap, LogIn, User, Lock, AlertCircle } from "lucide-react"; // Mail yerine User ikonu daha uygun olabilir
import { Button } from "../components/Button";
import { Card, CardBody } from "../components/Card";
import { motion } from "framer-motion"; // "motion/react" yerine genelde "framer-motion" kullanılır

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "", // Django varsayılan olarak username bekler
    password: "",
  });
  
  // Hata ve Yüklenme durumlarını yöneteceğimiz state'ler
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Django'daki Token alma ucuna istek atıyoruz
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Şifre doğruysa gelen Token'ı tarayıcıya kaydet
        localStorage.setItem("token", data.token);
        
        // Başarılı giriş sonrası paneli aç
        navigate("/dashboard");
      } else {
        // Django'dan dönen hatayı veya genel bir mesajı göster
        setError("Kullanıcı adı veya şifre hatalı!");
      }
    } catch (err) {
      console.error(err);
      setError("Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun.");
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
        {/* Logo ve Başlık */}
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

        {/* Login Form */}
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Hata Mesajı Kutusu */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Kullanıcı Adı
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