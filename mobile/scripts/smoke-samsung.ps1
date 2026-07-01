param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8108,
  [string]$ExpoHost = "",
  [switch]$FutureListClose,
  [switch]$FutureListOrder,
  [switch]$FutureListSell,
  [switch]$PortfolioClosedCount
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

Write-Host "Samsung smoke target: $Device"
Write-Host "Expo host: $resolvedExpoHost"
Write-Host "Expo port: $Port"

if ($FutureListOrder) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureListOrder -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($FutureListSell) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureListSell -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($PortfolioClosedCount) {
  & "$PSScriptRoot\smoke.ps1" -Deep -PortfolioClosedCount -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} else {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureListClose -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
}
