import Link from "next/link";
import MarketStatusBadge from "@/components/market/shared/MarketStatusBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type MarketHeaderProps = {
  title: string;
  description: string;
  status: string;
  walletBalance: number | null;
  metaChips?: string[];
  event?: {
    slug: string;
    title: string;
  } | null;
  notice?: string | null;
};

export default function MarketHeader({
  title,
  description,
  status,
  walletBalance,
  metaChips = [],
  event = null,
  notice = null,
}: MarketHeaderProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {event ? (
            <div className="mb-2 text-xs font-semibold text-[var(--poly-teal)]">
              <Link href={`/events/${event.slug}`} className="hover:text-[var(--poly-primary)] hover:underline">
                {event.title}
              </Link>
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold text-[var(--poly-text)]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--poly-muted)]">{description}</p>
          {metaChips.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {metaChips.map((chip) => <Badge key={chip}>{chip}</Badge>)}
            </div>
          ) : null}
          {notice ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-left text-xs text-[var(--poly-muted)] sm:text-right">
          <MarketStatusBadge status={status} />
          <div className="mt-2">
            Wallet: {walletBalance === null ? "--" : walletBalance.toFixed(2)} U
          </div>
        </div>
      </div>
    </Card>
  );
}


