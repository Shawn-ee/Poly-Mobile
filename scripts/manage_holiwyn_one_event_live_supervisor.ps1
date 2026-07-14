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
  [switch]$RunLiveResultIngestion,
  [switch]$RunResultSettlement,
  [switch]$RunApprovedResultSettlement,
  [string]$ResultSettlementPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [string]$ResultSettlementApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-audit-approved.redacted.json",
  [switch]$RestartBackend,
  [int]$RefreshIterations = 1,
  [int]$MaxCreditsPerProviderProof = 8,
  [int]$ProviderProofEveryIterations = 1,
  [int]$MaxProviderProofRuns = 1,
  [int]$ResultIngestionEveryIterations = 1,
  [int]$MaxLiveResultIngestionRuns = 1,
  [int]$MaxCreditsPerResultIngestion = 2,
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
$StopRequestPath = Join-Path $RuntimeDir "stop-request.json"
$SupervisorSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-summary.redacted.json"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Load-LocalEnvKeys {
  param([string[]]$Keys = @("DATABASE_URL"))
  $candidates = New-Object System.Collections.Generic.List[string]
  if (-not [string]::IsNullOrWhiteSpace($env:DOTENV_CONFIG_PATH)) {
    $candidates.Add($env:DOTENV_CONFIG_PATH) | Out-Null
  }
  $current = $RepoRoot
  for ($depth = 0; $depth -lt 8; $depth += 1) {
    $candidates.Add((Join-Path $current ".env")) | Out-Null
    $candidates.Add((Join-Path $current "Poly\.env")) | Out-Null
    $parent = Split-Path -Parent $current
    if ($parent -eq $current -or [string]::IsNullOrWhiteSpace($parent)) { break }
    $current = $parent
  }
  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $candidate)) { continue }
    foreach ($line in (Get-Content -LiteralPath $candidate)) {
      $trimmed = $line.Trim()
      if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) { continue }
      $separator = $trimmed.IndexOf("=")
      if ($separator -le 0) { continue }
      $key = $trimmed.Substring(0, $separator).Trim()
      if ($Keys -notcontains $key -or -not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key, "Process"))) { continue }
      $value = $trimmed.Substring($separator + 1).Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
    $missing = @($Keys | Where-Object { [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_, "Process")) })
    if ($missing.Count -eq 0) { return }
  }
}

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
  for ($attempt = 1; $attempt -le 5; $attempt += 1) {
    try {
      [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
      return
    } catch {
      if ($attempt -eq 5) { throw }
      Start-Sleep -Milliseconds (150 * $attempt)
    }
  }
}

function Stop-SupervisorProcessTree {
  param([Parameter(Mandatory = $true)] [int]$TargetProcessId)
  $process = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
  if (-not $process) {
    return
  }
  $output = & taskkill /PID $TargetProcessId /T /F 2>&1
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 1
    $stillRunning = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
    if ($stillRunning) {
      throw "Failed to stop supervisor process tree for pid ${TargetProcessId}: $output"
    }
  }
}

function Request-GracefulSupervisorStop {
  param(
    [Parameter(Mandatory = $true)] [int]$TargetProcessId,
    [int]$TimeoutSeconds = 25
  )
  $request = [ordered]@{
    requestedAt = (Get-Date).ToUniversalTime().ToString("o")
    pid = $TargetProcessId
    reason = "operator_stop"
  }
  Write-JsonFile -Value $request -Path $StopRequestPath -Depth 10
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $process = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
    if (-not $process) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
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
  $parts.Add((Join-Path $RepoRoot "scripts\run_holiwyn_one_event_live_supervisor.ps1")) | Out-Null
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
  if ($RunLiveResultIngestion) {
    $parts.Add("-RunLiveResultIngestion") | Out-Null
    $parts.Add("-ResultIngestionEveryIterations") | Out-Null
    $parts.Add("$ResultIngestionEveryIterations") | Out-Null
    $parts.Add("-MaxLiveResultIngestionRuns") | Out-Null
    $parts.Add("$MaxLiveResultIngestionRuns") | Out-Null
    $parts.Add("-MaxCreditsPerResultIngestion") | Out-Null
    $parts.Add("$MaxCreditsPerResultIngestion") | Out-Null
  }
  if ($RunResultSettlement) { $parts.Add("-RunResultSettlement") | Out-Null }
  if ($RunApprovedResultSettlement) {
    $parts.Add("-RunApprovedResultSettlement") | Out-Null
    $parts.Add("-ResultSettlementPath") | Out-Null
    $parts.Add($ResultSettlementPath) | Out-Null
    $parts.Add("-ResultSettlementApprovalPath") | Out-Null
    $parts.Add($ResultSettlementApprovalPath) | Out-Null
  }
  if ($RestartBackend) { $parts.Add("-RestartBackend") | Out-Null }
  if ($SkipSleep) { $parts.Add("-SkipSleep") | Out-Null }
  $parts.Add("-StopRequestPath") | Out-Null
  $parts.Add($StopRequestPath) | Out-Null
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
  Load-LocalEnvKeys -Keys @("DATABASE_URL")
  if ($RunLiveResultIngestion -and -not $RunResultIngestion) {
    throw "RunLiveResultIngestion requires RunResultIngestion."
  }
  if ($RunApprovedResultSettlement -and -not $RunResultSettlement) {
    throw "RunApprovedResultSettlement requires RunResultSettlement."
  }
  if ($RunLiveResultIngestion -and $MaxLiveResultIngestionRuns -lt 1) {
    throw "RunLiveResultIngestion requires MaxLiveResultIngestionRuns of at least 1. This keeps live result ingestion quota-capped."
  }
  if ($ResultIngestionEveryIterations -lt 1) {
    throw "ResultIngestionEveryIterations must be at least 1."
  }
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
    if ($RunLiveResultIngestion -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
      throw "RunLiveResultIngestion requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
    }
    $argumentList = Build-SupervisorArguments
    $command = "powershell " + ($argumentList -join " ")
    $process = Start-Process `
      -FilePath "powershell" `
      -ArgumentList $argumentList `
      -WorkingDirectory $RepoRoot `
      -RedirectStandardOutput $StdoutPath `
      -RedirectStandardError $StderrPath `
      -WindowStyle Hidden `
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
      runLiveResultIngestion = [bool]$RunLiveResultIngestion
      resultIngestionEveryIterations = if ($RunLiveResultIngestion) { $ResultIngestionEveryIterations } else { 0 }
      maxLiveResultIngestionRuns = if ($RunLiveResultIngestion) { $MaxLiveResultIngestionRuns } else { 0 }
      maxCreditsPerResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion } else { 0 }
      runResultSettlement = [bool]$RunResultSettlement
      runApprovedResultSettlement = [bool]$RunApprovedResultSettlement
      resultSettlementPath = if ($RunApprovedResultSettlement) { $ResultSettlementPath } else { $null }
      resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
      providerProofEveryIterations = if ($RunProviderProof) { $ProviderProofEveryIterations } else { 0 }
      maxProviderProofRuns = if ($RunProviderProof) { $MaxProviderProofRuns } else { 0 }
      refreshIterations = if ($RunProviderProof) { $RefreshIterations } else { 0 }
      maxCreditsPerProviderProof = if ($RunProviderProof) { $MaxCreditsPerProviderProof } else { 0 }
      minRemaining = if ($RunProviderProof) { $MinRemaining } else { 0 }
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
    $gracefulStop = Request-GracefulSupervisorStop -TargetProcessId $stateBefore.pid
    if (-not $gracefulStop) {
      Stop-SupervisorProcessTree -TargetProcessId $stateBefore.pid
      Start-Sleep -Seconds 1
      $operation.result = "force_stopped"
    } else {
      $operation.result = "stopped"
    }
    $operation.graceful = [bool]$gracefulStop
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
    resultIngestionMode = if (-not $RunResultIngestion) { "disabled" } elseif ($RunLiveResultIngestion) { "quota-capped live result ingestion by cadence; replay disabled for result ingestion cycles" } else { "provider-shaped result ingestion replay while supervisor runs; no provider quota spent" }
    resultSettlementMode = if ($RunApprovedResultSettlement) { "approved trusted-result scheduler; waits until CLOSED before execution" } elseif ($RunResultSettlement) { "trusted result scheduler dry-run while supervisor runs" } else { "disabled" }
    fakeTokenOnly = $true
  }
  gaps = [ordered]@{
    p0 = @()
    p1 = @("This is a local background process manager, not an installed OS service.", "Provider-shaped replay ingestion and quota-capped live result ingestion are available, but installed unattended official-result polling and unconfirmed execution remain future work.")
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
