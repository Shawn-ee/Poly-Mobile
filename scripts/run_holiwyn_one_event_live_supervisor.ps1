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
  [switch]$SkipSleep,
  [string]$StopRequestPath = "",
  [string]$RuntimeArtifactDir = ""
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

function Join-ArtifactPath {
  param([string]$FileName)
  if ([string]::IsNullOrWhiteSpace($RuntimeArtifactDir)) {
    return "docs\mobile\harness\odds-api-live-runtime\$FileName"
  }
  return (Join-Path $RuntimeArtifactDir $FileName)
}

if (-not [string]::IsNullOrWhiteSpace($RuntimeArtifactDir)) {
  $SummaryPath = Join-Path $RuntimeArtifactDir "one-event-live-supervisor-summary.redacted.json"
  $HeartbeatPath = Join-Path $RuntimeArtifactDir "one-event-live-supervisor-heartbeat.redacted.json"
  if ([string]::IsNullOrWhiteSpace($StopRequestPath)) {
    $StopRequestPath = Join-Path $RuntimeArtifactDir "stop-request.json"
  }
}

if (-not [string]::IsNullOrWhiteSpace($StopRequestPath)) {
  $resolvedStopRequest = Resolve-RepoPath $StopRequestPath
  if (Test-Path -LiteralPath $resolvedStopRequest) {
    Remove-Item -LiteralPath $resolvedStopRequest -Force
  }
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

function Write-RunRecord {
  param(
    [Parameter(Mandatory = $true)] [object]$Summary,
    [Parameter(Mandatory = $true)] [string]$SummaryPath
  )
  $runStatus = if ($Summary.pass) { "passed" } else { "failed" }
  $runArgs = @(
    "tsx", "scripts/write_runtime_service_run.ts",
    "--serviceName=one-event-live-supervisor",
    "--serviceKind=supervisor",
    "--status=$runStatus",
    "--startedAt=$($Summary.startedAt)",
    "--finishedAt=$($Summary.completedAt)",
    "--iterationCount=$($Summary.settings.completedIterations)",
    "--providerQuotaUsed=$(([bool]($RunProviderProof -or $RunLiveResultIngestion)).ToString().ToLowerInvariant())",
    "--activeSettlementExecuted=false",
    "--installedOsService=false",
    "--summaryPath=$SummaryPath"
  )
  & npx @runArgs | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to write worker-owned supervisor runtime run record."
  }
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & cmd.exe /d /s /c $Command 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  return [ordered]@{
    label = $Label
    command = $Command
    exitCode = $exitCode
    pass = [bool]($exitCode -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function Test-StopRequested {
  if ([string]::IsNullOrWhiteSpace($StopRequestPath)) { return $false }
  return Test-Path -LiteralPath (Resolve-RepoPath $StopRequestPath)
}

function Wait-OrStopRequested {
  param([int]$Seconds)
  if ($Seconds -le 0) { return }
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-StopRequested) { return }
    Start-Sleep -Milliseconds 500
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

function Invoke-AdbWithTimeout {
  param(
    [string[]]$Arguments,
    [int]$TimeoutSeconds = 5
  )
  $tempOut = [System.IO.Path]::GetTempFileName()
  $tempErr = [System.IO.Path]::GetTempFileName()
  try {
    $process = Start-Process `
      -FilePath "adb" `
      -ArgumentList $Arguments `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $tempOut `
      -RedirectStandardError $tempErr `
      -PassThru
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch {}
      return [ordered]@{ ok = $false; timedOut = $true; output = ""; error = "adb timed out after ${TimeoutSeconds}s" }
    }
    $stdout = if (Test-Path -LiteralPath $tempOut) { Get-Content -Raw -LiteralPath $tempOut } else { "" }
    $stderr = if (Test-Path -LiteralPath $tempErr) { Get-Content -Raw -LiteralPath $tempErr } else { "" }
    $exitCode = $process.ExitCode
    return [ordered]@{
      ok = [bool]($exitCode -eq 0 -or ($null -eq $exitCode -and [string]::IsNullOrWhiteSpace($stderr)))
      timedOut = $false
      exitCode = $exitCode
      output = $stdout
      error = $stderr
    }
  } catch {
    return [ordered]@{ ok = $false; timedOut = $false; output = ""; error = $_.Exception.Message }
  } finally {
    Remove-Item -LiteralPath $tempOut, $tempErr -Force -ErrorAction SilentlyContinue
  }
}

function Get-S23Status {
  try {
    $adbResult = Invoke-AdbWithTimeout -Arguments @("devices", "-l")
    if (-not $adbResult.ok) {
      return [ordered]@{
        connected = $false
        deviceId = $null
        model = $null
        raw = $adbResult.output
        adbTimedOut = [bool]$adbResult.timedOut
        error = $adbResult.error
      }
    }
    $devices = @($adbResult.output -split "`r?`n" | Where-Object { $_ -match "\sdevice\s" })
    $line = $devices |
      Where-Object { $_ -match "adb-R3CW20LFMLW|R3CW20LFMLW|SM_S911U1|model:SM_S911U1" } |
      Select-Object -First 1
    $serial = if ($line -and $line -match "^(\S+)") { $Matches[1] } else { $null }
    return [ordered]@{
      connected = [bool]$line
      deviceId = $serial
      model = if ($line -and $line -match "model:([^ ]+)") { $Matches[1] } else { $null }
      raw = $line
      adbTimedOut = $false
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
    if (Test-StopRequested) { break }
    $iteration += 1
    $cycleStartedAt = (Get-Date).ToUniversalTime()
    $dataHygieneResult = $null
    $dataHygieneSummary = $null
    if (-not $SkipDataHygiene) {
      $dataHygieneSummaryPathRaw = Join-ArtifactPath "one-event-data-hygiene-summary.redacted.json"
      $dataHygieneResult = Invoke-CheckedCommand -Label "cycle-$iteration-data-hygiene" -Command "npm run mobile:one-event-data-hygiene-proof -- --summaryPath=$dataHygieneSummaryPathRaw"
      $dataHygieneSummaryPath = Resolve-RepoPath $dataHygieneSummaryPathRaw
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

    $runtimeSummaryPathRaw = Join-ArtifactPath "one-event-runtime-launch-summary.redacted.json"
    $makerSeedSummaryPathRaw = Join-ArtifactPath "shifted-maker-seed-summary.redacted.json"
    $command = "npm run mobile:one-event-live-runtime -- -BackendPort $BackendPort -SummaryPath $runtimeSummaryPathRaw -MakerSeedSummaryPath $makerSeedSummaryPathRaw"
    if ($RestartBackend -and $iteration -eq 1) {
      $command += " -RestartBackend"
    }
    $runProviderThisCycle = [bool](
      $RunProviderProof -and
      (($iteration - 1) % $ProviderProofEveryIterations -eq 0) -and
      ($providerProofRunCount -lt $MaxProviderProofRuns)
    )
    if ($runProviderThisCycle) {
      $liveProofSummaryPathRaw = Join-ArtifactPath "one-event-live-runtime-summary.redacted.json"
      $command += " -RunProviderProof -LiveProofSummaryPath $liveProofSummaryPathRaw -RefreshIterations $RefreshIterations -MaxCredits $MaxCreditsPerProviderProof -MinRemaining $MinRemaining"
      $providerProofRunCount += 1
    }
    if (-not $SkipMakerSeed) {
      $command += " -SeedMaker"
    }
    if ($SkipSleep) {
      $command += " -SkipSleep"
    }

    $result = Invoke-CheckedCommand -Label "cycle-$iteration-runtime" -Command $command
    $runtimeSummaryPath = Resolve-RepoPath $runtimeSummaryPathRaw
    $runtimeSummary = Read-JsonFile $runtimeSummaryPath
    $runtimeSummaryPass = [bool]($runtimeSummary -and $runtimeSummary.pass -eq $true)
    $runtimeCommandAccepted = [bool]($result.pass -or $runtimeSummaryPass)
    $staleGuardResult = $null
    $staleGuardSummary = $null
    if ($RunStaleGuard) {
      $staleGuardSummaryPathRaw = Join-ArtifactPath "one-event-stale-guard-run-summary.redacted.json"
      $staleGuardCommand = "npm run mobile:one-event-stale-guard-run -- --summaryPath=$staleGuardSummaryPathRaw"
      if (-not $EnforceStaleGuard) {
        $staleGuardCommand += " --dryRun"
      }
      $staleGuardResult = Invoke-CheckedCommand -Label "cycle-$iteration-stale-guard" -Command $staleGuardCommand
      $staleGuardSummaryPath = Resolve-RepoPath $staleGuardSummaryPathRaw
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
      $resultIngestionSummaryPathRaw = Join-ArtifactPath "one-event-result-ingestion-summary.redacted.json"
      $resultIngestionCommand = "npm run mobile:one-event-result-ingest -- --summaryPath=$resultIngestionSummaryPathRaw"
      if ($runLiveResultThisCycle) {
        $resultIngestionCommand += " -- --live --maxCredits=$MaxCreditsPerResultIngestion --minRemaining=$MinRemaining"
        $liveResultIngestionRunCount += 1
      }
      $resultIngestionResult = Invoke-CheckedCommand -Label "cycle-$iteration-result-ingestion" -Command $resultIngestionCommand
      $resultIngestionSummaryPath = Resolve-RepoPath $resultIngestionSummaryPathRaw
      $resultIngestionSummary = Read-JsonFile $resultIngestionSummaryPath
    }
    $resultSettlementResult = $null
    $resultSettlementSummary = $null
    if ($RunResultSettlement) {
      $resultSettlementSummaryPathRaw = Join-ArtifactPath "one-event-result-settlement-run-summary.redacted.json"
      $resultSettlementInnerSummaryPathRaw = Join-ArtifactPath "one-event-result-settlement-summary.redacted.json"
      $resultSettlementCommand = "npm run mobile:one-event-result-settlement-run"
      $resultSettlementArgs = New-Object System.Collections.Generic.List[string]
      $resultSettlementArgs.Add("--summaryPath=$resultSettlementSummaryPathRaw") | Out-Null
      $resultSettlementArgs.Add("--settlementOutput=$resultSettlementInnerSummaryPathRaw") | Out-Null
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
      $resultSettlementSummaryPath = Resolve-RepoPath $resultSettlementSummaryPathRaw
      $resultSettlementSummary = Read-JsonFile $resultSettlementSummaryPath
    }
    $schedulerResult = $null
    $schedulerSummary = $null
    if (-not $SkipLifecycleScheduler) {
      $schedulerSummaryPathRaw = Join-ArtifactPath "one-event-lifecycle-scheduler-run-summary.redacted.json"
      $schedulerResult = Invoke-CheckedCommand -Label "cycle-$iteration-lifecycle-scheduler" -Command "npm run mobile:one-event-lifecycle-scheduler-run -- --summaryPath=$schedulerSummaryPathRaw"
      $schedulerSummaryPath = Resolve-RepoPath $schedulerSummaryPathRaw
      $schedulerSummary = Read-JsonFile $schedulerSummaryPath
    }
    $cycles.Add([ordered]@{
      iteration = $iteration
      startedAt = $cycleStartedAt.ToString("o")
      finishedAt = (Get-Date).ToUniversalTime().ToString("o")
      dataHygiene = $dataHygieneResult
      dataHygienePass = [bool]($SkipDataHygiene -or ($dataHygieneSummary -and $dataHygieneSummary.pass -eq $true))
      command = $result
      runtimeCommandAccepted = $runtimeCommandAccepted
      runtimeSummaryPath = ConvertTo-RepoPath $runtimeSummaryPath
      runtimePass = $runtimeSummaryPass
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
      -not $runtimeCommandAccepted -or
      -not $runtimeSummaryPass -or
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
      Wait-OrStopRequested -Seconds $IntervalSeconds
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
Write-RunRecord -Summary $summary -SummaryPath $SummaryPath
$summary | ConvertTo-Json -Depth 60

if (-not $summary.pass) {
  exit 1
}
