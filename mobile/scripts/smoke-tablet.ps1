param(
  [string]$Device = "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp",
  [int]$Port = 8181,
  [string]$ExpoHost = "",
  [switch]$EventDetailSummary,
  [switch]$EventDetailChat,
  [switch]$EventDetailActions
)

$ErrorActionPreference = "Stop"

function Resolve-LanIpv4 {
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

  throw "Could not detect a LAN IPv4 address. Pass -ExpoHost manually."
}

$resolvedExpoHost = if ($ExpoHost) { $ExpoHost } else { Resolve-LanIpv4 }

Write-Host "Tablet smoke target: $Device"
Write-Host "Expo host: $resolvedExpoHost"
Write-Host "Expo port: $Port"

if ($EventDetailSummary) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailSummary -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($EventDetailChat) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailChat -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($EventDetailActions) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailActions -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} else {
  & "$PSScriptRoot\smoke.ps1" -Deep -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
}
