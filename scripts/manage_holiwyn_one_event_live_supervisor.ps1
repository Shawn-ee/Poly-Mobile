param(
  [ValidateSet("start", "status", "stop")]
  [string]$Action = "status",
  [int]$BackendPort = 3002,
  [int]$MaxIterations = 0,
  [int]$IntervalSeconds = 15,
  [switch]$Continuous,
  [switch]$RunProviderProof,
  [switch]$SkipDataHygiene,
  [switch]$SkipMakerSeed,
  [switch]$SkipLifecycleScheduler,
  [switch]$RunStaleGuard,
  [switch]$EnforceStaleGuard,
  [switch]$RunResultIngestion,
  [switch]$RunResultSettlement,
  [switch]$RestartBackend,
  [int]$RefreshIterations = 1,
  [int]$MaxCreditsPerProviderProof = 8,
  [int]$ProviderProofEveryIterations = 1,
  [int]$MaxProviderProofRuns = 1,
  [int]$MinRemaining = 2,
  [switch]$SkipSleep,
  [switch]$Force,
  [switch]$WaitForCompletion,
  [int]$WaitSeconds = 60,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-process-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RuntimeDir = Join-Path $RepoRoot ".runtime\one-event-live-supervisor"
$StatePath = Join-Path $RuntimeDir "supervisor-process-state.json"
$StdoutPath = Join-Path $RuntimeDir "supervisor.out.log"
$StderrPath = Join-Path $RuntimeDir "supervisor.err.log"
$SupervisorSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-summary.redacted.json"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return Join-Path $RepoRoot $Path
}

function ConvertTo-RepoPath {
  param([string]$Path)
  return $Path.Replace($RepoRoot + "\", "").Replace("\", "/")
}

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path,
    [int]$Depth = 30
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Stop-SupervisorProcessTree {
  param([Parameter(Mandatory = $true)] [int]$TargetProcessId)
  $process = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
  if (-not $process) {
    return
  }
  $output = & taskkill /PID $TargetProcessId /T /F 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop supervisor process tree for pid ${TargetProcessId}: $output"
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

function Build-SupervisorArguments {
  $parts = New-Object System.Collections.Generic.List[string]
  $parts.Add("-NoProfile") | Out-Null
  $parts.Add("-ExecutionPolicy") | Out-Null
  $parts.Add("Bypass") | Out-Null
  $parts.Add("-File") | Out-Null
  $parts.Add("scripts/run_holiwyn_one_event_live_supervisor.ps1") | Out-Null
  $parts.Add("-BackendPort") | Out-Null
  $parts.Add("$BackendPort") | Out-Null
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
  if ($RunProviderProof) {
    $parts.Add("-RunProviderProof") | Out-Null
    $parts.Add("-RefreshIterations") | Out-Null
    $parts.Add("$RefreshIterations") | Out-Null
    $parts.Add("-MaxCreditsPerProviderProof") | Out-Null
    $parts.Add("$MaxCreditsPerProviderProof") | Out-Null
    $parts.Add("-ProviderProofEveryIterations") | Out-Null
    $parts.Add("$ProviderProofEveryIterations") | Out-Null
    $parts.Add("-MaxProviderProofRuns") | Out-Null
    $parts.Add("$MaxProviderProofRuns") | Out-Null
    $parts.Add("-MinRemaining") | Out-Null
    $parts.Add("$MinRemaining") | Out-Null
  }
  if ($SkipDataHygiene) { $parts.Add("-SkipDataHygiene") | Out-Null }
  if ($SkipMakerSeed) { $parts.Add("-SkipMakerSeed") | Out-Null }
  if ($SkipLifecycleScheduler) { $parts.Add("-SkipLifecycleScheduler") | Out-Null }
  if ($RunStaleGuard) { $parts.Add("-RunStaleGuard") | Out-Null }
  if ($EnforceStaleGuard) { $parts.Add("-EnforceStaleGuard") | Out-Null }
  if ($RunResultIngestion) { $parts.Add("-RunResultIngestion") | Out-Null }
  if ($RunResultSettlement) { $parts.Add("-RunResultSettlement") | Out-Null }
  if ($RestartBackend) { $parts.Add("-RestartBackend") | Out-Null }
  if ($SkipSleep) { $parts.Add("-SkipSleep") | Out-Null }
  return $parts
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
      Stop-SupervisorProcessTree -TargetProcessId $stateBefore.pid
      Start-Sleep -Seconds 1
    }
    if ($RunProviderProof -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
      throw "RunProviderProof requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
    }
    $argumentList = Build-SupervisorArguments
    $command = "powershell " + ($argumentList -join " ")
    $process = Start-Process `
      -FilePath "powershell" `
      -ArgumentList $argumentList `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $StdoutPath `
      -RedirectStandardError $StderrPath `
      -PassThru
    $state = [ordered]@{
      pid = $process.Id
      startedAt = (Get-Date).ToUniversalTime().ToString("o")
      command = $command
      continuous = [bool]$Continuous
      maxIterations = if ($Continuous) { 0 } elseif ($MaxIterations -gt 0) { $MaxIterations } else { 2 }
      intervalSeconds = $IntervalSeconds
      runProviderProof = [bool]$RunProviderProof
      runStaleGuard = [bool]$RunStaleGuard
      enforceStaleGuard = [bool]$EnforceStaleGuard
      runResultIngestion = [bool]$RunResultIngestion
      runResultSettlement = [bool]$RunResultSettlement
      providerProofEveryIterations = if ($RunProviderProof) { $ProviderProofEveryIterations } else { 0 }
      maxProviderProofRuns = if ($RunProviderProof) { $MaxProviderProofRuns } else { 0 }
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
        if (-not $running) {
          break
        }
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
    Stop-SupervisorProcessTree -TargetProcessId $stateBefore.pid
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
$supervisorSummary = Read-JsonFile (Resolve-RepoPath $SupervisorSummaryPath)
$supervisorDigest = if ($supervisorSummary) {
  [ordered]@{
    generatedAt = $supervisorSummary.generatedAt
    pass = [bool]($supervisorSummary.pass -eq $true)
    startedAt = $supervisorSummary.startedAt
    completedAt = $supervisorSummary.completedAt
    settings = $supervisorSummary.settings
    runtimeTruth = $supervisorSummary.runtimeTruth
    failure = $supervisorSummary.failure
    gapCounts = [ordered]@{
      p0 = @($supervisorSummary.gaps.p0).Count
      p1 = @($supervisorSummary.gaps.p1).Count
      p2 = @($supervisorSummary.gaps.p2).Count
    }
  }
} else { $null }
$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-live-supervisor-process"
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
  supervisor = [ordered]@{
    summaryPath = $SupervisorSummaryPath
    digest = $supervisorDigest
  }
  runtimeTruth = [ordered]@{
    backgroundProcessManagerAvailable = $true
    localBackgroundProcessRunning = [bool]$stateAfter.running
    installedOsService = $false
    providerRefreshMode = if ($RunProviderProof) { "quota-capped live provider proof by cadence" } else { "cached provider proof verification; no provider quota spent" }
    staleGuardMode = if (-not $RunStaleGuard) { "disabled" } elseif ($EnforceStaleGuard) { "enforce stale provider pause while supervisor runs" } else { "dry-run stale monitor while supervisor runs" }
    resultIngestionMode = if ($RunResultIngestion) { "provider-shaped result ingestion replay while supervisor runs; no provider quota spent" } else { "disabled" }
    resultSettlementMode = if ($RunResultSettlement) { "trusted result scheduler dry-run while supervisor runs" } else { "disabled" }
    fakeTokenOnly = $true
  }
  gaps = [ordered]@{
    p0 = @()
    p1 = @("This is a local background process manager, not an installed OS service.", "Provider-shaped result ingestion and dry-run settlement are available, but unattended official-result polling and execution remain future work.")
    p2 = @("Multi-event process supervision remains future work.")
  }
}

if (-not $summary.pass) {
  $summary.gaps.p0 = @("Supervisor process action did not reach the expected local process state.")
}

$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
Write-JsonFile -Value $summary -Path $resolvedSummaryPath -Depth 50
$summary | ConvertTo-Json -Depth 50

if (-not $summary.pass -or $exitCode -ne 0) {
  exit 1
}
