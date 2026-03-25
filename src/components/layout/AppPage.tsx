import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageProps = {
  children: ReactNode;
  className?: string;
  /** Default: consistent vertical rhythm between page sections (dashboard / admin). */
  stack?: boolean;
};

/**
 * Wraps routed page content with shared spacing. Use inside layouts that already provide `.app-main` padding.
 */
export function AppPage({ children, className, stack = true }: AppPageProps) {
  return <div className={cn(stack && "stack-page", className)}>{children}</div>;
}
