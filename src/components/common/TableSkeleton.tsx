import { Fragment } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonRowsProps {
  rows?: number;
  columns?: number;
}

const WIDTH_CYCLE = [
  "w-[42%]",
  "w-[68%]",
  "w-[52%]",
  "w-[76%]",
  "w-[38%]",
  "w-[58%]",
  "w-[64%]",
  "w-[48%]",
  "w-[72%]",
  "w-[55%]",
  "w-[34%]",
  "w-[60%]",
] as const;

/** Renders `<tr>` rows only — place inside `<tbody>`. */
export function TableSkeletonRows({ rows = 8, columns = 7 }: TableSkeletonRowsProps) {
  return (
    <Fragment>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-t border-border">
          {Array.from({ length: columns }).map((_, ci) => (
            <td key={ci} className="px-4 py-3 align-middle">
              <Skeleton
                className={cn(
                  "h-4 max-w-full border-transparent bg-muted/35",
                  WIDTH_CYCLE[(ri + ci) % WIDTH_CYCLE.length],
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </Fragment>
  );
}
