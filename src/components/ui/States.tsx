import type { ReactNode } from "react";
import Card from "./Card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="border-dashed p-6 text-center">
      <div className="text-sm font-semibold text-[var(--poly-text)]">{title}</div>
      {description ? <p className="mt-2 text-sm text-[var(--poly-muted)]">{description}</p> : null}
    </Card>
  );
}

export function LoadingState({
  label = "Loading",
  count = 6,
}: {
  label?: string;
  count?: number;
}) {
  return (
    <div aria-label={label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`${label}-${index}`} className="h-44 animate-pulse rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)]" />
      ))}
    </div>
  );
}

export function ErrorState({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Card className="border-red-100 bg-red-50 p-6 text-sm text-red-700">
      {children}
    </Card>
  );
}
