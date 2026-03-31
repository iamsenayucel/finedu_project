import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { ArrowLeft, Award, Flame, BookOpen, Target, Calendar, Star, Trophy, Hash } from "lucide-react";
import { motion } from "framer-motion";

const API = "https://finedu-project.onrender.com/api";

const GRADE_LABELS: Record<string, string> = {
  PRIMARY: "İlkokul",
  MIDDLE: "Ortaokul",
  HIGH: "Lise",
  UNIVERSITY_FINANCE: "Üniversite (Finans/İşletme)",
  UNIVERSITY_GENERAL: "Üniversite (Genel)",
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    fetch(`${API}/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setProfile)
      .catch(() => navigate("/login"))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const overallProgress = profile?.total_content_count > 0
    ? Math.round((profile.completed_count / profile.total_content_count) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        userName={profile?.first_name || "Profil"}
        onLogout={handleLogout}
        streakDays={profile?.streak_days}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="size-4 mr-2" /> Panele Dön
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <SkeletonBlock className="h-36 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-24" />)}
            </div>
            <SkeletonBlock className="h-48 w-full" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardBody className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-lg flex-shrink-0">
                    {(profile.first_name?.[0] || profile.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">{profile.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                      {profile.grade_level && (
                        <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                          {GRADE_LABELS[profile.grade_level] || profile.grade_level}
                        </span>
                      )}
                      {profile.student_code && (
                        <span className="bg-muted text-muted-foreground text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1">
                          <Hash className="size-3" />{profile.student_code}
                        </span>
                      )}
                      <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <Calendar className="size-3" /> {profile.date_joined} tarihinde katıldı
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { icon: <Trophy className="size-5 text-yellow-500" />, label: "Toplam Puan", value: profile.total_score, bg: "bg-yellow-50", border: "border-yellow-200" },
                { icon: <Flame className="size-5 text-orange-500" />, label: "Günlük Seri", value: `${profile.streak_days} gün`, bg: "bg-orange-50", border: "border-orange-200" },
                { icon: <Award className="size-5 text-purple-500" />, label: "Kazanılan Rozet", value: profile.earned_badges?.length || 0, bg: "bg-purple-50", border: "border-purple-200" },
                { icon: <BookOpen className="size-5 text-blue-500" />, label: "Tamamlanan Ünite", value: `${profile.completed_units} / ${profile.total_units}`, bg: "bg-blue-50", border: "border-blue-200" },
              ].map((stat, i) => (
                <Card key={i} className={`border ${stat.border}`}>
                  <CardBody className={`${stat.bg} rounded-xl text-center py-4`}>
                    <div className="flex justify-center mb-2">{stat.icon}</div>
                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                  </CardBody>
                </Card>
              ))}
            </motion.div>

            {/* Overall Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="size-5 text-primary" />
                    <h3 className="font-bold text-foreground">Genel İlerleme</h3>
                  </div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-muted-foreground">{profile.completed_count} / {profile.total_content_count} içerik tamamlandı</span>
                    <span className="text-primary">{overallProgress}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                    />
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Badges */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="size-5 text-yellow-500" />
                    <h3 className="font-bold text-foreground">Rozetlerim</h3>
                    <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {profile.earned_badges?.length || 0} rozet
                    </span>
                  </div>
                  {!profile.earned_badges || profile.earned_badges.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Award className="size-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Henüz rozet kazanılmadı. Üniteleri tamamla!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {profile.earned_badges.map((badge: string, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                          className="flex flex-col items-center p-4 bg-gradient-to-b from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl shadow-sm text-center hover:shadow-md transition-all"
                        >
                          <span className="text-4xl mb-2">🏆</span>
                          <p className="font-bold text-sm text-foreground leading-tight">{badge}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            {/* Streak info */}
            {profile.streak_days > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="text-5xl">🔥</div>
                  <div>
                    <p className="font-bold text-orange-800 text-lg">{profile.streak_days} günlük seri!</p>
                    <p className="text-orange-600 text-sm">Her gün bir içerik tamamlayarak serini koru.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
