import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export const AuthShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="bg-neutral-50 py-16">
    <div className="container">
      <Card className="mx-auto w-full max-w-xl">
        <h1 className="text-3xl font-bold text-brand-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  </section>
);
