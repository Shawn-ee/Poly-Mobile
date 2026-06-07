import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendFile, readdir, readFile, stat, writeFile } from "node:fs/promises";

const RUNS_ROOT = process.env.AGENT_RUNS_DIR?.trim() || "/home/shawn/projects/poly/agent-orchestrator/runs";
const ORCHESTRATOR_ROOT = path.dirname(RUNS_ROOT);
const RUNTIME_ROOT = path.join(ORCHESTRATOR_ROOT, "runtime");
const MAX_FILE_BYTES = 256 * 1024;
const execFileAsync = promisify(execFile);

const SECRET_FILE_PATTERN = /(^|\/)(\.env|SECRETS_FOR_LINUX\.env|.*secret.*|.*private.*)(\.|$|\/)/i;
const SAFE_FILE_PATTERN = /\.(md|json|jsonl|log|txt)$/i;

export type OrchestratorTask = {
  id: string;
  title: string;
  description?: string;
  agent: string;
  status: string;
  approvalStatus?: string;
  risk?: string;
  worktreePath?: string;
  codexPid?: number;
  diffStatus?: string;
  testStatus?: string;
  securityStatus?: string;
  blockedReason?: string;
  result?: string;
  updatedAt?: string;
};

export type OrchestratorRun = {
  runId: string;
  goal: string;
  phase: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  agents: Record<string, {
    name: string;
    status: string;
    currentTask?: string;
    summary?: string;
    error?: string;
    updatedAt?: string;
  }>;
  tasks: OrchestratorTask[];
  artifacts?: Record<string, string>;
  v3?: {
    maxConcurrentSubAgents?: number;
    activeSubAgents?: number;
    stopped?: boolean;
  };
};

export type RunSummary = {
  runId: string;
  goal: string;
  phase: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  activeSubAgents: number;
  maxConcurrentSubAgents: number;
  completedTasks: number;
  runningTasks: number;
  failedTasks: number;
  blockedTasks: number;
};

export type TaskRunSummary = {
  taskId: string;
  role: string;
  backend: string;
  provider: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  blockedBySafetyGates: boolean;
  outputArtifactPath: string;
};

export type AgentRunDashboardSummary = RunSummary & {
  taskCount: number;
  deepseekTaskCount: number;
  deepseekTokenTotal: number;
  openaiTaskCount: number;
  blockedCount: number;
  memoryProposalStatus: MemoryProposalStatus;
  hasArtifacts: boolean;
  taskSummaries: TaskRunSummary[];
};

export type MemoryProposalStatus = "none" | "pending" | "applied" | "rejected" | "reviewed";

export type PendingMemoryReview = {
  runId: string;
  proposalPath: string;
  approvalReportStatus: string;
  criticalFindingsCount: number;
  targetMemoryFile: string;
};

export type AgentDashboardSnapshot = {
  cards: {
    activeRuns: number;
    deepseekTasks: number;
    openaiTasks: number;
    blockedTasks: number;
    pendingMemoryReviews: number;
  };
  runs: AgentRunDashboardSummary[];
  pendingMemoryReviews: PendingMemoryReview[];
};

export type AgentActivityEvent = {
  id: string;
  runId?: string;
  agentName: string;
  activity: string;
  level: "debug" | "info" | "warning" | "error";
  timestamp: string;
  source: "orchestrator" | "worker" | "poly-bot" | "systemd" | "manual";
  metadata?: Record<string, unknown>;
};

export type AgentDashboardStatus = {
  agentName: string;
  displayName: string;
  type: "production" | "development" | "trading_bot" | "system_service";
  status: "live" | "running" | "idle" | "completed" | "paused" | "blocked" | "failed" | "stale" | "disabled" | "unknown";
  modelProvider: "deepseek" | "openai" | "local" | "deterministic" | "unknown";
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
  attentionLevel?: "none" | "info" | "warning" | "critical";
  memoryStatus?: "none" | "pending" | "auto_reviewed" | "needs_human_review" | "applied" | "rejected";
  serviceName?: string;
  serviceActive?: boolean;
  artifactPath?: string;
  logPath?: string;
  safetyMode?: string;
  actions: string[];
};

export type ServiceStateEntry = {
  name: string;
  displayName: string;
  serviceName: string;
  active: boolean;
  status: string;
  description: string;
};

export type AgentFleetSnapshot = {
  cards: {
    liveAgents: number;
    runningTasks: number;
    blockedFailed: number;
    productionAgents: number;
    developerAgents: number;
    tradingBots: number;
    deepseekTokens: number;
    openaiTokens: number;
    listedMarketCount?: number;
    freshMarketCount?: number;
    staleMarketCount?: number;
    openBotOrderCount?: number;
    activeServices?: number;
    disabledServices?: number;
    lastUpdated: string;
  };
  agents: AgentDashboardStatus[];
  recentRuns: AgentRunDashboardSummary[];
  serviceStates?: ServiceStateEntry[];
};

export type RunFile = {
  path: string;
  name: string;
  size: number;
  kind: "run" | "task";
  taskId?: string;
};

export type RunLog = {
  at: string;
  agent: string;
  level: string;
  message: string;
};

export async function listRuns(): Promise<RunSummary[]> {
  const entries = await readdir(RUNS_ROOT).catch(() => []);
  const runs = await Promise.all(
    entries
      .filter((entry) => entry.startsWith("run_"))
      .map(async (entry) => readRun(entry).catch(() => null))
  );
  return runs
    .filter((run): run is OrchestratorRun => Boolean(run))
    .map(runSummary)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export async function getAgentDashboardSnapshot(): Promise<AgentDashboardSnapshot> {
  const entries = await readdir(RUNS_ROOT).catch(() => []);
  const runs = await Promise.all(
    entries
      .filter((entry) => entry.startsWith("run_"))
      .map(async (entry) => readDashboardRun(entry).catch(() => null))
  );
  const sortedRuns = runs
    .filter((run): run is AgentRunDashboardSummary => Boolean(run))
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  const pendingMemoryReviews = await hydratePendingMemoryReviews(sortedRuns);

  return {
    cards: {
      activeRuns: sortedRuns.filter((run) => run.status === "running" || run.runningTasks > 0).length,
      deepseekTasks: sortedRuns.reduce((total, run) => total + run.deepseekTaskCount, 0),
      openaiTasks: sortedRuns.reduce((total, run) => total + run.openaiTaskCount, 0),
      blockedTasks: sortedRuns.reduce((total, run) => total + run.blockedCount, 0),
      pendingMemoryReviews: pendingMemoryReviews.length,
    },
    runs: sortedRuns,
    pendingMemoryReviews,
  };
}

export async function getAgentFleetSnapshot(): Promise<AgentFleetSnapshot> {
  const runEntries = await readdir(RUNS_ROOT).catch(() => []);
  const runs = (await Promise.all(
    runEntries
      .filter((entry) => entry.startsWith("run_"))
      .map(async (entry) => readDashboardRun(entry).catch(() => null))
  ))
    .filter((run): run is AgentRunDashboardSummary => Boolean(run))
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));

  const statusEntries = await readRuntimeStatuses();
  const fromRuns = await statusesFromRuns(runs.slice(0, 40));
  const fromServices = await serviceStatuses();
  const agents = mergeAgentStatuses([...fromRuns, ...statusEntries, ...fromServices])
    .map(inferAttentionAndStaleness)
    .sort(agentSort);

  return {
    cards: {
      liveAgents: agents.filter((agent) => ["live", "running"].includes(agent.status)).length,
      runningTasks: agents.filter((agent) => agent.status === "running").length,
      blockedFailed: agents.filter((agent) => agent.status === "blocked" || agent.status === "failed").length,
      productionAgents: agents.filter((agent) => agent.type === "production").length,
      developerAgents: agents.filter((agent) => agent.type === "development").length,
      tradingBots: agents.filter((agent) => agent.type === "trading_bot").length,
      deepseekTokens: agents.reduce((total, agent) => total + (agent.tokenByProvider?.deepseek ?? 0), 0),
      openaiTokens: agents.reduce((total, agent) => total + (agent.tokenByProvider?.openai ?? 0), 0),
      lastUpdated: new Date().toISOString(),
    },
    agents,
    recentRuns: runs.slice(0, 10),
  };
}

export async function readAgentActivityEvents(options: { agentName?: string; runId?: string; limit?: number }) {
  const limit = clampLimit(options.limit ?? 100);
  const events: AgentActivityEvent[] = [];
  if (options.runId) {
    assertSafeRunId(options.runId);
    const text = await readSafeText(path.join(RUNS_ROOT, options.runId, "activity.jsonl")).catch(() => "");
    events.push(...parseActivityJsonl(text));
  }
  if (options.agentName) {
    const fileName = safeActivityFileName(options.agentName);
    const text = await readSafeText(path.join(RUNTIME_ROOT, "agent-activity", `${fileName}.jsonl`)).catch(() => "");
    events.push(...parseActivityJsonl(text));
  }
  if (!options.runId && !options.agentName) {
    const entries = await readdir(path.join(RUNTIME_ROOT, "agent-activity")).catch(() => []);
    const all = await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".jsonl"))
        .map(async (entry) => parseActivityJsonl(await readSafeText(path.join(RUNTIME_ROOT, "agent-activity", entry)).catch(() => "")))
    );
    events.push(...all.flat());
  }
  let result = events
    .filter((event) => !options.agentName || event.agentName === options.agentName)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .slice(-limit);
  if (result.length === 0 && !options.runId) {
    const snapshot = await getAgentFleetSnapshot();
    result = snapshot.agents
      .filter((agent) => !options.agentName || agent.agentName === options.agentName)
      .flatMap((agent) => agent.recentActivity ?? [])
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      .slice(-limit);
  }
  return result;
}

export async function readRun(runId: string): Promise<OrchestratorRun> {
  assertSafeRunId(runId);
  const text = await readSafeText(path.join(RUNS_ROOT, runId, "run.json"));
  return sanitizeRun(JSON.parse(text) as OrchestratorRun);
}

export async function listRunTasks(runId: string) {
  const run = await readRun(runId);
  return {
    runId,
    tasks: run.tasks ?? [],
    counts: taskCounts(run),
  };
}

export async function readRunLogs(runId: string, limit = 100) {
  assertSafeRunId(runId);
  const fullPath = path.join(RUNS_ROOT, runId, "logs.jsonl");
  const text = await readSafeText(fullPath).catch(() => "");
  const logs = text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as RunLog;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is RunLog => Boolean(entry))
    .map((entry) => ({ ...entry, message: redactSecrets(entry.message ?? "") }));
  return { runId, logs: logs.slice(-limit) };
}

export async function listRunFiles(runId: string) {
  assertSafeRunId(runId);
  const runDir = path.join(RUNS_ROOT, runId);
  const files = await collectFiles(runDir, runDir);
  return { runId, files };
}

export async function readRunFile(runId: string, relativePath: string) {
  assertSafeRunId(runId);
  assertSafeRelativePath(relativePath);
  const fullPath = path.resolve(RUNS_ROOT, runId, relativePath);
  const runDir = path.resolve(RUNS_ROOT, runId);
  if (!fullPath.startsWith(`${runDir}${path.sep}`)) {
    throw new Error("Invalid file path.");
  }
  if (SECRET_FILE_PATTERN.test(relativePath) || !SAFE_FILE_PATTERN.test(relativePath)) {
    throw new Error("File is not available for viewing.");
  }
  const text = await readSafeText(fullPath);
  return {
    runId,
    path: relativePath,
    content: redactSecrets(text),
  };
}

export async function reviewRunMemoryProposal(runId: string, action: "review" | "apply" | "reject", confirmApply = false) {
  assertSafeRunId(runId);
  const runDir = path.join(RUNS_ROOT, runId);
  const proposalPath = path.join(runDir, "MEMORY_UPDATE_PROPOSAL.md");
  const proposalText = await readSafeText(proposalPath);
  const proposedUpdates = extractProposedUpdates(proposalText);
  const targetMemoryFile = inferTargetMemoryFile(proposedUpdates || proposalText);
  const findings = reviewMemoryText(proposedUpdates || proposalText);
  const criticalFindingsCount = findings.filter((finding) => finding.severity === "critical").length;

  if (action === "apply" && !confirmApply) {
    throw new Error("Apply Memory requires explicit confirmation.");
  }
  if (action === "apply" && criticalFindingsCount > 0) {
    throw new Error("Critical findings block memory apply.");
  }
  if (action === "apply" && (!targetMemoryFile || !hasRealProposal(proposedUpdates))) {
    throw new Error("No concrete proposal with an inferred target memory file was found.");
  }

  let appliedPath = "";
  const status =
    action === "reject"
      ? "REJECTED_BY_ADMIN"
      : action === "apply"
        ? "APPLIED"
        : criticalFindingsCount > 0
          ? "REJECTED"
          : "APPROVED_FOR_MANUAL_REVIEW";

  if (action === "apply" && targetMemoryFile) {
    const entry = [
      "",
      `## Approved memory update (${new Date().toISOString()})`,
      "",
      redactSecrets(proposedUpdates),
    ].join("\n");
    await appendFile(targetMemoryFile, `${entry.endsWith("\n") ? entry : `${entry}\n`}`, "utf8");
    appliedPath = targetMemoryFile;
  }

  const reportPath = path.join(runDir, "MEMORY_APPROVAL_REPORT.md");
  await writeFile(
    reportPath,
    renderMemoryApprovalReport({
      status,
      action,
      proposalPath,
      proposedUpdates,
      findings,
      targetMemoryFile,
      appliedPath,
    }),
    "utf8"
  );

  return {
    runId,
    status,
    reportPath: relativeRunPath(runId, reportPath),
    targetMemoryFile: targetMemoryFile ? path.relative(ORCHESTRATOR_ROOT, targetMemoryFile) : "",
    criticalFindingsCount,
    applied: Boolean(appliedPath),
  };
}

async function readRuntimeStatuses(): Promise<AgentDashboardStatus[]> {
  const dir = path.join(RUNTIME_ROOT, "agent-status");
  const entries = await readdir(dir).catch(() => []);
  const statuses = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .map(async (entry) => {
        const text = await readSafeText(path.join(dir, entry)).catch(() => "");
        return parseRuntimeStatus(text);
      })
  );
  return Promise.all(statuses.filter((status): status is AgentDashboardStatus => Boolean(status)).map(hydrateActivity));
}

async function statusesFromRuns(runs: AgentRunDashboardSummary[]): Promise<AgentDashboardStatus[]> {
  const byAgent = new Map<string, AgentDashboardStatus>();
  for (const run of runs) {
    const runData = await readRun(run.runId).catch(() => null);
    for (const [agentName, agentState] of Object.entries(runData?.agents ?? {})) {
      const current = byAgent.get(agentName);
      const route = routeForDisplayAgent(agentName);
      const recentActivity = await activityForAgent(agentName, 6, run.runId);
      const tokenByProvider = tokenTotalsForAgent(run, agentName);
      const status = normalizeAgentStatus(agentState.status, run.status, agentState.updatedAt);
      const next: AgentDashboardStatus = {
        agentName,
        displayName: agentName,
        type: typeForAgent(agentName),
        status,
        modelProvider: route.provider,
        modelName: route.model,
        currentTask: redactSecrets(agentState.currentTask ?? ""),
        latestActivity: recentActivity.at(-1)?.activity ?? redactSecrets(agentState.summary ?? agentState.error ?? ""),
        recentActivity,
        activityUpdatedAt: recentActivity.at(-1)?.timestamp ?? agentState.updatedAt,
        latestRunId: run.runId,
        startedAt: run.startedAt,
        endedAt: run.completedAt,
        durationMs: durationMs(run.startedAt, run.completedAt),
        lastHeartbeatAt: agentState.updatedAt ?? run.completedAt ?? run.startedAt,
        tokenTotal: (tokenByProvider.deepseek ?? 0) + (tokenByProvider.openai ?? 0),
        tokenByProvider,
        blockedCount: run.taskSummaries.filter((task) => task.role === agentName && task.blockedBySafetyGates).length,
        attentionLevel: attentionForStatus(status),
        memoryStatus: dashboardMemoryStatus(run.memoryProposalStatus),
        artifactPath: primaryArtifactForAgent(run, agentName),
        logPath: `runs/${run.runId}/logs.jsonl`,
        actions: ["view_activity", "view_recent_run", "view_artifacts"],
      };
      if (!current || (next.lastHeartbeatAt ?? "").localeCompare(current.lastHeartbeatAt ?? "") > 0) {
        byAgent.set(agentName, next);
      }
    }
    for (const task of run.taskSummaries) {
      if (!task.role || byAgent.has(task.role)) continue;
      const route = routeForDisplayAgent(task.role);
      const recentActivity = await activityForAgent(task.role, 6, run.runId);
      byAgent.set(task.role, {
        agentName: task.role,
        displayName: task.role,
        type: typeForAgent(task.role),
        status: task.blockedBySafetyGates ? "blocked" : run.status === "completed" ? "completed" : normalizeRunStatus(run.status),
        modelProvider: providerForTask(task, route.provider),
        modelName: task.model || route.model,
        currentTask: "",
        latestActivity: recentActivity.at(-1)?.activity ?? (task.outputArtifactPath ? "Task artifact written" : ""),
        recentActivity,
        activityUpdatedAt: recentActivity.at(-1)?.timestamp ?? run.completedAt ?? run.startedAt,
        latestRunId: run.runId,
        startedAt: run.startedAt,
        endedAt: run.completedAt,
        durationMs: durationMs(run.startedAt, run.completedAt),
        lastHeartbeatAt: run.completedAt ?? run.startedAt,
        tokenTotal: task.totalTokens ?? 0,
        tokenByProvider: {
          deepseek: isDeepSeekTask(task) ? task.totalTokens ?? 0 : 0,
          openai: isOpenAiTask(task) ? task.totalTokens ?? 0 : 0,
        },
        blockedCount: task.blockedBySafetyGates ? 1 : 0,
        attentionLevel: task.blockedBySafetyGates ? "critical" : "none",
        memoryStatus: dashboardMemoryStatus(run.memoryProposalStatus),
        artifactPath: task.outputArtifactPath,
        logPath: `runs/${run.runId}/logs.jsonl`,
        actions: ["view_activity", "view_recent_run", "view_artifacts"],
      });
    }
  }
  return [...byAgent.values()];
}

async function serviceStatuses(): Promise<AgentDashboardStatus[]> {
  const services = [
    {
      agentName: "MarketMakerBot",
      displayName: "MarketMakerBot",
      type: "trading_bot" as const,
      serviceName: "poly-market-maker.service",
      provider: "deterministic" as const,
      modelName: "local strategy",
      disabledActivity: "Market maker service is inactive",
    },
    {
      agentName: "ReferencePriceWatcherAgent",
      displayName: "ReferencePriceWatcherAgent",
      type: "production" as const,
      serviceName: "poly-reference-sync.service",
      provider: "deterministic" as const,
      modelName: "Polymarket snapshot sync",
      disabledActivity: "Reference price sync service is inactive",
    },
    {
      agentName: "ReferenceLiquidityRuntime",
      displayName: "ReferenceLiquidityRuntime",
      type: "trading_bot" as const,
      serviceName: "poly-reference-liquidity-runtime.service",
      provider: "deterministic" as const,
      modelName: "reference-priced quote manager",
      disabledActivity: "Reference liquidity runtime is inactive",
    },
    {
      agentName: "AgentSupervisor",
      displayName: "AgentSupervisor",
      type: "system_service" as const,
      serviceName: "poly-agent-supervisor.service",
      provider: "local" as const,
      modelName: "review-only loop",
      disabledActivity: "Agent supervisor service is inactive",
    },
    {
      agentName: "LiquiditySeeder",
      displayName: "LiquiditySeeder",
      type: "trading_bot" as const,
      serviceName: "poly-liquidity-seeder.service",
      provider: "deterministic" as const,
      modelName: "one-shot seeder",
      disabledActivity: "Idle after one-shot seeding check",
    },
    {
      agentName: "ReferenceArbitrageRebalancer",
      displayName: "ReferenceArbitrageRebalancer",
      type: "trading_bot" as const,
      serviceName: "poly-reference-arb.service",
      provider: "deterministic" as const,
      modelName: "reference arbitrage",
      disabledActivity: "Disabled until mapping and quote ownership are verified",
    },
  ];

  const statuses = await Promise.all(services.map(async (service) => {
    const activeState = await systemctlActive(service.serviceName);
    const journal = await journalEvents(service.agentName, service.serviceName, 5);
    const active = activeState === "active";
    const latest = journal.at(-1);
    const status = serviceStatusFromJournal(activeState, latest?.activity ?? service.disabledActivity);
    return {
      agentName: service.agentName,
      displayName: service.displayName,
      type: service.type,
      status,
      modelProvider: service.provider,
      modelName: service.modelName,
      currentTask: active ? currentTaskFromService(service.agentName, latest?.activity) : "",
      latestActivity: latest?.activity ?? service.disabledActivity,
      recentActivity: journal.length ? journal : [systemEvent(service.agentName, service.disabledActivity, active ? "info" : "warning")],
      activityUpdatedAt: latest?.timestamp,
      lastHeartbeatAt: latest?.timestamp,
      serviceName: service.serviceName,
      serviceActive: active,
      tokenTotal: 0,
      tokenByProvider: {},
      blockedCount: status === "blocked" || status === "failed" ? 1 : 0,
      attentionLevel: attentionForStatus(status),
      safetyMode: service.agentName === "ReferenceArbitrageRebalancer" ? "disabled_until_verified" : undefined,
      actions: ["view_activity", "view_service_logs"],
    } satisfies AgentDashboardStatus;
  }));

  const supervisor = statuses.find((status) => status.agentName === "AgentSupervisor");
  const supervisorEvents = supervisor?.recentActivity ?? [];
  return [
    ...statuses,
    deterministicPolyBotAgent("BotSupervisorAgent", "BotSupervisorAgent", supervisorEvents, "Running review-only monitoring loop"),
    deterministicPolyBotAgent("MarketDiscoveryAgent", "MarketDiscoveryAgent", supervisorEvents, "Reviewing reference candidates in dry-run mode"),
    deterministicPolyBotAgent("RiskReviewAgent", "RiskReviewAgent", supervisorEvents, "Reviewing risk controls without runtime changes"),
  ];
}

function deterministicPolyBotAgent(agentName: string, displayName: string, supervisorEvents: AgentActivityEvent[], fallback: string): AgentDashboardStatus {
  const matching = supervisorEvents.filter((event) => event.activity.toLowerCase().includes(agentName.replace(/Agent$/, "").toLowerCase()));
  const recentActivity = matching.length ? matching : [systemEvent(agentName, fallback, "info", "poly-bot")];
  return {
    agentName,
    displayName,
    type: "production",
    status: "live",
    modelProvider: "deterministic",
    modelName: "local review policy",
    currentTask: fallback,
    latestActivity: recentActivity.at(-1)?.activity ?? fallback,
    recentActivity,
    activityUpdatedAt: recentActivity.at(-1)?.timestamp,
    lastHeartbeatAt: recentActivity.at(-1)?.timestamp,
    serviceName: "poly-agent-supervisor.service",
    serviceActive: true,
    tokenTotal: 0,
    tokenByProvider: {},
    blockedCount: 0,
    attentionLevel: "none",
    safetyMode: "reviewOnly",
    actions: ["view_activity", "view_service_logs"],
  };
}

function parseRuntimeStatus(text: string): AgentDashboardStatus | null {
  if (!text.trim()) return null;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const agentName = stringValue(parsed.agentName);
    if (!agentName) return null;
    const route = routeForDisplayAgent(agentName);
    return {
      agentName,
      displayName: stringValue(parsed.displayName) || agentName,
      type: parseAgentType(parsed.type) ?? typeForAgent(agentName),
      status: parseDashboardStatus(parsed.status) ?? "unknown",
      modelProvider: parseModelProvider(parsed.modelProvider) ?? route.provider,
      modelName: stringValue(parsed.modelName) || route.model,
      currentTask: stringValue(parsed.currentTask),
      latestActivity: stringValue(parsed.latestActivity),
      recentActivity: [],
      activityUpdatedAt: stringValue(parsed.activityUpdatedAt),
      latestRunId: stringValue(parsed.latestRunId),
      startedAt: stringValue(parsed.startedAt),
      endedAt: stringValue(parsed.endedAt),
      durationMs: typeof parsed.durationMs === "number" ? parsed.durationMs : undefined,
      lastHeartbeatAt: stringValue(parsed.lastHeartbeatAt),
      tokenTotal: typeof parsed.tokenTotal === "number" ? parsed.tokenTotal : 0,
      tokenByProvider: isRecord(parsed.tokenByProvider) ? {
        deepseek: typeof parsed.tokenByProvider.deepseek === "number" ? parsed.tokenByProvider.deepseek : 0,
        openai: typeof parsed.tokenByProvider.openai === "number" ? parsed.tokenByProvider.openai : 0,
      } : {},
      blockedCount: typeof parsed.blockedCount === "number" ? parsed.blockedCount : 0,
      attentionLevel: parseAttention(parsed.attentionLevel) ?? "none",
      memoryStatus: parseMemoryStatus(parsed.memoryStatus),
      serviceName: stringValue(parsed.serviceName),
      serviceActive: typeof parsed.serviceActive === "boolean" ? parsed.serviceActive : undefined,
      artifactPath: stringValue(parsed.artifactPath),
      logPath: stringValue(parsed.logPath),
      safetyMode: stringValue(parsed.safetyMode),
      actions: Array.isArray(parsed.actions) ? parsed.actions.filter((item): item is string => typeof item === "string") : ["view_activity"],
    };
  } catch {
    return null;
  }
}

async function hydrateActivity(agent: AgentDashboardStatus) {
  const recentActivity = await activityForAgent(agent.agentName, 6, agent.latestRunId);
  if (!recentActivity.length) return agent;
  return {
    ...agent,
    recentActivity,
    latestActivity: recentActivity.at(-1)?.activity ?? agent.latestActivity,
    activityUpdatedAt: recentActivity.at(-1)?.timestamp ?? agent.activityUpdatedAt,
    lastHeartbeatAt: recentActivity.at(-1)?.timestamp ?? agent.lastHeartbeatAt,
  };
}

async function activityForAgent(agentName: string, limit: number, runId?: string) {
  const runtimeText = await readSafeText(path.join(RUNTIME_ROOT, "agent-activity", `${safeActivityFileName(agentName)}.jsonl`)).catch(() => "");
  const runText = runId ? await readSafeText(path.join(RUNS_ROOT, runId, "activity.jsonl")).catch(() => "") : "";
  const logsText = runId ? await readSafeText(path.join(RUNS_ROOT, runId, "logs.jsonl")).catch(() => "") : "";
  return [
    ...parseActivityJsonl(runtimeText),
    ...parseActivityJsonl(runText),
    ...parseLogJsonl(logsText),
  ]
    .filter((event) => event.agentName === agentName)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .slice(-limit);
}

function mergeAgentStatuses(statuses: AgentDashboardStatus[]) {
  const byAgent = new Map<string, AgentDashboardStatus>();
  for (const status of statuses) {
    const current = byAgent.get(status.agentName);
    if (!current) {
      byAgent.set(status.agentName, status);
      continue;
    }
    byAgent.set(status.agentName, {
      ...current,
      ...status,
      recentActivity: mergeActivity(current.recentActivity ?? [], status.recentActivity ?? []).slice(-6),
      tokenTotal: (current.tokenTotal ?? 0) + (status.tokenTotal ?? 0),
      tokenByProvider: {
        deepseek: (current.tokenByProvider?.deepseek ?? 0) + (status.tokenByProvider?.deepseek ?? 0),
        openai: (current.tokenByProvider?.openai ?? 0) + (status.tokenByProvider?.openai ?? 0),
      },
      blockedCount: Math.max(current.blockedCount ?? 0, status.blockedCount ?? 0),
      attentionLevel: maxAttention(current.attentionLevel, status.attentionLevel),
    });
  }
  return [...byAgent.values()];
}

async function systemctlActive(serviceName: string) {
  try {
    const { stdout } = await execFileAsync("systemctl", ["--user", "is-active", serviceName], { timeout: 3000 });
    return stdout.trim() || "unknown";
  } catch (error) {
    const stdout = typeof error === "object" && error && "stdout" in error ? String(error.stdout).trim() : "";
    return stdout || "inactive";
  }
}

async function journalEvents(agentName: string, serviceName: string, limit: number): Promise<AgentActivityEvent[]> {
  try {
    const { stdout } = await execFileAsync("journalctl", ["--user", "-u", serviceName, "-n", "80", "--no-pager", "-o", "short-iso"], { timeout: 5000, maxBuffer: 128 * 1024 });
    return stdout
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line, index) => {
        const parsed = parseJournalLine(line);
        return {
          id: `${serviceName}-${index}-${parsed.timestamp}`,
          agentName,
          activity: serviceActivity(agentName, parsed.message),
          level: /error|failed|blocked|exhausted|rejected/i.test(parsed.message) ? "warning" : "info",
          timestamp: parsed.timestamp,
          source: "systemd",
          metadata: { serviceName },
        } satisfies AgentActivityEvent;
      });
  } catch {
    return [];
  }
}

function parseActivityJsonl(text: string): AgentActivityEvent[] {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        return normalizeActivityEvent(parsed);
      } catch {
        return null;
      }
    })
    .filter((event): event is AgentActivityEvent => Boolean(event));
}

function parseLogJsonl(text: string): AgentActivityEvent[] {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line): AgentActivityEvent | null => {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        const at = stringValue(parsed.at);
        const agent = stringValue(parsed.agent);
        const message = stringValue(parsed.message);
        if (!at || !agent || !message) return null;
        return {
          id: `${at}-${agent}`,
          agentName: agent,
          activity: message,
          level: parsed.level === "error" ? "error" : parsed.level === "warn" ? "warning" : "info",
          timestamp: at,
          source: "orchestrator",
        } satisfies AgentActivityEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is AgentActivityEvent => Boolean(event));
}

function normalizeActivityEvent(parsed: Record<string, unknown>): AgentActivityEvent | null {
  const agentName = stringValue(parsed.agentName);
  const activity = stringValue(parsed.activity);
  const timestamp = stringValue(parsed.timestamp);
  if (!agentName || !activity || !timestamp) return null;
  return {
    id: stringValue(parsed.id) || `${timestamp}-${agentName}`,
    runId: stringValue(parsed.runId) || undefined,
    agentName,
    activity,
    level: parseActivityLevel(parsed.level),
    timestamp,
    source: parseActivitySource(parsed.source),
    metadata: isRecord(parsed.metadata) ? parsed.metadata : undefined,
  };
}

function tokenTotalsForAgent(run: AgentRunDashboardSummary, agentName: string) {
  return run.taskSummaries
    .filter((task) => task.role === agentName)
    .reduce((totals, task) => {
      if (isDeepSeekTask(task)) totals.deepseek = (totals.deepseek ?? 0) + (task.totalTokens ?? 0);
      if (isOpenAiTask(task)) totals.openai = (totals.openai ?? 0) + (task.totalTokens ?? 0);
      return totals;
    }, {} as { deepseek?: number; openai?: number });
}

function dashboardMemoryStatus(status: MemoryProposalStatus): AgentDashboardStatus["memoryStatus"] {
  if (status === "reviewed") return "auto_reviewed";
  return status;
}

function routeForDisplayAgent(agentName: string): { provider: AgentDashboardStatus["modelProvider"]; model: string } {
  if (/planner|orchestrator|security|architecture|criticalpatchreview/i.test(agentName)) {
    return { provider: "openai", model: process.env.PLANNER_MODEL?.trim() || "gpt-5.5" };
  }
  if (/bot$|liquidity|arbitrage/i.test(agentName)) {
    return { provider: "deterministic", model: "local strategy" };
  }
  if (/supervisor|riskreview|marketdiscovery/i.test(agentName) && !/Agent$/.test(agentName)) {
    return { provider: "deterministic", model: "local policy" };
  }
  return { provider: "deepseek", model: process.env.WORKER_MODEL?.trim() || "deepseek-v4-pro" };
}

function typeForAgent(agentName: string): AgentDashboardStatus["type"] {
  if (/MarketMakerBot|LiquiditySeeder|ReferenceArbitrage/i.test(agentName)) return "trading_bot";
  if (/AgentSupervisor|System/i.test(agentName)) return "system_service";
  if (/BotSupervisorAgent|RiskReviewAgent|MarketDiscoveryAgent|MarketObserverAgent|DailyReportAgent|ReferencePriceWatcherAgent|LogMonitorAgent/i.test(agentName)) return "production";
  return "development";
}

function normalizeAgentStatus(agentStatus: string, runStatus: string, heartbeat?: string): AgentDashboardStatus["status"] {
  if (agentStatus === "running") return "running";
  if (agentStatus === "done") return "completed";
  if (agentStatus === "failed") return "failed";
  if (runStatus === "failed") return "failed";
  if (heartbeat && Date.now() - new Date(heartbeat).getTime() > 10 * 60_000 && runStatus === "running") return "stale";
  return agentStatus === "pending" ? "idle" : normalizeRunStatus(runStatus);
}

function normalizeRunStatus(status: string): AgentDashboardStatus["status"] {
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "running") return "running";
  return "unknown";
}

function providerForTask(task: TaskRunSummary, fallback: AgentDashboardStatus["modelProvider"]) {
  if (task.provider === "deepseek") return "deepseek";
  if (task.provider === "openai") return "openai";
  return fallback;
}

function primaryArtifactForAgent(run: AgentRunDashboardSummary, agentName: string) {
  return run.taskSummaries.find((task) => task.role === agentName && task.outputArtifactPath)?.outputArtifactPath ?? "";
}

function inferAttentionAndStaleness(agent: AgentDashboardStatus): AgentDashboardStatus {
  if (["completed", "disabled", "idle"].includes(agent.status)) return agent;
  const heartbeat = agent.lastHeartbeatAt ? new Date(agent.lastHeartbeatAt).getTime() : 0;
  if (heartbeat > 0 && Date.now() - heartbeat > 10 * 60_000 && !agent.serviceActive) {
    return { ...agent, status: "stale", attentionLevel: maxAttention(agent.attentionLevel, "warning") };
  }
  return agent;
}

function serviceStatusFromJournal(activeState: string, latestActivity: string): AgentDashboardStatus["status"] {
  if (activeState === "active") {
    if (/daily_notional_exhausted|paused/i.test(latestActivity)) return "paused";
    return "live";
  }
  if (activeState === "inactive") return "disabled";
  if (activeState === "failed") return "failed";
  return "unknown";
}

function currentTaskFromService(agentName: string, latestActivity?: string) {
  if (/daily_notional_exhausted/i.test(latestActivity ?? "")) return "Paused by daily notional cap";
  if (agentName === "AgentSupervisor") return "Running review-only monitoring loop";
  if (agentName === "MarketMakerBot") return "Monitoring market maker loop";
  if (agentName === "ReferencePriceWatcherAgent") return "Syncing Polymarket reference prices";
  if (agentName === "ReferenceLiquidityRuntime") return "Managing launch-pool bid/ask quotes";
  return latestActivity ?? "";
}

function serviceActivity(agentName: string, message: string) {
  const text = redactSecrets(message);
  if (agentName === "MarketMakerBot" && /daily_notional_exhausted/i.test(text)) return "Paused: DAILY_NOTIONAL_LIMIT_EXCEEDED";
  if (agentName === "ReferencePriceWatcherAgent" && /refreshedCount|marketsRefreshed/i.test(text)) return "Reference snapshots refreshed";
  if (agentName === "ReferenceLiquidityRuntime" && /manage_quotes/i.test(text)) return "Managing reference-priced launch quotes";
  if (agentName === "AgentSupervisor" && /botSupervisor.*agent_finish/i.test(text)) return "BotSupervisorAgent reviewed bot configs";
  if (agentName === "AgentSupervisor" && /marketDiscovery.*agent_finish/i.test(text)) return "MarketDiscoveryAgent completed review-only discovery";
  if (agentName === "AgentSupervisor" && /riskReview.*agent_finish/i.test(text)) return "RiskReviewAgent completed dry-run safety review";
  return text.replace(/^.*?\]\s*/, "").slice(0, 220);
}

function parseJournalLine(line: string) {
  const match = /^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+\S+\s+(.*)$/.exec(line);
  return {
    timestamp: match?.[1] ? new Date(match[1]).toISOString() : new Date().toISOString(),
    message: redactSecrets(match?.[2] ?? line),
  };
}

function systemEvent(agentName: string, activity: string, level: AgentActivityEvent["level"], source: AgentActivityEvent["source"] = "systemd"): AgentActivityEvent {
  const timestamp = new Date().toISOString();
  return {
    id: `${agentName}-${timestamp}`,
    agentName,
    activity,
    level,
    timestamp,
    source,
  };
}

function mergeActivity(left: AgentActivityEvent[], right: AgentActivityEvent[]) {
  return [...left, ...right]
    .filter((event, index, events) => events.findIndex((candidate) => candidate.id === event.id) === index)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function durationMs(startedAt?: string, endedAt?: string) {
  if (!startedAt) return undefined;
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : undefined;
}

function attentionForStatus(status: AgentDashboardStatus["status"]): AgentDashboardStatus["attentionLevel"] {
  if (status === "failed" || status === "blocked") return "critical";
  if (status === "paused" || status === "stale" || status === "unknown") return "warning";
  if (status === "running" || status === "live") return "info";
  return "none";
}

function maxAttention(left?: AgentDashboardStatus["attentionLevel"], right?: AgentDashboardStatus["attentionLevel"]): AgentDashboardStatus["attentionLevel"] {
  const order = { none: 0, info: 1, warning: 2, critical: 3 };
  const l = left ?? "none";
  const r = right ?? "none";
  return order[r] > order[l] ? r : l;
}

function agentSort(left: AgentDashboardStatus, right: AgentDashboardStatus) {
  const typeOrder = { production: 0, development: 1, trading_bot: 2, system_service: 3 };
  const attentionOrder = { critical: 0, warning: 1, info: 2, none: 3 };
  return (
    attentionOrder[left.attentionLevel ?? "none"] - attentionOrder[right.attentionLevel ?? "none"] ||
    typeOrder[left.type] - typeOrder[right.type] ||
    left.displayName.localeCompare(right.displayName)
  );
}

function parseDashboardStatus(value: unknown): AgentDashboardStatus["status"] | null {
  const allowed: AgentDashboardStatus["status"][] = ["live", "running", "idle", "completed", "paused", "blocked", "failed", "stale", "disabled", "unknown"];
  return typeof value === "string" && allowed.includes(value as AgentDashboardStatus["status"]) ? value as AgentDashboardStatus["status"] : null;
}

function parseAgentType(value: unknown): AgentDashboardStatus["type"] | null {
  const allowed: AgentDashboardStatus["type"][] = ["production", "development", "trading_bot", "system_service"];
  return typeof value === "string" && allowed.includes(value as AgentDashboardStatus["type"]) ? value as AgentDashboardStatus["type"] : null;
}

function parseModelProvider(value: unknown): AgentDashboardStatus["modelProvider"] | null {
  const allowed: AgentDashboardStatus["modelProvider"][] = ["deepseek", "openai", "local", "deterministic", "unknown"];
  return typeof value === "string" && allowed.includes(value as AgentDashboardStatus["modelProvider"]) ? value as AgentDashboardStatus["modelProvider"] : null;
}

function parseAttention(value: unknown): AgentDashboardStatus["attentionLevel"] | null {
  const allowed: NonNullable<AgentDashboardStatus["attentionLevel"]>[] = ["none", "info", "warning", "critical"];
  return typeof value === "string" && allowed.includes(value as NonNullable<AgentDashboardStatus["attentionLevel"]>) ? value as AgentDashboardStatus["attentionLevel"] : null;
}

function parseMemoryStatus(value: unknown): AgentDashboardStatus["memoryStatus"] {
  const allowed: NonNullable<AgentDashboardStatus["memoryStatus"]>[] = ["none", "pending", "auto_reviewed", "needs_human_review", "applied", "rejected"];
  return typeof value === "string" && allowed.includes(value as NonNullable<AgentDashboardStatus["memoryStatus"]>) ? value as AgentDashboardStatus["memoryStatus"] : "none";
}

function parseActivityLevel(value: unknown): AgentActivityEvent["level"] {
  return value === "debug" || value === "warning" || value === "error" || value === "info" ? value : "info";
}

function parseActivitySource(value: unknown): AgentActivityEvent["source"] {
  return value === "worker" || value === "poly-bot" || value === "systemd" || value === "manual" || value === "orchestrator" ? value : "orchestrator";
}

function safeActivityFileName(value: string) {
  return value.replace(/[^A-Za-z0-9_.-]/g, "_");
}

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) return 100;
  return Math.max(1, Math.min(500, Math.floor(limit)));
}

function sanitizeRun(run: OrchestratorRun): OrchestratorRun {
  return {
    ...run,
    goal: redactSecrets(run.goal ?? ""),
    tasks: (run.tasks ?? []).map((task) => ({
      ...task,
      title: redactSecrets(task.title ?? ""),
      description: redactSecrets(task.description ?? ""),
      result: redactSecrets(task.result ?? ""),
      blockedReason: redactSecrets(task.blockedReason ?? ""),
    })),
    agents: Object.fromEntries(
      Object.entries(run.agents ?? {}).map(([key, agent]) => [
        key,
        {
          ...agent,
          currentTask: redactSecrets(agent.currentTask ?? ""),
          summary: redactSecrets(agent.summary ?? ""),
          error: redactSecrets(agent.error ?? ""),
        },
      ])
    ),
  };
}

function runSummary(run: OrchestratorRun): RunSummary {
  const counts = taskCounts(run);
  return {
    runId: run.runId,
    goal: redactSecrets(run.goal ?? ""),
    phase: run.phase,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    activeSubAgents: run.v3?.activeSubAgents ?? run.tasks.filter(isRunningTask).length,
    maxConcurrentSubAgents: run.v3?.maxConcurrentSubAgents ?? 1,
    ...counts,
  };
}

async function readDashboardRun(runId: string): Promise<AgentRunDashboardSummary> {
  const run = await readRun(runId);
  const base = runSummary(run);
  const taskSummaries = await readTaskRunSummaries(runId, run);
  const proposalStatus = await memoryProposalStatus(runId);
  const files = await listRunFiles(runId).catch(() => ({ files: [] as RunFile[] }));
  return {
    ...base,
    taskCount: taskSummaries.length || run.tasks.length,
    deepseekTaskCount: taskSummaries.filter((task) => isDeepSeekTask(task)).length,
    deepseekTokenTotal: taskSummaries
      .filter((task) => isDeepSeekTask(task))
      .reduce((total, task) => total + (task.totalTokens ?? 0), 0),
    openaiTaskCount: taskSummaries.filter((task) => isOpenAiTask(task)).length,
    blockedCount: taskSummaries.filter((task) => task.blockedBySafetyGates).length || base.blockedTasks,
    memoryProposalStatus: proposalStatus,
    hasArtifacts: files.files.length > 0,
    taskSummaries,
  };
}

async function readTaskRunSummaries(runId: string, run: OrchestratorRun): Promise<TaskRunSummary[]> {
  const jsonPath = path.join(RUNS_ROOT, runId, "AGENT_RUN_SUMMARY.json");
  const jsonText = await readSafeText(jsonPath).catch(() => "");
  const fromJson = parseSummaryJson(jsonText);
  if (fromJson.length > 0) return fromJson;

  const mdPath = path.join(RUNS_ROOT, runId, "AGENT_RUN_SUMMARY.md");
  const mdText = await readSafeText(mdPath).catch(() => "");
  const fromMarkdown = parseSummaryMarkdown(mdText);
  if (fromMarkdown.length > 0) return fromMarkdown;

  return (run.tasks ?? []).map((task) => ({
    taskId: task.id,
    role: task.agent,
    backend: "",
    provider: "",
    model: "",
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
    blockedBySafetyGates: isBlockedTask(task),
    outputArtifactPath: "",
  }));
}

function parseSummaryJson(text: string): TaskRunSummary[] {
  if (!text.trim()) return [];
  try {
    const parsed = JSON.parse(text) as { tasks?: unknown[] };
    return (parsed.tasks ?? []).map(parseSummaryTask).filter((task): task is TaskRunSummary => Boolean(task));
  } catch {
    return [];
  }
}

function parseSummaryTask(input: unknown): TaskRunSummary | null {
  if (!input || typeof input !== "object") return null;
  const task = input as Record<string, unknown>;
  const taskId = stringValue(task.taskId);
  if (!taskId) return null;
  return {
    taskId,
    role: stringValue(task.role),
    backend: stringValue(task.backend),
    provider: stringValue(task.provider),
    model: stringValue(task.model),
    promptTokens: numberValue(task.promptTokens),
    completionTokens: numberValue(task.completionTokens),
    totalTokens: numberValue(task.totalTokens),
    blockedBySafetyGates: Boolean(task.blockedBySafetyGates),
    outputArtifactPath: redactSecrets(stringValue(task.outputArtifactPath)),
  };
}

function parseSummaryMarkdown(text: string): TaskRunSummary[] {
  const rows = text
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.includes("---") && !line.includes("Task ID"));
  return rows.map((line) => {
    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim().replace(/\\\|/g, "|"));
    return {
      taskId: cells[0] ?? "",
      role: cells[1] ?? "",
      backend: cells[2] ?? "",
      provider: cells[3] ?? "",
      model: cells[4] ?? "",
      promptTokens: parseTokenCell(cells[5]),
      completionTokens: parseTokenCell(cells[6]),
      totalTokens: parseTokenCell(cells[7]),
      blockedBySafetyGates: (cells[8] ?? "").toLowerCase() === "yes",
      outputArtifactPath: redactSecrets(cells[9] ?? ""),
    };
  }).filter((task) => task.taskId);
}

async function memoryProposalStatus(runId: string): Promise<MemoryProposalStatus> {
  const proposal = await readSafeText(path.join(RUNS_ROOT, runId, "MEMORY_UPDATE_PROPOSAL.md")).catch(() => "");
  if (!proposal) return "none";
  const report = await readSafeText(path.join(RUNS_ROOT, runId, "MEMORY_APPROVAL_REPORT.md")).catch(() => "");
  const status = approvalReportStatus(report);
  if (status.includes("APPLIED")) return "applied";
  if (status.includes("REJECTED")) return "rejected";
  if (status) return "pending";
  return "pending";
}

async function hydratePendingMemoryReviews(runs: AgentRunDashboardSummary[]) {
  const reviews = await Promise.all(runs.map(async (run) => {
    if (run.memoryProposalStatus !== "pending") return null;
    const proposalPath = path.join(RUNS_ROOT, run.runId, "MEMORY_UPDATE_PROPOSAL.md");
    const reportPath = path.join(RUNS_ROOT, run.runId, "MEMORY_APPROVAL_REPORT.md");
    const proposal = await readSafeText(proposalPath).catch(() => "");
    if (!proposal) return null;
    const report = await readSafeText(reportPath).catch(() => "");
    return {
      runId: run.runId,
      proposalPath: relativeRunPath(run.runId, proposalPath),
      approvalReportStatus: approvalReportStatus(report) || "not reviewed",
      criticalFindingsCount: criticalFindingCount(report),
      targetMemoryFile: targetMemoryFileFromReport(report) || relativeOrchestratorPath(inferTargetMemoryFile(extractProposedUpdates(proposal) || proposal)),
    } satisfies PendingMemoryReview;
  }));
  return reviews.filter((review): review is PendingMemoryReview => Boolean(review));
}

function taskCounts(run: OrchestratorRun) {
  const tasks = run.tasks ?? [];
  return {
    completedTasks: tasks.filter(isCompletedTask).length,
    runningTasks: tasks.filter(isRunningTask).length,
    failedTasks: tasks.filter(isFailedTask).length,
    blockedTasks: tasks.filter(isBlockedTask).length,
  };
}

function isRunningTask(task: OrchestratorTask) {
  return task.status === "running" || task.status === "runningCodex" || task.approvalStatus === "running";
}

function isCompletedTask(task: OrchestratorTask) {
  return ["completed", "passedTests"].includes(task.status) || ["testsPassed", "securityPassed", "readyForMerge"].includes(task.approvalStatus ?? "");
}

function isFailedTask(task: OrchestratorTask) {
  return task.status === "failed" || task.status === "failedTests" || task.approvalStatus === "rejected";
}

function isBlockedTask(task: OrchestratorTask) {
  return task.status === "blocked" || task.approvalStatus === "blocked";
}

function isDeepSeekTask(task: TaskRunSummary) {
  return task.provider === "deepseek" || task.backend === "deepseek_chat";
}

function isOpenAiTask(task: TaskRunSummary) {
  return task.provider === "openai" || task.backend === "codex_cli";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? redactSecrets(value) : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseTokenCell(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function approvalReportStatus(report: string) {
  const match = /^Status:\s*(.+)$/im.exec(report);
  return match?.[1]?.trim() ?? "";
}

function criticalFindingCount(report: string) {
  if (!report.trim()) return 0;
  return report.split("\n").filter((line) => /^\|\s*critical\s*\|/i.test(line)).length;
}

function targetMemoryFileFromReport(report: string) {
  const match = /^Target memory file:\s*(.+)$/im.exec(report);
  const target = match?.[1]?.trim() ?? "";
  if (!target || target === "not inferred") return "";
  return target.startsWith(ORCHESTRATOR_ROOT) ? path.relative(ORCHESTRATOR_ROOT, target) : target;
}

function relativeRunPath(runId: string, fullPath: string) {
  return path.relative(path.join(RUNS_ROOT, runId), fullPath);
}

function relativeOrchestratorPath(fullPath: string) {
  return fullPath ? path.relative(ORCHESTRATOR_ROOT, fullPath) : "";
}

function extractProposedUpdates(text: string) {
  const match = /## Proposed Updates\s*\n([\s\S]*?)(?:\n## |\n# |$)/i.exec(text);
  return redactSecrets((match?.[1] ?? "").trim());
}

function inferTargetMemoryFile(text: string) {
  const normalized = text.toLowerCase();
  const targets = new Map([
    ["global agent memory", "global_agent_memory.md"],
    ["global memory", "global_agent_memory.md"],
    ["log worker memory", "log_worker_memory.md"],
    ["code worker memory", "code_worker_memory.md"],
    ["test worker memory", "test_worker_memory.md"],
    ["research worker memory", "research_worker_memory.md"],
    ["safety lessons", "safety_lessons.md"],
  ]);
  for (const [label, filename] of targets) {
    if (normalized.includes(label)) {
      return path.join(ORCHESTRATOR_ROOT, "memory", filename);
    }
  }
  return "";
}

function hasRealProposal(text: string) {
  const trimmed = text.trim();
  return Boolean(trimmed) && !/^no memory update proposed\.?$/i.test(trimmed);
}

type MemoryFinding = {
  severity: "info" | "warning" | "critical";
  check: string;
  result: string;
};

function reviewMemoryText(text: string): MemoryFinding[] {
  const dangerousOperationPattern = /\b(deploy|restart\s+(?:systemd|service)|prisma\s+migrate\s+deploy|migrate\s+deploy|withdraw|move\s+funds|resolve\s+market|modify\s+(?:balances|ledger|orders|fills)|write\s+(?:production\s+)?(?:database|db|balances|ledger|orders|fills))\b/i;
  const checks: Array<[RegExp, string, string]> = [
    [/(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|DATABASE_URL|COOKIE|WALLET|MNEMONIC|SEED_PHRASE|API_KEY)\s*[:=]/i, "secret assignment", "Secret-like assignment found."],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/i, "private key block", "Private key block found."],
    [/\bsk-[A-Za-z0-9_-]{12,}\b/i, "api key", "API-key-like value found."],
    [/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i, "bearer token", "Bearer-token-like value found."],
    [/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/, "jwt", "JWT-like token found."],
    [/(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)[^\s)]+/i, "database url", "Database URL found."],
    [/\b(?:0x)?[a-f0-9]{64}\b/i, "wallet or private key material", "64-character hex secret-like value found."],
    [/\b(production|prod)\b.{0,60}\b(user|account|balance|ledger|order|fill|database|db)\b/i, "production data", "Production-data wording found."],
    [dangerousOperationPattern, "unsafe operational instructions", "Unsafe operational instruction found."],
  ];
  const findings: MemoryFinding[] = checks.map(([pattern, check, result]) => ({
    severity: pattern.test(text) ? "critical" as const : "info" as const,
    check,
    result: pattern.test(text) ? result : "Not found.",
  }));
  if (!hasRealProposal(text)) {
    findings.push({ severity: "warning", check: "proposal content", result: "No concrete memory update was proposed." });
  }
  if (!inferTargetMemoryFile(text)) {
    findings.push({ severity: "warning", check: "target memory file", result: "Could not infer a target memory file." });
  }
  return findings;
}

function renderMemoryApprovalReport(input: {
  status: string;
  action: string;
  proposalPath: string;
  proposedUpdates: string;
  findings: MemoryFinding[];
  targetMemoryFile: string;
  appliedPath: string;
}) {
  return [
    "# Memory Approval Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Status: ${input.status}`,
    `Dashboard action: ${input.action}`,
    `Proposal: ${input.proposalPath}`,
    `Target memory file: ${input.targetMemoryFile || "not inferred"}`,
    `Applied path: ${input.appliedPath || "not applied"}`,
    "",
    "## Findings",
    "",
    "| Severity | Check | Result |",
    "|---|---|---|",
    ...input.findings.map((finding) => `| ${finding.severity} | ${markdownCell(finding.check)} | ${markdownCell(finding.result)} |`),
    "",
    "## Proposed Update Reviewed",
    "",
    redactSecrets(input.proposedUpdates || "No proposed update found."),
    "",
    "## Notes",
    "",
    "- The admin dashboard never applies memory updates without explicit confirmation.",
    "- Critical findings block apply.",
    "- Proposals are appended only to inferred files under agent-orchestrator/memory/.",
  ].join("\n");
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

async function collectFiles(root: string, dir: string): Promise<RunFile[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (SECRET_FILE_PATTERN.test(relativePath)) return [];
    if (entry.isDirectory()) return collectFiles(root, fullPath);
    if (!entry.isFile() || !SAFE_FILE_PATTERN.test(entry.name)) return [];
    const fileStat = await stat(fullPath);
    if (fileStat.size > MAX_FILE_BYTES) return [];
    const parts = relativePath.split(path.sep);
    const taskId = parts[0] === "tasks" ? parts[1] : undefined;
    return [{
      path: relativePath,
      name: entry.name,
      size: fileStat.size,
      kind: taskId ? "task" : "run",
      taskId,
    } satisfies RunFile];
  }));
  return nested.flat().sort((left, right) => left.path.localeCompare(right.path));
}

async function readSafeText(fullPath: string) {
  const fileStat = await stat(fullPath);
  if (!fileStat.isFile()) throw new Error("File not found.");
  if (fileStat.size > MAX_FILE_BYTES) throw new Error("File is too large to view.");
  return readFile(fullPath, "utf8");
}

function assertSafeRunId(runId: string) {
  if (!/^run_\d{8}_\d{6}$/.test(runId)) {
    throw new Error("Invalid run id.");
  }
}

function assertSafeRelativePath(relativePath: string) {
  if (!relativePath || relativePath.includes("\0") || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes("..")) {
    throw new Error("Invalid file path.");
  }
}

export function redactSecrets(input: string) {
  return input
    .replace(/((?:SECRET|TOKEN|KEY|COOKIE|PASSWORD|DATABASE_URL|PRIVATE_KEY|ENCRYPTION_KEY|API_KEY)[A-Z0-9_]*\s*[:=]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/gi, "[REDACTED_API_KEY]")
    .replace(/(postgres(?:ql)?:\/\/)[^\s)]+/gi, "$1[REDACTED]")
    .replace(/([A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,})/g, "[REDACTED_JWT]")
    .replace(/\b[A-Za-z0-9_+/-]{48,}={0,2}\b/g, "[REDACTED_TOKEN]");
}
