interface SectionPlaceholderProps {
  title: string;
  description: string;
}

export function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </section>
  );
}
