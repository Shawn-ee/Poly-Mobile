param(
  [string]$EventSlug = "odds-api-single-soccer-test",
  [string]$ResultPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-summary.redacted.json",
  [string]$HeartbeatPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-heartbeat.redacted.json",
  [int]$MaxIterations = 2,
  [int]$IntervalSeconds = 15,
  [switch]$Continuous,
  [switch]$RunLiveResultIngestion,
  [int]$ResultIngestionEveryIterations = 1,
  [int]$MaxLiveResultIngestionRuns = 1,
  [int]$MaxCreditsPerResultIngestion = 2,
  [int]$MinRemaining = 2,
  [switch]$RunApprovedResultSettlement,
  [string]$ResultSettlementApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-settlement-approval.redacted.json",
  [switch]$SkipSleep
)

$ErrorActionPreference = "Stop"

if ($Continuous -and $MaxIterations -gt 0) {
  throw "Use either -Continuous or -MaxIterations, not both. Pass -MaxIterations 0 with -Continuous for an open-ended local poller."
}
if ($ResultIngestionEveryIterations -lt 1) {
  throw "ResultIngestionEveryIterations must be at least 1."
}
if ($RunLiveResultIngestion -and $MaxLiveResultIngestionRuns -lt 1) {
  throw "RunLiveResultIngestion requires MaxLiveResultIngestionRuns of at least 1. This keeps live result polling quota-capped."
}
if ($RunLiveResultIngestion -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
  throw "RunLiveResultIngestion requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
}

function ConvertTo-RepoPath {
  param([string]$Path)
  return $Path.Replace($RepoRoot + "\", "").Replace("\", "/")
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

function Write-Heartbeat {
  param(
    [Parameter(Mandatory = $true)] [object]$Cycles,
    [string]$Failure = $null,
    [bool]$LoopPass = $true
  )
  $heartbeat = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    scope = "holiwyn-one-event-result-poller-heartbeat"
    running = [bool]($Continuous -or $Cycles.Count -lt $MaxIterations)
    passSoFar = [bool]$LoopPass
    startedAt = $startedAt.ToString("o")
    completedIterations = $Cycles.Count
    latestIteration = if ($Cycles.Count -gt 0) { $Cycles[$Cycles.Count - 1] } else { $null }
    settings = [ordered]@{
      eventSlug = $EventSlug
      continuous = [bool]$Continuous
      maxIterations = $MaxIterations
      intervalSeconds = $IntervalSeconds
      runLiveResultIngestion = [bool]$RunLiveResultIngestion
      resultIngestionEveryIterations = if ($RunLiveResultIngestion) { $ResultIngestionEveryIterations } else { 0 }
      maxLiveResultIngestionRuns = if ($RunLiveResultIngestion) { $MaxLiveResultIngestionRuns } else { 0 }
      maxCreditsPerResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion } else { 0 }
      resultSettlementApprovedMode = [bool]$RunApprovedResultSettlement
      resultPath = $ResultPath
      approvalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
      defaultModeUsesQuota = $false
    }
    runtimeTruth = [ordered]@{
      resultPollingRunnerAvailable = $true
      resultPollingMode = if ($RunLiveResultIngestion) { "quota-capped live provider scores polling by cadence" } else { "provider-shaped replay polling; no provider quota spent" }
      settlementSchedulerMode = if ($RunApprovedResultSettlement) { "approved trusted-result scheduler; waits until CLOSED before execution" } else { "trusted result scheduler dry-run while poller runs" }
      activeTesterSettlementExecution = $false
      installedOsService = $false
    }
    failure = $Failure
  }
  Write-JsonFile -Value $heartbeat -Path $HeartbeatPath -Depth 80
}

$startedAt = (Get-Date).ToUniversalTime()
$cycles = New-Object System.Collections.Generic.List[object]
$iteration = 0
$liveResultIngestionRunCount = 0
$loopPass = $true
$failure = $null

try {
  do {
    $iteration += 1
    $cycleStartedAt = (Get-Date).ToUniversalTime()
    $runLiveThisCycle = [bool](
      $RunLiveResultIngestion -and
      (($iteration - 1) % $ResultIngestionEveryIterations -eq 0) -and
      ($liveResultIngestionRunCount -lt $MaxLiveResultIngestionRuns)
    )

    $ingestCommand = "npm run mobile:one-event-result-ingest -- --eventSlug=$EventSlug --trustedResultOutput=$ResultPath"
    if ($runLiveThisCycle) {
      $ingestCommand += " --live --maxCredits=$MaxCreditsPerResultIngestion --minRemaining=$MinRemaining"
      $liveResultIngestionRunCount += 1
    }
    $ingestResult = Invoke-CheckedCommand -Label "poll-$iteration-result-ingestion" -Command $ingestCommand
    $ingestSummary = Read-JsonFile "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json"

    $settlementCommand = "npm run mobile:one-event-result-settlement-run -- --eventSlug=$EventSlug --result=$ResultPath"
    if ($RunApprovedResultSettlement) {
      $settlementCommand += " --autoExecuteApproved --approval=$ResultSettlementApprovalPath --writeAuditEvent"
    }
    $settlementResult = Invoke-CheckedCommand -Label "poll-$iteration-result-settlement" -Command $settlementCommand
    $settlementSummary = Read-JsonFile "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json"

    $cycle = [ordered]@{
      iteration = $iteration
      startedAt = $cycleStartedAt.ToString("o")
      finishedAt = (Get-Date).ToUniversalTime().ToString("o")
      resultIngestion = $ingestResult
      resultIngestionPass = [bool]($ingestSummary -and $ingestSummary.pass -eq $true)
      resultIngestionMode = if ($ingestSummary) { $ingestSummary.mode } else { $null }
      liveResultIngestionRan = [bool]$runLiveThisCycle
      liveResultIngestionRunCount = $liveResultIngestionRunCount
      liveResultIngestionSkippedReason = if ($RunLiveResultIngestion -and -not $runLiveThisCycle) {
        if ($liveResultIngestionRunCount -ge $MaxLiveResultIngestionRuns) { "max_live_result_ingestion_runs_reached" } else { "cadence_skip" }
      } else { $null }
      resultSettlement = $settlementResult
      resultSettlementPass = [bool]($settlementSummary -and $settlementSummary.pass -eq $true)
      resultSettlementAction = if ($settlementSummary) { $settlementSummary.action } else { $null }
      trustedResult = if ($ingestSummary) { $ingestSummary.trustedResult } else { $null }
      settlementDigest = if ($settlementSummary) { $settlementSummary.settlementDigest } else { $null }
    }
    $cycles.Add($cycle) | Out-Null
    Write-Heartbeat -Cycles $cycles -LoopPass $true

    if (-not $ingestResult.pass -or -not ($ingestSummary -and $ingestSummary.pass -eq $true) -or -not $settlementResult.pass -or -not ($settlementSummary -and $settlementSummary.pass -eq $true)) {
      $loopPass = $false
      $failure = "Result poller cycle $iteration failed."
      Write-Heartbeat -Cycles $cycles -Failure $failure -LoopPass $false
      break
    }

    if (-not $Continuous -and $iteration -ge $MaxIterations) {
      break
    }
    if (-not $SkipSleep -and $IntervalSeconds -gt 0) {
      Start-Sleep -Seconds $IntervalSeconds
    }
  } while ($Continuous -or $iteration -lt $MaxIterations)
} catch {
  $loopPass = $false
  $failure = $_.Exception.Message
}

$p0 = New-Object System.Collections.Generic.List[object]
if (-not $loopPass) { $p0.Add($failure) | Out-Null }

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-result-poller"
  pass = [bool]$loopPass
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  eventSlug = $EventSlug
  settings = [ordered]@{
    continuous = [bool]$Continuous
    maxIterations = $MaxIterations
    completedIterations = $cycles.Count
    intervalSeconds = $IntervalSeconds
    runLiveResultIngestion = [bool]$RunLiveResultIngestion
    liveResultIngestionRunsCompleted = $liveResultIngestionRunCount
    resultIngestionEveryIterations = if ($RunLiveResultIngestion) { $ResultIngestionEveryIterations } else { 0 }
    maxLiveResultIngestionRuns = if ($RunLiveResultIngestion) { $MaxLiveResultIngestionRuns } else { 0 }
    maxCreditsPerResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion } else { 0 }
    maxCreditsAcrossResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion * $MaxLiveResultIngestionRuns } else { 0 }
    resultPath = $ResultPath
    resultSettlementApprovedMode = [bool]$RunApprovedResultSettlement
    resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
    defaultModeUsesQuota = $false
  }
  runtimeTruth = [ordered]@{
    resultPollingRunnerAvailable = $true
    resultPollingContinuousWhileRunnerRuns = [bool]($Continuous -or $cycles.Count -gt 1)
    resultPollingMode = if ($RunLiveResultIngestion) { "quota-capped live provider scores polling by cadence" } else { "provider-shaped replay polling; no provider quota spent" }
    liveResultIngestionQuotaCappedWhileRunning = [bool]($RunLiveResultIngestion -and $liveResultIngestionRunCount -gt 0)
    settlementSchedulerContinuousWhileRunnerRuns = [bool]($Continuous -or $cycles.Count -gt 1)
    settlementSchedulerMode = if ($RunApprovedResultSettlement) { "approved trusted-result scheduler; waits until CLOSED before execution" } else { "trusted result scheduler dry-run while poller runs" }
    activeTesterSettlementExecution = $false
    installedOsService = $false
    fakeTokenOnly = $true
  }
  cycles = @($cycles | ForEach-Object { $_ })
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @("Result polling runner is a local command/process path, not an installed unattended official-result service.")
    p2 = @("Multi-event result queue and operator result UI remain future work.")
  }
}

Write-JsonFile -Value $summary -Path $SummaryPath -Depth 90
$summary | ConvertTo-Json -Depth 90

if (-not $summary.pass) { exit 1 }
