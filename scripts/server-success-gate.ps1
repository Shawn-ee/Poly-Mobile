param(
  [string]$ReadinessPath = "..\docs\mobile\harness\cycle-current-mobile-backend-readiness.json",
  [string]$ApiKey = $env:EXPO_PUBLIC_API_KEY,
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedReadinessPath = if ([System.IO.Path]::IsPathRooted($ReadinessPath)) {
  $ReadinessPath
} else {
  Join-Path $MobileRoot $ReadinessPath
}
$resolvedReadinessPath = (Resolve-Path $resolvedReadinessPath).Path

if (-not (Test-Path $resolvedReadinessPath)) {
  throw "Backend readiness summary is missing at $resolvedReadinessPath. Run npm run mobile:backend-readiness:summary from the repo root."
}

$summary = Get-Content -Raw $resolvedReadinessPath | ConvertFrom-Json
$failures = New-Object System.Collections.Generic.List[string]

if (-not $summary.dockerCliAvailable) {
  $failures.Add("Docker CLI is unavailable.")
}
if (-not $summary.dockerDaemonReachable) {
  $failures.Add("Docker daemon is not reachable.")
}
if (-not $summary.composeFileFound) {
  $failures.Add("docker-compose.yml was not found.")
}
if (-not $summary.databaseTcpReachable) {
  $failures.Add("Database TCP is not reachable at $($summary.databaseHost):$($summary.databasePort).")
}
if (-not $summary.usesDefaultLocalComposePort) {
  $failures.Add("DATABASE_URL does not point at the default local compose port.")
}

$trimmedApiKey = if ($null -eq $ApiKey) { "" } else { $ApiKey.Trim() }
$apiKeyLooksValid = $false
if (-not $trimmedApiKey) {
  $failures.Add("EXPO_PUBLIC_API_KEY is missing.")
} elseif ($trimmedApiKey -notmatch "^pk_live_[^.]+\..+") {
  $failures.Add("EXPO_PUBLIC_API_KEY must look like pk_live_<id>.<secret>.")
} else {
  $apiKeyLooksValid = $true
}

function Write-GateSummary($ready, $failures) {
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

  $gateSummary = [ordered]@{
    ready = [bool]$ready
    expectedBlocked = [bool]$ExpectBlocked
    readinessPath = $resolvedReadinessPath
    dockerCliAvailable = [bool]$summary.dockerCliAvailable
    dockerDaemonReachable = [bool]$summary.dockerDaemonReachable
    composeFileFound = [bool]$summary.composeFileFound
    databaseTcpReachable = [bool]$summary.databaseTcpReachable
    usesDefaultLocalComposePort = [bool]$summary.usesDefaultLocalComposePort
    databaseHost = $summary.databaseHost
    databasePort = $summary.databasePort
    apiKeyPresent = [bool]$trimmedApiKey
    apiKeyLooksValid = [bool]$apiKeyLooksValid
    failures = @($failures)
    nextActions = @(
      "Run npm run mobile:backend-readiness:summary from the repo root.",
      "Start Docker Desktop and local Postgres if Docker daemon or DB TCP are unavailable.",
      "Run npm run mobile:dev-credential after database readiness passes.",
      "Export EXPO_PUBLIC_API_KEY before attempting successful server-backed Samsung proof."
    )
  }

  $gateSummary | ConvertTo-Json -Depth 4 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "GATE SUMMARY written to $resolvedSummaryPath"
}

Write-Host "SERVER SUCCESS GATE"
Write-Host "Readiness summary: $resolvedReadinessPath"
Write-Host "Docker CLI: $($summary.dockerCliAvailable)"
Write-Host "Docker daemon: $($summary.dockerDaemonReachable)"
Write-Host "Database TCP: $($summary.databaseTcpReachable)"
Write-Host "API key: $(if ($trimmedApiKey) { '[set]' } else { '[missing]' })"

if ($failures.Count -gt 0) {
  Write-Host "BLOCKED Successful server-backed Samsung order proof is not ready:"
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  Write-GateSummary $false $failures
  if ($ExpectBlocked) {
    Write-Host "PASS Gate blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  Write-GateSummary $true @()
  throw "Expected the server success gate to block, but all prerequisites passed."
}

Write-GateSummary $true @()
Write-Host "PASS Successful server-backed Samsung order proof prerequisites are ready."
