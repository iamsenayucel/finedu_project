import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2, Lock, Award, Sparkles } from "lucide-react";

const previewModules = [
  { title: "Bütçe Nedir?", type: "Video", status: "done" as const },
  { title: "Tasarruf Alışkanlığı", type: "Oyun", status: "active" as const },
  { title: "Akıllı Harcama", type: "Video", status: "locked" as const },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-info/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 -right-32 size-[28rem] rounded-full bg-primary/15 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Sol: metin içeriği */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-3.5 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="size-4" />
              Finansal Okuryazarlık Platformu
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground mb-6">
              Finansal okuryazarlığını geliştir,{" "}
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                geleceğini yönet.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              FinEdu, ilkokuldan üniversiteye uzanan yapılandırılmış bir öğrenme
              yolculuğuyla bütçe yönetiminden yatırıma, ekonomi temellerinden
              risk yönetimine kadar bilinçli finansal kararlar almanı destekleyen
              güvenilir bir eğitim deneyimi sunar.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#kategoriler"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-info text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-105 transition-all duration-200"
              >
                FinEdu'yu Keşfet
                <ArrowRight className="size-5" />
              </a>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold border-2 border-primary/30 text-foreground hover:bg-primary/5 hover:border-primary/60 transition-all duration-200"
              >
                Ücretsiz Kayıt Ol
              </Link>
            </div>
          </motion.div>

          {/* Sağ: ürün önizleme paneli */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-2xl border border-border bg-white shadow-2xl shadow-primary/10 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-info px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground font-bold text-sm">Bütçe Yönetimi Ünitesi</p>
                  <p className="text-primary-foreground/80 text-xs">3 içerik · Sıralı öğrenme</p>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <Award className="size-5 text-white" />
                </div>
              </div>

              <div className="p-5 space-y-3">
                {previewModules.map((m) => (
                  <div
                    key={m.title}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      m.status === "active"
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div
                      className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.status === "done"
                          ? "bg-success/15 text-success"
                          : m.status === "active"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.status === "done" && <CheckCircle2 className="size-5" />}
                      {m.status === "active" && <Play className="size-5" />}
                      {m.status === "locked" && <Lock className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.type}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2 pb-8">
                  {["Bütçe", "Tasarruf", "Yatırım", "Ekonomi"].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* dekoratif rozet kartı */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-2 bg-white rounded-xl border border-border shadow-lg px-4 py-3"
            >
              <div className="size-9 rounded-full bg-warning/15 text-warning flex items-center justify-center">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Rozet Kazan</p>
                <p className="text-[11px] text-muted-foreground">Üniteyi tamamla</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
