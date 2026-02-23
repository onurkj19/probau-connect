import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Legal company information for ProBau.ch.",
};

const ImpressumPage = () => (
  <section className="bg-white py-16">
    <div className="container max-w-3xl space-y-5">
      <h1 className="text-4xl font-bold text-brand-900">Impressum</h1>
      <p className="text-neutral-600">ProBau.ch AG</p>
      <p className="text-neutral-600">Musterstrasse 10, 8001 Zürich, Switzerland</p>
      <p className="text-neutral-600">E-Mail: legal@probau.ch</p>
      <p className="text-neutral-600">Telefon: +41 44 000 00 00</p>
      <p className="text-neutral-600">UID: CHE-000.000.000</p>
      <p className="text-neutral-600">
        Responsible for content: Management Board, ProBau.ch AG.
      </p>
    </div>
  </section>
);

export default ImpressumPage;
