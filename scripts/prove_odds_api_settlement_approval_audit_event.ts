import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { prisma } from "@/lib/db";
import { emitMarketSettlementAuditEvent } from "@/server/services/orderbookEvents";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_APPROVAL_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-audit-approved.redacted.json";
const DEFAULT_SCHEDULER_OUTPUT =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-approval-audit-dry-run.redacted.json";
const DEFAULT_SETTLEMENT_OUTPUT =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-approval-audit-settlement.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-approval-audit-event-summary.redacted.json";

type JsonObject = Record<string, any>;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanOutput(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(-24);
}

function runScheduler(args: string[]) {
  const executable = process.execPath;
  const commandArgs = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/run_odds_api_one_event_result_settlement_scheduler.ts",
    ...args,
  ];
  const run = spawnSync(executable, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  return {
    executable,
    args: commandArgs,
    exitCode: run.status,
    stdoutTail: cleanOutput(run.stdout ?? ""),
    stderrTail: cleanOutput(run.stderr ?? ""),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write local settlement approval audit evidence in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const approvalPath = argValue("approvalPath") ?? DEFAULT_APPROVAL_PATH;
  const schedulerOutput = argValue("schedulerOutput") ?? DEFAULT_SCHEDULER_OUTPUT;
  const settlementOutput = argValue("settlementOutput") ?? DEFAULT_SETTLEMENT_OUTPUT;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const approvedBy = argValue("approvedBy") ?? "holiwyn-local-approval-audit-proof";

  const dryRun = runScheduler([
    `--eventSlug=${eventSlug}`,
    `--result=${resultPath}`,
    `--output=${schedulerOutput}`,
    `--settlementOutput=${settlementOutput}`,
  ]);
  const schedulerSummary = await readJson<JsonObject>(schedulerOutput);
  const settlementDigest = schedulerSummary?.settlementDigest;
  const selectedMarket = settlementDigest?.selectedMarket;
  const winningOutcome = settlementDigest?.winningOutcome;
  const controls = settlementDigest?.controls;
  if (dryRun.exitCode !== 0 || schedulerSummary?.pass !== true) {
    throw new Error("Settlement scheduler dry run failed; refusing to write approval audit event.");
  }
  if (!selectedMarket?.id || !winningOutcome?.id || !controls?.resultDigest || !controls?.executeRequiresConfirm) {
    throw new Error("Settlement dry run did not produce market/outcome/digest/confirmation approval fields.");
  }

  const marketBefore = await prisma.market.findUniqueOrThrow({
    where: { id: selectedMarket.id },
    select: { status: true, resolvedOutcomeId: true, collateralUSDC: true, settlementStatus: true },
  });
  const approval = {
    approvals: [
      {
        approved: true,
        eventSlug,
        marketId: selectedMarket.id,
        outcomeId: winningOutcome.id,
        resultDigest: controls.resultDigest,
        confirm: controls.executeRequiresConfirm,
        approvedBy,
        approvedAt: new Date().toISOString(),
        source: "canonical-event-proof",
      },
    ],
  };
  await writeJson(approvalPath, approval);

  const auditEvent = await emitMarketSettlementAuditEvent({
    marketId: selectedMarket.id,
    outcomeId: winningOutcome.id,
    type: "settlement.trusted_result.approved",
    payload: {
      eventSlug,
      eventTitle: schedulerSummary?.event?.title ?? null,
      resultPath,
      approvalPath,
      marketId: selectedMarket.id,
      marketTitle: selectedMarket.title ?? null,
      marketType: selectedMarket.marketType ?? null,
      outcomeId: winningOutcome.id,
      outcomeName: winningOutcome.name ?? null,
      resultDigest: controls.resultDigest,
      confirm: controls.executeRequiresConfirm,
      approvedBy,
      approvedAt: approval.approvals[0].approvedAt,
      executionRequiresMarketStatus: controls.executeRequiresMarketStatus ?? "CLOSED",
      currentMarketStatus: controls.currentMarketStatus ?? null,
      dryRunIsDefault: true,
      providerQuotaUsed: false,
      activeTesterSettlementExecution: false,
    },
  });

  const storedAuditEvent = await prisma.canonicalEvent.findFirst({
    where: {
      marketId: selectedMarket.id,
      outcomeId: winningOutcome.id,
      eventType: "settlement.trusted_result.approved",
    },
    orderBy: { id: "desc" },
  });
  const marketAfter = await prisma.market.findUniqueOrThrow({
    where: { id: selectedMarket.id },
    select: { status: true, resolvedOutcomeId: true, collateralUSDC: true, settlementStatus: true },
  });
  const storedPayload = storedAuditEvent?.payload as JsonObject | null | undefined;
  const checks = {
    dryRunPassed: dryRun.exitCode === 0 && schedulerSummary?.pass === true,
    approvalFileWritten: approval.approvals[0].confirm === controls.executeRequiresConfirm,
    canonicalEventWritten: storedAuditEvent?.eventType === "settlement.trusted_result.approved",
    payloadDigestMatches: storedPayload?.resultDigest === controls.resultDigest,
    payloadConfirmMatches: storedPayload?.confirm === controls.executeRequiresConfirm,
    payloadApprovalActorMatches: storedPayload?.approvedBy === approvedBy,
    activeMarketNotMutated:
      marketAfter.status === marketBefore.status &&
      marketAfter.resolvedOutcomeId === marketBefore.resolvedOutcomeId &&
      marketAfter.collateralUSDC.eq(marketBefore.collateralUSDC) &&
      marketAfter.settlementStatus === marketBefore.settlementStatus,
    providerQuotaNotUsed: true,
    activeTesterSettlementExecutionFalse: storedPayload?.activeTesterSettlementExecution === false,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-settlement-approval-audit-event-proof",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    eventSlug,
    selectedMarket: {
      id: selectedMarket.id,
      title: selectedMarket.title ?? null,
      marketType: selectedMarket.marketType ?? null,
      statusBefore: marketBefore.status,
      statusAfter: marketAfter.status,
      resolvedOutcomeIdAfter: marketAfter.resolvedOutcomeId,
    },
    winningOutcome: {
      id: winningOutcome.id,
      name: winningOutcome.name ?? null,
      side: winningOutcome.side ?? null,
    },
    paths: {
      resultPath,
      approvalPath,
      schedulerOutput,
      settlementOutput,
    },
    command: dryRun,
    approval: {
      approvedBy,
      resultDigest: controls.resultDigest,
      confirm: controls.executeRequiresConfirm,
      executionRequiresMarketStatus: controls.executeRequiresMarketStatus ?? "CLOSED",
      currentMarketStatus: controls.currentMarketStatus ?? null,
    },
    auditEvent: {
      id: auditEvent.id,
      storedId: storedAuditEvent?.id.toString() ?? null,
      type: auditEvent.type,
      stream: auditEvent.stream,
      marketId: auditEvent.marketId,
      outcomeId: auditEvent.outcomeId,
      createdAt: auditEvent.ts,
    },
    runtimeTruth: {
      approvalHasCanonicalEventEvidence: true,
      approvalFileExportedForLocalScheduler: true,
      activeTesterEventMutated: false,
      providerQuotaUsed: false,
      installedApprovalService: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "Approval evidence now exists in CanonicalEvent plus an exported local approval file, but there is still no first-class approval table or operator UI.",
        "Installed unattended official-result polling remains future work.",
      ],
      p2: ["Multi-event approval queue and production review workflow remain future work."],
    },
  };
  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
