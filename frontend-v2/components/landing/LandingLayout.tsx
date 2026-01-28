import { AboutSection } from "@/components/landing/AboutSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navbar } from "@/components/landing/Navbar";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Topbar } from "@/components/landing/Topbar";
import { TrustSection } from "@/components/landing/TrustSection";

export function LandingLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Topbar />
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-32 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-100/70 blur-[140px]" />
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <TrustSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <FooterSection />
    </div>
  );
}
