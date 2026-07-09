param(
  [string]$Device = "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp",
  [int]$Port = 8181,
  [string]$ExpoHost = "",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$ServerEventSlug = "world-cup-2026-curacao-vs-cote-divoire-2026-06-25",
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
  [switch]$EventDetailOrderBookLifecycle,
  [switch]$BookSnapshotDurability,
  [switch]$EventDetailOrderBookInteractions,
  [switch]$EventDetailOrderBookSelector,
  [switch]$EventDetailFullPage,
  [switch]$DyAGamePageStructure,
  [switch]$EventDetailChart,
  [switch]$EventDetailVisibleLiveParity,
  [switch]$EventDetailVisibleLiveDepth,
  [switch]$EventDetailVisibleLimitLifecycle,
  [switch]$EventDetailVisibleLifecycleBreadth,
  [switch]$EventDetailProviderStatus,
  [switch]$EventDetailVisibleStatusBreadth,
  [switch]$EventDetailVisibleStatusTransition,
  [switch]$ServerLiveDetailOrderBook,
  [switch]$ServerLiveDetailLineOrderBook,
  [switch]$ServerLiveDetailTotalsOrderBook,
  [switch]$ServerLiveDetailTeamTotalsOrderBook,
  [switch]$ServerLiveDetailFirstHalfOrderBook,
  [switch]$ServerLiveDetailSecondHalfOrderBook,
  [switch]$ServerLiveDetailProviderLineOrderBook,
  [switch]$JoMarketRulesProof,
  [switch]$JoCashoutSafetyProof,
  [switch]$LiveSummary,
  [switch]$LiveDetail,
  [switch]$EmptyErrorLoading,
  [switch]$WholeAppNavDiscovery,
  [switch]$LocalMvpRouteDiscoveryDetail,
  [switch]$LocalMvpHomeRouteTicketFlow,
  [switch]$LocalMvpHomeRouteOrderFlow,
  [switch]$LocalMvpHomeRouteServerOrderFlow,
  [switch]$LocalMvpHomeRouteServerCancelFlow,
  [switch]$LocalMvpHomeRouteServerFilledFlow,
  [switch]$LocalMvpHomeRealProviderServerOrderFlow,
  [switch]$FutureCardStats,
  [switch]$FutureChartRange,
  [switch]$FutureCatalogExpand,
  [switch]$FutureListTrade,
  [switch]$FutureListBuyNo,
  [switch]$SearchSort,
  [switch]$LocalMvpTradeFlow,
  [switch]$LocalMvpSellFlow,
  [switch]$LocalMvpStatusFlow,
  [switch]$LocalMvpRouteStatusFlow,
  [switch]$LocalMvpLineFamilyBreadth,
  [switch]$LocalMvpRouteTicketFlow,
  [switch]$LocalMvpRouteServerOrderFlow,
  [switch]$LocalMvpRouteServerCancelFlow,
  [switch]$LocalMvpRouteServerFilledFlow,
  [switch]$LocalMvpCurrentRouteServerFilledFlow,
  [switch]$LocalMvpRouteServerFilledTotalsFlow,
  [switch]$LocalMvpRouteServerFilledTeamTotalFlow,
  [switch]$TradeTicketScreenProofOnly,
  [switch]$HomeFilter
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

function Wake-AndroidProofDevice {
  param([string]$TargetDevice)
  & adb -s $TargetDevice shell input keyevent KEYCODE_WAKEUP | Out-Null
  Start-Sleep -Milliseconds 300
  & adb -s $TargetDevice shell wm dismiss-keyguard | Out-Null
  Start-Sleep -Milliseconds 300
  & adb -s $TargetDevice shell input swipe 540 1800 540 900 250 | Out-Null
  & adb -s $TargetDevice shell settings put global stay_on_while_plugged_in 3 | Out-Null
}

$resolvedExpoHost = if ($ExpoHost) { $ExpoHost } else { Resolve-LanIpv4 }

Write-Host "Android smoke target: $Device"
Write-Host "Expo host: $resolvedExpoHost"
Write-Host "Expo port: $Port"
Wake-AndroidProofDevice -TargetDevice $Device

if ($LocalMvpRouteStatusFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteStatusFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpRouteTicketFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteTicketFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpRouteServerOrderFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteServerOrderFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpRouteServerCancelFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteServerCancelFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpRouteServerFilledFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteServerFilledFlow -TradeTicketScreenProofOnly:$($TradeTicketScreenProofOnly.IsPresent) -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpCurrentRouteServerFilledFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpCurrentRouteServerFilledFlow -TradeTicketScreenProofOnly:$($TradeTicketScreenProofOnly.IsPresent) -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpRouteServerFilledTotalsFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteServerFilledTotalsFlow -TradeTicketScreenProofOnly:$($TradeTicketScreenProofOnly.IsPresent) -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpRouteServerFilledTeamTotalFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteServerFilledTeamTotalFlow -TradeTicketScreenProofOnly:$($TradeTicketScreenProofOnly.IsPresent) -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpHomeRouteServerOrderFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpHomeRouteServerOrderFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpHomeRouteServerCancelFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpHomeRouteServerCancelFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpHomeRouteServerFilledFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpHomeRouteServerFilledFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpHomeRealProviderServerOrderFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpHomeRealProviderServerOrderFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpLineFamilyBreadth) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpLineFamilyBreadth -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($HomeFilter) {
  & "$PSScriptRoot\smoke.ps1" -Deep -HomeFilter -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpStatusFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpStatusFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpSellFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpSellFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpTradeFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpTradeFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailTrade) {
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
} elseif ($EventDetailOrderBookLifecycle) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailOrderBookLifecycle -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($BookSnapshotDurability) {
  & "$PSScriptRoot\smoke.ps1" -Deep -BookSnapshotDurability -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
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
} elseif ($EventDetailVisibleLiveParity) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailVisibleLiveParity -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailVisibleLiveDepth) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailVisibleLiveDepth -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailVisibleLimitLifecycle) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailVisibleLimitLifecycle -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailVisibleLifecycleBreadth) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailVisibleLifecycleBreadth -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailProviderStatus) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailProviderStatus -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailVisibleStatusBreadth) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailVisibleStatusBreadth -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EventDetailVisibleStatusTransition) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EventDetailVisibleStatusTransition -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
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
} elseif ($JoMarketRulesProof) {
  & "$PSScriptRoot\smoke.ps1" -Deep -JoMarketRulesProof -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($JoCashoutSafetyProof) {
  & "$PSScriptRoot\smoke.ps1" -Deep -JoCashoutSafetyProof -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LiveSummary) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveSummary -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LiveDetail) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LiveDetail -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($EmptyErrorLoading) {
  & "$PSScriptRoot\smoke.ps1" -Deep -EmptyErrorLoading -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($WholeAppNavDiscovery) {
  & "$PSScriptRoot\smoke.ps1" -Deep -WholeAppNavDiscovery -Port $Port -Device $Device -ExpoHost $resolvedExpoHost
} elseif ($LocalMvpRouteDiscoveryDetail) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpRouteDiscoveryDetail -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpHomeRouteTicketFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpHomeRouteTicketFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
} elseif ($LocalMvpHomeRouteOrderFlow) {
  & "$PSScriptRoot\smoke.ps1" -Deep -LocalMvpHomeRouteOrderFlow -Port $Port -Device $Device -ExpoHost $resolvedExpoHost -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir
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
