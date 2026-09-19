import { motion } from "framer-motion";
import { GraduationCap, Layers, TrendingUp, Route } from "lucide-react";

const values = [
  {
    icon: GraduationCap,
    title: "Uzman İçerikler",
    description: "Finansal okuryazarlık müfredatına uygun, alan bilgisiyle hazırlanmış eğitim içerikleri.",
  },
  {
    icon: Layers,
    title: "Yapılandırılmış Öğrenme",
    description: "Konular üniteler ve alt başlıklar halinde düzenlenir; öğrenme adım adım ilerler.",
  },
  {
    icon: TrendingUp,
    title: "İlerlemeni Takip Et",
    description: "Tamamladığın içerikler ve kazandığın rozetlerle gelişimini net biçimde görürsün.",
  },
  {
    icon: Route,
    title: "Temelden İleriye Öğrenme Yolu",
    description: "İlkokuldan üniversiteye, seviyene uygun içeriklerle kademeli bir öğrenme yolculuğu.",
  },
];

export function TrustSection() {
  return (
    <section className="bg-white border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-gradient-to-br from-sky-50/60 to-white p-6"
            >
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <v.icon className="size-6" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
