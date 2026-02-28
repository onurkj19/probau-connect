import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiscountConfig {
  enabled: boolean;
  percentOff: number;
  couponId: string | null;
  updatedAt: string | null;
}

interface PromoCodeRow {
  id: string;
  code: string;
  active: boolean;
  percentOff: number;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  createdAt: string;
}

interface SubscriptionPromosResponse {
  discountConfig: DiscountConfig;
  promoCodes: PromoCodeRow[];
}

const AdminSubscriptionPromos = () => {
  const { user, getToken } = useAuth();
  const [data, setData] = useState<SubscriptionPromosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePromoId, setActivePromoId] = useState<string | null>(null);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [defaultPercent, setDefaultPercent] = useState("0");
  const [promoCode, setPromoCode] = useState("");
  const [promoPercent, setPromoPercent] = useState("10");
  const [promoMaxRedemptions, setPromoMaxRedemptions] = useState("");
  const [promoExpiresAt, setPromoExpiresAt] = useState("");

  const isSuperAdmin = user?.role === "super_admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<SubscriptionPromosResponse>("/api/admin/subscription-promos-list", getToken);
      setData(response);
      setDefaultPercent(String(response.discountConfig.percentOff ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription promos");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveDefaultDiscount = async () => {
    const percent = Number(defaultPercent);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      setError("Default discount must be between 0 and 100.");
      return;
    }
    setSavingDiscount(true);
    setError(null);
    try {
      await adminFetch("/api/admin/subscription-promos-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action: "set_default_discount",
          percentOff: percent,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save default discount");
    } finally {
      setSavingDiscount(false);
    }
  };

  const createPromo = async () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    const percent = Number(promoPercent);
    const maxRedemptions = promoMaxRedemptions.trim() ? Number(promoMaxRedemptions) : null;
    if (!normalizedCode) {
      setError("Promo code is required.");
      return;
    }
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedCode)) {
      setError("Promo code must be 3-32 chars and use A-Z, 0-9, _ or -.");
      return;
    }
    if (Number.isNaN(percent) || percent <= 0 || percent > 100) {
      setError("Promo discount must be between 1 and 100.");
      return;
    }
    if (maxRedemptions !== null && (Number.isNaN(maxRedemptions) || maxRedemptions < 1)) {
      setError("Max redemptions must be empty or at least 1.");
      return;
    }
    setActivePromoId("new");
    setError(null);
    try {
      await adminFetch("/api/admin/subscription-promos-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action: "create_promo_code",
          code: normalizedCode,
          percentOff: percent,
          maxRedemptions,
          expiresAt: promoExpiresAt || null,
        }),
      });
      setPromoCode("");
      setPromoPercent("10");
      setPromoMaxRedemptions("");
      setPromoExpiresAt("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create promo code");
    } finally {
      setActivePromoId(null);
    }
  };

  const deactivatePromo = async (id: string) => {
    setActivePromoId(id);
    setError(null);
    try {
      await adminFetch("/api/admin/subscription-promos-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action: "deactivate_promo_code",
          promotionCodeId: id,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate promo code");
    } finally {
      setActivePromoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Subscription Promos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Super admin tools for default subscription discounts and promo code generation.
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-100/70 px-4 py-3 text-sm text-amber-900">
          Only super admins can create discounts and promo codes.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Default subscription discount</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Applies automatically at checkout when no promo code is provided. Set `0` to disable.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            className="w-40"
            type="number"
            min={0}
            max={100}
            step={1}
            value={defaultPercent}
            onChange={(e) => setDefaultPercent(e.target.value)}
            disabled={!isSuperAdmin || loading || savingDiscount}
          />
          <Button onClick={() => void saveDefaultDiscount()} disabled={!isSuperAdmin || loading || savingDiscount}>
            Save default discount
          </Button>
        </div>
        {data && (
          <p className="mt-3 text-xs text-muted-foreground">
            Current: {data.discountConfig.enabled ? `${data.discountConfig.percentOff}%` : "Disabled"}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Create promo code</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <Input
            placeholder="Code (e.g. SUMMER25)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={!isSuperAdmin || loading || activePromoId === "new"}
          />
          <Input
            type="number"
            min={1}
            max={100}
            step={1}
            placeholder="Percent off"
            value={promoPercent}
            onChange={(e) => setPromoPercent(e.target.value)}
            disabled={!isSuperAdmin || loading || activePromoId === "new"}
          />
          <Input
            type="number"
            min={1}
            step={1}
            placeholder="Max redemptions (optional)"
            value={promoMaxRedemptions}
            onChange={(e) => setPromoMaxRedemptions(e.target.value)}
            disabled={!isSuperAdmin || loading || activePromoId === "new"}
          />
          <Input
            type="datetime-local"
            value={promoExpiresAt}
            onChange={(e) => setPromoExpiresAt(e.target.value)}
            disabled={!isSuperAdmin || loading || activePromoId === "new"}
          />
          <Button disabled={!isSuperAdmin || loading || activePromoId === "new"} onClick={() => void createPromo()}>
            Create promo code
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading promo codes..." : `${data?.promoCodes.length ?? 0} promo codes`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Discount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Redemptions</th>
                <th className="px-3 py-2 font-medium">Expires</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && (data?.promoCodes ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-2">{row.percentOff}%</td>
                  <td className="px-3 py-2">{row.active ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2">{row.timesRedeemed}{row.maxRedemptions ? ` / ${row.maxRedemptions}` : ""}</td>
                  <td className="px-3 py-2">{row.expiresAt ? new Date(row.expiresAt).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!isSuperAdmin || !row.active || activePromoId === row.id}
                      onClick={() => void deactivatePromo(row.id)}
                    >
                      Deactivate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPromos;
