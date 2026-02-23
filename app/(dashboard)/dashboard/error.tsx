"use client";

import { ErrorState } from "@/components/ui/error-state";

const DashboardError = ({
  error: _error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) => (
  <ErrorState
    title="Dashboard error"
    description="We could not load your dashboard data. Please retry."
    onRetry={reset}
  />
);

export default DashboardError;
