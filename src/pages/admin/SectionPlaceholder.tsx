interface SectionPlaceholderProps {
  title: string;
  description: string;
}

export function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <section className="app-card app-card--interactive">
      <h2 className="page-title text-left">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </section>
  );
}
