import Link from "next/link";
import MarketStatusBadge from "@/components/market/shared/MarketStatusBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { BetaNotice } from "@/components/ui/PageHeader";

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
            <div className="mb-2 text-xs font-semibold uppercase text-[var(--poly-teal)]">
              <Link href={`/events/${event.slug}`} className="hover:text-[var(--poly-primary)] hover:underline">
                Event: {event.title}
              </Link>
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold text-[var(--poly-text)]">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--poly-muted)]">{description}</p>
          {metaChips.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {metaChips.map((chip) => <Badge key={chip}>{chip}</Badge>)}
            </div>
          ) : null}
          {notice ? (
            <BetaNotice className="mt-4">{notice}</BetaNotice>
          ) : null}
        </div>

        <div className="shrink-0 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-3 py-2 text-left text-xs text-[var(--poly-muted)] sm:text-right">
          <MarketStatusBadge status={status} />
          <div className="mt-2">
            Wallet: {walletBalance === null ? "--" : walletBalance.toFixed(2)} U
          </div>
        </div>
      </div>
    </Card>
  );
}


