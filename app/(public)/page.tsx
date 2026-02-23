import type { Metadata } from "next";
import Link from "next/link";

import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { WhyProBauSection } from "@/components/marketing/why-probau-section";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { getMarketplaceStats, listFeaturedProjects } from "@/lib/api/projects";

export const metadata: Metadata = {
  title: "Swiss Marketplace for Construction Projects",
  description:
    "Enterprise-ready SaaS marketplace where Arbeitsgeber publish projects and Unternehmer submit offers.",
};

const HomePage = async () => {
  const [stats, featuredProjects] = await Promise.all([
    getMarketplaceStats(),
    listFeaturedProjects(),
  ]);

  return (
    <>
      <HeroSection stats={stats} />
      <HowItWorksSection />
      <WhyProBauSection />

      <section className="border-b border-neutral-200 bg-white">
        <div className="container py-16 lg:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-brand-900">Current project demand</h2>
              <p className="mt-3 max-w-xl text-neutral-600">
                Snapshot of active marketplace demand from Swiss Arbeitsgeber.
              </p>
            </div>
            <Link href="/register">
              <Button variant="secondary">Join as Unternehmer</Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 xl:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      <PricingPreviewSection />
      <FinalCtaSection />
    </>
  );
};

export default HomePage;
