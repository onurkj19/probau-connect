import { Skeleton } from "@/components/ui/skeleton";

const ContractorProjectsLoading = () => (
  <div className="space-y-4">
    <Skeleton className="h-11 w-full" />
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  </div>
);

export default ContractorProjectsLoading;
