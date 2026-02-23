import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DashboardSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.settings")}</h1>

      <div className="mt-8 max-w-md space-y-4">
        <div className="space-y-2">
          <Label>{t("auth.email")}</Label>
          <Input defaultValue={user?.email} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.company_name")}</Label>
          <Input defaultValue={user?.companyName} />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.role_select")}</Label>
          <Input
            defaultValue={user?.role === "owner" ? t("auth.role_owner") : t("auth.role_contractor")}
            disabled
          />
        </div>
        <Button>{t("dashboard.settings")}</Button>
      </div>
    </div>
  );
};

export default DashboardSettings;
