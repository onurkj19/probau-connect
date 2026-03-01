import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiscountConfig {
  enabled: boolean;
  percentOff: number;
  couponId: string | null;
  description: string;
  validUntil: string | null;
  yearlyOffer: {
    enabled: boolean;
    freeMonths: number;
    description: string;
    validUntil: string | null;
  };
  updatedAt: string | null;
}

interface PromoCodeRow {
  id: string;
  couponId: string | null;
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
  priceConfig?: {
    basic: {
      monthlyPriceId: string | null;
      yearlyPriceId: string | null;
    };
    pro: {
      monthlyPriceId: string | null;
      yearlyPriceId: string | null;
    };
    amounts?: {
      basic?: { monthly?: number | null; yearly?: number | null };
      pro?: { monthly?: number | null; yearly?: number | null };
    };
  };
  promoCodes: PromoCodeRow[];
}

const EMPTY_YEARLY_OFFER: DiscountConfig["yearlyOffer"] = {
  enabled: false,
  freeMonths: 0,
  description: "",
  validUntil: null,
};

const EMPTY_PRICE_CONFIG: SubscriptionPromosResponse["priceConfig"] = {
  basic: { monthlyPriceId: null, yearlyPriceId: null },
  pro: { monthlyPriceId: null, yearlyPriceId: null },
  amounts: {
    basic: { monthly: null, yearly: null },
    pro: { monthly: null, yearly: null },
  },
};

const AdminSubscriptionPromos = () => {
  const { user, getToken } = useAuth();
  const [data, setData] = useState<SubscriptionPromosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePromoId, setActivePromoId] = useState<string | null>(null);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [defaultPercent, setDefaultPercent] = useState("0");
  const [defaultDescription, setDefaultDescription] = useState("");
  const [defaultValidUntil, setDefaultValidUntil] = useState("");
  const [savingYearly, setSavingYearly] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [yearlyFreeMonths, setYearlyFreeMonths] = useState("0");
  const [yearlyDescription, setYearlyDescription] = useState("");
  const [yearlyValidUntil, setYearlyValidUntil] = useState("");
  const [basicMonthlyPrice, setBasicMonthlyPrice] = useState("");
  const [basicYearlyPrice, setBasicYearlyPrice] = useState("");
  const [proMonthlyPrice, setProMonthlyPrice] = useState("");
  const [proYearlyPrice, setProYearlyPrice] = useState("");
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
      const fallbackPriceResponse = await fetch("/api/stripe/pricing")
        .then(async (res) => {
          if (!res.ok) return null;
          const payload = (await res.json()) as {
            prices?: {
              basic?: { monthly?: number | null; yearly?: number | null };
              pro?: { monthly?: number | null; yearly?: number | null };
            };
          };
          return payload?.prices ?? null;
        })
        .catch(() => null);
      const normalized: SubscriptionPromosResponse = {
        ...response,
        priceConfig: {
          basic: {
            monthlyPriceId: response.priceConfig?.basic?.monthlyPriceId ?? null,
            yearlyPriceId: response.priceConfig?.basic?.yearlyPriceId ?? null,
          },
          pro: {
            monthlyPriceId: response.priceConfig?.pro?.monthlyPriceId ?? null,
            yearlyPriceId: response.priceConfig?.pro?.yearlyPriceId ?? null,
          },
          amounts: {
            basic: {
              monthly:
                response.priceConfig?.amounts?.basic?.monthly ??
                fallbackPriceResponse?.basic?.monthly ??
                null,
              yearly:
                response.priceConfig?.amounts?.basic?.yearly ??
                fallbackPriceResponse?.basic?.yearly ??
                null,
            },
            pro: {
              monthly:
                response.priceConfig?.amounts?.pro?.monthly ??
                fallbackPriceResponse?.pro?.monthly ??
                null,
              yearly:
                response.priceConfig?.amounts?.pro?.yearly ??
                fallbackPriceResponse?.pro?.yearly ??
                null,
            },
          },
        },
        discountConfig: {
          enabled: Boolean(response.discountConfig?.enabled),
          percentOff: Number(response.discountConfig?.percentOff ?? 0),
          couponId: response.discountConfig?.couponId ?? null,
          description: response.discountConfig?.description ?? "",
          validUntil: response.discountConfig?.validUntil ?? null,
          updatedAt: response.discountConfig?.updatedAt ?? null,
          yearlyOffer: response.discountConfig?.yearlyOffer ?? EMPTY_YEARLY_OFFER,
        },
      };
      setData(normalized);
      setBasicMonthlyPrice(String(normalized.priceConfig?.amounts?.basic?.monthly ?? ""));
      setBasicYearlyPrice(String(normalized.priceConfig?.amounts?.basic?.yearly ?? ""));
      setProMonthlyPrice(String(normalized.priceConfig?.amounts?.pro?.monthly ?? ""));
      setProYearlyPrice(String(normalized.priceConfig?.amounts?.pro?.yearly ?? ""));
      setDefaultPercent(String(normalized.discountConfig.percentOff ?? 0));
      setDefaultDescription(normalized.discountConfig.description ?? "");
      setDefaultValidUntil(normalized.discountConfig.validUntil ? normalized.discountConfig.validUntil.slice(0, 16) : "");
      setYearlyFreeMonths(String(normalized.discountConfig.yearlyOffer.freeMonths ?? 0));
      setYearlyDescription(normalized.discountConfig.yearlyOffer.description ?? "");
      setYearlyValidUntil(normalized.discountConfig.yearlyOffer.validUntil ? normalized.discountConfig.yearlyOffer.validUntil.slice(0, 16) : "");
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
          description: defaultDescription.trim(),
          validUntil: defaultValidUntil || null,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save default discount");
    } finally {
      setSavingDiscount(false);
    }
  };

  const saveBasePrices = async () => {
    const basicMonthly = Number(basicMonthlyPrice);
    const basicYearly = Number(basicYearlyPrice);
    const proMonthly = Number(proMonthlyPrice);
    const proYearly = Number(proYearlyPrice);
    if (
      !Number.isFinite(basicMonthly) || basicMonthly <= 0 ||
      !Number.isFinite(basicYearly) || basicYearly <= 0 ||
      !Number.isFinite(proMonthly) || proMonthly <= 0 ||
      !Number.isFinite(proYearly) || proYearly <= 0
    ) {
      setError("All base prices must be numbers greater than 0.");
      return;
    }
    setSavingPrices(true);
    setError(null);
    try {
      await adminFetch("/api/admin/subscription-promos-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action: "set_base_prices",
          basicMonthlyPrice: basicMonthly,
          basicYearlyPrice: basicYearly,
          proMonthlyPrice: proMonthly,
          proYearlyPrice: proYearly,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save base prices");
    } finally {
      setSavingPrices(false);
    }
  };

  const saveYearlyOffer = async () => {
    const freeMonths = Number(yearlyFreeMonths);
    if (Number.isNaN(freeMonths) || freeMonths < 0 || freeMonths > 11) {
      setError("Yearly free months must be between 0 and 11.");
      return;
    }
    setSavingYearly(true);
    setError(null);
    try {
      await adminFetch("/api/admin/subscription-promos-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action: "set_yearly_offer",
          freeMonths,
          description: yearlyDescription.trim(),
          validUntil: yearlyValidUntil || null,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save yearly offer");
    } finally {
      setSavingYearly(false);
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

  const deletePromo = async (id: string, couponId: string | null) => {
    setActivePromoId(id);
    setError(null);
    try {
      await adminFetch("/api/admin/subscription-promos-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action: "delete_promo_code",
          promotionCodeId: id,
          couponId,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete promo code");
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
        <p className="text-sm font-medium text-foreground">Base subscription prices (Stripe)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Directly updates plan prices by creating new Stripe prices and switching active IDs.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Basic monthly"
            value={basicMonthlyPrice}
            onChange={(e) => setBasicMonthlyPrice(e.target.value)}
            disabled={!isSuperAdmin || loading || savingPrices}
          />
          <Input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Basic yearly"
            value={basicYearlyPrice}
            onChange={(e) => setBasicYearlyPrice(e.target.value)}
            disabled={!isSuperAdmin || loading || savingPrices}
          />
          <Input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Pro monthly"
            value={proMonthlyPrice}
            onChange={(e) => setProMonthlyPrice(e.target.value)}
            disabled={!isSuperAdmin || loading || savingPrices}
          />
          <Input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Pro yearly"
            value={proYearlyPrice}
            onChange={(e) => setProYearlyPrice(e.target.value)}
            disabled={!isSuperAdmin || loading || savingPrices}
          />
        </div>
        <div className="mt-3">
          <Button onClick={() => void saveBasePrices()} disabled={!isSuperAdmin || loading || savingPrices}>
            Save base prices
          </Button>
        </div>
        {data?.priceConfig && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              Current amounts:
              {" "}
              Basic {data.priceConfig.amounts?.basic?.monthly ?? "-"} /month,
              {" "}
              {data.priceConfig.amounts?.basic?.yearly ?? "-"} /year ·
              {" "}
              Pro {data.priceConfig.amounts?.pro?.monthly ?? "-"} /month,
              {" "}
              {data.priceConfig.amounts?.pro?.yearly ?? "-"} /year
            </p>
            <p>
              Active IDs:
              {" "}
              basic(m): {data.priceConfig.basic.monthlyPriceId ?? "-"},
              {" "}
              basic(y): {data.priceConfig.basic.yearlyPriceId ?? "-"}
            </p>
            <p>
              pro(m): {data.priceConfig.pro.monthlyPriceId ?? "-"},
              {" "}
              pro(y): {data.priceConfig.pro.yearlyPriceId ?? "-"}
            </p>
          </div>
        )}
      </div>

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
          <Input
            className="min-w-[280px] flex-1"
            placeholder="Description (e.g. First Year -50%)"
            value={defaultDescription}
            onChange={(e) => setDefaultDescription(e.target.value)}
            disabled={!isSuperAdmin || loading || savingDiscount}
          />
          <Input
            className="w-56"
            type="datetime-local"
            value={defaultValidUntil}
            onChange={(e) => setDefaultValidUntil(e.target.value)}
            disabled={!isSuperAdmin || loading || savingDiscount}
          />
          <Button onClick={() => void saveDefaultDiscount()} disabled={!isSuperAdmin || loading || savingDiscount}>
            Save default discount
          </Button>
        </div>
        {data && (
          <p className="mt-3 text-xs text-muted-foreground">
            Current: {data.discountConfig.enabled ? `${data.discountConfig.percentOff}%` : "Disabled"}
            {data.discountConfig.description ? ` · ${data.discountConfig.description}` : ""}
            {data.discountConfig.validUntil ? ` · valid until ${new Date(data.discountConfig.validUntil).toLocaleString()}` : ""}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Yearly offer</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure yearly subscription promotions (example: 3 months free = 25% off first yearly payment).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            className="w-40"
            type="number"
            min={0}
            max={11}
            step={1}
            value={yearlyFreeMonths}
            onChange={(e) => setYearlyFreeMonths(e.target.value)}
            disabled={!isSuperAdmin || loading || savingYearly}
          />
          <Input
            className="min-w-[280px] flex-1"
            placeholder="Description (e.g. 3 months for free)"
            value={yearlyDescription}
            onChange={(e) => setYearlyDescription(e.target.value)}
            disabled={!isSuperAdmin || loading || savingYearly}
          />
          <Input
            className="w-56"
            type="datetime-local"
            value={yearlyValidUntil}
            onChange={(e) => setYearlyValidUntil(e.target.value)}
            disabled={!isSuperAdmin || loading || savingYearly}
          />
          <Button onClick={() => void saveYearlyOffer()} disabled={!isSuperAdmin || loading || savingYearly}>
            Save yearly offer
          </Button>
        </div>
        {data && (
          <p className="mt-3 text-xs text-muted-foreground">
            Current yearly offer: {data.discountConfig.yearlyOffer.enabled ? `${data.discountConfig.yearlyOffer.freeMonths} months free` : "Disabled"}
            {data.discountConfig.yearlyOffer.description ? ` · ${data.discountConfig.yearlyOffer.description}` : ""}
            {data.discountConfig.yearlyOffer.validUntil ? ` · valid until ${new Date(data.discountConfig.yearlyOffer.validUntil).toLocaleString()}` : ""}
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!isSuperAdmin || !row.active || activePromoId === row.id}
                        onClick={() => void deactivatePromo(row.id)}
                      >
                        End
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={!isSuperAdmin || activePromoId === row.id}
                        onClick={() => void deletePromo(row.id, row.couponId)}
                      >
                        Delete
                      </Button>
                    </div>
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
