import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export const FinalCtaSection = () => {
  const t = useTranslations("landing.finalCta");

  return (
    <section className="bg-brand-900 py-16 lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white lg:text-4xl">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-brand-100 lg:text-lg">
            {t("description")}
          </p>
          <div className="mt-8">
            <Button asChild variant="secondary" size="lg">
              <Link href="/register">{t("button")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
