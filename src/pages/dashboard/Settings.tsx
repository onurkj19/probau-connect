import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DashboardSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.settings")}</h1>

      <form className="mt-8 max-w-md space-y-4" onSubmit={handleSave}>
        <div className="space-y-2">
          <Label>{t("auth.email")}</Label>
          <Input defaultValue={user?.email} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.company_name")}</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.role_select")}</Label>
          <Input
            defaultValue={user?.role === "owner" ? t("auth.role_owner") : t("auth.role_contractor")}
            disabled
          />
        </div>
        <Button type="submit">{t("dashboard.save_changes")}</Button>
        {saved && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("dashboard.settings_saved")}
          </p>
        )}
      </form>
    </div>
  );
};

export default DashboardSettings;
