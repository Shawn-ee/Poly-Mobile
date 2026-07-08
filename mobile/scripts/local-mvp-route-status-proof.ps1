param(
  [int]$Port = 8268,
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$Device = "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-FA-local-mvp-route-status-flow",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-FA-local-mvp-route-status-flow"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$routeProofPath = Join-Path $repoRoot "docs\mobile\harness\cycle-FA-local-mvp-route-status-flow\cycle-FA-A-provider-status-breadth.json"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $routeProofPath) | Out-Null

Push-Location $repoRoot
try {
  & npx tsx scripts/prove_mobile_ej_a_provider_status_breadth.ts "--output=$routeProofPath"
  if ($LASTEXITCODE -ne 0) {
    throw "Provider status breadth setup failed."
  }

  $routeProof = Get-Content -Raw -Path $routeProofPath | ConvertFrom-Json
  if (-not $routeProof.pass) {
    throw "Provider status breadth route proof did not pass."
  }
  if (-not $routeProof.eventSlug) {
    throw "Provider status breadth proof did not return an eventSlug."
  }

  & "$PSScriptRoot\smoke-tablet.ps1" `
    -LocalMvpRouteStatusFlow `
    -Port $Port `
    -Device $Device `
    -BackendBaseUrl $BackendBaseUrl `
    -ServerEventSlug $routeProof.eventSlug `
    -OutputDir $OutputDir `
    -HierarchyOutputDir $HierarchyOutputDir
  if ($LASTEXITCODE -ne 0) {
    throw "Tablet route-backed retail status proof failed."
  }
} finally {
  Pop-Location
}
