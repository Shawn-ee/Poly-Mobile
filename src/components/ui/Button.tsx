import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "negative" | "outline" | "ghost" | "disabled";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-[var(--poly-primary)] text-white shadow-sm hover:bg-[var(--poly-primary-hover)]",
  secondary: "border-transparent bg-[var(--poly-teal)] text-white shadow-sm hover:bg-[var(--poly-teal-hover)]",
  negative: "border-transparent bg-[var(--poly-negative)] text-white shadow-sm hover:bg-red-600",
  outline: "border-[var(--poly-border)] bg-white text-[var(--poly-text)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]",
  ghost: "border-transparent bg-transparent text-[var(--poly-muted)] hover:bg-[var(--poly-surface-muted)] hover:text-[var(--poly-text)]",
  disabled: "cursor-not-allowed border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-[var(--poly-muted)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-11 px-5 py-2.5 text-sm",
};

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)] focus:ring-offset-2",
        sizes[size],
        disabled ? variants.disabled : variants[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
