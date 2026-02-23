import { Skeleton } from "@/components/ui/skeleton";

const DashboardLoading = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-64" />
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
    </div>
    <Skeleton className="h-64" />
  </div>
);

export default DashboardLoading;
