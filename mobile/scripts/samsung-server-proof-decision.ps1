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
$uniqueBlockers = @($blockers | Where-Object { $_ } | Select-Object -Unique)

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
  blockers = @($uniqueBlockers)
  nextActions = @(
    "Do not run the successful server-backed Samsung proof until ready is true.",
    "If Docker daemon or DB TCP are blockers, start Docker Desktop and local Postgres, then rerun this decision harness.",
    "If API key is a blocker, create/export a mobile dev credential after backend readiness passes.",
    "If quote readiness is a blocker, restore backend health and World Cup market quote availability before Samsung quote proof."
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
  foreach ($blocker in $uniqueBlockers) {
    Write-Host "- $blocker"
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
