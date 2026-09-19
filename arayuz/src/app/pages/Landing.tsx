import { LandingNavbar } from "../components/landing/LandingNavbar";
import { HeroSection } from "../components/landing/HeroSection";
import { TrustSection } from "../components/landing/TrustSection";
import { CategoriesSection } from "../components/landing/CategoriesSection";
import { FeaturedCoursesSection } from "../components/landing/FeaturedCoursesSection";
import { CtaFooterSection } from "../components/landing/CtaFooterSection";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <HeroSection />
      <TrustSection />
      <CategoriesSection />
      <FeaturedCoursesSection />
      <CtaFooterSection />
    </div>
  );
}
