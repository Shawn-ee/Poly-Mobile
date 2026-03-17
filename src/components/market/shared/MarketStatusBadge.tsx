const statusClassMap: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-700",
  LIVE: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-neutral-200 text-neutral-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  CANCELED: "bg-neutral-200 text-neutral-700",
};

export default function MarketStatusBadge({ status }: { status: string }) {
  return (
    <div
      className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${statusClassMap[status] ?? "bg-neutral-200 text-neutral-700"}`}
    >
      {status}
    </div>
  );
}

