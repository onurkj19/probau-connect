import { useTranslations } from "next-intl";

import { Section } from "@/components/common/section";
import { Card } from "@/components/ui/card";

export const WhyProBauSection = () => {
  const t = useTranslations("landing.why");

  const valuePoints = [
    { title: t("card1Title"), description: t("card1Description") },
    { title: t("card2Title"), description: t("card2Description") },
    { title: t("card3Title"), description: t("card3Description") },
    { title: t("card4Title"), description: t("card4Description") },
  ];

  return (
    <Section
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
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
};
