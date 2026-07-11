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

$backendPath = Join-Path $ResolvedOutputDir "mobile-backend-readiness.json"
$credentialPath = Join-Path $ResolvedOutputDir "mobile-credential-readiness.json"
$currentStatePath = Join-Path $ResolvedOutputDir "mobile-current-state-inspection.json"
$exchangePath = Join-Path $ResolvedOutputDir "internal-exchange-readiness.json"
$matchScanPath = Join-Path $ResolvedOutputDir "worldcup-match-event-scan.json"
$lineScanPath = Join-Path $ResolvedOutputDir "provider-line-breadth-scan.json"
$backendRepoPath = ConvertTo-RepoPath $backendPath
$credentialRepoPath = ConvertTo-RepoPath $credentialPath
$currentStateRepoPath = ConvertTo-RepoPath $currentStatePath
$exchangeRepoPath = ConvertTo-RepoPath $exchangePath
$matchScanRepoPath = ConvertTo-RepoPath $matchScanPath
$lineScanRepoPath = ConvertTo-RepoPath $lineScanPath

$steps = New-Object System.Collections.Generic.List[object]
$steps.Add((Invoke-BatchCommand -Name "backend-readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_backend_readiness.ps1 -SummaryPath `"$backendRepoPath`"" -OutputPath $backendPath))
$steps.Add((Invoke-BatchCommand -Name "credential-readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_credential_readiness.ps1 -SummaryPath `"$credentialRepoPath`"" -OutputPath $credentialPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "current-state" -Command "npx.cmd tsx scripts/inspect_mobile_mvp_current_state.ts --baseUrl=$BackendBaseUrl --summaryPath=`"$currentStateRepoPath`" --cycle=$Cycle" -OutputPath $currentStatePath))
$steps.Add((Invoke-BatchCommand -Name "internal-exchange-readiness" -Command "npm.cmd run poly:internal-exchange-readiness -- --summaryPath `"$exchangeRepoPath`"" -OutputPath $exchangePath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "worldcup-match-scan" -Command "npm.cmd run inspect:polymarket-worldcup-matches -- --output `"$matchScanRepoPath`"" -OutputPath $matchScanPath))
$steps.Add((Invoke-BatchCommand -Name "provider-line-scan" -Command "npm.cmd run mobile:provider-line-breadth-scan -- --summaryPath=`"$lineScanRepoPath`" --cycle=$Cycle" -OutputPath $lineScanPath))

$backend = Read-JsonFile $backendPath
$credential = Read-JsonFile $credentialPath
$currentState = Read-JsonFile $currentStatePath
$exchange = Read-JsonFile $exchangePath
$matchScan = Read-JsonFile $matchScanPath
$lineScan = Read-JsonFile $lineScanPath

$backendReady = [bool]($backend -and $backend.dockerCliAvailable -and $backend.dockerDaemonReachable -and $backend.databaseTcpReachable)
$localMvpReady = [bool]($currentState -and $currentState.diagnosis.serviceReadiness.localMvpPathReady)
$providerExchangeReady = [bool]($exchange -and $exchange.readyForInternalMobileExchange)
$usableMatchCount = if ($matchScan) { [int]$matchScan.summary.usableMatchEventCount } else { 0 }
$attachReadyLineCount = if ($lineScan) { [int]$lineScan.totals.attachReadyProviderLineCandidateCount } else { 0 }

$p0Blockers = @()
if (-not $backendReady) { $p0Blockers += "backend_or_local_database_not_ready" }
if (-not $localMvpReady) { $p0Blockers += "local_mvp_route_not_ready" }

$p1Blockers = @()
if (-not $providerExchangeReady) { $p1Blockers += "provider_internal_exchange_not_ready" }
if ($usableMatchCount -lt 1) { $p1Blockers += "no_usable_polymarket_worldcup_team_match_books" }
if ($attachReadyLineCount -lt 1) { $p1Blockers += "no_attach_ready_polymarket_worldcup_line_markets" }
if ($credential -and -not $credential.readyForServerBackedSamsungProof) { $p1Blockers += "manual_server_mode_needs_generated_mobile_api_key" }

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "mobile-internal-readiness-batch"
  cycle = $Cycle
  backendBaseUrl = $BackendBaseUrl
  outputDir = ConvertTo-RepoPath $ResolvedOutputDir
  steps = $steps
  readiness = [ordered]@{
    localMvpReadyForInternalTesting = ($p0Blockers.Count -eq 0)
    providerBackedExchangeReady = $providerExchangeReady
    backendReady = $backendReady
    currentRouteLocalMvpReady = $localMvpReady
    mobileCredentialCanBeCreated = [bool]($credential -and $credential.readyToCreateCredential)
    ambientApiKeyReadyForManualServerMode = [bool]($credential -and $credential.readyForServerBackedSamsungProof)
    mobileVisibleEventCount = if ($exchange) { $exchange.mobileExposure.mobileVisibleEventCount } else { $null }
    providerVisibleMarketCount = if ($exchange) { $exchange.providerMarkets.mobileVisibleCount } else { $null }
    providerLocalMmReadyMarketCount = if ($exchange) { $exchange.providerMarkets.localMmReadyCount } else { $null }
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
    "Generate a mobile dev credential before manual server-mode S23 testing if EXPO_PUBLIC_API_KEY is not already set."
  )
}

$summaryPath = Join-Path $ResolvedOutputDir "internal-readiness-batch-summary.json"
$summary | ConvertTo-Json -Depth 20 | Out-File -LiteralPath $summaryPath -Encoding utf8
Write-Host "SUMMARY $(ConvertTo-RepoPath $summaryPath)"
Write-Output ($summary | ConvertTo-Json -Depth 20)

if ($p0Blockers.Count -gt 0) {
  exit 1
}
