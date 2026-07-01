param(
  [string]$BackendBaseUrl = "http://127.0.0.1:3000",
  [string]$EmulatorApiBaseUrl = "http://10.0.2.2:3000",
  [string]$ApiKey = $env:EXPO_PUBLIC_API_KEY,
  [switch]$RequireBackend,
  [switch]$RequireApiKey
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

& (Join-Path $PSScriptRoot "check-server-auth-config.ps1")

$trimmedApiKey = if ($null -eq $ApiKey) { "" } else { $ApiKey.Trim() }
if ($RequireApiKey -and -not $trimmedApiKey) {
  throw "EXPO_PUBLIC_API_KEY is required for strict server-mode preflight."
}
if ($trimmedApiKey -and $trimmedApiKey -notmatch "^pk_live_[^.]+\..+") {
  throw "EXPO_PUBLIC_API_KEY must look like <keyId>.<secret> and use a pk_live key id."
}

try {
  $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 4
  if ($health.status -ne "ok") {
    throw "Backend health returned status '$($health.status)'."
  }
  Write-Host "PASS Backend health ok at $BackendBaseUrl"
} catch {
  if ($RequireBackend) {
    throw "Backend health is required but unavailable at ${BackendBaseUrl}: $($_.Exception.Message)"
  }
  Write-Host "WARN Backend health unavailable at $BackendBaseUrl; skipping live server request proof."
}

if ($trimmedApiKey) {
  try {
    $headers = @{ Authorization = "Bearer $trimmedApiKey"; Accept = "application/json" }
    $balance = Invoke-RestMethod -Uri "$BackendBaseUrl/api/account/balance" -Headers $headers -TimeoutSec 4
    Write-Host "PASS Authenticated account balance endpoint responded."
    if ($null -eq $balance) {
      throw "Empty account balance response."
    }
  } catch {
    if ($RequireBackend -or $RequireApiKey) {
      throw "Authenticated account preflight failed: $($_.Exception.Message)"
    }
    Write-Host "WARN Authenticated account preflight skipped/failed without strict mode: $($_.Exception.Message)"
  }
} else {
  Write-Host "WARN EXPO_PUBLIC_API_KEY is empty; live authenticated server request proof skipped."
}

Write-Host "SERVER MODE LAUNCH VARS"
Write-Host "EXPO_PUBLIC_API_BASE_URL=$EmulatorApiBaseUrl"
Write-Host "EXPO_PUBLIC_ORDER_MODE=server"
Write-Host "EXPO_PUBLIC_API_KEY=$(if ($trimmedApiKey) { '[set]' } else { '[missing]' })"
