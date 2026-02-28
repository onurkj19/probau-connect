import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  verified: boolean;
  className?: string;
}

export function VerificationBadge({ verified, className }: VerificationBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px]",
        verified
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          : "border-slate-300 bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
        className,
      )}
    >
      {verified && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
      {verified ? "Verified" : "Unverified"}
    </Badge>
  );
}
