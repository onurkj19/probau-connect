import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getServerSessionUser } from "@/lib/auth/server-session";

const ArbeitsgeberSettingsPage = async () => {
  const tEmployer = await getTranslations("dashboard.employer");
  const tShared = await getTranslations("dashboard.shared");
  const user = await getServerSessionUser();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{tEmployer("settingsTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{tEmployer("settingsDescription")}</p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-900">
              {tShared("contactName")}
            </label>
            <Input defaultValue={user?.name} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-900">
              {tShared("company")}
            </label>
            <Input defaultValue={user?.company} />
          </div>
        </div>
        <Button size="sm">{tShared("saveSettings")}</Button>
      </Card>
    </div>
  );
};

export default ArbeitsgeberSettingsPage;
