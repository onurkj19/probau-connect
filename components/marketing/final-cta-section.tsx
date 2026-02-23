import Link from "next/link";

import { Button } from "@/components/ui/button";

export const FinalCtaSection = () => (
  <section className="bg-brand-900 py-16 lg:py-20">
    <div className="container">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white lg:text-4xl">
          Ready to run your next construction tender professionally?
        </h2>
        <p className="mt-4 text-base text-brand-100 lg:text-lg">
          Launch ProBau workflows that companies trust enough to pay for.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Create account
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              variant="ghost"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Compare plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);
