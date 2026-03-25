import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-snug text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        /** Default: primary field label */
        default: "",
        /** Helper / secondary line under or beside the label */
        muted: "text-xs font-normal text-muted-foreground",
        /** Checkbox / switch row (no extra emphasis) */
        inline: "text-sm font-medium text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
