import type { Metadata } from "next";

import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { TrustSection } from "@/components/marketing/trust-section";
import { WhyProBauSection } from "@/components/marketing/why-probau-section";

export const metadata: Metadata = {
  title: "The Swiss Construction Marketplace",
  description:
    "Connect project owners and professional contractors across Switzerland with ProBau.ch.",
  openGraph: {
    title: "ProBau.ch - The Swiss Construction Marketplace",
    description:
      "A trusted Swiss SaaS marketplace for project owners and contractors with transparent procurement workflows.",
    type: "website",
  },
};

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
