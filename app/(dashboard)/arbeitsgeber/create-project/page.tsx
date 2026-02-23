import { getTranslations } from "next-intl/server";

import { CreateProjectForm } from "@/components/forms/create-project-form";
import { Card } from "@/components/ui/card";

const ArbeitsgeberCreateProjectPage = async () => {
  const t = await getTranslations("dashboard.employer");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{t("createProjectTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("createProjectDescription")}</p>
      </div>

      <Card>
        <CreateProjectForm />
      </Card>
    </div>
  );
};

export default ArbeitsgeberCreateProjectPage;
