import Link from "next/link";

import { Button } from "@/components/ui/button";

export const FinalCtaSection = () => (
  <section className="bg-brand-900 py-16 lg:py-20">
    <div className="container">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white lg:text-4xl">
          Ready to grow your construction business?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-brand-100 lg:text-lg">
          Join ProBau.ch and access a procurement workflow trusted by Swiss construction teams.
        </p>
        <div className="mt-8">
          <Button asChild variant="secondary" size="lg">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
