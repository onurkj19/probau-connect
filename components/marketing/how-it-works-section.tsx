import { CheckCircle2, ClipboardList, FileSearch, FileText, Handshake, ReceiptText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Section } from "@/components/common/section";

const workflows = [
  {
    role: "For Arbeitsgeber",
    steps: [
      {
        icon: ClipboardList,
        title: "Post project for free",
        description: "Publish scope, deadlines, budget ranges, and required documents in one flow.",
      },
      {
        icon: FileSearch,
        title: "Receive offers",
        description: "Collect structured offers from subscribed professional contractors.",
      },
      {
        icon: Handshake,
        title: "Choose contractor",
        description: "Compare submissions and award the best-fit partner for your project.",
      },
    ],
  },
  {
    role: "For Unternehmer",
    steps: [
      {
        icon: ReceiptText,
        title: "Subscribe",
        description: "Activate Basic or Pro access and unlock project participation.",
      },
      {
        icon: FileText,
        title: "Browse projects",
        description: "Filter opportunities by canton, category, status, and deadlines.",
      },
      {
        icon: CheckCircle2,
        title: "Submit offers",
        description: "Send clear commercial proposals with supporting documentation.",
      },
    ],
  },
];

export const HowItWorksSection = () => (
  <Section
    className="bg-neutral-50"
    eyebrow="Process clarity"
    title="How it works"
    description="Two role-specific workflows designed for speed, transparency, and predictable tendering outcomes."
  >
    <div className="grid gap-6 lg:grid-cols-2">
      {workflows.map((workflow) => (
        <div key={workflow.role}>
          <h3 className="text-lg font-semibold text-brand-900">{workflow.role}</h3>
          <div className="mt-4 grid gap-3">
            {workflow.steps.map((step, index) => (
              <Card key={step.title} className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white">
                  <step.icon className="h-5 w-5 text-brand-900" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Step {index + 1}
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-brand-900">{step.title}</h4>
                  <p className="mt-1 text-sm text-neutral-600">{step.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Section>
);
