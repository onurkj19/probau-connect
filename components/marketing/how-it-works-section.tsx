const steps = [
  {
    title: "1. Arbeitsgeber publishes project",
    description: "Create structured tenders with deadlines, scope, and supporting documents.",
  },
  {
    title: "2. Unternehmer submit offers",
    description: "Qualified contractors submit secure offers before deadline with full transparency.",
  },
  {
    title: "3. Award and execute",
    description: "Compare submissions quickly, select the right partner, and kick off delivery.",
  },
];

export const HowItWorksSection = () => (
  <section className="border-b border-neutral-200 bg-neutral-50">
    <div className="container py-16 lg:py-20">
      <h2 className="text-3xl font-bold text-brand-900">How it works</h2>
      <p className="mt-3 max-w-2xl text-neutral-600">
        A streamlined 3-step workflow designed for Swiss construction teams.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.title} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-brand-900">{step.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
