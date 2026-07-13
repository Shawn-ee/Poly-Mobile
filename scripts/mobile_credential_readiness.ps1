param(
  [string]$ReadinessPath = "docs\mobile\harness\cycle-current-mobile-backend-readiness.json",
  [string]$ApiKey = $env:EXPO_PUBLIC_API_KEY,
  [string]$LocalRuntimeEnvPath = ".runtime\mobile-manual-testing\server-mode-env.ps1",
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

$resolvedLocalRuntimeEnvPath = if ([System.IO.Path]::IsPathRooted($LocalRuntimeEnvPath)) {
  $LocalRuntimeEnvPath
} else {
  Join-Path $RepoRoot $LocalRuntimeEnvPath
}

function Read-ExpoApiKeyFromRuntimeEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return ""
  }
  $source = Get-Content -Raw -LiteralPath $Path
  $match = [regex]::Match($source, "EXPO_PUBLIC_API_KEY='([^']+)'")
  if ($match.Success) {
    return $match.Groups[1].Value.Replace("''", "'").Trim()
  }
  return ""
}

function Read-CredentialDryRunJson {
  param([object[]]$Output)
  $lines = @($Output | ForEach-Object { [string]$_ })
  for ($index = 0; $index -lt $lines.Count; $index += 1) {
    if ($lines[$index].Trim() -ne "{") {
      continue
    }
    $depth = 0
    $jsonEnd = -1
    for ($cursor = $index; $cursor -lt $lines.Count; $cursor += 1) {
      $line = $lines[$cursor]
      $depth += ([regex]::Matches($line, "\{")).Count
      $depth -= ([regex]::Matches($line, "\}")).Count
      if ($depth -eq 0) {
        $jsonEnd = $cursor
        break
      }
    }
    if ($jsonEnd -lt $index) {
      continue
    }
    $jsonText = $lines[$index..$jsonEnd] -join "`n"
    try {
      $parsed = $jsonText | ConvertFrom-Json
      if ($parsed.dryRun -eq $true) {
        return $parsed
      }
    } catch {
      continue
    }
  }
  throw "Credential dry-run did not emit a parseable dryRun JSON object."
}

$requiredCredentialScopes = @(
  "orders:read",
  "orders:write",
  "fills:read",
  "account:read",
  "account:write",
  "markets:read"
)
$dryRunScopes = @()
$dryRunIncludesRequiredScopes = $false
$dryRunError = ""
try {
  Push-Location $RepoRoot
  try {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $dryRunOutput = & cmd /c npm.cmd run mobile:dev-credential:dry-run 2>&1
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }
  } finally {
    Pop-Location
  }
  $dryRunSummary = Read-CredentialDryRunJson -Output $dryRunOutput
  $dryRunScopes = @($dryRunSummary.scopes)
  $missingDryRunScopes = @($requiredCredentialScopes | Where-Object { $dryRunScopes -notcontains $_ })
  $dryRunIncludesRequiredScopes = $missingDryRunScopes.Count -eq 0
} catch {
  $dryRunError = $_.Exception.Message
}

$ambientApiKey = if ($null -eq $ApiKey) { "" } else { $ApiKey.Trim() }
$localRuntimeApiKey = if ($ambientApiKey) { "" } else { Read-ExpoApiKeyFromRuntimeEnv -Path $resolvedLocalRuntimeEnvPath }
$trimmedApiKey = if ($ambientApiKey) { $ambientApiKey } else { $localRuntimeApiKey }
$apiKeySource = if ($ambientApiKey) {
  "environment"
} elseif ($localRuntimeApiKey) {
  "local-runtime-env"
} else {
  "missing"
}
$apiKeyLooksValid = $trimmedApiKey -match "^pk_live_[^.]+\..+"
$canCreateCredential = [bool](
  $readiness.dockerCliAvailable -and
  $readiness.dockerDaemonReachable -and
  $readiness.composeFileFound -and
  $readiness.databaseTcpReachable -and
  $readiness.usesDefaultLocalComposePort
)
$canRunServerProof = $canCreateCredential -and $apiKeyLooksValid -and $dryRunIncludesRequiredScopes

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
  $blockers.Add("EXPO_PUBLIC_API_KEY is missing for server-backed Samsung proof; run npm run mobile:manual-testing-env or export a valid key.")
} elseif (-not $apiKeyLooksValid) {
  $blockers.Add("EXPO_PUBLIC_API_KEY must look like pk_live_<id>.<secret>.")
}
if (-not $dryRunIncludesRequiredScopes) {
  if ($dryRunError) {
    $blockers.Add("Mobile dev credential dry-run scope check failed: $dryRunError")
  } else {
    $blockers.Add("Mobile dev credential dry-run is missing required scopes: $(@($requiredCredentialScopes | Where-Object { $dryRunScopes -notcontains $_ }) -join ', ').")
  }
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
  ambientApiKeyPresent = [bool]$ambientApiKey
  localRuntimeEnvPresent = Test-Path -LiteralPath $resolvedLocalRuntimeEnvPath
  localRuntimeApiKeyPresent = [bool]$localRuntimeApiKey
  localRuntimeEnvPath = $resolvedLocalRuntimeEnvPath.Replace($RepoRoot.Path + "\", "").Replace("\", "/")
  apiKeySource = $apiKeySource
  apiKeyLooksValid = [bool]$apiKeyLooksValid
  requiredCredentialScopes = @($requiredCredentialScopes)
  dryRunScopes = @($dryRunScopes)
  dryRunIncludesRequiredScopes = [bool]$dryRunIncludesRequiredScopes
  dryRunError = $dryRunError
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
    "Confirm npm run mobile:dev-credential:dry-run includes account:write before creating new mobile credentials.",
    "Run npm run mobile:manual-testing-env after database readiness passes to create a local-only server-mode env file.",
    "Dot-source .runtime/mobile-manual-testing/server-mode-env.ps1 or export EXPO_PUBLIC_API_KEY before starting Expo for Samsung server proof."
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
