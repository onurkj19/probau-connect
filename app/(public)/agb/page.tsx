import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB",
  description: "General terms and conditions for ProBau.ch platform usage.",
};

const AgbPage = () => (
  <section className="bg-white py-16">
    <div className="container max-w-3xl space-y-6">
      <h1 className="text-4xl font-bold text-brand-900">Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p className="text-neutral-600">
        These terms govern the use of ProBau.ch by Arbeitsgeber and Unternehmer.
      </p>
      <h2 className="text-xl font-semibold text-brand-900">Scope</h2>
      <p className="text-neutral-600">
        ProBau.ch provides a digital marketplace for publishing and bidding on construction
        projects in Switzerland.
      </p>
      <h2 className="text-xl font-semibold text-brand-900">Subscriptions</h2>
      <p className="text-neutral-600">
        Unternehmer require an active paid subscription to submit offers. Subscription fees are
        billed monthly.
      </p>
      <h2 className="text-xl font-semibold text-brand-900">Liability</h2>
      <p className="text-neutral-600">
        ProBau.ch acts as a platform intermediary and is not a contractual party between
        Arbeitsgeber and Unternehmer.
      </p>
    </div>
  </section>
);

export default AgbPage;
