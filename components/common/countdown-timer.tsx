"use client";

import { Clock4 } from "lucide-react";

import { useCountdown } from "@/hooks/use-countdown";

export const CountdownTimer = ({ deadlineIso }: { deadlineIso: string }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(deadlineIso);

  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
        <Clock4 className="h-3.5 w-3.5" />
        Deadline reached
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">
      <Clock4 className="h-3.5 w-3.5" />
      {days}d {hours}h {minutes}m {seconds}s
    </div>
  );
};
