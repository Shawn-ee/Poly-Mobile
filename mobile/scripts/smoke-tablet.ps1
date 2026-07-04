param(
  [string]$Device = "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp",
  [int]$Port = 8181,
  [string]$ExpoHost = "",
  [string]$OutputDir = "docs\mobile\screenshots",
  [string]$HierarchyOutputDir = "docs\mobile\harness",
  [switch]$EventDetailSummary,
  [switch]$EventDetailTrade,
  [switch]$EventDetailChat,
  [switch]$EventDetailActions,
  [switch]$EventDetailMarketTabs,
  [switch]$EventDetailLineAdjustment,
  [switch]$EventDetailLinePortfolio,
  [switch]$EventDetailOrderBook,
  [switch]$EventDetailOrderBookInteractions,
  [switch]$EventDetailOrderBookSelector,
  [switch]$EventDetailFullPage,
  [switch]$DyAGamePageStructure,
  [switch]$EventDetailChart,
  [switch]$ServerLiveDetailOrderBook,
  [switch]$ServerLiveDetailLineOrderBook,
  [switch]$ServerLiveDetailTotalsOrderBook,
  [switch]$ServerLiveDetailTeamTotalsOrderBook,
  [switch]$ServerLiveDetailFirstHalfOrderBook,
  [switch]$ServerLiveDetailSecondHalfOrderBook,
  [switch]$ServerLiveDetailProviderLineOrderBook,
  [switch]$LiveDetail,
  [switch]$EmptyErrorLoading,
  [switch]$WholeAppNavDiscovery,
  [switch]$FutureCardStats,
  [switch]$FutureChartRange,
  [switch]$FutureCatalogExpand,
  [switch]$FutureListTrade,
  [switch]$FutureListBuyNo,
  [switch]$SearchSort
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

if ($EventDetailTrade) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailTrade -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailSummary) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailSummary -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailChat) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailChat -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailActions) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailActions -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailMarketTabs) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailMarketTabs -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailLineAdjustment) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailLineAdjustment -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailLinePortfolio) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailLinePortfolio -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailOrderBookInteractions) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailOrderBookInteractions -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailOrderBookSelector) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailOrderBookInteractions -EventDetailOrderBookSelector -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailFullPage) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailFullPage -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($DyAGamePageStructure) {
  & "$PSScriptRoot\smoke.ps1" -Deep -DyAGamePageStructure -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailChart) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailChart -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($ServerLiveDetailOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002" -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($ServerLiveDetailLineOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailLineOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002"
} elseif ($ServerLiveDetailTotalsOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailTotalsOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002"
} elseif ($ServerLiveDetailTeamTotalsOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailTeamTotalsOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002"
} elseif ($ServerLiveDetailFirstHalfOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailFirstHalfOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002"
} elseif ($ServerLiveDetailSecondHalfOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailSecondHalfOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002"
} elseif ($ServerLiveDetailProviderLineOrderBook) {
  & "$PSScriptRoot\smoke.ps1" -Deep -ServerLiveDetailProviderLineOrderBook -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl "http://127.0.0.1:3002" -ServerEventSlug "cycle-du-a-world-cup-provider-line-depth" -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LiveDetail) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveDetail -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($EmptyErrorLoading) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EmptyErrorLoading -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($WholeAppNavDiscovery) {
  & "$PSScriptRoot\smoke.ps1" -Deep -WholeAppNavDiscovery -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($FutureCardStats) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureCardStats -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($FutureChartRange) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureChartRange -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($FutureCatalogExpand) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureCatalogExpand -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($FutureListTrade) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureListTrade -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($FutureListBuyNo) {
  & "$PSScriptRoot\smoke.ps1" -Deep -FutureListBuyNo -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($SearchSort) {
  & "$PSScriptRoot\smoke.ps1" -Deep -SearchSort -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} else {
  & "$PSScriptRoot\smoke.ps1" -Deep -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
}
