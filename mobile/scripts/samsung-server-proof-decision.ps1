param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$BackendBaseUrl = $env:HOLIWYN_BACKEND_BASE_URL,
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$DocsHarnessRoot = Resolve-Path (Join-Path $RepoRoot "docs\mobile\harness")

$backendReadinessPath = Join-Path $DocsHarnessRoot "cycle-current-mobile-backend-readiness.json"
$credentialReadinessPath = Join-Path $DocsHarnessRoot "cycle-current-mobile-credential-readiness.json"
$serverSuccessGatePath = Join-Path $DocsHarnessRoot "cycle-current-server-success-gate.json"
$quoteProofPath = Join-Path $DocsHarnessRoot "cycle-current-samsung-quote-proof.json"

& (Join-Path $RepoRoot "scripts\mobile_backend_readiness.ps1") -SummaryPath $backendReadinessPath
& (Join-Path $RepoRoot "scripts\mobile_credential_readiness.ps1") -SummaryPath $credentialReadinessPath

if ($ExpectBlocked) {
  & (Join-Path $PSScriptRoot "server-success-gate.ps1") -ExpectBlocked -SummaryPath $serverSuccessGatePath
  if ($BackendBaseUrl -and $BackendBaseUrl.Trim()) {
    & (Join-Path $PSScriptRoot "samsung-quote-proof.ps1") -Device $Device -BackendBaseUrl $BackendBaseUrl.Trim() -ExpectBlocked -SummaryPath $quoteProofPath
  } else {
    & (Join-Path $PSScriptRoot "samsung-quote-proof.ps1") -Device $Device -ExpectBlocked -SummaryPath $quoteProofPath
  }
} else {
  & (Join-Path $PSScriptRoot "server-success-gate.ps1") -SummaryPath $serverSuccessGatePath
  if ($BackendBaseUrl -and $BackendBaseUrl.Trim()) {
    & (Join-Path $PSScriptRoot "samsung-quote-proof.ps1") -Device $Device -BackendBaseUrl $BackendBaseUrl.Trim() -SummaryPath $quoteProofPath
  } else {
    & (Join-Path $PSScriptRoot "samsung-quote-proof.ps1") -Device $Device -SummaryPath $quoteProofPath
  }
}

$backendReadiness = Get-Content -Raw $backendReadinessPath | ConvertFrom-Json
$credentialReadiness = Get-Content -Raw $credentialReadinessPath | ConvertFrom-Json
$serverSuccessGate = Get-Content -Raw $serverSuccessGatePath | ConvertFrom-Json
$quoteProof = Get-Content -Raw $quoteProofPath | ConvertFrom-Json

$ready = [bool]$credentialReadiness.readyForServerBackedSamsungProof -and [bool]$serverSuccessGate.ready -and [bool]$quoteProof.ready
$blockers = @($credentialReadiness.blockers) + @($serverSuccessGate.failures) + @($quoteProof.failures)

function Get-BlockerCategory {
  param([string]$Blocker)

  $normalized = $Blocker.ToLowerInvariant()
  if ($normalized -match "docker daemon") {
    return "docker-daemon"
  }
  if ($normalized -match "database tcp") {
    return "database-tcp"
  }
  if ($normalized -match "api key|expo_public_api_key") {
    return "api-key"
  }
  if ($normalized -match "backend health") {
    return "backend-health"
  }
  if ($normalized -match "quote readiness") {
    return "quote-readiness"
  }
  if ($normalized -match "docker cli") {
    return "docker-cli"
  }
  if ($normalized -match "compose") {
    return "compose"
  }
  return "other"
}

function Get-RecoveryPlan {
  param([string]$Category)

  switch ($Category) {
    "docker-daemon" {
      return [ordered]@{
        owner = "Harness Engineer"
        action = "Start Docker Desktop and wait until the Docker daemon accepts commands."
        verifyCommand = "docker ps"
        readySignal = "Docker daemon reachable is true in mobile backend readiness."
      }
    }
    "database-tcp" {
      return [ordered]@{
        owner = "Backend Agent"
        action = "Start or repair the local Postgres service declared by the compose/database configuration."
        verifyCommand = "npm run mobile:backend-readiness:summary"
        readySignal = "Database TCP reachable is true at the configured host and port."
      }
    }
    "api-key" {
      return [ordered]@{
        owner = "Backend Agent"
        action = "Create and export a mobile dev API credential after backend readiness passes."
        verifyCommand = "npm run mobile:credential-readiness:summary"
        readySignal = "EXPO_PUBLIC_API_KEY is present and credential readiness allows server-backed Samsung proof."
      }
    }
    "backend-health" {
      return [ordered]@{
        owner = "Backend Agent"
        action = "Start the backend API and confirm the mobile device can reach the configured base URL."
        verifyCommand = "npm run preflight:samsung:server-mode:strict"
        readySignal = "Backend health is reachable from the Samsung server-mode preflight."
      }
    }
    "quote-readiness" {
      return [ordered]@{
        owner = "Market Data Agent"
        action = "Restore World Cup event, market, and quote availability before attempting Samsung quote proof."
        verifyCommand = "npm run quote-readiness:expect-blocked:summary"
        readySignal = "Quote readiness reports backend, event detail, market, and quote availability."
      }
    }
    "docker-cli" {
      return [ordered]@{
        owner = "Harness Engineer"
        action = "Install or expose Docker CLI on PATH for backend readiness checks."
        verifyCommand = "docker --version"
        readySignal = "Docker CLI available is true in mobile backend readiness."
      }
    }
    "compose" {
      return [ordered]@{
        owner = "Backend Agent"
        action = "Restore the local compose file or database service configuration expected by the backend harness."
        verifyCommand = "npm run mobile:backend-readiness:summary"
        readySignal = "Compose file found is true in mobile backend readiness."
      }
    }
    default {
      return [ordered]@{
        owner = "Lead Agent"
        action = "Inspect the blocker message, ask Reviewer Agent for the smallest safe recovery, and rerun this decision harness."
        verifyCommand = "npm run decision:samsung:server-proof:expect-blocked:summary"
        readySignal = "The blocker no longer appears in the decision summary."
      }
    }
  }
}

$blockerMap = [ordered]@{}
foreach ($blocker in @($blockers | Where-Object { $_ })) {
  $category = Get-BlockerCategory $blocker
  if (-not $blockerMap.Contains($category)) {
    $blockerMap[$category] = [ordered]@{
      category = $category
      message = $blocker
      recovery = Get-RecoveryPlan $category
    }
  }
}
$normalizedBlockers = @($blockerMap.Values)
$recoveryPlan = @($normalizedBlockers | ForEach-Object {
  [ordered]@{
    category = $_.category
    owner = $_.recovery.owner
    action = $_.recovery.action
    verifyCommand = $_.recovery.verifyCommand
    readySignal = $_.recovery.readySignal
  }
})

$summary = [ordered]@{
  ready = [bool]$ready
  expectedBlocked = [bool]$ExpectBlocked
  decision = if ($ready) { "run-server-backed-samsung-proof" } else { "do-not-run-server-backed-samsung-proof" }
  device = $Device
  backendBaseUrl = $quoteProof.backendBaseUrl
  evidence = [ordered]@{
    backendReadinessPath = $backendReadinessPath
    credentialReadinessPath = $credentialReadinessPath
    serverSuccessGatePath = $serverSuccessGatePath
    quoteProofPath = $quoteProofPath
  }
  readiness = [ordered]@{
    dockerCliAvailable = [bool]$backendReadiness.dockerCliAvailable
    dockerDaemonReachable = [bool]$backendReadiness.dockerDaemonReachable
    composeFileFound = [bool]$backendReadiness.composeFileFound
    databaseTcpReachable = [bool]$backendReadiness.databaseTcpReachable
    apiKeyPresent = [bool]$credentialReadiness.apiKeyPresent
    readyForServerBackedSamsungProof = [bool]$credentialReadiness.readyForServerBackedSamsungProof
    serverSuccessGateReady = [bool]$serverSuccessGate.ready
    quoteProofReady = [bool]$quoteProof.ready
    quoteProofAttempted = [bool]$quoteProof.proofAttempted
    samsungDeviceReachable = [bool]$quoteProof.prerequisiteState.deviceReachable
    marketQuoteReachable = [bool]$quoteProof.prerequisiteState.marketQuoteReachable
  }
  blockerCategories = @($normalizedBlockers | ForEach-Object { $_.category })
  blockers = @($normalizedBlockers)
  recoveryPlan = @($recoveryPlan)
  nextActions = @(
    "Do not run the successful server-backed Samsung proof until ready is true.",
    "Follow recoveryPlan entries in category order and rerun this decision harness after each recovery attempt.",
    "When all blocker categories clear, run the successful server-backed Samsung proof on the Samsung S23."
  )
}

if ($SummaryPath.Trim()) {
  $resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
    $SummaryPath
  } else {
    Join-Path $MobileRoot $SummaryPath
  }
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "SAMSUNG SERVER PROOF DECISION SUMMARY written to $resolvedSummaryPath"
}

if (-not $ready) {
  Write-Host "BLOCKED Server-backed Samsung proof decision: do not run proof yet."
  foreach ($blocker in $normalizedBlockers) {
    Write-Host "- [$($blocker.category)] $($blocker.message)"
    Write-Host "  recovery: $($blocker.recovery.action)"
    Write-Host "  verify: $($blocker.recovery.verifyCommand)"
  }
  if ($ExpectBlocked) {
    Write-Host "PASS Server-backed Samsung proof decision blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  throw "Expected server-backed Samsung proof decision to block, but all prerequisites passed."
}

Write-Host "PASS Server-backed Samsung proof decision is ready."
