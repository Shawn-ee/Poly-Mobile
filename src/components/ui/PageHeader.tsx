import type { ReactNode } from "react";
import Card from "./Card";
import { cn } from "./cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("mb-8 overflow-hidden p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">{eyebrow}</div> : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--poly-text)] sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 text-sm leading-6 text-[var(--poly-muted)] sm:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

export function BetaNotice({
  title = "Internal beta",
  children,
  tone = "warning",
  className,
}: {
  title?: string;
  children: ReactNode;
  tone?: "warning" | "info" | "danger";
  className?: string;
}) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-cyan-100 bg-cyan-50 text-cyan-900",
    danger: "border-red-100 bg-red-50 text-red-900",
  };

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", styles[tone], className)}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 leading-6">{children}</div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? <div className="mb-1 text-xs font-semibold uppercase text-[var(--poly-teal)]">{eyebrow}</div> : null}
        <h2 className="text-xl font-semibold text-[var(--poly-text)]">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--poly-muted)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning";
}) {
  const tones = {
    neutral: "text-[var(--poly-text)]",
    positive: "text-emerald-700",
    negative: "text-red-700",
    warning: "text-amber-700",
  };

  return (
    <Card className="p-4">
      <div>
        <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">{label}</div>
        <div className={cn("mt-2 text-xl font-semibold", tones[tone])}>{value}</div>
        {helper ? <div className="mt-1 text-xs text-[var(--poly-muted)]">{helper}</div> : null}
      </div>
    </Card>
  );
}
