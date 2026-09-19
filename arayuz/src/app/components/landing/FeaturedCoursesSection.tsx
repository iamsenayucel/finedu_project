import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock, GraduationCap } from "lucide-react";

const courses = [
  {
    title: "Bütçe Planlama Temelleri",
    description: "Gelirini ve giderini planlamayı, tasarruf hedefi belirlemeyi öğrenirsin.",
    level: "İlkokul – Ortaokul",
    duration: "Kısa modüller",
  },
  {
    title: "Yatırımın Temelleri",
    description: "Yatırım araçlarını ve risk-getiri dengesini örneklerle keşfedersin.",
    level: "Lise",
    duration: "Kendi hızında",
  },
  {
    title: "Ekonomi Okuryazarlığı",
    description: "Enflasyon, arz-talep gibi temel ekonomi kavramlarını günlük hayatla ilişkilendirirsin.",
    level: "Üniversite",
    duration: "Video + Oyun",
  },
];

export function FeaturedCoursesSection() {
  return (
    <section className="bg-gradient-to-b from-white to-sky-50/60 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">Öne Çıkan Eğitimler</h2>
          <p className="text-muted-foreground leading-relaxed">
            Platformdaki yapılandırılmış ünitelerden bazı örnekler.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col rounded-2xl border border-border bg-white shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-info" />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  {c.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
                  <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full font-medium">
                    <GraduationCap className="size-3.5" />
                    {c.level}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full font-medium">
                    <Clock className="size-3.5" />
                    {c.duration}
                  </span>
                </div>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all duration-200"
                >
                  Detayları Gör
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
