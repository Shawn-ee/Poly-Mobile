param(
  [string]$SetupSummaryPath = "docs/mobile/harness/cycle-current-mobile-backend-position-order-setup.json",
  [int]$Port = 8186
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$setupPath = Join-Path $repoRoot $SetupSummaryPath
if (-not (Test-Path $setupPath)) {
  throw "Setup summary not found: $SetupSummaryPath"
}

$setup = Get-Content -Raw -Path $setupPath | ConvertFrom-Json
if (-not $setup.credential.token) {
  throw "Setup summary is missing credential.token."
}

$previousApiKey = $env:EXPO_PUBLIC_API_KEY
try {
  $env:EXPO_PUBLIC_API_KEY = $setup.credential.token
  Push-Location (Join-Path $repoRoot "mobile")
  try {
    powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerApiKeyDiagnostic -Port $Port
    if ($LASTEXITCODE -ne 0) {
      throw "Samsung API key diagnostic failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
} finally {
  if ($null -eq $previousApiKey) {
    Remove-Item Env:\EXPO_PUBLIC_API_KEY -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_API_KEY = $previousApiKey
  }
}
