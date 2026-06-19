"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, SectionHeader } from "@/components/ui/PageHeader";

const DEFAULT_PRESETS = [10, 20, 50, 100];
const LEAGUES = ["NFL", "NBA", "Soccer", "NHL"];

const templates = [
  {
    id: "nba",
    label: "NBA game winner",
    sportLeague: "NBA",
    title: "NBA: Team A vs Team B - who wins?",
    sideA: "Team A",
    sideB: "Team B",
  },
  {
    id: "nfl",
    label: "NFL game winner",
    sportLeague: "NFL",
    title: "NFL: Team A vs Team B - who wins?",
    sideA: "Team A",
    sideB: "Team B",
  },
  {
    id: "soccer",
    label: "Soccer match winner",
    sportLeague: "Soccer",
    title: "Soccer: Team A vs Team B - who wins?",
    sideA: "Team A",
    sideB: "Team B",
  },
];

const toLocalInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const defaultPoolTimes = () => {
  const close = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const resolve = new Date(close.getTime() + 3 * 60 * 60 * 1000);
  return {
    close: toLocalInput(close),
    resolve: toLocalInput(resolve),
  };
};

export default function CreatePoolMarketPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportLeague, setSportLeague] = useState("NBA");
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<number[]>(DEFAULT_PRESETS);
  const [betCloseTime, setBetCloseTime] = useState(() => defaultPoolTimes().close);
  const [resolveTime, setResolveTime] = useState(() => defaultPoolTimes().resolve);
  const [maxParticipants, setMaxParticipants] = useState("100");
  const [hidePicksUntilClose, setHidePicksUntilClose] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUserId(data.user?.id ?? null);
    };
    loadUser();
  }, []);

  const invitePreview = useMemo(() => {
    if (typeof window === "undefined") return "/markets/{marketId}?invite=1";
    return `${window.location.origin}/markets/{marketId}?invite=1`;
  }, []);

  const applyTemplate = (template: (typeof templates)[number]) => {
    setSportLeague(template.sportLeague);
    setTitle(template.title);
    setSideA(template.sideA);
    setSideB(template.sideB);
    setSelectedPresets(DEFAULT_PRESETS);
  };

  const togglePreset = (amount: number) => {
    setSelectedPresets((current) =>
      current.includes(amount)
        ? current.filter((value) => value !== amount)
        : [...current, amount].sort((a, b) => a - b)
    );
  };

  const createMarket = async () => {
    setError("");
    if (!title.trim() || !sideA.trim() || !sideB.trim()) {
      setError("Title and both sides are required.");
      return;
    }
    if (!selectedPresets.length) {
      setError("Select at least one allowed stake preset.");
      return;
    }
    const closeDate = new Date(betCloseTime);
    const resolveDate = new Date(resolveTime);
    if (!Number.isFinite(closeDate.getTime()) || !Number.isFinite(resolveDate.getTime())) {
      setError("Enter valid close and resolve times.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/pool-markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sportLeague,
        sideA,
        sideB,
        stakePresets: selectedPresets,
        betCloseTime: closeDate.toISOString(),
        resolveTime: resolveDate.toISOString(),
        maxParticipants: Number(maxParticipants),
        hidePicksUntilClose,
      }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error ?? "Failed to create market.");
      return;
    }
    router.push(`/markets/${data.marketId}`);
  };

  return (
    <PageContainer size="default">
      <PageHeader
        eyebrow="Private pool"
        title="Create your own market"
        description="Create a private pool market for invited participants. This is separate from the public sports orderbook experience."
      >
        <BetaNotice tone="info">
          Private pool creation is a beta tool. This page does not change public market, wallet, settlement, or orderbook behavior.
        </BetaNotice>
      </PageHeader>

      <Card className="mt-6 p-5">
        <SectionHeader title="Suggested templates" description="Start with a sports template, then edit the details below." />
        <div className="mt-3 flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className="rounded-full border border-[var(--poly-border)] px-3 py-1 text-xs font-semibold text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
              type="button"
            >
              {template.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-6 space-y-4 p-5">
        <SectionHeader title="Market setup" description="Keep the question clear and easy for invited participants to understand." />
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={sportLeague}
            onChange={(event) => setSportLeague(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {LEAGUES.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
          <input
            value={sideA}
            onChange={(event) => setSideA(event.target.value)}
            placeholder="Side A"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            value={sideB}
            onChange={(event) => setSideB(event.target.value)}
            placeholder="Side B"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--poly-text)]">Allowed stake presets</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEFAULT_PRESETS.map((amount) => (
              <button
                key={amount}
                onClick={() => togglePreset(amount)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  selectedPresets.includes(amount)
                    ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                    : "border-[var(--poly-border)] text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                }`}
                type="button"
              >
                {amount} U
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-neutral-600">Bet close time</label>
            <input
              type="datetime-local"
              value={betCloseTime}
              onChange={(event) => setBetCloseTime(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-600">Resolve time</label>
            <input
              type="datetime-local"
              value={resolveTime}
              onChange={(event) => setResolveTime(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-neutral-600">Max participants</label>
            <input
              value={maxParticipants}
              onChange={(event) => setMaxParticipants(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={hidePicksUntilClose}
              onChange={(event) => setHidePicksUntilClose(event.target.checked)}
            />
            Hide picks until betting closes
          </label>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          Invite link after create: {invitePreview}
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {!userId ? (
          <div className="text-sm text-neutral-600">
            Log in to create a private pool market.
          </div>
        ) : null}
        <Button
          onClick={createMarket}
          disabled={!userId || submitting}
          className="w-full"
          type="button"
        >
          {submitting ? "Creating..." : "Create private market"}
        </Button>
      </Card>
    </PageContainer>
  );
}

