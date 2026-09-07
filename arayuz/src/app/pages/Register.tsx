import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, Mail, Lock, User, AlertCircle } from "lucide-react";
import logo from "../../assets/logo.png";
import { Button } from "../components/Button";
import { Select } from "../components/Input";
import { Card, CardBody } from "../components/Card";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    gradeLevel: "",
  });

  // Hata ve Yüklenme durumları
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Şifreler eşleşiyor mu kontrolü
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler birbiriyle eşleşmiyor!");
      return;
    }

    // 2. Öğrenci ise sınıf seviyesi seçilmiş mi kontrolü
    if (formData.role === "STUDENT" && !formData.gradeLevel) {
      setError("Lütfen eğitim seviyenizi seçin.");
      return;
    }

    setIsLoading(true);

    try {
      // Django'ya gönderilecek veri paketi
      // Not: Django varsayılan olarak 'username' bekler, biz kolaylık olsun diye email'i username olarak gönderiyoruz.
      const payload = {
        username: formData.email, 
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        role: formData.role,
        grade_level: formData.role === "STUDENT" ? formData.gradeLevel : null,
      };

      const response = await fetch("https://finedu-project.onrender.com/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Kayıt başarılıysa giriş sayfasına yönlendir
        navigate("/login");
      } else {
        const data = await response.json();
        // Backend'den gelen spesifik bir hata varsa onu göster
        setError(data.error || "Kayıt olurken bir hata oluştu. Bu e-posta zaten kullanımda olabilir.");
      }
    } catch (err) {
      console.error(err);
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-info/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 size-80 rounded-full bg-primary/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative"
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
            FinEdu'ya Katıl
          </h1>
          <p className="text-muted-foreground">
            Finansal geleceğini şekillendirmeye bugün başla
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Hata Mesajı */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Ad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      placeholder="Adın"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      placeholder="Soyadın"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Şifre Tekrar</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Rol"
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={[
                    { value: "STUDENT", label: "Öğrenci" },
                    { value: "TEACHER", label: "Öğretmen" },
                  ]}
                />

                {formData.role === "STUDENT" && (
                  <Select
                    label="Eğitim Seviyesi"
                    name="grade_level"
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    options={[
                      { value: "", label: "Seçiniz" },
                      { value: "İlkokul", label: "İlkokul" },
                      { value: "Ortaokul", label: "Ortaokul" },
                      { value: "Lise", label: "Lise" },
                      { value: "Üniversite", label: "Üniversite" },
                    ]}
                  />
                )}
              </div>

              <Button type="submit" variant="success" fullWidth size="lg" className="mt-6" disabled={isLoading}>
                <UserPlus className="size-5 mr-2" />
                {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Zaten hesabın var mı?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}