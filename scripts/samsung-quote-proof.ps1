param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$BackendBaseUrl = $env:HOLIWYN_BACKEND_BASE_URL,
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DocsHarnessRoot = Resolve-Path (Join-Path $MobileRoot "..\docs\mobile\harness")
$preflightSummaryPath = Join-Path $DocsHarnessRoot "cycle-current-samsung-quote-proof-preflight.json"

if ($ExpectBlocked) {
  if ($BackendBaseUrl -and $BackendBaseUrl.Trim()) {
    & (Join-Path $PSScriptRoot "samsung-quote-proof-preflight.ps1") -Device $Device -BackendBaseUrl $BackendBaseUrl.Trim() -ExpectBlocked -SummaryPath $preflightSummaryPath
  } else {
    & (Join-Path $PSScriptRoot "samsung-quote-proof-preflight.ps1") -Device $Device -ExpectBlocked -SummaryPath $preflightSummaryPath
  }
} else {
  if ($BackendBaseUrl -and $BackendBaseUrl.Trim()) {
    & (Join-Path $PSScriptRoot "samsung-quote-proof-preflight.ps1") -Device $Device -BackendBaseUrl $BackendBaseUrl.Trim() -SummaryPath $preflightSummaryPath
  } else {
    & (Join-Path $PSScriptRoot "samsung-quote-proof-preflight.ps1") -Device $Device -SummaryPath $preflightSummaryPath
  }
}

$preflightSummary = Get-Content -Raw $preflightSummaryPath | ConvertFrom-Json
$ready = [bool]$preflightSummary.ready
$proofStatus = if ($ready) { "ready-for-server-quote-device-proof" } else { "blocked-before-device-proof" }

$summary = [ordered]@{
  ready = [bool]$ready
  expectedBlocked = [bool]$ExpectBlocked
  proofStatus = $proofStatus
  proofAttempted = [bool]$ready
  device = $Device
  preflightSummaryPath = $preflightSummaryPath
  backendBaseUrl = $preflightSummary.backendBaseUrl
  launchEnvironment = [ordered]@{
    EXPO_PUBLIC_API_BASE_URL = $preflightSummary.backendBaseUrl
    EXPO_PUBLIC_ORDER_MODE = "server"
  }
  quoteContext = [ordered]@{
    eventSlug = $preflightSummary.discoveredEventSlug
    marketId = $preflightSummary.discoveredMarketId
    quoteCount = [int]$preflightSummary.quoteCount
  }
  prerequisiteState = [ordered]@{
    deviceReachable = [bool]$preflightSummary.deviceReachable
    backendHealthReachable = [bool]$preflightSummary.backendHealthReachable
    worldCupEventsReachable = [bool]$preflightSummary.worldCupEventsReachable
    eventDetailReachable = [bool]$preflightSummary.eventDetailReachable
    marketQuoteReachable = [bool]$preflightSummary.marketQuoteReachable
    quoteReadinessReady = [bool]$preflightSummary.quoteReadinessReady
    gateReady = [bool]$preflightSummary.gateReady
  }
  failures = @($preflightSummary.quoteReadinessFailures) + @($preflightSummary.gateFailures)
  nextActions = @(
    "If ready is false, fix the listed prerequisite failures before launching the server-mode Samsung quote proof.",
    "If ready is true, launch Holiwyn on Samsung with the recorded launch environment and verify a World Cup ticket quote uses server values.",
    "Capture the resulting Samsung screen evidence and promote this harness from readiness proof to visual quote proof."
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
  Write-Host "SAMSUNG QUOTE PROOF SUMMARY written to $resolvedSummaryPath"
}

if (-not $ready) {
  Write-Host "BLOCKED Samsung server quote proof is not ready."
  if ($ExpectBlocked) {
    Write-Host "PASS Samsung server quote proof blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  throw "Expected Samsung server quote proof to block, but all prerequisites passed."
}

Write-Host "PASS Samsung server quote proof is ready for device execution."
