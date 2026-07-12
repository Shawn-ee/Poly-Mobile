param(
  [int]$BackendPort = 3002,
  [string]$EventSlug = "odds-api-single-soccer-test",
  [string]$ResultPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [string]$ApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-supervisor-approval.redacted.json",
  [string]$DryRunSchedulerPath = "docs/mobile/harness/odds-api-live-runtime/one-event-supervisor-approved-settlement-dry-run.redacted.json",
  [string]$DryRunSettlementPath = "docs/mobile/harness/odds-api-live-runtime/one-event-supervisor-approved-settlement-dry-run-settlement.redacted.json",
  [string]$SummaryPath = "docs/mobile/harness/odds-api-live-runtime/one-event-supervisor-approved-settlement-wait-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SupervisorSummaryPath = "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json"

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
}

function Read-JsonFile {
  param([string]$Path)
  $resolved = Resolve-RepoPath $Path
  if (-not (Test-Path -LiteralPath $resolved)) { return $null }
  return Get-Content -Raw -LiteralPath $resolved | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path,
    [int]$Depth = 60
  )
  $resolved = Resolve-RepoPath $Path
  $directory = Split-Path -Parent $resolved
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($resolved, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $output = cmd /c $Command 2>&1
  return [ordered]@{
    label = $Label
    command = $Command
    exitCode = $LASTEXITCODE
    pass = [bool]($LASTEXITCODE -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    outputTail = @($output | Select-Object -Last 20)
  }
}

$startedAt = (Get-Date).ToUniversalTime()
$commands = New-Object System.Collections.Generic.List[object]
$p0 = New-Object System.Collections.Generic.List[object]

$dryRunCommand = "npm run mobile:one-event-result-settlement-run -- --eventSlug=$EventSlug --result=$ResultPath --output=$DryRunSchedulerPath --settlementOutput=$DryRunSettlementPath"
$dryRun = Invoke-CheckedCommand -Label "prepare-active-event-approval-dry-run" -Command $dryRunCommand
$commands.Add($dryRun) | Out-Null
$dryRunSummary = Read-JsonFile $DryRunSchedulerPath
$selectedMarket = $dryRunSummary.settlementDigest.selectedMarket
$winningOutcome = $dryRunSummary.settlementDigest.winningOutcome
$controls = $dryRunSummary.settlementDigest.controls

if (-not ($dryRun.pass -and $dryRunSummary -and $dryRunSummary.pass -eq $true)) {
  $p0.Add("active_event_settlement_dry_run_failed") | Out-Null
}
if (-not ($controls -and $controls.executeRequiresConfirm -and $controls.resultDigest)) {
  $p0.Add("active_event_dry_run_missing_confirmation_or_digest") | Out-Null
}

$approval = [ordered]@{
  approvals = @(
    [ordered]@{
      approved = $true
      eventSlug = $EventSlug
      marketId = $selectedMarket.id
      outcomeId = $winningOutcome.id
      resultDigest = $controls.resultDigest
      confirm = $controls.executeRequiresConfirm
      approvedBy = "holiwyn-local-supervisor-proof"
      approvedAt = (Get-Date).ToUniversalTime().ToString("o")
    }
  )
}
Write-JsonFile -Value $approval -Path $ApprovalPath -Depth 20

$supervisorCommand = "powershell -ExecutionPolicy Bypass -File scripts/run_holiwyn_one_event_live_supervisor.ps1 -BackendPort $BackendPort -MaxIterations 1 -IntervalSeconds 0 -SkipSleep -SkipDataHygiene -SkipMakerSeed -SkipLifecycleScheduler -RunResultSettlement -RunApprovedResultSettlement -ResultSettlementApprovalPath $ApprovalPath"
$supervisor = Invoke-CheckedCommand -Label "supervisor-approved-settlement-wait" -Command $supervisorCommand
$commands.Add($supervisor) | Out-Null
$supervisorSummary = Read-JsonFile $SupervisorSummaryPath
$latestCycle = if ($supervisorSummary -and $supervisorSummary.cycles -and $supervisorSummary.cycles.Count -gt 0) {
  $supervisorSummary.cycles[$supervisorSummary.cycles.Count - 1]
} else {
  $null
}
$settlementSummary = Read-JsonFile "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json"

if (-not ($supervisor.pass -and $supervisorSummary -and $supervisorSummary.pass -eq $true)) {
  $p0.Add("supervisor_approved_settlement_wait_command_failed") | Out-Null
}
if (-not ($latestCycle -and $latestCycle.resultSettlementAction -eq "approved_waiting_for_closed_market")) {
  $p0.Add("supervisor_did_not_wait_for_closed_market") | Out-Null
}
if (-not ($settlementSummary -and $settlementSummary.pass -eq $true -and $settlementSummary.action -eq "approved_waiting_for_closed_market")) {
  $p0.Add("settlement_summary_did_not_report_approved_wait") | Out-Null
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-supervisor-approved-settlement-wait-proof"
  pass = [bool]($p0.Count -eq 0)
  providerQuotaUsed = $false
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  eventSlug = $EventSlug
  approvalPath = $ApprovalPath
  dryRun = [ordered]@{
    command = $dryRun
    schedulerSummaryPath = $DryRunSchedulerPath
    settlementSummaryPath = $DryRunSettlementPath
    selectedMarket = $selectedMarket
    winningOutcome = $winningOutcome
    resultDigest = $controls.resultDigest
  }
  supervisor = [ordered]@{
    command = $supervisor
    summaryPath = $SupervisorSummaryPath
    resultSettlementAction = if ($latestCycle) { $latestCycle.resultSettlementAction } else { $null }
    resultSettlementPass = if ($latestCycle) { $latestCycle.resultSettlementPass } else { $false }
    runtimeSettlementMode = if ($supervisorSummary) { $supervisorSummary.runtimeTruth.resultSettlementMode } else { $null }
  }
  runtimeTruth = [ordered]@{
    approvalFileMatched = [bool]($settlementSummary -and $settlementSummary.approval.matched)
    supervisorApprovalModeWired = [bool]($latestCycle -and $latestCycle.resultSettlementAction -eq "approved_waiting_for_closed_market")
    activeMarketStillLiveSoNoExecution = [bool]($settlementSummary -and $settlementSummary.action -eq "approved_waiting_for_closed_market")
    providerQuotaUsed = $false
    activeTesterSettlementExecution = $false
  }
  commands = @($commands | ForEach-Object { $_ })
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @("Supervisor approved settlement mode is wired and waits safely, but installed unattended official-result polling remains future work.")
    p2 = @("Production approval storage and operator UI remain future work.")
  }
}

Write-JsonFile -Value $summary -Path $SummaryPath -Depth 80
$summary | ConvertTo-Json -Depth 80

if (-not $summary.pass) { exit 1 }
