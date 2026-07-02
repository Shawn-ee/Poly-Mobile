param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$QuoteReadinessPath = "..\docs\mobile\harness\cycle-current-quote-readiness.json",
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedQuoteReadinessPath = if ([System.IO.Path]::IsPathRooted($QuoteReadinessPath)) {
  $QuoteReadinessPath
} else {
  Join-Path $MobileRoot $QuoteReadinessPath
}
$resolvedQuoteReadinessPath = (Resolve-Path $resolvedQuoteReadinessPath).Path

if (-not (Test-Path $resolvedQuoteReadinessPath)) {
  throw "Quote readiness summary is missing at $resolvedQuoteReadinessPath. Run npm run quote-readiness:expect-blocked:summary first."
}

$quoteReadiness = Get-Content -Raw $resolvedQuoteReadinessPath | ConvertFrom-Json
$failures = New-Object System.Collections.Generic.List[string]
$deviceReachable = $false

try {
  $adbDevices = adb devices
  $deviceLine = $adbDevices | Where-Object { $_ -match [Regex]::Escape($Device) }
  if ($deviceLine -and $deviceLine -match "\sdevice$") {
    $deviceReachable = $true
  } else {
    $failures.Add("Samsung device '$Device' is not reachable through adb.")
  }
} catch {
  $failures.Add("adb device check failed: $($_.Exception.Message)")
}

if (-not $quoteReadiness.ready) {
  $failures.Add("Server quote readiness is blocked.")
}

function Write-GateSummary {
  param([bool]$Ready)

  if (-not $SummaryPath.Trim()) {
    return
  }

  $resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
    $SummaryPath
  } else {
    Join-Path $MobileRoot $SummaryPath
  }
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }

  $summary = [ordered]@{
    ready = [bool]$Ready
    expectedBlocked = [bool]$ExpectBlocked
    device = $Device
    deviceReachable = [bool]$deviceReachable
    quoteReadinessPath = $resolvedQuoteReadinessPath
    quoteReadinessReady = [bool]$quoteReadiness.ready
    backendBaseUrl = $quoteReadiness.backendBaseUrl
    backendHealthReachable = [bool]$quoteReadiness.backendHealthReachable
    worldCupEventsReachable = [bool]$quoteReadiness.worldCupEventsReachable
    eventDetailReachable = [bool]$quoteReadiness.eventDetailReachable
    marketQuoteReachable = [bool]$quoteReadiness.marketQuoteReachable
    discoveredEventSlug = $quoteReadiness.discoveredEventSlug
    discoveredMarketId = $quoteReadiness.discoveredMarketId
    quoteCount = [int]$quoteReadiness.quoteCount
    quoteReadinessFailures = @($quoteReadiness.failures)
    failures = @($failures)
    nextActions = @(
      "Run npm run quote-readiness:expect-blocked:summary after backend state changes.",
      "Keep Samsung wireless debugging connected before server quote proof.",
      "Attempt Samsung server quote proof only after this gate reports ready."
    )
  }

  $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "SAMSUNG QUOTE PROOF GATE SUMMARY written to $resolvedSummaryPath"
}

Write-Host "SAMSUNG QUOTE PROOF GATE"
Write-Host "Device: $Device"
Write-Host "Quote readiness: $resolvedQuoteReadinessPath"
Write-Host "Device reachable: $deviceReachable"
Write-Host "Quote readiness ready: $($quoteReadiness.ready)"

$ready = $failures.Count -eq 0
Write-GateSummary $ready

if (-not $ready) {
  Write-Host "BLOCKED Samsung server quote proof is not ready:"
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  if ($ExpectBlocked) {
    Write-Host "PASS Samsung quote proof gate blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  throw "Expected Samsung quote proof gate to block, but all prerequisites passed."
}

Write-Host "PASS Samsung server quote proof prerequisites are ready."
