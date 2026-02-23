import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  stats: {
    activeProjects: number;
    registeredContractors: number;
    cantonsCovered: number;
    offersSubmitted: number;
  };
}

export const HeroSection = ({ stats }: HeroSectionProps) => (
  <section className="border-b border-neutral-200 bg-white">
    <div className="container grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
      <div>
        <span className="inline-flex rounded-full bg-swiss-soft px-3 py-1 text-xs font-semibold text-swiss-red">
          Swiss B2B Construction Marketplace
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-brand-900 lg:text-5xl">
          Win better construction projects in Switzerland.
        </h1>
        <p className="mt-5 max-w-xl text-base text-neutral-600 lg:text-lg">
          ProBau.ch connects <strong>Arbeitsgeber</strong> with qualified <strong>Unternehmer</strong> in a
          trusted and transparent procurement workflow.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button size="lg">Start as Arbeitsgeber</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="secondary">
              View Unternehmer plans
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-card">
        <div className="relative aspect-[16/11]">
          <Image
            src="/placeholder.svg"
            alt="Construction planning overview"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="grid grid-cols-2 gap-4 p-5">
          <div>
            <p className="text-xs text-neutral-500">Active projects</p>
            <p className="text-2xl font-bold text-brand-900">{stats.activeProjects}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Registered Unternehmer</p>
            <p className="text-2xl font-bold text-brand-900">{stats.registeredContractors}+</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Covered cantons</p>
            <p className="text-2xl font-bold text-brand-900">{stats.cantonsCovered}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Offers submitted</p>
            <p className="text-2xl font-bold text-brand-900">{stats.offersSubmitted}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
