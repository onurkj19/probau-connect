import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Mail, Phone, Star } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";

const Footer = () => {
  const { t } = useTranslation();
  const { user, getToken } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [reviewStats, setReviewStats] = useState<{
    total: number;
    counts: { 1: number; 2: number; 3: number; 4: number; 5: number };
  }>({ total: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [voting, setVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string>("");
  const serviceLinks =
    lang === "fr"
      ? [
          { slug: "gerust", label: "Echafaudage" },
          { slug: "elektriker", label: "Electricien" },
          { slug: "reinigung", label: "Nettoyage" },
        ]
      : lang === "it"
        ? [
            { slug: "gerust", label: "Ponteggio" },
            { slug: "elektriker", label: "Elettricista" },
            { slug: "reinigung", label: "Pulizia" },
          ]
        : lang === "en"
          ? [
              { slug: "gerust", label: "Scaffolding" },
              { slug: "elektriker", label: "Electrician" },
              { slug: "reinigung", label: "Cleaning" },
            ]
          : [
              { slug: "gerust", label: "Gerust" },
              { slug: "elektriker", label: "Elektriker" },
              { slug: "reinigung", label: "Reinigung" },
            ];
  const feedbackText =
    lang === "fr"
      ? {
          title: "Avis & Feedback",
          rate: "Évaluez la plateforme",
          reviewsSummary: "Moyenne",
          votesLabel: "votes",
          voteLoginHint: "Connectez-vous pour voter",
          voteDone: "Merci! Votre vote a été enregistré.",
          voteAlreadyDone: "Vous avez déjà voté.",
          contact: "Suggestions ou réclamations ?",
          contactCta: "Ouvrir l'e-mail de contact",
        }
      : lang === "it"
        ? {
            title: "Recensioni & Feedback",
            rate: "Valuta la piattaforma",
            reviewsSummary: "Media",
            votesLabel: "voti",
            voteLoginHint: "Accedi per votare",
            voteDone: "Grazie! Il tuo voto è stato registrato.",
            voteAlreadyDone: "Hai già votato.",
            contact: "Suggerimenti o reclami?",
            contactCta: "Apri email di contatto",
          }
        : lang === "en"
          ? {
              title: "Reviews & Feedback",
              rate: "Rate the platform",
              reviewsSummary: "Average",
              votesLabel: "votes",
              voteLoginHint: "Sign in to vote",
              voteDone: "Thanks! Your vote has been recorded.",
              voteAlreadyDone: "You have already voted.",
              contact: "Suggestions or complaints?",
              contactCta: "Open contact email",
            }
          : {
              title: "Bewertung & Feedback",
              rate: "Plattform bewerten",
              reviewsSummary: "Durchschnitt",
              votesLabel: "Stimmen",
              voteLoginHint: "Zum Abstimmen bitte einloggen",
              voteDone: "Danke! Deine Bewertung wurde gespeichert.",
              voteAlreadyDone: "Du hast bereits abgestimmt.",
              contact: "Vorschläge oder Beschwerden?",
              contactCta: "Kontakt-E-Mail öffnen",
            };

  const contactMailto = `mailto:info@projektmarkt.ch?subject=${encodeURIComponent(
    "ProjektMarkt Feedback / Suggestion",
  )}&body=${encodeURIComponent(
    "Hallo ProjektMarkt Team,%0D%0A%0D%0AIch habe folgende Anmerkung / Beschwerde / Idee:%0D%0A- ...%0D%0A%0D%0AVielen Dank.",
  )}`;
  const averageRating = useMemo(() => {
    if (reviewStats.total <= 0) return 0;
    const weightedSum =
      reviewStats.counts[1] * 1 +
      reviewStats.counts[2] * 2 +
      reviewStats.counts[3] * 3 +
      reviewStats.counts[4] * 4 +
      reviewStats.counts[5] * 5;
    return weightedSum / reviewStats.total;
  }, [reviewStats]);
  const positivePercent = reviewStats.total > 0
    ? Math.round(((reviewStats.counts[4] + reviewStats.counts[5]) / reviewStats.total) * 100)
    : 0;

  useEffect(() => {
    let active = true;
    const loadReviews = async () => {
      try {
        const response = await fetch("/api/public?scope=reviews");
        if (!response.ok) return;
        const data = (await response.json()) as typeof reviewStats;
        if (!active) return;
        setReviewStats({
          total: Number(data.total) || 0,
          counts: {
            1: Number(data.counts?.[1]) || 0,
            2: Number(data.counts?.[2]) || 0,
            3: Number(data.counts?.[3]) || 0,
            4: Number(data.counts?.[4]) || 0,
            5: Number(data.counts?.[5]) || 0,
          },
        });
      } catch {
        // Keep default stats on error.
      }
    };
    void loadReviews();
    return () => {
      active = false;
    };
  }, []);

  const vote = async (stars: number) => {
    if (voting) return;
    setVoteMessage("");
    if (!user) {
      setVoteMessage(feedbackText.voteLoginHint);
      return;
    }

    setVoting(true);
    try {
      const token = await getToken();
      if (!token) {
        setVoteMessage(feedbackText.voteLoginHint);
        return;
      }
      const response = await fetch("/api/public?scope=reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stars }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          setVoteMessage(feedbackText.voteAlreadyDone);
          return;
        }
        if (response.status === 401) {
          setVoteMessage(feedbackText.voteLoginHint);
          return;
        }
        return;
      }
      const data = (await response.json()) as typeof reviewStats;
      setReviewStats({
        total: Number(data.total) || 0,
        counts: {
          1: Number(data.counts?.[1]) || 0,
          2: Number(data.counts?.[2]) || 0,
          3: Number(data.counts?.[3]) || 0,
          4: Number(data.counts?.[4]) || 0,
          5: Number(data.counts?.[5]) || 0,
        },
      });
      setVoteMessage(feedbackText.voteDone);
    } finally {
      setVoting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <BrandLogo
              to={`/${lang}`}
              imageWrapperClassName="inline-flex rounded-lg bg-white px-3 py-2 shadow-md ring-1 ring-white/50"
              imageClassName="h-14"
            />
            <p className="mt-3 text-sm text-primary-foreground/70">
              {t("footer.description")}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-primary-foreground/50">
              <span className="inline-block h-3 w-4 rounded-sm bg-accent" />
              {t("footer.swiss_made")}
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to={`/${lang}/projects`} className="hover:text-primary-foreground">{t("nav.projects")}</Link></li>
              <li><Link to={`/${lang}/pricing`} className="hover:text-primary-foreground">{t("nav.pricing")}</Link></li>
              {serviceLinks.map((service) => (
                <li key={service.slug}>
                  <Link to={`/${lang}/services/${service.slug}`} className="hover:text-primary-foreground">
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to={`/${lang}/impressum`} className="hover:text-primary-foreground">{t("nav.impressum")}</Link></li>
              <li><Link to={`/${lang}/privacy`} className="hover:text-primary-foreground">{t("nav.privacy")}</Link></li>
              <li><Link to={`/${lang}/terms`} className="hover:text-primary-foreground">{t("nav.terms")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {t("footer.location")}</li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@projektmarkt.ch</li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +41 44 000 00 00</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{feedbackText.title}</h4>
            <p className="text-xs text-primary-foreground/70">{feedbackText.rate}</p>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => (
                <button
                  type="button"
                  key={stars}
                  onClick={() => {
                    void vote(stars);
                  }}
                  disabled={voting}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-amber-300"
                  title={`${stars} / 5`}
                >
                  <Star className="h-4 w-4" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-primary-foreground/70">
              {feedbackText.reviewsSummary}: {averageRating.toFixed(1)}/5 · {positivePercent}% · {reviewStats.total} {feedbackText.votesLabel}
            </p>
            {voteMessage && <p className="mt-1 text-[11px] text-primary-foreground/70">{voteMessage}</p>}
            <p className="mt-3 text-xs text-primary-foreground/70">{feedbackText.contact}</p>
            <a
              href={contactMailto}
              className="mt-2 inline-flex rounded-md border border-primary-foreground/20 px-2.5 py-1.5 text-xs font-medium text-primary-foreground/80 hover:bg-primary-foreground/10"
            >
              {feedbackText.contactCta}
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
