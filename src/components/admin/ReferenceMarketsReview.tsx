"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useEffect, useMemo, useState } from "react";

type ReferenceOutcome = {
  id: string;
  name: string;
  displayOrder: number;
  isTradable: boolean;
  referenceTokenId: string | null;
  referenceOutcomeLabel: string | null;
  referenceMetadata: unknown;
};

type ReferenceMarket = {
  id: string;
  title: string;
  description: string;
  status: string;
  isListed: boolean;
  event: {
    id: string;
    slug: string | null;
    title: string;
    category: string | null;
    source: string | null;
    externalEventId: string | null;
    externalSlug: string | null;
  } | null;
  externalMarketId: string | null;
  externalSlug: string | null;
  conditionId: string | null;
  referenceSource: string | null;
  importStatus: "pending_review" | "approved" | "rejected" | null;
  referenceOnly: boolean | null;
  tradable: boolean | null;
  mmEnabled: boolean | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  outcomePrices: unknown;
  bestBid: unknown;
  bestAsk: unknown;
  spread: unknown;
  lastTradePrice: unknown;
  volume24hr: unknown;
  liquidity: unknown;
  acceptingOrders: unknown;
  snapshotSummary?: {
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
    hasSnapshot: boolean;
  } | null;
  botInitialization?: {
    status: string;
    lastCheckedAt: string | null;
    reason: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    riskProfile: string | null;
    capital?: {
      budgetCents: number | null;
      mintBudgetCents: number | null;
      mintedCompleteSets: number | null;
      cashReserveCents: number | null;
      autoReplenish: boolean;
      initializedAt: string | null;
      initializedBy: string | null;
      botUserId: string | null;
      botUsername: string | null;
      botApiCredentialId: string | null;
      botApiKeyId: string | null;
      maxSingleOrderNotionalCents: number | null;
      maxOpenOrderNotionalCents: number | null;
      maxDailyLossCents: number | null;
    } | null;
    runtime?: {
      liveOrdersEnabled: boolean;
      emergencyStop: boolean;
      cancelRequestedAt: string | null;
      lastSeededAt: string | null;
      lastLiveRunAt: string | null;
      lastRuntimeSyncAt: string | null;
    } | null;
    readiness?: {
      ready: boolean;
      dryRun: boolean;
      liveRequested: boolean;
      reasons: string[];
      referenceBid: number | null;
      referenceAsk: number | null;
      plannedBotBid: number | null;
      plannedBotAsk: number | null;
      riskProfile: string | null;
      checkedAt: string | null;
    } | null;
  } | null;
  referenceMetadata: unknown;
  outcomes: ReferenceOutcome[];
};

type DraftState = {
  reviewNotes: string;
  referenceOnly: boolean;
  tradable: boolean;
  mmEnabled: boolean;
  isListed: boolean;
};

type AdminAction =
  | "refresh_snapshot"
  | "run_readiness_check"
  | "mark_dry_run_running"
  | "pause_bot"
  | "reset_bot_initialization"
  | "mark_live_ready"
  | "emergency_stop"
  | "cancel_bot_quotes";

type ImportPreview = {
  slug: string;
  question: string;
  externalMarketId: string;
  conditionId: string | null;
  description: string | null;
  category: string | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  acceptingOrders: boolean;
  endDate: string | null;
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  liquidityClob: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  lastTradePrice: number | null;
  outcomePrices: number[];
  event: {
    title: string;
    slug: string | null;
  } | null;
  outcomes: Array<{
    name: string;
    tokenId: string | null;
    outcomePrice: number | null;
    displayOrder: number;
  }>;
  rawSummary: {
    resolutionSource: string | null;
    tags: string[];
  };
  qualityWarning: string | null;
  marketType: "binary" | "multi-outcome";
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "--";

const statusTone = (status: string | null) => {
  if (status === "approved") return "border-green-200 bg-green-50 text-green-700";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

export default function ReferenceMarketsReview() {
  const [user, setUser] = useState<{ isAdmin: boolean } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<ReferenceMarket[]>([]);
  const [source, setSource] = useState("polymarket");
  const [importStatus, setImportStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [importInput, setImportInput] = useState("");
  const [importDryRun, setImportDryRun] = useState(true);
  const [importCreateLocalMarkets, setImportCreateLocalMarkets] = useState(false);
  const [importCreateEvents, setImportCreateEvents] = useState(true);
  const [importNotes, setImportNotes] = useState("");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importPreviewMessage, setImportPreviewMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    const [userRes, dataRes] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch(
        `/api/admin/reference-markets?${new URLSearchParams({
          source,
          ...(importStatus !== "ALL" ? { importStatus } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        }).toString()}`,
        { cache: "no-store" },
      ),
    ]);

    const userData = await userRes.json().catch(() => null);
    setUser(userData?.user ?? null);
    setAuthChecked(true);

    const data = await dataRes.json().catch(() => null);
    if (!dataRes.ok) {
      setError(data?.error ?? "Failed to load reference markets.");
      setItems([]);
      setLoading(false);
      return;
    }

    const nextItems = (data?.items ?? []) as ReferenceMarket[];
    setItems(nextItems);
    setDrafts((current) => {
      const next = { ...current };
      for (const item of nextItems) {
        next[item.id] ??= {
          reviewNotes: item.reviewNotes ?? "",
          referenceOnly: item.referenceOnly ?? true,
          tradable: item.tradable ?? false,
          mmEnabled: item.mmEnabled ?? false,
          isListed: item.isListed,
        };
      }
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [source, importStatus]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const needle = search.trim().toLowerCase();
    return items.filter((item) =>
      [
        item.title,
        item.event?.title ?? "",
        item.externalSlug ?? "",
        item.conditionId ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [items, search]);

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        reviewNotes: current[id]?.reviewNotes ?? "",
        referenceOnly: current[id]?.referenceOnly ?? true,
        tradable: current[id]?.tradable ?? false,
        mmEnabled: current[id]?.mmEnabled ?? false,
        isListed: current[id]?.isListed ?? false,
        ...patch,
      },
    }));
  };

  const submitReview = async (
    item: ReferenceMarket,
    payload: Record<string, unknown>,
    confirmMessage?: string,
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    setSubmittingId(item.id);
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/reference-markets/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to update review state.");
      setSubmittingId(null);
      return;
    }
    setMessage("Reference market updated.");
    await loadData();
    setSubmittingId(null);
  };

  const saveDraft = async (item: ReferenceMarket) => {
    const draft = drafts[item.id];
    if (!draft) return;

    const confirmations: string[] = [];
    if (draft.tradable) {
      confirmations.push("mark this imported market tradable");
    }
    if (draft.mmEnabled) {
      confirmations.push("enable MM metadata on this imported market");
    }
    if (draft.isListed && item.importStatus !== "approved") {
      confirmations.push("list a market that is not approved");
    }

    const confirmation =
      confirmations.length > 0
        ? `Do you want to ${confirmations.join(" and ")}?`
        : undefined;

    await submitReview(
      item,
      {
        reviewNotes: draft.reviewNotes,
        referenceOnly: draft.referenceOnly,
        tradable: draft.tradable,
        mmEnabled: draft.mmEnabled,
        isListed: draft.isListed,
      },
      confirmation,
    );
  };

  const runAdminAction = async (
    item: ReferenceMarket,
    action: AdminAction,
    confirmMessage?: string,
  ) => {
    await submitReview(item, { action }, confirmMessage);
  };

  const submitImport = async (mode: "preview" | "import") => {
    setImportSubmitting(true);
    setError("");
    setMessage("");
    setImportPreviewMessage("");
    if (mode === "preview") {
      setImportDryRun(true);
    }

    const res = await fetch("/api/admin/reference-markets/polymarket/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: importInput,
        url: importInput,
        dryRun: mode === "preview" ? true : false,
        createLocalMarkets: mode === "import" ? true : importCreateLocalMarkets,
        createEvents: importCreateEvents,
        notes: importNotes,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to import Polymarket market.");
      setImportSubmitting(false);
      return;
    }

    setImportPreview((data?.preview ?? null) as ImportPreview | null);
    if (mode === "preview" || data?.dryRun) {
      setImportPreviewMessage(data?.warning ?? "Preview loaded. No local records were created.");
    } else {
      setImportPreviewMessage("Imported as pending review. Market remains hidden and non-tradable.");
      setMessage("Reference market imported as pending review.");
      await loadData();
    }
    setImportSubmitting(false);
  };

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-sm text-neutral-600">Loading admin permissions...</p>
      </main>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-sm text-neutral-600">You are not an admin.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin Review
          </div>
          <h1 className="text-2xl font-semibold">Reference Markets</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Review imported Polymarket metadata before any market becomes listed or tradable.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
        >
          Back to Admin
        </Link>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Imported markets are not automatically tradable, not MM-enabled, and not listed publicly.
          Admin review is still required after import. Approval does not automatically enable trading or MM.
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Import One Polymarket Market</h2>
            <input
              value={importInput}
              onChange={(event) => setImportInput(event.target.value)}
              placeholder="Polymarket slug or https://polymarket.com/event/..."
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importDryRun}
                  onChange={(event) => setImportDryRun(event.target.checked)}
                />
                Dry run
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importCreateLocalMarkets}
                  onChange={(event) => setImportCreateLocalMarkets(event.target.checked)}
                />
                Create local market
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importCreateEvents}
                  onChange={(event) => setImportCreateEvents(event.target.checked)}
                />
                Create events
              </label>
            </div>
            <textarea
              value={importNotes}
              onChange={(event) => setImportNotes(event.target.value)}
              rows={3}
              placeholder="Optional review notes"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={importSubmitting || !importInput.trim()}
                onClick={() => void submitImport("preview")}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
              >
                Preview Import
              </button>
              <button
                type="button"
                disabled={importSubmitting || !importInput.trim()}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Import this Polymarket market as pending review? It will remain hidden, non-tradable, and MM-disabled.",
                    )
                  ) {
                    return;
                  }
                  setImportDryRun(false);
                  setImportCreateLocalMarkets(true);
                  void submitImport("import");
                }}
                className="rounded-md bg-black px-3 py-2 text-sm text-white"
              >
                Import as Pending Review
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold">Preview</h3>
            {importPreview ? (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="font-medium">{importPreview.question}</div>
                  <div className="text-xs text-neutral-600">
                    {importPreview.event?.title ?? "--"} · {importPreview.marketType}
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-neutral-700 sm:grid-cols-2">
                  <div>slug: {importPreview.slug}</div>
                  <div>conditionId: {importPreview.conditionId ?? "--"}</div>
                  <div>bestBid: {formatValue(importPreview.bestBid)}</div>
                  <div>bestAsk: {formatValue(importPreview.bestAsk)}</div>
                  <div>spread: {formatValue(importPreview.spread)}</div>
                  <div>lastTradePrice: {formatValue(importPreview.lastTradePrice)}</div>
                  <div>volume24hr: {formatValue(importPreview.volume24hr)}</div>
                  <div>liquidity: {formatValue(importPreview.liquidity)}</div>
                  <div>acceptingOrders: {String(importPreview.acceptingOrders)}</div>
                  <div>endDate: {formatDate(importPreview.endDate)}</div>
                </div>
                {importPreview.qualityWarning ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {importPreview.qualityWarning}
                  </div>
                ) : null}
                <div className="space-y-2">
                  {importPreview.outcomes.map((outcome) => (
                    <div
                      key={`${outcome.displayOrder}-${outcome.name}`}
                      className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs"
                    >
                      <div className="font-medium">{outcome.name}</div>
                      <div>token: {outcome.tokenId ?? "--"}</div>
                      <div>outcomePrice: {formatValue(outcome.outcomePrice)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">
                Preview a Polymarket slug or URL to inspect normalized market data before import.
              </p>
            )}
            {importPreviewMessage ? (
              <p className="mt-3 text-sm text-neutral-700">{importPreviewMessage}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, event, slug, conditionId"
            className="min-w-[260px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="polymarket">polymarket</option>
          </select>
          <select
            value={importStatus}
            onChange={(event) => setImportStatus(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="pending_review">pending_review</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
          >
            Refresh
          </button>
          <span className="text-xs text-neutral-500">
            Snapshot refresh: <code>npm run reference:snapshot-refresh -- --once</code>
          </span>
        </div>
        {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-3">Market</th>
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Flags</th>
                <th className="px-3 py-3">Slug / Condition</th>
                <th className="px-3 py-3">Quotes</th>
                <th className="px-3 py-3">Bot Init</th>
                <th className="px-3 py-3">Liquidity</th>
                <th className="px-3 py-3">Outcomes</th>
                <th className="px-3 py-3">Review</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-sm text-neutral-600">
                    Loading imported reference markets...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-sm text-neutral-600">
                    No imported reference markets found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const draft = drafts[item.id] ?? {
                    reviewNotes: item.reviewNotes ?? "",
                    referenceOnly: item.referenceOnly ?? true,
                    tradable: item.tradable ?? false,
                    mmEnabled: item.mmEnabled ?? false,
                    isListed: item.isListed,
                  };
                  const expanded = expandedId === item.id;
                  const approved = item.importStatus === "approved";

                  return (
                    <Fragment key={item.id}>
                      <tr
                        className="border-t border-neutral-100 align-top hover:bg-neutral-50"
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium">{item.title}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {item.referenceSource ?? "--"} · {item.status}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div>{item.event?.title ?? "--"}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {item.event?.category ?? item.event?.source ?? "--"}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusTone(
                              item.importStatus,
                            )}`}
                          >
                            {item.importStatus ?? "pending_review"}
                          </span>
                          <div className="mt-1 text-xs text-neutral-500">
                            Reviewed {formatDate(item.reviewedAt)}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-700">
                          <div>referenceOnly: {formatValue(item.referenceOnly)}</div>
                          <div>tradable: {formatValue(item.tradable)}</div>
                          <div>mmEnabled: {formatValue(item.mmEnabled)}</div>
                          <div>isListed: {formatValue(item.isListed)}</div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div className="max-w-[220px] truncate">{item.externalSlug ?? "--"}</div>
                          <div className="mt-1 max-w-[220px] truncate text-neutral-500">
                            {item.conditionId ?? "--"}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div>bid {formatValue(item.snapshotSummary?.referenceBid ?? item.bestBid)}</div>
                          <div>ask {formatValue(item.snapshotSummary?.referenceAsk ?? item.bestAsk)}</div>
                          <div>plan {formatValue(item.snapshotSummary?.plannedBotBid)} / {formatValue(item.snapshotSummary?.plannedBotAsk)}</div>
                          <div>{item.snapshotSummary?.hasSnapshot ? (item.snapshotSummary.isFresh ? "fresh" : "stale") : "no snapshot"}</div>
                          <div>eligible {item.snapshotSummary?.mmEligible ? "yes" : "no"}</div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div>status {item.botInitialization?.status ?? "not_started"}</div>
                          <div>checked {formatDate(item.botInitialization?.lastCheckedAt ?? null)}</div>
                          <div>reason {item.botInitialization?.reason ?? "--"}</div>
                          <div>
                            blocked {item.botInitialization?.readiness?.reasons?.length
                              ? item.botInitialization.readiness.reasons.join(", ")
                              : "--"}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div>24h {formatValue(item.volume24hr)}</div>
                          <div>liq {formatValue(item.liquidity)}</div>
                          <div>orders {formatValue(item.acceptingOrders)}</div>
                          <div>quality {formatValue(item.snapshotSummary?.qualityStatus ?? "--")}</div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div>{item.outcomes.length}</div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : item.id)}
                            className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
                          >
                            {expanded ? "Hide" : "Review"}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="border-t border-neutral-100 bg-neutral-50">
                          <td colSpan={10} className="px-3 py-4">
                            <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                              <div className="space-y-4">
                                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                                  <h3 className="text-sm font-semibold">Market Detail</h3>
                                  <p className="mt-2 text-sm text-neutral-700">
                                    {item.description || "No description."}
                                  </p>
                                  <div className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
                                    <div>externalMarketId: {item.externalMarketId ?? "--"}</div>
                                    <div>source: {item.referenceSource ?? "--"}</div>
                                    <div>event slug: {item.event?.slug ?? "--"}</div>
                                    <div>reviewedBy: {item.reviewedBy ?? "--"}</div>
                                  </div>
                                </section>

                                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                                  <h3 className="text-sm font-semibold">Outcomes</h3>
                                  <div className="mt-3 space-y-2">
                                    {item.outcomes.map((outcome, index) => (
                                      <div
                                        key={outcome.id}
                                        className="rounded-md border border-neutral-100 px-3 py-2 text-xs"
                                      >
                                        <div className="font-medium">
                                          {index + 1}. {outcome.name}
                                        </div>
                                        <div className="mt-1 text-neutral-600">
                                          token: {outcome.referenceTokenId ?? "--"}
                                        </div>
                                        <div className="text-neutral-600">
                                          ref label: {outcome.referenceOutcomeLabel ?? "--"}
                                        </div>
                                        <div className="text-neutral-600">
                                          tradable: {String(outcome.isTradable)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>

                                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                                  <h3 className="text-sm font-semibold">Reference Metadata Summary</h3>
                                  <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-neutral-950 p-3 text-xs text-neutral-100">
                                    {JSON.stringify(
                                      {
                                        outcomePrices: item.outcomePrices,
                                        bestBid: item.bestBid,
                                        bestAsk: item.bestAsk,
                                        spread: item.spread,
                                        lastTradePrice: item.lastTradePrice,
                                        volume24hr: item.volume24hr,
                                        liquidity: item.liquidity,
                                        acceptingOrders: item.acceptingOrders,
                                      },
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </section>
                              </div>

                              <div className="space-y-4">
                                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                                  <h3 className="text-sm font-semibold">Review Controls</h3>
                                  <div className="mt-3 space-y-3 text-sm">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={draft.referenceOnly}
                                        onChange={(event) =>
                                          updateDraft(item.id, {
                                            referenceOnly: event.target.checked,
                                          })
                                        }
                                      />
                                      Reference only
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={draft.tradable}
                                        onChange={(event) =>
                                          updateDraft(item.id, {
                                            tradable: event.target.checked,
                                          })
                                        }
                                      />
                                      Tradable
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={draft.mmEnabled}
                                        onChange={(event) =>
                                          updateDraft(item.id, {
                                            mmEnabled: event.target.checked,
                                          })
                                        }
                                      />
                                      MM enabled
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={draft.isListed}
                                        disabled={!approved && !draft.isListed}
                                        onChange={(event) =>
                                          updateDraft(item.id, {
                                            isListed: event.target.checked,
                                          })
                                        }
                                      />
                                      Listed in public discovery
                                    </label>
                                    {!approved ? (
                                      <p className="text-xs text-neutral-500">
                                        Public listing remains disabled until the market is approved.
                                      </p>
                                    ) : null}
                                    <textarea
                                      value={draft.reviewNotes}
                                      onChange={(event) =>
                                        updateDraft(item.id, {
                                          reviewNotes: event.target.value,
                                        })
                                      }
                                      rows={5}
                                      placeholder="Review notes"
                                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void submitReview(
                                          item,
                                          {
                                            action: "approve",
                                            reviewNotes: draft.reviewNotes,
                                            referenceOnly: draft.referenceOnly,
                                            tradable: draft.tradable,
                                            mmEnabled: draft.mmEnabled,
                                            isListed: false,
                                          },
                                          "Approve this imported market? This will not make it tradable or MM-enabled unless those flags are explicitly set.",
                                        )
                                      }
                                      className="rounded-md bg-green-700 px-3 py-2 text-sm text-white"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void submitReview(
                                          item,
                                          {
                                            action: "reject",
                                            reviewNotes: draft.reviewNotes,
                                          },
                                          "Reject this imported market and keep it hidden/non-tradable?",
                                        )
                                      }
                                      className="rounded-md bg-red-700 px-3 py-2 text-sm text-white"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void submitReview(
                                          item,
                                          {
                                            action: "reset",
                                            reviewNotes: draft.reviewNotes,
                                          },
                                          "Reset this imported market back to pending review?",
                                        )
                                      }
                                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                                    >
                                      Reset
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() => void saveDraft(item)}
                                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                                    >
                                      Save Review
                                    </button>
                                  </div>
                                </section>

                                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                                  <h3 className="text-sm font-semibold">Bot Initialization</h3>
                                  <div className="mt-3 space-y-2 text-xs text-neutral-700">
                                    <div>status: {item.botInitialization?.status ?? "not_started"}</div>
                                    <div>lastCheckedAt: {formatDate(item.botInitialization?.lastCheckedAt ?? null)}</div>
                                    <div>reference bid / ask: {formatValue(item.snapshotSummary?.referenceBid)} / {formatValue(item.snapshotSummary?.referenceAsk)}</div>
                                    <div>planned bid / ask: {formatValue(item.snapshotSummary?.plannedBotBid)} / {formatValue(item.snapshotSummary?.plannedBotAsk)}</div>
                                    <div>mmEligible: {String(item.snapshotSummary?.mmEligible ?? false)}</div>
                                    <div>riskProfile: {item.botInitialization?.riskProfile ?? "--"}</div>
                                    <div>seedBudget: {item.botInitialization?.capital?.budgetCents != null ? `$${(item.botInitialization.capital.budgetCents / 100).toFixed(2)}` : "--"}</div>
                                    <div>minted: {item.botInitialization?.capital?.mintBudgetCents != null ? `$${(item.botInitialization.capital.mintBudgetCents / 100).toFixed(2)}` : "--"}</div>
                                    <div>cashReserve: {item.botInitialization?.capital?.cashReserveCents != null ? `$${(item.botInitialization.capital.cashReserveCents / 100).toFixed(2)}` : "--"}</div>
                                    <div>liveOrdersEnabled: {String(item.botInitialization?.runtime?.liveOrdersEnabled ?? false)}</div>
                                    <div>emergencyStop: {String(item.botInitialization?.runtime?.emergencyStop ?? false)}</div>
                                    <div>reason: {item.botInitialization?.reason ?? "--"}</div>
                                    <div>ready: {String(item.botInitialization?.readiness?.ready ?? false)}</div>
                                    <div>
                                      plan: {formatValue(item.botInitialization?.readiness?.plannedBotBid)} /{" "}
                                      {formatValue(item.botInitialization?.readiness?.plannedBotAsk)}
                                    </div>
                                    {item.botInitialization?.readiness?.reasons?.length ? (
                                      <div>blockedBy: {item.botInitialization.readiness.reasons.join(", ")}</div>
                                    ) : null}
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() => void runAdminAction(item, "refresh_snapshot")}
                                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                                    >
                                      Refresh Snapshot
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() => void runAdminAction(item, "run_readiness_check")}
                                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                                    >
                                      Run Readiness Check
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id || item.botInitialization?.status !== "dry_run_ready"}
                                      onClick={() => void runAdminAction(item, "mark_dry_run_running")}
                                      className="rounded-md border border-sky-300 px-3 py-2 text-sm text-sky-700"
                                    >
                                      Mark Dry Run Running
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void runAdminAction(item, "pause_bot", "Pause this bot lifecycle state?")
                                      }
                                      className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700"
                                    >
                                      Pause Bot
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void runAdminAction(item, "reset_bot_initialization", "Reset bot initialization state to not_started?")
                                      }
                                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                                    >
                                      Reset Bot Initialization
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void runAdminAction(
                                          item,
                                          "mark_live_ready",
                                          "Mark this market live_ready? This does not place orders, but it will enforce the stricter live readiness checks.",
                                        )
                                      }
                                      className="rounded-md border border-green-300 px-3 py-2 text-sm text-green-700"
                                    >
                                      Mark Live Ready
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void runAdminAction(item, "cancel_bot_quotes", "Request bot quote cancellation for this market?")
                                      }
                                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                                    >
                                      Cancel Bot Quotes
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingId === item.id}
                                      onClick={() =>
                                        void runAdminAction(
                                          item,
                                          "emergency_stop",
                                          "Emergency stop this market bot and request quote cancellation?",
                                        )
                                      }
                                      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
                                    >
                                      Emergency Stop
                                    </button>
                                  </div>
                                </section>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
