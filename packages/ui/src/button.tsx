import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";
import { Loader } from "./loader";

const buttonVariants = cva(
  "pressable inline-flex items-center justify-center rounded-sm border text-[14px] has-[svg]:gap-2 disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-[var(--accent)] text-white",
        ghost: "border-[var(--line)] bg-transparent text-[var(--fg)]",
        live: "border-transparent bg-[var(--live)] text-black",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const Comp = asChild ? Slot : "button";
  // Slot forwards to a single child, so the spinner only applies to real buttons.
  const spin = loading && !asChild;
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || spin}
      aria-busy={spin || undefined}
      {...props}
    >
      {spin ? <Loader size={16} tone="current" label={null} /> : null}
      {children}
    </Comp>
  );
}
