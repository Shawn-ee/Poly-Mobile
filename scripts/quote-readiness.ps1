param(
  [string]$BackendBaseUrl = $env:HOLIWYN_BACKEND_BASE_URL,
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$trimmedBackendBaseUrl = if ($null -eq $BackendBaseUrl -or -not $BackendBaseUrl.Trim()) {
  "http://127.0.0.1:3000"
} else {
  $BackendBaseUrl.Trim().TrimEnd("/")
}

$failures = New-Object System.Collections.Generic.List[string]
$summary = [ordered]@{
  ready = $false
  expectedBlocked = [bool]$ExpectBlocked
  backendBaseUrl = $trimmedBackendBaseUrl
  backendHealthReachable = $false
  worldCupEventsReachable = $false
  eventDetailReachable = $false
  marketQuoteReachable = $false
  discoveredEventSlug = $null
  discoveredMarketId = $null
  quoteCount = 0
  failures = @()
  nextActions = @(
    "Start the backend on the configured HOLIWYN_BACKEND_BASE_URL.",
    "Seed or import World Cup events with at least one market.",
    "Ensure /api/markets/:id/quote responds for ORDERBOOK markets before server-mode quote device proof."
  )
}

function Write-Summary {
  param([bool]$Ready)

  $summary.ready = $Ready
  $summary.failures = @($failures)
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

  $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "QUOTE READINESS SUMMARY written to $resolvedSummaryPath"
}

Write-Host "MOBILE QUOTE READINESS"
Write-Host "Backend base URL: $trimmedBackendBaseUrl"

try {
  $health = Invoke-RestMethod -Uri "$trimmedBackendBaseUrl/api/health" -TimeoutSec 4
  if ($health.status -ne "ok") {
    throw "Backend health returned status '$($health.status)'."
  }
  $summary.backendHealthReachable = $true
  Write-Host "PASS Backend health ok."
} catch {
  $failures.Add("Backend health unavailable at ${trimmedBackendBaseUrl}: $($_.Exception.Message)")
}

if ($summary.backendHealthReachable) {
  try {
    $eventsUri = "$trimmedBackendBaseUrl/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&search=World%20Cup"
    $eventsPayload = Invoke-RestMethod -Uri $eventsUri -TimeoutSec 6
    $events = @($eventsPayload.events)
    if ($events.Count -eq 0) {
      throw "No World Cup events returned."
    }
    $event = $events | Where-Object { $_.slug } | Select-Object -First 1
    if (-not $event) {
      throw "World Cup events did not include a slug."
    }
    $summary.worldCupEventsReachable = $true
    $summary.discoveredEventSlug = $event.slug
    Write-Host "PASS World Cup events reachable. Event slug: $($event.slug)"
  } catch {
    $failures.Add("World Cup event discovery failed: $($_.Exception.Message)")
  }
}

if ($summary.discoveredEventSlug) {
  try {
    $encodedSlug = [Uri]::EscapeDataString([string]$summary.discoveredEventSlug)
    $detail = Invoke-RestMethod -Uri "$trimmedBackendBaseUrl/api/events/$encodedSlug" -TimeoutSec 6
    $markets = @($detail.markets)
    if ($markets.Count -eq 0) {
      throw "Event detail did not include markets."
    }
    $market = $markets | Where-Object { $_.id } | Select-Object -First 1
    if (-not $market) {
      throw "Event markets did not include an id."
    }
    $summary.eventDetailReachable = $true
    $summary.discoveredMarketId = $market.id
    Write-Host "PASS Event detail reachable. Market id: $($market.id)"
  } catch {
    $failures.Add("Event detail discovery failed: $($_.Exception.Message)")
  }
}

if ($summary.discoveredMarketId) {
  try {
    $encodedMarketId = [Uri]::EscapeDataString([string]$summary.discoveredMarketId)
    $quotePayload = Invoke-RestMethod -Uri "$trimmedBackendBaseUrl/api/markets/$encodedMarketId/quote" -TimeoutSec 6
    $quotes = @($quotePayload.quotes)
    if ($quotes.Count -eq 0) {
      throw "Quote endpoint returned zero quotes."
    }
    $summary.marketQuoteReachable = $true
    $summary.quoteCount = $quotes.Count
    Write-Host "PASS Market quote reachable. Quotes: $($quotes.Count)"
  } catch {
    $failures.Add("Market quote probe failed: $($_.Exception.Message)")
  }
}

$ready = $failures.Count -eq 0
Write-Summary $ready

if (-not $ready) {
  Write-Host "BLOCKED Server quote proof is not ready:"
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  if ($ExpectBlocked) {
    Write-Host "PASS Quote readiness blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  throw "Expected quote readiness to block, but all checks passed."
}

Write-Host "PASS Server quote readiness checks passed."
