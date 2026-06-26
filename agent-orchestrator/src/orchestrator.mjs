#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const CONFIG_EXAMPLE = path.join(REPO_ROOT, "agent-orchestrator", "config.example.env");
const CONFIG_LOCAL = path.join(REPO_ROOT, "agent-orchestrator", "config.env");
const HIGH_RISK_KEYWORDS = [
  "prisma",
  "schema",
  "migration",
  "UserBalance",
  "LedgerEntry",
  "LedgerTransaction",
  "matching",
  "settlement",
  "order",
  "fill",
  "trade",
  "position",
  "deposit",
  "withdrawal",
  "wallet",
  "private key",
  "admin auth",
  "production",
  "deployment",
  "bot live trading",
  "market maker",
  "liquidity",
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const result = {};
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function loadConfig() {
  const defaults = parseEnvFile(CONFIG_EXAMPLE);
  const local = parseEnvFile(CONFIG_LOCAL);
  const merged = { ...defaults, ...local, ...process.env };
  return {
    githubRepo: merged.GITHUB_REPO || "Shawn-ee/POLY",
    baseBranch: merged.BASE_BRANCH || "dev",
    dryRun: String(merged.DRY_RUN ?? "true").toLowerCase() !== "false",
    allowHighRisk: String(merged.ALLOW_HIGH_RISK ?? "false").toLowerCase() === "true",
    maxTasksPerCycle: positiveInt(merged.MAX_TASKS_PER_CYCLE, 1),
    maxFailedRunsPerIssue: positiveInt(merged.MAX_FAILED_RUNS_PER_ISSUE, 2),
    maxRecursiveFixDepth: positiveInt(merged.MAX_RECURSIVE_FIX_DEPTH, 1),
    requireTaskQuality: String(merged.REQUIRE_TASK_QUALITY ?? "true").toLowerCase() !== "false",
    loopIntervalSeconds: positiveInt(merged.LOOP_INTERVAL_SECONDS, 1800),
    codexCommand: merged.CODEX_COMMAND || "codex",
    taskLabels: splitCsv(merged.TASK_LABELS || "codex-ready,agent-task"),
    ignoreLabels: splitCsv(merged.IGNORE_LABELS || "human-review,blocked,high-risk,in-progress"),
    runsDir: path.resolve(REPO_ROOT, merged.RUNS_DIR || "agent-orchestrator/runs"),
  };
}

function splitCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nowStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    shell: false,
    ...options,
  });
}

function commandText(command, args) {
  return [command, ...args].join(" ");
}

function writeText(filePath, content) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

function labelsOf(issue) {
  return (issue.labels || []).map((label) => label.name);
}

function hasAllLabels(issue, requiredLabels) {
  const labels = new Set(labelsOf(issue));
  return requiredLabels.every((label) => labels.has(label));
}

function hasIgnoredLabel(issue, ignoreLabels) {
  const labels = new Set(labelsOf(issue));
  return ignoreLabels.some((label) => labels.has(label));
}

function highRiskMatches(issue) {
  const text = `${issue.title || ""}\n${issue.body || ""}`;
  const lower = text.toLowerCase();
  return HIGH_RISK_KEYWORDS.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function recursiveFixDepth(issue) {
  const text = `${issue.title || ""}\n${issue.body || ""}`.toLowerCase();
  const title = String(issue.title || "").trim().toLowerCase();
  if (title.startsWith("fix-fix") || title.startsWith("fix: fix") || text.includes("fix-fix-")) {
    return 2;
  }
  if (title.startsWith("fix") || text.includes("recursive fix")) {
    return 1;
  }
  return 0;
}

function assessIssueQuality(issue, config) {
  if (!config.requireTaskQuality) return [];
  const problems = [];
  const title = String(issue.title || "").trim();
  const body = String(issue.body || "").trim();
  const text = `${title}\n${body}`.toLowerCase();

  if (recursiveFixDepth(issue) > config.maxRecursiveFixDepth) {
    problems.push("recursive fix depth exceeded");
  }
  if (body.length < 160) {
    problems.push("issue body is too thin for autonomous execution");
  }
  if (!/(success criteria|acceptance criteria|validation|tests?|harness)/i.test(text)) {
    problems.push("missing validation or success criteria");
  }
  if (!/(scope|allowed files|files changed|implementation|tasks?)/i.test(text)) {
    problems.push("missing implementation scope");
  }
  if (!/(rollback|revert|safety|forbidden|out of scope|do not)/i.test(text)) {
    problems.push("missing safety or rollback boundary");
  }

  return problems;
}

function failedRunCountForIssue(config, issueNumber) {
  if (!existsSync(config.runsDir)) return 0;
  let count = 0;
  for (const name of readdirSync(config.runsDir)) {
    if (!name.includes(`issue-${issueNumber}`)) continue;
    const summaryPath = path.join(config.runsDir, name, "summary.md");
    if (!existsSync(summaryPath)) continue;
    const summary = readFileSync(summaryPath, "utf8").toLowerCase();
    if (
      summary.includes("# execution failed") ||
      summary.includes("# validation failed") ||
      summary.includes("no commit, push, or pr was created")
    ) {
      count += 1;
    }
  }
  return count;
}

function slugify(value) {
  const slug = String(value || "task")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug || "task";
}

function branchForIssue(issue) {
  return `agent/${issue.number}-${slugify(issue.title)}`;
}

function buildPrompt(issue, branchName, config) {
  return `You are Codex working on the POLY repository.

Issue #${issue.number}: ${issue.title}

Issue body:

${issue.body || "(No issue body provided.)"}

Branch:
${branchName}

Target branch:
${config.baseBranch}

Required operating rules:
- Follow docs/AGENT_OPERATING_SYSTEM.md.
- Follow docs/HIGH_RISK_AREAS.md.
- Follow docs/LEDGER_AND_WALLET_RULES.md.
- Do not auto-merge.
- Do not deploy to production.
- Do not print, open, or expose secrets.
- Do not touch production secrets or wallet private keys.
- Do not push to main.
- Keep the change scoped to this issue.
- If the task touches high-risk financial, wallet, admin auth, deployment, or bot live-trading areas, stop and report unless the issue explicitly authorizes that scope.

Required validation commands before PR:

\`\`\`sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
\`\`\`

After implementation:
- Write a concise report with summary, changed files, validation results, security impact, wallet/ledger impact, and remaining risks.
- Open a pull request into ${config.baseBranch}.
`;
}

function isQuotaLimit(output, status) {
  const text = `${status ?? ""}\n${output || ""}`.toLowerCase();
  return [
    "quota exceeded",
    "rate limit",
    "usage limit",
    "token limit",
    "try again later",
  ].some((phrase) => text.includes(phrase));
}

function getIssues(config, cycleDir) {
  const ghCheck = run("gh", ["--version"]);
  if (ghCheck.error) {
    return {
      ok: false,
      quotaWait: false,
      message: "GitHub CLI `gh` is not available on PATH.",
      issues: [],
    };
  }

  const args = [
    "issue",
    "list",
    "--repo",
    config.githubRepo,
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "number,title,body,labels,url",
  ];
  for (const label of config.taskLabels) {
    args.push("--label", label);
  }
  const result = run("gh", args);
  writeText(path.join(cycleDir, "gh-issue-list.log"), `${commandText("gh", args)}\n\n${result.stdout || ""}${result.stderr || ""}`);

  if (isQuotaLimit(`${result.stdout || ""}\n${result.stderr || ""}`, result.status)) {
    return {
      ok: false,
      quotaWait: true,
      message: "GitHub CLI appears rate-limited or quota-limited.",
      issues: [],
    };
  }
  if (result.status !== 0) {
    return {
      ok: false,
      quotaWait: false,
      message: `GitHub issue lookup failed with exit code ${result.status}.`,
      issues: [],
    };
  }

  try {
    return { ok: true, quotaWait: false, message: "", issues: JSON.parse(result.stdout || "[]") };
  } catch (error) {
    return { ok: false, quotaWait: false, message: `Failed to parse gh issue JSON: ${error.message}`, issues: [] };
  }
}

function runValidation(runDir) {
  const validationLog = path.join(runDir, "validation.log");
  const script = path.join(REPO_ROOT, "scripts", "agent-validate.sh");
  const commands = existsSync(script)
    ? [["bash", ["scripts/agent-validate.sh"]]]
    : [
        ["git", ["diff", "--check"]],
        ["npx", ["prisma", "generate", "--schema=prisma/schema.prisma"]],
        ["npx", ["prisma", "validate", "--schema=prisma/schema.prisma"]],
        ["npx", ["tsc", "--noEmit", "--pretty", "false", "--incremental", "false"]],
        ["npm", ["run", "test:ci"]],
      ];

  let log = "";
  let ok = true;
  for (const [command, args] of commands) {
    log += `\n== ${commandText(command, args)} ==\n`;
    const result = run(command, args);
    log += result.stdout || "";
    log += result.stderr || "";
    if (result.status !== 0) {
      ok = false;
      log += `\nCommand failed with exit code ${result.status}.\n`;
      break;
    }
  }
  writeText(validationLog, log.trimStart());
  return { ok, validationLog };
}

function writeRunSummary(runDir, lines) {
  writeText(path.join(runDir, "summary.md"), `${lines.join("\n")}\n`);
}

function dryRunIssue(issue, config, runDir, matches) {
  const branchName = branchForIssue(issue);
  const prompt = buildPrompt(issue, branchName, config);
  writeText(path.join(runDir, "prompt.md"), prompt);
  writeRunSummary(runDir, [
    `# Orchestrator Dry Run For Issue #${issue.number}`,
    "",
    `Issue: ${issue.title}`,
    `URL: ${issue.url || ""}`,
    `Branch that would be used: \`${branchName}\``,
    `Target branch: \`${config.baseBranch}\``,
    `High-risk matches: ${matches.length ? matches.join(", ") : "none"}`,
    "",
    "No branch, issue label, Codex process, commit, push, or PR was created because DRY_RUN=true.",
  ]);
}

function realRunIssue(issue, config, runDir, matches) {
  const branchName = branchForIssue(issue);
  const prompt = buildPrompt(issue, branchName, config);
  const promptPath = path.join(runDir, "prompt.md");
  writeText(promptPath, prompt);

  if (matches.length > 0 && !config.allowHighRisk) {
    writeRunSummary(runDir, [
      `# Skipped High-Risk Issue #${issue.number}`,
      "",
      `Issue: ${issue.title}`,
      `High-risk matches: ${matches.join(", ")}`,
      "",
      "ALLOW_HIGH_RISK=false, so Codex was not run.",
    ]);
    return { stopCycle: false };
  }

  const steps = [];
  const branchResult = run("git", ["switch", "-C", branchName, `origin/${config.baseBranch}`]);
  steps.push(["git switch", branchResult.status, branchResult.stdout, branchResult.stderr]);
  if (branchResult.status !== 0) return writeFailure(runDir, steps);

  const labelResult = run("gh", ["issue", "edit", String(issue.number), "--repo", config.githubRepo, "--add-label", "in-progress"]);
  steps.push(["gh issue edit add in-progress", labelResult.status, labelResult.stdout, labelResult.stderr]);

  const codexResult = run(config.codexCommand, ["exec", "--prompt-file", promptPath]);
  steps.push(["codex", codexResult.status, codexResult.stdout, codexResult.stderr]);
  const codexOutput = `${codexResult.stdout || ""}\n${codexResult.stderr || ""}`;
  writeText(path.join(runDir, "codex.log"), codexOutput);
  if (isQuotaLimit(codexOutput, codexResult.status)) {
    writeRunSummary(runDir, [
      `# Quota Wait For Issue #${issue.number}`,
      "",
      "Codex output suggests quota, rate, usage, token, or retry-later limit.",
      "The task is not marked failed and no failed PR was opened. Retry in a future loop.",
    ]);
    return { stopCycle: true };
  }
  if (codexResult.status !== 0) return writeFailure(runDir, steps);

  const validation = runValidation(runDir);
  if (!validation.ok) {
    writeRunSummary(runDir, [
      `# Validation Failed For Issue #${issue.number}`,
      "",
      `Validation log: ${path.relative(runDir, validation.validationLog)}`,
      "No commit, push, or PR was created.",
    ]);
    return { stopCycle: false };
  }

  const reportScript = existsSync(path.join(REPO_ROOT, "scripts", "agent-report.sh"))
    ? run("bash", ["scripts/agent-report.sh"])
    : run("git", ["status", "--short", "--branch"]);
  writeText(path.join(runDir, "agent-report.log"), `${reportScript.stdout || ""}${reportScript.stderr || ""}`);

  const status = run("git", ["status", "--short"]);
  if (!status.stdout.trim()) {
    writeRunSummary(runDir, [
      `# No Changes For Issue #${issue.number}`,
      "",
      "Codex and validation completed, but no file changes were present.",
    ]);
    return { stopCycle: false };
  }

  const add = run("git", ["add", "-A"]);
  steps.push(["git add", add.status, add.stdout, add.stderr]);
  if (add.status !== 0) return writeFailure(runDir, steps);

  const commit = run("git", ["commit", "-m", `chore: agent task ${issue.number}`]);
  steps.push(["git commit", commit.status, commit.stdout, commit.stderr]);
  if (commit.status !== 0) return writeFailure(runDir, steps);

  const push = run("git", ["push", "-u", "origin", branchName]);
  steps.push(["git push", push.status, push.stdout, push.stderr]);
  if (push.status !== 0) return writeFailure(runDir, steps);

  const prBody = [
    `Automated agent PR for issue #${issue.number}.`,
    "",
    "Validation passed via orchestrator.",
    "",
    "No auto-merge or deployment was performed.",
  ].join("\n");
  const pr = run("gh", [
    "pr",
    "create",
    "--repo",
    config.githubRepo,
    "--base",
    config.baseBranch,
    "--head",
    branchName,
    "--title",
    `Agent task #${issue.number}: ${issue.title}`,
    "--body",
    prBody,
  ]);
  steps.push(["gh pr create", pr.status, pr.stdout, pr.stderr]);
  writeText(path.join(runDir, "execution.log"), renderSteps(steps));
  if (pr.status !== 0) return writeFailure(runDir, steps);

  const prUrl = pr.stdout.trim();
  run("gh", [
    "issue",
    "comment",
    String(issue.number),
    "--repo",
    config.githubRepo,
    "--body",
    `Agent orchestrator opened PR: ${prUrl}\n\nValidation passed. No auto-merge or deployment was performed.`,
  ]);

  writeRunSummary(runDir, [
    `# Completed Issue #${issue.number}`,
    "",
    `PR: ${prUrl}`,
    "Validation passed. No auto-merge or deployment was performed.",
  ]);
  return { stopCycle: false };
}

function renderSteps(steps) {
  return steps
    .map(([name, status, stdout, stderr]) => [
      `== ${name} ==`,
      `exit: ${status}`,
      stdout || "",
      stderr || "",
    ].join("\n"))
    .join("\n\n");
}

function writeFailure(runDir, steps) {
  writeText(path.join(runDir, "execution.log"), renderSteps(steps));
  writeRunSummary(runDir, [
    "# Execution Failed",
    "",
    "A command failed. See execution.log. No failed PR was opened by the orchestrator after this failure.",
  ]);
  return { stopCycle: false };
}

function cycle() {
  const config = loadConfig();
  mkdirSync(config.runsDir, { recursive: true });
  const cycleDir = path.join(config.runsDir, `${nowStamp()}-cycle`);
  mkdirSync(cycleDir, { recursive: true });
  writeText(path.join(cycleDir, "config-summary.json"), JSON.stringify({
    githubRepo: config.githubRepo,
    baseBranch: config.baseBranch,
    dryRun: config.dryRun,
    allowHighRisk: config.allowHighRisk,
    maxTasksPerCycle: config.maxTasksPerCycle,
    maxFailedRunsPerIssue: config.maxFailedRunsPerIssue,
    maxRecursiveFixDepth: config.maxRecursiveFixDepth,
    requireTaskQuality: config.requireTaskQuality,
    loopIntervalSeconds: config.loopIntervalSeconds,
    codexCommand: config.codexCommand,
    taskLabels: config.taskLabels,
    ignoreLabels: config.ignoreLabels,
    runsDir: path.relative(REPO_ROOT, config.runsDir),
  }, null, 2));

  const issuesResult = getIssues(config, cycleDir);
  if (!issuesResult.ok) {
    writeRunSummary(cycleDir, [
      issuesResult.quotaWait ? "# Quota Wait" : "# Orchestrator Cycle Skipped",
      "",
      issuesResult.message,
    ]);
    process.exitCode = issuesResult.quotaWait || config.dryRun ? 0 : 1;
    return;
  }

  const selected = [];
  const skipped = [];
  for (const issue of issuesResult.issues) {
    const matches = highRiskMatches(issue);
    if (!hasAllLabels(issue, config.taskLabels)) {
      skipped.push({ issue, reason: "missing required labels", matches });
      continue;
    }
    if (hasIgnoredLabel(issue, config.ignoreLabels)) {
      skipped.push({ issue, reason: "ignored label present", matches });
      continue;
    }
    const qualityProblems = assessIssueQuality(issue, config);
    if (qualityProblems.length > 0) {
      skipped.push({ issue, reason: `quality gate: ${qualityProblems.join("; ")}`, matches });
      continue;
    }
    const failedRuns = failedRunCountForIssue(config, issue.number);
    if (failedRuns >= config.maxFailedRunsPerIssue) {
      skipped.push({ issue, reason: `failed run cap reached: ${failedRuns}/${config.maxFailedRunsPerIssue}`, matches });
      continue;
    }
    if (matches.length > 0 && !config.allowHighRisk) {
      skipped.push({ issue, reason: `high-risk keywords: ${matches.join(", ")}`, matches });
      const runDir = path.join(config.runsDir, `${nowStamp()}-issue-${issue.number}`);
      mkdirSync(runDir, { recursive: true });
      writeRunSummary(runDir, [
        `# Skipped High-Risk Issue #${issue.number}`,
        "",
        `Issue: ${issue.title}`,
        `High-risk matches: ${matches.join(", ")}`,
        "",
        "ALLOW_HIGH_RISK=false. Codex was not run.",
      ]);
      continue;
    }
    selected.push({ issue, matches });
    if (selected.length >= config.maxTasksPerCycle) break;
  }

  writeText(path.join(cycleDir, "selection.json"), JSON.stringify({
    selected: selected.map(({ issue, matches }) => ({ number: issue.number, title: issue.title, matches })),
    skipped: skipped.map(({ issue, reason, matches }) => ({ number: issue.number, title: issue.title, reason, matches })),
  }, null, 2));

  if (selected.length === 0) {
    writeRunSummary(cycleDir, [
      "# Orchestrator Cycle Complete",
      "",
      "No eligible issues selected.",
    ]);
    return;
  }

  for (const { issue, matches } of selected) {
    const runDir = path.join(config.runsDir, `${nowStamp()}-issue-${issue.number}`);
    mkdirSync(runDir, { recursive: true });
    if (config.dryRun) {
      dryRunIssue(issue, config, runDir, matches);
      continue;
    }
    const result = realRunIssue(issue, config, runDir, matches);
    if (result.stopCycle) break;
  }

  writeRunSummary(cycleDir, [
    "# Orchestrator Cycle Complete",
    "",
    `Selected issues: ${selected.map(({ issue }) => `#${issue.number}`).join(", ")}`,
    `Dry run: ${config.dryRun}`,
  ]);
}

function status() {
  const config = loadConfig();
  const branch = run("git", ["branch", "--show-current"]).stdout.trim();
  const gitStatus = run("git", ["status", "--short"]).stdout.trim();
  const runs = existsSync(config.runsDir)
    ? readdirSync(config.runsDir)
        .map((name) => ({ name, fullPath: path.join(config.runsDir, name) }))
        .filter((entry) => statSync(entry.fullPath).isDirectory())
        .sort((a, b) => b.name.localeCompare(a.name))
        .slice(0, 10)
    : [];

  console.log("POLY agent orchestrator status");
  console.log(`repo: ${config.githubRepo}`);
  console.log(`baseBranch: ${config.baseBranch}`);
  console.log(`dryRun: ${config.dryRun}`);
  console.log(`allowHighRisk: ${config.allowHighRisk}`);
  console.log(`maxTasksPerCycle: ${config.maxTasksPerCycle}`);
  console.log(`maxFailedRunsPerIssue: ${config.maxFailedRunsPerIssue}`);
  console.log(`maxRecursiveFixDepth: ${config.maxRecursiveFixDepth}`);
  console.log(`requireTaskQuality: ${config.requireTaskQuality}`);
  console.log(`loopIntervalSeconds: ${config.loopIntervalSeconds}`);
  console.log(`runsDir: ${path.relative(REPO_ROOT, config.runsDir)}`);
  console.log(`currentBranch: ${branch}`);
  console.log(`gitStatus: ${gitStatus || "clean"}`);
  console.log("recentRuns:");
  for (const runDir of runs) {
    console.log(`- ${runDir.name}`);
  }
}

const command = process.argv[2] || "once";
if (command === "once") {
  cycle();
} else if (command === "status") {
  status();
} else if (command === "interval") {
  console.log(loadConfig().loopIntervalSeconds);
} else {
  console.error(`Unknown orchestrator command: ${command}`);
  process.exitCode = 1;
}
