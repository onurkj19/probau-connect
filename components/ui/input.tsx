import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-900",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
