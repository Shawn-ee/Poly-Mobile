param(
  [ValidateSet("start", "status", "stop")]
  [string]$Action = "status",
  [string]$EventSlug = "odds-api-single-soccer-test",
  [string]$ResultPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [int]$MaxIterations = 0,
  [int]$IntervalSeconds = 15,
  [switch]$Continuous,
  [switch]$RunLiveResultIngestion,
  [int]$ResultIngestionEveryIterations = 1,
  [int]$MaxLiveResultIngestionRuns = 1,
  [int]$MaxCreditsPerResultIngestion = 2,
  [int]$MinRemaining = 2,
  [switch]$RunApprovedResultSettlement,
  [string]$ResultSettlementApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-settlement-approval.redacted.json",
  [switch]$SkipSleep,
  [switch]$Force,
  [switch]$WaitForCompletion,
  [int]$WaitSeconds = 60,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-process-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RuntimeDir = Join-Path $RepoRoot ".runtime\one-event-result-poller"
$StatePath = Join-Path $RuntimeDir "result-poller-process-state.json"
$StdoutPath = Join-Path $RuntimeDir "result-poller.out.log"
$StderrPath = Join-Path $RuntimeDir "result-poller.err.log"
$PollerSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-summary.redacted.json"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

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
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path,
    [int]$Depth = 40
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Stop-PollerProcessTree {
  param([Parameter(Mandatory = $true)] [int]$TargetProcessId)
  $process = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
  if (-not $process) { return }
  $output = & taskkill /PID $TargetProcessId /T /F 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop result poller process tree for pid ${TargetProcessId}: $output"
  }
}

function Get-State {
  $state = Read-JsonFile $StatePath
  if (-not $state -or -not $state.pid) {
    return [ordered]@{
      known = $false
      pid = $null
      running = $false
      process = $null
      state = $state
    }
  }
  $process = Get-Process -Id ([int]$state.pid) -ErrorAction SilentlyContinue
  $processStartTime = $null
  if ($process) {
    try {
      $processStartTime = $process.StartTime.ToUniversalTime().ToString("o")
    } catch {
      $processStartTime = $null
    }
  }
  return [ordered]@{
    known = $true
    pid = [int]$state.pid
    running = [bool]$process
    process = if ($process) {
      [ordered]@{
        id = $process.Id
        processName = $process.ProcessName
        startTime = $processStartTime
        hasExited = $false
      }
    } else { $null }
    state = $state
  }
}

function Build-PollerArguments {
  $parts = New-Object System.Collections.Generic.List[string]
  $parts.Add("-NoProfile") | Out-Null
  $parts.Add("-ExecutionPolicy") | Out-Null
  $parts.Add("Bypass") | Out-Null
  $parts.Add("-File") | Out-Null
  $parts.Add("scripts/run_holiwyn_one_event_result_poller.ps1") | Out-Null
  $parts.Add("-EventSlug") | Out-Null
  $parts.Add($EventSlug) | Out-Null
  $parts.Add("-ResultPath") | Out-Null
  $parts.Add($ResultPath) | Out-Null
  $parts.Add("-IntervalSeconds") | Out-Null
  $parts.Add("$IntervalSeconds") | Out-Null
  if ($Continuous) {
    $parts.Add("-Continuous") | Out-Null
    $parts.Add("-MaxIterations") | Out-Null
    $parts.Add("0") | Out-Null
  } else {
    $iterations = if ($MaxIterations -gt 0) { $MaxIterations } else { 2 }
    $parts.Add("-MaxIterations") | Out-Null
    $parts.Add("$iterations") | Out-Null
  }
  if ($RunLiveResultIngestion) {
    $parts.Add("-RunLiveResultIngestion") | Out-Null
    $parts.Add("-ResultIngestionEveryIterations") | Out-Null
    $parts.Add("$ResultIngestionEveryIterations") | Out-Null
    $parts.Add("-MaxLiveResultIngestionRuns") | Out-Null
    $parts.Add("$MaxLiveResultIngestionRuns") | Out-Null
    $parts.Add("-MaxCreditsPerResultIngestion") | Out-Null
    $parts.Add("$MaxCreditsPerResultIngestion") | Out-Null
    $parts.Add("-MinRemaining") | Out-Null
    $parts.Add("$MinRemaining") | Out-Null
  }
  if ($RunApprovedResultSettlement) {
    $parts.Add("-RunApprovedResultSettlement") | Out-Null
    $parts.Add("-ResultSettlementApprovalPath") | Out-Null
    $parts.Add($ResultSettlementApprovalPath) | Out-Null
  }
  if ($SkipSleep) { $parts.Add("-SkipSleep") | Out-Null }
  return $parts
}

if ($Continuous -and $MaxIterations -gt 0) {
  throw "Use either -Continuous or -MaxIterations, not both. Pass -MaxIterations 0 with -Continuous for an open-ended local poller."
}
if ($ResultIngestionEveryIterations -lt 1) {
  throw "ResultIngestionEveryIterations must be at least 1."
}
if ($RunLiveResultIngestion -and $MaxLiveResultIngestionRuns -lt 1) {
  throw "RunLiveResultIngestion requires MaxLiveResultIngestionRuns of at least 1. This keeps live result polling quota-capped."
}

$startedAt = (Get-Date).ToUniversalTime()
$stateBefore = Get-State
$operation = [ordered]@{
  action = $Action
  startedAt = $startedAt.ToString("o")
  force = [bool]$Force
}
$exitCode = 0

if ($Action -eq "start") {
  if ($stateBefore.running -and -not $Force) {
    $operation.result = "already_running"
  } else {
    if ($stateBefore.running -and $Force) {
      Stop-PollerProcessTree -TargetProcessId $stateBefore.pid
      Start-Sleep -Seconds 1
    }
    if ($RunLiveResultIngestion -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
      throw "RunLiveResultIngestion requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
    }
    $argumentList = Build-PollerArguments
    $command = "powershell " + ($argumentList -join " ")
    $process = Start-Process `
      -FilePath "powershell" `
      -ArgumentList $argumentList `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -PassThru
    $state = [ordered]@{
      pid = $process.Id
      startedAt = (Get-Date).ToUniversalTime().ToString("o")
      command = $command
      eventSlug = $EventSlug
      resultPath = $ResultPath
      continuous = [bool]$Continuous
      maxIterations = if ($Continuous) { 0 } elseif ($MaxIterations -gt 0) { $MaxIterations } else { 2 }
      intervalSeconds = $IntervalSeconds
      runLiveResultIngestion = [bool]$RunLiveResultIngestion
      resultIngestionEveryIterations = if ($RunLiveResultIngestion) { $ResultIngestionEveryIterations } else { 0 }
      maxLiveResultIngestionRuns = if ($RunLiveResultIngestion) { $MaxLiveResultIngestionRuns } else { 0 }
      maxCreditsPerResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion } else { 0 }
      runApprovedResultSettlement = [bool]$RunApprovedResultSettlement
      resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
      stdout = ConvertTo-RepoPath $StdoutPath
      stderr = ConvertTo-RepoPath $StderrPath
    }
    Write-JsonFile -Value $state -Path $StatePath -Depth 20
    $operation.result = "started"
    $operation.pid = $process.Id

    if ($WaitForCompletion) {
      $deadline = (Get-Date).AddSeconds($WaitSeconds)
      while ((Get-Date) -lt $deadline) {
        $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
        if (-not $running) { break }
        Start-Sleep -Seconds 1
      }
      $stillRunning = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
      if ($stillRunning) {
        $operation.waitResult = "timeout_still_running"
        $exitCode = 1
      } else {
        $operation.waitResult = "completed"
      }
    }
  }
} elseif ($Action -eq "stop") {
  if ($stateBefore.running) {
    Stop-PollerProcessTree -TargetProcessId $stateBefore.pid
    Start-Sleep -Seconds 1
    $operation.result = "stopped"
    $operation.pid = $stateBefore.pid
  } else {
    $operation.result = "not_running"
  }
} else {
  $operation.result = if ($stateBefore.running) { "running" } else { "not_running" }
}

$stateAfter = Get-State
$pollerSummary = Read-JsonFile (Resolve-RepoPath $PollerSummaryPath)
$pollerDigest = if ($pollerSummary) {
  [ordered]@{
    generatedAt = $pollerSummary.generatedAt
    pass = [bool]($pollerSummary.pass -eq $true)
    startedAt = $pollerSummary.startedAt
    completedAt = $pollerSummary.completedAt
    eventSlug = $pollerSummary.eventSlug
    settings = $pollerSummary.settings
    runtimeTruth = $pollerSummary.runtimeTruth
    gapCounts = [ordered]@{
      p0 = @($pollerSummary.gaps.p0).Count
      p1 = @($pollerSummary.gaps.p1).Count
      p2 = @($pollerSummary.gaps.p2).Count
    }
  }
} else { $null }

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-result-poller-process"
  pass = [bool](
    ($Action -eq "start" -and ($operation.result -in @("started", "already_running")) -and ($stateAfter.running -or $operation.waitResult -eq "completed")) -or
    ($Action -eq "stop" -and -not $stateAfter.running) -or
    ($Action -eq "status")
  )
  operation = $operation
  process = [ordered]@{
    statePath = ConvertTo-RepoPath $StatePath
    stdout = ConvertTo-RepoPath $StdoutPath
    stderr = ConvertTo-RepoPath $StderrPath
    before = $stateBefore
    after = $stateAfter
  }
  poller = [ordered]@{
    summaryPath = $PollerSummaryPath
    digest = $pollerDigest
  }
  runtimeTruth = [ordered]@{
    backgroundProcessManagerAvailable = $true
    localBackgroundProcessRunning = [bool]$stateAfter.running
    installedOsService = $false
    resultPollingMode = if ($RunLiveResultIngestion) { "quota-capped live provider score polling by cadence" } else { "provider-shaped replay polling; no provider quota spent" }
    resultSettlementMode = if ($RunApprovedResultSettlement) { "approved trusted-result scheduler; waits until CLOSED before execution" } else { "trusted result scheduler dry-run while poller runs" }
    activeTesterSettlementExecution = $false
    fakeTokenOnly = $true
  }
  gaps = [ordered]@{
    p0 = @()
    p1 = @("This is a local background process manager, not an installed OS service.", "Live official-result ingestion remains opt-in and quota-capped; unconfirmed active-event settlement execution remains disabled.")
    p2 = @("Multi-event result queue supervision remains future work.")
  }
}

if (-not $summary.pass) {
  $summary.gaps.p0 = @("Result poller process action did not reach the expected local process state.")
}

$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
Write-JsonFile -Value $summary -Path $resolvedSummaryPath -Depth 60
$summary | ConvertTo-Json -Depth 60

if (-not $summary.pass -or $exitCode -ne 0) {
  exit 1
}
