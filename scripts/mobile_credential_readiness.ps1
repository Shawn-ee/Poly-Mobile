param(
  [string]$ReadinessPath = "docs\mobile\harness\cycle-current-mobile-backend-readiness.json",
  [string]$ApiKey = $env:EXPO_PUBLIC_API_KEY,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedReadinessPath = if ([System.IO.Path]::IsPathRooted($ReadinessPath)) {
  $ReadinessPath
} else {
  Join-Path $RepoRoot $ReadinessPath
}

if (-not (Test-Path $resolvedReadinessPath)) {
  throw "Backend readiness summary is missing at $resolvedReadinessPath. Run npm run mobile:backend-readiness:summary first."
}
$resolvedReadinessPath = (Resolve-Path $resolvedReadinessPath).Path
$readiness = Get-Content -Raw $resolvedReadinessPath | ConvertFrom-Json

$trimmedApiKey = if ($null -eq $ApiKey) { "" } else { $ApiKey.Trim() }
$apiKeyLooksValid = $trimmedApiKey -match "^pk_live_[^.]+\..+"
$canCreateCredential = [bool](
  $readiness.dockerCliAvailable -and
  $readiness.dockerDaemonReachable -and
  $readiness.composeFileFound -and
  $readiness.databaseTcpReachable -and
  $readiness.usesDefaultLocalComposePort
)
$canRunServerProof = $canCreateCredential -and $apiKeyLooksValid

$blockers = New-Object System.Collections.Generic.List[string]
if (-not $readiness.dockerCliAvailable) {
  $blockers.Add("Docker CLI is unavailable.")
}
if (-not $readiness.dockerDaemonReachable) {
  $blockers.Add("Docker daemon is not reachable.")
}
if (-not $readiness.composeFileFound) {
  $blockers.Add("docker-compose.yml was not found.")
}
if (-not $readiness.databaseTcpReachable) {
  $blockers.Add("Database TCP is not reachable at $($readiness.databaseHost):$($readiness.databasePort).")
}
if (-not $readiness.usesDefaultLocalComposePort) {
  $blockers.Add("DATABASE_URL does not point at the default local compose port.")
}
if (-not $trimmedApiKey) {
  $blockers.Add("EXPO_PUBLIC_API_KEY is missing for server-backed Samsung proof.")
} elseif (-not $apiKeyLooksValid) {
  $blockers.Add("EXPO_PUBLIC_API_KEY must look like pk_live_<id>.<secret>.")
}

$summary = [ordered]@{
  readyToCreateCredential = [bool]$canCreateCredential
  readyForServerBackedSamsungProof = [bool]$canRunServerProof
  readinessPath = $resolvedReadinessPath
  dockerCliAvailable = [bool]$readiness.dockerCliAvailable
  dockerDaemonReachable = [bool]$readiness.dockerDaemonReachable
  composeFileFound = [bool]$readiness.composeFileFound
  databaseTcpReachable = [bool]$readiness.databaseTcpReachable
  usesDefaultLocalComposePort = [bool]$readiness.usesDefaultLocalComposePort
  databaseHost = $readiness.databaseHost
  databasePort = $readiness.databasePort
  apiKeyPresent = [bool]$trimmedApiKey
  apiKeyLooksValid = [bool]$apiKeyLooksValid
  dryRunCommand = "npm run mobile:dev-credential:dry-run"
  createCredentialCommand = "npm run mobile:dev-credential"
  serverModeEnv = [ordered]@{
    EXPO_PUBLIC_ORDER_MODE = "server"
    EXPO_PUBLIC_API_KEY = if ($apiKeyLooksValid) { "[set-valid]" } else { "[missing-or-invalid]" }
  }
  blockers = @($blockers)
  nextActions = @(
    "Run npm run mobile:backend-readiness:summary.",
    "Start Docker Desktop and local Postgres if Docker daemon or DB TCP are unavailable.",
    "Run npm run mobile:dev-credential after database readiness passes.",
    "Export the generated EXPO_PUBLIC_API_KEY before successful Samsung server proof."
  )
}

Write-Host "MOBILE CREDENTIAL READINESS"
Write-Host "Ready to create credential: $($summary.readyToCreateCredential)"
Write-Host "Ready for server-backed Samsung proof: $($summary.readyForServerBackedSamsungProof)"
if ($blockers.Count -gt 0) {
  Write-Host "BLOCKERS"
  foreach ($blocker in $blockers) {
    Write-Host "- $blocker"
  }
} else {
  Write-Host "PASS Mobile credential and server-backed Samsung proof prerequisites are ready."
}

if ($SummaryPath.Trim()) {
  $resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
    $SummaryPath
  } else {
    Join-Path $RepoRoot $SummaryPath
  }
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "SUMMARY written to $resolvedSummaryPath"
}
