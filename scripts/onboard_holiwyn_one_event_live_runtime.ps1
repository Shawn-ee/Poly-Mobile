param(
  [int]$BackendPort = 3002,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-onboarding-summary.redacted.json",
  [string]$ReplayOddsPath = "docs\mobile\harness\the-odds-api-single-event\event-odds.redacted.json",
  [string]$ProviderSecretPath = ".runtime\secrets\the-odds-api-key.txt",
  [string]$WinningOutcome = "over",
  [switch]$RunProviderRefresh,
  [switch]$AllowPastReplay,
  [switch]$RestartBackend,
  [switch]$SkipReadiness,
  [switch]$SkipSettlementDryRun,
  [switch]$StartRuntimeLoops,
  [switch]$ReplaceExternalExpo,
  [switch]$StopRuntimeLoopsAfterProof,
  [switch]$AllowDisconnectedS23
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

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

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command,
    [int]$TimeoutSeconds = 180
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $tempOut = [System.IO.Path]::GetTempFileName()
  $tempErr = [System.IO.Path]::GetTempFileName()
  $tempExit = [System.IO.Path]::GetTempFileName()
  $timedOut = $false
  $exitCode = $null
  try {
    $cmdWithExitCapture = "$Command & echo %ERRORLEVEL% > `"$tempExit`""
    $process = Start-Process `
      -FilePath "cmd.exe" `
      -ArgumentList @("/d", "/s", "/c", $cmdWithExitCapture) `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $tempOut `
      -RedirectStandardError $tempErr `
      -PassThru
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      $timedOut = $true
      try { taskkill /PID $process.Id /T /F | Out-Null } catch {}
    } else {
      $process.Refresh()
      $capturedExitCode = if (Test-Path -LiteralPath $tempExit) {
        (Get-Content -Raw -LiteralPath $tempExit -ErrorAction SilentlyContinue).Trim()
      } else { "" }
      if ($capturedExitCode -match "^-?\d+$") {
        $exitCode = [int]$capturedExitCode
      } elseif ($null -ne $process.ExitCode) {
        $exitCode = $process.ExitCode
      }
    }
  } finally {
    Remove-Item -LiteralPath $tempOut, $tempErr, $tempExit -Force -ErrorAction SilentlyContinue
  }
  return [ordered]@{
    label = $Label
    command = $Command
    exitCode = $exitCode
    timedOut = $timedOut
    timeoutSeconds = $TimeoutSeconds
    pass = [bool]((-not $timedOut) -and $exitCode -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function New-SkippedCommandResult {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Reason
  )
  $timestamp = (Get-Date).ToUniversalTime().ToString("o")
  return [ordered]@{
    label = $Label
    command = "skipped"
    exitCode = 0
    pass = $true
    skipped = $true
    reason = $Reason
    startedAt = $timestamp
    finishedAt = $timestamp
  }
}

function Get-EventStartTime {
  param([object]$Json)
  if (-not $Json) {
    return $null
  }
  $value = $null
  if ($Json.event) {
    if ($Json.event.startTime) {
      $value = $Json.event.startTime
    } elseif ($Json.event.commenceTime) {
      $value = $Json.event.commenceTime
    } elseif ($Json.event.event -and $Json.event.event.commenceTime) {
      $value = $Json.event.event.commenceTime
    }
  }
  if (-not $value -and $Json.selectedEvent -and $Json.selectedEvent.commenceTime) {
    $value = $Json.selectedEvent.commenceTime
  }
  if (-not $value) {
    return $null
  }
  try {
    return ([DateTimeOffset]::Parse([string]$value)).ToUniversalTime()
  } catch {
    return $null
  }
}

function Test-HttpHealth {
  param([string]$BaseUrl)
  try {
    $body = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 8
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

function Get-ProviderSecretStatus {
  param([string]$ResolvedSecretPath)
  $envPresent = -not [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)
  $filePresent = Test-Path -LiteralPath $ResolvedSecretPath
  $fileHasValue = $false
  if ($filePresent) {
    $fileHasValue = -not [string]::IsNullOrWhiteSpace((Get-Content -Raw -LiteralPath $ResolvedSecretPath))
  }
  return [ordered]@{
    envPresent = [bool]$envPresent
    filePresent = [bool]$filePresent
    fileHasValue = [bool]$fileHasValue
    source = if ($envPresent) { "process_env" } elseif ($fileHasValue) { "runtime_secret_file" } else { "missing" }
    filePath = ConvertTo-RepoPath $ResolvedSecretPath
  }
}

$resolvedProviderSecretPath = Resolve-RepoPath $ProviderSecretPath
$providerSecretStatus = Get-ProviderSecretStatus $resolvedProviderSecretPath
$previousProviderKey = $env:THE_ODDS_API_KEY
$providerKeyLoadedFromFile = $false

if ($RunProviderRefresh) {
  if (-not $providerSecretStatus.envPresent) {
    if (-not $providerSecretStatus.fileHasValue) {
      throw "RunProviderRefresh requires THE_ODDS_API_KEY in the process environment or an ignored local secret file at $ProviderSecretPath. The key is not printed."
    }
    $env:THE_ODDS_API_KEY = (Get-Content -Raw -LiteralPath $resolvedProviderSecretPath).Trim()
    $providerKeyLoadedFromFile = $true
  }
}
if (-not $RunProviderRefresh -and -not (Test-Path -LiteralPath (Resolve-RepoPath $ReplayOddsPath))) {
  throw "Replay odds file was not found at $ReplayOddsPath. Run live provider refresh intentionally or restore the redacted replay fixture."
}

$startedAt = (Get-Date).ToUniversalTime()
$BackendBaseUrl = "http://127.0.0.1:$BackendPort"
$commands = New-Object System.Collections.Generic.List[object]
$failed = New-Object System.Collections.Generic.List[string]
$replayFixture = Read-JsonFile (Resolve-RepoPath $ReplayOddsPath)
$runtimeBeforeSeed = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json")
$replayStart = Get-EventStartTime $replayFixture
$runtimeStart = Get-EventStartTime $runtimeBeforeSeed
$runtimeLoopStartSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-onboarding-runtime-start-summary.redacted.json"
$runtimeLoopStatusSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-onboarding-runtime-status-summary.redacted.json"
$runtimeLoopStopSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-onboarding-runtime-stop-summary.redacted.json"
$nowUtc = (Get-Date).ToUniversalTime()
$skipPastReplay = [bool](
  -not $RunProviderRefresh -and
  -not $AllowPastReplay -and
  $replayStart -and
  $replayStart.UtcDateTime -lt $nowUtc -and
  $runtimeStart -and
  $runtimeStart.UtcDateTime -gt $nowUtc
)

try {
  if ($RunProviderRefresh) {
    $seedCommand = "npm run mobile:the-odds-api-single-event"
  } elseif ($skipPastReplay) {
    $seedCommand = $null
  } else {
    $seedCommand = "npm run mobile:the-odds-api-single-event -- --fromRedactedOdds=$ReplayOddsPath"
  }
  if ($seedCommand) {
    $seedResult = Invoke-CheckedCommand -Label "seed-or-replay-provider-event" -Command $seedCommand
  } else {
    $seedResult = New-SkippedCommandResult `
      -Label "seed-or-replay-provider-event" `
      -Reason "Redacted replay fixture is older than current UTC and a newer live-runtime event summary exists; pass -AllowPastReplay to intentionally overwrite local one-event state with the replay fixture."
  }
  $commands.Add($seedResult) | Out-Null
  if (-not $seedResult.pass) {
    $failed.Add("seed-or-replay-provider-event") | Out-Null
  }

  if ($skipPastReplay) {
    $restoreResult = Invoke-CheckedCommand -Label "cached-live-runtime-restore" -Command "npm run mobile:one-event-cached-restore"
    $commands.Add($restoreResult) | Out-Null
    if (-not $restoreResult.pass) {
      $failed.Add("cached-live-runtime-restore") | Out-Null
    }
  }

  if (-not $SkipReadiness) {
    $readinessCommand = "npm run mobile:one-event-live-readiness -- -BackendPort $BackendPort"
    if ($RestartBackend) {
      $readinessCommand += " -RestartBackend"
    }
    if ($AllowDisconnectedS23) {
      $readinessCommand += " -AllowDisconnectedS23"
    }
    $readinessResult = Invoke-CheckedCommand -Label "one-event-live-readiness" -Command $readinessCommand
    $commands.Add($readinessResult) | Out-Null
    if (-not $readinessResult.pass) {
      $failed.Add("one-event-live-readiness") | Out-Null
    }
  }

  $statusResult = Invoke-CheckedCommand -Label "one-event-runtime-status" -Command "npm run mobile:one-event-runtime-status"
  $commands.Add($statusResult) | Out-Null
  if (-not $statusResult.pass) {
    $failed.Add("one-event-runtime-status") | Out-Null
  }

  $settlementReadinessResult = Invoke-CheckedCommand -Label "one-event-settlement-readiness" -Command "npm run mobile:one-event-settlement-readiness"
  $commands.Add($settlementReadinessResult) | Out-Null
  if (-not $settlementReadinessResult.pass) {
    $failed.Add("one-event-settlement-readiness") | Out-Null
  }

  if (-not $SkipSettlementDryRun) {
    $resultIngestionResult = Invoke-CheckedCommand -Label "one-event-result-ingestion" -Command "npm run mobile:one-event-result-ingest"
    $commands.Add($resultIngestionResult) | Out-Null
    if (-not $resultIngestionResult.pass) {
      $failed.Add("one-event-result-ingestion") | Out-Null
    }

    $resultSettlementCommand = "npm run mobile:one-event-result-settlement-run -- --result=docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json"
    $resultSettlementResult = Invoke-CheckedCommand -Label "one-event-result-settlement-dry-run" -Command $resultSettlementCommand
    $commands.Add($resultSettlementResult) | Out-Null
    if (-not $resultSettlementResult.pass) {
      $failed.Add("one-event-result-settlement-dry-run") | Out-Null
    }

    $settlementCommand = "npm run mobile:one-event-settlement -- --winningOutcome=$WinningOutcome"
    $settlementResult = Invoke-CheckedCommand -Label "one-event-settlement-dry-run" -Command $settlementCommand
    $commands.Add($settlementResult) | Out-Null
    if (-not $settlementResult.pass) {
      $failed.Add("one-event-settlement-dry-run") | Out-Null
    }
  }

  if ($StartRuntimeLoops) {
    $startRuntimeCommand = "npm run mobile:internal-tester-runtime -- -Action start -BackendPort $BackendPort -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady -SummaryPath $runtimeLoopStartSummaryPath"
    if ($ReplaceExternalExpo) {
      $startRuntimeCommand += " -Force -ReplaceExternalExpo"
    }
    $startRuntimeResult = Invoke-CheckedCommand -Label "start-local-runtime-loops" -Command $startRuntimeCommand
    $commands.Add($startRuntimeResult) | Out-Null
    if (-not $startRuntimeResult.pass) {
      $failed.Add("start-local-runtime-loops") | Out-Null
    }

    $statusRuntimeCommand = "npm run mobile:internal-tester-runtime -- -Action status -BackendPort $BackendPort -SummaryPath $runtimeLoopStatusSummaryPath"
    $statusRuntimeResult = Invoke-CheckedCommand -Label "status-local-runtime-loops" -Command $statusRuntimeCommand
    $commands.Add($statusRuntimeResult) | Out-Null
    if (-not $statusRuntimeResult.pass) {
      $failed.Add("status-local-runtime-loops") | Out-Null
    }

    if ($StopRuntimeLoopsAfterProof) {
      $stopRuntimeCommand = "npm run mobile:internal-tester-runtime -- -Action stop -BackendPort $BackendPort -SummaryPath $runtimeLoopStopSummaryPath"
      $stopRuntimeResult = Invoke-CheckedCommand -Label "stop-local-runtime-loops-after-proof" -Command $stopRuntimeCommand
      $commands.Add($stopRuntimeResult) | Out-Null
      if (-not $stopRuntimeResult.pass) {
        $failed.Add("stop-local-runtime-loops-after-proof") | Out-Null
      }
    }
  }
} catch {
  $failed.Add($_.Exception.Message) | Out-Null
} finally {
  if ($providerKeyLoadedFromFile) {
    if ($null -ne $previousProviderKey) {
      $env:THE_ODDS_API_KEY = $previousProviderKey
    } else {
      Remove-Item Env:\THE_ODDS_API_KEY -ErrorAction SilentlyContinue
    }
  }
}

$singleEventSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\the-odds-api-single-event\single-event-summary.redacted.json")
$singleEventReplaySummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\the-odds-api-single-event\single-event-replay-summary.redacted.json")
$readinessSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-live-readiness-summary.redacted.json")
$runtimeStatusSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-runtime-status-summary.redacted.json")
$settlementReadinessSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-settlement-readiness-summary.redacted.json")
$manualSettlementSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-manual-settlement-summary.redacted.json")
$resultIngestionSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-result-ingestion-summary.redacted.json")
$resultSettlementRunSummary = Read-JsonFile (Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-result-settlement-run-summary.redacted.json")
$runtimeLoopStartSummary = Read-JsonFile (Resolve-RepoPath $runtimeLoopStartSummaryPath)
$runtimeLoopStatusSummary = Read-JsonFile (Resolve-RepoPath $runtimeLoopStatusSummaryPath)
$runtimeLoopStopSummary = Read-JsonFile (Resolve-RepoPath $runtimeLoopStopSummaryPath)
$backendHealth = Test-HttpHealth -BaseUrl $BackendBaseUrl
$docker = Get-DockerPostgresStatus
$s23 = Get-S23Status
$seedOrReplayPass = if ($RunProviderRefresh) {
  [bool]($singleEventSummary -and $singleEventSummary.pass -eq $true)
} else {
  [bool]($singleEventReplaySummary -and $singleEventReplaySummary.pass -eq $true)
}

$checks = [ordered]@{
  seedOrReplayPass = $seedOrReplayPass
  readinessPass = [bool]($SkipReadiness -or ($readinessSummary -and $readinessSummary.pass -eq $true))
  runtimeStatusPass = [bool]($runtimeStatusSummary -and $runtimeStatusSummary.pass -eq $true)
  settlementReadinessPass = [bool]($settlementReadinessSummary -and $settlementReadinessSummary.pass -eq $true)
  resultIngestionPass = [bool]($SkipSettlementDryRun -or ($resultIngestionSummary -and $resultIngestionSummary.pass -eq $true))
  resultSettlementDryRunPass = [bool]($SkipSettlementDryRun -or ($resultSettlementRunSummary -and $resultSettlementRunSummary.pass -eq $true))
  settlementDryRunPass = [bool]($SkipSettlementDryRun -or ($manualSettlementSummary -and $manualSettlementSummary.pass -eq $true -and $manualSettlementSummary.mode -eq "dry-run"))
  runtimeLoopStartPass = [bool](-not $StartRuntimeLoops -or ($runtimeLoopStartSummary -and $runtimeLoopStartSummary.pass -eq $true))
  runtimeLoopStatusPass = [bool](-not $StartRuntimeLoops -or ($runtimeLoopStatusSummary -and $runtimeLoopStatusSummary.pass -eq $true))
  runtimeLoopsRunningDuringProof = [bool](
    -not $StartRuntimeLoops -or
    (
      $runtimeLoopStatusSummary -and
      $runtimeLoopStatusSummary.supervisor.processSummary.process.after.running -eq $true -and
      $runtimeLoopStatusSummary.resultPoller.processSummary.process.after.running -eq $true
    )
  )
  runtimeLoopStopPass = [bool](-not $StopRuntimeLoopsAfterProof -or ($runtimeLoopStopSummary -and $runtimeLoopStopSummary.pass -eq $true))
  runtimeLoopsStoppedAfterProof = [bool](
    -not $StopRuntimeLoopsAfterProof -or
    (
      $runtimeLoopStopSummary -and
      $runtimeLoopStopSummary.supervisor.processSummary.process.after.running -eq $false -and
      $runtimeLoopStopSummary.resultPoller.processSummary.process.after.running -eq $false
    )
  )
  backendHealth = [bool]$backendHealth.ok
  dockerPostgres = [bool]$docker.ok
}
foreach ($entry in $checks.GetEnumerator()) {
  if ($entry.Value -ne $true) {
    $failed.Add([string]$entry.Key) | Out-Null
  }
}

$event = if ($runtimeStatusSummary -and $runtimeStatusSummary.event) {
  $runtimeStatusSummary.event
} elseif ($singleEventReplaySummary) {
  $singleEventReplaySummary.event
} elseif ($singleEventSummary) {
  $singleEventSummary.event
} else {
  $null
}

$selectedMarket = if ($runtimeStatusSummary -and $runtimeStatusSummary.selectedMarket) {
  $runtimeStatusSummary.selectedMarket
} elseif ($settlementReadinessSummary) {
  $settlementReadinessSummary.selectedMarket
} else {
  $null
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-live-onboarding"
  pass = [bool]($failed.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  mode = if ($RunProviderRefresh) { "live-provider-refresh" } else { "quota-free-replay" }
  providerPolicy = [ordered]@{
    providerSource = "the-odds-api"
    referenceSource = "sportsbook-odds"
    oneEventOnly = $true
    replayDefaultUsesQuota = $false
    liveRefreshRequiresExplicitFlag = $true
    runtimeLoopStartRequiresExplicitFlag = $true
    runtimeLoopCleanupRequested = [bool]$StopRuntimeLoopsAfterProof
    s23MayBeDisconnectedForBackendOnlyProof = [bool]$AllowDisconnectedS23
    pastReplayBlockedByDefault = $true
    allowPastReplay = [bool]$AllowPastReplay
    skippedPastReplay = [bool]$skipPastReplay
    replayEventStartTime = if ($replayStart) { $replayStart.ToString("o") } else { $null }
    existingLiveRuntimeStartTime = if ($runtimeStart) { $runtimeStart.ToString("o") } else { $null }
    keySource = if ($RunProviderRefresh) { $providerSecretStatus.source } else { "not_required" }
    secretFilePath = ConvertTo-RepoPath $resolvedProviderSecretPath
    secretFileSupported = $true
    keyValuePrinted = $false
    commandLineContainsSecret = $false
  }
  event = $event
  selectedMarket = $selectedMarket
  commands = @($commands | ForEach-Object { $_ })
  backend = [ordered]@{
    baseUrl = $BackendBaseUrl
    health = $backendHealth
  }
  dockerPostgres = $docker
  s23 = $s23
  checks = $checks
  artifacts = [ordered]@{
    seedLive = "docs/mobile/harness/the-odds-api-single-event/single-event-summary.redacted.json"
    seedReplay = "docs/mobile/harness/the-odds-api-single-event/single-event-replay-summary.redacted.json"
    cachedLiveRestore = "docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json"
    readiness = "docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json"
    runtimeStatus = "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json"
    settlementReadiness = "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json"
    resultIngestion = "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json"
    resultSettlementDryRun = "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json"
    manualSettlementDryRun = "docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json"
    runtimeLoopStart = $runtimeLoopStartSummaryPath.Replace("\", "/")
    runtimeLoopStatus = $runtimeLoopStatusSummaryPath.Replace("\", "/")
    runtimeLoopStop = $runtimeLoopStopSummaryPath.Replace("\", "/")
  }
  runtimeTruth = [ordered]@{
    backendContinuousAfterOnboarding = $true
    runtimeLoopsStartedByOnboarding = [bool]$StartRuntimeLoops
    runtimeLoopsRunningDuringProof = [bool]($StartRuntimeLoops -and $checks.runtimeLoopsRunningDuringProof)
    runtimeLoopsStoppedAfterProof = [bool]($StopRuntimeLoopsAfterProof -and $checks.runtimeLoopsStoppedAfterProof)
    replaceExternalExpoRequested = [bool]$ReplaceExternalExpo
    verifiedServerModeExpoDuringRuntimeStart = [bool]($runtimeLoopStartSummary -and $runtimeLoopStartSummary.expo.serverModeVerified -eq $true)
    runtimeLoopMode = if ($StartRuntimeLoops) {
      if ($ReplaceExternalExpo) {
        "explicit local supervisor/result-poller proof with manager-owned server-mode Expo replacement"
      } else {
        "explicit local supervisor and result-poller process proof"
      }
    } else {
      "not started by default onboarding"
    }
    providerRefreshMode = if ($RunProviderRefresh) {
      "bounded explicit live provider refresh"
    } elseif ($skipPastReplay) {
      "freshness-guarded cached live restore; stale replay skipped; no provider quota spent"
    } else {
      "redacted replay import; no provider quota spent"
    }
    marketMakerMode = "shifted local maker seed from readiness command; not an installed daemon"
    lifecycleSchedulerMode = "readiness proof plus local callable scheduler; not installed as a service"
    settlementMode = "manual readiness plus provider-shaped result ingestion and guarded dry-run/execute commands; unattended official result polling is not installed"
  }
  gaps = [ordered]@{
    p0 = @($failed | Select-Object -Unique)
    p1 = @(
      "provider-shaped result ingestion and dry-run settlement are available, but unattended official-result polling and execution are not complete",
      "installed always-on provider refresh and market-maker daemons are not complete"
    )
    p2 = @("multi-event onboarding remains future work")
  }
}

$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
Write-JsonFile -Value $summary -Path $resolvedSummaryPath -Depth 60
$summary | ConvertTo-Json -Depth 60

if (-not $summary.pass) {
  exit 1
}
