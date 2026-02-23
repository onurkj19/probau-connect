const valuePoints = [
  {
    title: "Trusted Swiss positioning",
    description: "Corporate-grade procurement flow aligned with Swiss business expectations.",
  },
  {
    title: "Role-based workflows",
    description: "Dedicated surfaces for Arbeitsgeber and Unternehmer reduce friction and errors.",
  },
  {
    title: "Subscription monetization",
    description: "Built-in contractor subscription model to convert traffic into predictable revenue.",
  },
  {
    title: "Scalable architecture",
    description: "Modular Next.js codebase designed for future integration with real APIs and billing.",
  },
];

export const WhyProBauSection = () => (
  <section className="border-b border-neutral-200 bg-white">
    <div className="container py-16 lg:py-20">
      <h2 className="text-3xl font-bold text-brand-900">Why ProBau.ch</h2>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Designed to look and feel enterprise-ready for paid contractor subscriptions.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {valuePoints.map((point) => (
          <article key={point.title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="text-lg font-semibold text-brand-900">{point.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{point.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
