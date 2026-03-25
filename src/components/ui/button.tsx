import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[hsl(239_77%_55%)] motion-safe:hover:scale-[1.01] hover:opacity-[0.98] motion-safe:active:scale-[0.95] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 motion-safe:hover:scale-[1.01] hover:opacity-[0.98] motion-safe:active:scale-[0.95] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        outline:
          "border border-border bg-card/70 backdrop-blur-sm hover:bg-muted hover:text-foreground motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.95] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 motion-safe:hover:scale-[1.01] hover:opacity-[0.98] motion-safe:active:scale-[0.95] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        ghost:
          "hover:bg-muted hover:text-foreground motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.95] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        link: "text-primary underline-offset-4 transition-all duration-200 ease-smooth hover:underline hover:opacity-90 active:opacity-80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        /** Toolbar / header icon buttons (36px) */
        icon: "h-9 w-9",
        /** Dense tables and compact toolbars (32px) */
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
