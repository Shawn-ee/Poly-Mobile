param(
  [string]$OutputDir = "docs\mobile\harness\batch-internal-readiness-latest",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$Cycle = "BATCHREADINESS"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

function ConvertTo-RepoPath {
  param([string]$Path)
  return $Path.Replace($RepoRoot.Path + "\", "").Replace("\", "/")
}

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Invoke-BatchCommand {
  param(
    [string]$Name,
    [string]$Command,
    [string]$OutputPath,
    [switch]$AllowNonZero
  )

  $stdoutPath = Join-Path $ResolvedOutputDir "$Name.stdout.log"
  $stderrPath = Join-Path $ResolvedOutputDir "$Name.stderr.log"
  Write-Host "RUN $Name"

  $previousLocation = Get-Location
  try {
    Set-Location $RepoRoot
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", $Command) -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $exitCode = $process.ExitCode
  } finally {
    Set-Location $previousLocation
  }

  if ($exitCode -ne 0 -and -not $AllowNonZero) {
    throw "$Name failed with exit code $exitCode. See $stdoutPath"
  }

  return [ordered]@{
    name = $Name
    command = $Command
    exitCode = $exitCode
    allowedNonZero = [bool]$AllowNonZero
    outputPath = ConvertTo-RepoPath $OutputPath
    stdoutPath = ConvertTo-RepoPath $stdoutPath
    stderrPath = if (Test-Path -LiteralPath $stderrPath) { ConvertTo-RepoPath $stderrPath } else { $null }
    producedJson = Test-Path -LiteralPath $OutputPath
  }
}

function Invoke-OptionalTextCommand {
  param(
    [string]$Command,
    [int]$TimeoutSeconds = 8
  )

  try {
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c $Command"
    $psi.WorkingDirectory = $RepoRoot.Path
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $process = [System.Diagnostics.Process]::Start($psi)
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try { $process.Kill($true) } catch {}
      return [ordered]@{
        exitCode = $null
        timedOut = $true
        stdout = ""
        stderr = "Timed out after $TimeoutSeconds seconds."
      }
    }

    return [ordered]@{
      exitCode = $process.ExitCode
      timedOut = $false
      stdout = $process.StandardOutput.ReadToEnd().Trim()
      stderr = $process.StandardError.ReadToEnd().Trim()
    }
  } catch {
    return [ordered]@{
      exitCode = $null
      timedOut = $false
      stdout = ""
      stderr = $_.Exception.Message
    }
  }
}

function Get-EnvironmentHealthSnapshot {
  $gitBranch = Invoke-OptionalTextCommand "git branch --show-current"
  $gitStatus = Invoke-OptionalTextCommand "git status --short --branch"
  $adbDevices = Invoke-OptionalTextCommand "adb devices -l"
  $dockerDb = Invoke-OptionalTextCommand "docker ps --filter ""name=poly_postgres"" --format ""{{.Names}} {{.Status}} {{.Ports}}"""
  $ports = Invoke-OptionalTextCommand "powershell -NoProfile -Command ""Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { `$_.LocalPort -in 3002,8081,8289,19000,19001,19002 } | Select-Object LocalPort,OwningProcess | Sort-Object LocalPort | ConvertTo-Json -Compress"""
  $botProcesses = Invoke-OptionalTextCommand "powershell -NoProfile -Command ""Get-CimInstance Win32_Process | Where-Object { `$_.Name -match 'node|npm|tsx|powershell' -and `$_.CommandLine -match 'bot:polymarket|reference:snapshot-watch|poly-bot|soak_orderbook|refresh_reference_snapshots' -and `$_.CommandLine -notmatch 'Where-Object' } | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress"""

  $gitStatusLines = if ($gitStatus.stdout) { @($gitStatus.stdout -split "`r?`n") } else { @() }
  $dirtyLines = @($gitStatusLines | Where-Object { $_ -and ($_ -notmatch '^## ') })
  $adbConnected = [bool]($adbDevices.stdout -match "adb-R3CW20LFMLW-7OpoO6\._adb-tls-connect\._tcp\s+device")
  $dbHealthy = [bool]($dockerDb.stdout -match "poly_postgres" -and $dockerDb.stdout -match "\(healthy\)")
  $expoRunning = [bool]($ports.stdout -match '"LocalPort":8081' -or $ports.stdout -match '"LocalPort":19000' -or $ports.stdout -match '"LocalPort":19001' -or $ports.stdout -match '"LocalPort":19002')
  $backendPortListening = [bool]($ports.stdout -match '"LocalPort":3002')
  $proofPortListening = [bool]($ports.stdout -match '"LocalPort":8289')
  $botRunning = [bool]($botProcesses.stdout -and $botProcesses.stdout -ne "[]" -and $botProcesses.stdout -ne "null")

  return [ordered]@{
    git = [ordered]@{
      branch = $gitBranch.stdout
      status = $gitStatus.stdout
      worktreeClean = ($gitStatus.exitCode -eq 0 -and $dirtyLines.Count -eq 0)
    }
    android = [ordered]@{
      targetDeviceId = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp"
      targetModel = "SM_S911U1"
      s23Connected = $adbConnected
      adbDevices = $adbDevices.stdout
    }
    docker = [ordered]@{
      polyPostgresHealthy = $dbHealthy
      polyPostgresStatus = $dockerDb.stdout
    }
    localServices = [ordered]@{
      backendPort3002Listening = $backendPortListening
      expoRunning = $expoRunning
      proofPort8289Listening = $proofPortListening
      listeningPortsJson = $ports.stdout
    }
    bot = [ordered]@{
      runningContinuously = $botRunning
      matchingProcessesJson = $botProcesses.stdout
    }
  }
}

$backendPath = Join-Path $ResolvedOutputDir "mobile-backend-readiness.json"
$credentialPath = Join-Path $ResolvedOutputDir "mobile-credential-readiness.json"
$googleAuthPath = Join-Path $ResolvedOutputDir "google-auth-runtime-preflight.json"
$googlePhysicalPath = Join-Path $ResolvedOutputDir "google-auth-physical-callback-preflight.json"
$currentStatePath = Join-Path $ResolvedOutputDir "mobile-current-state-inspection.json"
$providerSnapshotRefreshPath = Join-Path $ResolvedOutputDir "provider-snapshot-refresh.json"
$exchangePath = Join-Path $ResolvedOutputDir "internal-exchange-readiness.json"
$providerTradableFlowPath = Join-Path $ResolvedOutputDir "provider-visible-tradable-flow.json"
$matchScanPath = Join-Path $ResolvedOutputDir "worldcup-match-event-scan.json"
$lineScanPath = Join-Path $ResolvedOutputDir "provider-line-breadth-scan.json"
$backendRepoPath = ConvertTo-RepoPath $backendPath
$credentialRepoPath = ConvertTo-RepoPath $credentialPath
$googleAuthRepoPath = ConvertTo-RepoPath $googleAuthPath
$googlePhysicalRepoPath = ConvertTo-RepoPath $googlePhysicalPath
$currentStateRepoPath = ConvertTo-RepoPath $currentStatePath
$providerSnapshotRefreshRepoPath = ConvertTo-RepoPath $providerSnapshotRefreshPath
$exchangeRepoPath = ConvertTo-RepoPath $exchangePath
$providerTradableFlowRepoPath = ConvertTo-RepoPath $providerTradableFlowPath
$matchScanRepoPath = ConvertTo-RepoPath $matchScanPath
$lineScanRepoPath = ConvertTo-RepoPath $lineScanPath

$environmentHealth = Get-EnvironmentHealthSnapshot

$steps = New-Object System.Collections.Generic.List[object]
$steps.Add((Invoke-BatchCommand -Name "backend-readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_backend_readiness.ps1 -SummaryPath `"$backendRepoPath`"" -OutputPath $backendPath))
$steps.Add((Invoke-BatchCommand -Name "credential-readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_credential_readiness.ps1 -SummaryPath `"$credentialRepoPath`"" -OutputPath $credentialPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "google-auth-runtime-preflight" -Command "powershell -ExecutionPolicy Bypass -File mobile\scripts\google-auth-runtime-preflight.ps1 -BackendAuthBase `"$BackendBaseUrl`" -NextAuthUrl `"$BackendBaseUrl`" -SummaryPath `"$googleAuthRepoPath`"" -OutputPath $googleAuthPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "google-auth-physical-callback-preflight" -Command "powershell -ExecutionPolicy Bypass -File mobile\scripts\google-auth-runtime-preflight.ps1 -BackendAuthBase `"$BackendBaseUrl`" -NextAuthUrl `"$BackendBaseUrl`" -RequirePhysicalDeviceCallback -SummaryPath `"$googlePhysicalRepoPath`"" -OutputPath $googlePhysicalPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "current-state" -Command "npx.cmd tsx scripts/inspect_mobile_mvp_current_state.ts --baseUrl=$BackendBaseUrl --summaryPath=`"$currentStateRepoPath`" --cycle=$Cycle" -OutputPath $currentStatePath))
$steps.Add((Invoke-BatchCommand -Name "provider-snapshot-refresh" -Command "npm.cmd run reference:snapshot-refresh -- --once true --eventSlug argentina-vs-egypt --summaryPath `"$providerSnapshotRefreshRepoPath`"" -OutputPath $providerSnapshotRefreshPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "internal-exchange-readiness" -Command "npm.cmd run poly:internal-exchange-readiness -- --summaryPath `"$exchangeRepoPath`"" -OutputPath $exchangePath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "provider-visible-tradable-flow" -Command "npx.cmd tsx scripts/prove_mobile_provider_visible_tradable_flow.ts --cycle=$Cycle --baseUrl=$BackendBaseUrl --summaryPath=`"$providerTradableFlowRepoPath`"" -OutputPath $providerTradableFlowPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "worldcup-match-scan" -Command "npm.cmd run inspect:polymarket-worldcup-matches -- --output `"$matchScanRepoPath`"" -OutputPath $matchScanPath))
$steps.Add((Invoke-BatchCommand -Name "provider-line-scan" -Command "npm.cmd run mobile:provider-line-breadth-scan -- --summaryPath=`"$lineScanRepoPath`" --cycle=$Cycle" -OutputPath $lineScanPath))

$backend = Read-JsonFile $backendPath
$credential = Read-JsonFile $credentialPath
$googleAuth = Read-JsonFile $googleAuthPath
$googlePhysical = Read-JsonFile $googlePhysicalPath
$currentState = Read-JsonFile $currentStatePath
$providerSnapshotRefresh = Read-JsonFile $providerSnapshotRefreshPath
$exchange = Read-JsonFile $exchangePath
$providerTradableFlow = Read-JsonFile $providerTradableFlowPath
$matchScan = Read-JsonFile $matchScanPath
$lineScan = Read-JsonFile $lineScanPath

$backendReady = [bool]($backend -and $backend.dockerCliAvailable -and $backend.dockerDaemonReachable -and $backend.databaseTcpReachable)
$localMvpReady = [bool]($currentState -and $currentState.diagnosis.serviceReadiness.localMvpPathReady)
$providerExchangeReady = [bool]($exchange -and $exchange.readyForInternalMobileExchange)
$providerSnapshotRefreshSucceeded = [bool]($providerSnapshotRefresh -and $providerSnapshotRefresh.summary -and ([int]$providerSnapshotRefresh.summary.errorCount -eq 0))
$providerSnapshotRefreshUpdatedCount = if ($providerSnapshotRefresh -and $providerSnapshotRefresh.summary) { [int]$providerSnapshotRefresh.summary.snapshotsUpdated } else { $null }
$providerMvpTradableFlowReady = [bool]($providerTradableFlow -and $providerTradableFlow.pass)
$providerMvpTradableFlowBlocker = if ($providerTradableFlow -and $providerTradableFlow.blocker) { [string]$providerTradableFlow.blocker } else { $null }
$providerExchangeBlockers = if ($exchange -and $exchange.blockers) { @($exchange.blockers) } else { @() }
$providerBooksUnavailableOrClosed = $providerExchangeBlockers -contains "provider_books_unavailable_or_closed"
$usableMatchCount = if ($matchScan) { [int]$matchScan.summary.usableMatchEventCount } else { 0 }
$attachReadyLineCount = if ($lineScan) { [int]$lineScan.totals.attachReadyProviderLineCandidateCount } else { 0 }
$serverModeApiKeySource = if ($credential) { [string]$credential.apiKeySource } else { $null }
$ambientServerModeReady = [bool]($credential -and $credential.readyForServerBackedSamsungProof -and ($serverModeApiKeySource -eq "environment"))
$localRuntimeServerModeReady = [bool]($credential -and $credential.readyForServerBackedSamsungProof -and ($serverModeApiKeySource -eq "local-runtime-env"))
$googleAuthRuntimeReady = [bool]($googleAuth -and $googleAuth.readyForRuntimeStart)
$googleAuthFailedChecks = New-Object System.Collections.Generic.List[string]
if ($googleAuth -and $googleAuth.failedChecks) {
  foreach ($failedCheck in @($googleAuth.failedChecks)) {
    if (-not [string]::IsNullOrWhiteSpace([string]$failedCheck)) {
      $googleAuthFailedChecks.Add([string]$failedCheck) | Out-Null
    }
  }
}
$googlePhysicalCallbackReady = [bool]($googlePhysical -and $googlePhysical.readyForRuntimeStart)
$googlePhysicalFailedChecks = New-Object System.Collections.Generic.List[string]
if ($googlePhysical -and $googlePhysical.failedChecks) {
  foreach ($failedCheck in @($googlePhysical.failedChecks)) {
    if (-not [string]::IsNullOrWhiteSpace([string]$failedCheck)) {
      $googlePhysicalFailedChecks.Add([string]$failedCheck) | Out-Null
    }
  }
}

$p0Blockers = @()
if (-not $backendReady) { $p0Blockers += "backend_or_local_database_not_ready" }
if (-not $localMvpReady) { $p0Blockers += "local_mvp_route_not_ready" }

$p1Blockers = @()
if (-not $providerExchangeReady) {
  if ($providerBooksUnavailableOrClosed) {
    $p1Blockers += "provider_worldcup_match_books_unavailable_or_closed"
  } else {
    $p1Blockers += "provider_internal_exchange_not_ready"
  }
}
if ($providerSnapshotRefresh -and -not $providerSnapshotRefreshSucceeded) {
  $p1Blockers += "provider_snapshot_refresh_has_errors"
}
if ($providerTradableFlow -and -not $providerMvpTradableFlowReady) {
  if ($providerMvpTradableFlowBlocker -eq "provider_mvp_match_bot_quote_unavailable") {
    $p1Blockers += "provider_mvp_match_bot_quote_unavailable"
  } elseif ($providerMvpTradableFlowBlocker -eq "provider_mvp_match_snapshot_not_mm_safe") {
    $p1Blockers += "provider_mvp_match_snapshot_not_mm_safe"
  } elseif ($providerMvpTradableFlowBlocker -eq "provider_mvp_match_market_not_found") {
    $p1Blockers += "provider_mvp_match_market_not_found"
  } elseif ($providerMvpTradableFlowBlocker -eq "non_mvp_provider_event_rejected") {
    $p1Blockers += "provider_tradable_proof_non_mvp_event_rejected"
  } else {
    $p1Blockers += "provider_mvp_tradable_flow_not_ready"
  }
}
if ($usableMatchCount -lt 1) { $p1Blockers += "no_usable_polymarket_worldcup_team_match_books" }
if ($attachReadyLineCount -lt 1) { $p1Blockers += "no_attach_ready_polymarket_worldcup_line_markets" }
if ($credential -and -not $credential.readyForServerBackedSamsungProof) { $p1Blockers += "manual_server_mode_needs_generated_mobile_api_key" }
if ($googleAuth -and -not $googleAuthRuntimeReady) {
  if ($googleAuthFailedChecks.Contains("Google redirect_uri matches NEXTAUTH_URL callback")) {
    $p1Blockers += "google_redirect_uri_mismatch"
  } else {
    $p1Blockers += "google_auth_runtime_preflight_has_warnings"
  }
}
if ($googlePhysical -and -not $googlePhysicalCallbackReady) {
  if ($googlePhysicalFailedChecks.Contains("NEXTAUTH_URL is reachable by a physical Android browser")) {
    $p1Blockers += "google_physical_callback_not_phone_reachable"
  } else {
    $p1Blockers += "google_physical_callback_preflight_has_warnings"
  }
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "mobile-internal-readiness-batch"
  cycle = $Cycle
  backendBaseUrl = $BackendBaseUrl
  outputDir = ConvertTo-RepoPath $ResolvedOutputDir
  steps = $steps
  environmentHealthCaptured = "before-batch-steps"
  environmentHealth = $environmentHealth
  readiness = [ordered]@{
    localMvpReadyForInternalTesting = ($p0Blockers.Count -eq 0)
    providerBackedExchangeReady = $providerExchangeReady
    backendReady = $backendReady
    worktreeClean = $environmentHealth.git.worktreeClean
    dbContainerHealthy = $environmentHealth.docker.polyPostgresHealthy
    s23Connected = $environmentHealth.android.s23Connected
    expoRunning = $environmentHealth.localServices.expoRunning
    botRunningContinuously = $environmentHealth.bot.runningContinuously
    currentRouteLocalMvpReady = $localMvpReady
    mobileCredentialCanBeCreated = [bool]($credential -and $credential.readyToCreateCredential)
    ambientApiKeyReadyForManualServerMode = $ambientServerModeReady
    serverModeApiKeySource = $serverModeApiKeySource
    localRuntimeEnvReadyForManualServerMode = $localRuntimeServerModeReady
    googleAuthRuntimeReady = $googleAuthRuntimeReady
    googleAuthFailedChecks = $googleAuthFailedChecks.ToArray()
    googlePhysicalCallbackReady = $googlePhysicalCallbackReady
    googlePhysicalFailedChecks = $googlePhysicalFailedChecks.ToArray()
    mobileVisibleEventCount = if ($exchange) { $exchange.mobileExposure.mobileVisibleEventCount } else { $null }
    providerVisibleMarketCount = if ($exchange) { $exchange.providerMarkets.mobileVisibleCount } else { $null }
    providerLocalMmReadyMarketCount = if ($exchange) { $exchange.providerMarkets.localMmReadyCount } else { $null }
    providerBooksUnavailableOrClosed = $providerBooksUnavailableOrClosed
    providerSnapshotRefreshSucceeded = $providerSnapshotRefreshSucceeded
    providerSnapshotRefreshUpdatedCount = $providerSnapshotRefreshUpdatedCount
    providerMvpTradableFlowReady = $providerMvpTradableFlowReady
    providerMvpTradableFlowBlocker = $providerMvpTradableFlowBlocker
    usableWorldCupTeamMatchEventCount = $usableMatchCount
    attachReadyProviderLineCandidateCount = $attachReadyLineCount
  }
  blockers = [ordered]@{
    p0 = $p0Blockers
    p1 = $p1Blockers
  }
  interpretation = if ($p0Blockers.Count -eq 0) {
    "Local MVP fake-token flow is ready for internal testing; provider-backed breadth/line/MM readiness remains tracked P1 debt."
  } else {
    "Local MVP internal testing is blocked until P0 readiness issues are fixed."
  }
  nextActions = @(
    "For internal user-flow testing, keep using Home -> Event Detail -> contract-shaped line market -> Trade Ticket -> fake-token order -> Portfolio/history.",
    "Do not import futures, awards, player props, or non-World-Cup events to fake match breadth.",
    "Re-run this batch after provider imports, provider refresh, or line-market discovery changes.",
    "Run npm run mobile:manual-testing-env before manual server-mode S23 testing if EXPO_PUBLIC_API_KEY is not already set; the batch can recognize the generated local .runtime env file without committing the token.",
    "For real Google consent proof, use a hosted or LAN NEXTAUTH_URL callback that the S23 browser can reach, register that callback in Google Cloud, then run npm run mobile:google-auth-runtime-preflight:strict before manual S23 login."
  )
}

$summaryPath = Join-Path $ResolvedOutputDir "internal-readiness-batch-summary.json"
$summary | ConvertTo-Json -Depth 20 | Out-File -LiteralPath $summaryPath -Encoding utf8
Write-Host "SUMMARY $(ConvertTo-RepoPath $summaryPath)"
Write-Output ($summary | ConvertTo-Json -Depth 20)

if ($p0Blockers.Count -gt 0) {
  exit 1
}
