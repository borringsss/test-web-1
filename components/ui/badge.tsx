import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-tomato-600 text-white shadow hover:bg-tomato-700",
        secondary:
          "border-transparent bg-cream-200 text-charcoal-800 hover:bg-cream-300",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-charcoal-700/20",
        confirmed:
          "border-olive-500/30 bg-olive-50 text-olive-700 font-medium",
        pending:
          "border-amber-500/30 bg-amber-50 text-amber-800 font-medium",
        available:
          "border-charcoal-200 bg-white text-charcoal-700 font-medium",
        rejected:
          "border-red-500/30 bg-red-50 text-red-700 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
