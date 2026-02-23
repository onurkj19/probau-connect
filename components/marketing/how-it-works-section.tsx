import { CheckCircle2, ClipboardList, FileSearch, FileText, Handshake, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Section } from "@/components/common/section";

export const HowItWorksSection = () => {
  const t = useTranslations("landing.howItWorks");

  const workflows = [
    {
      role: t("roleEmployer"),
      steps: [
        {
          icon: ClipboardList,
          title: t("employer.step1Title"),
          description: t("employer.step1Description"),
        },
        {
          icon: FileSearch,
          title: t("employer.step2Title"),
          description: t("employer.step2Description"),
        },
        {
          icon: Handshake,
          title: t("employer.step3Title"),
          description: t("employer.step3Description"),
        },
      ],
    },
    {
      role: t("roleContractor"),
      steps: [
        {
          icon: ReceiptText,
          title: t("contractor.step1Title"),
          description: t("contractor.step1Description"),
        },
        {
          icon: FileText,
          title: t("contractor.step2Title"),
          description: t("contractor.step2Description"),
        },
        {
          icon: CheckCircle2,
          title: t("contractor.step3Title"),
          description: t("contractor.step3Description"),
        },
      ],
    },
  ];

  return (
    <Section
      className="bg-neutral-50"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
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
                      {t("step", { number: index + 1 })}
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
};
