"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import OutcomeButton from "@/components/ui/OutcomeButton";

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
      className="group block h-full"
    >
      <Card interactive className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-[var(--poly-primary)]">
            YES
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-[var(--poly-text)]">{title}</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {visibility ? <Badge>{visibility === "PUBLIC" ? "Public" : "Private"}</Badge> : null}
              {mechanism ? <Badge tone="primary">{mechanism === "ORDERBOOK" ? "Orderbook" : "Pool"}</Badge> : null}
              {nonTradableReference ? <Badge tone="warning">Reference Only</Badge> : null}
              {referenceSummary?.source ? <Badge tone="teal">{referenceSummary.source}</Badge> : null}
            </div>
            <div className="mt-2 text-xs text-[var(--poly-muted)]">
              {nonTradableReference ? "Coming soon" : formatStatus(status)}
              {resolveTime ? ` - ${new Date(resolveTime).toLocaleDateString()}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <OutcomeButton
            onClick={(event) => handleOutcomeClick(event, "YES")}
            tone={nonTradableReference ? "neutral" : "yes"}
            label={nonTradableReference ? "View market" : "YES"}
            price={nonTradableReference ? undefined : prices.YES.toFixed(2)}
          />
          <OutcomeButton
            onClick={(event) => handleOutcomeClick(event, "NO")}
            tone={nonTradableReference ? "neutral" : "no"}
            label={nonTradableReference ? "Reference" : "NO"}
            price={nonTradableReference ? undefined : prices.NO.toFixed(2)}
          />
        </div>

        {nonTradableReference && referenceSummary ? (
          <div className="mt-4 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3 text-xs text-[var(--poly-muted)]">
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

      <div className="mt-6 text-xs font-medium text-[var(--poly-muted)]">
        {outcomes.length > 2 ? "Multi-outcome market" : "Binary Yes/No market"}
      </div>
      </Card>
    </Link>
  );
}

function formatMaybe(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "--";
}

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
