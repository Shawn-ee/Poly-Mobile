param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$BackendBaseUrl = $env:HOLIWYN_BACKEND_BASE_URL,
  [string]$ApiKey = $env:EXPO_PUBLIC_API_KEY,
  [string]$ExpoHost = "",
  [switch]$RequireBackend,
  [switch]$RequireApiKey
)

$ErrorActionPreference = "Stop"

function Get-DefaultLanHost {
  $addresses = ipconfig |
    Select-String -Pattern "IPv4 Address|IPv4" |
    ForEach-Object {
      $line = $_.Line
      if ($line -match ":\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)") {
        $matches[1]
      }
    } |
    Where-Object {
      $_ -and
      $_ -notlike "127.*" -and
      $_ -notlike "169.254.*" -and
      $_ -notlike "10.0.2.*"
    }

  $preferred = $addresses | Where-Object { $_ -like "172.16.*" } | Select-Object -First 1
  if ($preferred) {
    return $preferred
  }

  $first = $addresses | Select-Object -First 1
  if ($first) {
    return $first
  }

  throw "Could not resolve a LAN IPv4 address for Samsung server-mode launch. Pass -ExpoHost manually."
}

$resolvedExpoHost = if ($ExpoHost.Trim()) { $ExpoHost.Trim() } else { Get-DefaultLanHost }
$deviceApiBaseUrl = "http://${resolvedExpoHost}:3000"

Write-Host "SAMSUNG SERVER MODE PREFLIGHT"
Write-Host "Samsung target: $Device"
Write-Host "Device API base URL: $deviceApiBaseUrl"

adb -s $Device get-state | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Samsung target is not reachable through adb: $Device"
}
Write-Host "PASS Samsung adb target is reachable."

& (Join-Path $PSScriptRoot "server-mode-preflight.ps1") `
  -BackendBaseUrl $BackendBaseUrl `
  -EmulatorApiBaseUrl $deviceApiBaseUrl `
  -ApiKey $ApiKey `
  -RequireBackend:$RequireBackend `
  -RequireApiKey:$RequireApiKey
