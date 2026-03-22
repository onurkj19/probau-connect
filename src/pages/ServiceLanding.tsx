import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n-routing";
import SeoHead from "@/components/SeoHead";
import {
  SERVICE_CATEGORY_SLUGS,
  getServiceCategoryContent,
  isServiceCategorySlug,
  type ServiceCategorySlug,
} from "@/lib/service-landing-content";

const CH_LABELS: Record<Locale, { ctaPrimary: string; ctaSecondary: string; coverage: string; faq: string }> = {
  de: {
    ctaPrimary: "Projekt kostenlos ausschreiben",
    ctaSecondary: "Als Anbieter registrieren",
    coverage: "Regionale Abdeckung: Zürich, Bern, Basel, Luzern, St. Gallen, Tessin und ganze Schweiz.",
    faq: "Häufige Fragen",
  },
  fr: {
    ctaPrimary: "Publier un projet gratuitement",
    ctaSecondary: "S'inscrire comme prestataire",
    coverage: "Couverture régionale: Zurich, Berne, Bâle, Lausanne, Genève, Tessin et toute la Suisse.",
    faq: "Questions fréquentes",
  },
  it: {
    ctaPrimary: "Pubblica un progetto gratuitamente",
    ctaSecondary: "Registrati come fornitore",
    coverage: "Copertura regionale: Zurigo, Berna, Basilea, Losanna, Ginevra, Ticino e tutta la Svizzera.",
    faq: "Domande frequenti",
  },
  en: {
    ctaPrimary: "Post a project for free",
    ctaSecondary: "Register as contractor",
    coverage: "Regional coverage across Zurich, Bern, Basel, Lausanne, Geneva, Ticino and all Switzerland.",
    faq: "Frequently asked questions",
  },
};

const ServiceLanding = () => {
  const { locale, category } = useParams<{ locale: string; category: string }>();
  const lang: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const slug = (category ?? "").toLowerCase();

  if (!isServiceCategorySlug(slug)) {
    return <Navigate to={`/${lang}`} replace />;
  }

  const content = getServiceCategoryContent(lang, slug);
  const labels = CH_LABELS[lang];
  const canonicalPath = `/${lang}/services/${slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ProjektMarkt",
        item: `${window.location.origin}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.name,
        item: `${window.location.origin}${canonicalPath}`,
      },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: content.name,
    description: content.description,
    provider: {
      "@type": "LocalBusiness",
      name: "ProjektMarkt",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Zurich",
        addressCountry: "CH",
      },
      areaServed: "Switzerland",
    },
    areaServed: {
      "@type": "Country",
      name: "Switzerland",
    },
    serviceType: content.name,
    url: `${window.location.origin}${canonicalPath}`,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="bg-background py-16">
      <SeoHead
        title={`${content.name} | ProjektMarkt Schweiz`}
        description={content.description}
        canonicalPath={canonicalPath}
        schemas={[breadcrumbSchema, serviceSchema, faqSchema]}
      />

      <div className="container max-w-5xl">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">ProjektMarkt Schweiz</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">{content.title}</h1>
          <p className="mt-4 text-muted-foreground">{content.intro}</p>
          <p className="mt-3 text-sm text-muted-foreground">{labels.coverage}</p>

          <ul className="mt-6 space-y-2">
            {content.bullets.map((item) => (
              <li key={item} className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to={`/${lang}/register`}>{labels.ctaPrimary}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/${lang}/pricing`}>{labels.ctaSecondary}</Link>
            </Button>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-card">
          <h2 className="font-display text-2xl font-semibold text-foreground">{labels.faq}</h2>
          <div className="mt-5 space-y-4">
            {content.faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {lang === "de"
              ? "Weitere Kategorien"
              : lang === "fr"
                ? "Autres catégories"
                : lang === "it"
                  ? "Altre categorie"
                  : "Other categories"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SERVICE_CATEGORY_SLUGS.filter((item) => item !== slug).map((item) => (
              <Link
                key={item}
                to={`/${lang}/services/${item}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {getServiceCategoryContent(lang, item as ServiceCategorySlug).name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ServiceLanding;
