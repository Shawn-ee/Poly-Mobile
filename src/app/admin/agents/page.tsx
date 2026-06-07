"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type AgentType = "production" | "development" | "trading_bot" | "system_service";
type AgentStatus = "live" | "running" | "idle" | "completed" | "paused" | "blocked" | "failed" | "stale" | "disabled" | "unknown";
type ModelProvider = "deepseek" | "openai" | "local" | "deterministic" | "unknown";
type AttentionLevel = "none" | "info" | "warning" | "critical";

type AgentActivityEvent = {
  id: string;
  runId?: string;
  agentName: string;
  activity: string;
  level: "debug" | "info" | "warning" | "error";
  timestamp: string;
  source: "orchestrator" | "worker" | "poly-bot" | "systemd" | "manual";
  metadata?: Record<string, unknown>;
};

type AgentDashboardStatus = {
  agentName: string;
  displayName: string;
  type: AgentType;
  status: AgentStatus;
  modelProvider: ModelProvider;
  modelName?: string;
  currentTask?: string;
  latestActivity?: string;
  recentActivity?: AgentActivityEvent[];
  activityUpdatedAt?: string;
  latestRunId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  lastHeartbeatAt?: string;
  tokenTotal?: number;
  tokenByProvider?: {
    deepseek?: number;
    openai?: number;
  };
  blockedCount?: number;
  attentionLevel?: AttentionLevel;
  memoryStatus?: string;
  serviceName?: string;
  serviceActive?: boolean;
  artifactPath?: string;
  logPath?: string;
  safetyMode?: string;
  actions: string[];
};

type RecentRun = {
  runId: string;
  goal: string;
  phase: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  taskCount: number;
  deepseekTokenTotal: number;
  openaiTaskCount: number;
  blockedCount: number;
  memoryProposalStatus: string;
};

type AgentFleetPayload = {
  cards: {
    liveAgents: number;
    runningTasks: number;
    blockedFailed: number;
    productionAgents: number;
    developerAgents: number;
    tradingBots: number;
    deepseekTokens: number;
    openaiTokens: number;
    lastUpdated: string;
  };
  agents: AgentDashboardStatus[];
  recentRuns: RecentRun[];
};

const emptyPayload: AgentFleetPayload = {
  cards: {
    liveAgents: 0,
    runningTasks: 0,
    blockedFailed: 0,
    productionAgents: 0,
    developerAgents: 0,
    tradingBots: 0,
    deepseekTokens: 0,
    openaiTokens: 0,
    lastUpdated: "",
  },
  agents: [],
  recentRuns: [],
};

const tabs = ["All", "Production", "Development", "Trading Bots", "Failed / Blocked", "Recent Runs"] as const;
type Tab = typeof tabs[number];

type MarketOpsStats = {
  listedMarketCount: number;
  liveMarketCount: number;
  hiddenMarketCount: number;
  freshMarketCount: number;
  staleMarketCount: number;
  openOrderCount: number;
  totalOrders: number;
  staleReasons: string[];
  lastUpdated: string;
};

export default function AdminAgentsPage() {
  const [payload, setPayload] = useState<AgentFleetPayload>(emptyPayload);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [marketOps, setMarketOps] = useState<MarketOpsStats | null>(null);

  const selectedAgent = useMemo(
    () => payload.agents.find((agent) => agent.agentName === selectedAgentId) ?? null,
    [payload.agents, selectedAgentId]
  );

  const filteredAgents = useMemo(() => filterAgents(payload.agents, tab), [payload.agents, tab]);

  async function loadStatus(quiet = false) {
    if (!quiet) setRefreshing(true);
    const res = await fetch("/api/admin/agents/status", { cache: "no-store", credentials: "same-origin" });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(adminLoadError(res.status, data?.error));
    const next = parseAgentFleetPayload(data);
    setPayload(next);
    setLastRefreshedAt(new Date().toLocaleString());
  }

  function openAgentDetails(agentName: string) {
    setSelectedAgentId(agentName);
    setIsDetailDrawerOpen(true);
  }

  function closeAgentDetails() {
    setIsDetailDrawerOpen(false);
    setSelectedAgentId("");
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await loadStatus(true);
        if (!cancelled) setError("");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load agent status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const handle = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  useEffect(() => {
    if (!isDetailDrawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAgentDetails();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailDrawerOpen]);

  // Fetch market ops stats (less frequently than agent status)
  useEffect(() => {
    const fetchMarketOps = async () => {
      try {
        const res = await fetch("/api/admin/market-ops-stats", { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json();
          setMarketOps(data as MarketOpsStats);
        }
      } catch { /* quiet */ }
    };
    fetchMarketOps();
    const handle = setInterval(fetchMarketOps, 30_000);
    return () => clearInterval(handle);
  }, []);

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agent Operations Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Live status and activity stream for production agents, developer agents, and trading bots.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="text-xs text-neutral-500">Last refreshed at {lastRefreshedAt ?? "-"}</div>
          <button
            type="button"
            disabled={refreshing}
            onClick={async () => {
              setError("");
              try {
                await loadStatus(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Refresh failed.");
              } finally {
                setRefreshing(false);
              }
            }}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-neutral-600">Loading agent fleet...</p> : null}
      {error ? <p className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{error}</p> : null}

      <section className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        <MetricCard label="Live Agents" value={payload.cards.liveAgents} />
        <MetricCard label="Running Tasks" value={payload.cards.runningTasks} />
        <MetricCard label="Blocked / Failed" value={payload.cards.blockedFailed} alert={payload.cards.blockedFailed > 0} />
        <MetricCard label="Production Agents" value={payload.cards.productionAgents} />
        <MetricCard label="Developer Agents" value={payload.cards.developerAgents} />
        <MetricCard label="Trading Bots" value={payload.cards.tradingBots} />
        <MetricCard label="DeepSeek Tokens" value={payload.cards.deepseekTokens} provider="deepseek" />
        <MetricCard label="OpenAI Tokens" value={payload.cards.openaiTokens} provider="openai" />
        <MetricCard label="Last Updated" value={payload.cards.lastUpdated ? relativeTime(payload.cards.lastUpdated) : "-"} compact />
      </section>

      {/* Market Operations Stats */}
      {marketOps && !loading ? (
        <section className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-8">
          <MetricCard label="Listed Markets" value={`${marketOps.liveMarketCount} live / ${marketOps.listedMarketCount} total`} compact />
          <MetricCard label="Reference Freshness" value={`${marketOps.freshMarketCount} fresh / ${marketOps.staleMarketCount} stale`} compact alert={marketOps.staleMarketCount > 0} />
          <MetricCard label="Open Orders" value={marketOps.openOrderCount} compact />
          <MetricCard label="Total Orders" value={marketOps.totalOrders} compact />
          <MetricCard label="Hidden Markets" value={marketOps.hiddenMarketCount} compact />
        </section>
      ) : null}

      {/* Service State Summary */}
      {!loading ? (
        <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Service State</h2>
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {payload.agents
              .filter((agent) => agent.serviceName)
              .map((agent) => (
                <div
                  key={agent.agentName}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    agent.serviceActive
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        agent.serviceActive ? "bg-emerald-500" : "bg-neutral-400"
                      }`}
                    />
                    <span className={`font-medium ${agent.serviceActive ? "text-emerald-800" : "text-neutral-500"}`}>
                      {agent.serviceActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-neutral-600">{agent.serviceName}</div>
                  <div className="mt-0.5 text-neutral-500">{agent.modelName ?? ""}</div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-neutral-200">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-b-2 px-3 py-2 text-sm ${tab === item ? "border-neutral-900 text-neutral-950" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Recent Runs" ? (
        <RecentRunsTable runs={payload.recentRuns} />
      ) : (
        <Panel title="Agent Fleet">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="py-2 pr-3">Agent</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Model</th>
                  <th className="py-2 pr-3">Current Task</th>
                  <th className="w-[380px] py-2 pr-3">Live Activity Stream</th>
                  <th className="py-2 pr-3">Runtime</th>
                  <th className="py-2 pr-3">Heartbeat</th>
                  <th className="py-2 pr-3">Tokens</th>
                  <th className="py-2 pr-3">Attention</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.agentName} className="border-b border-neutral-100 align-top">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-neutral-950">{agent.displayName || agent.agentName}</div>
                      {agent.serviceName ? <div className="mt-1 font-mono text-[11px] text-neutral-500">{agent.serviceName}</div> : null}
                    </td>
                    <td className="py-3 pr-3"><TypeBadge type={agent.type} /></td>
                    <td className="py-3 pr-3"><StatusBadge status={agent.status} /></td>
                    <td className="py-3 pr-3">
                      <ProviderBadge provider={agent.modelProvider} />
                      {agent.modelName ? <div className="mt-1 max-w-[160px] truncate font-mono text-[11px] text-neutral-500">{agent.modelName}</div> : null}
                    </td>
                    <td className="max-w-[220px] py-3 pr-3 text-neutral-700">{agent.currentTask || "-"}</td>
                    <td className="py-3 pr-3">
                      <AgentActivityMiniLog agent={agent} onExpand={() => openAgentDetails(agent.agentName)} />
                    </td>
                    <td className="py-3 pr-3">{runtimeLabel(agent)}</td>
                    <td className="py-3 pr-3">{agent.lastHeartbeatAt ? relativeTime(agent.lastHeartbeatAt) : "-"}</td>
                    <td className="py-3 pr-3">
                      <div>{formatNumber(agent.tokenTotal ?? 0)}</div>
                      <div className="mt-1 text-[11px] text-neutral-500">D {formatNumber(agent.tokenByProvider?.deepseek ?? 0)} / O {formatNumber(agent.tokenByProvider?.openai ?? 0)}</div>
                    </td>
                    <td className="py-3 pr-3"><AttentionBadge level={agent.attentionLevel ?? "none"} /></td>
                    <td className="py-3 pr-3">
                      <button type="button" onClick={() => openAgentDetails(agent.agentName)} className={actionButtonClass}>Open Logs</button>
                    </td>
                  </tr>
                ))}
                {filteredAgents.length === 0 ? (
                  <tr><td colSpan={11} className="py-8 text-center text-neutral-500">No agents match this view.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {isDetailDrawerOpen ? (
        <AgentActivityPanel
          agent={selectedAgent}
          selectedAgentId={selectedAgentId}
          onClose={closeAgentDetails}
        />
      ) : null}
    </main>
  );
}

function AgentActivityMiniLog({ agent, onExpand }: { agent: AgentDashboardStatus; onExpand: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const events = (agent.recentActivity ?? []).slice(-6);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length, events.at(-1)?.id]);

  return (
    <button
      type="button"
      onClick={onExpand}
      className="block w-full rounded-md border border-neutral-800 bg-neutral-950 p-2 text-left font-mono text-[11px] text-neutral-100 hover:border-neutral-500"
      title="Open full activity log"
    >
      <div ref={ref} className="h-24 overflow-y-auto">
        {events.length ? events.map((event, index) => (
          <div key={event.id} className={`${index === events.length - 1 ? "text-white" : "text-neutral-300"} ${eventTone(event.level)}`}>
            <span className="text-neutral-500">[{relativeTime(event.timestamp)}]</span> {event.activity}
          </div>
        )) : (
          <div className="text-neutral-500">{staleText(agent)}</div>
        )}
      </div>
    </button>
  );
}

function AgentActivityPanel({ agent, selectedAgentId, onClose }: { agent: AgentDashboardStatus | null; selectedAgentId: string; onClose: () => void }) {
  const events = agent?.recentActivity ?? [];
  return (
    <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}>
      <aside
        className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-neutral-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{agent?.displayName || selectedAgentId || "Agent unavailable"}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {agent ? agent.currentTask || agent.latestActivity || "No active task." : "This agent is no longer present in the latest dashboard snapshot."}
            </p>
          </div>
          <button type="button" onClick={onClose} className={actionButtonClass}>Close</button>
        </div>

        {agent ? (
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <Info label="Type" value={typeLabel(agent.type)} />
            <Info label="Status" value={agent.status} />
            <Info label="Model Provider" value={providerLabel(agent.modelProvider)} />
            <Info label="Model" value={agent.modelName || "-"} mono />
            <Info label="Runtime" value={runtimeLabel(agent)} />
            <Info label="Latest Run ID" value={agent.latestRunId || "-"} mono />
            <Info label="Last Error" value={lastError(agent) || "-"} />
            <Info label="Service" value={agent.serviceName || "-"} mono />
            <Info label="Artifacts" value={agent.artifactPath || "-"} mono />
            <Info label="Logs" value={agent.logPath || "-"} mono />
          </div>
        ) : null}

        <div className="mt-5 rounded-md border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-100">
          <div className="mb-2 text-[11px] uppercase text-neutral-500">Full Recent Activity</div>
          <div className="max-h-[520px] space-y-1 overflow-y-auto">
            {events.length ? events.map((event) => (
              <div key={event.id} className={eventTone(event.level)}>
                <span className="text-neutral-500">[{formatDate(event.timestamp)}]</span>{" "}
                <span className="text-neutral-400">{event.source}</span>{" "}
                {event.activity}
              </div>
            )) : <div className="text-neutral-500">No recent activity.</div>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function RecentRunsTable({ runs }: { runs: RecentRun[] }) {
  return (
    <Panel title="Recent Runs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
            <tr>
              <th className="py-2 pr-3">Run ID</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Started At</th>
              <th className="py-2 pr-3 text-right">Tasks</th>
              <th className="py-2 pr-3 text-right">DeepSeek Tokens</th>
              <th className="py-2 pr-3 text-right">OpenAI Tasks</th>
              <th className="py-2 pr-3 text-right">Blocked</th>
              <th className="py-2 pr-3">Memory</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.runId} className="border-b border-neutral-100 align-top">
                <td className="py-2 pr-3 font-mono text-xs">{run.runId}</td>
                <td className="py-2 pr-3"><StatusBadge status={run.status as AgentStatus} /></td>
                <td className="py-2 pr-3">{formatDate(run.startedAt)}</td>
                <td className="py-2 pr-3 text-right">{run.taskCount}</td>
                <td className="py-2 pr-3 text-right">{formatNumber(run.deepseekTokenTotal)}</td>
                <td className="py-2 pr-3 text-right">{run.openaiTaskCount}</td>
                <td className="py-2 pr-3 text-right">{run.blockedCount}</td>
                <td className="py-2 pr-3">{run.memoryProposalStatus}</td>
              </tr>
            ))}
            {runs.length === 0 ? <tr><td colSpan={8} className="py-6 text-center text-neutral-500">No recent runs found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const actionButtonClass = "rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs hover:bg-neutral-50";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, provider, alert = false, compact = false }: { label: string; value: number | string; provider?: "deepseek" | "openai"; alert?: boolean; compact?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-3 ${alert ? "border-red-200 bg-red-50" : "border-neutral-200"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase text-neutral-500">{label}</div>
        {provider ? <ProviderBadge provider={provider} /> : null}
      </div>
      <div className={`mt-1 font-semibold ${compact ? "text-sm" : "text-xl"} ${alert ? "text-red-700" : ""}`}>
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: ModelProvider }) {
  const tone = provider === "deepseek"
    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
    : provider === "openai"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : provider === "deterministic"
        ? "border-neutral-300 bg-neutral-100 text-neutral-700"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>{providerLabel(provider)}</span>;
}

function StatusBadge({ status }: { status: AgentStatus | string }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusTone(status)}`}>{status || "-"}</span>;
}

function TypeBadge({ type }: { type: AgentType }) {
  return <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700">{typeLabel(type)}</span>;
}

function AttentionBadge({ level }: { level: AttentionLevel }) {
  const tone = level === "critical"
    ? "border-red-200 bg-red-50 text-red-700"
    : level === "warning"
      ? "border-yellow-200 bg-yellow-50 text-yellow-700"
      : level === "info"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-neutral-200 bg-neutral-50 text-neutral-600";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>{level}</span>;
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className={`mt-1 break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function filterAgents(agents: AgentDashboardStatus[], tab: Tab) {
  if (tab === "Production") return agents.filter((agent) => agent.type === "production");
  if (tab === "Development") return agents.filter((agent) => agent.type === "development");
  if (tab === "Trading Bots") return agents.filter((agent) => agent.type === "trading_bot" || agent.type === "system_service");
  if (tab === "Failed / Blocked") return agents.filter((agent) => ["blocked", "failed", "stale", "paused"].includes(agent.status) || agent.attentionLevel === "critical" || agent.attentionLevel === "warning");
  return agents;
}

function staleText(agent: AgentDashboardStatus) {
  if (agent.lastHeartbeatAt) return `No recent activity in ${relativeTime(agent.lastHeartbeatAt)}`;
  return "No recent activity.";
}

function runtimeLabel(agent: AgentDashboardStatus) {
  const ms = agent.durationMs ?? (agent.startedAt ? Date.now() - new Date(agent.startedAt).getTime() : 0);
  if (!ms || !Number.isFinite(ms)) return "-";
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return value;
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 3) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function lastError(agent: AgentDashboardStatus) {
  return (agent.recentActivity ?? []).filter((event) => event.level === "error").at(-1)?.activity ?? "";
}

function eventTone(level: AgentActivityEvent["level"]) {
  if (level === "error") return "text-red-300";
  if (level === "warning") return "text-yellow-300";
  if (level === "debug") return "text-neutral-500";
  return "";
}

function statusTone(status: string) {
  if (["blocked", "failed"].includes(status)) return "border-red-200 bg-red-50 text-red-700";
  if (["paused", "stale", "unknown"].includes(status)) return "border-yellow-200 bg-yellow-50 text-yellow-700";
  if (["live", "running"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-700";
  if (["completed"].includes(status)) return "border-green-200 bg-green-50 text-green-700";
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

function typeLabel(type: AgentType) {
  if (type === "trading_bot") return "Trading Bot";
  if (type === "system_service") return "System Service";
  if (type === "production") return "Production Agent";
  return "Developer Agent";
}

function providerLabel(provider: ModelProvider) {
  if (provider === "deepseek") return "DeepSeek";
  if (provider === "openai") return "OpenAI";
  if (provider === "deterministic") return "Deterministic";
  if (provider === "local") return "Local";
  return "Unknown";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function adminLoadError(status: number, message: string | undefined) {
  if (status === 401) return "Admin login required to view agent operations.";
  if (status === 403) return "Admin access is required to view agent operations.";
  return message ?? "Failed to load agent operations.";
}

function parseAgentFleetPayload(payload: unknown): AgentFleetPayload {
  if (!isRecord(payload)) throw new Error("Agent status API returned an invalid response.");
  return {
    cards: {
      liveAgents: numberValue(payload.cards, "liveAgents"),
      runningTasks: numberValue(payload.cards, "runningTasks"),
      blockedFailed: numberValue(payload.cards, "blockedFailed"),
      productionAgents: numberValue(payload.cards, "productionAgents"),
      developerAgents: numberValue(payload.cards, "developerAgents"),
      tradingBots: numberValue(payload.cards, "tradingBots"),
      deepseekTokens: numberValue(payload.cards, "deepseekTokens"),
      openaiTokens: numberValue(payload.cards, "openaiTokens"),
      lastUpdated: stringFromRecord(payload.cards, "lastUpdated"),
    },
    agents: Array.isArray(payload.agents) ? payload.agents.map(parseAgent).filter((agent): agent is AgentDashboardStatus => Boolean(agent)) : [],
    recentRuns: Array.isArray(payload.recentRuns) ? payload.recentRuns.map(parseRecentRun).filter((run): run is RecentRun => Boolean(run)) : [],
  };
}

function parseAgent(input: unknown): AgentDashboardStatus | null {
  if (!isRecord(input) || typeof input.agentName !== "string") return null;
  return {
    agentName: input.agentName,
    displayName: stringValue(input.displayName) || input.agentName,
    type: parseAgentType(input.type),
    status: parseAgentStatus(input.status),
    modelProvider: parseModelProvider(input.modelProvider),
    modelName: stringValue(input.modelName),
    currentTask: stringValue(input.currentTask),
    latestActivity: stringValue(input.latestActivity),
    recentActivity: Array.isArray(input.recentActivity) ? input.recentActivity.map(parseActivity).filter((event): event is AgentActivityEvent => Boolean(event)) : [],
    activityUpdatedAt: stringValue(input.activityUpdatedAt),
    latestRunId: stringValue(input.latestRunId),
    startedAt: stringValue(input.startedAt),
    endedAt: stringValue(input.endedAt),
    durationMs: typeof input.durationMs === "number" ? input.durationMs : undefined,
    lastHeartbeatAt: stringValue(input.lastHeartbeatAt),
    tokenTotal: typeof input.tokenTotal === "number" ? input.tokenTotal : 0,
    tokenByProvider: isRecord(input.tokenByProvider) ? {
      deepseek: typeof input.tokenByProvider.deepseek === "number" ? input.tokenByProvider.deepseek : 0,
      openai: typeof input.tokenByProvider.openai === "number" ? input.tokenByProvider.openai : 0,
    } : {},
    blockedCount: typeof input.blockedCount === "number" ? input.blockedCount : 0,
    attentionLevel: parseAttention(input.attentionLevel),
    memoryStatus: stringValue(input.memoryStatus),
    serviceName: stringValue(input.serviceName),
    serviceActive: typeof input.serviceActive === "boolean" ? input.serviceActive : undefined,
    artifactPath: stringValue(input.artifactPath),
    logPath: stringValue(input.logPath),
    safetyMode: stringValue(input.safetyMode),
    actions: Array.isArray(input.actions) ? input.actions.filter((item): item is string => typeof item === "string") : [],
  };
}

function parseActivity(input: unknown): AgentActivityEvent | null {
  if (!isRecord(input) || typeof input.id !== "string" || typeof input.agentName !== "string" || typeof input.activity !== "string" || typeof input.timestamp !== "string") return null;
  return {
    id: input.id,
    runId: stringValue(input.runId),
    agentName: input.agentName,
    activity: input.activity,
    level: input.level === "debug" || input.level === "warning" || input.level === "error" ? input.level : "info",
    timestamp: input.timestamp,
    source: input.source === "worker" || input.source === "poly-bot" || input.source === "systemd" || input.source === "manual" ? input.source : "orchestrator",
    metadata: isRecord(input.metadata) ? input.metadata : undefined,
  };
}

function parseRecentRun(input: unknown): RecentRun | null {
  if (!isRecord(input) || typeof input.runId !== "string") return null;
  return {
    runId: input.runId,
    goal: stringValue(input.goal),
    phase: stringValue(input.phase),
    status: stringValue(input.status),
    startedAt: stringValue(input.startedAt),
    completedAt: stringValue(input.completedAt),
    taskCount: numberValue(input, "taskCount"),
    deepseekTokenTotal: numberValue(input, "deepseekTokenTotal"),
    openaiTaskCount: numberValue(input, "openaiTaskCount"),
    blockedCount: numberValue(input, "blockedCount"),
    memoryProposalStatus: stringValue(input.memoryProposalStatus),
  };
}

function parseAgentType(value: unknown): AgentType {
  return value === "production" || value === "trading_bot" || value === "system_service" ? value : "development";
}

function parseAgentStatus(value: unknown): AgentStatus {
  const allowed: AgentStatus[] = ["live", "running", "idle", "completed", "paused", "blocked", "failed", "stale", "disabled", "unknown"];
  return typeof value === "string" && allowed.includes(value as AgentStatus) ? value as AgentStatus : "unknown";
}

function parseModelProvider(value: unknown): ModelProvider {
  const allowed: ModelProvider[] = ["deepseek", "openai", "local", "deterministic", "unknown"];
  return typeof value === "string" && allowed.includes(value as ModelProvider) ? value as ModelProvider : "unknown";
}

function parseAttention(value: unknown): AttentionLevel {
  return value === "critical" || value === "warning" || value === "info" ? value : "none";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberValue(record: unknown, key: string) {
  if (!isRecord(record)) return 0;
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringFromRecord(record: unknown, key: string) {
  if (!isRecord(record)) return "";
  return stringValue(record[key]);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
