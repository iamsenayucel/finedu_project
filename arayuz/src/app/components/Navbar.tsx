import { GraduationCap, LogOut } from "lucide-react";
import { Link } from "react-router";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
}

export function Navbar({ userName, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-primary to-indigo-600 p-2 rounded-lg group-hover:shadow-lg transition-all duration-200">
              <GraduationCap className="size-6 text-white" />
            </div>
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
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  Hoş geldin,
                </p>
                <p className="text-sm text-muted-foreground">{userName}</p>
              </div>
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
