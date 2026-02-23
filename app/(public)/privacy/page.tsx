import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for ProBau.ch according to Swiss and EU regulations.",
};

const PrivacyPage = () => (
  <section className="bg-white py-16">
    <div className="container max-w-3xl space-y-6">
      <h1 className="text-4xl font-bold text-brand-900">Privacy Policy</h1>
      <p className="text-neutral-600">
        Protecting your personal data is a core priority at ProBau.ch. We process personal data in
        accordance with the Swiss Federal Act on Data Protection (FADP/DSG) and, where applicable,
        the GDPR.
      </p>
      <h2 className="text-xl font-semibold text-brand-900">Data processing</h2>
      <p className="text-neutral-600">
        We process account, contact and project-related data to provide marketplace services,
        security features and contractual communication.
      </p>
      <h2 className="text-xl font-semibold text-brand-900">Data retention</h2>
      <p className="text-neutral-600">
        Data is retained only as long as required for contractual, legal and operational purposes.
      </p>
      <h2 className="text-xl font-semibold text-brand-900">Your rights</h2>
      <p className="text-neutral-600">
        You may request access, correction or deletion of your personal data at any time by
        contacting privacy@probau.ch.
      </p>
    </div>
  </section>
);

export default PrivacyPage;
