import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DashboardSettings = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [profileTitle, setProfileTitle] = useState(user?.profileTitle || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCompanyName(user?.companyName || "");
    setProfileTitle(user?.profileTitle || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user?.companyName, user?.profileTitle, user?.avatarUrl]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          company_name: companyName.trim(),
          profile_title: profileTitle.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", user.id);
      if (updateError) throw updateError;

      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving profile failed");
    } finally {
      setSaving(false);
    }
  };

  const profileInitials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.settings")}</h1>

      <form className="mt-8 max-w-md space-y-4" onSubmit={handleSave}>
        <div className="space-y-2">
          <Label>{t("auth.profile_photo_url")}</Label>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={avatarUrl || undefined} alt={user?.name || "User"} />
              <AvatarFallback>{profileInitials || "PB"}</AvatarFallback>
            </Avatar>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleAvatarUpload(file);
                  }
                }}
              />
              {uploading ? "Uploading..." : "Upload photo"}
            </label>
          </div>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.email")}</Label>
          <Input defaultValue={user?.email} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.company_name")}</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.profile_title")}</Label>
          <Input
            value={profileTitle}
            onChange={(e) => setProfileTitle(e.target.value)}
            placeholder={t("auth.profile_title_placeholder")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.role_select")}</Label>
          <Input
            defaultValue={user?.role === "owner" ? t("auth.role_owner") : t("auth.role_contractor")}
            disabled
          />
        </div>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "..." : t("dashboard.save_changes")}
        </Button>
        {error && (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
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
