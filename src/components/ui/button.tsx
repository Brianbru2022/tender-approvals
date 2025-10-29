import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./cn"; // <-- Uses the file you just created

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "secondary" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Define styles for variants
    const variantStyles = {
      default: "bg-slate-900 text-white hover:bg-slate-800",
      secondary: "bg-white border text-slate-900 hover:bg-slate-50",
      ghost: "bg-transparent hover:bg-slate-100",
    };

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
          variantStyles[variant || "default"],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";