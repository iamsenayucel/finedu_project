import { LogOut, User, Flame } from "lucide-react";
import { Link } from "react-router";
import logo from "../../assets/logo.jpeg";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
  streakDays?: number;
}

export function Navbar({ userName, onLogout, streakDays }: NavbarProps) {
  return (
    <nav className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="FinEdu logo"
              className="h-14 w-14 object-contain rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-2 group-hover:shadow-lg group-hover:shadow-primary/20"
            />
          </Link>

          {userName && (
            <div className="flex items-center gap-3">
              {/* Streak badge */}
              {streakDays !== undefined && streakDays > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                  <Flame className="size-4 text-orange-500" />
                  {streakDays} gün seri
                </div>
              )}

              {/* Profile link */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 bg-primary/8 hover:bg-primary/15 text-primary rounded-xl transition-all duration-200 font-semibold text-sm"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">{userName}</span>
              </Link>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl transition-all duration-200 font-semibold"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-primary via-info to-primary" />
    </nav>
  );
}
