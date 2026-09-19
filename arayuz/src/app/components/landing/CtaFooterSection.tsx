import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import logo from "../../../assets/logo.png";

export function CtaFooterSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-info">
        <div className="pointer-events-none absolute -top-16 right-10 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Öğrenmeye bugün başla
          </h2>
          <p className="text-primary-foreground/85 text-lg mb-8 max-w-xl mx-auto">
            Güvenilir bir eğitim deneyimiyle finansal okuryazarlık yolculuğuna
            hemen katıl.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white text-primary shadow-lg hover:shadow-xl hover:brightness-105 transition-all duration-200"
          >
            Ücretsiz Kayıt Ol
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="FinEdu logo" className="h-9 w-9 object-contain" />
            <span className="font-bold text-foreground">FinEdu</span>
          </div>

          <p className="text-sm text-muted-foreground order-3 sm:order-2">
            © 2026 FinEdu. Finansal eğitimde güvenilir ortağınız.
          </p>

          <div className="flex items-center gap-4 order-2 sm:order-3 text-sm font-medium">
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              Giriş Yap
            </Link>
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
