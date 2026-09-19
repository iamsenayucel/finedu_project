import { Link } from "react-router";

export function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-18 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-info text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-105 transition-all duration-200"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
