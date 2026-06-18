import type { ReactNode } from "react";
import { cn } from "./cn";

type BadgeTone = "neutral" | "primary" | "teal" | "positive" | "negative" | "warning";

const tones: Record<BadgeTone, string> = {
  neutral: "border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-[var(--poly-muted)]",
  primary: "border-indigo-100 bg-indigo-50 text-indigo-700",
  teal: "border-cyan-100 bg-cyan-50 text-cyan-700",
  positive: "border-emerald-100 bg-emerald-50 text-emerald-700",
  negative: "border-red-100 bg-red-50 text-red-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
};

export default function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
