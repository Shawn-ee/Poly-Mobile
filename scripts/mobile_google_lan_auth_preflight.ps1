param(
  [int]$BackendPort = 3002,
  [string]$LanIp = "",
  [string]$SummaryPath = "docs\mobile\harness\batch-internal-readiness-latest\google-auth-lan-callback-preflight.json",
  [switch]$RequireConfigured
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

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

$resolvedLanIp = if ($LanIp.Trim()) { $LanIp.Trim() } else { Get-LanIp }
$resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
  $SummaryPath
} else {
  Join-Path $RepoRoot $SummaryPath
}

if (-not $resolvedLanIp) {
  $summary = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    scope = "google-auth-lan-callback-preflight"
    readyForRuntimeStart = $false
    failedChecks = @("LAN IPv4 address is detected")
    lanIp = ""
    backendAuthBase = ""
    nextAuthUrl = ""
    expectedCallback = ""
    notes = @(
      "Could not detect a LAN IPv4 address for S23 Google callback testing.",
      "Pass -LanIp manually or fix the active network adapter before running real S23 consent proof."
    )
  }
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path -LiteralPath $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $resolvedSummaryPath -Encoding UTF8
  $summary | ConvertTo-Json -Depth 8
  exit 1
}

$lanAuthBase = "http://$resolvedLanIp`:$BackendPort"
$argsList = @(
  "-ExecutionPolicy", "Bypass",
  "-File", (Join-Path $RepoRoot "mobile\scripts\google-auth-runtime-preflight.ps1"),
  "-BackendAuthBase", $lanAuthBase,
  "-NextAuthUrl", $lanAuthBase,
  "-RequirePhysicalDeviceCallback",
  "-SummaryPath", $resolvedSummaryPath
)
if ($RequireConfigured) {
  $argsList += "-RequireConfigured"
}

& powershell @argsList
exit $LASTEXITCODE
