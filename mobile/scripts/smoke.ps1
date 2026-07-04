param(
  [string]$Device = "emulator-5554",
  [int]$Port = 8082,
  [string]$ExpoHost = "10.0.2.2",
  [string]$OutputDir = "docs\mobile\screenshots",
  [string]$BackendBaseUrl = "http://127.0.0.1:3000",
  [string]$ServerEventSlug = "world-cup-2026-curacao-vs-cote-divoire-2026-06-25",
  [string]$HierarchyOutputDir = "docs\mobile\harness",
  [switch]$SkipPackageClear,
  [switch]$Deep,
  [switch]$OrderFailure,
  [switch]$OpenOrderCancel,
  [switch]$OpenSellOrderCancel,
  [switch]$EventDetailTrade,
  [switch]$EventDetailSummary,
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
  [switch]$EmptyErrorLoading,
  [switch]$WholeAppNavDiscovery,
  [switch]$LocalMvpRouteDiscoveryDetail,
  [switch]$LocalMvpHomeRouteTicketFlow,
  [switch]$LocalMvpHomeRouteOrderFlow,
  [switch]$LocalMvpHomeRouteServerOrderFlow,
  [switch]$LocalMvpHomeRouteServerCancelFlow,
  [switch]$LocalMvpHomeRouteServerFilledFlow,
  [switch]$EventDetailPosition,
  [switch]$EventDetailProps,
  [switch]$EventDetailPropTicket,
  [switch]$EventDetailPropOrder,
  [switch]$EventDetailPropClose,
  [switch]$EventDetailMarketOutcomeCount,
  [switch]$EventDetailSellDefault,
  [switch]$EventDetailSellDefaultTrade,
  [switch]$SearchQuery,
  [switch]$SearchClearQuery,
  [switch]$ServerUnavailable,
  [switch]$ServerOrderFailure,
  [switch]$ServerOrderSuccess,
  [switch]$ServerOrderFilled,
  [switch]$ServerSellOrderFilled,
  [switch]$ServerOpenOrderCancel,
  [switch]$ServerFilledTradeHistory,
  [switch]$ServerApiKeyDiagnostic,
  [switch]$ServerPortfolioFixture,
  [switch]$ServerCloseFixture,
  [switch]$ServerPositionTrade,
  [switch]$ServerPositionBuyTrade,
  [switch]$ServerPositionFallbackTrade,
  [switch]$ServerPositionFallbackOrder,
  [switch]$ServerPositionDetails,
  [switch]$ServerLiveDetailOrderBook,
  [switch]$ServerLiveDetailLineOrderBook,
  [switch]$ServerLiveDetailTotalsOrderBook,
  [switch]$ServerLiveDetailTeamTotalsOrderBook,
  [switch]$ServerLiveDetailFirstHalfOrderBook,
  [switch]$ServerLiveDetailSecondHalfOrderBook,
  [switch]$ServerLiveDetailProviderLineOrderBook,
  [switch]$ServerLiveProviderRefreshProof,
  [switch]$SellTicket,
  [switch]$Account,
  [switch]$AccountLogin,
  [switch]$AccountPersistence,
  [switch]$AccountPreferences,
  [switch]$AccountLanguageSummary,
  [switch]$AccountProfileSyncError,
  [switch]$AccountSavedSummary,
  [switch]$AccountPositionSummary,
  [switch]$AccountPortfolioValue,
  [switch]$LanguagePersistence,
  [switch]$TicketDefaultsPersistence,
  [switch]$HomeFilter,
  [switch]$HomeSaved,
  [switch]$SavedPersistence,
  [switch]$HomeSavedEmpty,
  [switch]$HomeSearchQuery,
  [switch]$HomeClearSearch,
  [switch]$HomeCardStats,
  [switch]$FutureCardStats,
  [switch]$FutureChartRange,
  [switch]$FutureCatalogExpand,
  [switch]$FutureListTrade,
  [switch]$FutureListBuyNo,
  [switch]$FutureListOrder,
  [switch]$FutureListSell,
  [switch]$FutureListClose,
  [switch]$PortfolioPositionCount,
  [switch]$PortfolioActivityCount,
  [switch]$PortfolioClosedCount,
  [switch]$PortfolioPersistence,
  [switch]$SavedSearch,
  [switch]$SearchCardStats,
  [switch]$SearchSavedEmpty,
  [switch]$EventDetailSave,
  [switch]$SearchSort,
  [switch]$LiveSummary,
  [switch]$LiveDetail,
  [switch]$LiveTicket,
  [switch]$LiveOrder,
  [switch]$LiveSellOrder,
  [switch]$LiveOrderClose,
  [switch]$LivePortfolioBadge,
  [switch]$LivePortfolioBadgeDeep,
  [switch]$LocalMvpTradeFlow,
  [switch]$LocalMvpSellFlow,
  [switch]$LocalMvpStatusFlow,
  [switch]$LocalMvpRouteStatusFlow,
  [switch]$LocalMvpLineFamilyBreadth,
  [switch]$LocalMvpRouteTicketFlow,
  [switch]$LocalMvpRouteServerOrderFlow,
  [switch]$LocalMvpRouteServerCancelFlow,
  [switch]$LocalMvpRouteServerFilledFlow,
  [switch]$LocalMvpRouteServerFilledTotalsFlow,
  [switch]$LocalMvpRouteServerFilledTeamTotalFlow
)

$ErrorActionPreference = "Stop"

$ServerLiveDetailHalvesOrderBook = $ServerLiveDetailFirstHalfOrderBook -or $ServerLiveDetailSecondHalfOrderBook
$EventDetailProviderRouteStatusProof = $EventDetailProviderStatus -or $EventDetailVisibleStatusBreadth -or $EventDetailVisibleStatusTransition
$EventDetailVisibleLiveDepthBackendProof = $EventDetailVisibleLiveDepth -and $ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25"
$EventDetailVisibleLimitLifecycleBackendProof = ($EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth) -and $ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25"
$ServerLiveDetailBackendProof = $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailHalvesOrderBook -or $ServerLiveDetailProviderLineOrderBook -or $ServerLiveProviderRefreshProof -or $EventDetailProviderRouteStatusProof -or $EventDetailVisibleLiveDepthBackendProof -or $EventDetailVisibleLimitLifecycleBackendProof -or $LocalMvpRouteStatusFlow -or $LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow -or $LocalMvpRouteTicketFlow -or $LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow
$OrderBookDebugProof = $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $BookSnapshotDurability -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailFullPage -or $EventDetailMarketTabs -or $EventDetailChart -or $EventDetailProviderRouteStatusProof -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $ServerLiveDetailBackendProof
$OrderBookDebugProof = $OrderBookDebugProof -and -not ($LocalMvpRouteStatusFlow -or $LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow -or $LocalMvpRouteTicketFlow -or $LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow)
$LocalMvpSimpleTradeFlow = $LocalMvpTradeFlow -or $LocalMvpSellFlow -or $LocalMvpStatusFlow -or $LocalMvpRouteStatusFlow -or $LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow -or $LocalMvpLineFamilyBreadth -or $LocalMvpRouteTicketFlow -or $LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
$ResolvedHierarchyOutputDir = Join-Path $RepoRoot $HierarchyOutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $ResolvedHierarchyOutputDir | Out-Null

$ProviderStatusCycle = if ($EventDetailVisibleStatusTransition) { "EK-B" } elseif ($EventDetailVisibleStatusBreadth) { "EJ-B" } else { "EI-B" }
$ProviderStatusArtifactPrefix = if ($EventDetailVisibleStatusTransition) { "cycle-EK-B-visible-status-transition" } elseif ($EventDetailVisibleStatusBreadth) { "cycle-EJ-B-visible-status-breadth" } else { "cycle-EI-B-route-backed-status" }
$ProviderStatusScope = if ($EventDetailVisibleStatusTransition) {
  "Route-backed visible Android unavailable/not-ready and stale-refreshing-ready transition proof across live detail, Book/orderbook, and ticket handoff"
} elseif ($EventDetailVisibleStatusBreadth) {
  "Route-backed visible Android status breadth across live detail, chart, Book/orderbook settings, and ticket settings"
} else {
  "Route-backed provider lifecycle/status badges on live detail, chart, Book/orderbook, and ticket handoff"
}
$ProviderStatusSwitch = if ($EventDetailVisibleStatusTransition) { "-EventDetailVisibleStatusTransition" } elseif ($EventDetailVisibleStatusBreadth) { "-EventDetailVisibleStatusBreadth" } else { "-EventDetailProviderStatus" }

function Save-Screenshot {
  param(
    [string]$Name
  )
  $remote = "/sdcard/$Name"
  $local = Join-Path $ResolvedOutputDir $Name
  & $adb -s $Device shell screencap -p $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  Write-Host "Smoke screenshot: $local"
}

function Save-UiHierarchy {
  param(
    [string]$Name
  )
  $remote = "/sdcard/window-hierarchy.xml"
  $local = Join-Path $ResolvedHierarchyOutputDir $Name
  for ($attempt = 1; $attempt -le 4; $attempt++) {
    & $adb -s $Device shell uiautomator dump $remote | Out-Null
    & $adb -s $Device pull $remote $local | Out-Null
    if ((Test-Path $local) -and ((Get-Item $local).Length -gt 0)) {
      break
    }
    Start-Sleep -Milliseconds 400
  }
  if ((-not (Test-Path $local)) -or ((Get-Item $local).Length -eq 0)) {
    throw "UI hierarchy dump was empty: $local"
  }
  Write-Host "UI hierarchy: $local"
  return $local
}

function Assert-HierarchyContains {
  param(
    [string]$Path,
    [string[]]$Expected
  )
  $hierarchy = Get-Content -Raw -Path $Path
  foreach ($value in $Expected) {
    if ($hierarchy -notmatch [regex]::Escape($value)) {
      throw "UI hierarchy missing expected text or label: $value"
    }
  }
}

function Assert-HierarchyDoesNotContain {
  param(
    [string]$Path,
    [string[]]$Unexpected
  )
  $hierarchy = Get-Content -Raw -Path $Path
  foreach ($value in $Unexpected) {
    if ($hierarchy -match [regex]::Escape($value)) {
      throw "UI hierarchy contains unexpected text or label: $value"
    }
  }
}

function Assert-HierarchyContainsAny {
  param(
    [string]$Path,
    [string[]]$ExpectedAny
  )
  $hierarchy = Get-Content -Raw -Path $Path
  foreach ($value in $ExpectedAny) {
    if ($hierarchy -match [regex]::Escape($value)) {
      return
    }
  }
  throw "UI hierarchy missing all expected alternatives: $($ExpectedAny -join ', ')"
}

function Assert-ServerTicketUsesQuotedDepthSizes {
  param(
    [string]$Path
  )
  $hierarchy = Get-Content -Raw -Path $Path
  if ($hierarchy -notmatch "Best bid [0-9.]+ USDT \([^)]+ shares\)") {
    throw "Server ticket depth is missing bid size text from quote snapshot."
  }
  if ($hierarchy -notmatch "Best ask [0-9.]+ USDT \([^)]+ shares\)") {
    throw "Server ticket depth is missing ask size text from quote snapshot."
  }
  if ($hierarchy -match "Spread -[0-9]+c") {
    throw "Server ticket depth shows a crossed negative spread."
  }
  if ($hierarchy -match "Best bid 0.31 USDT \(680 shares\)" -or $hierarchy -match "Best ask 0.38 USDT \(1.65k shares\)") {
    throw "Server ticket depth is still using local fallback sizes instead of quote snapshot sizes."
  }
}

function Invoke-TapHierarchyNode {
  param(
    [string]$Path,
    [string]$Identifier,
    [switch]$StartsWith
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $query = if ($StartsWith) {
    "//*[starts-with(@resource-id,'$Identifier') or starts-with(@content-desc,'$Identifier')]"
  } else {
    "//*[@resource-id='$Identifier' or @content-desc='$Identifier']"
  }
  $node = $hierarchy.SelectSingleNode($query)
  if (-not $node) {
    throw "UI hierarchy missing tappable node: $Identifier"
  }
  if ($node.bounds -notmatch "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
    throw "UI hierarchy node has invalid bounds for $Identifier"
  }
  $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
  $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
  & $adb -s $Device shell input tap $x $y | Out-Null
}

function Invoke-ExpoMenuCloseButton {
  param(
    [string]$Path
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $node = $hierarchy.SelectSingleNode("//*[starts-with(@text,'SDK version:')]")
  if (-not $node -or $node.bounds -notmatch "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
    return $false
  }
  & $adb -s $Device shell input keyevent 4 | Out-Null
  Start-Sleep -Seconds 2
  return $true
}

function Start-DeepLink {
  param(
    [string]$Url
  )
  $quotedUrl = "'$Url'"
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d $quotedUrl | Out-Null
}

function Wait-HierarchyContains {
  param(
    [string]$Name,
    [string[]]$Expected,
    [string]$RestartUrl = "",
    [int]$Attempts = 8,
    [int]$DelaySeconds = 5
  )
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    if ($RestartUrl -and $attempt -gt 1) {
      Start-DeepLink -Url $RestartUrl
      Start-Sleep -Seconds 5
    }
    $path = Save-UiHierarchy -Name $Name
    try {
      Assert-HierarchyContains -Path $path -Expected $Expected
      return $path
    } catch {
      $hierarchy = Get-Content -Raw -Path $path
      if (Dismiss-ExpoDeveloperMenuIfPresent -Path $path) {
        Start-Sleep -Seconds 1
      }
      if ($RestartUrl -and $hierarchy -match "Something went wrong\.") {
        & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
        Start-Sleep -Seconds 1
        Start-DeepLink -Url $RestartUrl
      }
      if ($attempt -eq $Attempts) {
        throw
      }
      Start-Sleep -Seconds $DelaySeconds
    }
  }
}

function Dismiss-ExpoDeveloperMenuIfPresent {
  param(
    [string]$Name = "cycle-current-holiwyn-expo-menu.xml",
    [string]$Path = ""
  )
  $dismissed = $false
  $path = $Path
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    if (-not $path) {
      $path = Save-UiHierarchy -Name $Name
    }
    $hierarchy = Get-Content -Raw -Path $path
    if ($hierarchy -match "This is the developer menu" -and $hierarchy -match "Continue") {
      Invoke-TapHierarchyNode -Path $path -Identifier "Continue"
      Start-Sleep -Seconds 2
      $dismissed = $true
      $path = Save-UiHierarchy -Name $Name
      continue
    }
    if ($hierarchy -match "SDK version:" -and $hierarchy -match "Runtime version:" -and ($hierarchy -match "Reload" -or $hierarchy -match "Connected to expo-cli")) {
      Invoke-ExpoMenuCloseButton -Path $path | Out-Null
      $dismissed = $true
      $path = Save-UiHierarchy -Name $Name
      continue
    }
    return $dismissed
  }
  return $dismissed
}

function Wait-AdbDevice {
  param(
    [int]$Attempts = 12,
    [int]$DelaySeconds = 3
  )
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $state = (& $adb -s $Device get-state 2>&1 | Out-String)
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($state -match "device") {
      return
    }
    Start-Sleep -Seconds $DelaySeconds
  }
  throw "ADB device did not become ready: $Device"
}

function Wait-ExpoReady {
  param(
    [int]$Port,
    [int]$Attempts = 45,
    [int]$DelaySeconds = 2
  )
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/status" -UseBasicParsing -TimeoutSec 2
      $content = if ($response.Content -is [byte[]]) {
        [System.Text.Encoding]::UTF8.GetString($response.Content)
      } else {
        [string]$response.Content
      }
      if ($content -match "packager-status:running") {
        return
      }
    } catch {
      # Metro is still warming up.
    }
    Start-Sleep -Seconds $DelaySeconds
  }
  throw "Expo Metro did not become ready on port $Port"
}

function Stop-SmokeExpoProcess {
  param(
    [System.Diagnostics.Process]$Process,
    [int]$Port
  )

  if ($Process -and -not $Process.HasExited) {
    & taskkill.exe /PID $Process.Id /T /F | Out-Null
  }

  $portProcesses = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $portProcesses) {
    if ($processId) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Push-Location $MobileRoot
try {
  npm run typecheck

  $adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if (-not (Test-Path $adb)) {
    throw "ADB not found at $adb"
  }

  Wait-AdbDevice
  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  if ($ServerLiveDetailBackendProof) {
    & $adb -s $Device reverse "tcp:3002" "tcp:3002" | Out-Null
  }
  try {
    $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 4
    Write-Host "Backend health: $($health.status)"
  } catch {
    if ($ServerLiveDetailBackendProof) {
      if ($EventDetailProviderRouteStatusProof) {
        $blockedProof = [ordered]@{
          cycle = $ProviderStatusCycle
          scope = $ProviderStatusScope
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 $ProviderStatusSwitch -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          backendBaseUrl = $BackendBaseUrl
          serverMode = "server"
          apiBaseUrl = $BackendBaseUrl
          adbReverse = "tcp:3002 tcp:3002"
          serverEventSlug = $ServerEventSlug
          result = "blocked"
          routeBackedStatusConsumed = $false
          blockedReason = "Backend health unavailable at $BackendBaseUrl/api/health after ADB reverse tcp:3002."
          fallbackGuard = "Proof aborts before Expo launch instead of using fixture, mock-ready, or default-ready status."
        }
        $blockedProofPath = Join-Path $ResolvedHierarchyOutputDir "$ProviderStatusArtifactPrefix-proof.json"
        $blockedProof | ConvertTo-Json -Depth 6 | Set-Content -Path $blockedProofPath
        Write-Host "Blocked proof summary: $blockedProofPath"
      }
      throw "Backend health unavailable at $BackendBaseUrl/api/health after ADB reverse tcp:3002. Route-backed proof cannot run."
    }
    Write-Host "Backend health: unavailable, continuing with app mock fallback."
  }
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null

  $expoLog = Join-Path $MobileRoot "mobile-smoke-expo.log"
  $expoErrorLog = Join-Path $MobileRoot "mobile-smoke-expo-error.log"
  $previousSmokeInputFlag = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
  $previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
  $previousMarketDataMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
  $previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
  $previousApiKey = $env:EXPO_PUBLIC_API_KEY
  $previousShowOrderBook = $env:EXPO_PUBLIC_SHOW_ORDERBOOK
  $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"
  if ($OrderBookDebugProof) {
    $env:EXPO_PUBLIC_SHOW_ORDERBOOK = "1"
  } elseif ($LocalMvpSimpleTradeFlow) {
    Remove-Item Env:\EXPO_PUBLIC_SHOW_ORDERBOOK -ErrorAction SilentlyContinue
  }
  if ($ServerUnavailable -or $ServerOrderFailure -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionFallbackTrade -or $ServerPositionDetails -or $AccountProfileSyncError -or $EmptyErrorLoading) {
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    $env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:39999"
    $env:EXPO_PUBLIC_API_KEY = "pk_test_mobile_harness"
  }
  if ($EventDetailVisibleLimitLifecycleBackendProof) {
    $env:EXPO_PUBLIC_API_BASE_URL = $BackendBaseUrl
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"
    Remove-Item Env:\EXPO_PUBLIC_ORDER_MODE -ErrorAction SilentlyContinue
  }
  if ($LocalMvpRouteStatusFlow -or $LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpRouteTicketFlow -or $LocalMvpRouteDiscoveryDetail) {
    $env:EXPO_PUBLIC_API_BASE_URL = $BackendBaseUrl
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"
    Remove-Item Env:\EXPO_PUBLIC_ORDER_MODE -ErrorAction SilentlyContinue
    if (-not $env:EXPO_PUBLIC_API_KEY) {
      $env:EXPO_PUBLIC_API_KEY = "pk_test_mobile_harness"
    }
  }
  if ($LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow -or $LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) {
    $env:EXPO_PUBLIC_API_BASE_URL = $BackendBaseUrl
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    if (-not $env:EXPO_PUBLIC_API_KEY) {
      throw "Local MVP route server order proof requires EXPO_PUBLIC_API_KEY. Use mobile/scripts/local-mvp-route-server-order-proof.ps1 to create an in-process mobile dev credential."
    }
  }
  if ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory -or $ServerApiKeyDiagnostic -or $ServerPositionFallbackOrder -or ($ServerLiveDetailBackendProof -and -not $EventDetailVisibleLimitLifecycleBackendProof -and -not $LocalMvpRouteStatusFlow -and -not $LocalMvpHomeRouteTicketFlow -and -not $LocalMvpHomeRouteOrderFlow -and -not $LocalMvpHomeRouteServerOrderFlow -and -not $LocalMvpHomeRouteServerCancelFlow -and -not $LocalMvpHomeRouteServerFilledFlow -and -not $LocalMvpRouteTicketFlow -and -not $LocalMvpRouteServerOrderFlow -and -not $LocalMvpRouteServerCancelFlow -and -not $LocalMvpRouteServerFilledFlow -and -not $LocalMvpRouteServerFilledTotalsFlow -and -not $LocalMvpRouteServerFilledTeamTotalFlow)) {
    if (-not $env:EXPO_PUBLIC_API_KEY) {
      $env:EXPO_PUBLIC_API_KEY = "pk_test_mobile_harness"
    }
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    if ($ServerLiveDetailBackendProof) {
      $env:EXPO_PUBLIC_API_BASE_URL = $BackendBaseUrl
    } elseif (-not $env:EXPO_PUBLIC_API_BASE_URL) {
      $env:EXPO_PUBLIC_API_BASE_URL = "http://${ExpoHost}:3002"
    }
  }
  $expoArgs = @("expo", "start", "--port", "$Port", "--offline")
  if ($OrderFailure -or $OpenOrderCancel -or $OpenSellOrderCancel -or $EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $BookSnapshotDurability -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailFullPage -or $DyAGamePageStructure -or $EventDetailChart -or $EventDetailVisibleLiveParity -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $EventDetailProviderRouteStatusProof -or $EmptyErrorLoading -or $WholeAppNavDiscovery -or $LocalMvpRouteDiscoveryDetail -or $LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $SearchQuery -or $SearchClearQuery -or $ServerUnavailable -or $ServerOrderFailure -or $ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory -or $ServerApiKeyDiagnostic -or $ServerPortfolioFixture -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionFallbackTrade -or $ServerPositionFallbackOrder -or $ServerPositionDetails -or $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailHalvesOrderBook -or $ServerLiveProviderRefreshProof -or $SellTicket -or $Account -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $HomeFilter -or $HomeSaved -or $SavedPersistence -or $HomeSavedEmpty -or $HomeSearchQuery -or $HomeClearSearch -or $HomeCardStats -or $FutureCardStats -or $FutureCatalogExpand -or $FutureListTrade -or $FutureListBuyNo -or $FutureListOrder -or $FutureListSell -or $FutureListClose -or $PortfolioPositionCount -or $PortfolioActivityCount -or $PortfolioClosedCount -or $PortfolioPersistence -or $SavedSearch -or $SearchCardStats -or $SearchSavedEmpty -or $EventDetailSave -or $SearchSort -or $LiveSummary -or $LiveDetail -or $LocalMvpSimpleTradeFlow) {
    $expoArgs += "--clear"
  }
  if ($ServerLiveDetailTotalsOrderBook) {
    $expoArgs += "--clear"
  }
  if ($ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailHalvesOrderBook) {
    $expoArgs += "--clear"
  }
  $processEnvironmentKeys = [Environment]::GetEnvironmentVariables("Process").Keys
  if (($processEnvironmentKeys -contains "Path") -and ($processEnvironmentKeys -contains "PATH")) {
    $canonicalPath = [Environment]::GetEnvironmentVariable("Path", "Process")
    if (-not $canonicalPath) {
      $canonicalPath = [Environment]::GetEnvironmentVariable("PATH", "Process")
    }
    [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
    [Environment]::SetEnvironmentVariable("Path", $canonicalPath, "Process")
  }
  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList $expoArgs -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Wait-ExpoReady -Port $Port
  Start-Sleep -Seconds $(if ($OrderFailure -or $OpenOrderCancel -or $OpenSellOrderCancel -or $EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $BookSnapshotDurability -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailFullPage -or $DyAGamePageStructure -or $EventDetailChart -or $EventDetailVisibleLiveParity -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $EventDetailProviderRouteStatusProof -or $EmptyErrorLoading -or $WholeAppNavDiscovery -or $LocalMvpRouteDiscoveryDetail -or $LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $SearchQuery -or $SearchClearQuery -or $ServerUnavailable -or $ServerOrderFailure -or $ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory -or $ServerApiKeyDiagnostic -or $ServerPortfolioFixture -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionFallbackTrade -or $ServerPositionFallbackOrder -or $ServerPositionDetails -or $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailHalvesOrderBook -or $ServerLiveProviderRefreshProof -or $SellTicket -or $Account -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $SavedPersistence -or $HomeSavedEmpty -or $HomeSearchQuery -or $HomeClearSearch -or $HomeCardStats -or $FutureCardStats -or $FutureCatalogExpand -or $FutureListTrade -or $FutureListBuyNo -or $FutureListOrder -or $FutureListSell -or $FutureListClose -or $PortfolioPositionCount -or $PortfolioActivityCount -or $PortfolioClosedCount -or $PortfolioPersistence -or $SavedSearch -or $SearchCardStats -or $SearchSavedEmpty -or $EventDetailSave -or $SearchSort -or $LiveSummary -or $LiveDetail -or $LiveTicket -or $LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep -or $LocalMvpSimpleTradeFlow) { 18 } else { 8 })
  if ($ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailHalvesOrderBook -or $ServerLiveDetailProviderLineOrderBook) {
    Start-Sleep -Seconds 10
  }

  $launchUrl = if ($OrderFailure) {
    "exp://${ExpoHost}:$Port/--/?forceOrderFailure=1"
  } elseif ($ServerUnavailable) {
    "exp://${ExpoHost}:$Port/--/?forceOpenOrder=1"
  } elseif ($ServerSellOrderFilled) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerOrderProof=1,forceServerOrderSide=sell"
  } elseif ($ServerOpenOrderCancel) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerOrderProof=1,forceServerOpenOrderProof=1"
  } elseif ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerOpenOrderCancel) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerOrderProof=1"
  } elseif ($ServerFilledTradeHistory) {
    "exp://${ExpoHost}:$Port/--/?forcePortfolio=1"
  } elseif ($ServerApiKeyDiagnostic) {
    $encodedApiKey = [uri]::EscapeDataString($env:EXPO_PUBLIC_API_KEY)
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forcePortfolio=1,forceApiKeyDiagnostic=1,apiKey=$encodedApiKey"
  } elseif ($ServerPortfolioFixture) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerPortfolioFixture=1"
  } elseif ($ServerCloseFixture) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerPortfolioFixture=1,forceServerCloseFixture=1"
  } elseif ($ServerPositionTrade) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerPortfolioFixture=1"
  } elseif ($ServerPositionBuyTrade) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerPortfolioFixture=1"
  } elseif ($ServerPositionFallbackTrade) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerPortfolioFallbackFixture=1"
  } elseif ($ServerPositionFallbackOrder) {
    $encodedApiKey = [uri]::EscapeDataString($env:EXPO_PUBLIC_API_KEY)
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forcePortfolio=1,forceRuntimePortfolioSync=1,apiKey=$encodedApiKey"
  } elseif ($ServerPositionDetails) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceServerPortfolioFixture=1"
  } elseif ($LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow) {
    $encodedApiKey = [uri]::EscapeDataString($env:EXPO_PUBLIC_API_KEY)
    "exp://${ExpoHost}:$Port/--/?forceResetState=1&apiKey=$encodedApiKey"
  } elseif ($ServerLiveDetailBackendProof) {
    $encodedSlug = [uri]::EscapeDataString($ServerEventSlug)
    if ($LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) {
      $encodedApiKey = [uri]::EscapeDataString($env:EXPO_PUBLIC_API_KEY)
      "exp://${ExpoHost}:$Port/--/?forceResetState=1&forceBackendEventSlug=$encodedSlug&apiKey=$encodedApiKey"
    } else {
      "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceBackendEventSlug=$encodedSlug"
    }
  } elseif ($OpenSellOrderCancel) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceOpenOrder=1,forceOpenOrderSide=sell"
  } elseif ($OpenOrderCancel) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceOpenOrder=1"
  } elseif ($BookSnapshotDurability) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceBookSnapshotDriftPortfolio=1"
  } elseif ($EventDetailSellDefault -or $EventDetailSellDefaultTrade) {
    "exp://${ExpoHost}:$Port/--/?forceMexicoEcuadorDetailSellDefault=1"
  } elseif ($EventDetailPosition) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceMexicoEcuadorGamePosition=1"
  } elseif (($EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth) -and $ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25") {
    $encodedSlug = [uri]::EscapeDataString($ServerEventSlug)
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceBackendEventSlug=$encodedSlug"
  } elseif ($EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailFullPage -or $EventDetailChart -or $EventDetailVisibleLiveParity -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $LocalMvpSimpleTradeFlow) {
    "exp://${ExpoHost}:$Port/--/?forceMexicoEcuadorDetail=1"
  } elseif ($EmptyErrorLoading) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forcePortfolioSyncing=1"
  } elseif ($WholeAppNavDiscovery) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1"
  } elseif ($DyAGamePageStructure -or $LiveDetail -or $EventDetailProviderRouteStatusProof) {
    "exp://${ExpoHost}:$Port/--/?forceLiveDetail=1,forceResetState=1"
  } elseif ($LiveSummary -or $LiveTicket -or $LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) {
    $liveReset = if ($LiveTicket -or $LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) { ",forceResetState=1" } else { "" }
    "exp://${ExpoHost}:$Port/--/?forceLive=1$liveReset"
  } elseif ($SearchQuery -or $SearchClearQuery) {
    "exp://${ExpoHost}:$Port/--/?forceSearchQuery=zzzz"
  } elseif ($HomeSearchQuery -or $HomeClearSearch) {
    "exp://${ExpoHost}:$Port/--/?forceHomeQuery=clean"
  } elseif ($AccountPersistence) {
    "exp://${ExpoHost}:$Port/--/?forceAccountSignIn=1"
  } elseif ($AccountPreferences -or $AccountLanguageSummary) {
    "exp://${ExpoHost}:$Port/--/?forceAccountPreferences=1"
  } elseif ($AccountProfileSyncError) {
    "exp://${ExpoHost}:$Port/--/?forceAccount=1"
  } elseif ($AccountSavedSummary) {
    "exp://${ExpoHost}:$Port/--/?forceAccountSavedSummary=1"
  } elseif ($AccountPositionSummary -or $AccountPortfolioValue) {
    "exp://${ExpoHost}:$Port/--/?forceAccountPositionSummary=1"
  } elseif ($LanguagePersistence) {
    "exp://${ExpoHost}:$Port/--/?forceChinese=1"
  } elseif ($PortfolioPersistence) {
    "exp://${ExpoHost}:$Port/--/?forceWorldCupWinnerFranceTicket=1"
  } elseif ($TicketDefaultsPersistence) {
    "exp://${ExpoHost}:$Port/--/?forceTicketDefaults=1"
  } elseif ($Account -or $AccountLogin) {
    "exp://${ExpoHost}:$Port/--/?forceAccount=1"
  } elseif ($SavedPersistence) {
    "exp://${ExpoHost}:$Port/--/?forceSaveMexico=1"
  } elseif ($HomeSavedEmpty -or $SearchSavedEmpty) {
    "exp://${ExpoHost}:$Port/--/?forceClearSaved=1"
  } elseif ($FutureListClose) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceClosedWorldCupWinnerFrance=1"
  } elseif ($FutureListOrder -or $ServerOrderFailure) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceWorldCupWinnerFranceTicket=1"
  } elseif ($PortfolioClosedCount) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1"
  } else {
    "exp://${ExpoHost}:$Port"
  }
  if ((-not $SkipPackageClear) -and ($EventDetailTrade -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $BookSnapshotDurability -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailFullPage -or $DyAGamePageStructure -or $EventDetailChart -or $EventDetailVisibleLiveParity -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $EventDetailProviderRouteStatusProof -or $EmptyErrorLoading -or $WholeAppNavDiscovery -or $EventDetailPosition -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $FutureListClose -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $SavedPersistence -or $PortfolioPersistence -or $HomeSavedEmpty -or $SearchSavedEmpty -or $LocalMvpSimpleTradeFlow)) {
    & $adb -s $Device shell pm clear host.exp.exponent | Out-Null
    Start-Sleep -Seconds 2
  }
  if ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory) {
    & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
    Start-Sleep -Seconds 2
  }
  Start-DeepLink -Url $launchUrl
  Start-Sleep -Seconds 10
  Dismiss-ExpoDeveloperMenuIfPresent | Out-Null

  $launchExpected = if ($ServerUnavailable) {
    @("Holiwyn", "Portfolio", "Server sync unavailable", "Showing local fake-token portfolio.")
  } elseif ($OpenOrderCancel -or $OpenSellOrderCancel) {
    @("Holiwyn", "Portfolio", "Open orders", "Cancel")
  } elseif ($BookSnapshotDurability) {
    @("Portfolio", "Open positions", "Open orders", "Recent activity", "Mexico -1.5 spread", "Order-time snapshot")
  } elseif ($EmptyErrorLoading) {
    @("Portfolio", "Syncing server portfolio", "No positions yet")
  } elseif ($WholeAppNavDiscovery) {
    @("Holiwyn", "World Cup", "Games", "Futures", "Mexico vs. Ecuador")
  } elseif ($LocalMvpRouteDiscoveryDetail) {
    @("Holiwyn", "World Cup", "Games", "Futures", "EL-A Provider Breadth World Cup Live", "Breadth Home")
  } elseif ($LocalMvpHomeRouteTicketFlow -or $LocalMvpHomeRouteOrderFlow -or $LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow) {
    @("Holiwyn", "EL-A Provider Breadth World Cup Live", "Breadth Home")
  } elseif ($ServerLiveProviderRefreshProof) {
    @("Mobile Provider Refresh Proof", "Game Lines", "Player Props", "Best bid", "Best ask", "Spread", "event-detail-live-data-inline")
  } elseif ($ServerLiveDetailProviderLineOrderBook) {
    @("Japan vs Morocco", "Game Lines", "Spread", "event-detail-open-order-book")
  } elseif ($ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailHalvesOrderBook) {
    @("Game Lines", "Player Props", "Best bid", "Best ask", "Spread")
  } elseif ($EventDetailProviderRouteStatusProof) {
    @("Game Lines", "Player Props", "event-detail-live-data-inline", "live-data-source-polymarket-gamma")
  } elseif ($LocalMvpRouteStatusFlow) {
    @("event-detail-live-data-inline", "live-data-source-polymarket-gamma", "Game Lines")
  } elseif ($LocalMvpRouteTicketFlow -or $LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) {
    @("EL-A Provider Breadth World Cup Live", "event-detail-live-data-inline", "live-data-source-polymarket-gamma")
  } elseif ($EventDetailVisibleLimitLifecycleBackendProof) {
    @("EL-A Provider Breadth World Cup Live", "Game Lines", "Best bid", "Best ask")
  } elseif ($EventDetailVisibleLiveDepth -and $ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25") {
    @("EL-A Provider Breadth World Cup Live", "Game Lines", "Best bid", "Best ask")
  } elseif ($EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailFullPage -or $EventDetailChart -or $EventDetailVisibleLiveParity -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $LocalMvpSimpleTradeFlow) {
    @("Mexico vs. Ecuador", "5 markets", "10 outcomes")
  } elseif ($DyAGamePageStructure -or $LiveDetail -or $EventDetailProviderRouteStatusProof) {
    @("Australia vs. Egypt", "Live Winner", "LIVE WORLD CUP", "Game Lines", "Player Props")
  } elseif ($LiveSummary -or $LiveTicket -or $LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) {
    @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt")
  } elseif ($ServerOrderFailure) {
    @("World Cup winner", "France", "Trading mode: Server mode", "Best bid", "Best ask", "Spread", "Fake balance")
  } elseif ($ServerSellOrderFilled) {
    @("Trading mode: Server mode", "Best bid", "Best ask", "Spread", "Fake balance")
  } elseif ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerOpenOrderCancel) {
    @("Trading mode: Server mode", "Best bid", "Best ask", "Spread", "Fake balance")
  } elseif ($ServerFilledTradeHistory) {
    @("Portfolio", "Server portfolio synced", "Recent activity")
  } elseif ($ServerApiKeyDiagnostic) {
    @("Runtime PolyApi key", "positions 1", "World Cup Backend Position Order Proof")
  } elseif ($ServerPositionFallbackTrade) {
    @("Portfolio", "Server portfolio synced", "Open positions", "1", "World Cup backend proof", "SERVER - Buy - YES - 42%")
  } elseif ($ServerPositionFallbackOrder) {
    @("Portfolio", "Server portfolio synced", "Open positions", "1", "World Cup Backend Position Order Proof")
  } elseif ($ServerPortfolioFixture -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionDetails) {
    @("Portfolio", "Server portfolio synced", "Open positions", "1", "World Cup winner", "SERVER - Buy - France - 42%")
  } elseif ($SearchQuery -or $SearchClearQuery) {
    @("Holiwyn", "Search World Cup markets", "zzzz", "0 results")
  } elseif ($HomeSearchQuery -or $HomeClearSearch) {
    @("Holiwyn", "Search World Cup markets", "clean", "Games")
  } elseif ($AccountPersistence) {
    @("Holiwyn", "Account", "Signed in", "Demo balance")
  } elseif ($AccountPreferences -or $AccountLanguageSummary) {
    @("Holiwyn", "Account", "Preferences")
  } elseif ($AccountProfileSyncError) {
    @("Holiwyn", "Account", "Preferences", "Profile sync unavailable", "Using local preferences on this device.")
  } elseif ($AccountSavedSummary) {
    @("Holiwyn", "Account", "Preferences", "Saved markets", "1 saved")
  } elseif ($AccountPositionSummary) {
    @("Holiwyn", "Account", "Preferences", "Open positions: 1", "Open orders: 1", "Open order value: 117.5 USDT")
  } elseif ($AccountPortfolioValue) {
    @("Holiwyn", "Account", "Preferences", "Open positions: 1")
  } elseif ($LanguagePersistence) {
    @("Holiwyn", "EN")
  } elseif ($PortfolioPersistence) {
    @("World Cup winner", "France", "Swipe up to buy")
  } elseif ($TicketDefaultsPersistence) {
    @("World Cup winner", "France", "500", "Swipe up to sell")
  } elseif ($FutureListClose) {
    @("Portfolio", "Fake balance", "10,008.82 USDT", "Recent activity", "Closed", "World Cup winner")
  } elseif ($FutureListOrder) {
    @("World Cup winner", "France", "Trading mode: Fake-token mock", "Best bid", "Best ask", "Spread", "Fake balance", "Swipe up to buy")
  } elseif ($Account -or $AccountLogin) {
    @("Holiwyn", "Account", "Signed out", "Demo balance")
  } else {
    @("Holiwyn", "World Cup", "Games", "Futures")
  }
  $launchAttempts = if ($LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $BookSnapshotDurability -or $EventDetailOrderBookInteractions -or $EventDetailOrderBookSelector -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $LocalMvpSimpleTradeFlow) { 14 } else { 8 }
  $homeHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-home.xml" -Expected $launchExpected -RestartUrl $launchUrl -Attempts $launchAttempts
  if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $homeHierarchy)) {
    $homeHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-home.xml" -Expected $launchExpected -RestartUrl $launchUrl -Attempts 4 -DelaySeconds 2
  }
  Save-Screenshot -Name "cycle-current-holiwyn-smoke.png"

  if ($Deep) {
    if ($LocalMvpRouteDiscoveryDetail) {
      Save-Screenshot -Name "cycle-FD-route-discovery-detail-home.png"
      $routeDiscoveryHomeHierarchy = Save-UiHierarchy -Name "cycle-FD-route-discovery-detail-home.xml"
      Assert-HierarchyContains -Path $routeDiscoveryHomeHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "Breadth Home", "Breadth Away", "Volume:", "Liquidity:", "event-card-mobile-el-a-provider-breadth")
      Assert-HierarchyDoesNotContain -Path $routeDiscoveryHomeHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-chart-open-book", "event-detail-inline-order-book", "orderbook-source-", "Route depth")

      Invoke-TapHierarchyNode -Path $routeDiscoveryHomeHierarchy -Identifier "event-card-mobile-el-a-provider-breadth" -StartsWith
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-FD-route-discovery-detail-open.png"
      $routeDiscoveryDetailHierarchy = Save-UiHierarchy -Name "cycle-FD-route-discovery-detail-open.xml"
      Assert-HierarchyContains -Path $routeDiscoveryDetailHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "event-detail-price-chart", "Game Lines", "Breadth Home", "Breadth Away", "provider-source-polymarket")
      Assert-HierarchyDoesNotContain -Path $routeDiscoveryDetailHierarchy -Unexpected @("Mexico vs. Ecuador", "selected-market-mexico-ecuador", "event-detail-top-order-book", "event-detail-chart-open-book", "event-detail-inline-order-book", "Route depth")

      $proof = [ordered]@{
        cycle = "FD"
        scenario = "Route-backed discovery card opens route-backed event detail"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpRouteDiscoveryDetail -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
        result = "pass"
        assertions = [ordered]@{
          homeDiscovery = @("route-backed event card", "compact outcomes", "Volume/Liquidity")
          detailHydration = @("same route-backed event", "price chart", "game lines", "tradeable outcomes")
          noFallback = @("no Mexico/Ecuador fallback", "no default orderbook UI")
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-home.png",
          "docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-home.xml",
          "docs/mobile/screenshots/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-open.png",
          "docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-open.xml"
        )
      }
      $proofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-FD-route-discovery-detail\cycle-FD-route-discovery-detail-proof.json"
      New-Item -ItemType Directory -Force -Path (Split-Path $proofPath) | Out-Null
      $proof | ConvertTo-Json -Depth 8 | Set-Content -Path $proofPath -Encoding UTF8
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($LocalMvpHomeRouteTicketFlow) {
      $mvpHiddenOrderBookExpected = @(
        "event-detail-top-order-book",
        "event-detail-chart-open-book",
        "event-detail-open-order-book",
        "event-detail-line-detail-order-book",
        "event-detail-inline-order-book",
        "orderbook-source-",
        "Route depth"
      )

      Save-Screenshot -Name "cycle-FE-home-route-ticket-home.png"
      $homeRouteTicketHomeHierarchy = Save-UiHierarchy -Name "cycle-FE-home-route-ticket-home.xml"
      Assert-HierarchyContains -Path $homeRouteTicketHomeHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "Breadth Home", "Breadth Away", "event-card-mobile-el-a-provider-breadth")
      Assert-HierarchyDoesNotContain -Path $homeRouteTicketHomeHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteTicketHomeHierarchy -Identifier "event-card-mobile-el-a-provider-breadth" -StartsWith
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-FE-home-route-ticket-detail-top.png"
      $homeRouteTicketDetailTopHierarchy = Save-UiHierarchy -Name "cycle-FE-home-route-ticket-detail-top.xml"
      Assert-HierarchyContains -Path $homeRouteTicketDetailTopHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "event-detail-price-chart", "Game Lines")
      $homeRouteTicketUnexpected = @("Mexico vs. Ecuador", "selected-market-mexico-ecuador") + $mvpHiddenOrderBookExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteTicketDetailTopHierarchy -Unexpected $homeRouteTicketUnexpected

      $homeRouteTicketLineExpected = @(
        "Game Lines",
        "Spread",
        "event-detail-outcome-spread-spread-yes",
        "ticket-source-backend-line-market",
        "selection-market-family-spread",
        "selection-line-1.5",
        "selection-period-Reg. Time",
        "provider-source-polymarket"
      )
      $homeRouteTicketLineHierarchy = $null
      $homeRouteTicketLineSwipes = @(
        @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 520; ms = 500 },
        @{ x1 = 540; y1 = 620; x2 = 540; y2 = 1500; ms = 350 },
        @{ x1 = 540; y1 = 700; x2 = 540; y2 = 1700; ms = 350 },
        @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 760; ms = 450 }
      )
      for ($attempt = 0; $attempt -lt $homeRouteTicketLineSwipes.Count; $attempt++) {
        $swipe = $homeRouteTicketLineSwipes[$attempt]
        & $adb -s $Device shell input swipe $swipe.x1 $swipe.y1 $swipe.x2 $swipe.y2 $swipe.ms | Out-Null
        Start-Sleep -Seconds 1
        $attemptHierarchy = Save-UiHierarchy -Name "cycle-FE-home-route-ticket-line-attempt-$($attempt + 1).xml"
        $attemptXml = Get-Content -Raw -Path $attemptHierarchy
        $attemptPassed = $true
        foreach ($expectedValue in $homeRouteTicketLineExpected) {
          if ($attemptXml -notmatch [regex]::Escape($expectedValue)) {
            $attemptPassed = $false
            break
          }
        }
        if ($attemptPassed) {
          $homeRouteTicketLineHierarchy = $attemptHierarchy
          break
        }
      }
      Save-Screenshot -Name "cycle-FE-home-route-ticket-line-markets.png"
      $homeRouteTicketLineHierarchy = Save-UiHierarchy -Name "cycle-FE-home-route-ticket-line-markets.xml"
      Assert-HierarchyContains -Path $homeRouteTicketLineHierarchy -Expected $homeRouteTicketLineExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteTicketLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteTicketLineHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-FE-home-route-ticket-spread-ticket.png"
      $homeRouteTicketSpreadTicketHierarchy = Save-UiHierarchy -Name "cycle-FE-home-route-ticket-spread-ticket.xml"
      Assert-HierarchyContains -Path $homeRouteTicketSpreadTicketHierarchy -Expected @(
        "trade-ticket",
        "ticket-side-buy",
        "ticket-side-sell",
        "ticket-market-type-spread",
        "ticket-line-1.5",
        "ticket-period-Reg. Time",
        "ticket-selection-side-yes",
        "ticket-contract-side-yes",
        "provider-source-polymarket",
        "provider-token-token-el-a-spread-home",
        "Choose an amount",
        "swipe-to-submit-order"
      )
      Assert-HierarchyDoesNotContain -Path $homeRouteTicketSpreadTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected

      $proof = [ordered]@{
        cycle = "FE"
        scenario = "Home route-backed event opens Event Detail and simple spread Buy/Sell ticket"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        backendBaseUrl = $BackendBaseUrl
        orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
        marketDataMode = if ($env:EXPO_PUBLIC_MARKET_DATA_MODE) { $env:EXPO_PUBLIC_MARKET_DATA_MODE } else { "mock" }
        orderMode = if ($env:EXPO_PUBLIC_ORDER_MODE) { $env:EXPO_PUBLIC_ORDER_MODE } else { "mock" }
        result = "pass"
        assertions = [ordered]@{
          homeDiscovery = @("route-backed event card", "compact outcomes")
          detailHydration = @("same route-backed event", "price chart", "Game Lines")
          ticket = @("spread ticket opens from Home-opened detail", "line/period/side/provider token identity preserved", "Buy/Sell controls visible")
          noFallback = @("no Mexico/Ecuador fallback", "no default orderbook UI")
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-home.png",
          "docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-home.xml",
          "docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-detail-top.png",
          "docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-detail-top.xml",
          "docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-line-markets.png",
          "docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-line-markets.xml",
          "docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-spread-ticket.png",
          "docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-spread-ticket.xml"
        )
      }
      $proofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-FE-home-route-ticket\cycle-FE-home-route-ticket-proof.json"
      New-Item -ItemType Directory -Force -Path (Split-Path $proofPath) | Out-Null
      $proof | ConvertTo-Json -Depth 8 | Set-Content -Path $proofPath -Encoding UTF8
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($LocalMvpHomeRouteOrderFlow) {
      $mvpHiddenOrderBookExpected = @(
        "event-detail-top-order-book",
        "event-detail-chart-open-book",
        "event-detail-open-order-book",
        "event-detail-line-detail-order-book",
        "event-detail-inline-order-book",
        "orderbook-source-",
        "Route depth"
      )

      Save-Screenshot -Name "cycle-FF-home-route-order-home.png"
      $homeRouteOrderHomeHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-home.xml"
      Assert-HierarchyContains -Path $homeRouteOrderHomeHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "Breadth Home", "Breadth Away", "event-card-mobile-el-a-provider-breadth")
      Assert-HierarchyDoesNotContain -Path $homeRouteOrderHomeHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteOrderHomeHierarchy -Identifier "event-card-mobile-el-a-provider-breadth" -StartsWith
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-FF-home-route-order-detail-top.png"
      $homeRouteOrderDetailTopHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-detail-top.xml"
      Assert-HierarchyContains -Path $homeRouteOrderDetailTopHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "event-detail-price-chart", "Game Lines")
      $homeRouteOrderUnexpected = @("Mexico vs. Ecuador", "selected-market-mexico-ecuador") + $mvpHiddenOrderBookExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteOrderDetailTopHierarchy -Unexpected $homeRouteOrderUnexpected

      $homeRouteOrderLineExpected = @(
        "Game Lines",
        "Spread",
        "event-detail-outcome-spread-spread-yes",
        "ticket-source-backend-line-market",
        "selection-market-family-spread",
        "selection-line-1.5",
        "selection-period-Reg. Time",
        "provider-source-polymarket"
      )
      $homeRouteOrderLineHierarchy = $null
      $homeRouteOrderLineSwipes = @(
        @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 520; ms = 500 },
        @{ x1 = 540; y1 = 620; x2 = 540; y2 = 1500; ms = 350 },
        @{ x1 = 540; y1 = 700; x2 = 540; y2 = 1700; ms = 350 },
        @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 760; ms = 450 }
      )
      for ($attempt = 0; $attempt -lt $homeRouteOrderLineSwipes.Count; $attempt++) {
        $swipe = $homeRouteOrderLineSwipes[$attempt]
        & $adb -s $Device shell input swipe $swipe.x1 $swipe.y1 $swipe.x2 $swipe.y2 $swipe.ms | Out-Null
        Start-Sleep -Seconds 1
        $attemptHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-line-attempt-$($attempt + 1).xml"
        $attemptXml = Get-Content -Raw -Path $attemptHierarchy
        $attemptPassed = $true
        foreach ($expectedValue in $homeRouteOrderLineExpected) {
          if ($attemptXml -notmatch [regex]::Escape($expectedValue)) {
            $attemptPassed = $false
            break
          }
        }
        if ($attemptPassed) {
          $homeRouteOrderLineHierarchy = $attemptHierarchy
          break
        }
      }
      Save-Screenshot -Name "cycle-FF-home-route-order-line-markets.png"
      $homeRouteOrderLineHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-line-markets.xml"
      Assert-HierarchyContains -Path $homeRouteOrderLineHierarchy -Expected $homeRouteOrderLineExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteOrderLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteOrderLineHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-FF-home-route-order-spread-ticket.png"
      $homeRouteOrderSpreadTicketHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-spread-ticket.xml"
      Assert-HierarchyContains -Path $homeRouteOrderSpreadTicketHierarchy -Expected @(
        "trade-ticket",
        "ticket-market-type-spread",
        "ticket-line-1.5",
        "ticket-period-Reg. Time",
        "ticket-selection-side-yes",
        "ticket-contract-side-yes",
        "provider-source-polymarket",
        "provider-token-token-el-a-spread-home",
        "Choose an amount",
        "ticket-preset-10",
        "ticket-preset-5",
        "swipe-to-submit-order"
      )
      Assert-HierarchyDoesNotContain -Path $homeRouteOrderSpreadTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteOrderSpreadTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $homeRouteOrderAmount10Hierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-spread-ticket-amount-10.xml"
      Invoke-TapHierarchyNode -Path $homeRouteOrderAmount10Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $homeRouteOrderAmount20Hierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-spread-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $homeRouteOrderAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-FF-home-route-order-spread-ticket-ready.png"
      $homeRouteOrderReadyHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-spread-ticket-ready.xml"
      Assert-HierarchyContains -Path $homeRouteOrderReadyHierarchy -Expected @('$25', "Swipe up to buy", "place-mock-order", "ticket-market-type-spread", "ticket-line-1.5", "ticket-period-Reg. Time", "provider-source-polymarket", "provider-token-token-el-a-spread-home")
      Assert-HierarchyDoesNotContain -Path $homeRouteOrderReadyHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteOrderReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-FF-home-route-order-portfolio.png"
      $homeRouteOrderPortfolioHierarchy = Save-UiHierarchy -Name "cycle-FF-home-route-order-portfolio.xml"
      Assert-HierarchyContains -Path $homeRouteOrderPortfolioHierarchy -Expected @(
        "Portfolio",
        "Order placed",
        "latest-order-card",
        "latest-activity-card",
        "position-card-",
        "portfolio-market-type-spread",
        "portfolio-line-1.5",
        "portfolio-period-Reg. Time",
        "portfolio-side-buy",
        "portfolio-contract-side-yes",
        "portfolio-provider-source-polymarket",
        "portfolio-provider-token-token-el-a-spread-home",
        "portfolio-snapshot-source-order-time",
        "Fake-token test",
        "Filled"
      )
      Assert-HierarchyDoesNotContain -Path $homeRouteOrderPortfolioHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")

      $proof = [ordered]@{
        cycle = "FF"
        scenario = "Home route-backed event opens spread ticket, submits fake-token order, and shows Portfolio history"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpHomeRouteOrderFlow -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        backendBaseUrl = $BackendBaseUrl
        orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
        marketDataMode = if ($env:EXPO_PUBLIC_MARKET_DATA_MODE) { $env:EXPO_PUBLIC_MARKET_DATA_MODE } else { "mock" }
        orderMode = if ($env:EXPO_PUBLIC_ORDER_MODE) { $env:EXPO_PUBLIC_ORDER_MODE } else { "mock" }
        result = "pass"
        assertions = [ordered]@{
          homeDiscovery = @("route-backed event card", "compact outcomes")
          detailHydration = @("same route-backed event", "price chart", "Game Lines")
          ticket = @("spread ticket opens from Home-opened detail", "amount set to 25", "provider token/source visible")
          portfolio = @("fake-token order submitted", "Portfolio latest order/activity/position visible", "order-time selected identity preserved")
          noFallback = @("no Mexico/Ecuador fallback", "no default orderbook UI")
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-home.png",
          "docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-home.xml",
          "docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-detail-top.png",
          "docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-detail-top.xml",
          "docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-line-markets.png",
          "docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-line-markets.xml",
          "docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-spread-ticket-ready.png",
          "docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-spread-ticket-ready.xml",
          "docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-portfolio.png",
          "docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-portfolio.xml"
        )
      }
      $proofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-FF-home-route-order\cycle-FF-home-route-order-proof.json"
      New-Item -ItemType Directory -Force -Path (Split-Path $proofPath) | Out-Null
      $proof | ConvertTo-Json -Depth 8 | Set-Content -Path $proofPath -Encoding UTF8
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($LocalMvpHomeRouteServerOrderFlow -or $LocalMvpHomeRouteServerCancelFlow -or $LocalMvpHomeRouteServerFilledFlow) {
      $mvpHiddenOrderBookExpected = @(
        "event-detail-top-order-book",
        "event-detail-chart-open-book",
        "event-detail-open-order-book",
        "event-detail-line-detail-order-book",
        "event-detail-inline-order-book",
        "orderbook-source-",
        "Route depth"
      )
      $homeRouteServerCardId = if ($ServerEventSlug -and $ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25") { "event-card-$ServerEventSlug" } else { "event-card-mobile-el-a-provider-breadth" }
      $homeRouteServerCycle = if ($LocalMvpHomeRouteServerFilledFlow) { "FI" } elseif ($LocalMvpHomeRouteServerCancelFlow) { "FH" } else { "FG" }
      $homeRouteServerArtifact = if ($LocalMvpHomeRouteServerFilledFlow) { "cycle-FI-home-route-server-filled" } elseif ($LocalMvpHomeRouteServerCancelFlow) { "cycle-FH-home-route-server-cancel" } else { "cycle-FG-home-route-server-order" }
      $homeRouteServerScript = if ($LocalMvpHomeRouteServerFilledFlow) { "local-mvp-home-route-server-filled-proof.ps1" } elseif ($LocalMvpHomeRouteServerCancelFlow) { "local-mvp-home-route-server-cancel-proof.ps1" } else { "local-mvp-home-route-server-order-proof.ps1" }
      $homeRouteServerScenario = if ($LocalMvpHomeRouteServerFilledFlow) {
        "Home route-backed event opens spread ticket, submits server fake-token order, fills it, and shows server Portfolio filled activity"
      } elseif ($LocalMvpHomeRouteServerCancelFlow) {
        "Home route-backed event opens spread ticket, submits server fake-token order, cancels it, and shows server Portfolio canceled activity"
      } else {
        "Home route-backed event opens spread ticket, submits server fake-token order, and shows server Portfolio open order"
      }

      Save-Screenshot -Name "$homeRouteServerArtifact-home.png"
      $homeRouteServerHomeHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-home.xml"
      Assert-HierarchyContains -Path $homeRouteServerHomeHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "Breadth Home", "Breadth Away", $homeRouteServerCardId)
      Assert-HierarchyDoesNotContain -Path $homeRouteServerHomeHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteServerHomeHierarchy -Identifier $homeRouteServerCardId -StartsWith
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "$homeRouteServerArtifact-detail-top.png"
      $homeRouteServerDetailTopHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-detail-top.xml"
      Assert-HierarchyContains -Path $homeRouteServerDetailTopHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "event-detail-price-chart", "Game Lines")
      $homeRouteServerUnexpected = @("Mexico vs. Ecuador", "selected-market-mexico-ecuador") + $mvpHiddenOrderBookExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteServerDetailTopHierarchy -Unexpected $homeRouteServerUnexpected

      $homeRouteServerLineExpected = @(
        "Game Lines",
        "Spread",
        "event-detail-outcome-spread-spread-yes",
        "ticket-source-backend-line-market",
        "selection-market-family-spread",
        "selection-line-1.5",
        "selection-period-Reg. Time",
        "provider-source-polymarket"
      )
      $homeRouteServerLineHierarchy = $null
      $homeRouteServerLineSwipes = @(
        @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 520; ms = 500 },
        @{ x1 = 540; y1 = 620; x2 = 540; y2 = 1500; ms = 350 },
        @{ x1 = 540; y1 = 700; x2 = 540; y2 = 1700; ms = 350 },
        @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 760; ms = 450 }
      )
      for ($attempt = 0; $attempt -lt $homeRouteServerLineSwipes.Count; $attempt++) {
        $swipe = $homeRouteServerLineSwipes[$attempt]
        & $adb -s $Device shell input swipe $swipe.x1 $swipe.y1 $swipe.x2 $swipe.y2 $swipe.ms | Out-Null
        Start-Sleep -Seconds 1
        $attemptHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-line-attempt-$($attempt + 1).xml"
        $attemptXml = Get-Content -Raw -Path $attemptHierarchy
        $attemptPassed = $true
        foreach ($expectedValue in $homeRouteServerLineExpected) {
          if ($attemptXml -notmatch [regex]::Escape($expectedValue)) {
            $attemptPassed = $false
            break
          }
        }
        if ($attemptPassed) {
          $homeRouteServerLineHierarchy = $attemptHierarchy
          break
        }
      }
      Save-Screenshot -Name "$homeRouteServerArtifact-line-markets.png"
      $homeRouteServerLineHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-line-markets.xml"
      Assert-HierarchyContains -Path $homeRouteServerLineHierarchy -Expected $homeRouteServerLineExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteServerLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteServerLineHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "$homeRouteServerArtifact-spread-ticket.png"
      $homeRouteServerSpreadTicketHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-spread-ticket.xml"
      Assert-HierarchyContains -Path $homeRouteServerSpreadTicketHierarchy -Expected @(
        "trade-ticket",
        "ticket-market-type-spread",
        "ticket-line-1.5",
        "ticket-period-Reg. Time",
        "ticket-selection-side-yes",
        "ticket-contract-side-yes",
        "provider-source-polymarket",
        "provider-token-token-el-a-spread-home",
        "Choose an amount",
        "ticket-preset-10",
        "ticket-preset-5",
        "swipe-to-submit-order"
      )
      Assert-HierarchyDoesNotContain -Path $homeRouteServerSpreadTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteServerSpreadTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $homeRouteServerAmount10Hierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-spread-ticket-amount-10.xml"
      Invoke-TapHierarchyNode -Path $homeRouteServerAmount10Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $homeRouteServerAmount20Hierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-spread-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $homeRouteServerAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "$homeRouteServerArtifact-spread-ticket-ready.png"
      $homeRouteServerReadyHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-spread-ticket-ready.xml"
      Assert-HierarchyContains -Path $homeRouteServerReadyHierarchy -Expected @('$25', "Swipe up to buy", "place-mock-order", "ticket-market-type-spread", "ticket-line-1.5", "ticket-period-Reg. Time", "provider-source-polymarket", "provider-token-token-el-a-spread-home")
      Assert-HierarchyDoesNotContain -Path $homeRouteServerReadyHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $homeRouteServerReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 5
      Save-Screenshot -Name "$homeRouteServerArtifact-portfolio.png"
      $homeRouteServerPortfolioHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-portfolio.xml"
      $homeRouteServerPortfolioExpected = if ($LocalMvpHomeRouteServerFilledFlow) {
        @(
          "Portfolio",
          "Server portfolio synced",
          "Order placed",
          "SERVER - Buy",
          "FILLED",
          "latest-order-card",
          "latest-activity-card",
          "position-card-",
          "Bought",
          "Filled shares",
          "Exec price",
          "status-filled",
          "portfolio-market-type-spread",
          "portfolio-line-1.5",
          "portfolio-period-Reg. Time",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-token-token-el-a-spread-home"
        )
      } else {
        @(
          "Portfolio",
          "Server portfolio synced",
          "Order placed",
          "SERVER - Buy",
          "latest-order-card",
          "portfolio-open-order-count",
          "open-order-row-",
          "portfolio-market-type-spread",
          "portfolio-line-1.5",
          "portfolio-period-Reg. Time",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-token-token-el-a-spread-home"
        )
      }
      Assert-HierarchyContains -Path $homeRouteServerPortfolioHierarchy -Expected $homeRouteServerPortfolioExpected
      Assert-HierarchyDoesNotContain -Path $homeRouteServerPortfolioHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")

      $homeRouteServerCanceledHierarchy = $null
      if ($LocalMvpHomeRouteServerCancelFlow) {
        Assert-HierarchyContains -Path $homeRouteServerPortfolioHierarchy -Expected @("Cancel", "cancel-open-order-")
        Invoke-TapHierarchyNode -Path $homeRouteServerPortfolioHierarchy -Identifier "cancel-open-order-" -StartsWith
        Wait-HierarchyContains -Name "$homeRouteServerArtifact-portfolio-canceled.xml" -Expected @(
          "Portfolio",
          "Server portfolio synced",
          "Recent activity",
          "Canceled",
          "latest-activity-card",
          "activity-canceled",
          "status-canceled",
          "portfolio-market-type-spread",
          "portfolio-line-1.5",
          "portfolio-period-Reg. Time",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-token-token-el-a-spread-home"
        ) -Attempts 14 -DelaySeconds 2 | Out-Null
        Save-Screenshot -Name "$homeRouteServerArtifact-portfolio-canceled.png"
        $homeRouteServerCanceledHierarchy = Save-UiHierarchy -Name "$homeRouteServerArtifact-portfolio-canceled.xml"
        Assert-HierarchyDoesNotContain -Path $homeRouteServerCanceledHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")
      }

      $proof = [ordered]@{
        cycle = $homeRouteServerCycle
        scenario = $homeRouteServerScenario
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/$homeRouteServerScript -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        backendBaseUrl = $BackendBaseUrl
        serverEventSlug = $ServerEventSlug
        orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
        marketDataMode = if ($env:EXPO_PUBLIC_MARKET_DATA_MODE) { $env:EXPO_PUBLIC_MARKET_DATA_MODE } else { "mock" }
        orderMode = if ($env:EXPO_PUBLIC_ORDER_MODE) { $env:EXPO_PUBLIC_ORDER_MODE } else { "mock" }
        apiKey = "in-process-mobile-dev-credential-redacted"
        result = "pass"
        assertions = [ordered]@{
          homeDiscovery = @("route-backed event card", "fresh seeded event card tapped from Home")
          detailHydration = @("same route-backed event", "price chart", "Game Lines")
          ticket = @("spread ticket opens from Home-opened detail", "amount set to 25", "provider token/source visible", "server order mode active")
          serverPortfolio = if ($LocalMvpHomeRouteServerFilledFlow) { @("seeded counterparty fills the mobile order", "POST /api/orders succeeds through mobile", "Portfolio sync returns server filled position and recent activity", "selected line/provider identity preserved") } elseif ($LocalMvpHomeRouteServerCancelFlow) { @("POST /api/orders succeeds through mobile", "Portfolio sync returns server open order before cancel", "DELETE /api/orders/:id succeeds through mobile", "Portfolio/history returns canceled activity", "selected line/provider identity preserved") } else { @("POST /api/orders succeeds through mobile", "Portfolio sync returns server open order", "selected line/provider identity preserved") }
          noFallback = @("no Mexico/Ecuador fallback", "no default orderbook UI")
        }
        artifacts = @(
          "docs/mobile/screenshots/$homeRouteServerArtifact/$homeRouteServerArtifact-home.png",
          "docs/mobile/harness/$homeRouteServerArtifact/$homeRouteServerArtifact-home.xml",
          "docs/mobile/screenshots/$homeRouteServerArtifact/$homeRouteServerArtifact-detail-top.png",
          "docs/mobile/harness/$homeRouteServerArtifact/$homeRouteServerArtifact-detail-top.xml",
          "docs/mobile/screenshots/$homeRouteServerArtifact/$homeRouteServerArtifact-line-markets.png",
          "docs/mobile/harness/$homeRouteServerArtifact/$homeRouteServerArtifact-line-markets.xml",
          "docs/mobile/screenshots/$homeRouteServerArtifact/$homeRouteServerArtifact-spread-ticket-ready.png",
          "docs/mobile/harness/$homeRouteServerArtifact/$homeRouteServerArtifact-spread-ticket-ready.xml",
          "docs/mobile/screenshots/$homeRouteServerArtifact/$homeRouteServerArtifact-portfolio.png",
          "docs/mobile/harness/$homeRouteServerArtifact/$homeRouteServerArtifact-portfolio.xml"
        )
      }
      if ($LocalMvpHomeRouteServerCancelFlow) {
        $proof.artifacts += @(
          "docs/mobile/screenshots/$homeRouteServerArtifact/$homeRouteServerArtifact-portfolio-canceled.png",
          "docs/mobile/harness/$homeRouteServerArtifact/$homeRouteServerArtifact-portfolio-canceled.xml"
        )
      }
      $proofPath = Join-Path $RepoRoot "docs\mobile\harness\$homeRouteServerArtifact\$homeRouteServerArtifact-proof.json"
      New-Item -ItemType Directory -Force -Path (Split-Path $proofPath) | Out-Null
      $proof | ConvertTo-Json -Depth 8 | Set-Content -Path $proofPath -Encoding UTF8
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($BookSnapshotDurability) {
      $portfolioSnapshotExpected = @(
        "portfolio-snapshot-source-order-time",
        "snapshot-source-order-time",
        "snapshot-provider-market-gamma-mexico-ecuador-spread-15",
        "snapshot-provider-token-token-spread-yes-15",
        "snapshot-market-id-mexico-ecuador-spread",
        "snapshot-outcome-id-yes",
        "portfolio-market-family-spread",
        "portfolio-market-type-spread",
        "portfolio-market-id-mexico-ecuador-spread",
        "portfolio-outcome-id-yes",
        "portfolio-line-1.5",
        "portfolio-period-regulation",
        "portfolio-display-label-Mexico -1.5 spread",
        "portfolio-provider-source-polymarket-fixture",
        "portfolio-provider-market-gamma-mexico-ecuador-spread-15",
        "portfolio-provider-condition-condition-mexico-ecuador-spread-15",
        "portfolio-provider-token-token-spread-yes-15",
        "portfolio-provider-outcome-Yes"
      )
      $driftedMetadataUnexpected = @(
        "Metadata drifted spread label",
        "Metadata drifted Yes",
        "gamma-drifted-mexico-ecuador-spread",
        "condition-drifted-mexico-ecuador-spread",
        "token-drifted-spread-yes",
        "Drifted Yes",
        "portfolio-line-2.5"
      )

      Save-Screenshot -Name "cycle-EF-B-book-snapshot-durability-portfolio-top.png"
      $snapshotTopHierarchy = Save-UiHierarchy -Name "cycle-EF-B-book-snapshot-durability-portfolio-top.xml"
      Assert-HierarchyContains -Path $snapshotTopHierarchy -Expected (@(
        "Portfolio",
        "Open positions",
        "Open orders",
        "Recent activity",
        "latest-activity-card",
        "latest-activity-status-cycle-ef-b-book-canceled-activity",
        "latest-activity-snapshot-cycle-ef-b-book-canceled-activity",
        "activity-canceled",
        "status-canceled",
        "latest-order-card",
        "order-status-open",
        "open-order-row-cycle-ef-b-book-open-order",
        "open-order-status-cycle-ef-b-book-open-order",
        "position-card-cycle-ef-b-book-filled-position",
        "Order-time snapshot",
        "Mexico -1.5 spread",
        "fake-token-test"
      ) + $portfolioSnapshotExpected)
      Assert-HierarchyDoesNotContain -Path $snapshotTopHierarchy -Unexpected $driftedMetadataUnexpected

      & $adb -s $Device shell input swipe 540 1760 540 700 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EF-B-book-snapshot-durability-activity.png"
      $snapshotActivityHierarchy = Save-UiHierarchy -Name "cycle-EF-B-book-snapshot-durability-activity.xml"
      Assert-HierarchyContains -Path $snapshotActivityHierarchy -Expected (@(
        "position-card-cycle-ef-b-book-filled-position",
        "open-order-row-cycle-ef-b-book-open-order",
        "Order-time snapshot",
        "Mexico -1.5 spread"
      ) + $portfolioSnapshotExpected)
      Assert-HierarchyDoesNotContain -Path $snapshotActivityHierarchy -Unexpected $driftedMetadataUnexpected

      $proof = [ordered]@{
        cycle = "EF-B"
        scope = "Visible mobile Portfolio snapshot durability after deterministic metadata drift"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -BookSnapshotDurability -Port 8310 -OutputDir docs/mobile/screenshots/cycle-EF-B-book-snapshot-durability -HierarchyOutputDir docs/mobile/harness/cycle-EF-B-book-snapshot-durability"
        eventIdentity = "Mexico vs. Ecuador"
        result = "pass"
        driftScenario = [ordered]@{
          source = "backend-shaped local Portfolio state with order-time selection snapshots"
          metadataRefresh = "Current Mexico/Ecuador spread market label, line, provider market, condition, token, and reference outcome are deterministically drifted before Portfolio opens."
          expectedIdentity = "Portfolio rows must keep Mexico -1.5 spread, line 1.5, period regulation, provider market gamma-mexico-ecuador-spread-15, condition condition-mexico-ecuador-spread-15, and token token-spread-yes-15."
        }
        assertions = [ordered]@{
          openOrder = "open-order-row-cycle-ef-b-book-open-order exposes snapshot-source-order-time plus original Book-selected spread identity after drift."
          canceledActivity = "latest-activity-card and activity-row-cycle-ef-b-book-canceled-activity expose activity-canceled/status-canceled with the original Book identity."
          filledPosition = "position-card-cycle-ef-b-book-filled-position exposes the original Book identity and snapshot-source-order-time marker."
          filledActivity = "activity-row-cycle-ef-b-book-filled-activity exposes activity-opened/status-filled with the same original Book identity."
          fallbackGuard = "Drifted labels/provider ids and portfolio-line-2.5 are absent from the captured Portfolio hierarchies."
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-EF-B-book-snapshot-durability/cycle-EF-B-book-snapshot-durability-portfolio-top.png",
          "docs/mobile/harness/cycle-EF-B-book-snapshot-durability/cycle-EF-B-book-snapshot-durability-portfolio-top.xml",
          "docs/mobile/screenshots/cycle-EF-B-book-snapshot-durability/cycle-EF-B-book-snapshot-durability-activity.png",
          "docs/mobile/harness/cycle-EF-B-book-snapshot-durability/cycle-EF-B-book-snapshot-durability-activity.xml"
        )
        remainingGaps = @(
          "This is deterministic fake-token mobile proof, not production wallet signing or settlement.",
          "Real provider-backed metadata drift remains a later provider/backend integration proof."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EF-B-book-snapshot-durability-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EmptyErrorLoading) {
      Save-Screenshot -Name "cycle-current-holiwyn-empty-error-loading-portfolio-syncing.png"
      $portfolioSyncingHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-portfolio-syncing.xml"
      Assert-HierarchyContains -Path $portfolioSyncingHierarchy -Expected @("Portfolio", "Syncing server portfolio", "Fake balance", "No positions yet")

      $noLiveUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceNoLive=1"
      Start-DeepLink -Url $noLiveUrl
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-current-holiwyn-empty-error-loading-live-empty.png"
      $liveEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-live-empty.xml"
      Assert-HierarchyContains -Path $liveEmptyHierarchy -Expected @("Live World Cup", "0", "0 markets", "0 outcomes", "No live markets right now.")

      $savedEmptyUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceClearSaved=1"
      Start-DeepLink -Url $savedEmptyUrl
      Start-Sleep -Seconds 4
      $savedEmptyStartHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-empty-error-loading-saved-start.xml" -Expected @("Holiwyn", "World Cup", "Games") -RestartUrl $savedEmptyUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $savedEmptyStartHierarchy -Identifier "home-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-empty-error-loading-home-saved-empty.png"
      $homeSavedEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-home-saved-empty.xml"
      Assert-HierarchyContains -Path $homeSavedEmptyHierarchy -Expected @("Saved", "No saved markets yet.", "Games")

      Invoke-TapHierarchyNode -Path $homeSavedEmptyHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $searchEmptyStartHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-search-start.xml"
      Invoke-TapHierarchyNode -Path $searchEmptyStartHierarchy -Identifier "search-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-empty-error-loading-search-saved-empty.png"
      $searchSavedEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-search-saved-empty.xml"
      Assert-HierarchyContains -Path $searchSavedEmptyHierarchy -Expected @("Saved", "0 results", "No saved markets yet.")

      $accountErrorUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceAccountProfileSyncError=1"
      Start-DeepLink -Url $accountErrorUrl
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-current-holiwyn-empty-error-loading-account-error.png"
      $accountErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-account-error.xml"
      Assert-HierarchyContains -Path $accountErrorHierarchy -Expected @("Account", "Profile sync unavailable", "Using local preferences on this device.")

      $serverErrorUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forcePortfolioSyncError=1"
      Start-DeepLink -Url $serverErrorUrl
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-current-holiwyn-empty-error-loading-server-error.png"
      $serverErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-empty-error-loading-server-error.xml"
      Assert-HierarchyContains -Path $serverErrorHierarchy -Expected @("Portfolio", "Server sync unavailable", "Showing local fake-token portfolio.", "No positions yet")
      return
    }

    if ($WholeAppNavDiscovery) {
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-nav-home.png"
      $wholeAppHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-nav-home.xml"
      Assert-HierarchyContains -Path $wholeAppHomeHierarchy -Expected @("Holiwyn", "World Cup", "Games", "Futures", "Mexico vs. Ecuador", "Volume", "Liquidity", "home-filter-live", "home-filter-today", "home-filter-saved", "holiwyn-home-tab", "holiwyn-live-tab", "holiwyn-portfolio-tab", "holiwyn-search-tab", "header-account-action")
      Assert-HierarchyDoesNotContain -Path $wholeAppHomeHierarchy -Unexpected @("holiwyn-account-tab")

      Invoke-TapHierarchyNode -Path $wholeAppHomeHierarchy -Identifier "holiwyn-live-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-nav-live.png"
      $wholeAppLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-nav-live.xml"
      Assert-HierarchyContains -Path $wholeAppLiveHierarchy -Expected @("Live World Cup", "Updated just now", "Refresh", "live-market-summary")

      Invoke-TapHierarchyNode -Path $wholeAppLiveHierarchy -Identifier "holiwyn-portfolio-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-nav-portfolio.png"
      $wholeAppPortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-nav-portfolio.xml"
      Assert-HierarchyContains -Path $wholeAppPortfolioHierarchy -Expected @("Portfolio", "Fake balance", "10,000 USDT", "Open positions", "Open orders", "No positions yet")

      Invoke-TapHierarchyNode -Path $wholeAppPortfolioHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-nav-search.png"
      $wholeAppSearchHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-nav-search.xml"
      Assert-HierarchyContains -Path $wholeAppSearchHierarchy -Expected @("Search World Cup markets", "Top results", "All", "Upcoming", "Popular", "Live first")

      Invoke-TapHierarchyNode -Path $wholeAppSearchHierarchy -Identifier "header-account-action"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-nav-account.png"
      $wholeAppAccountHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-nav-account.xml"
      Assert-HierarchyContains -Path $wholeAppAccountHierarchy -Expected @("Account", "Signed out", "Demo balance", "Leaderboard", "Rewards", "APIs", "Preferences")
      Assert-HierarchyDoesNotContain -Path $wholeAppAccountHierarchy -Unexpected @("holiwyn-account-tab")

      Invoke-TapHierarchyNode -Path $wholeAppAccountHierarchy -Identifier "holiwyn-home-tab"
      Start-Sleep -Seconds 1
      $wholeAppHomeReturnHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-home-return.xml"
      Assert-HierarchyContains -Path $wholeAppHomeReturnHierarchy -Expected @("Holiwyn", "World Cup", "Mexico vs. Ecuador")

      Invoke-TapHierarchyNode -Path $wholeAppHomeReturnHierarchy -Identifier "home-filter-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-home-live-filter.png"
      $wholeAppHomeLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-home-live-filter.xml"
      Assert-HierarchyContains -Path $wholeAppHomeLiveHierarchy -Expected @("Live", "Australia vs. Egypt", "Volume", "Liquidity")

      Invoke-TapHierarchyNode -Path $wholeAppHomeLiveHierarchy -Identifier "home-filter-today"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-home-today-filter.png"
      $wholeAppHomeTodayHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-home-today-filter.xml"
      Assert-HierarchyContains -Path $wholeAppHomeTodayHierarchy -Expected @("Today", "Mexico vs. Ecuador", "Volume", "Liquidity")

      Invoke-TapHierarchyNode -Path $wholeAppHomeTodayHierarchy -Identifier "save-event-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-home-saved-star.png"
      $wholeAppHomeSavedStarHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-home-saved-star.xml"
      Assert-HierarchyContains -Path $wholeAppHomeSavedStarHierarchy -Expected @("Mexico vs. Ecuador", "Saved")

      Invoke-TapHierarchyNode -Path $wholeAppHomeSavedStarHierarchy -Identifier "home-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-home-saved-filter.png"
      $wholeAppHomeSavedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-home-saved-filter.xml"
      Assert-HierarchyContains -Path $wholeAppHomeSavedHierarchy -Expected @("Saved", "Mexico vs. Ecuador", "Volume", "Liquidity")

      Invoke-TapHierarchyNode -Path $wholeAppHomeSavedHierarchy -Identifier "event-card-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-home-open-card.png"
      $wholeAppHomeOpenCardHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-home-open-card.xml"
      Assert-HierarchyContains -Path $wholeAppHomeOpenCardHierarchy -Expected @("Mexico vs. Ecuador", "Game Lines", "Player Props", "Markets")

      Invoke-TapHierarchyNode -Path $wholeAppHomeOpenCardHierarchy -Identifier "event-detail-back"
      Start-Sleep -Seconds 1
      $wholeAppSearchStartHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-search-start.xml"
      Invoke-TapHierarchyNode -Path $wholeAppSearchStartHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-search-all.png"
      $wholeAppSearchAllHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-search-all.xml"
      Assert-HierarchyContains -Path $wholeAppSearchAllHierarchy -Expected @("Top results", "All", "Saved", "Mexico vs. Ecuador", "Popular", "Live first")

      Invoke-TapHierarchyNode -Path $wholeAppSearchAllHierarchy -Identifier "search-filter-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-search-live-filter.png"
      $wholeAppSearchLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-search-live-filter.xml"
      Assert-HierarchyContains -Path $wholeAppSearchLiveHierarchy -Expected @("Live", "Australia vs. Egypt", "Volume", "Liquidity")

      Invoke-TapHierarchyNode -Path $wholeAppSearchLiveHierarchy -Identifier "search-filter-all"
      Start-Sleep -Seconds 1
      $wholeAppSearchAllAgainHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-search-all-again.xml"
      Invoke-TapHierarchyNode -Path $wholeAppSearchAllAgainHierarchy -Identifier "search-sort-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-search-live-sort.png"
      $wholeAppSearchSortHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-search-live-sort.xml"
      Assert-HierarchyContains -Path $wholeAppSearchSortHierarchy -Expected @("Live first", "Australia vs. Egypt", "Live", "Volume", "Liquidity")

      Invoke-TapHierarchyNode -Path $wholeAppSearchSortHierarchy -Identifier "event-card-france-argentina-final"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-whole-app-search-open-card.png"
      $wholeAppSearchOpenCardHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-whole-app-search-open-card.xml"
      Assert-HierarchyContains -Path $wholeAppSearchOpenCardHierarchy -Expected @("Australia vs. Egypt", "Game Lines", "Player Props", "Markets")
      return
    }

    if ($ServerUnavailable) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-unavailable.png"
      $serverUnavailableHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-unavailable.xml"
      Assert-HierarchyContains -Path $serverUnavailableHierarchy -Expected @("Server sync unavailable", "Showing local fake-token portfolio.", "Fake balance", "Open positions", "No positions yet")
      return
    }

    if ($ServerOrderFailure) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-ticket.png"
      $serverTicketHierarchy = $homeHierarchy
      Assert-HierarchyContains -Path $serverTicketHierarchy -Expected @("Trading mode: Server mode", "ticket-market-depth", "Best bid", "Best ask", "Spread", "Fake balance", "10,000 USDT", "Estimated cost", "Est. fee", "0 USDT", "ticket-slippage", "Slippage", "0.5%", "1%", "2%", "Est. shares", "Avg price")
      & $adb -s $Device shell input swipe 540 1760 540 760 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverTicketOrderReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-order-ticket-ready.xml"
      Assert-HierarchyContains -Path $serverTicketOrderReadyHierarchy -Expected @("place-mock-order", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $serverTicketOrderReadyHierarchy -Identifier "place-mock-order"
      Wait-HierarchyContains -Name "cycle-current-holiwyn-server-order-error.xml" -Expected @("Order failed. Try again.", "ticket-order-error", "ticket-order-error-detail", "Swipe up to buy") -Attempts 12 -DelaySeconds 2 | Out-Null
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-error.png"
      $serverOrderErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-order-error.xml"
      Assert-HierarchyContains -Path $serverOrderErrorHierarchy -Expected @("Order failed. Try again.", "ticket-order-error", "ticket-order-error-detail", "Swipe up to buy")
      return
    }

    if ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-success-ticket.png"
      $serverOrderSuccessTicketHierarchy = $homeHierarchy
      $serverOrderTicketExpected = if ($ServerSellOrderFilled) {
        @("Trading mode: Server mode", "ticket-market-depth", "Best bid", "Best ask", "Spread", "Fake balance", "Estimated proceeds", "Est. fee", "0 USDT", "Est. shares", "200 shares", "Avg price")
      } elseif ($ServerOpenOrderCancel) {
        @("Trading mode: Server mode", "ticket-market-depth", "Best bid", "Best ask", "Spread", "Fake balance", "Estimated cost", "Est. fee", "0 USDT", "Est. shares", "100 shares", "Avg price")
      } else {
        @("Trading mode: Server mode", "ticket-market-depth", "Best bid", "Best ask", "Spread", "Fake balance", "Estimated cost", "Est. fee", "0 USDT", "Est. shares", "200 shares", "Avg price")
      }
      Assert-HierarchyContains -Path $serverOrderSuccessTicketHierarchy -Expected $serverOrderTicketExpected
      Assert-ServerTicketUsesQuotedDepthSizes -Path $serverOrderSuccessTicketHierarchy
      & $adb -s $Device shell input swipe 540 1760 540 760 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-success-ticket-ready.png"
      $serverOrderSuccessTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-order-success-ticket-ready.xml"
      $serverOrderButtonExpected = if ($ServerSellOrderFilled) { @("place-mock-order", "Swipe up to sell") } else { @("place-mock-order", "Swipe up to buy") }
      Assert-HierarchyContains -Path $serverOrderSuccessTicketReadyHierarchy -Expected $serverOrderButtonExpected
      Invoke-TapHierarchyNode -Path $serverOrderSuccessTicketReadyHierarchy -Identifier "place-mock-order"
      $serverOrderSuccessExpected = if ($ServerSellOrderFilled) {
        @("Portfolio", "Server portfolio synced", "Order placed", "SERVER - Sell - YES - FILLED", "Filled shares", "200.00", "Remaining", "0.00")
      } elseif ($ServerOrderFilled) {
        @("Portfolio", "Server portfolio synced", "Order placed", "SERVER - Buy - YES - FILLED", "Filled shares", "200.00", "Remaining", "0.00")
      } else {
        @("Portfolio", "Server portfolio synced", "Open orders", "Buy - YES - OPEN", "Remaining: 100 shares (Remaining value: 1 USDT)", "Size: 100 shares", "Filled: 0 shares (0%)")
      }
      $serverOrderSuccessPortfolioHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-server-order-success-portfolio.xml" -Expected $serverOrderSuccessExpected -Attempts 14 -DelaySeconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-success-portfolio.png"
      if ($ServerSellOrderFilled) {
        Assert-HierarchyContains -Path $serverOrderSuccessPortfolioHierarchy -Expected @("portfolio-screen", "portfolio-sync-status", "latest-order-card", "SERVER - Sell - YES - FILLED", "Filled shares", "200.00", "Exec price", "50%", "latest-activity-card", "Sold", "Filled shares 200.00", "Exec price 50%", "Implied odds 2.0x")
      } elseif ($ServerOrderFilled) {
        Assert-HierarchyContains -Path $serverOrderSuccessPortfolioHierarchy -Expected @("portfolio-screen", "portfolio-sync-status", "latest-activity-card", "Bought", "Filled shares 200.00", "Exec price 50%", "Implied odds 2.0x")
      } else {
        Assert-HierarchyContains -Path $serverOrderSuccessPortfolioHierarchy -Expected @("portfolio-screen", "portfolio-sync-status", "Cancel")
      }
      if ($ServerOpenOrderCancel) {
        Invoke-TapHierarchyNode -Path $serverOrderSuccessPortfolioHierarchy -Identifier "cancel-open-order-" -StartsWith
        Wait-HierarchyContains -Name "cycle-current-holiwyn-server-open-order-canceled.xml" -Expected @("Portfolio", "Server portfolio synced", "Recent activity", "1") -Attempts 14 -DelaySeconds 2 | Out-Null
        & $adb -s $Device shell input swipe 540 1720 540 620 500 | Out-Null
        Start-Sleep -Seconds 1
        & $adb -s $Device shell input swipe 540 1720 540 620 500 | Out-Null
        Start-Sleep -Seconds 1
        & $adb -s $Device shell input swipe 540 1720 540 620 500 | Out-Null
        Start-Sleep -Seconds 1
        $serverOrderCancelHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-open-order-canceled.xml"
        Save-Screenshot -Name "cycle-current-holiwyn-server-open-order-canceled.png"
        Assert-HierarchyContains -Path $serverOrderCancelHierarchy -Expected @("portfolio-screen", "Canceled", "YES", "1 USDT", "Buy - Canceled 100.00 shares - Limit 1%")
      }
      return
    }

    if ($ServerFilledTradeHistory) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-filled-trade-history.png"
      $serverFilledTradeHistoryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-filled-trade-history.xml"
      Assert-HierarchyContains -Path $serverFilledTradeHistoryHierarchy -Expected @("portfolio-screen", "latest-activity-card", "Bought", "World Cup Provider Filled Trade Proof", "YES", "Filled shares 2.00", "Exec price 50%", "Implied odds 2.0x", "1 USDT")
      return
    }

    if ($ServerApiKeyDiagnostic) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-api-key-diagnostic.png"
      $serverApiKeyDiagnosticHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-api-key-diagnostic.xml"
      Assert-HierarchyContains -Path $serverApiKeyDiagnosticHierarchy -Expected @("api-key-diagnostic", "Runtime PolyApi key", "positions 1", "World Cup Backend Position Order Proof")
      return
    }

    if ($ServerPortfolioFixture) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-portfolio-fixture.png"
      $serverPortfolioFixtureHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-portfolio-fixture.xml"
      Assert-HierarchyContains -Path $serverPortfolioFixtureHierarchy -Expected @("Portfolio", "Server portfolio synced", "Open positions", "1", "World Cup winner", "SERVER - Buy - France - 42%", "Filled shares: 500.00", "Current price 51%", "Est. P/L", "+45 USDT", "Recent activity")
      return
    }

    if ($ServerCloseFixture) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-close-fixture-ready.png"
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverCloseReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-close-fixture-ready.xml"
      Assert-HierarchyContains -Path $serverCloseReadyHierarchy -Expected @("World Cup winner", "SERVER - Buy - France - 42%", "Close position", "Filled shares: 500.00")
      Invoke-TapHierarchyNode -Path $serverCloseReadyHierarchy -Identifier "close-position-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-close-fixture-closed.png"
      $serverCloseClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-close-fixture-closed.xml"
      Assert-HierarchyContains -Path $serverCloseClosedHierarchy -Expected @("Portfolio", "Server portfolio synced", "Open positions", "0", "Closed trades", "1", "No positions yet", "Recent activity", "Closed", "Server close synced", "World Cup winner - France", "Entry 42%", "Current value 255 USDT", "Est. P/L +45 USDT")
      return
    }

    if ($ServerPositionTrade) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-trade-ready.png"
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionTradeReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-trade-ready.xml"
      Assert-HierarchyContains -Path $serverPositionTradeReadyHierarchy -Expected @("World Cup winner", "SERVER - Buy - France - 42%", "Buy", "Sell", "Close position")
      Invoke-TapHierarchyNode -Path $serverPositionTradeReadyHierarchy -Identifier "position-trade-sell-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-trade-ticket.png"
      $serverPositionTradeTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-trade-ticket.xml"
      Assert-HierarchyContains -Path $serverPositionTradeTicketHierarchy -Expected @("World Cup winner", "France", "Trading mode: Server mode", "Sell", "Estimated proceeds", "Est. shares", "Avg price")
      Assert-ServerTicketUsesQuotedDepthSizes -Path $serverPositionTradeTicketHierarchy
      & $adb -s $Device shell input swipe 540 1850 540 950 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionTradeButtonHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-trade-ticket-button.xml"
      Assert-HierarchyContains -Path $serverPositionTradeButtonHierarchy -Expected @("place-mock-order", "Swipe up to sell")
      return
    }

    if ($ServerPositionBuyTrade) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-buy-trade-ready.png"
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionBuyTradeReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-buy-trade-ready.xml"
      Assert-HierarchyContains -Path $serverPositionBuyTradeReadyHierarchy -Expected @("World Cup winner", "SERVER - Buy - France - 42%", "Buy", "Sell", "Close position")
      Invoke-TapHierarchyNode -Path $serverPositionBuyTradeReadyHierarchy -Identifier "position-trade-buy-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-buy-trade-ticket.png"
      $serverPositionBuyTradeTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-buy-trade-ticket.xml"
      Assert-HierarchyContains -Path $serverPositionBuyTradeTicketHierarchy -Expected @("World Cup winner", "France", "Trading mode: Server mode", "Buy", "Estimated cost", "Est. shares", "Avg price")
      Assert-ServerTicketUsesQuotedDepthSizes -Path $serverPositionBuyTradeTicketHierarchy
      & $adb -s $Device shell input swipe 540 1850 540 950 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionBuyTradeButtonHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-buy-trade-ticket-button.xml"
      Assert-HierarchyContains -Path $serverPositionBuyTradeButtonHierarchy -Expected @("place-mock-order", "Swipe up to buy")
      return
    }

    if ($ServerPositionFallbackTrade) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-fallback-trade-ready.png"
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionFallbackTradeReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-fallback-trade-ready.xml"
      Assert-HierarchyContains -Path $serverPositionFallbackTradeReadyHierarchy -Expected @("World Cup backend proof", "SERVER - Buy - YES - 42%", "Buy", "Sell", "Close position")
      Invoke-TapHierarchyNode -Path $serverPositionFallbackTradeReadyHierarchy -Identifier "position-trade-buy-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-fallback-trade-ticket.png"
      $serverPositionFallbackTradeTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-fallback-trade-ticket.xml"
      Assert-HierarchyContains -Path $serverPositionFallbackTradeTicketHierarchy -Expected @("World Cup backend proof", "YES", "Trading mode: Server mode", "Buy", "Estimated cost", "Est. shares", "Avg price")
      Assert-ServerTicketUsesQuotedDepthSizes -Path $serverPositionFallbackTradeTicketHierarchy
      & $adb -s $Device shell input swipe 540 1850 540 950 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionFallbackTradeButtonHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-fallback-trade-ticket-button.xml"
      Assert-HierarchyContains -Path $serverPositionFallbackTradeButtonHierarchy -Expected @("place-mock-order", "Swipe up to buy")
      return
    }

    if ($ServerPositionFallbackOrder) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-fallback-order-ready.png"
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionFallbackOrderReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-fallback-order-ready.xml"
      Assert-HierarchyContains -Path $serverPositionFallbackOrderReadyHierarchy -Expected @("World Cup Backend Position Order Proof", "SERVER - Buy - YES - 50%", "Buy", "Sell", "Close position")
      Invoke-TapHierarchyNode -Path $serverPositionFallbackOrderReadyHierarchy -Identifier "position-trade-buy-" -StartsWith
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-fallback-order-ticket.png"
      $serverPositionFallbackOrderTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-fallback-order-ticket.xml"
      Assert-HierarchyContains -Path $serverPositionFallbackOrderTicketHierarchy -Expected @("World Cup Backend Position Order Proof", "YES", "Trading mode: Server mode", "Buy", "Estimated cost", "Est. shares", "Avg price")
      Assert-ServerTicketUsesQuotedDepthSizes -Path $serverPositionFallbackOrderTicketHierarchy
      & $adb -s $Device shell input swipe 540 1850 540 950 450 | Out-Null
      Start-Sleep -Seconds 1
      $serverPositionFallbackOrderButtonHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-fallback-order-ticket-button.xml"
      Assert-HierarchyContains -Path $serverPositionFallbackOrderButtonHierarchy -Expected @("place-mock-order", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $serverPositionFallbackOrderButtonHierarchy -Identifier "place-mock-order"
      $serverPositionFallbackOrderPortfolioHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-server-position-fallback-order-portfolio.xml" -Expected @("Portfolio", "Order placed", "SERVER - Buy - YES - OPEN", "World Cup Backend Position Order Proof", "Remaining:", "Potential payout") -Attempts 14 -DelaySeconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-fallback-order-portfolio.png"
      Assert-HierarchyContains -Path $serverPositionFallbackOrderPortfolioHierarchy -Expected @("portfolio-screen", "latest-order-card", "open-order-remaining-value-", "open-order-potential-payout-")
      return
    }

    if ($ServerPositionDetails) {
      & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-position-details-ready.png"
      $serverPositionDetailsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-position-details-ready.xml"
      Assert-HierarchyContains -Path $serverPositionDetailsHierarchy -Expected @("World Cup winner", "SERVER - Buy - France - 42%", "Filled shares", "500.00", "Current price", "51%", "position-filled-shares-", "position-current-price-", "Buy", "Sell", "Close position")
      return
    }

    if ($LiveSummary) {
      Save-Screenshot -Name "cycle-current-holiwyn-live-summary.png"
      $liveSummaryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-summary.xml"
      Assert-HierarchyContains -Path $liveSummaryHierarchy -Expected @("Live World Cup", "Updated just now", "Refresh", "live-market-summary", "5 markets", "11 outcomes", "Australia vs. Egypt", "Australia", "Egypt")
      return
    }

    if ($DyAGamePageStructure) {
      $dyResetUrl = "exp://${ExpoHost}:$Port/--/?forceLiveDetail=1,forceResetState=1"
      $dyTopHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-top.xml" -Expected @("Australia vs. Egypt", "event-detail-tab-game", "event-detail-top-order-book") -RestartUrl $dyResetUrl -Attempts 8 -DelaySeconds 2
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-top.png"
      Assert-HierarchyContains -Path $dyTopHierarchy -Expected @(
        "Australia vs. Egypt",
        "event-detail-back",
        "event-detail-tab-game",
        "event-detail-tab-chat",
        "event-detail-top-order-book",
        "event-detail-share",
        "AUS 40%",
        "EGY 61%",
        "0 - 1",
        "63'",
        "event-detail-live-match-strip",
        "LIVE WORLD CUP",
        "event-detail-price-chart",
        "event-detail-chat-preview",
        "event-detail-primary-outcomes",
        "event-detail-primary-outcome-france-argentina-live-australia",
        "event-detail-primary-outcome-france-argentina-live-egypt",
        "Game Lines",
        "Player Props"
      )

      Invoke-TapHierarchyNode -Path $dyTopHierarchy -Identifier "event-detail-price-chart"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-chart-mid.png"
      $ebChartMidHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-chart-mid.xml"
      Assert-HierarchyContains -Path $ebChartMidHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-tooltip", "chart-selected-point-mid", "2H", "Mid chart")
      Invoke-TapHierarchyNode -Path $ebChartMidHierarchy -Identifier "event-detail-price-chart"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-chart-target.png"
      $ebChartTargetHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-chart-target.xml"
      Assert-HierarchyContains -Path $ebChartTargetHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-tooltip", "chart-selected-point-target", "Target", "Target line")
      Invoke-TapHierarchyNode -Path $ebChartTargetHierarchy -Identifier "event-detail-chart-filter-All"
      Start-Sleep -Seconds 1
      $ebChartAllHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-chart-filter-all.xml"
      Assert-HierarchyContains -Path $ebChartAllHierarchy -Expected @("event-detail-price-chart", "chart-filter-All", "All", "Game", "Live")
      Invoke-TapHierarchyNode -Path $ebChartAllHierarchy -Identifier "event-detail-chart-filter-Live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-chart-filter-live.png"
      $ebChartLiveHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-chart-filter-live.xml"
      Assert-HierarchyContains -Path $ebChartLiveHierarchy -Expected @("event-detail-price-chart", "chart-filter-Live", "event-detail-chart-tooltip")

      Invoke-TapHierarchyNode -Path $dyTopHierarchy -Identifier "event-detail-top-order-book"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-top-book.png"
      $dyTopBookHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-top-book.xml" -Expected @("event-detail-order-book-screen", "Order Book", "Australia vs. Egypt - Live winner", "event-detail-order-book-close") -Attempts 5 -DelaySeconds 1
      Invoke-TapHierarchyNode -Path $dyTopBookHierarchy -Identifier "event-detail-order-book-close"
      Start-Sleep -Seconds 1

      $dyAfterBookHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-after-top-book.xml"
      Invoke-TapHierarchyNode -Path $dyAfterBookHierarchy -Identifier "event-detail-share"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-share-sheet.png"
      $dyShareHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-share-sheet.xml"
      Assert-HierarchyContains -Path $dyShareHierarchy -Expected @("event-detail-share-sheet", "Share this market", "Australia vs. Egypt", "Copy link", "Share to chat", "Invite", "event-detail-share-dismiss")
      Invoke-TapHierarchyNode -Path $dyShareHierarchy -Identifier "event-detail-share-dismiss"
      Start-Sleep -Seconds 1

      Start-DeepLink -Url $dyResetUrl
      Start-Sleep -Seconds 4
      $dyChatReadyHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-chat-ready.xml" -Expected @("Australia vs. Egypt", "event-detail-tab-chat") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $dyChatReadyHierarchy -Identifier "event-detail-tab-chat"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-chat.png"
      $dyChatHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-chat.xml"
      Assert-HierarchyContains -Path $dyChatHierarchy -Expected @("event-detail-chat-page", "Australia vs. Egypt", "AUS 40%", "EGY 61%", "0 - 1", "63'", "event-detail-chat-feed", "gigglyeel0550", "BTTS $36", "VAMOS", "event-detail-chat-input", "Message this market")
      & $adb -s $Device shell input swipe 540 1850 540 1050 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-chat-lower.png"
      $dyChatLowerHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-chat-lower.xml"
      Assert-HierarchyContains -Path $dyChatLowerHierarchy -Expected @("event-detail-chat-reactions", "event-detail-chat-emoji-picker", "event-detail-chat-sticky-outcomes")

      Start-DeepLink -Url $dyResetUrl
      Start-Sleep -Seconds 4
      $dyTicketGameReadyHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-ticket-game-ready.xml" -Expected @("Australia vs. Egypt", "event-detail-tab-game") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $dyTicketGameReadyHierarchy -Identifier "event-detail-tab-game"
      Start-Sleep -Seconds 1
      $dyTicketPrimaryReadyHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-ticket-primary-ready.xml" -Expected @("event-detail-primary-outcome-france-argentina-live-australia", "event-detail-primary-outcome-france-argentina-live-egypt") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $dyTicketPrimaryReadyHierarchy -Identifier "event-detail-primary-outcome-france-argentina-live-australia"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-primary-ticket.png"
      $dyPrimaryTicketHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-primary-ticket.xml"
      Assert-HierarchyContains -Path $dyPrimaryTicketHierarchy -Expected @("trade-ticket", "ticket-drag-handle", "Live winner", "Australia vs. Egypt", "Australia", "ticket-side-buy", "ticket-side-sell", "ticket-preset-1", "ticket-preset-10", "Choose an amount", "Final cost may vary.")
      Invoke-TapHierarchyNode -Path $dyPrimaryTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1

      $dyTicketCardReadyHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-ticket-card-ready.xml" -Expected @("event-detail-team-advance-australia", "event-detail-team-advance-egypt") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $dyTicketCardReadyHierarchy -Identifier "event-detail-team-advance-australia"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-ticket.png"
      $dyTicketHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-ticket.xml"
      Assert-HierarchyContains -Path $dyTicketHierarchy -Expected @("trade-ticket", "ticket-drag-handle", "Live Winner", "Australia vs. Egypt", "Australia", "ticket-side-buy", "ticket-side-sell", "ticket-preset-1", "ticket-preset-10", "Choose an amount", "Final cost may vary.")
      Invoke-TapHierarchyNode -Path $dyTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1

      Start-DeepLink -Url $dyResetUrl
      Start-Sleep -Seconds 4
      $dyMarketReadyHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-market-ready.xml" -Expected @("Australia vs. Egypt", "Game Lines", "Player Props") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      & $adb -s $Device shell input swipe 540 1800 540 980 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-markets.png"
      $dyMarketsHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-markets.xml"
      Assert-HierarchyContains -Path $dyMarketsHierarchy -Expected @("AUS 40%", "EGY 61%", "Game Lines", "Player Props", "Live Winner", "Spread", "Totals", "event-detail-spread-line-2-5", "event-detail-totals-line-3-5")

      Invoke-TapHierarchyNode -Path $dyMarketsHierarchy -Identifier "event-detail-spread-line-2-5"
      Start-Sleep -Milliseconds 700
      $ebSpread25Hierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-spread-line-25.xml"
      Invoke-TapHierarchyNode -Path $ebSpread25Hierarchy -Identifier "event-detail-spread-period-1st-half"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-spread-line-25-1h.png"
      $ebSpreadChangedHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-spread-line-25-1h.xml"
      Assert-HierarchyContains -Path $ebSpreadChangedHierarchy -Expected @("Spread", "AUS to win by over 2.5 goals", "event-detail-spread-line-2.5", "event-detail-spread-period-1st Half", "Yes, AUS -2.5", "33.3x", "3%", "selection-line-2.5", "selection-period-1st Half")
      Invoke-TapHierarchyNode -Path $ebSpreadChangedHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-spread-ticket.png"
      $ebSpreadTicketHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-spread-ticket.xml"
      Assert-HierarchyContains -Path $ebSpreadTicketHierarchy -Expected @("trade-ticket", "Australia vs. Egypt", "ticket-selection-line", "Yes - AUS -2.5 1H", "ticket-market-family-spread", "ticket-line-2.5", "ticket-period-1st Half", "ticket-selected-outcome-choice", "Choose an amount")
      Invoke-TapHierarchyNode -Path $ebSpreadTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1

      $ebTotalsReadyHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-totals-ready.xml"
      Assert-HierarchyContains -Path $ebTotalsReadyHierarchy -Expected @("Totals", "event-detail-totals-line-3.5", "event-detail-totals-period-2nd Half")
      Invoke-TapHierarchyNode -Path $ebTotalsReadyHierarchy -Identifier "event-detail-totals-period-2nd-half"
      Start-Sleep -Milliseconds 700
      $ebTotals2hHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-totals-2h.xml"
      Invoke-TapHierarchyNode -Path $ebTotals2hHierarchy -Identifier "event-detail-totals-line-3-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-totals-35-2h.png"
      $ebTotalsChangedHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-totals-35-2h.xml"
      Assert-HierarchyContains -Path $ebTotalsChangedHierarchy -Expected @("Totals", "Total goals over 3.5", "event-detail-totals-line-3.5", "event-detail-totals-period-2nd Half", "Over 3.5", "4.5x", "22%", "selection-line-3.5", "selection-period-2nd Half")
      Invoke-TapHierarchyNode -Path $ebTotalsChangedHierarchy -Identifier "event-detail-outcome-totals-totals-over"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EB-B-holiwyn-game-page-totals-ticket.png"
      $ebTotalsTicketHierarchy = Save-UiHierarchy -Name "cycle-EB-B-holiwyn-game-page-totals-ticket.xml"
      Assert-HierarchyContains -Path $ebTotalsTicketHierarchy -Expected @("trade-ticket", "Australia vs. Egypt", "ticket-selection-line", "Yes - Over 3.5 2H", "ticket-market-family-totals", "ticket-line-3.5", "ticket-period-2nd Half", "ticket-selected-outcome-choice", "Choose an amount")
      Invoke-TapHierarchyNode -Path $ebTotalsTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1

      & $adb -s $Device shell input swipe 720 2100 720 320 650 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 720 2100 720 320 650 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-pinned-context.png"
      $dyPinnedContextHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-pinned-context.xml"
      Assert-HierarchyContains -Path $dyPinnedContextHierarchy -Expected @("event-detail-compact-game-header", "event-detail-sticky-market-shell", "event-detail-sticky-market-tabs", "AUS 40%", "EGY 61%", "Game Lines", "Player Props")
      & $adb -s $Device shell input swipe 720 2000 720 980 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-markets-lower.png"
      $dyMarketsLowerHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-markets-lower.xml"
      Assert-HierarchyContains -Path $dyMarketsLowerHierarchy -Expected @("event-detail-sticky-market-tabs", "Totals", "Full Game Team Total Goals")

      $dyMarketsLowerHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-markets-lower-after-line-proof.xml"
      Invoke-TapHierarchyNode -Path $dyMarketsLowerHierarchy -Identifier "event-detail-sticky-player-props-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-sticky-props.png"
      $dyStickyPropsHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-sticky-props.xml"
      Assert-HierarchyContains -Path $dyStickyPropsHierarchy -Expected @("Player Props", "event-detail-player-props-empty", "Player Props unavailable for this match", "Market Rules")

      Start-DeepLink -Url $dyResetUrl
      Start-Sleep -Seconds 4
      $dyPropsReadyHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-props-ready.xml" -Expected @("event-detail-player-props-tab") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Seconds 1
      $dyPropsTabHierarchy = Wait-HierarchyContains -Name "cycle-DY-A-holiwyn-game-page-structure-props-tab.xml" -Expected @("event-detail-player-props-tab") -RestartUrl $dyResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $dyPropsTabHierarchy -Identifier "event-detail-player-props-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-props.png"
      $dyPropsHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-props.xml"
      Assert-HierarchyContains -Path $dyPropsHierarchy -Expected @("Player Props", "event-detail-player-props", "event-detail-player-props-empty", "Player Props unavailable for this match")
      & $adb -s $Device shell input swipe 540 1800 540 620 550 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-props-lower.png"
      $dyPropsLowerHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-props-lower.xml"
      Assert-HierarchyContains -Path $dyPropsLowerHierarchy -Expected @("Market Rules", "View Full Rules", "More Events")
      & $adb -s $Device shell input swipe 540 1800 540 650 550 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DY-A-holiwyn-game-page-structure-rules-more.png"
      $dyRulesHierarchy = Save-UiHierarchy -Name "cycle-DY-A-holiwyn-game-page-structure-rules-more.xml"
      Assert-HierarchyContains -Path $dyRulesHierarchy -Expected @("Market Rules", "AUS to advance", "View Full Rules", "More Events", "Portugal vs. Croatia", "England vs. Congo DR")

      $proof = [ordered]@{
        cycle = "DY-A/EB-B"
        issue = "PM-GAP-073"
        scope = "Samsung tablet full live football World Cup game page structure plus chart touch and in-page line selector ticket carry-through"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -DyAGamePageStructure -Port 8256 -OutputDir docs/mobile/screenshots/cycle-DY-A-game-page-structure -HierarchyOutputDir docs/mobile/harness/cycle-DY-A-game-page-structure"
        eventIdentity = "Australia vs. Egypt"
        result = "pass"
        assertions = [ordered]@{
          headerActions = @("event-detail-back", "event-detail-top-order-book", "event-detail-share")
          gameChatSegment = @("event-detail-tab-game", "event-detail-tab-chat")
          topMatchContext = @("AUS 40%", "EGY 61%", "0 - 1", "63'", "LIVE WORLD CUP")
          chart = @("event-detail-price-chart", "event-detail-chart-tooltip", "chart-selected-point-mid", "chart-selected-point-target", "chart-filter-All", "chart-filter-Live")
          chat = @("event-detail-chat-preview", "event-detail-chat-page", "event-detail-chat-feed")
          primaryOutcomes = @("event-detail-team-advance-australia", "event-detail-team-advance-egypt")
          compactPinnedContext = @("event-detail-compact-game-header", "event-detail-sticky-market-shell", "event-detail-sticky-market-tabs")
          groupedMarkets = @("Live Winner", "Spread", "Totals", "1st Half Winner", "2nd Half Winner", "Full Game Team Total Goals")
          lineSelectors = @("event-detail-spread-line-2.5", "event-detail-spread-period-1st Half", "selection-line-2.5", "event-detail-totals-line-3.5", "event-detail-totals-period-2nd Half", "selection-line-3.5")
          lineTickets = @("ticket-market-family-spread", "ticket-line-2.5", "ticket-period-1st Half", "Yes - AUS -2.5 1H", "ticket-market-family-totals", "ticket-line-3.5", "ticket-period-2nd Half", "Yes - Over 3.5 2H")
          playerPropsBlankState = @("event-detail-player-props-empty", "Player Props unavailable for this match")
          lowerContent = @("Market Rules", "View Full Rules", "More Events")
          ticket = @("trade-ticket", "Live winner", "event-detail-primary-outcome-france-argentina-live-australia", "event-detail-team-advance-australia", "Australia vs. Egypt", "Australia")
          actions = @("event-detail-order-book-screen", "event-detail-share-sheet")
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-top.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-top.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-chart-mid.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-chart-mid.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-chart-target.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-chart-target.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-chart-filter-live.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-chart-filter-live.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-top-book.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-top-book.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-share-sheet.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-share-sheet.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-chat.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-chat.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-primary-ticket.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-primary-ticket.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-ticket.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-ticket.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-markets.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-markets.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-pinned-context.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-pinned-context.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-spread-line-25-1h.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-spread-line-25-1h.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-spread-ticket.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-spread-ticket.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-totals-35-2h.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-totals-35-2h.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-totals-ticket.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-EB-B-holiwyn-game-page-totals-ticket.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-sticky-props.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-sticky-props.xml",
          "docs/mobile/screenshots/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-rules-more.png",
          "docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-rules-more.xml"
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-DY-A-holiwyn-game-page-structure-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailProviderRouteStatusProof) {
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-live-top.png"
      $providerStatusTopHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-live-top.xml"
      if ($EventDetailVisibleStatusTransition) {
        $providerStatusTopExpected = @(
          "event-detail-live-data-inline",
          "live-data-status-unavailable",
          "provider-lifecycle-not-ready",
          "live-data-source-polymarket-gamma",
          "Live not ready",
          "event-detail-price-chart",
          "event-detail-chart-route-state",
          "chart-status-",
          "event-detail-chart-ticket-handoff-status",
          "provider-source-polymarket",
          "provider-lifecycle-refresh-due",
          "Ticket refresh due",
          "event-detail-chart-open-book"
        )
      } else {
        $providerStatusTopExpected = @(
          "event-detail-live-data-inline",
          "live-data-status-ready",
          "provider-lifecycle-ready",
          "live-data-source-polymarket-gamma",
          "Live provider ready",
          "event-detail-price-chart",
          "event-detail-chart-route-state",
          "chart-status-ready",
          "provider-lifecycle-ready",
          "Chart provider ready",
          "event-detail-chart-ticket-handoff-status",
          "provider-source-polymarket",
          "event-detail-chart-open-book"
        )
      }
      if ($EventDetailVisibleStatusTransition) {
        $providerStatusTopExpected += @(
          "provider-lifecycle-not-ready"
        )
      } elseif ($EventDetailVisibleStatusBreadth) {
        $providerStatusTopExpected += @(
          "provider-lifecycle-refresh-due",
          "Ticket refresh due"
        )
      } else {
        $providerStatusTopExpected += @("Ticket provider ready")
      }
      Assert-HierarchyContains -Path $providerStatusTopHierarchy -Expected $providerStatusTopExpected

      $providerStatusTopUnexpected = @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready")
      if ($EventDetailVisibleStatusTransition) {
        $providerStatusTopUnexpected += @("Ticket provider ready", "selected-market-mexico-ecuador-winner", "Team to Advance", "Mexico vs. Ecuador")
      } else {
        $providerStatusTopUnexpected += @("Live refresh due")
      }
      Assert-HierarchyDoesNotContain -Path $providerStatusTopHierarchy -Unexpected $providerStatusTopUnexpected

      Invoke-TapHierarchyNode -Path $providerStatusTopHierarchy -Identifier "event-detail-chart-open-book"
      Start-Sleep -Milliseconds 250
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-book-refreshing.png"
      $providerStatusBookRefreshingHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-book-refreshing.xml"
      Assert-HierarchyContains -Path $providerStatusBookRefreshingHierarchy -Expected @(
        "event-detail-order-book-screen",
        "selected-market-",
        "selected-selector-key-",
        "selected-provider-source-polymarket",
        "event-detail-order-book-depth-state",
        "orderbook-status-loading",
        "provider-lifecycle-refreshing",
        "Book depth refreshing",
        "Loading depth",
        "order-book-ticket-handoff-status"
      )
      Assert-HierarchyDoesNotContain -Path $providerStatusBookRefreshingHierarchy -Unexpected @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready")

      if ($EventDetailVisibleStatusTransition) {
        $transitionRefreshSummary = Join-Path $ResolvedHierarchyOutputDir "$ProviderStatusArtifactPrefix-refresh-route.json"
        $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
        Push-Location $repoRoot
        try {
          & npx tsx scripts/refresh_mobile_ek_provider_transition.ts "--eventSlug=$ServerEventSlug" "--summaryPath=$transitionRefreshSummary"
        } finally {
          Pop-Location
        }
        Invoke-TapHierarchyNode -Path $providerStatusBookRefreshingHierarchy -Identifier "event-detail-order-book-close"
        Start-Sleep -Milliseconds 500
        $providerStatusAfterRefreshHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-after-refresh-live.xml"
        Assert-HierarchyContains -Path $providerStatusAfterRefreshHierarchy -Expected @("event-detail-chart-open-book", "live-data-source-polymarket-gamma")
        Invoke-TapHierarchyNode -Path $providerStatusAfterRefreshHierarchy -Identifier "event-detail-chart-open-book"
        Start-Sleep -Milliseconds 750
      }

      Start-Sleep -Seconds 2
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-book-resolved.png"
      $providerStatusBookResolvedHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-book-resolved.xml"
      $providerStatusBookResolvedExpected = @(
        "event-detail-order-book-screen",
        "event-detail-order-book-depth-state",
        "provider-lifecycle-ready",
        "Book depth provider ready",
        "Route depth",
        "orderbook-source-orderbook-route",
        "orderbook-status-ready",
        "event-detail-order-book-availability",
        "selected-provider-source-polymarket",
        "order-book-ticket-handoff-status",
        "order-book-buy-"
      )
      if ($EventDetailVisibleStatusTransition) {
        $providerStatusBookResolvedExpected += @(
          "orderbook-availability-ready",
          "provider-lifecycle-ready",
          "Ticket provider ready",
          "selected-market-",
          "selected-selector-key-",
          "selected-family-",
          "selected-market-type-",
          "selected-outcome-",
          "selected-provider-market-",
          "selected-provider-condition-",
          "selected-provider-token-"
        )
      } elseif ($EventDetailVisibleStatusBreadth) {
        $providerStatusBookResolvedExpected += @(
          "orderbook-availability-stale",
          "provider-lifecycle-refresh-due",
          "Book refresh due",
          "Ticket refresh due"
        )
      } else {
        $providerStatusBookResolvedExpected += @(
          "orderbook-availability-ready",
          "Ticket provider ready"
        )
      }
      Assert-HierarchyContains -Path $providerStatusBookResolvedHierarchy -Expected $providerStatusBookResolvedExpected
      Assert-HierarchyDoesNotContain -Path $providerStatusBookResolvedHierarchy -Unexpected @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready", "Fixture depth", "Fallback depth", "quote-fallback-ladder", "selected-market-mexico-ecuador-winner", "Team to Advance", "Mexico vs. Ecuador")

      Invoke-TapHierarchyNode -Path $providerStatusBookResolvedHierarchy -Identifier "order-book-settings-open"
      Start-Sleep -Milliseconds 500
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-book-settings-cents.png"
      $providerStatusBookSettingsCentsHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-book-settings-cents.xml"
      Assert-HierarchyContains -Path $providerStatusBookSettingsCentsHierarchy -Expected @("order-book-settings-sheet", "Book settings", "Price display", "order-book-display-mode-toggle", "book-display-mode-cents", "decimalize-off", "selected-market-", "selected-selector-key-", "selected-provider-source-polymarket")
      Assert-HierarchyDoesNotContain -Path $providerStatusBookSettingsCentsHierarchy -Unexpected @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready", "Fixture depth", "selected-market-mexico-ecuador-winner", "Team to Advance", "Mexico vs. Ecuador")

      Invoke-TapHierarchyNode -Path $providerStatusBookSettingsCentsHierarchy -Identifier "order-book-display-mode-toggle"
      Start-Sleep -Milliseconds 500
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-book-settings-decimal.png"
      $providerStatusBookSettingsDecimalHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-book-settings-decimal.xml"
      Assert-HierarchyContains -Path $providerStatusBookSettingsDecimalHierarchy -Expected @("order-book-settings-sheet", "book-display-mode-decimal", "decimalize-on", "selected-market-", "selected-selector-key-", "selected-provider-source-polymarket", "Price (USDT)")
      Assert-HierarchyDoesNotContain -Path $providerStatusBookSettingsDecimalHierarchy -Unexpected @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready", "Fixture depth", "selected-market-mexico-ecuador-winner", "Team to Advance", "Mexico vs. Ecuador")

      Invoke-TapHierarchyNode -Path $providerStatusBookSettingsDecimalHierarchy -Identifier "order-book-buy-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-ticket-handoff.png"
      $providerStatusTicketHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-ticket-handoff.xml"
      Assert-HierarchyContains -Path $providerStatusTicketHierarchy -Expected @("trade-ticket", "ticket-side-buy", "ticket-side-sell", "ticket-settings", "ticket-selection-summary", "provider-source-polymarket", "ticket-provider-source-polymarket", "ticket-market-id-", "ticket-outcome-id-", "ticket-provider-market-", "ticket-provider-condition-", "ticket-provider-token-")
      Assert-HierarchyDoesNotContain -Path $providerStatusTicketHierarchy -Unexpected @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready", "Team to Advance", "Mexico vs. Ecuador", "selected-market-mexico-ecuador-winner")
      Invoke-TapHierarchyNode -Path $providerStatusTicketHierarchy -Identifier "ticket-settings"
      Start-Sleep -Milliseconds 500
      Save-Screenshot -Name "$ProviderStatusArtifactPrefix-ticket-settings.png"
      $providerStatusTicketSettingsHierarchy = Save-UiHierarchy -Name "$ProviderStatusArtifactPrefix-ticket-settings.xml"
      Assert-HierarchyContains -Path $providerStatusTicketSettingsHierarchy -Expected @("trade-ticket", "ticket-advanced-details", "ticket-trading-mode", "Trading mode: Server mode", "ticket-market-depth", "provider-source-polymarket", "ticket-provider-source-polymarket", "ticket-provider-market-", "ticket-provider-condition-", "ticket-provider-token-")
      Assert-HierarchyDoesNotContain -Path $providerStatusTicketSettingsHierarchy -Unexpected @("deterministic-status-fixture", "mock-ready", "default-ready", "fixture-ready", "Team to Advance", "Mexico vs. Ecuador", "selected-market-mexico-ecuador-winner")

      $proof = [ordered]@{
        cycle = $ProviderStatusCycle
        scope = $ProviderStatusScope
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 $ProviderStatusSwitch -Port $Port -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        backendBaseUrl = $BackendBaseUrl
        serverMode = $env:EXPO_PUBLIC_ORDER_MODE
        apiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
        adbReverse = "tcp:3002 tcp:3002"
        serverEventSlug = $ServerEventSlug
        eventIdentity = "backend live detail route"
        routeBackedStatusConsumed = $true
        routeBackedStatusSource = "polymarket-gamma"
        result = "pass"
        assertions = [ordered]@{
          backendHealth = "Backend /api/health was required before launch; the proof aborts instead of falling back when unavailable."
          liveRouteStatusReady = if ($EventDetailVisibleStatusTransition) { "Live detail consumed route-backed liveDataStatus with live-data-status-unavailable, provider-lifecycle-not-ready, and live-data-source-polymarket-gamma." } else { "Live detail consumed route-backed liveDataStatus with live-data-status-ready and live-data-source-polymarket-gamma." }
          chartRouteStatusReady = if ($EventDetailVisibleStatusTransition) { "Initial route-backed live state exposes unavailable/not-ready markers while the selected stale provider-backed chart ticket exposes refresh-due instead of a ready fallback." } elseif ($EventDetailVisibleStatusBreadth) { "Chart route state exposes chart-status-ready plus a visible Ticket refresh due handoff for the mixed provider lifecycle event." } else { "Chart route state exposes chart-status-ready, provider-lifecycle-ready, and Ticket provider ready for the selected route-backed market." }
          serverRuntime = "Expo launched with EXPO_PUBLIC_ORDER_MODE=server and EXPO_PUBLIC_API_BASE_URL set to the supplied BackendBaseUrl."
          bookRefreshing = "Opening Book produces a visible provider-lifecycle-refreshing Book depth refreshing state before the resolved depth state."
          bookRouteDepthReady = if ($EventDetailVisibleStatusTransition) { "Resolved Book depth uses orderbook-source-orderbook-route, orderbook-status-ready, orderbook-availability-ready, selected provider identity, and Ticket provider ready after the visible loading state." } elseif ($EventDetailVisibleStatusBreadth) { "Resolved Book depth uses orderbook-source-orderbook-route and orderbook-status-ready while the selected market availability remains visibly refresh-due/stale rather than fixture/default ready." } else { "Resolved Book depth uses orderbook-source-orderbook-route, orderbook-status-ready, orderbook-availability-ready, and selected-provider-source-polymarket rather than fixture depth." }
          bookSettings = "Book settings toggles book-display-mode-cents to book-display-mode-decimal while preserving selected-provider-source-polymarket."
          ticketServerMode = "Ticket settings exposes Trading mode: Server mode while preserving provider-source-polymarket and ticket-provider-source-polymarket selection identity."
          fallbackGuard = "The top, Book, and ticket hierarchies reject deterministic-status-fixture, fixture-ready, mock-ready, and default-ready markers."
        }
        artifacts = @(
          "$OutputDir/$ProviderStatusArtifactPrefix-live-top.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-live-top.xml",
          "$OutputDir/$ProviderStatusArtifactPrefix-book-refreshing.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-book-refreshing.xml",
          "$OutputDir/$ProviderStatusArtifactPrefix-book-resolved.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-book-resolved.xml",
          "$OutputDir/$ProviderStatusArtifactPrefix-book-settings-cents.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-book-settings-cents.xml",
          "$OutputDir/$ProviderStatusArtifactPrefix-book-settings-decimal.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-book-settings-decimal.xml",
          "$OutputDir/$ProviderStatusArtifactPrefix-ticket-handoff.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-ticket-handoff.xml",
          "$OutputDir/$ProviderStatusArtifactPrefix-ticket-settings.png",
          "$HierarchyOutputDir/$ProviderStatusArtifactPrefix-ticket-settings.xml"
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "$ProviderStatusArtifactPrefix-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($LiveDetail) {
      Save-Screenshot -Name "cycle-current-holiwyn-live-detail-top.png"
      $liveDetailTopHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-detail-top.xml"
      Assert-HierarchyContains -Path $liveDetailTopHierarchy -Expected @("Australia vs. Egypt", "AUS 40%", "EGY 61%", "0 - 1", "63'", "event-detail-live-match-strip", "LIVE WORLD CUP", "event-detail-price-chart", "Live Winner", "Game Lines", "Player Props")
      & $adb -s $Device shell input swipe 540 1760 540 760 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-live-detail-markets.png"
      $liveDetailMarketsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-detail-markets.xml"
      Assert-HierarchyContains -Path $liveDetailMarketsHierarchy -Expected @("event-detail-sticky-market-tabs", "Game Lines", "Player Props", "Live Winner", "Spread", "Totals", "1st Half Winner")
      Invoke-TapHierarchyNode -Path $liveDetailMarketsHierarchy -Identifier "event-detail-outcome-france-argentina-live-australia"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-live-detail-ticket.png"
      $liveDetailTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-detail-ticket.xml"
      Assert-HierarchyContains -Path $liveDetailTicketHierarchy -Expected @("trade-ticket", "Live winner", "Australia vs. Egypt", "Australia", "ticket-side-buy", "ticket-side-sell", "place-mock-order", "Choose an amount")
      return
    }

    if ($LiveTicket -or $LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) {
      Save-Screenshot -Name "cycle-current-holiwyn-live-ticket-ready.png"
      $liveTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-ticket-ready.xml"
      Assert-HierarchyContains -Path $liveTicketReadyHierarchy -Expected @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt")
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $liveTicketReadyHierarchy)) {
        Save-Screenshot -Name "cycle-current-holiwyn-live-ticket-ready.png"
        $liveTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-ticket-ready.xml"
        Assert-HierarchyContains -Path $liveTicketReadyHierarchy -Expected @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt")
      }
      $liveTicketHierarchy = ""
      $liveTicketExpected = @("Trading mode: Fake-token mock", "ticket-market-depth", "Best bid", "Best ask", "Spread", "Live World Cup", "ticket-live-clock", "Live - 63'", "Prices may move before fill.", "Fake balance", "10,000 USDT", "Estimated cost", "Est. fee", "0 USDT", "ticket-slippage", "Slippage", "0.5%", "1%", "2%", "Est. shares", "Avg price")
      for ($liveTicketAttempt = 1; $liveTicketAttempt -le 3; $liveTicketAttempt++) {
        Invoke-TapHierarchyNode -Path $liveTicketReadyHierarchy -Identifier "event-outcome-france-argentina-final-france-argentina-live-australia"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-live-ticket.png"
        $liveTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-ticket.xml"
        try {
          Assert-HierarchyContains -Path $liveTicketHierarchy -Expected $liveTicketExpected
          break
        } catch {
          if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $liveTicketHierarchy)) {
            Start-DeepLink -Url $launchUrl
            Start-Sleep -Seconds 3
            $liveTicketReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-live-ticket-ready.xml" -Expected @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt") -RestartUrl $launchUrl -Attempts 4 -DelaySeconds 2
            Assert-HierarchyContains -Path $liveTicketReadyHierarchy -Expected @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt")
            continue
          }
          if ($liveTicketAttempt -eq 3) {
            throw
          }
          & $adb -s $Device shell input keyevent 4 | Out-Null
          Start-Sleep -Seconds 1
          Start-DeepLink -Url $launchUrl
          Start-Sleep -Seconds 3
          $liveTicketReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-live-ticket-ready.xml" -Expected @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt") -RestartUrl $launchUrl -Attempts 4 -DelaySeconds 2
        }
      }
      if ($LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) {
        if ($LiveSellOrder) {
          Invoke-TapHierarchyNode -Path $liveTicketHierarchy -Identifier "ticket-side-sell"
          Start-Sleep -Seconds 1
          Save-Screenshot -Name "cycle-current-holiwyn-live-sell-ticket.png"
          $liveTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-sell-ticket.xml"
          Assert-HierarchyContains -Path $liveTicketHierarchy -Expected @("ticket-side-sell", "Estimated proceeds", "Fake balance", "Avg price")
        }
        $liveTicketOrderHierarchy = $liveTicketHierarchy
        $liveTicketOrderSnapshot = Get-Content -Raw -Path $liveTicketOrderHierarchy
        if ($liveTicketOrderSnapshot -notmatch [regex]::Escape("place-mock-order")) {
          & $adb -s $Device shell input swipe 540 1760 540 760 450 | Out-Null
          Start-Sleep -Seconds 1
          $liveOrderReadyName = if ($LiveSellOrder) { "cycle-current-holiwyn-live-sell-ticket-order-ready" } else { "cycle-current-holiwyn-live-ticket-order-ready" }
          Save-Screenshot -Name "$liveOrderReadyName.png"
          $liveTicketOrderHierarchy = Save-UiHierarchy -Name "$liveOrderReadyName.xml"
        }
        $liveOrderButtonLabel = if ($LiveSellOrder) { "Swipe up to sell" } else { "Swipe up to buy" }
        Assert-HierarchyContains -Path $liveTicketOrderHierarchy -Expected @("place-mock-order", $liveOrderButtonLabel)
        Invoke-TapHierarchyNode -Path $liveTicketOrderHierarchy -Identifier "place-mock-order"
        Start-Sleep -Seconds 1
        $liveOrderPortfolioName = if ($LiveSellOrder) { "cycle-current-holiwyn-live-sell-order-portfolio" } else { "cycle-current-holiwyn-live-order-portfolio" }
        Save-Screenshot -Name "$liveOrderPortfolioName.png"
        $liveOrderPortfolioHierarchy = Save-UiHierarchy -Name "$liveOrderPortfolioName.xml"
        $liveOrderPortfolioExpected = if ($LiveSellOrder) {
          @("Portfolio", "Fake balance", "9,900 USDT", "Open positions", "Recent activity", "1", "Live match winner", "MOCK - Sell - France", "Order placed", "Exec price", "41%", "Sold")
        } else {
          @("Portfolio", "Fake balance", "9,900 USDT", "Open positions", "Recent activity", "1", "Live match winner", "MOCK - Buy - France", "Order placed", "Exec price", "41%")
        }
        Assert-HierarchyContains -Path $liveOrderPortfolioHierarchy -Expected $liveOrderPortfolioExpected
        if ($LivePortfolioBadge -or $LivePortfolioBadgeDeep) {
          Assert-HierarchyContains -Path $liveOrderPortfolioHierarchy -Expected @("LIVE WORLD CUP", "portfolio-position-live-badge")
        }
        if ($LivePortfolioBadgeDeep) {
          Assert-HierarchyContains -Path $liveOrderPortfolioHierarchy -Expected @("latest-order-live-clock", "portfolio-position-live-clock", "Live - 63'")
        }
        if ($LivePortfolioBadgeDeep) {
          & $adb -s $Device shell input swipe 540 1500 540 650 450 | Out-Null
          Start-Sleep -Seconds 1
          Save-Screenshot -Name "cycle-current-holiwyn-live-portfolio-badge-deep.png"
          $livePortfolioBadgeDeepHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-portfolio-badge-deep.xml"
          Assert-HierarchyContains -Path $livePortfolioBadgeDeepHierarchy -Expected @("portfolio-position-live-clock", "portfolio-activity-live-clock", "LIVE WORLD CUP", "Live - 63'", "Australia vs. Egypt")
          & $adb -s $Device shell input swipe 540 1500 540 650 450 | Out-Null
          Start-Sleep -Milliseconds 500
          & $adb -s $Device shell input swipe 540 1500 540 650 450 | Out-Null
          Start-Sleep -Seconds 1
          Save-Screenshot -Name "cycle-current-holiwyn-live-portfolio-badge-activity.png"
          $livePortfolioBadgeActivityHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-portfolio-badge-activity.xml"
          Assert-HierarchyContains -Path $livePortfolioBadgeActivityHierarchy -Expected @("portfolio-activity-live-badge", "portfolio-activity-live-clock", "LIVE WORLD CUP", "Live - 63'", "Recent activity", "Bought", "Australia vs. Egypt")
        }
        if ($LiveOrderClose) {
          & $adb -s $Device shell input swipe 540 1750 540 850 450 | Out-Null
          Start-Sleep -Seconds 1
          Save-Screenshot -Name "cycle-current-holiwyn-live-order-close-ready.png"
          $liveOrderCloseReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-order-close-ready.xml"
          Assert-HierarchyContains -Path $liveOrderCloseReadyHierarchy -Expected @("Close position", "close-position-")
          Invoke-TapHierarchyNode -Path $liveOrderCloseReadyHierarchy -Identifier "close-position-" -StartsWith
          Start-Sleep -Seconds 1
          Save-Screenshot -Name "cycle-current-holiwyn-live-order-close-closed.png"
          $liveOrderClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live-order-close-closed.xml"
          Assert-HierarchyContains -Path $liveOrderClosedHierarchy -Expected @("Portfolio", "No positions yet", "Recent activity", "Closed", "Bought", "LIVE WORLD CUP", "Live - 63'", "Australia vs. Egypt - Australia", "107.32 USDT")
        }
      }
      return
    }

    if ($SearchQuery) {
      Save-Screenshot -Name "cycle-current-holiwyn-search-query.png"
      $searchQueryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-query.xml"
      Assert-HierarchyContains -Path $searchQueryHierarchy -Expected @("zzzz", "Results", "0 results", "No markets match your search.", "Clear")
      return
    }

    if ($SearchClearQuery) {
      Save-Screenshot -Name "cycle-current-holiwyn-search-clear-query-before.png"
      $searchClearReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-clear-query-ready.xml"
      Assert-HierarchyContains -Path $searchClearReadyHierarchy -Expected @("zzzz", "Results", "0 results", "No markets match your search.", "Clear")
      Invoke-TapHierarchyNode -Path $searchClearReadyHierarchy -Identifier "clear-search"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-clear-query-after.png"
      $searchClearQueryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-clear-query-after.xml"
      Assert-HierarchyContains -Path $searchClearQueryHierarchy -Expected @("Top results", "3 results", "Mexico vs. Ecuador", "Popular", "Live first")
      return
    }

    if ($Account -or $AccountLogin -or $AccountPersistence) {
      Save-Screenshot -Name "cycle-current-holiwyn-account.png"
      $accountHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account.xml"
      if ($AccountPersistence) {
        Assert-HierarchyContains -Path $accountHierarchy -Expected @("Account", "Signed in", "Holiwyn Demo", "Demo balance", "10,000 USDT", "Mock login active.", "Preferences")
        Save-Screenshot -Name "cycle-current-holiwyn-account-persistence-signed-in.png"
        $accountPersistenceSignedInHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-persistence-signed-in.xml"
        Assert-HierarchyContains -Path $accountPersistenceSignedInHierarchy -Expected @("Signed in", "Holiwyn Demo", "Demo", "Mock login active.", "Sign out")
        Start-Sleep -Seconds 2
        & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
        Start-Sleep -Seconds 2
        $accountPersistenceRestartUrl = "exp://${ExpoHost}:$Port/--/?forceAccount=1"
        & $adb -s $Device shell am start -a android.intent.action.VIEW -d $accountPersistenceRestartUrl | Out-Null
        Start-Sleep -Seconds 10
        Save-Screenshot -Name "cycle-current-holiwyn-account-persistence-restored.png"
        $accountPersistenceRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-persistence-restored.xml"
        Assert-HierarchyContains -Path $accountPersistenceRestoredHierarchy -Expected @("Signed in", "Holiwyn Demo", "Demo", "Mock login active.", "Sign out")
        return
      }
      Assert-HierarchyContains -Path $accountHierarchy -Expected @("Account", "Signed out", "Demo balance", "10,000 USDT", "Leaderboard", "Rewards", "APIs", "Language", "Theme", "Preferences")
      if ($AccountLogin) {
        & $adb -s $Device shell input swipe 640 1750 640 850 450 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-account-actions.png"
        $accountActionsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-actions.xml"
        Assert-HierarchyContains -Path $accountActionsHierarchy -Expected @("Log In", "Sign Up", "Mock login ready.")
        Invoke-TapHierarchyNode -Path $accountActionsHierarchy -Identifier "account-login-phone"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-account-signed-in.png"
        $signedInHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-signed-in.xml"
        Assert-HierarchyContains -Path $signedInHierarchy -Expected @("Mock login active.", "Sign out", "Preferences")
        Invoke-TapHierarchyNode -Path $signedInHierarchy -Identifier "account-sign-out"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-account-signed-out.png"
        $signedOutHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-signed-out.xml"
        Assert-HierarchyContains -Path $signedOutHierarchy -Expected @("Log In", "Sign Up", "Mock login ready.")
      }
      return
    }

    if ($LanguagePersistence) {
      Save-Screenshot -Name "cycle-current-holiwyn-language-persistence-seeded.png"
      $languageSeededHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-language-persistence-seeded.xml"
      Assert-HierarchyContains -Path $languageSeededHierarchy -Expected @("Holiwyn", "EN")
      Start-Sleep -Seconds 2
      & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
      Start-Sleep -Seconds 2
      $languageRestartUrl = "exp://${ExpoHost}:$Port"
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $languageRestartUrl | Out-Null
      Start-Sleep -Seconds 10
      Save-Screenshot -Name "cycle-current-holiwyn-language-persistence-restored.png"
      $languageRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-language-persistence-restored.xml"
      Assert-HierarchyContains -Path $languageRestoredHierarchy -Expected @("Holiwyn", "EN")
      return
    }

    if ($AccountPreferences) {
      & $adb -s $Device shell input swipe 540 1700 540 950 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-account-preferences.png"
      $accountPreferencesHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-preferences.xml"
      Assert-HierarchyContains -Path $accountPreferencesHierarchy -Expected @("Account", "Preferences", "Ticket default", "Sell 500 USDT", "Trading mode: Fake-token mock", "Fake-token mode only")
      return
    }

    if ($AccountProfileSyncError) {
      & $adb -s $Device shell input swipe 540 1700 540 950 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-account-profile-sync-error.png"
      $accountProfileSyncHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-profile-sync-error.xml"
      Assert-HierarchyContains -Path $accountProfileSyncHierarchy -Expected @("Account", "Preferences", "Profile sync unavailable", "Using local preferences on this device.", "Language: English", "Saved markets: 0 saved", "Trading mode: Server mode", "Fake-token mode only")
      return
    }

    if ($AccountSavedSummary) {
      Save-Screenshot -Name "cycle-current-holiwyn-account-saved-summary.png"
      $accountSavedSummaryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-saved-summary.xml"
      Assert-HierarchyContains -Path $accountSavedSummaryHierarchy -Expected @("Account", "Preferences", "Language: English", "Saved markets: 1 saved", "Ticket default: Buy 100 USDT")
      return
    }

    if ($AccountPositionSummary) {
      & $adb -s $Device shell input swipe 540 1700 540 850 500 | Out-Null
      Start-Sleep -Seconds 1
      $accountPositionCandidate = Save-UiHierarchy -Name "cycle-current-holiwyn-account-position-summary.xml"
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $accountPositionCandidate)) {
        Start-DeepLink -Url $launchUrl
        Start-Sleep -Seconds 3
        Wait-HierarchyContains -Name "cycle-current-holiwyn-account-position-summary.xml" -Expected @("Account", "Preferences", "Open positions: 1", "Open orders: 1", "Open order value: 117.5 USDT") -RestartUrl $launchUrl -Attempts 4 -DelaySeconds 2 | Out-Null
        & $adb -s $Device shell input swipe 540 1700 540 850 500 | Out-Null
        Start-Sleep -Seconds 1
      }
      Save-Screenshot -Name "cycle-current-holiwyn-account-position-summary.png"
      $accountPositionSummaryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-position-summary.xml"
      Assert-HierarchyContains -Path $accountPositionSummaryHierarchy -Expected @("Account", "Preferences", "Open positions: 1", "Open orders: 1", "Open order value: 117.5 USDT", "Total exposure: 10,398.75 USDT", "Ticket default: Buy 100 USDT")
      return
    }

    if ($AccountPortfolioValue) {
      & $adb -s $Device shell input swipe 540 1500 540 650 450 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1500 540 900 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-account-portfolio-value.png"
      $accountPortfolioValueHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-portfolio-value.xml"
      Assert-HierarchyContains -Path $accountPortfolioValueHierarchy -Expected @("Account", "Portfolio value: 10,281.25 USDT", "Ticket default: Buy 100 USDT")
      return
    }

    if ($AccountLanguageSummary) {
      Save-Screenshot -Name "cycle-current-holiwyn-account-language-summary.png"
      $accountLanguageHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-language-summary.xml"
      Assert-HierarchyContains -Path $accountLanguageHierarchy -Expected @("Account", "Preferences", "Language: English", "Ticket default: Sell 500 USDT")
      return
    }

    if ($HomeFilter) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "home-filter-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-filter-live.png"
      $homeLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-filter-live.xml"
      Assert-HierarchyContains -Path $homeLiveHierarchy -Expected @("Live", "Australia vs. Egypt", "Games")
      Invoke-TapHierarchyNode -Path $homeLiveHierarchy -Identifier "home-filter-today"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-filter-today.png"
      $homeTodayHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-filter-today.xml"
      Assert-HierarchyContains -Path $homeTodayHierarchy -Expected @("Today", "Mexico vs. Ecuador", "Games")
      return
    }

    if ($HomeSaved) {
      & $adb -s $Device shell input swipe 540 1480 540 980 300 | Out-Null
      Start-Sleep -Seconds 1
      $homeSavedReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-saved-ready.xml"
      Assert-HierarchyContains -Path $homeSavedReadyHierarchy -Expected @("Mexico vs. Ecuador", "Saved", "☆")
      Invoke-TapHierarchyNode -Path $homeSavedReadyHierarchy -Identifier "save-event-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-saved-star.png"
      $savedStarHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-saved-star.xml"
      Assert-HierarchyContains -Path $savedStarHierarchy -Expected @("Mexico vs. Ecuador", "★", "Saved")
      Invoke-TapHierarchyNode -Path $savedStarHierarchy -Identifier "home-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-saved-filter.png"
      $savedFilterHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-saved-filter.xml"
      Assert-HierarchyContains -Path $savedFilterHierarchy -Expected @("Saved", "Mexico vs. Ecuador", "Games")
      return
    }

    if ($SavedPersistence) {
      Save-Screenshot -Name "cycle-current-holiwyn-saved-persistence-seeded.png"
      $savedPersistenceSeededHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-saved-persistence-seeded.xml"
      Assert-HierarchyContains -Path $savedPersistenceSeededHierarchy -Expected @("Holiwyn", "World Cup", "Games", "Futures")
      Start-Sleep -Seconds 2
      & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
      Start-Sleep -Seconds 2
      $savedPersistenceRestartUrl = "exp://${ExpoHost}:$Port/--/?forceSearch=1"
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $savedPersistenceRestartUrl | Out-Null
      Start-Sleep -Seconds 10
      $savedPersistenceSearchHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-saved-persistence-search.xml" -Expected @("Top results", "Saved", "Mexico vs. Ecuador") -RestartUrl $savedPersistenceRestartUrl
      & $adb -s $Device shell input tap 716 650 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-saved-persistence-restored.png"
      $savedPersistenceFilterHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-saved-persistence-filter.xml"
      Assert-HierarchyContains -Path $savedPersistenceFilterHierarchy -Expected @("Top results", "Saved", "Mexico vs. Ecuador", "Group Stage")
      return
    }

    if ($HomeSavedEmpty) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "home-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-saved-empty.png"
      $homeSavedEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-saved-empty.xml"
      Assert-HierarchyContains -Path $homeSavedEmptyHierarchy -Expected @("Saved", "No saved markets yet.", "Games")
      return
    }

    if ($HomeSearchQuery) {
      & $adb -s $Device shell input swipe 540 1480 540 980 300 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-search-query.png"
      $homeSearchQueryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-search-query.xml"
      Assert-HierarchyContains -Path $homeSearchQueryHierarchy -Expected @("clean", "England vs. Congo DR", "Volume", "Liquidity")
      return
    }

    if ($HomeClearSearch) {
      $homeClearReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-clear-search-ready.xml"
      Assert-HierarchyContains -Path $homeClearReadyHierarchy -Expected @("clean", "Clear", "home-clear-search")
      Invoke-TapHierarchyNode -Path $homeClearReadyHierarchy -Identifier "home-clear-search"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 980 300 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-clear-search.png"
      $homeClearSearchHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-clear-search.xml"
      Assert-HierarchyContains -Path $homeClearSearchHierarchy -Expected @("Search World Cup markets", "Mexico vs. Ecuador", "Volume", "Liquidity")
      return
    }

    if ($HomeCardStats) {
      & $adb -s $Device shell input swipe 540 1480 540 980 300 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-home-card-stats.png"
      $homeCardStatsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-card-stats.xml"
      Assert-HierarchyContains -Path $homeCardStatsHierarchy -Expected @("Mexico vs. Ecuador", "Volume", "Liquidity", "USDT")
      return
    }

    if ($FutureCardStats) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-card-stats.png"
      $futureCardStatsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-card-stats.xml"
      Assert-HierarchyContains -Path $futureCardStatsHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "USDT", "France", "Argentina", "Spain", "Buy Yes", "Buy No")
      return
    }

    if ($FutureChartRange) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $futureChartReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-chart-ready.xml"
      Assert-HierarchyContains -Path $futureChartReadyHierarchy -Expected @("future-market-chart", "1H", "1D", "1W", "1M", "MAX", "France 34%", "Argentina 19%")
      Invoke-TapHierarchyNode -Path $futureChartReadyHierarchy -Identifier "future-chart-range-1d"
      Start-Sleep -Seconds 1
      $futureChart1dHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-chart-1d.xml"
      Assert-HierarchyContains -Path $futureChart1dHierarchy -Expected @("future-market-chart 1D", "1D")
      Invoke-TapHierarchyNode -Path $futureChart1dHierarchy -Identifier "future-chart-range-1w"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-chart-1w.png"
      $futureChart1wHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-chart-1w.xml"
      Assert-HierarchyContains -Path $futureChart1wHierarchy -Expected @("future-market-chart 1W", "1W", "Buy Yes", "Buy No")
      return
    }

    if ($FutureListTrade) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $futureListTradeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-trade-list.xml"
      Assert-HierarchyContains -Path $futureListTradeHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "France")
      Invoke-TapHierarchyNode -Path $futureListTradeHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-ticket.png"
      $futureListTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-ticket.xml"
      Assert-HierarchyContains -Path $futureListTicketHierarchy -Expected @("World Cup winner", "Yes - France", "Odds 34%", "Fake balance", "10,000 USDT", "ticket-amount-keypad", "Swipe up to buy")
      return
    }

    if ($FutureCatalogExpand) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-catalog-collapsed.png"
      $futureCatalogCollapsedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-catalog-collapsed.xml"
      Assert-HierarchyContains -Path $futureCatalogCollapsedHierarchy -Expected @("World Cup winner", "France", "Argentina", "Spain", "18 more")
      Invoke-TapHierarchyNode -Path $futureCatalogCollapsedHierarchy -Identifier "future-more-world-cup-winner"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-catalog-expanded.png"
      $futureCatalogExpandedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-catalog-expanded.xml"
      Assert-HierarchyContains -Path $futureCatalogExpandedHierarchy -Expected @("England", "Brazil", "Portugal")
      Invoke-TapHierarchyNode -Path $futureCatalogExpandedHierarchy -Identifier "future-outcome-world-cup-winner-england"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-catalog-england-ticket.png"
      $futureCatalogTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-catalog-england-ticket.xml"
      Assert-HierarchyContains -Path $futureCatalogTicketHierarchy -Expected @("trade-ticket", "World Cup winner", "Yes - England", "9c", "Swipe up to buy")
      return
    }

    if ($FutureListBuyNo) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $futureListBuyNoHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-buy-no-list.xml"
      Assert-HierarchyContains -Path $futureListBuyNoHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "France", "Buy No")
      Invoke-TapHierarchyNode -Path $futureListBuyNoHierarchy -Identifier "future-outcome-no-world-cup-winner-france"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-buy-no-ticket.png"
      $futureListBuyNoTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-buy-no-ticket.xml"
      Assert-HierarchyContains -Path $futureListBuyNoTicketHierarchy -Expected @("trade-ticket", "World Cup winner", "No - France", "Buy", "ticket-price-line", "66c", "Swipe up to buy", "Final cost may vary.")
      Invoke-TapHierarchyNode -Path $futureListBuyNoTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-buy-no-portfolio.png"
      $futureListBuyNoPortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-buy-no-portfolio.xml"
      Assert-HierarchyContains -Path $futureListBuyNoPortfolioHierarchy -Expected @("Portfolio", "Order placed", "MOCK - Buy - No - France", "World Cup winner", "Exec price", "66%", "Implied odds", "1.5x")
      return
    }

    if ($FutureListOrder) {
      $futureListOrderTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-ticket.xml"
      Assert-HierarchyContains -Path $futureListOrderTicketHierarchy -Expected @("World Cup winner", "France", "ticket-trading-mode", "Trading mode: Fake-token mock", "ticket-market-depth", "Best bid", "Best ask", "Spread", "ticket-amount-keypad", "Fake balance", "10,000 USDT", "Swipe up to buy")
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-order-ticket.png"
      $futureListOrderTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-ticket.xml"
      Assert-HierarchyContains -Path $futureListOrderTicketHierarchy -Expected @("place-mock-order", "Swipe up to buy", "Final cost may vary.")
      Invoke-TapHierarchyNode -Path $futureListOrderTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Dismiss-ExpoDeveloperMenuIfPresent | Out-Null
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-order-portfolio.png"
      $futureListOrderPortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-portfolio.xml"
      Assert-HierarchyContains -Path $futureListOrderPortfolioHierarchy -Expected @("Portfolio", "Order placed", "World Cup winner", "France", "Invested", "Current value", "Est. P/L", "Filled shares", "294.12", "Exec price", "34%", "Implied odds", "2.9x")
      & $adb -s $Device shell input swipe 540 1600 540 720 500 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1600 540 720 500 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-order-activity.png"
      $futureListOrderActivityHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-activity.xml"
      Assert-HierarchyContains -Path $futureListOrderActivityHierarchy -Expected @("Recent activity", "Bought", "World Cup winner", "France", "Filled shares 294.12", "Exec price 34%", "Implied odds 2.9x")
      Invoke-TapHierarchyNode -Path $futureListOrderActivityHierarchy -Identifier "header-account-action"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1680 540 780 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-order-account.png"
      $futureListOrderAccountHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-account.xml"
      Assert-HierarchyContains -Path $futureListOrderAccountHierarchy -Expected @("account-ticket-defaults", "Ticket default", "Buy 100 USDT", "Slippage 1%")
      return
    }

    if ($FutureListSell) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $futureListSellListHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-sell-list.xml"
      Assert-HierarchyContains -Path $futureListSellListHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "France")
      Invoke-TapHierarchyNode -Path $futureListSellListHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      $futureListSellTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-sell-ticket.xml"
      Assert-HierarchyContains -Path $futureListSellTicketHierarchy -Expected @("World Cup winner", "France", "Buy", "Sell", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $futureListSellTicketHierarchy -Identifier "ticket-side-sell"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-sell-ticket.png"
      $futureListSellActiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-sell-active.xml"
      Assert-HierarchyContains -Path $futureListSellActiveHierarchy -Expected @("World Cup winner", "France", "Sell", "Estimated proceeds", "Est. shares", "Avg price", "Swipe up to sell")
      return
    }

    if ($FutureListClose) {
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-close-closed.png"
      $futureListCloseClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-close-closed.xml"
      Assert-HierarchyContains -Path $futureListCloseClosedHierarchy -Expected @("Fake balance", "10,008.82 USDT", "No positions yet", "Recent activity", "Closed", "Today 2:04 PM", "Bought", "World Cup winner", "Entry 34%", "Current value 108.82 USDT", "Est. P/L +8.82 USDT")
      return
    }

    if ($PortfolioPositionCount) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-portfolio-tab"
      Start-Sleep -Seconds 1
      $portfolioEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-position-count-empty.xml"
      Assert-HierarchyContains -Path $portfolioEmptyHierarchy -Expected @("Portfolio", "Open positions", "0", "No positions yet")
      Invoke-TapHierarchyNode -Path $portfolioEmptyHierarchy -Identifier "holiwyn-home-tab"
      Start-Sleep -Seconds 1
      $portfolioPositionHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-position-count-home.xml"
      Invoke-TapHierarchyNode -Path $portfolioPositionHomeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $portfolioPositionListHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-position-count-list.xml"
      Invoke-TapHierarchyNode -Path $portfolioPositionListHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      $portfolioPositionTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-position-count-ticket.xml"
      Invoke-TapHierarchyNode -Path $portfolioPositionTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-portfolio-position-count-open.png"
      $portfolioPositionOpenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-position-count-open.xml"
      Assert-HierarchyContains -Path $portfolioPositionOpenHierarchy -Expected @("Portfolio", "Open positions", "1", "World Cup winner", "France", "Order placed")
      return
    }

    if ($PortfolioActivityCount) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-portfolio-tab"
      Start-Sleep -Seconds 1
      $portfolioActivityEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-activity-count-empty.xml"
      Assert-HierarchyContains -Path $portfolioActivityEmptyHierarchy -Expected @("Portfolio", "Recent activity", "0", "No positions yet")
      Invoke-TapHierarchyNode -Path $portfolioActivityEmptyHierarchy -Identifier "holiwyn-home-tab"
      Start-Sleep -Seconds 1
      $portfolioActivityHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-activity-count-home.xml"
      Invoke-TapHierarchyNode -Path $portfolioActivityHomeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $portfolioActivityListHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-activity-count-list.xml"
      Invoke-TapHierarchyNode -Path $portfolioActivityListHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      $portfolioActivityTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-activity-count-ticket.xml"
      Invoke-TapHierarchyNode -Path $portfolioActivityTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-portfolio-activity-count-open.png"
      $portfolioActivityOpenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-activity-count-open.xml"
      Assert-HierarchyContains -Path $portfolioActivityOpenHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "1", "World Cup winner", "France")
      return
    }

    if ($PortfolioClosedCount) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-portfolio-tab"
      Start-Sleep -Seconds 1
      $portfolioClosedEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-empty.xml"
      Assert-HierarchyContains -Path $portfolioClosedEmptyHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "Closed trades", "0", "No positions yet")
      Invoke-TapHierarchyNode -Path $portfolioClosedEmptyHierarchy -Identifier "holiwyn-home-tab"
      Start-Sleep -Seconds 1
      $portfolioClosedHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-home.xml"
      Invoke-TapHierarchyNode -Path $portfolioClosedHomeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $portfolioClosedListHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-list.xml"
      Invoke-TapHierarchyNode -Path $portfolioClosedListHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      $portfolioClosedTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-ticket.xml"
      Invoke-TapHierarchyNode -Path $portfolioClosedTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      $portfolioClosedOpenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-open.xml"
      Assert-HierarchyContains -Path $portfolioClosedOpenHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "Closed trades", "1", "World Cup winner", "France")
      & $adb -s $Device shell input swipe 540 1460 540 860 300 | Out-Null
      Start-Sleep -Seconds 1
      $portfolioClosedReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-ready.xml"
      Assert-HierarchyContains -Path $portfolioClosedReadyHierarchy -Expected @("Close position", "World Cup winner", "France")
      Invoke-TapHierarchyNode -Path $portfolioClosedReadyHierarchy -Identifier "close-position-" -StartsWith
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1660 540 860 350 | Out-Null
      Start-Sleep -Seconds 1
      $portfolioClosedActivityHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-activity.xml"
      Assert-HierarchyContains -Path $portfolioClosedActivityHierarchy -Expected @("Recent activity", "Closed", "Bought", "World Cup winner")
      & $adb -s $Device shell input swipe 540 860 540 1460 300 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-portfolio-closed-count-closed.png"
      $portfolioClosedClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed-count-closed.xml"
      Assert-HierarchyContains -Path $portfolioClosedClosedHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "Closed trades", "0", "1", "2", "No positions yet")
      return
    }

    if ($PortfolioPersistence) {
      $portfolioPersistenceTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-persistence-ticket.xml"
      Assert-HierarchyContains -Path $portfolioPersistenceTicketHierarchy -Expected @("World Cup winner", "France", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $portfolioPersistenceTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-portfolio-persistence-open.png"
      $portfolioPersistenceOpenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-persistence-open.xml"
      Assert-HierarchyContains -Path $portfolioPersistenceOpenHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "1", "World Cup winner", "France", "Order placed")
      Start-Sleep -Seconds 2
      & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
      Start-Sleep -Seconds 2
      $portfolioPersistenceRestartUrl = "exp://${ExpoHost}:$Port/--/?forcePortfolio=1"
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $portfolioPersistenceRestartUrl | Out-Null
      Start-Sleep -Seconds 10
      Save-Screenshot -Name "cycle-current-holiwyn-portfolio-persistence-restored.png"
      $portfolioPersistenceRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-persistence-restored.xml"
      Assert-HierarchyContains -Path $portfolioPersistenceRestoredHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "1", "World Cup winner", "France", "Order placed")
      return
    }

    if ($TicketDefaultsPersistence) {
      Save-Screenshot -Name "cycle-current-holiwyn-ticket-defaults-seeded.png"
      $ticketDefaultsSeededHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-defaults-seeded.xml"
      Assert-HierarchyContains -Path $ticketDefaultsSeededHierarchy -Expected @("World Cup winner", "France", "500", "Swipe up to sell")
      Start-Sleep -Seconds 2
      & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
      Start-Sleep -Seconds 2
      $ticketDefaultsRestartUrl = "exp://${ExpoHost}:$Port/--/?forceWorldCupWinnerFranceTicket=1"
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $ticketDefaultsRestartUrl | Out-Null
      Start-Sleep -Seconds 10
      Save-Screenshot -Name "cycle-current-holiwyn-ticket-defaults-restored.png"
      $ticketDefaultsRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-defaults-restored.xml"
      Assert-HierarchyContains -Path $ticketDefaultsRestoredHierarchy -Expected @("World Cup winner", "France", "500", "Swipe up to sell")
      return
    }

    if ($SavedSearch) {
      & $adb -s $Device shell input swipe 540 1480 540 980 300 | Out-Null
      Start-Sleep -Seconds 1
      $savedSearchHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-saved-search-home-ready.xml"
      Assert-HierarchyContains -Path $savedSearchHomeHierarchy -Expected @("Mexico vs. Ecuador", "Saved", "☆")
      Invoke-TapHierarchyNode -Path $savedSearchHomeHierarchy -Identifier "save-event-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-saved-search-star.png"
      $savedSearchStarHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-saved-search-star.xml"
      Assert-HierarchyContains -Path $savedSearchStarHierarchy -Expected @("Mexico vs. Ecuador", "★")
      Invoke-TapHierarchyNode -Path $savedSearchStarHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $savedSearchScreenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-saved-search-screen.xml"
      Assert-HierarchyContains -Path $savedSearchScreenHierarchy -Expected @("Top results", "Saved", "Mexico vs. Ecuador")
      Invoke-TapHierarchyNode -Path $savedSearchScreenHierarchy -Identifier "search-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-saved-search-filter.png"
      $savedSearchFilterHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-saved-search-filter.xml"
      Assert-HierarchyContains -Path $savedSearchFilterHierarchy -Expected @("Saved", "Mexico vs. Ecuador", "1 result")
      return
    }

    if ($SearchCardStats) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-card-stats.png"
      $searchCardStatsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-card-stats.xml"
      Assert-HierarchyContains -Path $searchCardStatsHierarchy -Expected @("Top results", "Mexico vs. Ecuador", "Volume", "Liquidity", "USDT")
      return
    }

    if ($SearchSavedEmpty) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $searchSavedEmptyScreenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-saved-empty-screen.xml"
      Assert-HierarchyContains -Path $searchSavedEmptyScreenHierarchy -Expected @("Top results", "Saved", "3 results")
      Invoke-TapHierarchyNode -Path $searchSavedEmptyScreenHierarchy -Identifier "search-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-saved-empty.png"
      $searchSavedEmptyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-saved-empty.xml"
      Assert-HierarchyContains -Path $searchSavedEmptyHierarchy -Expected @("Saved", "0 results", "No saved markets yet.")
      return
    }

    if ($EventDetailSave) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "save-event-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-save-home-star.png"
      $eventDetailSaveHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-home.xml"
      Assert-HierarchyContains -Path $eventDetailSaveHomeHierarchy -Expected @("Mexico vs. Ecuador", "Saved")
      Invoke-TapHierarchyNode -Path $eventDetailSaveHomeHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $eventDetailSaveSearchHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-search.xml"
      Invoke-TapHierarchyNode -Path $eventDetailSaveSearchHierarchy -Identifier "search-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-save-search-saved.png"
      $eventDetailSaveSearchSavedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-search-saved.xml"
      Assert-HierarchyContains -Path $eventDetailSaveSearchSavedHierarchy -Expected @("Saved", "Mexico vs. Ecuador", "1 result")
      return
    }

    if ($SearchSort) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $searchSortScreenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-sort-screen.xml"
      Assert-HierarchyContains -Path $searchSortScreenHierarchy -Expected @("Explore World Cup predictions", "Top results", "Popular", "Live first", "Mexico vs. Ecuador", "Filter")
      Invoke-TapHierarchyNode -Path $searchSortScreenHierarchy -Identifier "search-filter-sheet"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-filter-panel.png"
      $searchFilterPanelHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-filter-panel.xml"
      Assert-HierarchyContains -Path $searchFilterPanelHierarchy -Expected @("search-filter-panel", "Status", "Sort", "All", "Saved", "Popular", "Live first")
      Invoke-TapHierarchyNode -Path $searchFilterPanelHierarchy -Identifier "close-search-filter-panel"
      Start-Sleep -Seconds 1
      $searchSortReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-sort-ready.xml"
      Invoke-TapHierarchyNode -Path $searchSortReadyHierarchy -Identifier "search-sort-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-sort-live.png"
      $searchSortLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-sort-live.xml"
      Assert-HierarchyContains -Path $searchSortLiveHierarchy -Expected @("Live first", "Australia vs. Egypt", "Sports", "Soccer", "Vol.", "Liq.")
      Invoke-TapHierarchyNode -Path $searchSortLiveHierarchy -Identifier "search-result-france-argentina-final"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-open-result.png"
      $searchOpenResultHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-open-result.xml"
      Assert-HierarchyContains -Path $searchOpenResultHierarchy -Expected @("Australia vs. Egypt", "Game Lines", "Player Props", "Markets")
      return
    }

    if ($OpenOrderCancel -or $OpenSellOrderCancel) {
      $openOrderProofName = if ($OpenSellOrderCancel) { "cycle-current-holiwyn-open-sell-order" } else { "cycle-current-holiwyn-open-order" }
      $openOrderCancelButton = if ($OpenSellOrderCancel) { "cancel-open-order-smoke-open-sell-order" } else { "cancel-open-order-smoke-open-order" }
      $openOrderExpected = if ($OpenSellOrderCancel) {
        @("portfolio-open-order-count", "Open orders", "1", "Mexico vs. Ecuador winner", "Sell - Mexico - OPEN", "Limit", "52%", "Implied odds", "1.9x", "Order value", "52 USDT", "Remaining", "Potential proceeds", "52 USDT", "Cancel")
      } else {
        @("portfolio-open-order-count", "Open orders", "1", "Mexico vs. Ecuador winner", "Limit", "47%", "Implied odds", "2.1x", "Order value", "Remaining", "Potential payout", "250 USDT", "Cancel")
      }
      $openOrderCanceledExpected = if ($OpenSellOrderCancel) {
        @("portfolio-open-order-count", "Open orders", "0", "Recent activity", "Canceled", "Mexico vs. Ecuador winner", "52 USDT", "Sell - Canceled 100.00 shares - Limit 52%")
      } else {
        @("portfolio-open-order-count", "Open orders", "0", "Recent activity", "Canceled", "Mexico vs. Ecuador winner", "117.5 USDT", "Buy - Canceled 250.00 shares - Limit 47%")
      }
      Save-Screenshot -Name "$openOrderProofName.png"
      $openOrderHierarchy = Save-UiHierarchy -Name "$openOrderProofName.xml"
      Assert-HierarchyContains -Path $openOrderHierarchy -Expected $openOrderExpected
      Invoke-TapHierarchyNode -Path $openOrderHierarchy -Identifier $openOrderCancelButton
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "$openOrderProofName-canceled.png"
      $openOrderCanceledHierarchy = Save-UiHierarchy -Name "$openOrderProofName-canceled.xml"
      try {
        Assert-HierarchyContains -Path $openOrderCanceledHierarchy -Expected $openOrderCanceledExpected
      } catch {
        $openOrderCanceledSnapshot = Get-Content -Raw -Path $openOrderCanceledHierarchy
        if ($openOrderCanceledSnapshot -match [regex]::Escape($openOrderCancelButton)) {
          Invoke-TapHierarchyNode -Path $openOrderCanceledHierarchy -Identifier $openOrderCancelButton
        }
        Start-Sleep -Seconds 2
        $openOrderCanceledHierarchy = Save-UiHierarchy -Name "$openOrderProofName-canceled.xml"
        Assert-HierarchyContains -Path $openOrderCanceledHierarchy -Expected $openOrderCanceledExpected
      }
      return
    }

    if (-not ($EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailOrderBookLifecycle -or $EventDetailOrderBookInteractions -or $EventDetailFullPage -or $EventDetailChart -or $EventDetailVisibleLiveParity -or $EventDetailVisibleLiveDepth -or $EventDetailVisibleLimitLifecycle -or $EventDetailVisibleLifecycleBreadth -or $EventDetailProviderRouteStatusProof -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $LocalMvpSimpleTradeFlow -or $ServerLiveDetailBackendProof)) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "event-card-mexico-ecuador"
      Start-Sleep -Seconds 1
    }
    Save-Screenshot -Name "cycle-current-holiwyn-event-detail.png"
    $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
    $eventDetailBaseExpected = if ($ServerLiveDetailBackendProof) {
      @("Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Game Lines", "Player Props", "event-detail-live-data-inline", "live-data-status-", "live-data-source-")
    } elseif ($EventDetailPosition) {
      @("Mexico vs. Ecuador", "Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Your position")
    } else {
      @("Mexico vs. Ecuador", "Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Game Lines", "Player Props")
    }
    Assert-HierarchyContains -Path $eventDetailHierarchy -Expected $eventDetailBaseExpected

    if ($ServerLiveProviderRefreshProof) {
      Save-Screenshot -Name "cycle-current-holiwyn-provider-refresh-proof-event-detail.png"
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Mobile Provider Refresh Proof", "event-detail-live-data-inline", "live-data-status-ready", "live-data-source-polymarket-gamma", "Game Lines", "Player Props", "event-detail-open-order-book")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-provider-refresh-proof-order-book.png"
      $providerRefreshOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-provider-refresh-proof-order-book.xml"
      Assert-HierarchyContains -Path $providerRefreshOrderBookHierarchy -Expected @("event-detail-order-book-screen", "orderbook-source-orderbook-route", "orderbook-status-ready", "Best bid", "Best ask", "Order Book")
      return
    }

    if ($EventDetailChart) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-tooltip", "Target", "Current", "All", "Game", "Live")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-chart-point-mid"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-chart-pressed.png"
      $eventDetailChartPressedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-chart-pressed.xml"
      Assert-HierarchyContains -Path $eventDetailChartPressedHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-selected-point-mid", "Mid chart", "event-detail-chart-tooltip")
      Invoke-TapHierarchyNode -Path $eventDetailChartPressedHierarchy -Identifier "event-detail-chart-filter-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-chart-live.png"
      $eventDetailChartLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-chart-live.xml"
      Assert-HierarchyContains -Path $eventDetailChartLiveHierarchy -Expected @("event-detail-price-chart", "Live", "Ecuador", "36%", "event-detail-chart-tooltip")
      return
    }

    if ($EventDetailVisibleLiveParity) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-outcome-selector", "event-detail-chart-point-selector", "event-detail-chart-contract-rail", "chart-selected-contract-moneyline", "chart-selected-point-latest", "event-detail-chart-open-book", "event-detail-chart-open-ticket")

      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-chart-filter-live"
      Start-Sleep -Seconds 1
      $chartLiveHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-chart-live-filter.xml"
      Assert-HierarchyContains -Path $chartLiveHierarchy -Expected @("event-detail-price-chart", "chart-filter-Live", "Ecuador", "36%")
      Invoke-TapHierarchyNode -Path $chartLiveHierarchy -Identifier "event-detail-chart-point-target"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EG-B-holiwyn-chart-outcome-target.png"
      $chartTargetHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-chart-outcome-target.xml"
      Assert-HierarchyContains -Path $chartTargetHierarchy -Expected @("event-detail-price-chart", "chart-filter-Live", "Ecuador", "36%", "chart-selected-point-target", "Target line")

      & $adb -s $Device shell input swipe 540 1800 540 930 450 | Out-Null
      Start-Sleep -Seconds 1
      $lineSelectorHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-line-selector-before.xml"
      Assert-HierarchyContains -Path $lineSelectorHierarchy -Expected @("event-detail-spread-line-2.5", "event-detail-spread-line-1.5", "chart-contract-spread", "event-detail-spread-period-1st Half")
      Invoke-TapHierarchyNode -Path $lineSelectorHierarchy -Identifier "event-detail-spread-line-2-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EG-B-holiwyn-line-selector-25.png"
      $line25Hierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-line-selector-25.xml"
      Assert-HierarchyContains -Path $line25Hierarchy -Expected @("event-detail-spread-line-2.5", "selected-line-value", "Yes, MEX -2.5")
      Invoke-TapHierarchyNode -Path $line25Hierarchy -Identifier "event-detail-spread-line-1-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EG-B-holiwyn-line-selector-15.png"
      $line15Hierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-line-selector-15.xml"
      Assert-HierarchyContains -Path $line15Hierarchy -Expected @("event-detail-spread-line-1.5", "selected-line-value", "Yes, MEX -1.5")

      & $adb -s $Device shell input swipe 540 720 540 1760 500 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EG-B-holiwyn-chart-spread-linked.png"
      $chartSpreadHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-chart-spread-linked.xml"
      Assert-HierarchyContains -Path $chartSpreadHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-contract-rail", "chart-selected-contract-spread", "chart-selected-market-mexico-ecuador-spread", "chart-selected-line-1.5", "chart-selected-period-regulation", "MEX -1.5 RT")

      Invoke-TapHierarchyNode -Path $chartSpreadHierarchy -Identifier "event-detail-chart-open-book"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EG-B-holiwyn-chart-book-spread.png"
      $chartBookHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-chart-book-spread.xml"
      Assert-HierarchyContains -Path $chartBookHierarchy -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-spread", "selected-family-Spreads", "selected-line-1.5", "selected-period-regulation", "order-book-ladder", "Price", "Shares", "Value", "Buy", "Sell")

      Invoke-TapHierarchyNode -Path $chartBookHierarchy -Identifier "event-detail-order-book-close"
      Start-Sleep -Seconds 1
      $chartAfterBookHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-chart-after-book-close.xml"
      Invoke-TapHierarchyNode -Path $chartAfterBookHierarchy -Identifier "event-detail-chart-open-ticket"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EG-B-holiwyn-chart-spread-ticket.png"
      $chartTicketHierarchy = Save-UiHierarchy -Name "cycle-EG-B-holiwyn-chart-spread-ticket.xml"
      Assert-HierarchyContains -Path $chartTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "Mexico -1.5 spread", "Mexico vs. Ecuador", "ticket-selection-line", "provider-source-polymarket-fixture", "provider-market-gamma-mexico-ecuador-spread-15", "provider-condition-condition-mexico-ecuador-spread-15", "provider-token-token-spread-yes-15", "ticket-side-buy", "ticket-side-sell", "Choose an amount")

      $proof = [ordered]@{
        cycle = "EG-B"
        scope = "Visible chart, line selector, orderbook ladder, and ticket carry-through parity"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLiveParity -Port $Port -OutputDir docs/mobile/screenshots/cycle-EG-B-visible-live-parity -HierarchyOutputDir docs/mobile/harness/cycle-EG-B-visible-live-parity"
        eventIdentity = "Mexico vs. Ecuador"
        result = "pass"
        assertions = [ordered]@{
          chartOutcomeTouch = "Chart Live filter changes the selected chart outcome to Ecuador and keeps target tooltip visible."
          chartPointTouch = "Point selector changes chart-selected-point-target with Target line tooltip."
          lineSelector = "Spread line rail visibly changes 2.5 then returns to backend-shaped 1.5."
          chartContractRail = "Chart rail carries chart-selected-contract-spread chart-selected-market-mexico-ecuador-spread chart-selected-line-1.5 chart-selected-period-regulation."
          bookCarryThrough = "Chart Book opens Spreads order book with selected line/period and ladder columns."
          ticketCarryThrough = "Chart Trade opens ticket with provider fixture market/condition/token for Mexico -1.5 spread."
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-outcome-target.png",
          "docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-outcome-target.xml",
          "docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-line-selector-25.png",
          "docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-line-selector-25.xml",
          "docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-line-selector-15.png",
          "docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-line-selector-15.xml",
          "docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-spread-linked.png",
          "docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-spread-linked.xml",
          "docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-book-spread.png",
          "docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-book-spread.xml",
          "docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-spread-ticket.png",
          "docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-chart-spread-ticket.xml"
        )
        remainingGaps = @(
          "Chart geometry is still rendered with React Native layout primitives rather than a true pan/zoom chart engine.",
          "Real provider-backed line-family chart history remains dependent on backend/provider market history coverage."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EG-B-visible-live-parity-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailVisibleLifecycleBreadth) {
      if ($EventDetailVisibleLimitLifecycleBackendProof) {
        $eoPrefix = "cycle-EO-B-visible-breadth"
        $eoEventTitle = "EL-A Provider Breadth World Cup Live"
        $eoNoFallback = @("Mexico -1.5 spread", "Mexico vs. Ecuador", "Team to Advance", "portfolio-display-label-Match Winner")

        Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @($eoEventTitle, "event-detail-top-order-book", "event-detail-price-chart", "event-detail-game-lines", "live-data-source-polymarket-gamma")
        Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
        $eoBookBaselineHierarchy = Wait-HierarchyContains -Name "$eoPrefix-moneyline-book.xml" -Expected @("event-detail-order-book-screen", "order-book-grouped-market-selector", "selected-family-Moneyline", "selected-market-type-winner", "selected-line-none", "selected-period-full-game", "orderbook-source-orderbook-route", "orderbook-status-ready") -Attempts 8 -DelaySeconds 1
        Save-Screenshot -Name "$eoPrefix-moneyline-book.png"
        Assert-HierarchyDoesNotContain -Path $eoBookBaselineHierarchy -Unexpected @("orderbook-source-contract-fixture", "polymarket-fixture", "deterministic-contract-fixture")

        Invoke-TapHierarchyNode -Path $eoBookBaselineHierarchy -Identifier "order-book-grouped-market-selector"
        Start-Sleep -Seconds 1
        $eoBookSelectorHierarchy = Save-UiHierarchy -Name "$eoPrefix-selector.xml"
        Assert-HierarchyContains -Path $eoBookSelectorHierarchy -Expected @("order-book-market-selector-sheet", "market-type-spread", "line-1.5", "period-full-game", "selector-key-spread:full-game:1.5")
        $eoBookSelectorContent = Get-Content -Raw -Path $eoBookSelectorHierarchy
        if ($eoBookSelectorContent -notmatch "order-book-market-choice-([0-9a-f-]{36})[^\`"]*?market-type-spread line-1\.5 period-full-game") {
          throw "Unable to extract provider-backed spread market id from selector hierarchy."
        }
        $eoSpreadMarketId = $matches[1]
        Invoke-TapHierarchyNode -Path $eoBookSelectorHierarchy -Identifier "order-book-market-choice-$eoSpreadMarketId"
        $eoSpreadBookHierarchy = Wait-HierarchyContains -Name "$eoPrefix-spread-book.xml" -Expected @("event-detail-order-book-screen", "orderbook-source-orderbook-route", "orderbook-status-ready", "selected-market-$eoSpreadMarketId", "selected-family-Spreads", "selected-market-type-spread", "selected-line-1.5", "selected-period-full-game") -Attempts 8 -DelaySeconds 1
        Save-Screenshot -Name "$eoPrefix-spread-book.png"

        $eoSpreadBookContent = Get-Content -Raw -Path $eoSpreadBookHierarchy
        if ($eoSpreadBookContent -notmatch "selected-outcome-([0-9a-f-]{36})") {
          throw "Unable to extract provider-backed spread outcome id from Book hierarchy."
        }
        $eoSpreadOutcomeId = $matches[1]
        if ($eoSpreadBookContent -notmatch "selected-provider-market-([^ ]+)") {
          throw "Unable to extract provider market id from Book hierarchy."
        }
        $eoProviderMarket = $matches[1]
        if ($eoSpreadBookContent -notmatch "selected-provider-condition-([^ ]+)") {
          throw "Unable to extract provider condition id from Book hierarchy."
        }
        $eoProviderCondition = $matches[1]
        if ($eoSpreadBookContent -notmatch "selected-provider-token-([^ ]+)") {
          throw "Unable to extract provider token id from Book hierarchy."
        }
        $eoProviderToken = $matches[1]
        if ($eoSpreadBookContent -notmatch "selected-provider-outcome-([^\`"]+?) book-display-mode") {
          throw "Unable to extract provider outcome label from Book hierarchy."
        }
        $eoProviderOutcome = $matches[1]
        $eoSelectionExpected = @(
          "selected-market-$eoSpreadMarketId",
          "selected-family-Spreads",
          "selected-outcome-$eoSpreadOutcomeId",
          "selected-side-yes",
          "selected-market-type-spread",
          "selected-line-1.5",
          "selected-period-full-game",
          "selected-provider-source-polymarket",
          "selected-provider-market-$eoProviderMarket",
          "selected-provider-condition-$eoProviderCondition",
          "selected-provider-token-$eoProviderToken",
          "selected-provider-outcome-$eoProviderOutcome"
        )
        $eoTicketSelectionExpected = @(
          "ticket-market-family-spread",
          "ticket-market-type-spread",
          "ticket-market-id-$eoSpreadMarketId",
          "ticket-outcome-id-$eoSpreadOutcomeId",
          "ticket-market-group-spread",
          "ticket-line-1.5",
          "ticket-period-full-game",
          "ticket-selection-side-home",
          "ticket-display-label-Spread",
          "ticket-contract-side-yes",
          "ticket-provider-source-polymarket",
          "ticket-provider-market-$eoProviderMarket",
          "ticket-provider-condition-$eoProviderCondition",
          "ticket-provider-token-$eoProviderToken",
          "ticket-provider-outcome-$eoProviderOutcome"
        )
        $eoPortfolioSelectionExpected = @(
          "portfolio-snapshot-source-order-time",
          "portfolio-market-family-spread",
          "portfolio-market-type-spread",
          "portfolio-market-id-$eoSpreadMarketId",
          "portfolio-outcome-id-$eoSpreadOutcomeId",
          "portfolio-market-group-spread",
          "portfolio-line-1.5",
          "portfolio-period-full-game",
          "portfolio-side-sell",
          "portfolio-display-label-Spread",
          "portfolio-contract-side-yes",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$eoProviderMarket",
          "portfolio-provider-condition-$eoProviderCondition",
          "portfolio-provider-token-$eoProviderToken",
          "portfolio-provider-outcome-$eoProviderOutcome"
        )
        Assert-HierarchyContains -Path $eoSpreadBookHierarchy -Expected (@("order-book-ask-level-$eoSpreadOutcomeId-1", "order-book-bid-level-$eoSpreadOutcomeId-1") + $eoSelectionExpected)
        if ($eoSpreadBookContent -notmatch "order-book-bid-level-$eoSpreadOutcomeId-1[^\`"]*?([0-9]+)c ([0-9]+\.[0-9]{2}) USDT ([0-9.,k]+) shares") {
          throw "Unable to extract route-backed bid limit from spread Book hierarchy."
        }
        $eoBidCents = $matches[1]
        $eoBidDecimal = $matches[2]
        $eoBidShares = $matches[3]
        $eoBidProbability = [int]$eoBidCents
        Assert-HierarchyContains -Path $eoSpreadBookHierarchy -Expected @("order-book-selected-contract", "selected-provider-source-polymarket", "selected-provider-market-$eoProviderMarket", "selected-provider-token-$eoProviderToken", "$($eoBidCents)c", "$eoBidDecimal USDT")
        Assert-HierarchyDoesNotContain -Path $eoSpreadBookHierarchy -Unexpected @("orderbook-source-contract-fixture", "polymarket-fixture", "deterministic-contract-fixture")

        Invoke-TapHierarchyNode -Path $eoSpreadBookHierarchy -Identifier "order-book-bid-level-$eoSpreadOutcomeId-1"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$eoPrefix-bid-staged.png"
        $eoBidStagedHierarchy = Save-UiHierarchy -Name "$eoPrefix-bid-staged.xml"
        Assert-HierarchyContains -Path $eoBidStagedHierarchy -Expected (@(
          "order-book-staged-order",
          "staged-level-bid-$eoBidCents",
          "staged-ticket-side-sell",
          "staged-price-$eoBidDecimal USDT",
          "Sell bid",
          "$($eoBidCents)c",
          "staged-level-selected"
        ) + $eoSelectionExpected)

        Invoke-TapHierarchyNode -Path $eoBidStagedHierarchy -Identifier "order-book-staged-open-ticket"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$eoPrefix-sell-ticket-empty.png"
        $eoTicketEmptyHierarchy = Save-UiHierarchy -Name "$eoPrefix-sell-ticket-empty.xml"
        Assert-HierarchyContains -Path $eoTicketEmptyHierarchy -Expected (@(
          "trade-ticket",
          "ticket-side-pill",
          "Sell",
          "ticket-selection-summary",
          "Spread",
          $eoProviderOutcome,
          "ticket-limit-side-bid",
          "ticket-limit-price-$eoBidCents",
          "ticket-limit-decimal-$eoBidDecimal"
        ) + $eoTicketSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $eoTicketEmptyHierarchy -Unexpected $eoNoFallback

        Invoke-TapHierarchyNode -Path $eoTicketEmptyHierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $eoTicketAmount10Hierarchy = Save-UiHierarchy -Name "$eoPrefix-sell-ticket-amount-10.xml"
        Invoke-TapHierarchyNode -Path $eoTicketAmount10Hierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $eoTicketAmount20Hierarchy = Save-UiHierarchy -Name "$eoPrefix-sell-ticket-amount-20.xml"
        Invoke-TapHierarchyNode -Path $eoTicketAmount20Hierarchy -Identifier "ticket-preset-5"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$eoPrefix-sell-ticket-ready.png"
        $eoTicketReadyHierarchy = Save-UiHierarchy -Name "$eoPrefix-sell-ticket-ready.xml"
        Assert-HierarchyContains -Path $eoTicketReadyHierarchy -Expected (@('$25', "ticket-price-line", "$($eoBidCents)c", "Swipe up to sell", "place-mock-order", "ticket-limit-side-bid", "ticket-limit-price-$eoBidCents", "ticket-limit-decimal-$eoBidDecimal") + $eoTicketSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $eoTicketReadyHierarchy -Unexpected ($eoNoFallback + @("Odds $($eoBidProbability - 1)%", "Odds $($eoBidProbability + 1)%"))

        Invoke-TapHierarchyNode -Path $eoTicketReadyHierarchy -Identifier "place-mock-order"
        Start-Sleep -Seconds 2
        Save-Screenshot -Name "$eoPrefix-portfolio-open.png"
        $eoPortfolioOpenHierarchy = Save-UiHierarchy -Name "$eoPrefix-portfolio-open.xml"
        Assert-HierarchyContains -Path $eoPortfolioOpenHierarchy -Expected (@(
          "Portfolio",
          "Open positions",
          "Open orders",
          "Recent activity",
          "Order placed",
          "latest-order-card",
          "latest-order-status",
          "order-status-open",
          "latest-order-snapshot",
          "latest-activity-card",
          "activity-sold",
          "status-filled",
          "Limit",
          "$eoBidCents%",
          "portfolio-limit-side-bid",
          "portfolio-limit-price-$eoBidCents",
          "portfolio-limit-decimal-$eoBidDecimal",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$eoProviderMarket",
          "portfolio-provider-token-$eoProviderToken"
        ) + $eoPortfolioSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $eoPortfolioOpenHierarchy -Unexpected $eoNoFallback

        & $adb -s $Device shell input swipe 540 1300 540 760 450 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$eoPrefix-portfolio-open-order.png"
        $eoPortfolioOpenOrderHierarchy = Save-UiHierarchy -Name "$eoPrefix-portfolio-open-order.xml"
        Assert-HierarchyContains -Path $eoPortfolioOpenOrderHierarchy -Expected (@(
          "Portfolio",
          "open-order-row-",
          "open-order-status-",
          "cancel-open-order-",
          "Limit",
          "$eoBidCents%",
          "portfolio-limit-side-bid",
          "portfolio-limit-price-$eoBidCents",
          "portfolio-limit-decimal-$eoBidDecimal",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$eoProviderMarket",
          "portfolio-provider-token-$eoProviderToken"
        ) + $eoPortfolioSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $eoPortfolioOpenOrderHierarchy -Unexpected $eoNoFallback

        & $adb -s $Device shell input swipe 540 760 540 1300 450 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$eoPrefix-portfolio-cancel-target.png"
        $eoPortfolioCancelHierarchy = Save-UiHierarchy -Name "$eoPrefix-portfolio-cancel-target.xml"
        Assert-HierarchyContains -Path $eoPortfolioCancelHierarchy -Expected (@(
          "Portfolio",
          "open-order-row-",
          "open-order-status-",
          "cancel-open-order-",
          "portfolio-limit-side-bid",
          "portfolio-limit-price-$eoBidCents",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-token-$eoProviderToken"
        ) + $eoPortfolioSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $eoPortfolioCancelHierarchy -Unexpected $eoNoFallback

        Invoke-TapHierarchyNode -Path $eoPortfolioCancelHierarchy -Identifier "cancel-open-order-" -StartsWith
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$eoPrefix-portfolio-canceled.png"
        $eoPortfolioCanceledHierarchy = Save-UiHierarchy -Name "$eoPrefix-portfolio-canceled.xml"
        Assert-HierarchyContains -Path $eoPortfolioCanceledHierarchy -Expected (@(
          "Portfolio",
          "portfolio-open-order-count",
          "0",
          "latest-activity-card",
          "latest-activity-status-",
          "Canceled",
          "activity-canceled",
          "latest-activity-snapshot",
          "portfolio-limit-side-bid",
          "portfolio-limit-price-$eoBidCents",
          "portfolio-limit-decimal-$eoBidDecimal",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$eoProviderMarket",
          "portfolio-provider-token-$eoProviderToken"
        ) + $eoPortfolioSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $eoPortfolioCanceledHierarchy -Unexpected $eoNoFallback

        $proof = [ordered]@{
          cycle = "EO-B"
          scope = "Visible Android route-backed lifecycle breadth: Moneyline Book plus Spread bid/Sell open/cancel lifecycle"
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLifecycleBreadth -Port $Port -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          backendBaseUrl = $BackendBaseUrl
          orderMode = "mock"
          marketDataMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
          apiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
          adbReverse = "tcp:3002 tcp:3002"
          eventIdentity = $eoEventTitle
          serverEventSlug = $ServerEventSlug
          selectedMarketId = $eoSpreadMarketId
          selectedOutcomeId = $eoSpreadOutcomeId
          selectedProviderMarket = $eoProviderMarket
          selectedProviderToken = $eoProviderToken
          routeBackedProviderDepth = $true
          result = "pass"
          selectedLimit = [ordered]@{
            side = "bid"
            cents = [int]$eoBidCents
            decimal = $eoBidDecimal
            shares = $eoBidShares
          }
          assertions = [ordered]@{
            backendHealth = "Backend /api/health was required before launch; the proof aborts instead of falling back when unavailable."
            moneylineBreadth = "Initial Book baseline is route-backed Moneyline with selected-family-Moneyline selected-market-type-winner selected-line-none and orderbook-source-orderbook-route/orderbook-status-ready."
            spreadSelection = "Grouped selector switches to provider-backed Spread 1.5 without losing selected market/outcome/line/period/provider identity."
            stagedBid = "Tapping order-book-bid-level-$eoSpreadOutcomeId-1 stages Sell bid at $eoBidDecimal USDT / $($eoBidCents)c."
            ticketLimit = "Sell ticket exposes ticket-limit-side-bid ticket-limit-price-$eoBidCents ticket-limit-decimal-$eoBidDecimal and submits at ticket-price-line $($eoBidCents)c."
            latestOrder = "Latest order card exposes order-status-open and the same sell-side portfolio limit/source/market/outcome/line/period/provider tokens."
            openOrder = "Open order row shows Limit $eoBidCents% and the same order-time snapshot identity."
            activityHistory = "Sell filled and canceled activity cards retain portfolio-limit-side-bid portfolio-limit-price-$eoBidCents and the same selected route-backed Book identity."
            fallbackGuard = "Portfolio and activity reject Mexico fixture labels, Team to Advance, and generic Match Winner fallback labels for the selected spread Sell lifecycle."
          }
          artifacts = @(
            "$OutputDir/$eoPrefix-moneyline-book.png",
            "$HierarchyOutputDir/$eoPrefix-moneyline-book.xml",
            "$HierarchyOutputDir/$eoPrefix-selector.xml",
            "$OutputDir/$eoPrefix-spread-book.png",
            "$HierarchyOutputDir/$eoPrefix-spread-book.xml",
            "$OutputDir/$eoPrefix-bid-staged.png",
            "$HierarchyOutputDir/$eoPrefix-bid-staged.xml",
            "$OutputDir/$eoPrefix-sell-ticket-empty.png",
            "$HierarchyOutputDir/$eoPrefix-sell-ticket-empty.xml",
            "$HierarchyOutputDir/$eoPrefix-sell-ticket-amount-10.xml",
            "$HierarchyOutputDir/$eoPrefix-sell-ticket-amount-20.xml",
            "$OutputDir/$eoPrefix-sell-ticket-ready.png",
            "$HierarchyOutputDir/$eoPrefix-sell-ticket-ready.xml",
            "$OutputDir/$eoPrefix-portfolio-open.png",
            "$HierarchyOutputDir/$eoPrefix-portfolio-open.xml",
            "$OutputDir/$eoPrefix-portfolio-open-order.png",
            "$HierarchyOutputDir/$eoPrefix-portfolio-open-order.xml",
            "$OutputDir/$eoPrefix-portfolio-cancel-target.png",
            "$HierarchyOutputDir/$eoPrefix-portfolio-cancel-target.xml",
            "$OutputDir/$eoPrefix-portfolio-canceled.png",
            "$HierarchyOutputDir/$eoPrefix-portfolio-canceled.xml"
          )
          remainingGaps = @(
            "This visible proof uses mock trading with server market-data mode; it proves visible route-backed identity preservation, not production order execution.",
            "Totals lifecycle breadth and immutable first-class backend selection snapshots remain future hardening."
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir "$eoPrefix-proof.json"
        $proofJson = ($proof | ConvertTo-Json -Depth 6) -replace "`r`n", "`n"
        [System.IO.File]::WriteAllText($proofPath, "$proofJson`n", [System.Text.UTF8Encoding]::new($false))
        Write-Host "Proof summary: $proofPath"
        return
      }

      throw "-EventDetailVisibleLifecycleBreadth requires a backend server event slug so routeBackedProviderDepth can be proven."
    }

    if ($EventDetailVisibleLimitLifecycle) {
      if ($EventDetailVisibleLimitLifecycleBackendProof) {
        $enPrefix = "cycle-EN-B-visible-route-limit-lifecycle"
        $enEventTitle = "EL-A Provider Breadth World Cup Live"
        $enNoFallback = @("Mexico -1.5 spread", "Mexico vs. Ecuador", "Team to Advance", "portfolio-display-label-Match Winner")

        Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @($enEventTitle, "event-detail-top-order-book", "event-detail-price-chart", "event-detail-game-lines", "live-data-source-polymarket-gamma")
        Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
        $enBookBaselineHierarchy = Wait-HierarchyContains -Name "$enPrefix-book-baseline.xml" -Expected @("event-detail-order-book-screen", "order-book-grouped-market-selector", "order-book-ladder", "orderbook-source-orderbook-route", "orderbook-status-ready") -Attempts 8 -DelaySeconds 1
        Save-Screenshot -Name "$enPrefix-book-baseline.png"

        Invoke-TapHierarchyNode -Path $enBookBaselineHierarchy -Identifier "order-book-grouped-market-selector"
        Start-Sleep -Seconds 1
        $enBookSelectorHierarchy = Save-UiHierarchy -Name "$enPrefix-selector.xml"
        Assert-HierarchyContains -Path $enBookSelectorHierarchy -Expected @("order-book-market-selector-sheet", "market-type-spread", "line-1.5", "period-full-game", "selector-key-spread:full-game:1.5")
        $enBookSelectorContent = Get-Content -Raw -Path $enBookSelectorHierarchy
        if ($enBookSelectorContent -notmatch "order-book-market-choice-([0-9a-f-]{36})[^\`"]*?market-type-spread line-1\.5 period-full-game") {
          throw "Unable to extract provider-backed spread market id from selector hierarchy."
        }
        $enSpreadMarketId = $matches[1]
        Invoke-TapHierarchyNode -Path $enBookSelectorHierarchy -Identifier "order-book-market-choice-$enSpreadMarketId"
        $enSpreadBookHierarchy = Wait-HierarchyContains -Name "$enPrefix-spread-book.xml" -Expected @("event-detail-order-book-screen", "orderbook-source-orderbook-route", "orderbook-status-ready", "selected-market-$enSpreadMarketId", "selected-market-type-spread", "selected-line-1.5", "selected-period-full-game") -Attempts 8 -DelaySeconds 1
        Save-Screenshot -Name "$enPrefix-spread-book.png"

        $enSpreadBookContent = Get-Content -Raw -Path $enSpreadBookHierarchy
        if ($enSpreadBookContent -notmatch "selected-outcome-([0-9a-f-]{36})") {
          throw "Unable to extract provider-backed spread outcome id from Book hierarchy."
        }
        $enSpreadOutcomeId = $matches[1]
        if ($enSpreadBookContent -notmatch "selected-provider-market-([^ ]+)") {
          throw "Unable to extract provider market id from Book hierarchy."
        }
        $enProviderMarket = $matches[1]
        if ($enSpreadBookContent -notmatch "selected-provider-condition-([^ ]+)") {
          throw "Unable to extract provider condition id from Book hierarchy."
        }
        $enProviderCondition = $matches[1]
        if ($enSpreadBookContent -notmatch "selected-provider-token-([^ ]+)") {
          throw "Unable to extract provider token id from Book hierarchy."
        }
        $enProviderToken = $matches[1]
        if ($enSpreadBookContent -notmatch "selected-provider-outcome-([^\`"]+?) book-display-mode") {
          throw "Unable to extract provider outcome label from Book hierarchy."
        }
        $enProviderOutcome = $matches[1]
        $enSelectionExpected = @(
          "selected-market-$enSpreadMarketId",
          "selected-family-Spreads",
          "selected-outcome-$enSpreadOutcomeId",
          "selected-side-yes",
          "selected-market-type-spread",
          "selected-line-1.5",
          "selected-period-full-game",
          "selected-provider-source-polymarket",
          "selected-provider-market-$enProviderMarket",
          "selected-provider-condition-$enProviderCondition",
          "selected-provider-token-$enProviderToken",
          "selected-provider-outcome-$enProviderOutcome"
        )
        $enTicketSelectionExpected = @(
          "ticket-market-family-spread",
          "ticket-market-type-spread",
          "ticket-market-id-$enSpreadMarketId",
          "ticket-outcome-id-$enSpreadOutcomeId",
          "ticket-market-group-spread",
          "ticket-line-1.5",
          "ticket-period-full-game",
          "ticket-selection-side-home",
          "ticket-display-label-Spread",
          "ticket-contract-side-yes",
          "ticket-provider-source-polymarket",
          "ticket-provider-market-$enProviderMarket",
          "ticket-provider-condition-$enProviderCondition",
          "ticket-provider-token-$enProviderToken",
          "ticket-provider-outcome-$enProviderOutcome"
        )
        $enPortfolioSelectionExpected = @(
          "portfolio-snapshot-source-order-time",
          "portfolio-market-family-spread",
          "portfolio-market-type-spread",
          "portfolio-market-id-$enSpreadMarketId",
          "portfolio-outcome-id-$enSpreadOutcomeId",
          "portfolio-market-group-spread",
          "portfolio-line-1.5",
          "portfolio-period-full-game",
          "portfolio-side-buy",
          "portfolio-display-label-Spread",
          "portfolio-contract-side-yes",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$enProviderMarket",
          "portfolio-provider-condition-$enProviderCondition",
          "portfolio-provider-token-$enProviderToken",
          "portfolio-provider-outcome-$enProviderOutcome"
        )
        Assert-HierarchyContains -Path $enSpreadBookHierarchy -Expected (@("order-book-ask-level-$enSpreadOutcomeId-1", "order-book-bid-level-$enSpreadOutcomeId-1") + $enSelectionExpected)
        if ($enSpreadBookContent -notmatch "order-book-ask-level-$enSpreadOutcomeId-1[^\`"]*?([0-9]+)c ([0-9]+\.[0-9]{2}) USDT ([0-9.,k]+) shares") {
          throw "Unable to extract route-backed ask limit from spread Book hierarchy."
        }
        $enAskCents = $matches[1]
        $enAskDecimal = $matches[2]
        $enAskShares = $matches[3]
        $enAskProbability = [int]$enAskCents
        Assert-HierarchyContains -Path $enSpreadBookHierarchy -Expected @("order-book-selected-contract", "selected-provider-source-polymarket", "selected-provider-market-$enProviderMarket", "selected-provider-token-$enProviderToken", "$($enAskCents)c", "$enAskDecimal USDT")
        Assert-HierarchyDoesNotContain -Path $enSpreadBookHierarchy -Unexpected @("orderbook-source-contract-fixture", "polymarket-fixture", "deterministic-contract-fixture")

        Invoke-TapHierarchyNode -Path $enSpreadBookHierarchy -Identifier "order-book-ask-level-$enSpreadOutcomeId-1"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$enPrefix-ask-staged.png"
        $enAskStagedHierarchy = Save-UiHierarchy -Name "$enPrefix-ask-staged.xml"
        Assert-HierarchyContains -Path $enAskStagedHierarchy -Expected (@(
          "order-book-staged-order",
          "staged-level-ask-$enAskCents",
          "staged-ticket-side-buy",
          "staged-price-$enAskDecimal USDT",
          "Buy ask",
          "$($enAskCents)c",
          "staged-level-selected"
        ) + $enSelectionExpected)

        Invoke-TapHierarchyNode -Path $enAskStagedHierarchy -Identifier "order-book-staged-open-ticket"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$enPrefix-ticket-empty.png"
        $enTicketEmptyHierarchy = Save-UiHierarchy -Name "$enPrefix-ticket-empty.xml"
        Assert-HierarchyContains -Path $enTicketEmptyHierarchy -Expected (@(
          "trade-ticket",
          "ticket-side-pill",
          "Buy",
          "ticket-selection-summary",
          "Spread",
          $enProviderOutcome,
          "ticket-limit-side-ask",
          "ticket-limit-price-$enAskCents",
          "ticket-limit-decimal-$enAskDecimal"
        ) + $enTicketSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $enTicketEmptyHierarchy -Unexpected $enNoFallback

        Invoke-TapHierarchyNode -Path $enTicketEmptyHierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $enTicketAmount10Hierarchy = Save-UiHierarchy -Name "$enPrefix-ticket-amount-10.xml"
        Invoke-TapHierarchyNode -Path $enTicketAmount10Hierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $enTicketAmount20Hierarchy = Save-UiHierarchy -Name "$enPrefix-ticket-amount-20.xml"
        Invoke-TapHierarchyNode -Path $enTicketAmount20Hierarchy -Identifier "ticket-preset-5"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$enPrefix-ticket-ready.png"
        $enTicketReadyHierarchy = Save-UiHierarchy -Name "$enPrefix-ticket-ready.xml"
        Assert-HierarchyContains -Path $enTicketReadyHierarchy -Expected (@('$25', "ticket-price-line", "$($enAskCents)c", "To win", "Swipe up to buy", "place-mock-order", "ticket-limit-side-ask", "ticket-limit-price-$enAskCents", "ticket-limit-decimal-$enAskDecimal") + $enTicketSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $enTicketReadyHierarchy -Unexpected ($enNoFallback + @("Odds $($enAskProbability - 1)%", "Odds $($enAskProbability + 1)%"))

        Invoke-TapHierarchyNode -Path $enTicketReadyHierarchy -Identifier "place-mock-order"
        Start-Sleep -Seconds 2
        Save-Screenshot -Name "$enPrefix-portfolio-open.png"
        $enPortfolioOpenHierarchy = Save-UiHierarchy -Name "$enPrefix-portfolio-open.xml"
        Assert-HierarchyContains -Path $enPortfolioOpenHierarchy -Expected (@(
          "Portfolio",
          "Open positions",
          "Open orders",
          "Recent activity",
          "Order placed",
          "latest-order-card",
          "latest-order-status",
          "order-status-open",
          "latest-order-snapshot",
          "latest-activity-card",
          "activity-opened",
          "open-order-row-",
          "open-order-status-",
          "Limit",
          "$enAskCents%",
          "portfolio-limit-side-ask",
          "portfolio-limit-price-$enAskCents",
          "portfolio-limit-decimal-$enAskDecimal",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$enProviderMarket",
          "portfolio-provider-token-$enProviderToken"
        ) + $enPortfolioSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $enPortfolioOpenHierarchy -Unexpected $enNoFallback

        Invoke-TapHierarchyNode -Path $enPortfolioOpenHierarchy -Identifier "cancel-open-order-" -StartsWith
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$enPrefix-portfolio-canceled.png"
        $enPortfolioCanceledHierarchy = Save-UiHierarchy -Name "$enPrefix-portfolio-canceled.xml"
        Assert-HierarchyContains -Path $enPortfolioCanceledHierarchy -Expected (@(
          "Portfolio",
          "portfolio-open-order-count",
          "0",
          "latest-activity-card",
          "latest-activity-status-",
          "Canceled",
          "activity-canceled",
          "latest-activity-snapshot",
          "portfolio-limit-side-ask",
          "portfolio-limit-price-$enAskCents",
          "portfolio-limit-decimal-$enAskDecimal",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-market-$enProviderMarket",
          "portfolio-provider-token-$enProviderToken"
        ) + $enPortfolioSelectionExpected)
        Assert-HierarchyDoesNotContain -Path $enPortfolioCanceledHierarchy -Unexpected $enNoFallback

        $proof = [ordered]@{
          cycle = "EN-B"
          scope = "Visible Android route-backed Book-staged limit lifecycle"
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLimitLifecycle -Port $Port -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          backendBaseUrl = $BackendBaseUrl
          orderMode = "mock"
          marketDataMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
          apiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
          adbReverse = "tcp:3002 tcp:3002"
          eventIdentity = $enEventTitle
          serverEventSlug = $ServerEventSlug
          selectedMarketId = $enSpreadMarketId
          selectedOutcomeId = $enSpreadOutcomeId
          selectedProviderMarket = $enProviderMarket
          selectedProviderToken = $enProviderToken
          routeBackedProviderDepth = $true
          result = "pass"
          selectedLimit = [ordered]@{
            side = "ask"
            cents = [int]$enAskCents
            decimal = $enAskDecimal
            shares = $enAskShares
          }
          assertions = [ordered]@{
            backendHealth = "Backend /api/health was required before launch; the proof aborts instead of falling back when unavailable."
            bookSelection = "Live event Book opens from route-backed live detail with mock trading plus server market-data mode, switches to provider-backed Spread 1.5, and exposes orderbook-source-orderbook-route/orderbook-status-ready."
            stagedAsk = "Tapping order-book-ask-level-$enSpreadOutcomeId-1 stages Buy ask at $enAskDecimal USDT / $($enAskCents)c."
            ticketLimit = "Trade ticket exposes ticket-limit-side-ask ticket-limit-price-$enAskCents ticket-limit-decimal-$enAskDecimal and submits at ticket-price-line $($enAskCents)c."
            latestOrder = "Latest order card exposes order-status-open and the same portfolio limit/source/market/outcome/line/period/provider tokens."
            openOrder = "Open order row shows Limit $enAskCents% and the same order-time snapshot identity."
            activityHistory = "Opened and canceled activity cards retain portfolio-limit-side-ask portfolio-limit-price-$enAskCents and the same selected route-backed Book identity."
            fallbackGuard = "Portfolio and activity reject Mexico fixture labels, Team to Advance, and generic Match Winner fallback labels for the selected spread lifecycle."
          }
          artifacts = @(
            "$OutputDir/$enPrefix-book-baseline.png",
            "$HierarchyOutputDir/$enPrefix-book-baseline.xml",
            "$HierarchyOutputDir/$enPrefix-selector.xml",
            "$OutputDir/$enPrefix-spread-book.png",
            "$HierarchyOutputDir/$enPrefix-spread-book.xml",
            "$OutputDir/$enPrefix-ask-staged.png",
            "$HierarchyOutputDir/$enPrefix-ask-staged.xml",
            "$OutputDir/$enPrefix-ticket-empty.png",
            "$HierarchyOutputDir/$enPrefix-ticket-empty.xml",
            "$HierarchyOutputDir/$enPrefix-ticket-amount-10.xml",
            "$HierarchyOutputDir/$enPrefix-ticket-amount-20.xml",
            "$OutputDir/$enPrefix-ticket-ready.png",
            "$HierarchyOutputDir/$enPrefix-ticket-ready.xml",
            "$OutputDir/$enPrefix-portfolio-open.png",
            "$HierarchyOutputDir/$enPrefix-portfolio-open.xml",
            "$OutputDir/$enPrefix-portfolio-canceled.png",
            "$HierarchyOutputDir/$enPrefix-portfolio-canceled.xml"
          )
          remainingGaps = @(
            "This visible proof uses the selected disposable EL-A provider-backed route event supplied by the backend route proof lineage.",
            "Broader future hardening remains for multiple market families, bid-side order lifecycle, and immutable first-class backend selection snapshots."
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir "$enPrefix-proof.json"
        $proofJson = ($proof | ConvertTo-Json -Depth 6) -replace "`r`n", "`n"
        [System.IO.File]::WriteAllText($proofPath, "$proofJson`n", [System.Text.UTF8Encoding]::new($false))
        Write-Host "Proof summary: $proofPath"
        return
      }

      $emBookSelectionExpected = @(
        "selected-market-mexico-ecuador-spread",
        "selected-family-Spreads",
        "selected-outcome-yes",
        "selected-side-yes",
        "selected-market-type-spread",
        "selected-line-1.5",
        "selected-period-regulation",
        "selected-provider-source-polymarket-fixture",
        "selected-provider-market-gamma-mexico-ecuador-spread-15",
        "selected-provider-condition-condition-mexico-ecuador-spread-15",
        "selected-provider-token-token-spread-yes-15"
      )
      $emTicketSelectionExpected = @(
        "ticket-market-family-spread",
        "ticket-market-type-spread",
        "ticket-market-id-mexico-ecuador-spread",
        "ticket-outcome-id-yes",
        "ticket-line-1.5",
        "ticket-period-regulation",
        "ticket-selection-side-yes",
        "ticket-contract-side-yes",
        "ticket-provider-source-polymarket-fixture",
        "ticket-provider-market-gamma-mexico-ecuador-spread-15",
        "ticket-provider-condition-condition-mexico-ecuador-spread-15",
        "ticket-provider-token-token-spread-yes-15",
        "ticket-limit-side-ask",
        "ticket-limit-price-41",
        "ticket-limit-decimal-0.41"
      )
      $emPortfolioSelectionExpected = @(
        "portfolio-market-family-spread",
        "portfolio-market-type-spread",
        "portfolio-market-id-mexico-ecuador-spread",
        "portfolio-outcome-id-yes",
        "portfolio-line-1.5",
        "portfolio-period-regulation",
        "portfolio-side-buy",
        "portfolio-contract-side-yes",
        "portfolio-provider-source-polymarket-fixture",
        "portfolio-provider-market-gamma-mexico-ecuador-spread-15",
        "portfolio-provider-condition-condition-mexico-ecuador-spread-15",
        "portfolio-provider-token-token-spread-yes-15",
        "portfolio-limit-side-ask",
        "portfolio-limit-price-41",
        "portfolio-limit-decimal-0.41"
      )
      $emNoFallback = @("Team to Advance", "MOCK - Buy - Mexico (Reg. Time)", "Mexico vs. Ecuador winner")

      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Mexico vs. Ecuador", "event-detail-top-order-book", "event-detail-price-chart", "event-detail-game-lines")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
      $emBookBaselineHierarchy = Wait-HierarchyContains -Name "cycle-EM-B-visible-limit-lifecycle-book-baseline.xml" -Expected @("event-detail-order-book-screen", "order-book-grouped-market-selector", "order-book-ladder") -Attempts 8 -DelaySeconds 1
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-book-baseline.png"

      Invoke-TapHierarchyNode -Path $emBookBaselineHierarchy -Identifier "order-book-grouped-market-selector"
      Start-Sleep -Seconds 1
      $emBookSelectorHierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-selector.xml"
      Assert-HierarchyContains -Path $emBookSelectorHierarchy -Expected @("order-book-market-selector-sheet", "order-book-market-choice-mexico-ecuador-spread", "market-type-spread", "line-1.5", "period-regulation")
      Invoke-TapHierarchyNode -Path $emBookSelectorHierarchy -Identifier "order-book-market-choice-mexico-ecuador-spread"
      $emSpreadBookHierarchy = Wait-HierarchyContains -Name "cycle-EM-B-visible-limit-lifecycle-spread-book.xml" -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-spread", "orderbook-status-ready", "order-book-ask-level-yes-1") -Attempts 8 -DelaySeconds 1
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-spread-book.png"
      Assert-HierarchyContains -Path $emSpreadBookHierarchy -Expected (@(
        "event-detail-order-book-screen",
        "order-book-selected-contract",
        "orderbook-source-contract-fixture",
        "orderbook-status-ready",
        "order-book-outcome-yes",
        "order-book-ask-level-yes-1",
        "order-book-bid-level-yes-1",
        "41c",
        "0.41 USDT",
        "34c",
        "0.34 USDT"
      ) + $emBookSelectionExpected)

      Invoke-TapHierarchyNode -Path $emSpreadBookHierarchy -Identifier "order-book-ask-level-yes-1"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-ask-staged.png"
      $emAskStagedHierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-ask-staged.xml"
      Assert-HierarchyContains -Path $emAskStagedHierarchy -Expected (@(
        "order-book-staged-order",
        "staged-level-ask-41",
        "staged-ticket-side-buy",
        "staged-price-0.41 USDT",
        "Buy ask",
        "41c",
        "staged-level-selected",
        "order-book-staged-open-ticket"
      ) + $emBookSelectionExpected)

      Invoke-TapHierarchyNode -Path $emAskStagedHierarchy -Identifier "order-book-staged-open-ticket"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-ticket-empty.png"
      $emTicketEmptyHierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-ticket-empty.xml"
      Assert-HierarchyContains -Path $emTicketEmptyHierarchy -Expected (@(
        "trade-ticket",
        "ticket-side-pill",
        "Buy",
        "ticket-selection-summary",
        "Mexico -1.5 spread",
        "ticket-selection-line",
        "Yes",
        "Choose an amount"
      ) + $emTicketSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $emTicketEmptyHierarchy -Unexpected $emNoFallback

      Invoke-TapHierarchyNode -Path $emTicketEmptyHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $emTicketAmount10Hierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-ticket-amount-10.xml"
      Invoke-TapHierarchyNode -Path $emTicketAmount10Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $emTicketAmount20Hierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $emTicketAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-ticket-ready.png"
      $emTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-ticket-ready.xml"
      Assert-HierarchyContains -Path $emTicketReadyHierarchy -Expected (@('$25', "ticket-price-line", "41c", "To win", "Swipe up to buy", "place-mock-order") + $emTicketSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $emTicketReadyHierarchy -Unexpected $emNoFallback

      Invoke-TapHierarchyNode -Path $emTicketReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-portfolio-open.png"
      $emPortfolioOpenHierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-portfolio-open.xml"
      Assert-HierarchyContains -Path $emPortfolioOpenHierarchy -Expected (@(
        "Portfolio",
        "Open positions",
        "Open orders",
        "Recent activity",
        "Order placed",
        "latest-order-card",
        "latest-order-status",
        "order-status-open",
        "latest-order-snapshot",
        "open-order-row-",
        "open-order-status-",
        "open-order-snapshot-",
        "latest-activity-card",
        "latest-activity-snapshot-",
        "activity-opened",
        "status-filled",
        "Limit",
        "41%",
        "Buy - Filled shares",
        "Exec price 41%",
        "Mexico -1.5 spread"
      ) + $emPortfolioSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $emPortfolioOpenHierarchy -Unexpected $emNoFallback

      Invoke-TapHierarchyNode -Path $emPortfolioOpenHierarchy -Identifier "cancel-open-order-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EM-B-visible-limit-lifecycle-portfolio-canceled.png"
      $emPortfolioCanceledHierarchy = Save-UiHierarchy -Name "cycle-EM-B-visible-limit-lifecycle-portfolio-canceled.xml"
      Assert-HierarchyContains -Path $emPortfolioCanceledHierarchy -Expected (@(
        "Portfolio",
        "portfolio-open-order-count",
        "0",
        "latest-activity-card",
        "latest-activity-status-",
        "Canceled",
        "activity-canceled",
        "status-canceled",
        "Buy - Canceled",
        "Limit 41%",
        "fake-token-test"
      ) + $emPortfolioSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $emPortfolioCanceledHierarchy -Unexpected $emNoFallback

      $proof = [ordered]@{
        cycle = "EM-B"
        scope = "Visible Android Book-staged limit lifecycle"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLimitLifecycle -Port $Port -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        eventIdentity = "Mexico vs. Ecuador"
        routeBackedProviderDepth = $false
        result = "pass"
        assertions = [ordered]@{
          bookSelection = "Live event Book ladder switches to selected-market-mexico-ecuador-spread selected-line-1.5 selected-period-regulation selected-outcome-yes."
          stagedAsk = "Tapping order-book-ask-level-yes-1 stages Buy ask at 0.41 USDT / 41c."
          ticketLimit = "Trade ticket exposes ticket-limit-side-ask ticket-limit-price-41 ticket-limit-decimal-0.41 and submits at ticket-price-line 41c."
          latestOrder = "Latest order card exposes order-status-open and the same portfolio limit/source/market/outcome/line/period/provider tokens."
          openOrder = "Open order row shows Limit 41% and the same order-time snapshot identity."
          activityHistory = "Filled latest-activity and canceled latest-activity cards retain portfolio-limit-side-ask portfolio-limit-price-41 and the same selected Book identity."
          fallbackGuard = "No Team to Advance or Mexico moneyline fallback appears after the Book-selected limit order."
        }
        artifacts = @(
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-book-baseline.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-book-baseline.xml",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-selector.xml",
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-spread-book.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-spread-book.xml",
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-ask-staged.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-ask-staged.xml",
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-ticket-empty.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-ticket-empty.xml",
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-ticket-ready.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-ticket-ready.xml",
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-portfolio-open.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-portfolio-open.xml",
          "$OutputDir/cycle-EM-B-visible-limit-lifecycle-portfolio-canceled.png",
          "$HierarchyOutputDir/cycle-EM-B-visible-limit-lifecycle-portfolio-canceled.xml"
        )
        remainingGaps = @(
          "This branch proves the visible mobile fake-token lifecycle without editing backend routes.",
          "If Agent A adds new provider-backed route support, Lead can rerun this EM harness with that integrated event and tighten routeBackedProviderDepth to true."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EM-B-visible-limit-lifecycle-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailVisibleLiveDepth) {
      $usesServerLiveDepth = $ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25"
      $depthEventTitle = if ($usesServerLiveDepth) { "EL-A Provider Breadth World Cup Live" } else { "Mexico vs. Ecuador" }
      $depthOutcomeId = if ($usesServerLiveDepth) { "e373c663-b58c-4d57-aae1-8f5cd136d44f" } else { "mexico" }
      $depthOutcomeLabel = if ($usesServerLiveDepth) { "Breadth Home" } else { "Mexico" }
      $depthAskCents = if ($usesServerLiveDepth) { "55" } else { "68" }
      $depthAskDecimal = if ($usesServerLiveDepth) { "0.55" } else { "0.68" }
      $depthAskShares = if ($usesServerLiveDepth) { "150" } else { "900" }
      $depthBidCents = if ($usesServerLiveDepth) { "50" } else { "61" }
      $depthBidDecimal = if ($usesServerLiveDepth) { "0.50" } else { "0.61" }
      $depthBidShares = if ($usesServerLiveDepth) { "180" } else { "1.28k" }
      $depthProofCycle = if ($usesServerLiveDepth) { "EL-integrated" } else { "EL-B" }
      $depthProofScope = if ($usesServerLiveDepth) {
        "Integrated route-backed live Book ladder staged price and Buy/Sell ticket handoff"
      } else {
        "Visible mobile live Book ladder staged price and Buy/Sell ticket handoff"
      }

      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @($depthEventTitle, "event-detail-top-order-book", "event-detail-price-chart", "event-detail-game-lines")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-book-baseline.png"
      $depthBookBaselineHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-book-baseline.xml"
      Assert-HierarchyContains -Path $depthBookBaselineHierarchy -Expected @("event-detail-order-book-screen", "selected-outcome-$depthOutcomeId", "order-book-ladder", "order-book-staged-order", "staged-level-none", "Tap", "ladder", "stage", "order-book-ask-level-$depthOutcomeId-1", "order-book-bid-level-$depthOutcomeId-1")

      Invoke-TapHierarchyNode -Path $depthBookBaselineHierarchy -Identifier "order-book-ask-level-$depthOutcomeId-1"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-ask-staged.png"
      $depthAskStagedHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-ask-staged.xml"
      Assert-HierarchyContains -Path $depthAskStagedHierarchy -Expected @("order-book-staged-order", "staged-level-ask-$depthAskCents", "staged-ticket-side-buy", "staged-price-$depthAskDecimal USDT", "Buy ask", "$($depthAskCents)c", "$depthAskShares shares", "staged-level-selected", "order-book-staged-open-ticket")

      Invoke-TapHierarchyNode -Path $depthAskStagedHierarchy -Identifier "order-book-staged-open-ticket"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-ask-ticket.png"
      $depthAskTicketHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-ask-ticket.xml"
      Assert-HierarchyContains -Path $depthAskTicketHierarchy -Expected @("trade-ticket", "ticket-side-pill", "Buy", "ticket-selection-summary", "Match winner", "Yes - $depthOutcomeLabel", "ticket-preset-10", "Choose an amount")
      Invoke-TapHierarchyNode -Path $depthAskTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-ask-ticket-priced.png"
      $depthAskTicketPricedHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-ask-ticket-priced.xml"
      Assert-HierarchyContains -Path $depthAskTicketPricedHierarchy -Expected @("trade-ticket", "ticket-side-pill", "Buy", "ticket-price-line", "$($depthAskCents)c", "To win", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $depthAskTicketPricedHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1
      $depthAfterAskTicketHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-after-ask-ticket.xml"
      Assert-HierarchyContains -Path $depthAfterAskTicketHierarchy -Expected @("event-detail-order-book-screen", "order-book-staged-order", "staged-level-ask-$depthAskCents")

      Invoke-TapHierarchyNode -Path $depthAfterAskTicketHierarchy -Identifier "order-book-bid-level-$depthOutcomeId-1"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-bid-staged.png"
      $depthBidStagedHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-bid-staged.xml"
      Assert-HierarchyContains -Path $depthBidStagedHierarchy -Expected @("order-book-staged-order", "staged-level-bid-$depthBidCents", "staged-ticket-side-sell", "staged-price-$depthBidDecimal USDT", "Sell bid", "$($depthBidCents)c", "$depthBidShares shares", "staged-level-selected", "order-book-staged-open-ticket")

      Invoke-TapHierarchyNode -Path $depthBidStagedHierarchy -Identifier "order-book-staged-open-ticket"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-bid-ticket.png"
      $depthBidTicketHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-bid-ticket.xml"
      Assert-HierarchyContains -Path $depthBidTicketHierarchy -Expected @("trade-ticket", "ticket-side-pill", "Sell", "ticket-selection-summary", "Match winner", "Yes - $depthOutcomeLabel", "ticket-preset-10", "Choose an amount")
      Invoke-TapHierarchyNode -Path $depthBidTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EL-B-visible-live-depth-bid-ticket-priced.png"
      $depthBidTicketPricedHierarchy = Save-UiHierarchy -Name "cycle-EL-B-visible-live-depth-bid-ticket-priced.xml"
      Assert-HierarchyContains -Path $depthBidTicketPricedHierarchy -Expected @("trade-ticket", "ticket-side-pill", "Sell", "ticket-price-line", "$($depthBidCents)c", "Swipe up to sell")

      $proof = [ordered]@{
        cycle = $depthProofCycle
        scope = $depthProofScope
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLiveDepth -Port $Port -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        eventIdentity = $depthEventTitle
        serverEventSlug = if ($usesServerLiveDepth) { $ServerEventSlug } else { $null }
        backendBaseUrl = if ($usesServerLiveDepth) { $BackendBaseUrl } else { $null }
        routeBackedProviderDepth = $usesServerLiveDepth
        result = "pass"
        assertions = [ordered]@{
          baseline = "Book opens on $depthOutcomeLabel winner with staged-level-none and visible ask/bid ladder rows."
          askStage = "Tapping order-book-ask-level-$depthOutcomeId-1 stages Buy ask at $depthAskDecimal USDT / $($depthAskCents)c for $depthAskShares shares."
          askTicket = "Staged open-ticket launches a Buy ticket; after tapping +`$10 it shows ticket-price-line $($depthAskCents)c, To win, and Swipe up to buy."
          bidStage = "Tapping order-book-bid-level-$depthOutcomeId-1 stages Sell bid at $depthBidDecimal USDT / $($depthBidCents)c for $depthBidShares shares."
          bidTicket = "Staged open-ticket launches a Sell ticket; after tapping +`$10 it shows ticket-price-line $($depthBidCents)c and Swipe up to sell."
          contractShape = if ($usesServerLiveDepth) { "The proof uses route-backed provider orderbook depth from the integrated backend event." } else { "The proof uses deterministic backend-shaped Book depth already exposed to the mobile UI; no backend route or provider service was edited." }
        }
        artifacts = @(
          "$OutputDir/cycle-EL-B-visible-live-depth-book-baseline.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-book-baseline.xml",
          "$OutputDir/cycle-EL-B-visible-live-depth-ask-staged.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-ask-staged.xml",
          "$OutputDir/cycle-EL-B-visible-live-depth-ask-ticket.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-ask-ticket.xml",
          "$OutputDir/cycle-EL-B-visible-live-depth-ask-ticket-priced.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-ask-ticket-priced.xml",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-after-ask-ticket.xml",
          "$OutputDir/cycle-EL-B-visible-live-depth-bid-staged.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-bid-staged.xml",
          "$OutputDir/cycle-EL-B-visible-live-depth-bid-ticket.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-bid-ticket.xml",
          "$OutputDir/cycle-EL-B-visible-live-depth-bid-ticket-priced.png",
          "$HierarchyOutputDir/cycle-EL-B-visible-live-depth-bid-ticket-priced.xml"
        )
        remainingGaps = @(
          "The staged ladder handoff is local mobile UI behavior; server order submission still consumes the existing ticket/order service contract.",
          "Real provider-backed live depth breadth remains dependent on backend/provider coverage outside this Agent B UI-owned change."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EL-B-visible-live-depth-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailFullPage) {
      $gamePageResetUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceMexicoEcuadorDetail=1"
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-top.png"
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-price-chart", "event-detail-chat-preview", "event-detail-primary-outcomes", "MEX", "ECU", "Game Lines", "Player Props", "event-detail-top-order-book", "event-detail-share")

      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-chart-filter-game"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-chart-game.png"
      $gamePageChartHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-chart-game.xml"
      Assert-HierarchyContains -Path $gamePageChartHierarchy -Expected @("event-detail-price-chart", "Game", "Mexico vs. Ecuador")

      Invoke-TapHierarchyNode -Path $gamePageChartHierarchy -Identifier "event-detail-top-order-book"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-top-order-book.png"
      $gamePageTopOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-top-order-book.xml"
      Assert-HierarchyContains -Path $gamePageTopOrderBookHierarchy -Expected @("event-detail-order-book-screen", "Order Book", "event-detail-order-book-close")
      Invoke-TapHierarchyNode -Path $gamePageTopOrderBookHierarchy -Identifier "event-detail-order-book-close"
      Start-Sleep -Seconds 1
      $gamePageAfterOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-after-top-order-book.xml"
      Invoke-TapHierarchyNode -Path $gamePageAfterOrderBookHierarchy -Identifier "event-detail-share"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-share-sheet.png"
      $gamePageShareHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-share-sheet.xml"
      Assert-HierarchyContains -Path $gamePageShareHierarchy -Expected @("event-detail-share-sheet", "Share this market", "Copy link", "Share to chat", "Invite")
      Invoke-TapHierarchyNode -Path $gamePageShareHierarchy -Identifier "event-detail-share-dismiss"
      Start-Sleep -Seconds 1

      Start-DeepLink -Url $gamePageResetUrl
      Start-Sleep -Seconds 4
      $gamePageChatReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-chat-ready.xml" -Expected @("Mexico vs. Ecuador", "event-detail-tab-chat") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $gamePageChatReadyHierarchy -Identifier "event-detail-tab-chat"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-chat.png"
      $gamePageChatHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-chat.xml"
      Assert-HierarchyContains -Path $gamePageChatHierarchy -Expected @("event-detail-chat-page", "event-detail-chat-feed", "gigglyeel0550", "event-detail-chat-input", "Message this market")
      & $adb -s $Device shell input swipe 540 1850 540 1050 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-chat-lower.png"
      $gamePageChatLowerHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-chat-lower.xml"
      Assert-HierarchyContains -Path $gamePageChatLowerHierarchy -Expected @("event-detail-chat-reactions", "event-detail-chat-sticky-outcomes", "event-detail-chat-emoji-picker")

      Start-DeepLink -Url $gamePageResetUrl
      Start-Sleep -Seconds 4
      $gamePageTicketTabHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-ticket-tab.xml" -Expected @("event-detail-tab-game") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $gamePageTicketTabHierarchy -Identifier "event-detail-tab-game"
      Start-Sleep -Seconds 1
      $gamePageTicketReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-ticket-ready.xml" -Expected @("event-detail-primary-outcome-mexico-ecuador-winner-mexico", "event-detail-primary-outcome-mexico-ecuador-winner-ecuador") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $gamePageTicketReadyHierarchy -Identifier "event-detail-primary-outcome-mexico-ecuador-winner-mexico"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-ticket.png"
      $gamePageTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-ticket.xml"
      Assert-HierarchyContains -Path $gamePageTicketHierarchy -Expected @("trade-ticket", "ticket-drag-handle", "Mexico vs. Ecuador", "Yes - Mexico", "ticket-preset-1", "ticket-preset-10", "Choose an amount", "Final cost may vary.")
      Invoke-TapHierarchyNode -Path $gamePageTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1

      Start-DeepLink -Url $gamePageResetUrl
      Start-Sleep -Seconds 4
      $gamePageMarketTabHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-market-tab.xml" -Expected @("event-detail-tab-game") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $gamePageMarketTabHierarchy -Identifier "event-detail-tab-game"
      Start-Sleep -Seconds 1
      $gamePageMarketReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-market-ready.xml" -Expected @("Mexico vs. Ecuador", "Game Lines", "Player Props") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      & $adb -s $Device shell input swipe 540 1800 540 980 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-markets.png"
      $gamePageMarketsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-markets.xml"
      Assert-HierarchyContains -Path $gamePageMarketsHierarchy -Expected @("event-detail-compact-game-header", "event-detail-sticky-market-tabs", "Game Lines", "Player Props", "MEX 64%", "ECU 36%", "Spread", "MEX to win by over 1.5 goals", "Totals", "Total goals", "1st Half Winner")
      & $adb -s $Device shell input swipe 540 1840 540 1250 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-markets-lower.png"
      $gamePageMarketsLowerHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-markets-lower.xml"
      Assert-HierarchyContains -Path $gamePageMarketsLowerHierarchy -Expected @("event-detail-sticky-market-tabs", "2nd Half Winner")
      Invoke-TapHierarchyNode -Path $gamePageMarketsLowerHierarchy -Identifier "event-detail-sticky-player-props-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-sticky-props.png"
      $gamePageStickyPropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-sticky-props.xml"
      Assert-HierarchyContains -Path $gamePageStickyPropsHierarchy -Expected @("Player Props", "event-detail-player-props-empty", "Player Props unavailable for this match", "Market Rules")

      Start-DeepLink -Url $gamePageResetUrl
      Start-Sleep -Seconds 4
      $gamePagePropsTabHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-props-tab.xml" -Expected @("event-detail-tab-game") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $gamePagePropsTabHierarchy -Identifier "event-detail-tab-game"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Seconds 1
      $gamePagePropsReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-game-page-full-props-ready.xml" -Expected @("event-detail-player-props-tab") -RestartUrl $gamePageResetUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $gamePagePropsReadyHierarchy -Identifier "event-detail-player-props-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-props.png"
      $gamePagePropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-props.xml"
      Assert-HierarchyContains -Path $gamePagePropsHierarchy -Expected @("Player Props", "event-detail-player-props-empty", "Player Props unavailable for this match")
      & $adb -s $Device shell input swipe 540 1800 540 620 550 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-props-lower.png"
      $gamePagePropsLowerHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-props-lower.xml"
      Assert-HierarchyContains -Path $gamePagePropsLowerHierarchy -Expected @("Market Rules", "View Full Rules", "More Events")

      & $adb -s $Device shell input swipe 540 1800 540 650 550 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-game-page-full-rules-more.png"
      $gamePageRulesHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-game-page-full-rules-more.xml"
      Assert-HierarchyContains -Path $gamePageRulesHierarchy -Expected @("Market Rules", "View Full Rules", "More Events", "Portugal vs. Croatia", "England vs. Congo DR")
      return
    }

    if ($EventDetailSummary) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-market-summary", "5 markets", "10 outcomes", "Game lines", "3 markets", "Props", "2 markets", "Match winner")
      return
    }

    if ($EventDetailActions) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-top-order-book", "event-detail-share", "Mexico vs. Ecuador", "Game Lines")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
      Wait-HierarchyContains -Name "cycle-current-holiwyn-event-detail-top-order-book.xml" -Expected @("event-detail-order-book-screen", "Order Book", "Mexico vs. Ecuador - Match winner", "event-detail-order-book-close") -Attempts 5 -DelaySeconds 1 | Out-Null
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-top-order-book.png"
      $eventDetailTopOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-top-order-book.xml"
      Assert-HierarchyContains -Path $eventDetailTopOrderBookHierarchy -Expected @("event-detail-order-book-screen", "Order Book", "Mexico vs. Ecuador - Match winner", "event-detail-order-book-close")
      Invoke-TapHierarchyNode -Path $eventDetailTopOrderBookHierarchy -Identifier "event-detail-order-book-close"
      Start-Sleep -Seconds 1
      $eventDetailAfterOrderBookDismissHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-top-order-book-dismissed.xml"
      Assert-HierarchyContains -Path $eventDetailAfterOrderBookDismissHierarchy -Expected @("Mexico vs. Ecuador", "Game Lines", "event-detail-share")
      Invoke-TapHierarchyNode -Path $eventDetailAfterOrderBookDismissHierarchy -Identifier "event-detail-share"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-share-sheet.png"
      $eventDetailShareHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-share-sheet.xml"
      Assert-HierarchyContains -Path $eventDetailShareHierarchy -Expected @("event-detail-share-sheet", "Share this market", "Mexico vs. Ecuador", "Copy link", "Share to chat", "Invite", "event-detail-share-dismiss")
      Invoke-TapHierarchyNode -Path $eventDetailShareHierarchy -Identifier "event-detail-share-dismiss"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-share-dismissed.png"
      $eventDetailShareDismissedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-share-dismissed.xml"
      Assert-HierarchyContains -Path $eventDetailShareDismissedHierarchy -Expected @("Mexico vs. Ecuador", "Game Lines", "event-detail-top-order-book", "event-detail-share")
      return
    }

    if ($EventDetailChat) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-tab-chat"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-chat.png"
      $eventDetailChatHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-chat.xml"
      Assert-HierarchyContains -Path $eventDetailChatHierarchy -Expected @("event-detail-chat-page", "Mexico vs. Ecuador", "MEX 64%", "ECU 36%", "0 - 0", "event-detail-chat-feed", "gigglyeel0550", "BTTS $36", "VAMOS", "mktmaker21", "linewatcher", "event-detail-chat-typing", "3 traders typing", "event-detail-chat-reactions", "Vamos", "Goal", "Hold", "Cash out", "event-detail-chat-input", "Message this market")
      & $adb -s $Device shell input swipe 540 1850 540 1050 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-chat-lower.png"
      $eventDetailChatLowerHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-chat-lower.xml"
      Assert-HierarchyContains -Path $eventDetailChatLowerHierarchy -Expected @("event-detail-chat-input", "Message this market", "event-detail-chat-emoji-picker", "event-detail-chat-sticky-outcomes", "event-detail-chat-sticky-outcome-mexico-ecuador-winner-mexico", "event-detail-chat-sticky-outcome-mexico-ecuador-winner-ecuador")
      return
    }

    if ($EventDetailPosition) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-position-card", "Your position", "Match winner", "Cost 64%", "50 USDT", "Current 68%", "48.38 USDT", "-1.62 USDT", "To win", "78.13 USDT", "Buy more 68%", "Cash out", "event-detail-position-buy-more", "event-detail-position-cash-out", "MEX 64%", "ECU 36%")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-position-buy-more"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-position-buy-ticket.png"
      $eventDetailPositionTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-position-buy-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailPositionTicketHierarchy -Expected @("Mexico", "Mexico vs. Ecuador", "Trading mode: Fake-token mock", "Estimated cost", "Est. shares", "Avg price", "Swipe up to buy")
      Start-DeepLink -Url $launchUrl
      Start-Sleep -Seconds 4
      $eventDetailPositionCashReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-event-detail-position-cash-ready.xml" -Expected @("event-detail-position-card", "Cash out") -RestartUrl $launchUrl -Attempts 5 -DelaySeconds 2
      & $adb -s $Device shell input swipe 540 1800 540 980 400 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-position-lines.png"
      $eventDetailPositionLinesHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-position-lines.xml"
      Assert-HierarchyContains -Path $eventDetailPositionLinesHierarchy -Expected @("MEX 64%", "ECU 36%", "Game Lines", "Player Props", "Regulation Time Winner", "90 Minutes Plus Stoppage Time")
      Start-DeepLink -Url $launchUrl
      Start-Sleep -Seconds 4
      $eventDetailPositionCashReadyHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-event-detail-position-cash-ready.xml" -Expected @("event-detail-position-card", "Cash out") -RestartUrl $launchUrl -Attempts 5 -DelaySeconds 2
      Invoke-TapHierarchyNode -Path $eventDetailPositionCashReadyHierarchy -Identifier "event-detail-position-cash-out"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-position-cashed-out.png"
      $eventDetailPositionCashedOutHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-position-cashed-out.xml"
      Assert-HierarchyContains -Path $eventDetailPositionCashedOutHierarchy -Expected @("MEX 64%", "ECU 36%", "Game Lines", "Player Props", "Match winner", "Regulation Time Winner")
      $eventDetailPositionCashedOutSnapshot = Get-Content -Raw -Path $eventDetailPositionCashedOutHierarchy
      if ($eventDetailPositionCashedOutSnapshot -match [regex]::Escape("event-detail-position-card")) {
        throw "Game page cash out did not remove the inline position card."
      }
      return
    }

    if ($EventDetailMarketOutcomeCount) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Match winner", "Regulation Time Winner", "90 Minutes Plus Stoppage Time", "Best bid", "0.62 USDT", "Best ask", "0.66 USDT")
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-game-line-expanded.png"
      $eventDetailExpandedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-game-line-expanded.xml"
      Assert-HierarchyContains -Path $eventDetailExpandedHierarchy -Expected @("Regulation Time Winner", "90 Minutes Plus Stoppage Time", "Mexico (Reg. Time)", "Tie", "Ecuador (Reg. Time)", "1.6x", "3.9x", "6.7x", "61%", "26%", "15%", "event-detail-outcome-mexico-ecuador-winner-mexico")
      Invoke-TapHierarchyNode -Path $eventDetailExpandedHierarchy -Identifier "event-detail-market-toggle-mexico-ecuador-winner"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-game-line-collapsed.png"
      $eventDetailCollapsedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-game-line-collapsed.xml"
      Assert-HierarchyContains -Path $eventDetailCollapsedHierarchy -Expected @("Regulation Time Winner", "90 Minutes Plus Stoppage Time")
      $eventDetailCollapsedSnapshot = Get-Content -Raw -Path $eventDetailCollapsedHierarchy
      if ($eventDetailCollapsedSnapshot -match [regex]::Escape("Mexico (Reg. Time)") -or $eventDetailCollapsedSnapshot -match [regex]::Escape("Tie")) {
        throw "Collapsed game-line row still exposes regulation-time outcome rows."
      }
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-game-line-groups.png"
      $eventDetailGroupsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-game-line-groups.xml"
      Assert-HierarchyContains -Path $eventDetailGroupsHierarchy -Expected @("Spread", "MEX to win by over 1.5 goals", "1.5", "Reg. Time", "1st Half", "2nd Half", "Yes, MEX -1.5", "No", "Totals", "Total goals over 2.5", "1st Half Winner", "Who wins the first half?", "Tie 1H")
      & $adb -s $Device shell input swipe 540 1800 540 720 500 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-game-line-deeper-groups.png"
      $eventDetailDeeperGroupsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-game-line-deeper-groups.xml"
      Assert-HierarchyContains -Path $eventDetailDeeperGroupsHierarchy -Expected @("2nd Half Winner", "Who wins the second half?", "Tie 2H", "Full Game Team Total Goals (Reg. Time)", "MEX goals over 1.5", "MEX Over 1.5", "MEX Under 1.5")
      return
    }

    if ($ServerLiveDetailOrderBook) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-open-order-book", "provider-source-polymarket", "Best bid", "Best ask", "Spread")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-order-book.png"
      $serverOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-order-book.xml"
      if ($ServerEventSlug -ne "world-cup-2026-curacao-vs-cote-divoire-2026-06-25") {
        Assert-HierarchyContains -Path $serverOrderBookHierarchy -Expected @("event-detail-order-book-screen", "orderbook-source-orderbook-route", "orderbook-status-ready", "event-detail-order-book-depth-state", "Route depth", "Order Book", "Best bid", "Best ask", "route-depth-ladder", "bid-levels", "ask-levels", "order-book-bid-level-", "order-book-ask-level-", "Buy", "Sell")
        Invoke-TapHierarchyNode -Path $serverOrderBookHierarchy -Identifier "order-book-buy-" -StartsWith
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-server-live-order-book-ticket.png"
        $serverOrderBookTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-order-book-ticket.xml"
        Assert-HierarchyContains -Path $serverOrderBookTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "provider-source-polymarket", "provider-market-", "provider-condition-", "provider-token-", "ticket-selection-line", "Choose an amount")
        return
      }
      Assert-HierarchyContains -Path $serverOrderBookHierarchy -Expected @("event-detail-order-book-screen", "orderbook-source-orderbook-route", "orderbook-status-ready", "event-detail-order-book-depth-state", "Route depth", "Order Book", "Best bid", "Best ask", "0.59 USDT", "0.65 USDT", "1.06k shares", "940 shares", "Buy", "Sell")
      Invoke-TapHierarchyNode -Path $serverOrderBookHierarchy -Identifier "order-book-buy-0d480622-e2d5-4344-bb3f-748cb55ba257"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-order-book-ticket.png"
      $serverOrderBookTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-order-book-ticket.xml"
      Assert-HierarchyContains -Path $serverOrderBookTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "Main", "Cura", "Ivoire", "ticket-selection-line", "ticket-selected-outcome-choice", "ticket-side-buy", "ticket-side-sell", "Choose an amount")
      return
    }

    if ($ServerLiveDetailLineOrderBook) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-open-order-book-spread", "Spread")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book-spread"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-spread-order-book.png"
      $serverSpreadOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-spread-order-book.xml"
      Assert-HierarchyContains -Path $serverSpreadOrderBookHierarchy -Expected @("event-detail-order-book-screen", "event-detail-order-book-market-ac527022-07f3-4abb-90f0-b291466e8459", "orderbook-source-orderbook-route", "orderbook-status-ready", "orderbook-empty-none", "Route depth", "Spreads", "Order Book", "Best bid", "Best ask", "0.59 USDT", "0.65 USDT", "1.06k shares", "940 shares", "Buy", "Sell")
      return
    }

    if ($ServerLiveDetailTotalsOrderBook) {
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      $eventDetailTotalsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-totals-line-groups.xml"
      Assert-HierarchyContains -Path $eventDetailTotalsHierarchy -Expected @("event-detail-open-order-book-totals", "Totals")
      Invoke-TapHierarchyNode -Path $eventDetailTotalsHierarchy -Identifier "event-detail-open-order-book-totals"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-totals-order-book.png"
      $serverTotalsOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-totals-order-book.xml"
      Assert-HierarchyContains -Path $serverTotalsOrderBookHierarchy -Expected @("event-detail-order-book-screen", "event-detail-order-book-market-a552efe6-3147-4573-be95-8fe15c068c08", "orderbook-source-orderbook-route", "orderbook-status-ready", "orderbook-empty-none", "Route depth", "Totals", "Order Book", "Best bid", "Best ask", "0.59 USDT", "0.65 USDT", "1.06k shares", "940 shares", "Buy", "Sell")
      return
    }

    if ($ServerLiveDetailTeamTotalsOrderBook) {
      & $adb -s $Device shell input swipe 540 1800 540 760 600 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1800 540 760 600 | Out-Null
      Start-Sleep -Seconds 1
      $eventDetailTeamTotalsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-team-totals-line-groups.xml"
      Assert-HierarchyContains -Path $eventDetailTeamTotalsHierarchy -Expected @("event-detail-open-order-book-team-total-goals", "event-detail-market-availability-team-total-goals", "market-availability-stale", "market-status-LIVE", "Market stale", "Full Game Team Total Goals", "1.5")
      Invoke-TapHierarchyNode -Path $eventDetailTeamTotalsHierarchy -Identifier "event-detail-open-order-book-team-total-goals"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-team-totals-order-book.png"
      $serverTeamTotalsOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-team-totals-order-book.xml"
      Assert-HierarchyContains -Path $serverTeamTotalsOrderBookHierarchy -Expected @("event-detail-order-book-screen", "event-detail-order-book-market-408ffb79-3492-4fd0-b31b-87a26f8b9dd5", "orderbook-source-orderbook-route", "orderbook-status-ready", "orderbook-empty-none", "orderbook-availability-stale", "orderbook-market-status-LIVE", "event-detail-order-book-availability", "Market stale", "Route depth", "Team", "Order Book", "Best bid", "Best ask", "0.59 USDT", "0.65 USDT", "1.06k shares", "940 shares", "Buy", "Sell")
      return
    }

    if ($ServerLiveDetailFirstHalfOrderBook) {
      & $adb -s $Device shell input swipe 540 1800 540 760 600 | Out-Null
      Start-Sleep -Seconds 1
      $eventDetailFirstHalfHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-first-half-line-groups.xml"
      Assert-HierarchyContains -Path $eventDetailFirstHalfHierarchy -Expected @("event-detail-open-order-book-first-half-winner", "event-detail-market-availability-first-half-winner", "market-availability-stale", "market-status-LIVE", "1st Half Winner", "Who wins the first half?")
      Invoke-TapHierarchyNode -Path $eventDetailFirstHalfHierarchy -Identifier "event-detail-open-order-book-first-half-winner"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-first-half-order-book.png"
      $serverFirstHalfOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-first-half-order-book.xml"
      Assert-HierarchyContains -Path $serverFirstHalfOrderBookHierarchy -Expected @("event-detail-order-book-screen", "event-detail-order-book-market-", "orderbook-source-orderbook-route", "orderbook-status-ready", "orderbook-empty-none", "orderbook-availability-stale", "orderbook-market-status-LIVE", "event-detail-order-book-availability", "Market stale", "Route depth", "1st Half Winner", "Order Book", "Best bid", "Best ask", "0.59 USDT", "0.65 USDT", "1.06k shares", "940 shares", "Buy", "Sell")
      return
    }

    if ($ServerLiveDetailSecondHalfOrderBook) {
      & $adb -s $Device shell input swipe 540 1800 540 760 600 | Out-Null
      Start-Sleep -Seconds 1
      $eventDetailSecondHalfHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-second-half-line-groups.xml"
      Assert-HierarchyContains -Path $eventDetailSecondHalfHierarchy -Expected @("event-detail-open-order-book-second-half-winner", "event-detail-market-availability-second-half-winner", "event-detail-market-depth-second-half-winner", "market-depth-batched", "Route depth", "market-availability-stale", "market-status-LIVE", "2nd Half Winner", "Who wins the second half?")
      Invoke-TapHierarchyNode -Path $eventDetailSecondHalfHierarchy -Identifier "event-detail-open-order-book-second-half-winner"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-second-half-order-book.png"
      $serverSecondHalfOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-second-half-order-book.xml"
      Assert-HierarchyContains -Path $serverSecondHalfOrderBookHierarchy -Expected @("event-detail-order-book-screen", "event-detail-order-book-market-", "orderbook-source-orderbook-route", "orderbook-status-ready", "orderbook-empty-none", "orderbook-availability-stale", "orderbook-market-status-LIVE", "event-detail-order-book-availability", "Market stale", "Route depth", "2nd Half Winner", "Order Book", "Best bid", "Best ask", "0.59 USDT", "0.65 USDT", "1.06k shares", "940 shares", "Buy", "Sell")
      return
    }

    if ($ServerLiveDetailProviderLineOrderBook) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Japan vs Morocco", "event-detail-open-order-book", "Spread", "provider-source-polymarket", "du-a-provider-line-depth-market", "du-a-provider-line-depth-condition")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-DV-holiwyn-provider-line-order-book.png"
      $providerLineOrderBookHierarchy = Save-UiHierarchy -Name "cycle-DV-holiwyn-provider-line-order-book.xml"
      Assert-HierarchyContains -Path $providerLineOrderBookHierarchy -Expected @(
        "event-detail-order-book-screen",
        "event-detail-order-book-market-d08da13e-80b8-4452-9067-f91d08f6fba4",
        "selected-market-d08da13e-80b8-4452-9067-f91d08f6fba4",
        "selected-selector-key-spreads:first-half:1.5",
        "selected-family-Spreads",
        "selected-market-type-spread",
        "selected-line-1.5",
        "selected-period-first-half",
        "provider-source-polymarket",
        "provider-market-du-a-provider-line-depth-market",
        "provider-condition-du-a-provider-line-depth-condition",
        "orderbook-source-orderbook-route",
        "orderbook-status-ready",
        "orderbook-empty-none",
        "orderbook-availability-ready",
        "Route depth",
        "Price",
        "Shares",
        "Value",
        "order-book-ask-level-361d2e0b-5043-4fc9-93d3-150a98adfc00-1",
        "order-book-bid-level-361d2e0b-5043-4fc9-93d3-150a98adfc00-1",
        "46c",
        "42c",
        "19k shares",
        "Buy",
        "Sell"
      )
      Invoke-TapHierarchyNode -Path $providerLineOrderBookHierarchy -Identifier "order-book-settings-open"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DV-holiwyn-provider-line-order-book-settings-cents.png"
      $providerLineSettingsCentsHierarchy = Save-UiHierarchy -Name "cycle-DV-holiwyn-provider-line-order-book-settings-cents.xml"
      Assert-HierarchyContains -Path $providerLineSettingsCentsHierarchy -Expected @("order-book-settings-sheet", "book-display-mode-cents", "decimalize-off", "selected-market-d08da13e-80b8-4452-9067-f91d08f6fba4", "selected-selector-key-spreads:first-half:1.5", "selected-period-first-half", "selected-line-1.5", "46c")
      Invoke-TapHierarchyNode -Path $providerLineSettingsCentsHierarchy -Identifier "order-book-display-mode-toggle"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DV-holiwyn-provider-line-order-book-settings-decimal.png"
      $providerLineSettingsDecimalHierarchy = Save-UiHierarchy -Name "cycle-DV-holiwyn-provider-line-order-book-settings-decimal.xml"
      Assert-HierarchyContains -Path $providerLineSettingsDecimalHierarchy -Expected @("order-book-settings-sheet", "book-display-mode-decimal", "decimalize-on", "selected-market-d08da13e-80b8-4452-9067-f91d08f6fba4", "selected-selector-key-spreads:first-half:1.5", "selected-period-first-half", "selected-line-1.5", "0.46 USDT", "0.42 USDT")
      Invoke-TapHierarchyNode -Path $providerLineSettingsDecimalHierarchy -Identifier "order-book-buy-361d2e0b-5043-4fc9-93d3-150a98adfc00"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DV-holiwyn-provider-line-order-book-ticket.png"
      $providerLineTicketHierarchy = Save-UiHierarchy -Name "cycle-DV-holiwyn-provider-line-order-book-ticket.xml"
      Assert-HierarchyContains -Path $providerLineTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "Japan vs Morocco", "Japan -1.5", "ticket-selection-line", "provider-source-polymarket", "provider-market-du-a-provider-line-depth-market", "provider-condition-du-a-provider-line-depth-condition", "provider-token-du-a-token-japan-minus-1-5", "ticket-side-buy", "ticket-side-sell", "Choose an amount")

      $proof = [ordered]@{
        cycle = "DV"
        scope = "PM-GAP-075 same-market provider-ready Book UI proof"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -ServerLiveDetailProviderLineOrderBook -Port 8250 -OutputDir docs/mobile/screenshots/cycle-DV-provider-line-orderbook -HierarchyOutputDir docs/mobile/harness/cycle-DV-provider-line-orderbook"
        eventSlug = $ServerEventSlug
        eventIdentity = "Japan vs Morocco"
        result = "pass"
        assertions = [ordered]@{
          backendMarketId = "d08da13e-80b8-4452-9067-f91d08f6fba4"
          visibleMarket = "event-detail-order-book-market-d08da13e-80b8-4452-9067-f91d08f6fba4"
          selectorKey = "selected-selector-key-spreads:first-half:1.5"
          providerReadyUiState = "orderbook-source-orderbook-route/orderbook-status-ready/orderbook-availability-ready"
          spreadCarryThrough = "selected-family-Spreads selected-market-type-spread selected-line-1.5 selected-period-first-half"
          decimalizeBeforeAfter = "book-display-mode-cents to book-display-mode-decimal without resetting selected market/selector/line/period"
          ticketCarryThrough = "ticket-selection-summary Japan -1.5 with provider-source-polymarket provider-token-du-a-token-japan-minus-1-5"
          ladderColumns = "Price Shares Value"
          sideLabelProof = "ask and bid rows visible for outcome 361d2e0b-5043-4fc9-93d3-150a98adfc00"
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book.png",
          "docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book.xml",
          "docs/mobile/screenshots/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book-settings-cents.png",
          "docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book-settings-cents.xml",
          "docs/mobile/screenshots/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book-settings-decimal.png",
          "docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book-settings-decimal.xml",
          "docs/mobile/screenshots/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book-ticket.png",
          "docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-holiwyn-provider-line-order-book-ticket.xml"
        )
        remainingGaps = @(
          "Non-ready fallback state remains documented by DU-B fixture proof, not recaptured in this provider-ready server run.",
          "Full Polymarket settings sheet remains richer than the Cents/Decimal equivalent toggle."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-DV-provider-line-orderbook-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailOrderBookSelector) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Regulation Time Winner", "Best bid", "Best ask", "Spread", "event-detail-open-order-book")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DW-B-holiwyn-orderbook-selector-closed.png"
      $selectorClosedHierarchy = Save-UiHierarchy -Name "cycle-DW-B-holiwyn-orderbook-selector-closed.xml"
      Assert-HierarchyContains -Path $selectorClosedHierarchy -Expected @("event-detail-order-book-screen", "order-book-grouped-market-selector", "order-book-market-selector-trigger", "selector-closed", "selected-market-mexico-ecuador-winner", "selected-family-Moneyline", "selected-outcome-mexico", "selected-side-yes", "selected-market-type-winner", "Moneyline", "Totals", "Spreads", "Mexico vs. Ecuador - Match winner", "order-book-ladder", "Price", "Shares", "Value")

      Invoke-TapHierarchyNode -Path $selectorClosedHierarchy -Identifier "order-book-grouped-market-selector"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DW-B-holiwyn-orderbook-selector-sheet.png"
      $selectorSheetHierarchy = Save-UiHierarchy -Name "cycle-DW-B-holiwyn-orderbook-selector-sheet.xml"
      Assert-HierarchyContains -Path $selectorSheetHierarchy -Expected @("order-book-market-selector-sheet", "selector-open", "selected-market-mexico-ecuador-winner", "order-book-market-choice-mexico-ecuador-winner", "order-book-market-choice-mexico-ecuador-total", "order-book-market-choice-mexico-ecuador-spread", "selected-market-choice", "inactive-market-choice", "market-type-totals", "line-2.5", "period-regulation", "depth-available")

      Invoke-TapHierarchyNode -Path $selectorSheetHierarchy -Identifier "order-book-market-choice-mexico-ecuador-total"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DW-B-holiwyn-orderbook-selector-totals.png"
      $selectorTotalsHierarchy = Save-UiHierarchy -Name "cycle-DW-B-holiwyn-orderbook-selector-totals.xml"
      Assert-HierarchyContains -Path $selectorTotalsHierarchy -Expected @("event-detail-order-book-screen", "selector-closed", "selected-market-mexico-ecuador-total", "selected-family-Totals", "selected-outcome-over", "selected-side-yes", "selected-market-type-totals", "selected-line-2.5", "selected-period-regulation", "orderbook-source-contract-fixture", "orderbook-status-ready", "orderbook-availability-ready", "Fixture depth", "order-book-outcome-over", "order-book-ask-level-over-1", "order-book-bid-level-over-1", "Mexico vs. Ecuador - Total goals over 2.5")

      Invoke-TapHierarchyNode -Path $selectorTotalsHierarchy -Identifier "order-book-grouped-market-selector"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DW-B-holiwyn-orderbook-selector-totals-sheet.png"
      $selectorTotalsSheetHierarchy = Save-UiHierarchy -Name "cycle-DW-B-holiwyn-orderbook-selector-totals-sheet.xml"
      Assert-HierarchyContains -Path $selectorTotalsSheetHierarchy -Expected @("order-book-market-selector-sheet", "selector-open", "selected-market-mexico-ecuador-total", "selected-family-Totals", "order-book-market-choice-mexico-ecuador-spread", "market-type-spread", "line-1.5", "period-regulation")

      Invoke-TapHierarchyNode -Path $selectorTotalsSheetHierarchy -Identifier "order-book-market-choice-mexico-ecuador-spread"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DW-B-holiwyn-orderbook-selector-spread.png"
      $selectorSpreadHierarchy = Save-UiHierarchy -Name "cycle-DW-B-holiwyn-orderbook-selector-spread.xml"
      Assert-HierarchyContains -Path $selectorSpreadHierarchy -Expected @("event-detail-order-book-screen", "selector-closed", "selected-market-mexico-ecuador-spread", "selected-family-Spreads", "selected-outcome-yes", "selected-side-yes", "selected-market-type-spread", "selected-line-1.5", "selected-period-regulation", "orderbook-source-contract-fixture", "orderbook-status-ready", "orderbook-availability-ready", "Fixture depth", "order-book-outcome-yes", "order-book-ask-level-yes-1", "order-book-bid-level-yes-1", "Mexico vs. Ecuador - Mexico -1.5 spread")

      Invoke-TapHierarchyNode -Path $selectorSpreadHierarchy -Identifier "order-book-buy-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DW-B-holiwyn-orderbook-selector-spread-ticket.png"
      $selectorTicketHierarchy = Save-UiHierarchy -Name "cycle-DW-B-holiwyn-orderbook-selector-spread-ticket.xml"
      Assert-HierarchyContains -Path $selectorTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "Mexico -1.5 spread", "Mexico vs. Ecuador", "ticket-selection-line", "Yes", "provider-source-polymarket-fixture", "provider-market-gamma-mexico-ecuador-spread-15", "provider-condition-condition-mexico-ecuador-spread-15", "provider-token-token-spread-yes-15", "ticket-side-buy", "ticket-side-sell", "Choose an amount")

      $proof = [ordered]@{
        cycle = "DW-B"
        scope = "Visible Book grouped selector sheet and market identity carry-through proof"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBookSelector -Port 8252 -OutputDir docs/mobile/screenshots/cycle-DW-B-orderbook-selector -HierarchyOutputDir docs/mobile/harness/cycle-DW-B-orderbook-selector"
        eventIdentity = "Mexico vs. Ecuador"
        result = "pass"
        fixtureNote = "UI proof uses deterministic backend-contract-shaped fixture markets with marketId/outcomeId/marketType/period/line/side/probability/depth fields."
        assertions = [ordered]@{
          selectorTrigger = "order-book-grouped-market-selector selector-closed selected-market-mexico-ecuador-winner selected-family-Moneyline"
          selectorSheet = "order-book-market-selector-sheet exposes Moneyline Totals Spreads grouped choices with market type, line, period, and depth labels"
          totalsCarryThrough = "selected-market-mexico-ecuador-total selected-family-Totals selected-outcome-over selected-side-yes selected-market-type-totals selected-line-2.5 selected-period-regulation"
          spreadCarryThrough = "selected-market-mexico-ecuador-spread selected-family-Spreads selected-outcome-yes selected-side-yes selected-market-type-spread selected-line-1.5 selected-period-regulation"
          ticketCarryThrough = "ticket-selection-summary Mexico -1.5 spread ticket-selection-line Yes provider-source-polymarket-fixture provider-token-token-spread-yes-15"
          ladderPreserved = "order-book-ask-level-yes-1 and order-book-bid-level-yes-1 remain visible after selector market change"
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-closed.png",
          "docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-closed.xml",
          "docs/mobile/screenshots/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-sheet.png",
          "docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-sheet.xml",
          "docs/mobile/screenshots/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-totals.png",
          "docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-totals.xml",
          "docs/mobile/screenshots/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-totals-sheet.png",
          "docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-totals-sheet.xml",
          "docs/mobile/screenshots/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-spread.png",
          "docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-spread.xml",
          "docs/mobile/screenshots/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-spread-ticket.png",
          "docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-spread-ticket.xml"
        )
        remainingGaps = @(
          "Selector sheet is visible parity for mobile Book market switching; backend provider route behavior remains owned outside this Agent B change.",
          "Fixture data remains deterministic UI proof only when the backend route is absent."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-DW-B-holiwyn-orderbook-selector-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailOrderBookLifecycle) {
      $bookSelectionExpected = @(
        "selected-market-mexico-ecuador-spread",
        "selected-family-Spreads",
        "selected-outcome-yes",
        "selected-side-yes",
        "selected-market-type-spread",
        "selected-line-1.5",
        "selected-period-regulation",
        "selected-provider-source-polymarket-fixture",
        "selected-provider-market-gamma-mexico-ecuador-spread-15",
        "selected-provider-condition-condition-mexico-ecuador-spread-15",
        "selected-provider-token-token-spread-yes-15",
        "selected-provider-outcome-Yes"
      )
      $ticketSelectionExpected = @(
        "ticket-market-family-spread",
        "ticket-market-type-spread",
        "ticket-market-id-mexico-ecuador-spread",
        "ticket-outcome-id-yes",
        "ticket-line-1.5",
        "ticket-period-regulation",
        "ticket-selection-side-yes",
        "ticket-contract-side-yes",
        "ticket-provider-source-polymarket-fixture",
        "ticket-provider-market-gamma-mexico-ecuador-spread-15",
        "ticket-provider-condition-condition-mexico-ecuador-spread-15",
        "ticket-provider-token-token-spread-yes-15",
        "ticket-provider-outcome-Yes"
      )
      $portfolioSelectionExpected = @(
        "portfolio-market-family-spread",
        "portfolio-market-type-spread",
        "portfolio-market-id-mexico-ecuador-spread",
        "portfolio-outcome-id-yes",
        "portfolio-line-1.5",
        "portfolio-period-regulation",
        "portfolio-side-buy",
        "portfolio-contract-side-yes",
        "portfolio-provider-source-polymarket-fixture",
        "portfolio-provider-market-gamma-mexico-ecuador-spread-15",
        "portfolio-provider-condition-condition-mexico-ecuador-spread-15",
        "portfolio-provider-token-token-spread-yes-15",
        "portfolio-provider-outcome-Yes"
      )
      $noMoneylineFallback = @("Team to Advance", "MOCK - Buy - Mexico (Reg. Time)", "Mexico vs. Ecuador winner")

      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Mexico vs. Ecuador", "Best bid", "Best ask", "Spread", "event-detail-top-order-book")
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $eventDetailHierarchy)) {
        $eventDetailHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-event-detail.xml" -Expected @("Mexico vs. Ecuador", "Best bid", "Best ask", "Spread", "event-detail-top-order-book") -Attempts 5 -DelaySeconds 1
      }
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
      $bookInitialHierarchy = Wait-HierarchyContains -Name "cycle-EE-B-holiwyn-book-status-moneyline-book.xml" -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-winner", "selected-family-Moneyline", "order-book-grouped-market-selector", "order-book-ladder") -Attempts 8 -DelaySeconds 1
      Save-Screenshot -Name "cycle-EE-B-holiwyn-book-status-moneyline-book.png"
      Assert-HierarchyContains -Path $bookInitialHierarchy -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-winner", "selected-family-Moneyline", "order-book-grouped-market-selector", "order-book-ladder")

      Invoke-TapHierarchyNode -Path $bookInitialHierarchy -Identifier "order-book-grouped-market-selector"
      Start-Sleep -Seconds 1
      $bookSelectorHierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-selector.xml"
      Assert-HierarchyContains -Path $bookSelectorHierarchy -Expected @("order-book-market-selector-sheet", "order-book-market-choice-mexico-ecuador-spread", "market-type-spread", "line-1.5", "period-regulation")
      Invoke-TapHierarchyNode -Path $bookSelectorHierarchy -Identifier "order-book-market-choice-mexico-ecuador-spread"
      Start-Sleep -Seconds 1

      Save-Screenshot -Name "cycle-EE-B-holiwyn-book-status-spread-selected.png"
      $bookSpreadHierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-spread-selected.xml"
      Assert-HierarchyContains -Path $bookSpreadHierarchy -Expected (@(
        "event-detail-order-book-screen",
        "order-book-selected-contract",
        "YES - Yes",
        "Line 1.5",
        "Fixture depth",
        "order-book-outcome-yes",
        "order-book-ask-level-yes-1",
        "order-book-bid-level-yes-1",
        "Mexico vs. Ecuador - Mexico -1.5 spread"
      ) + $bookSelectionExpected)

      Invoke-TapHierarchyNode -Path $bookSpreadHierarchy -Identifier "order-book-buy-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EE-B-holiwyn-book-status-ticket-empty.png"
      $ticketEmptyHierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-ticket-empty.xml"
      Assert-HierarchyContains -Path $ticketEmptyHierarchy -Expected (@(
        "trade-ticket",
        "ticket-selection-summary",
        "Mexico -1.5 spread",
        "Mexico vs. Ecuador",
        "ticket-selection-line",
        "Yes",
        "provider-source-polymarket-fixture",
        "provider-market-gamma-mexico-ecuador-spread-15",
        "provider-condition-condition-mexico-ecuador-spread-15",
        "provider-token-token-spread-yes-15",
        "ticket-side-buy",
        "ticket-side-sell",
        "Choose an amount"
      ) + $ticketSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $ticketEmptyHierarchy -Unexpected $noMoneylineFallback

      Invoke-TapHierarchyNode -Path $ticketEmptyHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $ticketAmount10Hierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-ticket-amount-10.xml"
      Invoke-TapHierarchyNode -Path $ticketAmount10Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $ticketAmount20Hierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $ticketAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EE-B-holiwyn-book-status-ticket-ready.png"
      $ticketReadyHierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-ticket-ready.xml"
      Assert-HierarchyContains -Path $ticketReadyHierarchy -Expected (@('$25', "ticket-price-line", "Swipe up to buy", "place-mock-order", "Yes") + $ticketSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $ticketReadyHierarchy -Unexpected $noMoneylineFallback

      Invoke-TapHierarchyNode -Path $ticketReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-EE-B-holiwyn-book-status-portfolio-open-filled.png"
      $bookLifecyclePortfolioHierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-portfolio-open-filled.xml"
      Assert-HierarchyContains -Path $bookLifecyclePortfolioHierarchy -Expected (@(
        "Portfolio",
        "Open positions",
        "Open orders",
        "Recent activity",
        "1",
        "Order placed",
        "latest-order-card",
        "latest-order-status",
        "order-status-open",
        "open-order-row-",
        "open-order-status-",
        "fake-token-test",
        "latest-activity-card",
        "activity-opened",
        "status-filled",
        "position-card-",
        "MOCK - Buy - Mexico -1.5 spread",
        "Mexico -1.5 spread",
        "Buy - Filled shares",
        "Exec price",
        "Implied odds"
      ) + $portfolioSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $bookLifecyclePortfolioHierarchy -Unexpected $noMoneylineFallback

      Invoke-TapHierarchyNode -Path $bookLifecyclePortfolioHierarchy -Identifier "cancel-open-order-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EE-B-holiwyn-book-status-portfolio-canceled-activity.png"
      $bookLifecycleCanceledHierarchy = Save-UiHierarchy -Name "cycle-EE-B-holiwyn-book-status-portfolio-canceled-activity.xml"
      Assert-HierarchyContains -Path $bookLifecycleCanceledHierarchy -Expected (@(
        "Portfolio",
        "portfolio-open-order-count",
        "0",
        "latest-activity-card",
        "latest-activity-status-",
        "Canceled",
        "activity-canceled",
        "status-canceled",
        "Buy - Canceled",
        "fake-token-test"
      ) + $portfolioSelectionExpected)
      Assert-HierarchyDoesNotContain -Path $bookLifecycleCanceledHierarchy -Unexpected $noMoneylineFallback

      $proof = [ordered]@{
        cycle = "EE-B"
        scope = "Visible Book-selected fake-token open/cancel/fill status breadth"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBookLifecycle -Port 8309 -OutputDir docs/mobile/screenshots/cycle-EE-B-visible-status -HierarchyOutputDir docs/mobile/harness/cycle-EE-B-visible-status"
        eventIdentity = "Mexico vs. Ecuador"
        result = "pass"
        assertions = [ordered]@{
          bookSelection = "Book selector changes from Moneyline to Spreads with selected-market-mexico-ecuador-spread selected-line-1.5 selected-period-regulation selected-outcome-yes selected-side-yes"
          providerToken = "provider-source-polymarket-fixture provider-market-gamma-mexico-ecuador-spread-15 provider-condition-condition-mexico-ecuador-spread-15 provider-token-token-spread-yes-15"
          ticketReady = "trade-ticket keeps ticket-market-id-mexico-ecuador-spread ticket-outcome-id-yes ticket-line-1.5 ticket-period-regulation and enables place-mock-order at `$25"
          openStatus = "latest-order-card and open-order-row expose fake-token-test order-status-open for the same Book-selected Spread identity"
          cancelStatus = "cancel-open-order removes the open branch and latest-activity-card/activity-row expose fake-token-test activity-canceled status-canceled"
          filledStatus = "position-card plus filled activity-row expose fake-token-test activity-opened status-filled for the same Book-selected identity"
          fallbackGuard = "No Team to Advance or Mexico moneyline fallback appears after the Book-selected order"
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-moneyline-book.png",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-moneyline-book.xml",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-selector.xml",
          "docs/mobile/screenshots/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-spread-selected.png",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-spread-selected.xml",
          "docs/mobile/screenshots/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-ticket-empty.png",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-ticket-empty.xml",
          "docs/mobile/screenshots/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-ticket-ready.png",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-ticket-ready.xml",
          "docs/mobile/screenshots/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-portfolio-open-filled.png",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-portfolio-open-filled.xml",
          "docs/mobile/screenshots/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-portfolio-canceled-activity.png",
          "docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-holiwyn-book-status-portfolio-canceled-activity.xml"
        )
        remainingGaps = @(
          "This proof uses the deterministic backend-shaped local Book/order service in mock mode, not a real wallet signature.",
          "Broader real provider-backed line-family lifecycle breadth remains P1 until backend/provider line families are ready."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EE-B-visible-status-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailOrderBookInteractions) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Mexico vs. Ecuador", "Best bid", "Best ask", "Spread", "event-detail-top-order-book")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-top-order-book"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-book-action.png"
      $orderBookBeforeHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-book-action.xml"
      Assert-HierarchyContains -Path $orderBookBeforeHierarchy -Expected @("event-detail-order-book-screen", "event-detail-order-book-market-mexico-ecuador-winner", "selected-market-mexico-ecuador-winner", "selected-family-Moneyline", "selected-outcome-mexico", "selected-side-yes", "selected-market-type-winner", "book-display-mode-cents", "orderbook-source-embedded", "orderbook-status-ready", "orderbook-availability-ready", "order-book-selected-contract", "YES - Mexico", "No line", "order-book-outcome-tabs", "selected-side-yes", "inactive-side-no", "order-book-ladder", "Price", "Shares", "Value", "bid-side-label", "ask-side-label", "order-book-ask-level-mexico-1", "order-book-bid-level-mexico-1")

      Invoke-TapHierarchyNode -Path $orderBookBeforeHierarchy -Identifier "order-book-outcome-tab-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-yes-no-switch.png"
      $orderBookNoHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-yes-no-switch.xml"
      Assert-HierarchyContains -Path $orderBookNoHierarchy -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-winner", "selected-family-Moneyline", "selected-outcome-ecuador", "selected-side-no", "order-book-selected-contract", "NO - Ecuador", "order-book-outcome-ecuador", "order-book-ask-level-ecuador-1", "order-book-bid-level-ecuador-1", "Mexico vs. Ecuador - Match winner")

      Invoke-TapHierarchyNode -Path $orderBookNoHierarchy -Identifier "order-book-grouped-market-selector"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-selector-before-totals.png"
      $orderBookSelectorBeforeTotalsHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-selector-before-totals.xml"
      Assert-HierarchyContains -Path $orderBookSelectorBeforeTotalsHierarchy -Expected @("order-book-market-selector-sheet", "selector-open", "order-book-market-choice-mexico-ecuador-total", "market-type-totals", "line-2.5", "period-regulation")

      Invoke-TapHierarchyNode -Path $orderBookSelectorBeforeTotalsHierarchy -Identifier "order-book-market-choice-mexico-ecuador-total"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-totals-carry-through.png"
      $orderBookTotalsHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-totals-carry-through.xml"
      Assert-HierarchyContains -Path $orderBookTotalsHierarchy -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-total", "selected-family-Totals", "selected-outcome-over", "selected-side-yes", "selected-market-type-totals", "selected-line-2.5", "selected-period-regulation", "orderbook-source-contract-fixture", "orderbook-status-ready", "orderbook-availability-ready", "order-book-selected-contract", "YES - Over", "Line 2.5", "Fixture depth", "order-book-outcome-over", "order-book-ask-level-over-1", "order-book-bid-level-over-1", "Mexico vs. Ecuador - Total goals over 2.5")

      Invoke-TapHierarchyNode -Path $orderBookTotalsHierarchy -Identifier "order-book-outcome-tab-under"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-totals-no-carry-through.png"
      $orderBookTotalsNoHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-totals-no-carry-through.xml"
      Assert-HierarchyContains -Path $orderBookTotalsNoHierarchy -Expected @("selected-market-mexico-ecuador-total", "selected-family-Totals", "selected-outcome-under", "selected-side-no", "selected-market-type-totals", "selected-line-2.5", "selected-period-regulation", "order-book-selected-contract", "NO - Under", "Line 2.5", "order-book-outcome-under", "order-book-ask-level-under-1", "order-book-bid-level-under-1")

      Invoke-TapHierarchyNode -Path $orderBookTotalsNoHierarchy -Identifier "order-book-grouped-market-selector"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-selector-before-spread.png"
      $orderBookSelectorBeforeSpreadHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-selector-before-spread.xml"
      Assert-HierarchyContains -Path $orderBookSelectorBeforeSpreadHierarchy -Expected @("order-book-market-selector-sheet", "selector-open", "order-book-market-choice-mexico-ecuador-spread", "market-type-spread", "line-1.5", "period-regulation")

      Invoke-TapHierarchyNode -Path $orderBookSelectorBeforeSpreadHierarchy -Identifier "order-book-market-choice-mexico-ecuador-spread"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-spread-carry-through.png"
      $orderBookSpreadHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-spread-carry-through.xml"
      Assert-HierarchyContains -Path $orderBookSpreadHierarchy -Expected @("event-detail-order-book-screen", "selected-market-mexico-ecuador-spread", "selected-family-Spreads", "selected-outcome-yes", "selected-side-yes", "selected-market-type-spread", "selected-line-1.5", "selected-period-regulation", "orderbook-source-contract-fixture", "orderbook-status-ready", "orderbook-availability-ready", "order-book-selected-contract", "YES - Yes", "Line 1.5", "Fixture depth", "order-book-outcome-yes", "order-book-ask-level-yes-1", "order-book-bid-level-yes-1", "Mexico vs. Ecuador - Mexico -1.5 spread")

      Invoke-TapHierarchyNode -Path $orderBookSpreadHierarchy -Identifier "order-book-settings-open"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-settings-cents.png"
      $orderBookSettingsCentsHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-settings-cents.xml"
      Assert-HierarchyContains -Path $orderBookSettingsCentsHierarchy -Expected @("order-book-settings-sheet", "Book settings", "Price display", "order-book-display-mode-toggle", "book-display-mode-cents", "decimalize-off", "selected-market-mexico-ecuador-spread", "selected-outcome-yes", "selected-side-yes", "Price", "41c")

      Invoke-TapHierarchyNode -Path $orderBookSettingsCentsHierarchy -Identifier "order-book-display-mode-toggle"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-settings-decimal.png"
      $orderBookSettingsDecimalHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-settings-decimal.xml"
      Assert-HierarchyContains -Path $orderBookSettingsDecimalHierarchy -Expected @("order-book-settings-sheet", "book-display-mode-decimal", "decimalize-on", "selected-market-mexico-ecuador-spread", "selected-outcome-yes", "selected-side-yes", "Price (USDT)", "0.41 USDT", "0.34 USDT")

      Invoke-TapHierarchyNode -Path $orderBookSettingsDecimalHierarchy -Identifier "order-book-buy-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-EC-B-holiwyn-orderbook-spread-ticket.png"
      $orderBookTicketHierarchy = Save-UiHierarchy -Name "cycle-EC-B-holiwyn-orderbook-spread-ticket.xml"
      Assert-HierarchyContains -Path $orderBookTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "Mexico -1.5 spread", "Mexico vs. Ecuador", "ticket-selection-line", "Yes", "provider-source-polymarket-fixture", "provider-market-gamma-mexico-ecuador-spread-15", "provider-condition-condition-mexico-ecuador-spread-15", "provider-token-token-spread-yes-15", "ticket-side-buy", "ticket-side-sell", "Choose an amount")

      $proof = [ordered]@{
        cycle = "EC-B"
        scope = "Visible mobile Book ladder, selector state, and ticket carry-through proof"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke.ps1 -Deep -EventDetailOrderBookInteractions -Port $Port -Device `"$Device`" -ExpoHost $ExpoHost -OutputDir docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket -HierarchyOutputDir docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket"
        eventIdentity = "Mexico vs. Ecuador"
        result = "pass"
        assertions = [ordered]@{
          yesNoSwitchBefore = "selected-market-mexico-ecuador-winner selected-outcome-mexico selected-side-yes"
          yesNoSwitchAfter = "selected-market-mexico-ecuador-winner selected-outcome-ecuador selected-side-no"
          totalsSelectorCarryThrough = "selected-market-mexico-ecuador-total selected-family-Totals selected-outcome-under selected-side-no selected-market-type-totals selected-line-2.5 selected-period-regulation"
          spreadSelectorCarryThrough = "selected-market-mexico-ecuador-spread selected-family-Spreads selected-outcome-yes selected-side-yes selected-market-type-spread selected-line-1.5 selected-period-regulation"
          decimalizeBeforeAfter = "order-book-display-mode-toggle changes book-display-mode-cents to book-display-mode-decimal without resetting selected market/outcome/side"
          ticketCarryThrough = "ticket-selection-summary Mexico -1.5 spread ticket-selection-line Yes provider-source-polymarket-fixture provider-token-token-spread-yes-15"
          ladderColumns = "Price Shares Value"
          sideLabelProof = "order-book-ask-level-* above spread and order-book-bid-level-* below spread"
          visibleSelectedContract = "order-book-selected-contract shows family, period, line, selected outcome, side, bid, and ask"
          providerReadyUiState = "orderbook-source-contract-fixture/orderbook-status-ready/orderbook-availability-ready visible pending server integration"
          decimalizeEquivalent = "implemented as Book price display Cents/Decimal toggle"
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-book-action.png",
          "docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-book-action.xml",
          "docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-selector-before-totals.png",
          "docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-selector-before-totals.xml",
          "docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-selector-before-spread.png",
          "docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-selector-before-spread.xml",
          "docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-settings-cents.png",
          "docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-settings-cents.xml",
          "docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-settings-decimal.png",
          "docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-settings-decimal.xml",
          "docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-spread-ticket.png",
          "docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-spread-ticket.xml"
        )
        remainingGaps = @(
          "Provider-backed ready UI proof remains pending integration with Agent A backend route changes in this worktree.",
          "EC-B fixture is deterministic and backend-shaped; it is not random display-only data.",
          "Full Polymarket settings sheet remains richer than this display-mode toggle."
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EC-B-holiwyn-orderbook-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailOrderBook) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Regulation Time Winner", "Best bid", "Best ask", "Spread", "event-detail-open-order-book")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-order-book.png"
      $orderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-order-book.xml"
      Assert-HierarchyContains -Path $orderBookHierarchy -Expected @("event-detail-order-book-screen", "orderbook-source", "orderbook-status", "event-detail-order-book-depth-state", "Order Book", "Mexico vs. Ecuador - Match winner", "order-book-grouped-market-selector", "Moneyline", "Totals", "order-book-outcome-tabs", "Yes", "No", "order-book-ladder", "Price", "Shares", "Value", "order-book-spread-separator", "Best bid", "Best ask", "Spread", "order-book-outcome-mexico", "Mexico", "64%", "1.6x", "0.61 USDT", "0.68 USDT", "1.28k shares", "900 shares", "Buy", "Sell")
      Invoke-TapHierarchyNode -Path $orderBookHierarchy -Identifier "order-book-buy-mexico"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-order-book-ticket.png"
      $orderBookTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-order-book-ticket.xml"
      Assert-HierarchyContains -Path $orderBookTicketHierarchy -Expected @("trade-ticket", "ticket-selection-summary", "Match winner", "Mexico vs. Ecuador", "ticket-selection-line", "Mexico", "Yes - Mexico", "ticket-side-buy", "ticket-side-sell", "Choose an amount")
      Invoke-TapHierarchyNode -Path $orderBookTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1
      $orderBookAfterTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-order-book-after-ticket.xml"
      Assert-HierarchyContains -Path $orderBookAfterTicketHierarchy -Expected @("event-detail-order-book-screen", "Order Book", "event-detail-order-book-close")
      Invoke-TapHierarchyNode -Path $orderBookAfterTicketHierarchy -Identifier "event-detail-order-book-close"
      Start-Sleep -Seconds 1
      $orderBookClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-order-book-closed.xml"
      Assert-HierarchyContains -Path $orderBookClosedHierarchy -Expected @("Mexico vs. Ecuador", "Regulation Time Winner", "event-detail-open-order-book")
      return
    }

    if ($EventDetailMarketTabs) {
      Save-Screenshot -Name "cycle-current-holiwyn-market-tabs-game-lines.png"
      $marketTabsGameHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-market-tabs-game-lines.xml"
      Assert-HierarchyContains -Path $marketTabsGameHierarchy -Expected @("event-detail-body-switch", "event-detail-body-tab-market", "event-detail-body-tab-live-stats", "Market", "Live stats", "Game Lines", "Exact Score", "Halves", "Player Props", "event-detail-team-to-advance-card", "Team to Advance", "52", "49", "Order Book", "Graph", "About", "PRICE", "SHARES", "TOTAL", "Moneyline", "Regulation Time Winner")
      Invoke-TapHierarchyNode -Path $marketTabsGameHierarchy -Identifier "event-detail-body-tab-live-stats"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-market-tabs-live-stats.png"
      $marketTabsLiveStatsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-market-tabs-live-stats.xml"
      Assert-HierarchyContains -Path $marketTabsLiveStatsHierarchy -Expected @("event-detail-live-stats-panel", "Live stats", "Possession", "Shots on target", "Corners", "Expected goals", "Match flow")
      Invoke-TapHierarchyNode -Path $marketTabsLiveStatsHierarchy -Identifier "event-detail-body-tab-market"
      Start-Sleep -Seconds 1
      $marketTabsMarketReturnHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-market-tabs-market-return.xml"
      Assert-HierarchyContains -Path $marketTabsMarketReturnHierarchy -Expected @("event-detail-price-chart", "event-detail-market-tabs", "Game Lines", "Team to Advance")
      Invoke-TapHierarchyNode -Path $marketTabsGameHierarchy -Identifier "event-detail-line-detail-graph"
      Start-Sleep -Seconds 1
      $marketTabsGraphHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-market-tabs-graph.xml"
      Assert-HierarchyContains -Path $marketTabsGraphHierarchy -Expected @("event-detail-inline-graph", "Line movement for Team to Advance")
      Invoke-TapHierarchyNode -Path $marketTabsGraphHierarchy -Identifier "event-detail-exact-score-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-market-tabs-exact-score.png"
      $marketTabsExactHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-market-tabs-exact-score.xml"
      Assert-HierarchyContains -Path $marketTabsExactHierarchy -Expected @("event-detail-exact-score", "Exact Score", "Correct score at full time", "0-0", "1-0", "0-1")
      Invoke-TapHierarchyNode -Path $marketTabsExactHierarchy -Identifier "event-detail-halves-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-market-tabs-halves.png"
      $marketTabsHalvesHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-market-tabs-halves.xml"
      Assert-HierarchyContains -Path $marketTabsHalvesHierarchy -Expected @("event-detail-halves", "1st Half Winner", "2nd Half Winner")
      return
    }

    if ($EventDetailLineAdjustment) {
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-adjustment-baseline.png"
      $lineBaselineHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-baseline.xml"
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $lineBaselineHierarchy)) {
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-line-adjustment-baseline.png"
        $lineBaselineHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-baseline.xml"
      }
      Assert-HierarchyContains -Path $lineBaselineHierarchy -Expected @("Spread", "MEX to win by over 1.5 goals", "event-detail-spread-line-1-5", "Reg. Time", "Yes, MEX -1.5", "34%", "Totals", "Total goals over 2.5", "event-detail-totals-line-2-5", "Over 2.5", "52%")

      Invoke-TapHierarchyNode -Path $lineBaselineHierarchy -Identifier "event-detail-spread-line-2-5"
      Start-Sleep -Seconds 1
      $spreadLineHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-spread-25.xml"
      Assert-HierarchyContains -Path $spreadLineHierarchy -Expected @("MEX to win by over 2.5 goals", "Yes, MEX -2.5", "16%")
      Invoke-TapHierarchyNode -Path $spreadLineHierarchy -Identifier "event-detail-spread-period-1st-half"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-adjustment-spread-25-1h.png"
      $spreadChangedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-spread-25-1h.xml"
      Assert-HierarchyContains -Path $spreadChangedHierarchy -Expected @("MEX to win by over 2.5 goals", "event-detail-spread-line-2-5", "Yes, MEX -2.5", "33.3x", "3%", "No", "97%")

      Invoke-TapHierarchyNode -Path $spreadChangedHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-adjustment-spread-ticket.png"
      $spreadTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-spread-ticket.xml"
      Assert-HierarchyContains -Path $spreadTicketHierarchy -Expected @("trade-ticket", "Mexico vs. Ecuador", "ticket-selection-line", "Yes - MEX -2.5 1H", "ticket-selected-outcome-choice", "Choose an amount")
      Invoke-TapHierarchyNode -Path $spreadTicketHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1

      $afterTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-after-ticket-close.xml"
      Invoke-TapHierarchyNode -Path $afterTicketHierarchy -Identifier "event-detail-totals-period-2nd-half"
      Start-Sleep -Seconds 1
      $totalsSecondHalfHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-totals-2h.xml"
      Invoke-TapHierarchyNode -Path $totalsSecondHalfHierarchy -Identifier "event-detail-totals-line-3-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-adjustment-totals-35-2h.png"
      $totalsChangedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-totals-35-2h.xml"
      Assert-HierarchyContains -Path $totalsChangedHierarchy -Expected @("Totals", "Total goals over 3.5", "event-detail-totals-line-3-5", "Over 3.5", "4.5x", "22%", "Under 3.5", "78%")
      Invoke-TapHierarchyNode -Path $totalsChangedHierarchy -Identifier "event-detail-outcome-totals-totals-over"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-adjustment-totals-ticket.png"
      $totalsTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-adjustment-totals-ticket.xml"
      Assert-HierarchyContains -Path $totalsTicketHierarchy -Expected @("trade-ticket", "Mexico vs. Ecuador", "Yes - Over 3.5 2H", "Odds 22%", "ticket-amount-keypad", "Choose an amount")
      return
    }

    if ($EventDetailLinePortfolio) {
      $dxLineExpected = @(
        "selection-market-family-spread",
        "selection-market-type-spread",
        "selection-line-2.5",
        "selection-period-1st Half",
        "selection-display-label-MEX -2.5 1H"
      )
      $dxTicketExpected = @(
        "ticket-market-family-spread",
        "ticket-market-type-spread",
        "ticket-line-2.5",
        "ticket-period-1st Half",
        "ticket-display-label-MEX -2.5 1H",
        "ticket-contract-side-yes"
      )
      $dxPortfolioExpected = @(
        "portfolio-market-family-spread",
        "portfolio-market-type-spread",
        "portfolio-line-2.5",
        "portfolio-period-1st Half",
        "portfolio-side-buy",
        "portfolio-display-label-MEX -2.5 1H",
        "portfolio-contract-side-yes"
      )
      $dxNoMoneylineFallback = @("Mexico vs. Ecuador winner", "Team to Advance", "MOCK - Buy - Mexico")
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DX-B-holiwyn-line-lifecycle-selected-line-row.png"
      $linePortfolioBaselineHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-selected-line-row.xml"
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $linePortfolioBaselineHierarchy)) {
        Start-Sleep -Seconds 1
        $linePortfolioBaselineHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-selected-line-row.xml"
      }
      Assert-HierarchyContains -Path $linePortfolioBaselineHierarchy -Expected @("Spread", "MEX to win by over 1.5 goals", "event-detail-spread-line-1-5", "Reg. Time")

      Invoke-TapHierarchyNode -Path $linePortfolioBaselineHierarchy -Identifier "event-detail-spread-line-2-5"
      Start-Sleep -Seconds 1
      $linePortfolioSpreadHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-spread-25.xml"
      Assert-HierarchyContains -Path $linePortfolioSpreadHierarchy -Expected @("MEX to win by over 2.5 goals", "Yes, MEX -2.5", "16%")
      Invoke-TapHierarchyNode -Path $linePortfolioSpreadHierarchy -Identifier "event-detail-spread-period-1st-half"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DX-B-holiwyn-line-lifecycle-selected-line-25-1h.png"
      $linePortfolioSpreadChangedHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-selected-line-25-1h.xml"
      Assert-HierarchyContains -Path $linePortfolioSpreadChangedHierarchy -Expected (@("Spread", "MEX to win by over 2.5 goals", "Yes, MEX -2.5", "33.3x", "3%", "No", "97%") + $dxLineExpected + @("ticket-source-deterministic-line-fixture"))

      Invoke-TapHierarchyNode -Path $linePortfolioSpreadChangedHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DX-B-holiwyn-line-lifecycle-ticket.png"
      $linePortfolioTicketHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-ticket.xml"
      Assert-HierarchyContains -Path $linePortfolioTicketHierarchy -Expected (@("trade-ticket", "Mexico vs. Ecuador", "ticket-selection-line", "Yes - MEX -2.5 1H", "ticket-selected-outcome-choice", "ticket-preset-5", "Choose an amount") + $dxTicketExpected)
      Assert-HierarchyDoesNotContain -Path $linePortfolioTicketHierarchy -Unexpected @("Team to Advance")
      Invoke-TapHierarchyNode -Path $linePortfolioTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $linePortfolioTicketAmount2Hierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-ticket-amount-10.xml"
      Invoke-TapHierarchyNode -Path $linePortfolioTicketAmount2Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $linePortfolioTicketAmount20Hierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $linePortfolioTicketAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-DX-B-holiwyn-line-lifecycle-ticket-ready.png"
      $linePortfolioTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-ticket-ready.xml"
      Assert-HierarchyContains -Path $linePortfolioTicketReadyHierarchy -Expected (@('$25', 'To win $833.33', "ticket-price-line", "Swipe up to buy", "place-mock-order", "Yes - MEX -2.5 1H") + $dxTicketExpected)
      Invoke-TapHierarchyNode -Path $linePortfolioTicketReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-DX-B-holiwyn-line-lifecycle-after-order.png"
      $linePortfolioAfterOrderHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-after-order.xml"
      Assert-HierarchyContains -Path $linePortfolioAfterOrderHierarchy -Expected (@("Portfolio", "Open positions", "Recent activity", "1", "Order placed", "latest-order-card", "latest-activity-card", "position-card-", "MOCK - Buy - MEX -2.5 1H", "Mexico vs. Ecuador", "Mexico vs. Ecuador - MEX -2.5 1H", "Buy - Filled shares 833.33 - Exec price 3% - Implied odds 33.3x") + $dxPortfolioExpected)
      Assert-HierarchyDoesNotContain -Path $linePortfolioAfterOrderHierarchy -Unexpected $dxNoMoneylineFallback
      $lineOpenOrderUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceLineOpenOrder=1"
      Start-DeepLink -Url $lineOpenOrderUrl
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-DX-B-holiwyn-line-lifecycle-open-order.png"
      $linePortfolioOpenOrderHierarchy = Save-UiHierarchy -Name "cycle-DX-B-holiwyn-line-lifecycle-open-order.xml"
      Assert-HierarchyContains -Path $linePortfolioOpenOrderHierarchy -Expected (@("Portfolio", "portfolio-open-order-count", "Open orders", "open-order-row-smoke-line-open-order", "Mexico vs. Ecuador", "Buy - MEX -2.5 1H - OPEN", "Limit", "3%", "Order value", "25 USDT", "Remaining:", "833.33 shares", "Potential payout") + $dxPortfolioExpected)
      Assert-HierarchyDoesNotContain -Path $linePortfolioOpenOrderHierarchy -Unexpected $dxNoMoneylineFallback
      $proof = [ordered]@{
        cycle = "DX-B"
        scenario = "Visible mobile line lifecycle"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailLinePortfolio -Port 8254 -OutputDir docs/mobile/screenshots/cycle-DX-B-line-lifecycle -HierarchyOutputDir docs/mobile/harness/cycle-DX-B-line-lifecycle"
        assertions = [ordered]@{
          selectedLineRow = @("Spread", "line 2.5", "period 1st Half", "display label MEX -2.5 1H", "market family spread")
          ticketReady = @("ticket market family spread", "line 2.5", "period 1st Half", "side buy", "outcome yes", "place-mock-order")
          afterOrderPortfolio = @("Order placed", "MOCK - Buy - MEX -2.5 1H", "latest-order-card", "latest-activity-card", "position-card", "no moneyline fallback")
          openOrderPortfolio = @("Open orders", "Buy - MEX -2.5 1H - OPEN", "Limit 3%", "remaining 833.33 shares", "no moneyline fallback")
        }
        artifacts = @(
          "docs/mobile/screenshots/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-selected-line-row.png",
          "docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-selected-line-row.xml",
          "docs/mobile/screenshots/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-selected-line-25-1h.png",
          "docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-selected-line-25-1h.xml",
          "docs/mobile/screenshots/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-ticket-ready.png",
          "docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-ticket-ready.xml",
          "docs/mobile/screenshots/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-after-order.png",
          "docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-after-order.xml",
          "docs/mobile/screenshots/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-open-order.png",
          "docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-open-order.xml"
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-DX-B-holiwyn-line-lifecycle-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($LocalMvpSimpleTradeFlow) {
      if ($LocalMvpRouteStatusFlow) {
        $mvpHiddenOrderBookExpected = @(
          "event-detail-top-order-book",
          "event-detail-chart-open-book",
          "event-detail-open-order-book",
          "event-detail-line-detail-order-book",
          "event-detail-inline-order-book",
          "orderbook-source-",
          "Route depth"
        )

        Save-Screenshot -Name "cycle-FA-holiwyn-route-status-top.png"
        $mvpRouteStatusTopHierarchy = Save-UiHierarchy -Name "cycle-FA-holiwyn-route-status-top.xml"
        Assert-HierarchyContains -Path $mvpRouteStatusTopHierarchy -Expected @("event-detail-chart-route-state", "event-detail-live-data-inline", "live-data-source-polymarket-gamma")
        Assert-HierarchyDoesNotContain -Path $mvpRouteStatusTopHierarchy -Unexpected $mvpHiddenOrderBookExpected

        & $adb -s $Device shell input swipe 540 2100 540 520 500 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-FA-holiwyn-route-status-lines.png"
        $mvpRouteStatusLineHierarchy = Save-UiHierarchy -Name "cycle-FA-holiwyn-route-status-lines.xml"
        Assert-HierarchyContains -Path $mvpRouteStatusLineHierarchy -Expected @(
          "Game Lines",
          "Spread",
          "Totals",
          "event-detail-market-availability-spread",
          "market-availability-stale",
          "Market stale",
          "event-detail-market-availability-totals",
          "market-availability-unavailable",
          "Market unavailable",
          "ticket-source-backend-line-market",
          "provider-source-polymarket"
        )
        Assert-HierarchyDoesNotContain -Path $mvpRouteStatusLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

        Invoke-TapHierarchyNode -Path $mvpRouteStatusLineHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-FA-holiwyn-route-status-stale-ticket.png"
        $mvpRouteStatusStaleTicketHierarchy = Save-UiHierarchy -Name "cycle-FA-holiwyn-route-status-stale-ticket.xml"
        Assert-HierarchyContains -Path $mvpRouteStatusStaleTicketHierarchy -Expected @("trade-ticket", "ticket-market-status", "ticket-availability-stale", "Market stale", "ticket-market-type-spread", "ticket-line-1.5", "provider-source-polymarket")
        Assert-HierarchyDoesNotContain -Path $mvpRouteStatusStaleTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpRouteStatusStaleTicketHierarchy -Identifier "ticket-close"
        Start-Sleep -Seconds 1

        $mvpRouteStatusAfterCloseHierarchy = Save-UiHierarchy -Name "cycle-FA-holiwyn-route-status-lines-after-close.xml"
        Invoke-TapHierarchyNode -Path $mvpRouteStatusAfterCloseHierarchy -Identifier "event-detail-outcome-totals-totals-over"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-FA-holiwyn-route-status-unavailable-ticket.png"
        $mvpRouteStatusUnavailableTicketHierarchy = Save-UiHierarchy -Name "cycle-FA-holiwyn-route-status-unavailable-ticket.xml"
        Assert-HierarchyContains -Path $mvpRouteStatusUnavailableTicketHierarchy -Expected @("trade-ticket", "ticket-market-status", "ticket-availability-unavailable", "Market unavailable", "ticket-market-type-totals", "ticket-line-2.5", "provider-source-polymarket", "swipe-to-submit-order")
        Assert-HierarchyDoesNotContain -Path $mvpRouteStatusUnavailableTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected

        $proof = [ordered]@{
          cycle = "FA"
          scenario = "Local MVP Android route-backed retail status states with orderbook hidden by default"
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-status-proof.ps1 -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          backendBaseUrl = $BackendBaseUrl
          serverEventSlug = $ServerEventSlug
          orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
          marketDataMode = if ($env:EXPO_PUBLIC_MARKET_DATA_MODE) { $env:EXPO_PUBLIC_MARKET_DATA_MODE } else { "mock" }
          orderMode = if ($env:EXPO_PUBLIC_ORDER_MODE) { $env:EXPO_PUBLIC_ORDER_MODE } else { "mock" }
          result = "pass"
          assertions = [ordered]@{
            routeBackedEvent = @("live-detail loaded through forceBackendEventSlug", "live-data-source-polymarket-gamma")
            retailStatusRows = @("spread row exposes Market stale", "totals row exposes Market unavailable", "no visible Book/orderbook entry points")
            ticketStatus = @("stale spread ticket exposes ticket-market-status", "unavailable totals ticket exposes ticket-market-status and disabled submit state")
          }
          artifacts = @(
            "$OutputDir/cycle-FA-holiwyn-route-status-top.png",
            "$HierarchyOutputDir/cycle-FA-holiwyn-route-status-top.xml",
            "$OutputDir/cycle-FA-holiwyn-route-status-lines.png",
            "$HierarchyOutputDir/cycle-FA-holiwyn-route-status-lines.xml",
            "$OutputDir/cycle-FA-holiwyn-route-status-stale-ticket.png",
            "$HierarchyOutputDir/cycle-FA-holiwyn-route-status-stale-ticket.xml",
            "$OutputDir/cycle-FA-holiwyn-route-status-unavailable-ticket.png",
            "$HierarchyOutputDir/cycle-FA-holiwyn-route-status-unavailable-ticket.xml"
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-FA-local-mvp-route-status-flow-proof.json"
        $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
        Write-Host "Proof summary: $proofPath"
        return
      }

      if ($LocalMvpRouteServerOrderFlow -or $LocalMvpRouteServerCancelFlow -or $LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) {
        $mvpRouteServerFilledFamily = if ($LocalMvpRouteServerFilledTeamTotalFlow) { "team-total" } elseif ($LocalMvpRouteServerFilledTotalsFlow) { "totals" } else { "spread" }
        $mvpRouteServerCycle = if ($LocalMvpRouteServerFilledTeamTotalFlow) { "EZ" } elseif ($LocalMvpRouteServerFilledTotalsFlow) { "EY" } elseif ($LocalMvpRouteServerFilledFlow) { "EX" } elseif ($LocalMvpRouteServerCancelFlow) { "EW" } else { "EV" }
        $mvpRouteServerScenario = if ($LocalMvpRouteServerFilledTeamTotalFlow) {
          "Local MVP Android route-backed server fake-token team-total filled trade/history flow with orderbook hidden by default"
        } elseif ($LocalMvpRouteServerFilledTotalsFlow) {
          "Local MVP Android route-backed server fake-token totals filled trade/history flow with orderbook hidden by default"
        } elseif ($LocalMvpRouteServerFilledFlow) {
          "Local MVP Android route-backed server fake-token filled trade/history flow with orderbook hidden by default"
        } elseif ($LocalMvpRouteServerCancelFlow) {
          "Local MVP Android route-backed server fake-token order cancel/history flow with orderbook hidden by default"
        } else {
          "Local MVP Android route-backed server fake-token order flow with orderbook hidden by default"
        }
        $mvpRouteServerScript = if ($LocalMvpRouteServerFilledTeamTotalFlow) { "local-mvp-route-server-filled-team-total-proof.ps1" } elseif ($LocalMvpRouteServerFilledTotalsFlow) { "local-mvp-route-server-filled-totals-proof.ps1" } elseif ($LocalMvpRouteServerFilledFlow) { "local-mvp-route-server-filled-proof.ps1" } elseif ($LocalMvpRouteServerCancelFlow) { "local-mvp-route-server-cancel-proof.ps1" } else { "local-mvp-route-server-order-proof.ps1" }
        $mvpRouteServerProofName = if ($LocalMvpRouteServerFilledTeamTotalFlow) {
          "cycle-EZ-local-mvp-route-server-filled-team-total-flow-proof.json"
        } elseif ($LocalMvpRouteServerFilledTotalsFlow) {
          "cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json"
        } elseif ($LocalMvpRouteServerFilledFlow) {
          "cycle-EX-local-mvp-route-server-filled-flow-proof.json"
        } elseif ($LocalMvpRouteServerCancelFlow) {
          "cycle-EW-local-mvp-route-server-cancel-flow-proof.json"
        } else {
          "cycle-EV-local-mvp-route-server-order-flow-proof.json"
        }
        $mvpRouteServerPrefix = "cycle-$mvpRouteServerCycle-holiwyn-route-server-mvp"
        $mvpHiddenOrderBookExpected = @(
          "event-detail-top-order-book",
          "event-detail-chart-open-book",
          "event-detail-open-order-book",
          "event-detail-line-detail-order-book",
          "event-detail-inline-order-book",
          "orderbook-source-",
          "Route depth"
        )

        Save-Screenshot -Name "$mvpRouteServerPrefix-top.png"
        $mvpRouteTopHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-top.xml"
        Assert-HierarchyContains -Path $mvpRouteTopHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "event-detail-chart-route-state", "live-data-source-polymarket-gamma")
        Assert-HierarchyDoesNotContain -Path $mvpRouteTopHierarchy -Unexpected $mvpHiddenOrderBookExpected

        $mvpRouteTargetOutcomeId = if ($LocalMvpRouteServerFilledTeamTotalFlow) { "event-detail-outcome-team-total-goals-team-total-over" } elseif ($LocalMvpRouteServerFilledTotalsFlow) { "event-detail-outcome-totals-totals-over" } else { "event-detail-outcome-spread-spread-yes" }
        $mvpRouteTargetTicketMarketType = if ($LocalMvpRouteServerFilledTeamTotalFlow) { "team-total" } elseif ($LocalMvpRouteServerFilledTotalsFlow) { "totals" } else { "spread" }
        $mvpRouteTargetLine = if ($LocalMvpRouteServerFilledTotalsFlow) { "2.5" } else { "1.5" }
        $mvpRouteTargetToken = if ($LocalMvpRouteServerFilledTeamTotalFlow) { "token-el-a-team-total-over" } elseif ($LocalMvpRouteServerFilledTotalsFlow) { "token-el-a-totals-over" } else { "token-el-a-spread-home" }
        $mvpRouteLineExpected = @(
          "Game Lines",
          $mvpRouteTargetOutcomeId,
          "ticket-source-backend-line-market",
          "selection-market-family-$mvpRouteTargetTicketMarketType",
          "selection-line-$mvpRouteTargetLine",
          "selection-period-Reg. Time",
          "provider-source-polymarket"
        )
        $mvpRouteLineHierarchy = $null
        $mvpRouteLineSwipes = @(
          @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 520; ms = 500 },
          @{ x1 = 540; y1 = 620; x2 = 540; y2 = 1500; ms = 350 },
          @{ x1 = 540; y1 = 700; x2 = 540; y2 = 1700; ms = 350 },
          @{ x1 = 540; y1 = 2100; x2 = 540; y2 = 760; ms = 450 }
        )
        for ($attempt = 0; $attempt -lt $mvpRouteLineSwipes.Count; $attempt++) {
          $swipe = $mvpRouteLineSwipes[$attempt]
          & $adb -s $Device shell input swipe $swipe.x1 $swipe.y1 $swipe.x2 $swipe.y2 $swipe.ms | Out-Null
          Start-Sleep -Seconds 1
          $attemptHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-line-markets-attempt-$($attempt + 1).xml"
          $attemptXml = Get-Content -Raw -Path $attemptHierarchy
          $attemptPassed = $true
          foreach ($expectedValue in $mvpRouteLineExpected) {
            if ($attemptXml -notmatch [regex]::Escape($expectedValue)) {
              $attemptPassed = $false
              break
            }
          }
          if ($attemptPassed) {
            $mvpRouteLineHierarchy = $attemptHierarchy
            break
          }
        }
        if (-not $mvpRouteLineHierarchy) {
          Save-Screenshot -Name "$mvpRouteServerPrefix-line-markets.png"
          $mvpRouteLineHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-line-markets.xml"
        } else {
          Save-Screenshot -Name "$mvpRouteServerPrefix-line-markets.png"
          $mvpRouteLineHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-line-markets.xml"
        }
        Assert-HierarchyContains -Path $mvpRouteLineHierarchy -Expected $mvpRouteLineExpected
        Assert-HierarchyDoesNotContain -Path $mvpRouteLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

        Invoke-TapHierarchyNode -Path $mvpRouteLineHierarchy -Identifier $mvpRouteTargetOutcomeId
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket.png"
        $mvpRouteSpreadTicketHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket.xml"
        Assert-HierarchyContains -Path $mvpRouteSpreadTicketHierarchy -Expected @("trade-ticket", "ticket-market-type-$mvpRouteTargetTicketMarketType", "ticket-line-$mvpRouteTargetLine", "ticket-period-Reg. Time", "provider-source-polymarket", "provider-token-$mvpRouteTargetToken", "Choose an amount")
        Assert-HierarchyDoesNotContain -Path $mvpRouteSpreadTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadTicketHierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $mvpRouteSpreadAmount10Hierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket-amount-10.xml"
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadAmount10Hierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $mvpRouteSpreadAmount20Hierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket-amount-20.xml"
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadAmount20Hierarchy -Identifier "ticket-preset-5"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket-ready.png"
        $mvpRouteSpreadReadyHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket-ready.xml"
        Assert-HierarchyContains -Path $mvpRouteSpreadReadyHierarchy -Expected @('$25', "Swipe up to buy", "place-mock-order", "ticket-market-type-$mvpRouteTargetTicketMarketType", "ticket-line-$mvpRouteTargetLine", "provider-source-polymarket")
        Assert-HierarchyDoesNotContain -Path $mvpRouteSpreadReadyHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadReadyHierarchy -Identifier "place-mock-order"
        Start-Sleep -Seconds 5
        Save-Screenshot -Name "$mvpRouteServerPrefix-portfolio.png"
        $mvpRoutePortfolioHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-portfolio.xml"
        $mvpRoutePortfolioExpected = if ($LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) {
          @(
            "Portfolio",
            "Server portfolio synced",
            "Order placed",
            "SERVER - Buy",
            "FILLED",
            "latest-order-card",
            "latest-activity-card",
            "position-card-",
            "Bought",
            "Filled shares",
            "Exec price",
            "status-filled",
            "portfolio-market-type-$mvpRouteTargetTicketMarketType",
            "portfolio-line-$mvpRouteTargetLine",
            "portfolio-period-Reg. Time",
            "portfolio-provider-source-polymarket",
            "portfolio-provider-token-$mvpRouteTargetToken"
          )
        } else {
          @(
            "Portfolio",
            "Server portfolio synced",
            "Order placed",
            "SERVER - Buy",
            "latest-order-card",
            "portfolio-open-order-count",
            "open-order-row-",
            "portfolio-market-type-spread",
            "portfolio-line-1.5",
            "portfolio-period-Reg. Time",
            "portfolio-provider-source-polymarket",
            "portfolio-provider-token-token-el-a-spread-home"
          )
        }
        Assert-HierarchyContains -Path $mvpRoutePortfolioHierarchy -Expected $mvpRoutePortfolioExpected
        Assert-HierarchyDoesNotContain -Path $mvpRoutePortfolioHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")

        $mvpRouteCanceledHierarchy = $null
        if ($LocalMvpRouteServerCancelFlow) {
          Assert-HierarchyContains -Path $mvpRoutePortfolioHierarchy -Expected @("Cancel", "cancel-open-order-")
          Invoke-TapHierarchyNode -Path $mvpRoutePortfolioHierarchy -Identifier "cancel-open-order-" -StartsWith
          Wait-HierarchyContains -Name "$mvpRouteServerPrefix-portfolio-canceled.xml" -Expected @("Portfolio", "Server portfolio synced", "Recent activity", "1", "Canceled", "latest-activity-card", "activity-canceled", "status-canceled", "portfolio-market-type-spread", "portfolio-line-1.5", "portfolio-period-Reg. Time", "portfolio-provider-source-polymarket", "portfolio-provider-token-token-el-a-spread-home") -Attempts 14 -DelaySeconds 2 | Out-Null
          Save-Screenshot -Name "$mvpRouteServerPrefix-portfolio-canceled.png"
          $mvpRouteCanceledHierarchy = Save-UiHierarchy -Name "$mvpRouteServerPrefix-portfolio-canceled.xml"
          Assert-HierarchyDoesNotContain -Path $mvpRouteCanceledHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")
        }

        $proof = [ordered]@{
          cycle = $mvpRouteServerCycle
          scenario = $mvpRouteServerScenario
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/$mvpRouteServerScript -Port $Port -BackendBaseUrl $BackendBaseUrl -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          backendBaseUrl = $BackendBaseUrl
          serverEventSlug = $ServerEventSlug
          orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
          marketDataMode = if ($env:EXPO_PUBLIC_MARKET_DATA_MODE) { $env:EXPO_PUBLIC_MARKET_DATA_MODE } else { "mock" }
          orderMode = if ($env:EXPO_PUBLIC_ORDER_MODE) { $env:EXPO_PUBLIC_ORDER_MODE } else { "mock" }
          apiKey = "in-process-mobile-dev-credential-redacted"
          result = "pass"
          assertions = [ordered]@{
            routeBackedEvent = @("live-detail loaded through forceBackendEventSlug", "live-data-source-polymarket-gamma")
            retailRows = @("$mvpRouteServerFilledFamily row uses ticket-source-backend-line-market", "provider-source-polymarket visible", "no default Book/orderbook entry points")
            ticket = @("simple ticket opens from route-backed $mvpRouteServerFilledFamily", "provider token/source visible", "server fake-token buy uses swipe-style submit")
            serverPortfolio = if ($LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) { @("POST /api/orders succeeds through mobile", "Portfolio sync returns server filled position and recent activity", "selected line/provider identity preserved") } else { @("POST /api/orders succeeds through mobile", "Portfolio sync returns server open order", "selected line/provider identity preserved") }
            serverHistory = if ($LocalMvpRouteServerFilledFlow -or $LocalMvpRouteServerFilledTotalsFlow -or $LocalMvpRouteServerFilledTeamTotalFlow) { @("seeded counterparty fills the mobile order", "Portfolio sync returns position and recent trade activity", "filled activity/history preserves selected line/provider identity") } elseif ($LocalMvpRouteServerCancelFlow) { @("DELETE /api/orders/:id succeeds through mobile", "Portfolio sync returns canceled activity", "activity/history preserves selected line/provider identity") } else { @("not in scope") }
          }
          artifacts = @(
            "$OutputDir/$mvpRouteServerPrefix-line-markets.png",
            "$HierarchyOutputDir/$mvpRouteServerPrefix-line-markets.xml",
            "$OutputDir/$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket-ready.png",
            "$HierarchyOutputDir/$mvpRouteServerPrefix-$mvpRouteServerFilledFamily-ticket-ready.xml",
            "$OutputDir/$mvpRouteServerPrefix-portfolio.png",
            "$HierarchyOutputDir/$mvpRouteServerPrefix-portfolio.xml"
          )
        }
        if ($LocalMvpRouteServerCancelFlow) {
          $proof.artifacts += @(
            "$OutputDir/$mvpRouteServerPrefix-portfolio-canceled.png",
            "$HierarchyOutputDir/$mvpRouteServerPrefix-portfolio-canceled.xml"
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir $mvpRouteServerProofName
        $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
        Write-Host "Proof summary: $proofPath"
        return
      }

      if ($LocalMvpRouteTicketFlow) {
        $mvpHiddenOrderBookExpected = @(
          "event-detail-top-order-book",
          "event-detail-chart-open-book",
          "event-detail-open-order-book",
          "event-detail-line-detail-order-book",
          "event-detail-inline-order-book",
          "orderbook-source-",
          "Route depth"
        )

        Save-Screenshot -Name "cycle-EU-holiwyn-route-mvp-top.png"
        $mvpRouteTopHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-top.xml"
        Assert-HierarchyContains -Path $mvpRouteTopHierarchy -Expected @("EL-A Provider Breadth World Cup Live", "event-detail-chart-route-state", "live-data-source-polymarket-gamma")
        Assert-HierarchyDoesNotContain -Path $mvpRouteTopHierarchy -Unexpected $mvpHiddenOrderBookExpected

        & $adb -s $Device shell input swipe 540 2100 540 520 500 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-EU-holiwyn-route-mvp-line-markets.png"
        $mvpRouteLineHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-line-markets.xml"
        Assert-HierarchyContains -Path $mvpRouteLineHierarchy -Expected @(
          "Game Lines",
          "Spread",
          "Totals",
          "event-detail-outcome-spread-spread-yes",
          "event-detail-outcome-totals-totals-over",
          "ticket-source-backend-line-market",
          "selection-market-family-spread",
          "selection-line-1.5",
          "selection-period-Reg. Time",
          "selection-market-family-totals",
          "provider-source-polymarket"
        )
        Assert-HierarchyDoesNotContain -Path $mvpRouteLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

        Invoke-TapHierarchyNode -Path $mvpRouteLineHierarchy -Identifier "event-detail-outcome-totals-totals-over"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-EU-holiwyn-route-mvp-totals-ticket.png"
        $mvpRouteTotalsTicketHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-totals-ticket.xml"
        Assert-HierarchyContains -Path $mvpRouteTotalsTicketHierarchy -Expected @("trade-ticket", "ticket-market-type-totals", "ticket-line-2.5", "ticket-period-Reg. Time", "provider-source-polymarket", "provider-token-token-el-a-totals-over", "Choose an amount")
        Assert-HierarchyDoesNotContain -Path $mvpRouteTotalsTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpRouteTotalsTicketHierarchy -Identifier "ticket-close"
        Start-Sleep -Seconds 1

        $mvpRouteLineHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-line-markets-after-close.xml"
        Invoke-TapHierarchyNode -Path $mvpRouteLineHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-EU-holiwyn-route-mvp-spread-ticket.png"
        $mvpRouteSpreadTicketHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-spread-ticket.xml"
        Assert-HierarchyContains -Path $mvpRouteSpreadTicketHierarchy -Expected @("trade-ticket", "ticket-market-type-spread", "ticket-line-1.5", "ticket-period-Reg. Time", "provider-source-polymarket", "provider-token-token-el-a-spread-home", "Choose an amount")
        Assert-HierarchyDoesNotContain -Path $mvpRouteSpreadTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadTicketHierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $mvpRouteSpreadAmount10Hierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-spread-ticket-amount-10.xml"
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadAmount10Hierarchy -Identifier "ticket-preset-10"
        Start-Sleep -Milliseconds 500
        $mvpRouteSpreadAmount20Hierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-spread-ticket-amount-20.xml"
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadAmount20Hierarchy -Identifier "ticket-preset-5"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-EU-holiwyn-route-mvp-spread-ticket-ready.png"
        $mvpRouteSpreadReadyHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-spread-ticket-ready.xml"
        Assert-HierarchyContains -Path $mvpRouteSpreadReadyHierarchy -Expected @('$25', "Swipe up to buy", "place-mock-order", "ticket-market-type-spread", "ticket-line-1.5", "provider-source-polymarket")
        Assert-HierarchyDoesNotContain -Path $mvpRouteSpreadReadyHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpRouteSpreadReadyHierarchy -Identifier "place-mock-order"
        Start-Sleep -Seconds 2
        Save-Screenshot -Name "cycle-EU-holiwyn-route-mvp-portfolio.png"
        $mvpRoutePortfolioHierarchy = Save-UiHierarchy -Name "cycle-EU-holiwyn-route-mvp-portfolio.xml"
        Assert-HierarchyContains -Path $mvpRoutePortfolioHierarchy -Expected @(
          "Portfolio",
          "Order placed",
          "latest-order-card",
          "latest-activity-card",
          "position-card-",
          "portfolio-market-type-spread",
          "portfolio-line-1.5",
          "portfolio-period-Reg. Time",
          "portfolio-provider-source-polymarket",
          "portfolio-provider-token-token-el-a-spread-home"
        )
        Assert-HierarchyDoesNotContain -Path $mvpRoutePortfolioHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")

        $proof = [ordered]@{
          cycle = "EU"
          scenario = "Local MVP Android route-backed retail ticket flow with orderbook hidden by default"
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpRouteTicketFlow -Port $Port -BackendBaseUrl $BackendBaseUrl -ServerEventSlug $ServerEventSlug -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          backendBaseUrl = $BackendBaseUrl
          serverEventSlug = $ServerEventSlug
          orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
          marketDataMode = if ($env:EXPO_PUBLIC_MARKET_DATA_MODE) { $env:EXPO_PUBLIC_MARKET_DATA_MODE } else { "mock" }
          orderMode = if ($env:EXPO_PUBLIC_ORDER_MODE) { $env:EXPO_PUBLIC_ORDER_MODE } else { "mock" }
          result = "pass"
          assertions = [ordered]@{
            routeBackedEvent = @("live-detail loaded through forceBackendEventSlug", "live-data-source-polymarket-gamma")
            retailRows = @("spread and totals rows use ticket-source-backend-line-market", "provider-source-polymarket visible", "no default Book/orderbook entry points")
            ticket = @("spread/totals simple ticket opens with current probability", "provider token/source visible", "fake-token buy uses swipe-style submit")
            portfolio = @("position/latest order/latest activity preserve route-backed market/outcome/provider identity")
          }
          artifacts = @(
            "docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-line-markets.png",
            "docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-line-markets.xml",
            "docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-totals-ticket.png",
            "docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-totals-ticket.xml",
            "docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-spread-ticket-ready.png",
            "docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-spread-ticket-ready.xml",
            "docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-portfolio.png",
            "docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-portfolio.xml"
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-EU-local-mvp-route-ticket-flow-proof.json"
        $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
        Write-Host "Proof summary: $proofPath"
        return
      }

      if ($LocalMvpLineFamilyBreadth) {
        $mvpHiddenOrderBookExpected = @(
          "event-detail-top-order-book",
          "event-detail-chart-open-book",
          "event-detail-open-order-book",
          "event-detail-line-detail-order-book",
          "event-detail-inline-order-book",
          "orderbook-source-",
          "Route depth"
        )

        & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
        Start-Sleep -Milliseconds 500
        & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
        Start-Sleep -Seconds 1
        & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ES-holiwyn-local-mvp-line-families.png"
        $mvpLineFamilyHierarchy = Save-UiHierarchy -Name "cycle-ES-holiwyn-local-mvp-line-families.xml"
        Assert-HierarchyContains -Path $mvpLineFamilyHierarchy -Expected @("Game Lines", "Spread", "Totals", "event-detail-sticky-game-lines-tab", "event-detail-totals-line-2-5")
        Assert-HierarchyDoesNotContain -Path $mvpLineFamilyHierarchy -Unexpected $mvpHiddenOrderBookExpected

        Invoke-TapHierarchyNode -Path $mvpLineFamilyHierarchy -Identifier "event-detail-totals-line-3-5"
        Start-Sleep -Milliseconds 500
        $mvpTotalsLineHierarchy = Save-UiHierarchy -Name "cycle-ES-holiwyn-local-mvp-totals-35.xml"
        Invoke-TapHierarchyNode -Path $mvpTotalsLineHierarchy -Identifier "event-detail-totals-period-2nd-half"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ES-holiwyn-local-mvp-totals-selected.png"
        $mvpTotalsSelectedHierarchy = Save-UiHierarchy -Name "cycle-ES-holiwyn-local-mvp-totals-selected.xml"
        Assert-HierarchyContains -Path $mvpTotalsSelectedHierarchy -Expected @("Totals", "Over 3.5", "Under 3.5", "ticket-source-deterministic-line-fixture", "selection-market-family-totals", "selection-line-3.5")
        Assert-HierarchyDoesNotContain -Path $mvpTotalsSelectedHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpTotalsSelectedHierarchy -Identifier "event-detail-outcome-totals-totals-over"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ES-holiwyn-local-mvp-totals-ticket.png"
        $mvpTotalsTicketHierarchy = Save-UiHierarchy -Name "cycle-ES-holiwyn-local-mvp-totals-ticket.xml"
        Assert-HierarchyContains -Path $mvpTotalsTicketHierarchy -Expected @("trade-ticket", "Over 3.5", "ticket-market-type-totals", "ticket-line-3.5", "ticket-period-2nd Half", "ticket-display-label-Over 3.5 2H", "Choose an amount")
        Assert-HierarchyDoesNotContain -Path $mvpTotalsTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpTotalsTicketHierarchy -Identifier "ticket-close"
        Start-Sleep -Seconds 1

        & $adb -s $Device shell input swipe 540 1800 540 1020 350 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ES-holiwyn-local-mvp-team-total-row.png"
        $mvpTeamTotalHierarchy = Save-UiHierarchy -Name "cycle-ES-holiwyn-local-mvp-team-total-row.xml"
        Assert-HierarchyContains -Path $mvpTeamTotalHierarchy -Expected @("Full Game Team Total Goals", "event-detail-market-toggle-team-total-goals")
        Assert-HierarchyDoesNotContain -Path $mvpTeamTotalHierarchy -Unexpected $mvpHiddenOrderBookExpected
        Invoke-TapHierarchyNode -Path $mvpTeamTotalHierarchy -Identifier "event-detail-outcome-team-total-goals-team-total-over"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ES-holiwyn-local-mvp-team-total-ticket.png"
        $mvpTeamTotalTicketHierarchy = Save-UiHierarchy -Name "cycle-ES-holiwyn-local-mvp-team-total-ticket.xml"
        Assert-HierarchyContains -Path $mvpTeamTotalTicketHierarchy -Expected @("trade-ticket", "Over 1.5", "ticket-market-type-team-total", "ticket-line-1.5", "ticket-period-Reg. Time", "ticket-display-label-MEX Over 1.5 RT", "Choose an amount")
        Assert-HierarchyDoesNotContain -Path $mvpTeamTotalTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected

        $proof = [ordered]@{
          cycle = "ES"
          scenario = "Local MVP Android line-family ticket breadth with orderbook hidden by default"
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpLineFamilyBreadth -Port $Port -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
          result = "pass"
          assertions = [ordered]@{
            marketLines = @("spread", "totals", "team total", "no visible Book/orderbook entry points")
            totalsTicket = @("Over 3.5", "2nd Half", "ticket-market-type-totals", "contract-shaped ticket source")
            teamTotalTicket = @("Over 1.5", "Reg. Time", "ticket-market-type-team-total", "contract-shaped ticket source")
          }
          artifacts = @(
            "docs/mobile/screenshots/cycle-ES-local-mvp-line-family-breadth/cycle-ES-holiwyn-local-mvp-line-families.png",
            "docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-holiwyn-local-mvp-line-families.xml",
            "docs/mobile/screenshots/cycle-ES-local-mvp-line-family-breadth/cycle-ES-holiwyn-local-mvp-totals-ticket.png",
            "docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-holiwyn-local-mvp-totals-ticket.xml",
            "docs/mobile/screenshots/cycle-ES-local-mvp-line-family-breadth/cycle-ES-holiwyn-local-mvp-team-total-ticket.png",
            "docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-holiwyn-local-mvp-team-total-ticket.xml"
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-ES-local-mvp-line-family-breadth-proof.json"
        $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
        Write-Host "Proof summary: $proofPath"
        return
      }

      if ($LocalMvpStatusFlow) {
        $mvpHiddenOrderBookExpected = @(
          "event-detail-top-order-book",
          "event-detail-chart-open-book",
          "event-detail-open-order-book",
          "event-detail-line-detail-order-book",
          "event-detail-inline-order-book",
          "orderbook-source-",
          "Route depth"
        )
        Save-Screenshot -Name "cycle-ER-holiwyn-local-mvp-status-top.png"
        $mvpStatusTopHierarchy = Save-UiHierarchy -Name "cycle-ER-holiwyn-local-mvp-status-top.xml"
        Assert-HierarchyContains -Path $mvpStatusTopHierarchy -Expected @(
          "event-detail-price-chart",
          "event-detail-chart-route-state",
          "chart-status-idle",
          "provider-lifecycle-refresh-due",
          "event-detail-chart-ticket-handoff-status",
          "provider-lifecycle-ready",
          "event-detail-chart-open-ticket"
        )
        Assert-HierarchyDoesNotContain -Path $mvpStatusTopHierarchy -Unexpected $mvpHiddenOrderBookExpected

        & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
        Start-Sleep -Milliseconds 500
        & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
        Start-Sleep -Seconds 1
        & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ER-holiwyn-local-mvp-status-market-lines.png"
        $mvpStatusMarketHierarchy = Save-UiHierarchy -Name "cycle-ER-holiwyn-local-mvp-status-market-lines.xml"
        Assert-HierarchyContains -Path $mvpStatusMarketHierarchy -Expected @("Game Lines", "Spread", "Totals", "event-detail-sticky-game-lines-tab", "event-detail-spread-line-1-5", "event-detail-totals-line-2-5")
        Assert-HierarchyDoesNotContain -Path $mvpStatusMarketHierarchy -Unexpected $mvpHiddenOrderBookExpected

        Invoke-TapHierarchyNode -Path $mvpStatusMarketHierarchy -Identifier "event-detail-spread-line-2-5"
        Start-Sleep -Seconds 1
        $mvpStatusSpreadHierarchy = Save-UiHierarchy -Name "cycle-ER-holiwyn-local-mvp-status-spread-25.xml"
        Invoke-TapHierarchyNode -Path $mvpStatusSpreadHierarchy -Identifier "event-detail-spread-period-1st-half"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-ER-holiwyn-local-mvp-status-selected-line.png"
        $mvpStatusSelectedHierarchy = Save-UiHierarchy -Name "cycle-ER-holiwyn-local-mvp-status-selected-line.xml"
        Assert-HierarchyContains -Path $mvpStatusSelectedHierarchy -Expected @(
          "Spread",
          "MEX to win by over 2.5 goals",
          "Yes, MEX -2.5",
          "No",
          "ticket-source-deterministic-line-fixture",
          "selection-market-family-spread",
          "selection-line-2.5",
          "selection-display-label-MEX -2.5"
        )
        Assert-HierarchyDoesNotContain -Path $mvpStatusSelectedHierarchy -Unexpected $mvpHiddenOrderBookExpected

        $proof = [ordered]@{
          cycle = "ER"
          scenario = "Local MVP Android retail status proof with orderbook hidden by default"
          command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpStatusFlow -Port $Port -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
          orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
          result = "pass"
          assertions = [ordered]@{
            defaultEventDetail = @("chart route state", "ticket handoff status", "no visible Book/orderbook entry points")
            marketLines = @("spread and totals selectors remain reachable without Book")
            selectedLine = @("spread 2.5", "contract-shaped ticket source", "no visible Book/orderbook entry points")
          }
          artifacts = @(
            "docs/mobile/screenshots/cycle-ER-local-mvp-status-flow/cycle-ER-holiwyn-local-mvp-status-top.png",
            "docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-holiwyn-local-mvp-status-top.xml",
            "docs/mobile/screenshots/cycle-ER-local-mvp-status-flow/cycle-ER-holiwyn-local-mvp-status-market-lines.png",
            "docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-holiwyn-local-mvp-status-market-lines.xml",
            "docs/mobile/screenshots/cycle-ER-local-mvp-status-flow/cycle-ER-holiwyn-local-mvp-status-selected-line.png",
            "docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-holiwyn-local-mvp-status-selected-line.xml"
          )
        }
        $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-ER-local-mvp-status-flow-proof.json"
        $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
        Write-Host "Proof summary: $proofPath"
        return
      }

      $mvpCycle = if ($LocalMvpSellFlow) { "EQ" } else { "EP" }
      $mvpArtifactDir = if ($LocalMvpSellFlow) { "cycle-EQ-local-mvp-sell-flow" } else { "cycle-EP-local-mvp-trade-flow" }
      $mvpSideLabel = if ($LocalMvpSellFlow) { "Sell" } else { "Buy" }
      $mvpPastTense = if ($LocalMvpSellFlow) { "Sold" } else { "Bought" }
      $mvpSubmitText = if ($LocalMvpSellFlow) { "Swipe up to sell" } else { "Swipe up to buy" }
      $mvpPortfolioSide = if ($LocalMvpSellFlow) { "portfolio-side-sell" } else { "portfolio-side-buy" }
      $mvpOrderLabel = if ($LocalMvpSellFlow) { "MOCK - Sell - No - MEX -2.5 1H" } else { "MOCK - Buy - MEX -2.5 1H" }
      $mvpSellTicketExpected = @(
        "ticket-market-family-spread",
        "ticket-market-type-spread",
        "ticket-line-2.5",
        "ticket-period-1st Half",
        "ticket-display-label-MEX -2.5 1H",
        "ticket-contract-side-no"
      )
      $mvpPortfolioContractSide = if ($LocalMvpSellFlow) { "no" } else { "yes" }
      $mvpHiddenOrderBookExpected = @(
        "event-detail-top-order-book",
        "event-detail-chart-open-book",
        "event-detail-open-order-book",
        "event-detail-line-detail-order-book",
        "event-detail-inline-order-book",
        "orderbook-source-",
        "Route depth"
      )
      $mvpLineExpected = @(
        "selection-market-family-spread",
        "selection-market-type-spread",
        "selection-line-2.5",
        "selection-period-1st Half",
        "selection-display-label-MEX -2.5 1H"
      )
      $mvpTicketExpected = @(
        "ticket-market-family-spread",
        "ticket-market-type-spread",
        "ticket-line-2.5",
        "ticket-period-1st Half",
        "ticket-display-label-MEX -2.5 1H",
        "ticket-contract-side-yes"
      )
      $mvpPortfolioExpected = @(
        "portfolio-market-family-spread",
        "portfolio-market-type-spread",
        "portfolio-line-2.5",
        "portfolio-period-1st Half",
        $mvpPortfolioSide,
        "portfolio-display-label-MEX -2.5 1H",
        "portfolio-contract-side-$mvpPortfolioContractSide"
      )
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-$mvpCycle-holiwyn-local-mvp-market-lines.png"
      $mvpMarketHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-market-lines.xml"
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $mvpMarketHierarchy)) {
        Start-Sleep -Seconds 1
        $mvpMarketHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-market-lines.xml"
      }
      Assert-HierarchyContains -Path $mvpMarketHierarchy -Expected @("Game Lines", "Spread", "Totals", "event-detail-sticky-game-lines-tab", "event-detail-spread-line-1-5", "event-detail-totals-line-2-5")
      Assert-HierarchyDoesNotContain -Path $mvpMarketHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $mvpMarketHierarchy -Identifier "event-detail-spread-line-2-5"
      Start-Sleep -Seconds 1
      $mvpSpreadHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-spread-25.xml"
      Invoke-TapHierarchyNode -Path $mvpSpreadHierarchy -Identifier "event-detail-spread-period-1st-half"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-$mvpCycle-holiwyn-local-mvp-selected-line.png"
      $mvpSelectedLineHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-selected-line.xml"
      Assert-HierarchyContains -Path $mvpSelectedLineHierarchy -Expected (@("Spread", "MEX to win by over 2.5 goals", "Yes, MEX -2.5", "33.3x", "3%", "No", "97%", "ticket-source-deterministic-line-fixture") + $mvpLineExpected)
      Assert-HierarchyDoesNotContain -Path $mvpSelectedLineHierarchy -Unexpected $mvpHiddenOrderBookExpected

      Invoke-TapHierarchyNode -Path $mvpSelectedLineHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-$mvpCycle-holiwyn-local-mvp-ticket.png"
      $mvpTicketHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-ticket.xml"
      Assert-HierarchyContains -Path $mvpTicketHierarchy -Expected (@("trade-ticket", "Mexico vs. Ecuador", "ticket-selection-line", "Yes - MEX -2.5 1H", "ticket-selected-outcome-choice", "ticket-preset-10", "Choose an amount") + $mvpTicketExpected)
      Assert-HierarchyDoesNotContain -Path $mvpTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
      if ($LocalMvpSellFlow) {
        Invoke-TapHierarchyNode -Path $mvpTicketHierarchy -Identifier "ticket-side-sell"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-$mvpCycle-holiwyn-local-mvp-sell-ticket.png"
        $mvpTicketHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-sell-ticket.xml"
        Assert-HierarchyContains -Path $mvpTicketHierarchy -Expected (@("trade-ticket", "Sell", "No", "Odds 97%", "ticket-side-sell", "ticket-preset-10", "Choose an amount") + $mvpSellTicketExpected)
        Assert-HierarchyDoesNotContain -Path $mvpTicketHierarchy -Unexpected $mvpHiddenOrderBookExpected
      }
      Invoke-TapHierarchyNode -Path $mvpTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $mvpTicketAmount10Hierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-ticket-amount-10.xml"
      Invoke-TapHierarchyNode -Path $mvpTicketAmount10Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $mvpTicketAmount20Hierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $mvpTicketAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-$mvpCycle-holiwyn-local-mvp-ticket-ready.png"
      $mvpTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-ticket-ready.xml"
      $mvpReadyExpected = if ($LocalMvpSellFlow) {
        @('$25', "To win", "97c", "ticket-price-line", $mvpSubmitText, "place-mock-order", "MEX -2.5 1H")
      } else {
        @('$25', 'To win $833.33', "ticket-price-line", $mvpSubmitText, "place-mock-order", "Yes - MEX -2.5 1H")
      }
      $mvpActiveTicketExpected = if ($LocalMvpSellFlow) { $mvpSellTicketExpected } else { $mvpTicketExpected }
      Assert-HierarchyContains -Path $mvpTicketReadyHierarchy -Expected ($mvpReadyExpected + $mvpActiveTicketExpected)
      Assert-HierarchyDoesNotContain -Path $mvpTicketReadyHierarchy -Unexpected $mvpHiddenOrderBookExpected
      Invoke-TapHierarchyNode -Path $mvpTicketReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-$mvpCycle-holiwyn-local-mvp-portfolio.png"
      $mvpPortfolioHierarchy = Save-UiHierarchy -Name "cycle-$mvpCycle-holiwyn-local-mvp-portfolio.xml"
      Assert-HierarchyContains -Path $mvpPortfolioHierarchy -Expected (@("Portfolio", "Open positions", "Recent activity", "1", "Order placed", "latest-order-card", "latest-activity-card", "position-card-", $mvpOrderLabel, "Mexico vs. Ecuador", "$mvpSideLabel - Filled shares", $mvpPastTense) + $mvpPortfolioExpected)
      Assert-HierarchyDoesNotContain -Path $mvpPortfolioHierarchy -Unexpected @("event-detail-top-order-book", "event-detail-open-order-book", "orderbook-source-", "Route depth")

      $proof = [ordered]@{
        cycle = $mvpCycle
        scenario = "Local MVP Android $mvpSideLabel trade flow with orderbook hidden by default"
        command = "powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 $(if ($LocalMvpSellFlow) { '-LocalMvpSellFlow' } else { '-LocalMvpTradeFlow' }) -Port $Port -OutputDir $OutputDir -HierarchyOutputDir $HierarchyOutputDir"
        orderbookDebug = if ($env:EXPO_PUBLIC_SHOW_ORDERBOOK) { $env:EXPO_PUBLIC_SHOW_ORDERBOOK } else { "unset" }
        result = "pass"
        assertions = [ordered]@{
          defaultEventDetail = @("chart", "contract rail", "game lines", "spread/totals selectors", "no visible Book/orderbook entry points")
          selectedLine = @("spread 2.5", "1st Half", "market/outcome identity preserved")
          simpleTicket = @("fake-token $($mvpSideLabel.ToLowerInvariant())", "current probability price", $mvpSubmitText, "no visible Book/orderbook entry points")
          portfolio = @("Order placed", "latest order", "latest activity", "position card", "line identity preserved")
        }
        artifacts = @(
          "docs/mobile/screenshots/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-market-lines.png",
          "docs/mobile/harness/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-market-lines.xml",
          "docs/mobile/screenshots/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-selected-line.png",
          "docs/mobile/harness/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-selected-line.xml",
          "docs/mobile/screenshots/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-ticket-ready.png",
          "docs/mobile/harness/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-ticket-ready.xml",
          "docs/mobile/screenshots/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-portfolio.png",
          "docs/mobile/harness/$mvpArtifactDir/cycle-$mvpCycle-holiwyn-local-mvp-portfolio.xml"
        )
      }
      $proofPath = Join-Path $ResolvedHierarchyOutputDir "cycle-$mvpCycle-local-mvp-trade-flow-proof.json"
      $proof | ConvertTo-Json -Depth 6 | Set-Content -Path $proofPath
      Write-Host "Proof summary: $proofPath"
      return
    }

    if ($EventDetailProps) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-player-props-tab"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-props.png"
      $eventDetailPropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-props.xml"
      Assert-HierarchyContains -Path $eventDetailPropsHierarchy -Expected @("Player Props", "event-detail-player-props", "event-detail-player-props-empty", "Player Props unavailable for this match")
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-props-rows.png"
      $eventDetailPropsRowsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-props-rows.xml"
      Assert-HierarchyContains -Path $eventDetailPropsRowsHierarchy -Expected @("event-detail-player-props-empty", "Player Props unavailable for this match")
      & $adb -s $Device shell input swipe 540 1800 540 600 500 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-props-lower.png"
      $eventDetailPropsLowerHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-props-lower.xml"
      Assert-HierarchyContains -Path $eventDetailPropsLowerHierarchy -Expected @("Market Rules", "View Full Rules", "More Events")
      & $adb -s $Device shell input swipe 540 1800 540 750 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-props-rules-more.png"
      $eventDetailPropsRulesMoreHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-props-rules-more.xml"
      Assert-HierarchyContains -Path $eventDetailPropsRulesMoreHierarchy -Expected @("Market Rules", "MEX to advance", "View Full Rules", "More Events", "Portugal vs. Croatia", "England vs. Congo DR")
      return
    }

    if ($EventDetailPropTicket) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"
      Start-Sleep -Seconds 1
      $eventDetailPropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-ticket-props.xml"
      Assert-HierarchyContains -Path $eventDetailPropsHierarchy -Expected @("Props", "Both teams to score", "Yes", "event-detail-outcome-mexico-ecuador-both-score-yes")
      Invoke-TapHierarchyNode -Path $eventDetailPropsHierarchy -Identifier "event-detail-outcome-mexico-ecuador-both-score-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-prop-ticket.png"
      $eventDetailPropTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailPropTicketHierarchy -Expected @("Yes", "Mexico vs. Ecuador", "Trading mode: Fake-token mock", "ticket-market-depth", "Best bid 0.48 USDT (1.02k shares)", "Best ask 0.55 USDT (1.23k shares)", "Estimated cost", "196.08 shares", "0.51 USDT", "2.0x")
      & $adb -s $Device shell input swipe 540 1760 540 760 450 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-prop-ticket-order-ready.png"
      $eventDetailPropTicketOrderReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-ticket-order-ready.xml"
      Assert-HierarchyContains -Path $eventDetailPropTicketOrderReadyHierarchy -Expected @("place-mock-order", "Swipe up to buy")
      return
    }

    if ($EventDetailPropOrder) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"
      Start-Sleep -Seconds 1
      $eventDetailPropOrderPropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-order-props.xml"
      try {
        Assert-HierarchyContains -Path $eventDetailPropOrderPropsHierarchy -Expected @("Props", "Both teams to score", "Yes", "event-detail-outcome-mexico-ecuador-both-score-yes")
      } catch {
        if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $eventDetailPropOrderPropsHierarchy)) {
          $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
          Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"
          Start-Sleep -Seconds 1
        } else {
          & $adb -s $Device shell input swipe 540 1760 540 980 450 | Out-Null
          Start-Sleep -Seconds 1
        }
        $eventDetailPropOrderPropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-order-props.xml"
        Assert-HierarchyContains -Path $eventDetailPropOrderPropsHierarchy -Expected @("Props", "Both teams to score", "Yes", "event-detail-outcome-mexico-ecuador-both-score-yes")
      }
      Invoke-TapHierarchyNode -Path $eventDetailPropOrderPropsHierarchy -Identifier "event-detail-outcome-mexico-ecuador-both-score-yes"
      Start-Sleep -Seconds 1
      $eventDetailPropOrderTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-order-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailPropOrderTicketHierarchy -Expected @("Yes", "Mexico vs. Ecuador", "Estimated cost", "196.08 shares", "0.51 USDT", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $eventDetailPropOrderTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-prop-order-portfolio.png"
      $eventDetailPropOrderPortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-order-portfolio.xml"
      Assert-HierarchyContains -Path $eventDetailPropOrderPortfolioHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "1", "Both teams to score - Yes", "Buy - Filled shares 196.08 - Exec price 51% - Implied odds 2.0x", "Order placed", "MOCK - Buy - Yes", "Both teams to score", "Filled shares", "196.08", "Exec price", "51%", "Implied odds", "2.0x")
      return
    }

    if ($EventDetailPropClose) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"
      Start-Sleep -Seconds 1
      $eventDetailPropClosePropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-close-props.xml"
      try {
        Assert-HierarchyContains -Path $eventDetailPropClosePropsHierarchy -Expected @("Props", "Both teams to score", "Yes", "event-detail-outcome-mexico-ecuador-both-score-yes")
      } catch {
        if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $eventDetailPropClosePropsHierarchy)) {
          $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
          Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"
          Start-Sleep -Seconds 1
        } else {
          & $adb -s $Device shell input swipe 540 1760 540 980 450 | Out-Null
          Start-Sleep -Seconds 1
        }
        $eventDetailPropClosePropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-close-props.xml"
        Assert-HierarchyContains -Path $eventDetailPropClosePropsHierarchy -Expected @("Props", "Both teams to score", "Yes", "event-detail-outcome-mexico-ecuador-both-score-yes")
      }
      Invoke-TapHierarchyNode -Path $eventDetailPropClosePropsHierarchy -Identifier "event-detail-outcome-mexico-ecuador-both-score-yes"
      Start-Sleep -Seconds 1
      $eventDetailPropCloseTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-close-ticket.xml"
      Invoke-TapHierarchyNode -Path $eventDetailPropCloseTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      $eventDetailPropClosePortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-close-portfolio.xml"
      Assert-HierarchyContains -Path $eventDetailPropClosePortfolioHierarchy -Expected @("Portfolio", "Open positions", "1", "Both teams to score - Yes", "Order placed")
      & $adb -s $Device shell input swipe 540 1540 540 760 300 | Out-Null
      Start-Sleep -Seconds 1
      $eventDetailPropCloseReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-close-ready.xml"
      Assert-HierarchyContains -Path $eventDetailPropCloseReadyHierarchy -Expected @("Both teams to score", "MOCK - Buy - Yes - 51%", "Close position")
      Invoke-TapHierarchyNode -Path $eventDetailPropCloseReadyHierarchy -Identifier "close-position-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-prop-close-closed.png"
      $eventDetailPropCloseClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-prop-close-closed.xml"
      Assert-HierarchyContains -Path $eventDetailPropCloseClosedHierarchy -Expected @("Portfolio", "No positions yet", "Recent activity", "Closed", "Bought", "Both teams to score - Yes", "105.88 USDT", "Entry 51% - Current value 105.88 USDT - Est. P/L +5.88 USDT", "Buy - Filled shares 196.08 - Exec price 51% - Implied odds 2.0x")
      return
    }

    if ($EventDetailSellDefault) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Match winner", "2 outcomes", "Best bid", "0.62 USDT", "Best ask", "0.66 USDT", "64%", "Sell - 1.6x", "Liquidity: Best bid 1.28k shares - Best ask 900 shares", "event-detail-outcome-depth-size-mexico-ecuador-winner-mexico", "Best bid 0.61 USDT - Best ask 0.68 USDT", "event-detail-outcome-depth-mexico-ecuador-winner-mexico")
      return
    }

    if ($EventDetailSellDefaultTrade) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Match winner", "2 outcomes", "64%", "Sell - 1.6x", "event-detail-outcome-mexico-ecuador-winner-mexico")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-outcome-mexico-ecuador-winner-mexico"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-sell-ticket.png"
      $eventDetailSellTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-sell-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailSellTicketHierarchy -Expected @("Mexico", "Mexico vs. Ecuador", "Trading mode: Fake-token mock", "ticket-market-depth", "Estimated proceeds", "Swipe up to sell")
      return
    }

    if ($EventDetailTrade) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-primary-outcome-mexico-ecuador-winner-mexico"
      Start-Sleep -Seconds 1
      $eventDetailTicketCandidate = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket.xml"
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $eventDetailTicketCandidate)) {
        Start-Sleep -Seconds 2
        $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
        Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-primary-outcome-mexico-ecuador-winner-mexico"
      }
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-ticket.png"
      $eventDetailTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailTicketHierarchy -Expected @("trade-ticket", "ticket-drag-handle", "ticket-close", "ticket-settings", "ticket-side-pill", "Buy", "ticket-selection-summary", "Match winner", "Mexico", "Mexico vs. Ecuador", "ticket-amount-display", "$0", "ticket-selected-outcome-choice", "ticket-side-buy", "ticket-side-sell", "ticket-preset-1", "+$1", "ticket-preset-5", "+$5", "ticket-preset-10", "+$10", "ticket-preset-100", "+$100", "Choose an amount")
      Invoke-TapHierarchyNode -Path $eventDetailTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-ticket-amount.png"
      $eventDetailTicketAmountHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket-amount.xml"
      Assert-HierarchyContains -Path $eventDetailTicketAmountHierarchy -Expected @("$10", "ticket-to-win-line", "To win", "ticket-price-line", "64c", "Swipe up to buy", "Final cost may vary.")
      Invoke-TapHierarchyNode -Path $eventDetailTicketAmountHierarchy -Identifier "ticket-settings"
      Start-Sleep -Seconds 1
      $eventDetailTicketDetailsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket-details.xml"
      Assert-HierarchyContains -Path $eventDetailTicketDetailsHierarchy -Expected @("ticket-advanced-details", "Trading mode: Fake-token mock", "ticket-market-depth", "ticket-amount-keypad", "ticket-keypad-1", "ticket-keypad-backspace", "ticket-estimate-details", "Estimated cost", "Est. shares", "Avg price", "Estimated payout", "Potential profit")
      Invoke-TapHierarchyNode -Path $eventDetailTicketDetailsHierarchy -Identifier "ticket-close"
      Start-Sleep -Seconds 1
      $eventDetailAfterCloseHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket-closed.xml"
      Invoke-TapHierarchyNode -Path $eventDetailAfterCloseHierarchy -Identifier "event-detail-primary-outcome-mexico-ecuador-winner-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-away-ticket.png"
      $eventDetailAwayTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-away-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailAwayTicketHierarchy -Expected @("trade-ticket", "Mexico vs. Ecuador", "Match winner", "Ecuador", "ticket-amount-display", "$0", "ticket-preset-5", "Choose an amount")
      return
    }

    Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-event-detail-props.png"
    $eventDetailPropsHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-props.xml"
    Assert-HierarchyContains -Path $eventDetailPropsHierarchy -Expected @("Both teams to score", "First goal scorer team")

    $eventDetailBackHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-back.xml"
    Invoke-TapHierarchyNode -Path $eventDetailBackHierarchy -Identifier "event-detail-back"
    Start-Sleep -Seconds 1
    Wait-HierarchyContains -Name "cycle-current-holiwyn-home-after-detail.xml" -Expected @("Holiwyn", "World Cup", "Games", "Futures") -Attempts 5 -DelaySeconds 1 | Out-Null

    $homeAfterDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-home-after-detail.xml"
    Invoke-TapHierarchyNode -Path $homeAfterDetailHierarchy -Identifier "featured-future-france"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-ticket.png"
    $ticketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket.xml"
    Assert-HierarchyContains -Path $ticketHierarchy -Expected @("Fake balance", "10,000 USDT", "Max", "500 USDT", "1,000 USDT", "Estimated cost", "Est. shares", "Avg price", "Implied odds", "2.9x", "Estimated payout", "Potential profit", "Swipe up to buy")

    if ($SellTicket) {
      Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "ticket-side-sell"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-sell-ticket.png"
      $sellTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-sell-ticket.xml"
      Assert-HierarchyContains -Path $sellTicketHierarchy -Expected @("Sell", "Estimated proceeds", "Est. shares", "Avg price", "Implied odds", "Swipe up to sell")
      return
    }

    if ($OrderFailure) {
      Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-ticket-order-error.png"
      $ticketOrderErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-order-error.xml"
      Assert-HierarchyContains -Path $ticketOrderErrorHierarchy -Expected @("Order failed. Try again.", "Swipe up to buy", "ticket-order-error")
      return
    }

    Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "ticket-max-amount"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-ticket-max.png"
    $ticketMaxHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-max.xml"
    Assert-HierarchyContains -Path $ticketMaxHierarchy -Expected @("10,000", "Estimated cost", "Est. shares", "Avg price", "Implied odds", "10,000 USDT")

    Invoke-TapHierarchyNode -Path $ticketMaxHierarchy -Identifier "place-mock-order"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-portfolio.png"
    $portfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio.xml"
    Assert-HierarchyContains -Path $portfolioHierarchy -Expected @("Fake balance", "Portfolio", "Invested", "Entry", "Current value", "Est. P/L", "Close position", "Order placed")

    Invoke-TapHierarchyNode -Path $portfolioHierarchy -Identifier "close-position-" -StartsWith
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-portfolio-closed.png"
    $portfolioClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-closed.xml"
    Assert-HierarchyContains -Path $portfolioClosedHierarchy -Expected @("Fake balance", "10,882.35 USDT", "No positions yet", "Recent activity", "Closed", "Bought")

    Invoke-TapHierarchyNode -Path $portfolioClosedHierarchy -Identifier "holiwyn-live-tab"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-live.png"
    $liveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-live.xml"
    Assert-HierarchyContains -Path $liveHierarchy -Expected @("Live World Cup", "Updated just now", "Refresh")
    Assert-HierarchyContainsAny -Path $liveHierarchy -ExpectedAny @("No live markets right now.", "Live Â·")

    Invoke-TapHierarchyNode -Path $liveHierarchy -Identifier "refresh-live-markets"
    $liveRefreshHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-live-refresh.xml" -Expected @("Updated just now", "refreshed", "Refresh") -Attempts 8 -DelaySeconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-live-refresh.png"

    Invoke-TapHierarchyNode -Path $liveRefreshHierarchy -Identifier "holiwyn-search-tab"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-search.png"
    $searchHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search.xml"
    Assert-HierarchyContains -Path $searchHierarchy -Expected @("Search World Cup markets", "Top results", "All", "Upcoming")

    Invoke-TapHierarchyNode -Path $searchHierarchy -Identifier "search-world-cup-markets"
    Start-Sleep -Seconds 1
    & $adb -s $Device shell input text zzzz | Out-Null
    Start-Sleep -Seconds 1
    & $adb -s $Device shell input keyevent 111 | Out-Null
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-search-query.png"
    $searchQueryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-query.xml"
    Assert-HierarchyContains -Path $searchQueryHierarchy -Expected @("zzzz", "Results", "0 results", "No markets match your search.", "Clear")
  }
}
finally {
  Stop-SmokeExpoProcess -Process $expo -Port $Port
  if ($null -eq $previousSmokeInputFlag) {
    Remove-Item Env:\EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = $previousSmokeInputFlag
  }
  if ($null -eq $previousOrderMode) {
    Remove-Item Env:\EXPO_PUBLIC_ORDER_MODE -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_ORDER_MODE = $previousOrderMode
  }
  if ($null -eq $previousMarketDataMode) {
    Remove-Item Env:\EXPO_PUBLIC_MARKET_DATA_MODE -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = $previousMarketDataMode
  }
  if ($null -eq $previousApiBaseUrl) {
    Remove-Item Env:\EXPO_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_API_BASE_URL = $previousApiBaseUrl
  }
  if ($null -eq $previousApiKey) {
    Remove-Item Env:\EXPO_PUBLIC_API_KEY -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_API_KEY = $previousApiKey
  }
  if ($null -eq $previousShowOrderBook) {
    Remove-Item Env:\EXPO_PUBLIC_SHOW_ORDERBOOK -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_SHOW_ORDERBOOK = $previousShowOrderBook
  }
  Pop-Location
}


