"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Outcome = {
  id: string;
  name: string;
};

type MarketCardProps = {
  id: string;
  title: string;
  status: string;
  visibility?: "PUBLIC" | "PRIVATE";
  mechanism?: "ORDERBOOK" | "POOL";
  resolveTime: string | null;
  outcomes: Outcome[];
  prices: { YES: number; NO: number };
};

export default function MarketCard({
  id,
  title,
  status,
  visibility,
  mechanism,
  resolveTime,
  outcomes,
  prices,
}: MarketCardProps) {
  const router = useRouter();

  const handleOutcomeClick = (event: React.MouseEvent, outcome: "YES" | "NO") => {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/markets/${id}?outcome=${outcome}`);
  };

  return (
    <Link
      href={`/markets/${id}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
    >
      <div>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
            PM
          </div>
          <div>
            <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-neutral-600">
              {visibility ? (
                <span className="rounded-full border border-neutral-200 px-2 py-0.5">
                  {visibility}
                </span>
              ) : null}
              {mechanism ? (
                <span className="rounded-full border border-neutral-200 px-2 py-0.5">
                  {mechanism}
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              {status}
              {resolveTime ? ` • ${new Date(resolveTime).toLocaleDateString()}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={(event) => handleOutcomeClick(event, "YES")}
            className="flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            type="button"
          >
            YES {prices.YES.toFixed(2)}
          </button>
          <button
            onClick={(event) => handleOutcomeClick(event, "NO")}
            className="flex-1 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            type="button"
          >
            NO {prices.NO.toFixed(2)}
          </button>
        </div>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        {outcomes.length > 2 ? "Multi-outcome market" : "Binary market"}
      </div>
    </Link>
  );
}
