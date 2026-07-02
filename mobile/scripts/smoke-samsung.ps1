param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8108,
  [string]$ExpoHost = "",
  [switch]$FutureListClose,
  [switch]$FutureListOrder,
  [switch]$FutureListSell,
  [switch]$EventDetailTrade,
  [switch]$EventDetailMarketOutcomeCount,
  [switch]$EventDetailSellDefault,
  [switch]$EventDetailSellDefaultTrade,
  [switch]$OpenOrderCancel,
  [switch]$PortfolioClosedCount,
  [switch]$LiveSummary,
  [switch]$LiveTicket,
  [switch]$LiveOrder,
  [switch]$LiveOrderClose,
  [switch]$LivePortfolioBadgeDeep,
  [switch]$AccountPreferences,
  [switch]$AccountProfileSyncError,
  [switch]$AccountPositionSummary,
  [switch]$ServerUnavailable,
  [switch]$ServerOrderFailure,
  [switch]$ServerOrderSuccess,
  [switch]$ServerOrderFilled,
  [switch]$ServerSellOrderFilled,
  [switch]$ServerOpenOrderCancel,
  [switch]$ServerFilledTradeHistory,
  [switch]$ServerPortfolioFixture,
  [switch]$ServerCloseFixture,
  [switch]$ServerPositionTrade,
  [switch]$ServerPositionBuyTrade,
  [switch]$ServerPositionDetails
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
} elseif ($EventDetailTrade) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailTrade -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($EventDetailMarketOutcomeCount) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailMarketOutcomeCount -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($EventDetailSellDefault) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailSellDefault -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($EventDetailSellDefaultTrade) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailSellDefaultTrade -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($OpenOrderCancel) {
  & "$PSScriptRoot\smoke.ps1" -Deep -OpenOrderCancel -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($PortfolioClosedCount) {
  & "$PSScriptRoot\smoke.ps1" -Deep -PortfolioClosedCount -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($LiveSummary) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveSummary -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($LiveTicket) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveTicket -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($LiveOrder) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveOrder -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($LiveOrderClose) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveOrderClose -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($LivePortfolioBadgeDeep) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LivePortfolioBadgeDeep -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($AccountPreferences) {
  & "$PSScriptRoot\smoke.ps1" -Deep -AccountPreferences -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($AccountProfileSyncError) {
  & "$PSScriptRoot\smoke.ps1" -Deep -AccountProfileSyncError -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($AccountPositionSummary) {
  & "$PSScriptRoot\smoke.ps1" -Deep -AccountPositionSummary -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($ServerUnavailable) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerUnavailable -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($ServerOrderFailure) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerOrderFailure -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory) {
  if (-not $env:EXPO_PUBLIC_API_KEY) {
    throw "EXPO_PUBLIC_API_KEY is required for Samsung server order/history smoke."
  }
  $previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
  $previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
  $env:EXPO_PUBLIC_ORDER_MODE = "server"
  $env:EXPO_PUBLIC_API_BASE_URL = "http://${resolvedExpoHost}:3000"
  try {
    if ($ServerOpenOrderCancel) {
      & "$PSScriptRoot\smoke.ps1" -Deep -ServerOpenOrderCancel -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
    } elseif ($ServerOrderFilled) {
      & "$PSScriptRoot\smoke.ps1" -Deep -ServerOrderFilled -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
    } elseif ($ServerSellOrderFilled) {
      & "$PSScriptRoot\smoke.ps1" -Deep -ServerSellOrderFilled -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
    } elseif ($ServerFilledTradeHistory) {
      & "$PSScriptRoot\smoke.ps1" -Deep -ServerFilledTradeHistory -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
    } else {
      & "$PSScriptRoot\smoke.ps1" -Deep -ServerOrderSuccess -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
    }
  } finally {
    if ($null -eq $previousOrderMode) {
      Remove-Item Env:\EXPO_PUBLIC_ORDER_MODE -ErrorAction SilentlyContinue
    } else {
      $env:EXPO_PUBLIC_ORDER_MODE = $previousOrderMode
    }
    if ($null -eq $previousApiBaseUrl) {
      Remove-Item Env:\EXPO_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue
    } else {
      $env:EXPO_PUBLIC_API_BASE_URL = $previousApiBaseUrl
    }
  }
} elseif ($ServerPortfolioFixture) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerPortfolioFixture -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($ServerCloseFixture) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerCloseFixture -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($ServerPositionTrade) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerPositionTrade -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($ServerPositionBuyTrade) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerPositionBuyTrade -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} elseif ($ServerPositionDetails) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerPositionDetails -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
} else {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureListClose -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -SkipPackageClear
}
