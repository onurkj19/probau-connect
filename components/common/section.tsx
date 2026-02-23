import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
  description?: string;
  centered?: boolean;
  children: ReactNode;
}

export const Section = ({
  className,
  title,
  eyebrow,
  description,
  centered = false,
  children,
  ...props
}: SectionProps) => (
  <section className={cn("border-b border-neutral-200 bg-white", className)} {...props}>
    <div className="container py-16 lg:py-20">
      {eyebrow || title || description ? (
        <header className={cn("mb-10", centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl")}>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-swiss-red">{eyebrow}</p>
          ) : null}
          {title ? <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 lg:text-4xl">{title}</h2> : null}
          {description ? <p className="mt-3 text-base text-neutral-600">{description}</p> : null}
        </header>
      ) : null}

      {children}
    </div>
  </section>
);
