"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Outcome = {
  id: string;
  name: string;
};

type ReferenceSummary = {
  source: string;
  referenceBid: number | null;
  referenceAsk: number | null;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  qualityStatus: string | null;
  isFresh: boolean;
  mmEligible: boolean;
  dryRun: boolean;
  quotePlanEnabled: boolean;
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
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  referenceSummary?: ReferenceSummary | null;
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
  referenceOnly,
  tradable,
  referenceSummary,
}: MarketCardProps) {
  const router = useRouter();
  const nonTradableReference = referenceOnly === true && tradable === false;

  const handleOutcomeClick = (event: React.MouseEvent, outcome: "YES" | "NO") => {
    event.preventDefault();
    event.stopPropagation();
    if (nonTradableReference) {
      router.push(`/markets/${id}`);
      return;
    }
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
            <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">{title}</h3>
            <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-neutral-600">
              {visibility ? (
                <span className="rounded-full border border-neutral-200 px-2 py-0.5">{visibility}</span>
              ) : null}
              {mechanism ? (
                <span className="rounded-full border border-neutral-200 px-2 py-0.5">{mechanism}</span>
              ) : null}
              {nonTradableReference ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                  Reference Only
                </span>
              ) : null}
              {referenceSummary?.source ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700">
                  {referenceSummary.source}
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              {nonTradableReference ? "Coming soon" : status}
              {resolveTime ? ` • ${new Date(resolveTime).toLocaleDateString()}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={(event) => handleOutcomeClick(event, "YES")}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold ${
              nonTradableReference
                ? "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
            type="button"
          >
            {nonTradableReference ? "View market" : `YES ${prices.YES.toFixed(2)}`}
          </button>
          <button
            onClick={(event) => handleOutcomeClick(event, "NO")}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold ${
              nonTradableReference
                ? "border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
            type="button"
          >
            {nonTradableReference ? "Reference price" : `NO ${prices.NO.toFixed(2)}`}
          </button>
        </div>

        {nonTradableReference && referenceSummary ? (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
            <div className="flex items-center justify-between gap-3">
              <span>
                Ref {formatMaybe(referenceSummary.referenceBid)} / {formatMaybe(referenceSummary.referenceAsk)}
              </span>
              <span className={referenceSummary.isFresh ? "text-emerald-700" : "text-amber-700"}>
                {referenceSummary.isFresh ? "Fresh" : "Stale"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span>
                Bot {formatMaybe(referenceSummary.plannedBotBid)} / {formatMaybe(referenceSummary.plannedBotAsk)}
              </span>
              <span>{referenceSummary.quotePlanEnabled ? "Offset 2 ticks" : referenceSummary.qualityStatus ?? "Disabled"}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        {outcomes.length > 2 ? "Multi-outcome market" : "Binary market"}
      </div>
    </Link>
  );
}

function formatMaybe(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "--";
}
