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
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="FinEdu logo"
              className="h-10 w-10 object-contain rounded-lg group-hover:shadow-lg transition-all duration-200"
            />
            <div>
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                FinEdu
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Finansal Eğitim Platformu
              </p>
            </div>
          </Link>

          {userName && (
            <div className="flex items-center gap-3">
              {/* Streak badge */}
              {streakDays !== undefined && streakDays > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold">
                  <Flame className="size-4 text-orange-500" />
                  {streakDays} gün seri
                </div>
              )}

              {/* Profile link */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 bg-muted/60 hover:bg-muted text-foreground rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">{userName}</span>
              </Link>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all duration-200 font-medium"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
