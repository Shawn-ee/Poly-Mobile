param(
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-readiness-summary.redacted.json",
  [int]$BackendPort = 3002,
  [switch]$RestartBackend,
  [switch]$SkipMakerSeed,
  [switch]$SkipLifecycleProof,
  [switch]$SkipDataHygiene,
  [switch]$SkipLifecycleSchedulerProof
)

$ErrorActionPreference = "Stop"

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
    [int]$Depth = 30
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

function Get-PortListeners {
  try {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalPort -in 3002, 8081, 8289 } |
      Select-Object LocalAddress, LocalPort, OwningProcess)
  } catch {
    return @()
  }
}

$commands = New-Object System.Collections.Generic.List[object]
if (-not $SkipDataHygiene) {
  $dataHygieneResult = Invoke-CheckedCommand -Label "data-hygiene" -Command "npm run mobile:one-event-data-hygiene-proof"
  $commands.Add($dataHygieneResult) | Out-Null
  if (-not $dataHygieneResult.pass) {
    throw "Data hygiene proof failed."
  }
}

$runtimeCommand = "npm run mobile:one-event-live-runtime -- -BackendPort $BackendPort"
if ($RestartBackend) {
  $runtimeCommand += " -RestartBackend"
}
if (-not $SkipMakerSeed) {
  $runtimeCommand += " -SeedMaker"
}
$runtimeResult = Invoke-CheckedCommand -Label "runtime" -Command $runtimeCommand
$commands.Add($runtimeResult) | Out-Null
if (-not $runtimeResult.pass) {
  throw "Runtime check failed."
}

if (-not $SkipLifecycleProof) {
  $lifecycleResult = Invoke-CheckedCommand -Label "lifecycle" -Command "npm run mobile:one-event-lifecycle-proof -- --baseUrl=$BackendBaseUrl"
  $commands.Add($lifecycleResult) | Out-Null
  if (-not $lifecycleResult.pass) {
    throw "Lifecycle proof failed."
  }
}

if (-not $SkipLifecycleSchedulerProof) {
  $schedulerResult = Invoke-CheckedCommand -Label "lifecycle-scheduler" -Command "npm run mobile:one-event-lifecycle-scheduler-proof"
  $commands.Add($schedulerResult) | Out-Null
  if (-not $schedulerResult.pass) {
    throw "Lifecycle scheduler proof failed."
  }
}

$runtimeSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-runtime-launch-summary.redacted.json"
$liveSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json"
$makerSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\shifted-maker-seed-summary.redacted.json"
$lifecycleSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\event-lifecycle-controls-summary.redacted.json"
$dataHygieneSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-data-hygiene-summary.redacted.json"
$lifecycleSchedulerSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\event-lifecycle-scheduler-summary.redacted.json"
$s23SummaryPath = Resolve-RepoPath "docs\mobile\harness\cycle-LIVEODDSS23-odds-api-live-runtime-s23\cycle-LIVEODDSS23-odds-api-s23-visible-flow.json"

$runtimeSummary = Read-JsonFile $runtimeSummaryPath
$liveSummary = Read-JsonFile $liveSummaryPath
$makerSummary = Read-JsonFile $makerSummaryPath
$lifecycleSummary = Read-JsonFile $lifecycleSummaryPath
$dataHygieneSummary = Read-JsonFile $dataHygieneSummaryPath
$lifecycleSchedulerSummary = Read-JsonFile $lifecycleSchedulerSummaryPath
$s23Summary = Read-JsonFile $s23SummaryPath
$backendHealth = Test-HttpHealth
$docker = Get-DockerPostgresStatus
$s23 = Get-S23Status
$listeners = @(Get-PortListeners)

$checks = [ordered]@{
  backendHealth = [bool]$backendHealth.ok
  dockerPostgres = [bool]$docker.ok
  runtimeSummaryPass = [bool]($runtimeSummary -and $runtimeSummary.pass -eq $true)
  liveProviderProofPass = [bool]($liveSummary -and $liveSummary.pass -eq $true)
  makerSeedPass = [bool]($SkipMakerSeed -or ($makerSummary -and $makerSummary.pass -eq $true))
  makerQuoteRoutePass = [bool]($SkipMakerSeed -or ($makerSummary -and $makerSummary.checks.quoteRouteShowsBid -eq $true -and $makerSummary.checks.quoteRouteShowsAsk -eq $true))
  dataHygienePass = [bool]($SkipDataHygiene -or ($dataHygieneSummary -and $dataHygieneSummary.pass -eq $true))
  dataHygieneNoStaleVisibleMarkets = [bool]($SkipDataHygiene -or ($dataHygieneSummary -and $dataHygieneSummary.after.staleVisibleMarketCount -eq 0))
  lifecycleProofPass = [bool]($SkipLifecycleProof -or ($lifecycleSummary -and $lifecycleSummary.pass -eq $true))
  lifecycleClosedRejected = [bool]($SkipLifecycleProof -or ($lifecycleSummary -and $lifecycleSummary.checks.closedOrderRejected -eq $true))
  lifecyclePausedRejected = [bool]($SkipLifecycleProof -or ($lifecycleSummary -and $lifecycleSummary.checks.pausedOrderRejected -eq $true))
  lifecycleSchedulerPass = [bool]($SkipLifecycleSchedulerProof -or ($lifecycleSchedulerSummary -and $lifecycleSchedulerSummary.pass -eq $true))
  lifecycleSchedulerPauseProof = [bool]($SkipLifecycleSchedulerProof -or ($lifecycleSchedulerSummary -and $lifecycleSchedulerSummary.checks.pauseInsideWindow -eq $true))
  lifecycleSchedulerCloseProof = [bool]($SkipLifecycleSchedulerProof -or ($lifecycleSchedulerSummary -and $lifecycleSchedulerSummary.checks.closeAfterStart -eq $true))
  lifecycleSchedulerRestored = [bool]($SkipLifecycleSchedulerProof -or ($lifecycleSchedulerSummary -and $lifecycleSchedulerSummary.checks.marketStatusesRestored -eq $true))
  s23VisibleProofPass = [bool]($s23Summary -and $s23Summary.result -eq "pass")
  s23Connected = [bool]$s23.connected
}
$failedChecks = @()
foreach ($entry in $checks.GetEnumerator()) {
  if ($entry.Value -ne $true) {
    $failedChecks += [string]$entry.Key
  }
}
$allChecksPass = [bool]($failedChecks.Count -eq 0)
$commandSummaries = @($commands | ForEach-Object { $_ })
$liveEvent = if ($liveSummary) { $liveSummary.event } else { $null }
$selectedMarket = if ($liveSummary) { $liveSummary.selectedMarket } else { $null }

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-live-readiness"
  pass = $allChecksPass
  commands = $commandSummaries
  backend = [ordered]@{
    baseUrl = $BackendBaseUrl
    health = $backendHealth
  }
  dockerPostgres = $docker
  s23 = $s23
  listeners = $listeners
  event = $liveEvent
  selectedMarket = $selectedMarket
  artifacts = [ordered]@{
    liveProviderProof = ConvertTo-RepoPath $liveSummaryPath
    runtimeLaunch = ConvertTo-RepoPath $runtimeSummaryPath
    makerSeed = ConvertTo-RepoPath $makerSummaryPath
    dataHygiene = ConvertTo-RepoPath $dataHygieneSummaryPath
    lifecycleControls = ConvertTo-RepoPath $lifecycleSummaryPath
    lifecycleScheduler = ConvertTo-RepoPath $lifecycleSchedulerSummaryPath
    s23VisibleFlow = ConvertTo-RepoPath $s23SummaryPath
  }
  runtimeTruth = [ordered]@{
    backendContinuous = $true
    providerRefreshContinuous = $false
    marketMakerContinuous = $false
    dataHygieneGate = $true
    lifecycleSchedulerLocalProof = [bool](-not $SkipLifecycleSchedulerProof)
    providerRefreshMode = "bounded proof unless mobile:one-event-live-runtime:provider is running"
    marketMakerMode = "reusable one-shot shifted-maker seed, not unattended daemon"
    lifecycleSchedulerMode = "local callable scheduler proof, not installed always-on service"
    settlementMode = "manual preview/resolve service; automatic official-result settlement not wired"
  }
  checks = $checks
  gaps = [ordered]@{
    p0 = $failedChecks
    p1 = @(
      "continuous unattended provider refresh daemon is not complete",
      "continuous unattended source-aware market-maker daemon is not complete",
      "installed always-on event close/suspend scheduler service is not complete",
      "automatic official-result settlement is not complete"
    )
    p2 = @("multi-event provider polling and inventory-aware multi-market quoting remain future work")
  }
}

$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
Write-JsonFile -Value $summary -Path $resolvedSummaryPath -Depth 40
$summary | ConvertTo-Json -Depth 40

if (-not $summary.pass) {
  exit 1
}
