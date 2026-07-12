param(
  [int]$BackendPort = 3002,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-summary.redacted.json",
  [string]$HeartbeatPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-heartbeat.redacted.json",
  [int]$MaxIterations = 2,
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
  [switch]$SkipSleep
)

$ErrorActionPreference = "Stop"

if ($Continuous -and $MaxIterations -gt 0) {
  throw "Use either -Continuous or -MaxIterations, not both. Pass -MaxIterations 0 with -Continuous for an open-ended local loop."
}
if ($ProviderProofEveryIterations -lt 1) {
  throw "ProviderProofEveryIterations must be at least 1."
}
if ($RunProviderProof -and $MaxProviderProofRuns -lt 1) {
  throw "RunProviderProof requires MaxProviderProofRuns of at least 1. This keeps live provider refresh quota-capped."
}
if ($ResultIngestionEveryIterations -lt 1) {
  throw "ResultIngestionEveryIterations must be at least 1."
}
if ($RunLiveResultIngestion -and -not $RunResultIngestion) {
  throw "RunLiveResultIngestion requires RunResultIngestion."
}
if ($RunLiveResultIngestion -and $MaxLiveResultIngestionRuns -lt 1) {
  throw "RunLiveResultIngestion requires MaxLiveResultIngestionRuns of at least 1. This keeps live result ingestion quota-capped."
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BackendBaseUrl = "http://127.0.0.1:$BackendPort"

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
    [int]$Depth = 40
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Write-Heartbeat {
  param(
    [Parameter(Mandatory = $true)] [object]$Cycles,
    [string]$Failure = $null,
    [bool]$LoopPass = $true
  )
  $heartbeat = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    scope = "holiwyn-one-event-live-supervisor-heartbeat"
    running = [bool]($Continuous -or $cycles.Count -lt $MaxIterations)
    passSoFar = [bool]$LoopPass
    startedAt = $startedAt.ToString("o")
    completedIterations = $Cycles.Count
    latestIteration = if ($Cycles.Count -gt 0) { $Cycles[$Cycles.Count - 1] } else { $null }
    settings = [ordered]@{
      continuous = [bool]$Continuous
      maxIterations = $MaxIterations
      intervalSeconds = $IntervalSeconds
      runProviderProof = [bool]$RunProviderProof
      providerProofRunsCompleted = $providerProofRunCount
      providerProofEveryIterations = if ($RunProviderProof) { $ProviderProofEveryIterations } else { 0 }
      maxProviderProofRuns = if ($RunProviderProof) { $MaxProviderProofRuns } else { 0 }
      dataHygieneEnabled = [bool](-not $SkipDataHygiene)
      makerSeedEnabled = [bool](-not $SkipMakerSeed)
      lifecycleSchedulerEnabled = [bool](-not $SkipLifecycleScheduler)
      staleGuardEnabled = [bool]$RunStaleGuard
      staleGuardEnforced = [bool]$EnforceStaleGuard
      resultIngestionEnabled = [bool]$RunResultIngestion
      liveResultIngestionEnabled = [bool]$RunLiveResultIngestion
      liveResultIngestionRunsCompleted = $liveResultIngestionRunCount
      resultIngestionEveryIterations = if ($RunLiveResultIngestion) { $ResultIngestionEveryIterations } else { 0 }
      maxLiveResultIngestionRuns = if ($RunLiveResultIngestion) { $MaxLiveResultIngestionRuns } else { 0 }
      resultSettlementEnabled = [bool]$RunResultSettlement
      approvedResultSettlementEnabled = [bool]$RunApprovedResultSettlement
      resultSettlementPath = if ($RunApprovedResultSettlement -or $RunResultIngestion) { $ResultSettlementPath } else { $null }
      resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
      cachedModeUsesQuota = $false
    }
    runtimeTruth = [ordered]@{
      providerRefreshMode = if ($RunProviderProof) { "quota-capped live provider proof by cadence; cached verification after cap or cadence skips" } else { "cached provider proof verification; no provider quota spent" }
      marketMakerMode = if ($SkipMakerSeed) { "not seeded by supervisor" } else { "repeated local shifted maker reseed while supervisor runs" }
      lifecycleSchedulerMode = if ($SkipLifecycleScheduler) { "not run by supervisor" } else { "safe real-time scheduler check each cycle; no proof time mutation" }
      staleGuardMode = if (-not $RunStaleGuard) { "disabled" } elseif ($EnforceStaleGuard) { "enforce stale provider pause while supervisor runs" } else { "dry-run stale monitor while supervisor runs" }
      resultIngestionMode = if (-not $RunResultIngestion) { "disabled" } elseif ($RunLiveResultIngestion) { "quota-capped live result ingestion by cadence; replay disabled for result ingestion cycles" } else { "provider-shaped result ingestion replay while supervisor runs; no provider quota spent" }
      resultSettlementMode = if ($RunApprovedResultSettlement) { "approved trusted-result scheduler; waits until CLOSED before execution" } elseif ($RunResultSettlement) { "trusted result scheduler dry-run while supervisor runs" } else { "disabled" }
      unattendedServiceInstalled = $false
    }
    failure = $Failure
  }
  Write-JsonFile -Value $heartbeat -Path (Resolve-RepoPath $HeartbeatPath) -Depth 60
  $status = if ($heartbeat.running) { "running" } elseif ($LoopPass) { "stopped" } else { "failed" }
  $heartbeatArgs = @(
    "run", "mobile:runtime-heartbeat", "--",
    "--serviceName=one-event-live-supervisor",
    "--serviceKind=supervisor",
    "--status=$status",
    "--pid=$PID",
    "--running=$($heartbeat.running.ToString().ToLowerInvariant())",
    "--continuous=$($Continuous.ToString().ToLowerInvariant())",
    "--usesProviderQuota=$(([bool]($RunProviderProof -or $RunLiveResultIngestion)).ToString().ToLowerInvariant())",
    "--installedOsService=false",
    "--statePath=$HeartbeatPath",
    "--startedAt=$($startedAt.ToString("o"))",
    "--source=local-runtime-worker"
  )
  & npm @heartbeatArgs | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to write worker-owned supervisor runtime heartbeat."
  }
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command
  )
  $startedAt = (Get-Date).ToUniversalTime()
  cmd /c $Command | Out-Null
  $exitCode = $LASTEXITCODE
  return [ordered]@{
    label = $Label
    command = $Command
    exitCode = $exitCode
    pass = [bool]($exitCode -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function Test-HttpHealth {
  try {
    $body = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 8
    return [ordered]@{
      ok = [bool]($body.status -eq "ok" -and $body.db -eq "connected")
      body = $body
      error = $null
    }
  } catch {
    return [ordered]@{
      ok = $false
      body = $null
      error = $_.Exception.Message
    }
  }
}

function Get-DockerPostgresStatus {
  try {
    $rows = @(docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>$null)
    $postgres = $rows | Where-Object { $_ -match "postgres|poly_postgres" } | Select-Object -First 1
    return [ordered]@{
      ok = [bool]($postgres -and $postgres -match "healthy|Up")
      status = if ($postgres) { $postgres } else { "not_found" }
      raw = @($rows)
    }
  } catch {
    return [ordered]@{ ok = $false; status = "docker_unavailable"; error = $_.Exception.Message; raw = @() }
  }
}

function Get-S23Status {
  try {
    $devices = @(adb devices -l 2>$null)
    $line = $devices | Where-Object { $_ -match "adb-R3CW20LFMLW|R3CW20LFMLW|SM_S911U1" } | Select-Object -First 1
    return [ordered]@{
      connected = [bool]$line
      deviceId = if ($line) { "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" } else { $null }
      model = if ($line -and $line -match "model:([^ ]+)") { $Matches[1] } else { $null }
      raw = $line
    }
  } catch {
    return [ordered]@{ connected = $false; deviceId = $null; model = $null; error = $_.Exception.Message }
  }
}

if ($RunProviderProof -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
  throw "RunProviderProof requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
}
if ($RunLiveResultIngestion -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
  throw "RunLiveResultIngestion requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
}

$startedAt = (Get-Date).ToUniversalTime()
$cycles = New-Object System.Collections.Generic.List[object]
$iteration = 0
$providerProofRunCount = 0
$liveResultIngestionRunCount = 0
$loopPass = $true
$failure = $null

try {
  do {
    $iteration += 1
    $cycleStartedAt = (Get-Date).ToUniversalTime()
    $dataHygieneResult = $null
    $dataHygieneSummary = $null
    if (-not $SkipDataHygiene) {
      $dataHygieneResult = Invoke-CheckedCommand -Label "cycle-$iteration-data-hygiene" -Command "npm run mobile:one-event-data-hygiene-proof"
      $dataHygieneSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-data-hygiene-summary.redacted.json"
      $dataHygieneSummary = Read-JsonFile $dataHygieneSummaryPath
      if (-not $dataHygieneResult.pass -or -not ($dataHygieneSummary -and $dataHygieneSummary.pass -eq $true)) {
        $cycles.Add([ordered]@{
          iteration = $iteration
          startedAt = $cycleStartedAt.ToString("o")
          finishedAt = (Get-Date).ToUniversalTime().ToString("o")
          dataHygiene = $dataHygieneResult
          dataHygienePass = [bool]($dataHygieneSummary -and $dataHygieneSummary.pass -eq $true)
        }) | Out-Null
        Write-Heartbeat -Cycles $cycles -Failure "Cycle $iteration data hygiene failed." -LoopPass $false
        $loopPass = $false
        $failure = "Cycle $iteration data hygiene failed."
        break
      }
    }

    $command = "npm run mobile:one-event-live-runtime -- -BackendPort $BackendPort"
    if ($RestartBackend -and $iteration -eq 1) {
      $command += " -RestartBackend"
    }
    $runProviderThisCycle = [bool](
      $RunProviderProof -and
      (($iteration - 1) % $ProviderProofEveryIterations -eq 0) -and
      ($providerProofRunCount -lt $MaxProviderProofRuns)
    )
    if ($runProviderThisCycle) {
      $command += " -RunProviderProof -RefreshIterations $RefreshIterations -MaxCredits $MaxCreditsPerProviderProof -MinRemaining $MinRemaining"
      $providerProofRunCount += 1
    }
    if (-not $SkipMakerSeed) {
      $command += " -SeedMaker"
    }
    if ($SkipSleep) {
      $command += " -SkipSleep"
    }

    $result = Invoke-CheckedCommand -Label "cycle-$iteration-runtime" -Command $command
    $runtimeSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-runtime-launch-summary.redacted.json"
    $runtimeSummary = Read-JsonFile $runtimeSummaryPath
    $staleGuardResult = $null
    $staleGuardSummary = $null
    if ($RunStaleGuard) {
      $staleGuardCommand = "npm run mobile:one-event-stale-guard-run"
      if (-not $EnforceStaleGuard) {
        $staleGuardCommand += " -- --dryRun"
      }
      $staleGuardResult = Invoke-CheckedCommand -Label "cycle-$iteration-stale-guard" -Command $staleGuardCommand
      $staleGuardSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-stale-guard-run-summary.redacted.json"
      $staleGuardSummary = Read-JsonFile $staleGuardSummaryPath
    }
    $resultIngestionResult = $null
    $resultIngestionSummary = $null
    $runLiveResultThisCycle = $false
    if ($RunResultIngestion) {
      $runLiveResultThisCycle = [bool](
        $RunLiveResultIngestion -and
        (($iteration - 1) % $ResultIngestionEveryIterations -eq 0) -and
        ($liveResultIngestionRunCount -lt $MaxLiveResultIngestionRuns)
      )
      $resultIngestionCommand = "npm run mobile:one-event-result-ingest"
      if ($runLiveResultThisCycle) {
        $resultIngestionCommand += " -- --live --maxCredits=$MaxCreditsPerResultIngestion --minRemaining=$MinRemaining"
        $liveResultIngestionRunCount += 1
      }
      $resultIngestionResult = Invoke-CheckedCommand -Label "cycle-$iteration-result-ingestion" -Command $resultIngestionCommand
      $resultIngestionSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-result-ingestion-summary.redacted.json"
      $resultIngestionSummary = Read-JsonFile $resultIngestionSummaryPath
    }
    $resultSettlementResult = $null
    $resultSettlementSummary = $null
    if ($RunResultSettlement) {
      $resultSettlementCommand = "npm run mobile:one-event-result-settlement-run"
      $resultSettlementArgs = New-Object System.Collections.Generic.List[string]
      if ($RunResultIngestion -or $RunApprovedResultSettlement) {
        $resultSettlementArgs.Add("--result=$ResultSettlementPath") | Out-Null
      }
      if ($RunApprovedResultSettlement) {
        $resultSettlementArgs.Add("--autoExecuteApproved") | Out-Null
        $resultSettlementArgs.Add("--approval=$ResultSettlementApprovalPath") | Out-Null
        $resultSettlementArgs.Add("--writeAuditEvent") | Out-Null
      }
      if ($resultSettlementArgs.Count -gt 0) {
        $resultSettlementCommand += " -- " + ($resultSettlementArgs -join " ")
      }
      $resultSettlementResult = Invoke-CheckedCommand -Label "cycle-$iteration-result-settlement" -Command $resultSettlementCommand
      $resultSettlementSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-result-settlement-run-summary.redacted.json"
      $resultSettlementSummary = Read-JsonFile $resultSettlementSummaryPath
    }
    $schedulerResult = $null
    $schedulerSummary = $null
    if (-not $SkipLifecycleScheduler) {
      $schedulerResult = Invoke-CheckedCommand -Label "cycle-$iteration-lifecycle-scheduler" -Command "npm run mobile:one-event-lifecycle-scheduler-run"
      $schedulerSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-lifecycle-scheduler-run-summary.redacted.json"
      $schedulerSummary = Read-JsonFile $schedulerSummaryPath
    }
    $cycles.Add([ordered]@{
      iteration = $iteration
      startedAt = $cycleStartedAt.ToString("o")
      finishedAt = (Get-Date).ToUniversalTime().ToString("o")
      dataHygiene = $dataHygieneResult
      dataHygienePass = [bool]($SkipDataHygiene -or ($dataHygieneSummary -and $dataHygieneSummary.pass -eq $true))
      command = $result
      runtimeSummaryPath = ConvertTo-RepoPath $runtimeSummaryPath
      runtimePass = [bool]($runtimeSummary -and $runtimeSummary.pass -eq $true)
      lifecycleScheduler = $schedulerResult
      lifecycleSchedulerPass = [bool]($SkipLifecycleScheduler -or ($schedulerSummary -and $schedulerSummary.pass -eq $true))
      lifecycleSchedulerAction = $schedulerSummary.scheduler.action
      staleGuard = $staleGuardResult
      staleGuardPass = [bool]((-not $RunStaleGuard) -or ($staleGuardSummary -and $staleGuardSummary.pass -eq $true))
      staleGuardMode = if ($RunStaleGuard) { if ($EnforceStaleGuard) { "enforce-pause" } else { "dry-run-monitor" } } else { "disabled" }
      staleGuardResult = if ($staleGuardSummary) { $staleGuardSummary.result } else { $null }
      resultIngestion = $resultIngestionResult
      resultIngestionPass = [bool]((-not $RunResultIngestion) -or ($resultIngestionSummary -and $resultIngestionSummary.pass -eq $true))
      resultIngestionMode = if ($resultIngestionSummary) { $resultIngestionSummary.mode } else { $null }
      liveResultIngestionRan = [bool]$runLiveResultThisCycle
      liveResultIngestionRunCount = $liveResultIngestionRunCount
      liveResultIngestionSkippedReason = if ($RunLiveResultIngestion -and -not $runLiveResultThisCycle) {
        if ($liveResultIngestionRunCount -ge $MaxLiveResultIngestionRuns) { "max_live_result_ingestion_runs_reached" } else { "cadence_skip" }
      } else { $null }
      resultSettlement = $resultSettlementResult
      resultSettlementPass = [bool]((-not $RunResultSettlement) -or ($resultSettlementSummary -and $resultSettlementSummary.pass -eq $true))
      resultSettlementAction = if ($resultSettlementSummary) { $resultSettlementSummary.action } else { $null }
      providerProofRan = [bool]$runProviderThisCycle
      providerProofRunCount = $providerProofRunCount
      providerProofSkippedReason = if ($RunProviderProof -and -not $runProviderThisCycle) {
        if ($providerProofRunCount -ge $MaxProviderProofRuns) { "max_provider_proof_runs_reached" } else { "cadence_skip" }
      } else { $null }
      makerSeeded = [bool](-not $SkipMakerSeed)
      event = $runtimeSummary.provider.proof.event
      selectedMarket = $runtimeSummary.provider.proof.selectedMarket
      maker = $runtimeSummary.runtime.makerSeedSummary
    }) | Out-Null
    Write-Heartbeat -Cycles $cycles -LoopPass $true

    if (
      -not $result.pass -or
      -not ($runtimeSummary -and $runtimeSummary.pass -eq $true) -or
      ($RunStaleGuard -and (-not $staleGuardResult.pass -or -not ($staleGuardSummary -and $staleGuardSummary.pass -eq $true))) -or
      ($RunResultIngestion -and (-not $resultIngestionResult.pass -or -not ($resultIngestionSummary -and $resultIngestionSummary.pass -eq $true))) -or
      ($RunResultSettlement -and (-not $resultSettlementResult.pass -or -not ($resultSettlementSummary -and $resultSettlementSummary.pass -eq $true))) -or
      (-not $SkipLifecycleScheduler -and (-not $schedulerResult.pass -or -not ($schedulerSummary -and $schedulerSummary.pass -eq $true)))
    ) {
      $loopPass = $false
      $failure = "Cycle $iteration failed."
      Write-Heartbeat -Cycles $cycles -Failure $failure -LoopPass $false
      break
    }

    if (-not $Continuous -and $iteration -ge $MaxIterations) {
      break
    }
    if ($IntervalSeconds -gt 0) {
      Start-Sleep -Seconds $IntervalSeconds
    }
  } while ($Continuous -or $iteration -lt $MaxIterations)
} catch {
  $loopPass = $false
  $failure = $_.Exception.Message
}

$p0Gaps = New-Object System.Collections.Generic.List[object]
if (-not $loopPass) {
  $p0Gaps.Add($failure) | Out-Null
}
$p1Gaps = New-Object System.Collections.Generic.List[object]
$p1Gaps.Add("supervisor is a local command, not an installed unattended service") | Out-Null
$p1Gaps.Add("provider-shaped replay ingestion and quota-capped live result ingestion are available in the local supervisor, but installed unattended official-result polling and unconfirmed execution are not complete") | Out-Null
$p2Gaps = New-Object System.Collections.Generic.List[object]
$p2Gaps.Add("multi-event provider polling and inventory-aware multi-market quoting remain future work") | Out-Null

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-live-supervisor"
  pass = [bool]$loopPass
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  backend = [ordered]@{
    baseUrl = $BackendBaseUrl
    health = Test-HttpHealth
  }
  dockerPostgres = Get-DockerPostgresStatus
  s23 = Get-S23Status
  settings = [ordered]@{
    continuous = [bool]$Continuous
    maxIterations = $MaxIterations
    completedIterations = $cycles.Count
    intervalSeconds = $IntervalSeconds
    runProviderProof = [bool]$RunProviderProof
    providerProofRunsCompleted = $providerProofRunCount
    providerProofEveryIterations = if ($RunProviderProof) { $ProviderProofEveryIterations } else { 0 }
    maxProviderProofRuns = if ($RunProviderProof) { $MaxProviderProofRuns } else { 0 }
    dataHygieneEnabled = [bool](-not $SkipDataHygiene)
    refreshIterationsPerProviderProof = if ($RunProviderProof) { $RefreshIterations } else { 0 }
    maxCreditsPerProviderProof = if ($RunProviderProof) { $MaxCreditsPerProviderProof } else { 0 }
    maxCreditsAcrossProviderProofs = if ($RunProviderProof) { $MaxCreditsPerProviderProof * $MaxProviderProofRuns } else { 0 }
    minRemaining = $MinRemaining
    makerSeedEnabled = [bool](-not $SkipMakerSeed)
    lifecycleSchedulerEnabled = [bool](-not $SkipLifecycleScheduler)
    staleGuardEnabled = [bool]$RunStaleGuard
    staleGuardEnforced = [bool]$EnforceStaleGuard
    resultIngestionEnabled = [bool]$RunResultIngestion
    liveResultIngestionEnabled = [bool]$RunLiveResultIngestion
    liveResultIngestionRunsCompleted = $liveResultIngestionRunCount
    resultIngestionEveryIterations = if ($RunLiveResultIngestion) { $ResultIngestionEveryIterations } else { 0 }
    maxLiveResultIngestionRuns = if ($RunLiveResultIngestion) { $MaxLiveResultIngestionRuns } else { 0 }
    maxCreditsPerResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion } else { 0 }
    maxCreditsAcrossResultIngestion = if ($RunLiveResultIngestion) { $MaxCreditsPerResultIngestion * $MaxLiveResultIngestionRuns } else { 0 }
    resultSettlementEnabled = [bool]$RunResultSettlement
    approvedResultSettlementEnabled = [bool]$RunApprovedResultSettlement
    resultSettlementPath = if ($RunApprovedResultSettlement -or $RunResultIngestion) { $ResultSettlementPath } else { $null }
    resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
    cachedModeUsesQuota = $false
  }
  runtimeTruth = [ordered]@{
    backendContinuousWhileSupervisorRuns = $true
    providerRefreshContinuousWhileSupervisorRuns = [bool]($RunProviderProof -and $providerProofRunCount -gt 1)
    providerRefreshQuotaCappedWhileSupervisorRuns = [bool]($RunProviderProof -and $providerProofRunCount -gt 0)
    dataHygieneContinuousWhileSupervisorRuns = [bool]((-not $SkipDataHygiene) -and ($Continuous -or $cycles.Count -gt 1))
    marketMakerRefreshContinuousWhileSupervisorRuns = [bool]((-not $SkipMakerSeed) -and ($Continuous -or $cycles.Count -gt 1))
    lifecycleSchedulerContinuousWhileSupervisorRuns = [bool]((-not $SkipLifecycleScheduler) -and ($Continuous -or $cycles.Count -gt 1))
    staleGuardContinuousWhileSupervisorRuns = [bool]($RunStaleGuard -and ($Continuous -or $cycles.Count -gt 1))
    staleGuardMode = if (-not $RunStaleGuard) { "disabled" } elseif ($EnforceStaleGuard) { "enforce stale provider pause while supervisor runs" } else { "dry-run stale monitor while supervisor runs" }
    resultIngestionContinuousWhileSupervisorRuns = [bool]($RunResultIngestion -and ($Continuous -or $cycles.Count -gt 1))
    resultIngestionMode = if (-not $RunResultIngestion) { "disabled" } elseif ($RunLiveResultIngestion) { "quota-capped live result ingestion by cadence; replay disabled for result ingestion cycles" } else { "provider-shaped result ingestion replay while supervisor runs; no provider quota spent" }
    liveResultIngestionContinuousWhileSupervisorRuns = [bool]($RunLiveResultIngestion -and $liveResultIngestionRunCount -gt 1)
    liveResultIngestionQuotaCappedWhileSupervisorRuns = [bool]($RunLiveResultIngestion -and $liveResultIngestionRunCount -gt 0)
    resultSettlementContinuousWhileSupervisorRuns = [bool]($RunResultSettlement -and ($Continuous -or $cycles.Count -gt 1))
    resultSettlementMode = if ($RunApprovedResultSettlement) { "approved trusted-result scheduler; waits until CLOSED before execution" } elseif ($RunResultSettlement) { "trusted result scheduler dry-run while supervisor runs" } else { "disabled" }
    unattendedServiceInstalled = $false
    providerRefreshMode = if ($RunProviderProof) { "quota-capped live provider proof by cadence; cached verification after cap or cadence skips" } else { "cached provider proof verification; no provider quota spent" }
    marketMakerMode = if ($SkipMakerSeed) { "not seeded by supervisor" } else { "repeated local shifted maker reseed while supervisor runs" }
    lifecycleSchedulerMode = if ($SkipLifecycleScheduler) { "not run by supervisor" } else { "safe real-time scheduler check each cycle; no proof time mutation" }
    settlementMode = if ($RunApprovedResultSettlement) { "manual preview/resolve service plus approval-file trusted-result scheduler; waits until CLOSED before execution" } else { "manual preview/resolve service plus trusted-result dry-run scheduler; unconfirmed automatic settlement execution not wired" }
  }
  failure = $failure
  cycles = @($cycles | ForEach-Object { $_ })
  gaps = [ordered]@{
    p0 = $p0Gaps
    p1 = $p1Gaps
    p2 = $p2Gaps
  }
}

$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
Write-JsonFile -Value $summary -Path $resolvedSummaryPath -Depth 60
$summary | ConvertTo-Json -Depth 60

if (-not $summary.pass) {
  exit 1
}
