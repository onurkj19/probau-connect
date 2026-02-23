import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getServerSessionUser } from "@/lib/auth/server-session";

const ArbeitsgeberSettingsPage = async () => {
  const user = await getServerSessionUser();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage company profile and notification preferences.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-900">Contact Name</label>
            <Input defaultValue={user?.name} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-900">Company</label>
            <Input defaultValue={user?.company} />
          </div>
        </div>
        <Button size="sm">Save settings</Button>
      </Card>
    </div>
  );
};

export default ArbeitsgeberSettingsPage;
