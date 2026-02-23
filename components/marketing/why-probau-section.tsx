import { Section } from "@/components/common/section";
import { Card } from "@/components/ui/card";

const valuePoints = [
  {
    title: "Swiss-wide access",
    description: "Reach construction opportunities across all cantons from one professional platform.",
  },
  {
    title: "Transparent deadlines",
    description: "Every project includes clear submission windows and real-time deadline visibility.",
  },
  {
    title: "Secure document uploads",
    description: "Upload project files in a structured process designed for business-critical procurement.",
  },
  {
    title: "Simple subscription model",
    description: "Basic and Pro plans give Unternehmer straightforward access to project opportunities.",
  },
];

export const WhyProBauSection = () => (
  <Section
    eyebrow="Value proposition"
    title="Why ProBau.ch"
    description="Built for trust-first procurement in Swiss construction markets."
  >
    <div className="grid gap-4 sm:grid-cols-2">
      {valuePoints.map((point) => (
        <Card key={point.title} className="bg-white p-6">
          <h3 className="text-lg font-semibold text-brand-900">{point.title}</h3>
          <p className="mt-2 text-sm text-neutral-600">{point.description}</p>
        </Card>
      ))}
    </div>
  </Section>
);
