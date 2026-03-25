import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "native-form-control flex file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm",
          "aria-invalid:border-red-500/50 aria-invalid:focus-visible:ring-red-500/60 aria-invalid:focus:ring-red-500/60",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
