param(
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-readiness-summary.redacted.json",
  [int]$BackendPort = 3002,
  [switch]$RestartBackend,
  [switch]$SkipMakerSeed,
  [switch]$SkipLifecycleProof,
  [switch]$SkipDataHygiene,
  [switch]$SkipLifecycleSchedulerProof,
  [switch]$AllowDisconnectedS23
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BackendBaseUrl = "http://127.0.0.1:$BackendPort"

function Set-LocalDatabaseEnv {
  if ($env:DATABASE_URL) {
    return
  }

  $candidates = New-Object System.Collections.Generic.List[string]
  if (-not [string]::IsNullOrWhiteSpace($env:DOTENV_CONFIG_PATH)) {
    $candidates.Add($env:DOTENV_CONFIG_PATH) | Out-Null
  }
  foreach ($fileName in @(".env.local", ".env")) {
    $candidates.Add((Join-Path $RepoRoot $fileName)) | Out-Null
  }
  $current = $RepoRoot
  for ($depth = 0; $depth -lt 8; $depth += 1) {
    $candidates.Add((Join-Path $current "Poly\.env")) | Out-Null
    $parent = Split-Path -Parent $current
    if ($parent -eq $current -or [string]::IsNullOrWhiteSpace($parent)) {
      break
    }
    $current = $parent
  }

  foreach ($path in ($candidates | Select-Object -Unique)) {
    if (-not $path -or -not (Test-Path -LiteralPath $path)) {
      continue
    }
    $line = Get-Content -LiteralPath $path | Where-Object { $_ -match "^\s*DATABASE_URL\s*=" } | Select-Object -First 1
    if ($line) {
      $env:DATABASE_URL = ($line -replace "^\s*DATABASE_URL\s*=\s*", "").Trim().Trim('"').Trim("'")
      if ([string]::IsNullOrWhiteSpace($env:DOTENV_CONFIG_PATH)) {
        $env:DOTENV_CONFIG_PATH = $path
      }
      return
    }
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

function Resolve-LatestS23VisibleProofPath {
  $fallback = Resolve-RepoPath "docs\mobile\harness\cycle-ZD-spain-france-cashout-fresh\cycle-ZD-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json"
  $harnessRoot = Resolve-RepoPath "docs\mobile\harness"
  if (-not (Test-Path -LiteralPath $harnessRoot)) {
    return $fallback
  }

  $candidates = @()
  $proofDirectories = Get-ChildItem -LiteralPath $harnessRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^cycle-.*spain-france-cashout' }
  foreach ($directory in $proofDirectories) {
    $proofFile = Get-ChildItem -LiteralPath $directory.FullName -File -Filter "*odds-api-s23-visible-flow.json" -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if (-not $proofFile) {
      continue
    }

    $proof = Read-JsonFile $proofFile.FullName
    if (
      -not $proof -or
      $proof.result -ne "pass" -or
      $proof.assertions.cashoutTicketIsClosePositionMode -ne $true -or
      $proof.assertions.cashoutMaxUsesOwnedShares -ne $true -or
      $proof.assertions.cashoutTicketHidesYesNoSelector -ne $true
    ) {
      continue
    }

    $generatedAt = [DateTimeOffset]::MinValue
    if ($proof.generatedAt) {
      [DateTimeOffset]::TryParse([string]$proof.generatedAt, [ref]$generatedAt) | Out-Null
    }
    $candidates += [pscustomobject]@{
      Path = $proofFile.FullName
      GeneratedAt = $generatedAt
    }
  }

  $latest = $candidates | Sort-Object GeneratedAt -Descending | Select-Object -First 1
  if ($latest) {
    return $latest.Path
  }
  return $fallback
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

function Get-PortListeners {
  try {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalPort -in 3002, 8081, 8289 } |
      Select-Object LocalAddress, LocalPort, OwningProcess)
  } catch {
    return @()
  }
}

Set-LocalDatabaseEnv

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
$s23SummaryPath = Resolve-LatestS23VisibleProofPath

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
  s23CashoutClosePositionMode = [bool]($s23Summary -and $s23Summary.assertions.cashoutTicketIsClosePositionMode -eq $true)
  s23CashoutMaxUsesOwnedShares = [bool]($s23Summary -and $s23Summary.assertions.cashoutMaxUsesOwnedShares -eq $true)
  s23CashoutHidesYesNoSelector = [bool]($s23Summary -and $s23Summary.assertions.cashoutTicketHidesYesNoSelector -eq $true)
  s23CashoutSellSubmitted = [bool]($s23Summary -and $s23Summary.assertions.cashoutSellSubmitted -eq $true)
  s23CashoutHistoryVisible = [bool]($s23Summary -and $s23Summary.assertions.cashoutHistoryVisible -eq $true)
  s23Connected = [bool]($AllowDisconnectedS23 -or $s23.connected)
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
    s23RequiredForThisReadinessRun = [bool](-not $AllowDisconnectedS23)
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
