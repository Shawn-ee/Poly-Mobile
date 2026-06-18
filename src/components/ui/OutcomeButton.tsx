import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type OutcomeTone = "yes" | "no" | "neutral";

const tones: Record<OutcomeTone, string> = {
  yes: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  no: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  neutral: "border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-[var(--poly-text)] hover:bg-white",
};

export default function OutcomeButton({
  label,
  price,
  tone,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  price?: string;
  tone: OutcomeTone;
}) {
  return (
    <button
      className={cn(
        "flex min-h-12 flex-1 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)]",
        tones[tone],
        className,
      )}
      type="button"
      {...props}
    >
      <span>{label}</span>
      {price ? <span className="tabular-nums">{price}</span> : null}
    </button>
  );
}
