"use client";

import { useEffect, useMemo, useState } from "react";
import { parseProviderSlugReviewInput, type ProviderSlugReviewInput } from "@/lib/mobileProviderReviewInput";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, SectionHeader, StatCard } from "@/components/ui/PageHeader";

type ProviderReadinessMarket = {
  marketId: string;
  title: string;
  marketGroupTitle: string | null;
  marketType: string;
  period: string | null;
  line: string | null;
  providerRefreshable: boolean;
  missingFields: string[];
  recommendedAction: string;
  externalSlug: string | null;
  outcomes: Array<{
    outcomeId: string;
    name: string;
    providerRefreshable: boolean;
    missingFields: string[];
  }>;
};

type ProviderReadiness = {
  eventSlug: string;
  generatedAt: string;
  compactMarketCount: number;
  providerRefreshableMarketCount: number;
  providerRefreshableOutcomeCount: number;
  totalOutcomeCount: number;
  missingExternalSlugMarketCount: number;
  missingOutcomeTokenMarketCount: number;
  isProviderRefreshReady: boolean;
  nextRequiredAction: string;
  markets: ProviderReadinessMarket[];
};

type WorkflowResult = {
  eventSlug: string;
  mode: string;
  dryRun: boolean;
  applied: boolean;
  blocked: boolean;
  blockReason: string | null;
  nextRequiredAction: string;
  preview?: {
    reviewCount: number;
    attachReadyReviewCount: number;
    candidateCount: number;
    attachReadyCandidateCount: number;
    mappingCount?: number;
    failedReviews?: Array<{
      marketId: string;
      title?: string;
      requestedSlugs?: string[];
      reasons?: string[];
    }>;
  };
  attach?: {
    dryRun: boolean;
    applied: boolean;
    validation?: {
      valid: boolean;
      compactMarketCount: number;
      requestedMarketCount: number;
      errors: string[];
    };
  } | null;
};

const DEFAULT_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const SAMPLE_REVIEWS = [
  "market-id-for-colombia=fifwc-col-gha-2026-07-03-col",
  "market-id-for-draw=fifwc-col-gha-2026-07-03-draw",
  "market-id-for-ghana=fifwc-col-gha-2026-07-03-gha",
].join("\n");

export default function MobileProviderMappingTool() {
  const [user, setUser] = useState<{ isAdmin: boolean } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [eventSlug, setEventSlug] = useState(DEFAULT_EVENT_SLUG);
  const [reviewText, setReviewText] = useState(SAMPLE_REVIEWS);
  const [readiness, setReadiness] = useState<ProviderReadiness | null>(null);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);

  const parsedReviews = useMemo(() => {
    try {
      return parseProviderSlugReviewInput(reviewText);
    } catch {
      return [] as ProviderSlugReviewInput[];
    }
  }, [reviewText]);

  const loadAuth = async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    setUser(data?.user ?? null);
    setAuthChecked(true);
  };

  const loadReadiness = async () => {
    if (!eventSlug.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/mobile/events/${encodeURIComponent(eventSlug.trim())}/provider-mapping`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Failed to load provider mapping readiness.");
        setReadiness(null);
        return;
      }
      setReadiness(data.result as ProviderReadiness);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAuth();
  }, []);

  useEffect(() => {
    if (authChecked && user?.isAdmin) {
      void loadReadiness();
    }
  }, [authChecked, user?.isAdmin]);

  const submitWorkflow = async (apply: boolean) => {
    setError("");
    setMessage("");
    setResult(null);

    let reviews: ProviderSlugReviewInput[];
    try {
      reviews = parseProviderSlugReviewInput(reviewText);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Invalid review input.");
      return;
    }

    if (!eventSlug.trim()) {
      setError("Enter an event slug.");
      return;
    }
    if (reviews.length === 0) {
      setError("Add at least one market review.");
      return;
    }
    if (apply && !confirmApply) {
      setError("Check confirm apply before writing provider mappings.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/mobile/events/${encodeURIComponent(eventSlug.trim())}/provider-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews,
          dryRun: !apply,
          confirmApply: apply,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Provider mapping workflow failed.");
        return;
      }

      setResult(data.result as WorkflowResult);
      setMessage(apply ? "Apply request completed." : "Dry-run review completed.");
      await loadReadiness();
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <PageContainer size="wide">
        <Card className="p-6 text-sm text-[var(--poly-muted)]">Loading admin access...</Card>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer size="wide">
        <Card className="p-6 text-sm text-[var(--poly-muted)]">Log in to access provider mapping tools.</Card>
      </PageContainer>
    );
  }

  if (!user.isAdmin) {
    return (
      <PageContainer size="wide">
        <Card className="p-6 text-sm text-[var(--poly-muted)]">You are not an admin.</Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Mobile provider mapping"
        title="World Cup Provider Review"
        description="Review exact Polymarket slugs against Holiwyn live markets, dry-run the all-pass mapping set, then apply only when every review passes."
      >
        <BetaNotice title="Review gate required" tone="warning">
          This tool calls the protected review-first workflow. A single failed market blocks the whole apply attempt.
        </BetaNotice>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <SectionHeader
            title="Review input"
            description="Paste JSON reviews or one market per line as marketId=polymarket-slug."
          />
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[var(--poly-text)]">
              Event slug
              <input
                value={eventSlug}
                onChange={(event) => setEventSlug(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--poly-border)] px-3 py-2 text-sm focus:border-[var(--poly-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--poly-text)]">
              Market reviews
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                rows={10}
                className="mt-2 w-full rounded-lg border border-[var(--poly-border)] px-3 py-2 font-mono text-xs leading-5 focus:border-[var(--poly-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)]"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => void loadReadiness()} disabled={loading}>
                Refresh readiness
              </Button>
              <Button type="button" onClick={() => void submitWorkflow(false)} disabled={loading}>
                Dry-run review
              </Button>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--poly-muted)]">
                <input
                  type="checkbox"
                  checked={confirmApply}
                  onChange={(event) => setConfirmApply(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--poly-border)]"
                />
                Confirm apply
              </label>
              <Button
                type="button"
                variant="negative"
                onClick={() => void submitWorkflow(true)}
                disabled={loading || !confirmApply}
              >
                Apply all-pass mappings
              </Button>
            </div>
            <div className="text-xs text-[var(--poly-muted)]">
              Parsed reviews: {parsedReviews.length}
            </div>
            {error ? <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="Mapped markets"
            value={`${readiness?.providerRefreshableMarketCount ?? 0} / ${readiness?.compactMarketCount ?? 0}`}
            helper={readiness?.isProviderRefreshReady ? "Ready for provider refresh" : readiness?.nextRequiredAction ?? "Load readiness"}
            tone={readiness?.isProviderRefreshReady ? "positive" : "warning"}
          />
          <StatCard
            label="Mapped outcomes"
            value={`${readiness?.providerRefreshableOutcomeCount ?? 0} / ${readiness?.totalOutcomeCount ?? 0}`}
            helper={`${readiness?.missingOutcomeTokenMarketCount ?? 0} markets missing token data`}
            tone={(readiness?.missingOutcomeTokenMarketCount ?? 0) === 0 ? "positive" : "warning"}
          />
          <StatCard
            label="Missing slugs"
            value={readiness?.missingExternalSlugMarketCount ?? 0}
            helper={readiness?.generatedAt ? `Checked ${new Date(readiness.generatedAt).toLocaleTimeString()}` : "Not checked yet"}
            tone={(readiness?.missingExternalSlugMarketCount ?? 0) === 0 ? "positive" : "warning"}
          />
        </div>
      </div>

      {result ? <WorkflowResultPanel result={result} /> : null}
      {readiness ? <ReadinessPanel readiness={readiness} /> : null}
    </PageContainer>
  );
}

function WorkflowResultPanel({ result }: { result: WorkflowResult }) {
  return (
    <Card className="mt-4 p-5">
      <SectionHeader title="Workflow result" description={result.nextRequiredAction} />
      <div className="grid gap-3 text-sm sm:grid-cols-4">
        <SummaryCell label="Blocked" value={result.blocked ? "Yes" : "No"} tone={result.blocked ? "bad" : "good"} />
        <SummaryCell label="Applied" value={result.applied ? "Yes" : "No"} tone={result.applied ? "good" : "neutral"} />
        <SummaryCell label="Reviews ready" value={`${result.preview?.attachReadyReviewCount ?? 0} / ${result.preview?.reviewCount ?? 0}`} />
        <SummaryCell label="Candidates ready" value={`${result.preview?.attachReadyCandidateCount ?? 0} / ${result.preview?.candidateCount ?? 0}`} />
      </div>
      {result.blockReason ? (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {result.blockReason}
        </div>
      ) : null}
      {result.preview?.failedReviews?.length ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--poly-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--poly-surface-muted)] text-xs uppercase text-[var(--poly-muted)]">
              <tr>
                <th className="px-3 py-2">Market</th>
                <th className="px-3 py-2">Slugs</th>
                <th className="px-3 py-2">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {result.preview.failedReviews.map((review) => (
                <tr key={review.marketId} className="border-t border-[var(--poly-border)]">
                  <td className="px-3 py-2 font-mono text-xs">{review.marketId}</td>
                  <td className="px-3 py-2 font-mono text-xs">{review.requestedSlugs?.join(", ") ?? "--"}</td>
                  <td className="px-3 py-2">{review.reasons?.join(", ") ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {result.attach?.validation ? (
        <div className="mt-4 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-3 py-2 text-sm">
          Attach validation: {result.attach.validation.valid ? "valid" : "invalid"} for {result.attach.validation.requestedMarketCount} markets.
        </div>
      ) : null}
    </Card>
  );
}

function ReadinessPanel({ readiness }: { readiness: ProviderReadiness }) {
  const needsWork = readiness.markets.filter((market) => !market.providerRefreshable);
  return (
    <Card className="mt-4 p-5">
      <SectionHeader
        title="Compact market readiness"
        description={`${needsWork.length} markets still need provider identity before no-fallback refresh can cover the full live page.`}
      />
      <div className="overflow-hidden rounded-lg border border-[var(--poly-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--poly-surface-muted)] text-xs uppercase text-[var(--poly-muted)]">
            <tr>
              <th className="px-3 py-2">Market</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Missing</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {readiness.markets.map((market) => (
              <tr key={market.marketId} className="border-t border-[var(--poly-border)] align-top">
                <td className="px-3 py-2">
                  <div className="font-medium text-[var(--poly-text)]">{market.title}</div>
                  <div className="mt-1 font-mono text-xs text-[var(--poly-muted)]">{market.marketId}</div>
                </td>
                <td className="px-3 py-2">
                  <div>{market.marketType}</div>
                  <div className="text-xs text-[var(--poly-muted)]">{[market.period, market.line].filter(Boolean).join(" / ") || "--"}</div>
                </td>
                <td className="px-3 py-2">{market.providerRefreshable ? "Ready" : "Not ready"}</td>
                <td className="px-3 py-2">{market.missingFields.concat(missingOutcomeFields(market)).join(", ") || "--"}</td>
                <td className="px-3 py-2">{market.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryCell({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-[var(--poly-text)]";
  return (
    <div className="rounded-lg border border-[var(--poly-border)] px-3 py-2">
      <div className="text-xs uppercase text-[var(--poly-muted)]">{label}</div>
      <div className={`mt-1 font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function missingOutcomeFields(market: ProviderReadinessMarket) {
  return Array.from(new Set(market.outcomes.flatMap((outcome) => outcome.missingFields)));
}
