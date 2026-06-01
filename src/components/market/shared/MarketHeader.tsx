import Link from "next/link";
import MarketStatusBadge from "@/components/market/shared/MarketStatusBadge";

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
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {event ? (
            <div className="mb-2 text-xs text-neutral-500">
              <Link href={`/events/${event.slug}`} className="hover:text-neutral-700 hover:underline">
                {event.title}
              </Link>
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
          {metaChips.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              {metaChips.map((chip) => (
                <span key={chip} className="rounded-full border border-neutral-200 px-2 py-0.5">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
          {notice ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="text-right text-xs text-neutral-600">
          <MarketStatusBadge status={status} />
          <div className="mt-2">
            Wallet: {walletBalance === null ? "--" : walletBalance.toFixed(2)} U
          </div>
        </div>
      </div>
    </div>
  );
}


