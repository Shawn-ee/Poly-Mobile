param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$BackendBaseUrl = $env:HOLIWYN_BACKEND_BASE_URL,
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DocsHarnessRoot = Resolve-Path (Join-Path $MobileRoot "..\docs\mobile\harness")
$quoteReadinessPath = Join-Path $DocsHarnessRoot "cycle-current-quote-readiness.json"
$gateSummaryPath = Join-Path $DocsHarnessRoot "cycle-current-samsung-quote-proof-gate.json"

if ($ExpectBlocked) {
  if ($BackendBaseUrl -and $BackendBaseUrl.Trim()) {
    & (Join-Path $PSScriptRoot "quote-readiness.ps1") -BackendBaseUrl $BackendBaseUrl.Trim() -ExpectBlocked -SummaryPath $quoteReadinessPath
  } else {
    & (Join-Path $PSScriptRoot "quote-readiness.ps1") -ExpectBlocked -SummaryPath $quoteReadinessPath
  }
} else {
  if ($BackendBaseUrl -and $BackendBaseUrl.Trim()) {
    & (Join-Path $PSScriptRoot "quote-readiness.ps1") -BackendBaseUrl $BackendBaseUrl.Trim() -SummaryPath $quoteReadinessPath
  } else {
    & (Join-Path $PSScriptRoot "quote-readiness.ps1") -SummaryPath $quoteReadinessPath
  }
}

if ($ExpectBlocked) {
  & (Join-Path $PSScriptRoot "samsung-quote-proof-gate.ps1") -Device $Device -QuoteReadinessPath $quoteReadinessPath -ExpectBlocked -SummaryPath $gateSummaryPath
} else {
  & (Join-Path $PSScriptRoot "samsung-quote-proof-gate.ps1") -Device $Device -QuoteReadinessPath $quoteReadinessPath -SummaryPath $gateSummaryPath
}

$quoteReadiness = Get-Content -Raw $quoteReadinessPath | ConvertFrom-Json
$gateSummary = Get-Content -Raw $gateSummaryPath | ConvertFrom-Json
$ready = [bool]$quoteReadiness.ready -and [bool]$gateSummary.ready

$summary = [ordered]@{
  ready = [bool]$ready
  expectedBlocked = [bool]$ExpectBlocked
  device = $Device
  quoteReadinessPath = $quoteReadinessPath
  gateSummaryPath = $gateSummaryPath
  quoteReadinessReady = [bool]$quoteReadiness.ready
  gateReady = [bool]$gateSummary.ready
  deviceReachable = [bool]$gateSummary.deviceReachable
  backendBaseUrl = $quoteReadiness.backendBaseUrl
  backendHealthReachable = [bool]$quoteReadiness.backendHealthReachable
  worldCupEventsReachable = [bool]$quoteReadiness.worldCupEventsReachable
  eventDetailReachable = [bool]$quoteReadiness.eventDetailReachable
  marketQuoteReachable = [bool]$quoteReadiness.marketQuoteReachable
  discoveredEventSlug = $quoteReadiness.discoveredEventSlug
  discoveredMarketId = $quoteReadiness.discoveredMarketId
  quoteCount = [int]$quoteReadiness.quoteCount
  quoteReadinessFailures = @($quoteReadiness.failures)
  gateFailures = @($gateSummary.failures)
  nextActions = @(
    "Rerun this preflight after backend or device state changes.",
    "Attempt the Samsung server quote proof only after ready is true.",
    "If backend readiness remains blocked, use the structured failures to choose the next recovery harness."
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
  $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "SAMSUNG QUOTE PROOF PREFLIGHT SUMMARY written to $resolvedSummaryPath"
}

if (-not $ready) {
  Write-Host "BLOCKED Samsung server quote proof preflight is not ready."
  if ($ExpectBlocked) {
    Write-Host "PASS Samsung quote proof preflight blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  throw "Expected Samsung quote proof preflight to block, but all checks passed."
}

Write-Host "PASS Samsung server quote proof preflight is ready."
