import { Section } from "@/components/common/section";

export const TrustSection = () => (
  <Section className="bg-white" centered>
    <div className="mx-auto max-w-4xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-swiss-red">Trust</p>
      <h2 className="mt-2 text-3xl font-bold text-brand-900 lg:text-4xl">
        Built for Swiss construction professionals
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
        ProBau.ch is designed for procurement reliability, clear deadlines, and long-term contractor relationships.
      </p>

      <div className="mt-8 border-t border-neutral-200 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Partner logos coming soon
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Logo A", "Logo B", "Logo C", "Logo D"].map((logo) => (
            <div
              key={logo}
              className="flex h-14 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-500"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </div>
  </Section>
);
