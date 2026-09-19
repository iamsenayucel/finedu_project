import { motion } from "framer-motion";
import { BookOpen, Wallet, LineChart, BarChart2, PieChart, ShieldCheck } from "lucide-react";

const categories = [
  { icon: BookOpen, title: "Finansal Okuryazarlık", description: "Temel finans kavramlarını ve para yönetimini öğren." },
  { icon: Wallet, title: "Bütçe Yönetimi", description: "Gelir-gider dengesini kurmayı ve tasarruf alışkanlığını geliştir." },
  { icon: LineChart, title: "Yatırım Temelleri", description: "Yatırım araçlarını ve temel yatırım prensiplerini keşfet." },
  { icon: BarChart2, title: "Borsa", description: "Sermaye piyasalarının işleyişini ve temel kavramlarını tanı." },
  { icon: PieChart, title: "Ekonomi", description: "Ekonominin temel dinamiklerini ve gündelik hayata etkisini anla." },
  { icon: ShieldCheck, title: "Risk Yönetimi", description: "Finansal riskleri tanımayı ve bilinçli karar almayı öğren." },
];

export function CategoriesSection() {
  return (
    <section id="kategoriler" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 scroll-mt-20">
      <div className="max-w-2xl mb-10">
        <h2 className="text-3xl font-bold text-foreground mb-3">Eğitim Kategorileri</h2>
        <p className="text-muted-foreground leading-relaxed">
          Seviyene uygun, birbirini tamamlayan konu başlıkları arasından öğrenmeye başla.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="group rounded-2xl border border-border bg-white p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-info/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <c.icon className="size-6" />
            </div>
            <h3 className="font-bold text-foreground mb-1.5">{c.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
