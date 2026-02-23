import { Card } from "@/components/ui/card";

interface StatsCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export const StatsCard = ({ label, value, hint }: StatsCardProps) => (
  <Card>
    <p className="text-sm text-neutral-500">{label}</p>
    <p className="mt-1 text-3xl font-bold text-brand-900">{value}</p>
    {hint ? <p className="mt-2 text-xs text-neutral-500">{hint}</p> : null}
  </Card>
);

// Backward-compatible alias for existing imports.
export const StatCard = StatsCard;
