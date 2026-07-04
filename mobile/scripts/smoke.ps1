param(
  [string]$Device = "emulator-5554",
  [int]$Port = 8082,
  [string]$ExpoHost = "10.0.2.2",
  [string]$OutputDir = "docs\mobile\screenshots",
  [string]$BackendBaseUrl = "http://127.0.0.1:3000",
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
  [switch]$EventDetailFullPage,
  [switch]$EventDetailChart,
  [switch]$EmptyErrorLoading,
  [switch]$WholeAppNavDiscovery,
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
  [switch]$LivePortfolioBadgeDeep
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
$ResolvedHierarchyOutputDir = Join-Path $RepoRoot $HierarchyOutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $ResolvedHierarchyOutputDir | Out-Null

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
  & $adb -s $Device shell uiautomator dump $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
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
      Start-Sleep -Seconds 2
    }
    $path = Save-UiHierarchy -Name $Name
    try {
      Assert-HierarchyContains -Path $path -Expected $Expected
      return $path
    } catch {
      $hierarchy = Get-Content -Raw -Path $path
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

Push-Location $MobileRoot
try {
  npm run typecheck

  try {
    $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 4
    Write-Host "Backend health: $($health.status)"
  } catch {
    Write-Host "Backend health: unavailable, continuing with app mock fallback."
  }

  $adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if (-not (Test-Path $adb)) {
    throw "ADB not found at $adb"
  }

  Wait-AdbDevice
  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  if ($ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
    & $adb -s $Device reverse "tcp:3002" "tcp:3002" | Out-Null
  }
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null

  $expoLog = Join-Path $MobileRoot "mobile-smoke-expo.log"
  $expoErrorLog = Join-Path $MobileRoot "mobile-smoke-expo-error.log"
  $previousSmokeInputFlag = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
  $previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
  $previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
  $previousApiKey = $env:EXPO_PUBLIC_API_KEY
  $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"
  if ($ServerUnavailable -or $ServerOrderFailure -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionFallbackTrade -or $ServerPositionDetails -or $AccountProfileSyncError -or $EmptyErrorLoading) {
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    $env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:39999"
    $env:EXPO_PUBLIC_API_KEY = "pk_test_mobile_harness"
  }
  if ($ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory -or $ServerApiKeyDiagnostic -or $ServerPositionFallbackOrder -or $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
    if (-not $env:EXPO_PUBLIC_API_KEY) {
      $env:EXPO_PUBLIC_API_KEY = "pk_test_mobile_harness"
    }
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    if ($ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
      $env:EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:3002"
    } elseif (-not $env:EXPO_PUBLIC_API_BASE_URL) {
      $env:EXPO_PUBLIC_API_BASE_URL = "http://${ExpoHost}:3002"
    }
  }
  $expoArgs = @("expo", "start", "--port", "$Port", "--offline")
  if ($OrderFailure -or $OpenOrderCancel -or $OpenSellOrderCancel -or $EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailFullPage -or $EventDetailChart -or $EmptyErrorLoading -or $WholeAppNavDiscovery -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $SearchQuery -or $SearchClearQuery -or $ServerUnavailable -or $ServerOrderFailure -or $ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory -or $ServerApiKeyDiagnostic -or $ServerPortfolioFixture -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionFallbackTrade -or $ServerPositionFallbackOrder -or $ServerPositionDetails -or $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailFirstHalfOrderBook -or $SellTicket -or $Account -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $HomeFilter -or $HomeSaved -or $SavedPersistence -or $HomeSavedEmpty -or $HomeSearchQuery -or $HomeClearSearch -or $HomeCardStats -or $FutureCardStats -or $FutureCatalogExpand -or $FutureListTrade -or $FutureListBuyNo -or $FutureListOrder -or $FutureListSell -or $FutureListClose -or $PortfolioPositionCount -or $PortfolioActivityCount -or $PortfolioClosedCount -or $PortfolioPersistence -or $SavedSearch -or $SearchCardStats -or $SearchSavedEmpty -or $EventDetailSave -or $SearchSort -or $LiveSummary -or $LiveDetail) {
    $expoArgs += "--clear"
  }
  if ($ServerLiveDetailTotalsOrderBook) {
    $expoArgs += "--clear"
  }
  if ($ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
    $expoArgs += "--clear"
  }
  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList $expoArgs -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Wait-ExpoReady -Port $Port
  Start-Sleep -Seconds $(if ($OrderFailure -or $OpenOrderCancel -or $OpenSellOrderCancel -or $EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailFullPage -or $EventDetailChart -or $EmptyErrorLoading -or $WholeAppNavDiscovery -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $SearchQuery -or $SearchClearQuery -or $ServerUnavailable -or $ServerOrderFailure -or $ServerOrderSuccess -or $ServerOrderFilled -or $ServerSellOrderFilled -or $ServerOpenOrderCancel -or $ServerFilledTradeHistory -or $ServerApiKeyDiagnostic -or $ServerPortfolioFixture -or $ServerCloseFixture -or $ServerPositionTrade -or $ServerPositionBuyTrade -or $ServerPositionFallbackTrade -or $ServerPositionFallbackOrder -or $ServerPositionDetails -or $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailFirstHalfOrderBook -or $SellTicket -or $Account -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $SavedPersistence -or $HomeSavedEmpty -or $HomeSearchQuery -or $HomeClearSearch -or $HomeCardStats -or $FutureCardStats -or $FutureCatalogExpand -or $FutureListTrade -or $FutureListBuyNo -or $FutureListOrder -or $FutureListSell -or $FutureListClose -or $PortfolioPositionCount -or $PortfolioActivityCount -or $PortfolioClosedCount -or $PortfolioPersistence -or $SavedSearch -or $SearchCardStats -or $SearchSavedEmpty -or $EventDetailSave -or $SearchSort -or $LiveSummary -or $LiveDetail -or $LiveTicket -or $LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) { 18 } else { 8 })
  if ($ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
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
  } elseif ($ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
    $encodedSlug = [uri]::EscapeDataString("world-cup-2026-curacao-vs-cote-divoire-2026-06-25")
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceBackendEventSlug=$encodedSlug"
  } elseif ($OpenSellOrderCancel) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceOpenOrder=1,forceOpenOrderSide=sell"
  } elseif ($OpenOrderCancel) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceOpenOrder=1"
  } elseif ($EventDetailSellDefault -or $EventDetailSellDefaultTrade) {
    "exp://${ExpoHost}:$Port/--/?forceMexicoEcuadorDetailSellDefault=1"
  } elseif ($EventDetailPosition) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceMexicoEcuadorGamePosition=1"
  } elseif ($EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailFullPage -or $EventDetailChart -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount) {
    "exp://${ExpoHost}:$Port/--/?forceMexicoEcuadorDetail=1"
  } elseif ($EmptyErrorLoading) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1,forcePortfolioSyncing=1"
  } elseif ($WholeAppNavDiscovery) {
    "exp://${ExpoHost}:$Port/--/?forceResetState=1"
  } elseif ($LiveDetail) {
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
  if ((-not $SkipPackageClear) -and ($EventDetailTrade -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailFullPage -or $EventDetailChart -or $EmptyErrorLoading -or $WholeAppNavDiscovery -or $EventDetailPosition -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $FutureListClose -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $SavedPersistence -or $PortfolioPersistence -or $HomeSavedEmpty -or $SearchSavedEmpty)) {
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
  } elseif ($EmptyErrorLoading) {
    @("Portfolio", "Syncing server portfolio", "No positions yet")
  } elseif ($WholeAppNavDiscovery) {
    @("Holiwyn", "World Cup", "Games", "Futures", "Mexico vs. Ecuador")
  } elseif ($ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
    @("Game Lines", "Player Props", "Best bid", "Best ask", "Spread")
  } elseif ($EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailFullPage -or $EventDetailChart -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade) {
    @("Mexico vs. Ecuador", "4 markets", "8 outcomes")
  } elseif ($LiveDetail) {
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
  $launchAttempts = if ($LiveOrder -or $LiveSellOrder -or $LiveOrderClose -or $LivePortfolioBadge -or $LivePortfolioBadgeDeep) { 14 } else { 8 }
  $homeHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-home.xml" -Expected $launchExpected -RestartUrl $launchUrl -Attempts $launchAttempts
  if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $homeHierarchy)) {
    $homeHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-home.xml" -Expected $launchExpected -RestartUrl $launchUrl -Attempts 4 -DelaySeconds 2
  }
  Save-Screenshot -Name "cycle-current-holiwyn-smoke.png"

  if ($Deep) {
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
      Assert-HierarchyContains -Path $serverFilledTradeHistoryHierarchy -Expected @("portfolio-screen", "latest-activity-card", "Bought", "World Cup Mobile Filled Trade Proof", "YES", "Filled shares 2.00", "Exec price 50%", "Implied odds 2.0x", "1 USDT")
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

    if (-not ($EventDetailTrade -or $EventDetailSummary -or $EventDetailChat -or $EventDetailActions -or $EventDetailMarketTabs -or $EventDetailLineAdjustment -or $EventDetailLinePortfolio -or $EventDetailOrderBook -or $EventDetailFullPage -or $EventDetailChart -or $EventDetailPosition -or $EventDetailProps -or $EventDetailPropTicket -or $EventDetailPropOrder -or $EventDetailPropClose -or $EventDetailMarketOutcomeCount -or $EventDetailSellDefault -or $EventDetailSellDefaultTrade -or $ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook)) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "event-card-mexico-ecuador"
      Start-Sleep -Seconds 1
    }
    Save-Screenshot -Name "cycle-current-holiwyn-event-detail.png"
    $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
    $eventDetailBaseExpected = if ($ServerLiveDetailOrderBook -or $ServerLiveDetailLineOrderBook -or $ServerLiveDetailTotalsOrderBook -or $ServerLiveDetailTeamTotalsOrderBook -or $ServerLiveDetailFirstHalfOrderBook) {
      @("Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Game Lines", "Player Props", "event-detail-live-data-inline", "live-data-status-", "live-data-source-")
    } elseif ($EventDetailPosition) {
      @("Mexico vs. Ecuador", "Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Your position")
    } else {
      @("Mexico vs. Ecuador", "Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Game Lines", "Player Props")
    }
    Assert-HierarchyContains -Path $eventDetailHierarchy -Expected $eventDetailBaseExpected

    if ($EventDetailChart) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-price-chart", "event-detail-chart-tooltip", "Target", "Current", "All", "Game", "Live")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-price-chart"
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
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-market-summary", "4 markets", "8 outcomes", "Game lines", "1 market", "Props", "3 markets", "Match winner")
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
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("event-detail-open-order-book", "Best bid", "Best ask", "Spread")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-server-live-order-book.png"
      $serverOrderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-live-order-book.xml"
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

    if ($EventDetailOrderBook) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Regulation Time Winner", "Best bid", "Best ask", "Spread", "event-detail-open-order-book")
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-open-order-book"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-order-book.png"
      $orderBookHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-order-book.xml"
      Assert-HierarchyContains -Path $orderBookHierarchy -Expected @("event-detail-order-book-screen", "orderbook-source", "orderbook-status", "event-detail-order-book-depth-state", "Order Book", "Mexico vs. Ecuador - Match winner", "Best bid", "Best ask", "Spread", "order-book-outcome-mexico", "Mexico", "64%", "1.6x", "0.61 USDT", "0.68 USDT", "1.28k shares", "900 shares", "Buy", "Sell")
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
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input swipe 540 520 540 1900 450 | Out-Null
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1800 540 1220 350 | Out-Null
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-portfolio-baseline.png"
      $linePortfolioBaselineHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-baseline.xml"
      if ((Dismiss-ExpoDeveloperMenuIfPresent -Path $linePortfolioBaselineHierarchy)) {
        Start-Sleep -Seconds 1
        $linePortfolioBaselineHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-baseline.xml"
      }
      Assert-HierarchyContains -Path $linePortfolioBaselineHierarchy -Expected @("Spread", "MEX to win by over 1.5 goals", "event-detail-spread-line-1-5", "Reg. Time")

      Invoke-TapHierarchyNode -Path $linePortfolioBaselineHierarchy -Identifier "event-detail-spread-line-2-5"
      Start-Sleep -Seconds 1
      $linePortfolioSpreadHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-spread-25.xml"
      Assert-HierarchyContains -Path $linePortfolioSpreadHierarchy -Expected @("MEX to win by over 2.5 goals", "Yes, MEX -2.5", "16%")
      Invoke-TapHierarchyNode -Path $linePortfolioSpreadHierarchy -Identifier "event-detail-spread-period-1st-half"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-portfolio-spread-25-1h.png"
      $linePortfolioSpreadChangedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-spread-25-1h.xml"
      Assert-HierarchyContains -Path $linePortfolioSpreadChangedHierarchy -Expected @("Yes, MEX -2.5", "33.3x", "3%", "No", "97%")

      Invoke-TapHierarchyNode -Path $linePortfolioSpreadChangedHierarchy -Identifier "event-detail-outcome-spread-spread-yes"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-line-portfolio-ticket.png"
      $linePortfolioTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-ticket.xml"
      Assert-HierarchyContains -Path $linePortfolioTicketHierarchy -Expected @("trade-ticket", "Mexico vs. Ecuador", "ticket-selection-line", "Yes - MEX -2.5 1H", "ticket-selected-outcome-choice", "ticket-preset-5", "Choose an amount")
      Invoke-TapHierarchyNode -Path $linePortfolioTicketHierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $linePortfolioTicketAmount2Hierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-ticket-amount-2.xml"
      Invoke-TapHierarchyNode -Path $linePortfolioTicketAmount2Hierarchy -Identifier "ticket-preset-10"
      Start-Sleep -Milliseconds 500
      $linePortfolioTicketAmount20Hierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-ticket-amount-20.xml"
      Invoke-TapHierarchyNode -Path $linePortfolioTicketAmount20Hierarchy -Identifier "ticket-preset-5"
      Start-Sleep -Seconds 1
      $linePortfolioTicketReadyHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-ticket-ready.xml"
      Assert-HierarchyContains -Path $linePortfolioTicketReadyHierarchy -Expected @('$25', 'To win $833.33', "ticket-price-line", "Swipe up to buy")
      Invoke-TapHierarchyNode -Path $linePortfolioTicketReadyHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-line-portfolio-after-order.png"
      $linePortfolioAfterOrderHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-after-order.xml"
      Assert-HierarchyContains -Path $linePortfolioAfterOrderHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "1", "Order placed", "MOCK - Buy - MEX -2.5 1H", "Mexico vs. Ecuador", "Mexico vs. Ecuador - MEX -2.5 1H", "Buy - Filled shares 833.33 - Exec price 3% - Implied odds 33.3x")
      $lineOpenOrderUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,forceLineOpenOrder=1"
      Start-DeepLink -Url $lineOpenOrderUrl
      Start-Sleep -Seconds 4
      Save-Screenshot -Name "cycle-current-holiwyn-line-portfolio-open-order.png"
      $linePortfolioOpenOrderHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-line-portfolio-open-order.xml"
      Assert-HierarchyContains -Path $linePortfolioOpenOrderHierarchy -Expected @("Portfolio", "Open orders", "Mexico vs. Ecuador", "Buy - MEX -2.5 1H - OPEN", "Limit", "3%", "Order value", "25 USDT", "Remaining:", "833.33 shares", "Potential payout")
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
  if ($expo -and -not $expo.HasExited) {
    Stop-Process -Id $expo.Id -Force
  }
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
  Pop-Location
}

