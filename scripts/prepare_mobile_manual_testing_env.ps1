param(
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [string]$ApiBaseUrl = "",
  [string]$OutputDir = ".runtime\mobile-manual-testing",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ResolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
} else {
  Join-Path $RepoRoot $OutputDir
}
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

function Get-LanIp {
  try {
    $candidate = Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.IPAddress -notlike "0.*" -and
        $_.AddressState -eq "Preferred" -and
        $_.InterfaceAlias -notmatch "Tailscale|VMware|WSL|Hyper-V|Bluetooth|Loopback"
      } |
      Sort-Object @{ Expression = { if ($_.PrefixOrigin -eq "Dhcp") { 0 } else { 1 } } }, InterfaceMetric |
      Select-Object -First 1
    if ($candidate -and $candidate.IPAddress) {
      return $candidate.IPAddress
    }
  } catch {
    return ""
  }
  return ""
}

function Read-JsonObjectFromOutput {
  param([string[]]$Lines)
  $jsonStart = -1
  for ($index = 0; $index -lt $Lines.Count; $index += 1) {
    if ($Lines[$index].Trim() -eq "{") {
      $jsonStart = $index
      break
    }
  }
  if ($jsonStart -lt 0) {
    throw "Credential command did not emit a JSON object."
  }
  $depth = 0
  $jsonEnd = -1
  for ($index = $jsonStart; $index -lt $Lines.Count; $index += 1) {
    $line = $Lines[$index]
    $depth += ([regex]::Matches($line, "\{")).Count
    $depth -= ([regex]::Matches($line, "\}")).Count
    if ($depth -eq 0) {
      $jsonEnd = $index
      break
    }
  }
  if ($jsonEnd -lt $jsonStart) {
    throw "Credential command JSON was incomplete."
  }
  return (($Lines[$jsonStart..$jsonEnd] -join "`n") | ConvertFrom-Json)
}

function New-MobileDevCredential {
  Push-Location $RepoRoot
  try {
    $command = if ($DryRun) {
      "npm.cmd run mobile:dev-credential:dry-run"
    } else {
      "npm.cmd run mobile:dev-credential"
    }
    $rawOutput = & cmd /c $command 2>&1
    $lines = @($rawOutput | ForEach-Object { [string]$_ })
    return Read-JsonObjectFromOutput -Lines $lines
  } finally {
    Pop-Location
  }
}

$lanIp = Get-LanIp
if (-not $ApiBaseUrl.Trim()) {
  $ApiBaseUrl = if ($lanIp) { "http://$lanIp`:$BackendPort" } else { "http://127.0.0.1:$BackendPort" }
}
$localBackendBaseUrl = "http://127.0.0.1:$BackendPort"
$credential = New-MobileDevCredential
$token = if ($DryRun) { "" } else { [string]$credential.token }
$keyId = if ($DryRun) { "[dry-run]" } else { [string]$credential.keyId }

$envFilePath = Join-Path $ResolvedOutputDir "server-mode-env.ps1"
$summaryPath = Join-Path $ResolvedOutputDir "summary.json"

if (-not $DryRun) {
  if (-not $token.Trim()) {
    throw "Mobile dev credential did not include a token."
  }
  $escapedApiBaseUrl = $ApiBaseUrl.Replace("'", "''")
  $escapedToken = $token.Replace("'", "''")
  $envFile = @"
# Local-only Holiwyn mobile server-mode environment.
# Do not commit this file. It contains a generated internal mobile API key.
`$env:EXPO_PUBLIC_ORDER_MODE='server'
`$env:EXPO_PUBLIC_MARKET_DATA_MODE='server'
`$env:EXPO_PUBLIC_API_BASE_URL='$escapedApiBaseUrl'
`$env:EXPO_PUBLIC_API_KEY='$escapedToken'
"@
  $envFile | Set-Content -LiteralPath $envFilePath -Encoding UTF8
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  dryRun = [bool]$DryRun
  backendBaseUrl = $localBackendBaseUrl
  mobileApiBaseUrl = $ApiBaseUrl
  expoPort = $ExpoPort
  lanIp = $lanIp
  keyId = $keyId
  username = if ($credential.username) { [string]$credential.username } else { $null }
  targetBalanceUSDT = if ($credential.targetBalanceUSDT) { [string]$credential.targetBalanceUSDT } else { $null }
  envFile = if ($DryRun) { $null } else { $envFilePath.Replace($RepoRoot.Path + "\", "").Replace("\", "/") }
  token = if ($DryRun) { "[dry-run-not-created]" } else { "[redacted]" }
  commands = [ordered]@{
    loadEnvironment = if ($DryRun) { $null } else { ". `"$envFilePath`"" }
    startBackend = "npm run mobile:internal-beta-backend:start -- -Port $BackendPort"
    startExpo = "cd mobile; npm run start -- --host lan --port $ExpoPort"
    strictPreflight = "cd mobile; npm run preflight:server-mode:strict"
    fullRehearsalAlternative = "npm run mobile:mvp-s23:start"
  }
  notes = @(
    "This prepares local fake-token internal MVP testing only.",
    "The generated env file is local-only under .runtime and is intentionally not committed.",
    "Use this when manual S23 server-mode testing needs an EXPO_PUBLIC_API_KEY.",
    "Do not use this for production, deposits, withdrawals, or real-money flows."
  )
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryPath -Encoding UTF8
$summary | ConvertTo-Json -Depth 8
