import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const NotFound = () => {
  const t = useTranslations("notFound");

  return (
    <section className="flex min-h-[70vh] items-center bg-neutral-50">
      <div className="container text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-swiss-red">404</p>
        <h1 className="mt-2 text-4xl font-bold text-brand-900">{t("title")}</h1>
        <p className="mt-3 text-neutral-600">{t("description")}</p>
        <div className="mt-6">
          <Link href="/">
            <Button>{t("backHome")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
