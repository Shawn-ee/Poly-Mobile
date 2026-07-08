param(
  [string]$BackendBaseUrl = $env:HOLIWYN_BACKEND_BASE_URL,
  [string]$EmulatorApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL,
  [string]$ApiKey = $env:EXPO_PUBLIC_API_KEY,
  [switch]$RequireBackend,
  [switch]$RequireApiKey
)

$ErrorActionPreference = "Stop"

$trimmedBackendBaseUrl = if ($null -eq $BackendBaseUrl -or -not $BackendBaseUrl.Trim()) {
  "http://127.0.0.1:3000"
} else {
  $BackendBaseUrl.Trim().TrimEnd("/")
}

$trimmedEmulatorApiBaseUrl = if ($null -eq $EmulatorApiBaseUrl -or -not $EmulatorApiBaseUrl.Trim()) {
  "http://10.0.2.2:3000"
} else {
  $EmulatorApiBaseUrl.Trim().TrimEnd("/")
}

& (Join-Path $PSScriptRoot "check-server-auth-config.ps1")

$trimmedApiKey = if ($null -eq $ApiKey) { "" } else { $ApiKey.Trim() }
if ($RequireApiKey -and -not $trimmedApiKey) {
  throw "EXPO_PUBLIC_API_KEY is required for strict server-mode preflight."
}
if ($trimmedApiKey -and $trimmedApiKey -notmatch "^pk_live_[^.]+\..+") {
  throw "EXPO_PUBLIC_API_KEY must look like <keyId>.<secret> and use a pk_live key id."
}

try {
  $health = Invoke-RestMethod -Uri "$trimmedBackendBaseUrl/api/health" -TimeoutSec 4
  if ($health.status -ne "ok") {
    throw "Backend health returned status '$($health.status)'."
  }
  Write-Host "PASS Backend health ok at $trimmedBackendBaseUrl"
} catch {
  if ($RequireBackend) {
    throw "Backend health is required but unavailable at ${trimmedBackendBaseUrl}: $($_.Exception.Message)"
  }
  Write-Host "WARN Backend health unavailable at $trimmedBackendBaseUrl; skipping live server request proof."
}

if ($trimmedApiKey) {
  try {
    $headers = @{ Authorization = "Bearer $trimmedApiKey"; Accept = "application/json" }
    $balance = Invoke-RestMethod -Uri "$trimmedBackendBaseUrl/api/account/balance" -Headers $headers -TimeoutSec 4
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
Write-Host "EXPO_PUBLIC_API_BASE_URL=$trimmedEmulatorApiBaseUrl"
Write-Host "EXPO_PUBLIC_ORDER_MODE=server"
Write-Host "EXPO_PUBLIC_API_KEY=$(if ($trimmedApiKey) { '[set]' } else { '[missing]' })"
