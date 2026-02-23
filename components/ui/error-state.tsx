import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export const ErrorState = ({ title, description, onRetry }: ErrorStateProps) => (
  <Card className="flex flex-col items-start gap-4 border-swiss-soft">
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-swiss-soft text-swiss-red">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600">{description}</p>
    </div>
    {onRetry ? (
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    ) : null}
  </Card>
);
