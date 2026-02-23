import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { TrustSection } from "@/components/marketing/trust-section";
import { WhyProBauSection } from "@/components/marketing/why-probau-section";

const HomePage = () => (
  <>
    <HeroSection />
    <HowItWorksSection />
    <WhyProBauSection />
    <PricingPreviewSection />
    <TrustSection />
    <FinalCtaSection />
  </>
);

export default HomePage;
