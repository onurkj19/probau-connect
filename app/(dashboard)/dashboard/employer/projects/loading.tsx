import { Skeleton } from "@/components/ui/skeleton";

const EmployerProjectsLoading = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-64" />
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  </div>
);

export default EmployerProjectsLoading;
