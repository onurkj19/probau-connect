import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";

const OWNER_LOGO_TICKER_SETTING_KEY = "active_project_owners_ticker";

interface OwnerTickerItem {
  name: string;
  logoUrl?: string | null;
  active?: boolean;
}

const PLACEHOLDER_OWNERS: OwnerTickerItem[] = [
  "AlpenBau AG",
  "SwissConstruct GmbH",
  "Limmat Projekte",
  "Zuri Developments",
  "Helvetic Estates",
  "Arcadia Bau",
  "Nordstern Real",
  "PrimeSite AG",
  "UrbanWerk",
  "Civitas Immobilien",
  "Bergtal Projekte",
  "Mosaic Holdings",
  "Aare Invest",
  "Metropol Bau",
  "Nova Eigentum",
].map((name) => ({ name, active: true }));

function getLogoPlaceholder(name: string): string {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='96' height='40' viewBox='0 0 96 40'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#1d4ed8'/>
      <stop offset='100%' stop-color='#06b6d4'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='96' height='40' rx='8' fill='#ffffff'/>
  <rect x='1' y='1' width='94' height='38' rx='7' fill='none' stroke='#dbe4f0'/>
  <circle cx='20' cy='20' r='12' fill='url(#g)'/>
  <text x='20' y='24' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='9' font-weight='700' fill='#ffffff'>${initials}</text>
  <text x='38' y='24' font-family='Arial, Helvetica, sans-serif' font-size='8' font-weight='600' fill='#334155'>LOGO</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const OwnerLogoTicker = () => {
  const { i18n } = useTranslation();
  const [owners, setOwners] = useState<OwnerTickerItem[]>(PLACEHOLDER_OWNERS);

  useEffect(() => {
    let mounted = true;
    const normalize = (value: unknown): OwnerTickerItem[] => {
      const items = (
        value &&
        typeof value === "object" &&
        "items" in value &&
        Array.isArray((value as { items?: unknown }).items)
          ? (value as { items: unknown[] }).items
          : []
      )
        .map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const row = raw as { name?: unknown; logoUrl?: unknown; active?: unknown };
          const name = typeof row.name === "string" ? row.name.trim() : "";
          if (!name) return null;
          return {
            name,
            logoUrl: typeof row.logoUrl === "string" ? row.logoUrl.trim() : null,
            active: typeof row.active === "boolean" ? row.active : true,
          } as OwnerTickerItem;
        })
        .filter((row): row is OwnerTickerItem => Boolean(row) && row.active !== false);

      return items.length > 0 ? items : PLACEHOLDER_OWNERS;
    };

    const load = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", OWNER_LOGO_TICKER_SETTING_KEY)
        .maybeSingle();
      if (!mounted) return;
      setOwners(normalize(data?.value));
    };

    void load();
    const channel = supabase
      .channel("owner-logo-ticker-setting")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings", filter: `key=eq.${OWNER_LOGO_TICKER_SETTING_KEY}` },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const loopItems = useMemo(() => [...owners, ...owners], [owners]);
  const language = i18n.language.toLowerCase();
  const tickerLabel =
    language.startsWith("de")
      ? "Aktive Projektbesitzer"
      : language.startsWith("fr")
        ? "Propriétaires de projets actifs"
        : language.startsWith("it")
          ? "Proprietari di progetti attivi"
          : "Active Project Owners";

  return (
    <section className="border-b border-border bg-muted/50 py-3">
      <div className="container">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tickerLabel}
        </p>
        <div className="logo-ticker-mask">
          <div className="logo-ticker-track">
            {loopItems.map((owner, index) => (
              <div
                key={`${owner.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
              >
                <img
                  src={owner.logoUrl || getLogoPlaceholder(owner.name)}
                  alt={`${owner.name} logo`}
                  className="h-6 w-auto rounded-sm border border-border/70 bg-white"
                  loading="lazy"
                />
                <span className="text-xs font-medium text-foreground">{owner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerLogoTicker;
