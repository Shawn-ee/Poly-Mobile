param(
  [string]$Device = "emulator-5554",
  [int]$Port = 8082,
  [string]$OutputDir = "docs\mobile\screenshots",
  [string]$BackendBaseUrl = "http://127.0.0.1:3000",
  [string]$HierarchyOutputDir = "docs\mobile\harness",
  [switch]$Deep,
  [switch]$OrderFailure,
  [switch]$OpenOrderCancel,
  [switch]$EventDetailTrade,
  [switch]$EventDetailSummary,
  [switch]$SearchQuery,
  [switch]$SearchClearQuery,
  [switch]$ServerUnavailable,
  [switch]$ServerOrderFailure,
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
  [switch]$FutureListTrade,
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
  [switch]$SearchSort
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
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $RestartUrl | Out-Null
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
        & $adb -s $Device shell am start -a android.intent.action.VIEW -d $RestartUrl | Out-Null
      }
      if ($attempt -eq $Attempts) {
        throw
      }
      Start-Sleep -Seconds $DelaySeconds
    }
  }
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

  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null

  $expoLog = Join-Path $MobileRoot "mobile-smoke-expo.log"
  $expoErrorLog = Join-Path $MobileRoot "mobile-smoke-expo-error.log"
  $previousSmokeInputFlag = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
  $previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
  $previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
  $previousApiKey = $env:EXPO_PUBLIC_API_KEY
  $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"
  if ($ServerUnavailable -or $ServerOrderFailure -or $AccountProfileSyncError) {
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    $env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:39999"
    $env:EXPO_PUBLIC_API_KEY = "pk_test_mobile_harness"
  }
  $expoArgs = @("expo", "start", "--host", "localhost", "--port", "$Port")
  if ($OrderFailure -or $OpenOrderCancel -or $EventDetailTrade -or $EventDetailSummary -or $SearchQuery -or $SearchClearQuery -or $ServerUnavailable -or $ServerOrderFailure -or $SellTicket -or $Account -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $HomeFilter -or $HomeSaved -or $SavedPersistence -or $HomeSavedEmpty -or $HomeSearchQuery -or $HomeClearSearch -or $HomeCardStats -or $FutureCardStats -or $FutureListTrade -or $FutureListOrder -or $FutureListSell -or $FutureListClose -or $PortfolioPositionCount -or $PortfolioActivityCount -or $PortfolioClosedCount -or $PortfolioPersistence -or $SavedSearch -or $SearchCardStats -or $SearchSavedEmpty -or $EventDetailSave -or $SearchSort) {
    $expoArgs += "--clear"
  }
  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList $expoArgs -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds $(if ($OrderFailure -or $OpenOrderCancel -or $EventDetailTrade -or $EventDetailSummary -or $SearchQuery -or $SearchClearQuery -or $ServerUnavailable -or $ServerOrderFailure -or $SellTicket -or $Account -or $AccountLogin -or $AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $HomeFilter -or $HomeSaved -or $SavedPersistence -or $HomeSavedEmpty -or $HomeSearchQuery -or $HomeClearSearch -or $HomeCardStats -or $FutureCardStats -or $FutureListTrade -or $FutureListOrder -or $FutureListSell -or $FutureListClose -or $PortfolioPositionCount -or $PortfolioActivityCount -or $PortfolioClosedCount -or $PortfolioPersistence -or $SavedSearch -or $SearchCardStats -or $SearchSavedEmpty -or $EventDetailSave -or $SearchSort) { 18 } else { 8 })

  $launchUrl = if ($OrderFailure) {
    "exp://10.0.2.2:$Port/--/?forceOrderFailure=1"
  } elseif ($ServerUnavailable) {
    "exp://10.0.2.2:$Port/--/?forceOpenOrder=1"
  } elseif ($OpenOrderCancel) {
    "exp://10.0.2.2:$Port/--/?forceOpenOrder=1"
  } elseif ($EventDetailSummary) {
    "exp://10.0.2.2:$Port/--/?forceMexicoEcuadorDetail=1"
  } elseif ($SearchQuery -or $SearchClearQuery) {
    "exp://10.0.2.2:$Port/--/?forceSearchQuery=zzzz"
  } elseif ($HomeSearchQuery -or $HomeClearSearch) {
    "exp://10.0.2.2:$Port/--/?forceHomeQuery=clean"
  } elseif ($AccountPersistence) {
    "exp://10.0.2.2:$Port/--/?forceAccountSignIn=1"
  } elseif ($AccountPreferences -or $AccountLanguageSummary) {
    "exp://10.0.2.2:$Port/--/?forceAccountPreferences=1"
  } elseif ($AccountProfileSyncError) {
    "exp://10.0.2.2:$Port/--/?forceAccount=1"
  } elseif ($AccountSavedSummary) {
    "exp://10.0.2.2:$Port/--/?forceAccountSavedSummary=1"
  } elseif ($AccountPositionSummary -or $AccountPortfolioValue) {
    "exp://10.0.2.2:$Port/--/?forceAccountPositionSummary=1"
  } elseif ($LanguagePersistence) {
    "exp://10.0.2.2:$Port/--/?forceChinese=1"
  } elseif ($PortfolioPersistence) {
    "exp://10.0.2.2:$Port/--/?forceWorldCupWinnerFranceTicket=1"
  } elseif ($TicketDefaultsPersistence) {
    "exp://10.0.2.2:$Port/--/?forceTicketDefaults=1"
  } elseif ($Account -or $AccountLogin) {
    "exp://10.0.2.2:$Port/--/?forceAccount=1"
  } elseif ($SavedPersistence) {
    "exp://10.0.2.2:$Port/--/?forceSaveMexico=1"
  } elseif ($HomeSavedEmpty -or $SearchSavedEmpty) {
    "exp://10.0.2.2:$Port/--/?forceClearSaved=1"
  } else {
    "exp://10.0.2.2:$Port"
  }
  if ($AccountPersistence -or $AccountPreferences -or $AccountLanguageSummary -or $AccountProfileSyncError -or $AccountSavedSummary -or $AccountPositionSummary -or $AccountPortfolioValue -or $LanguagePersistence -or $TicketDefaultsPersistence -or $SavedPersistence -or $PortfolioPersistence -or $HomeSavedEmpty -or $SearchSavedEmpty) {
    & $adb -s $Device shell pm clear host.exp.exponent | Out-Null
    Start-Sleep -Seconds 2
  }
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d $launchUrl | Out-Null
  Start-Sleep -Seconds 10

  $launchExpected = if ($ServerUnavailable) {
    @("Holiwyn", "Portfolio", "Server sync unavailable", "Showing local fake-token portfolio.")
  } elseif ($OpenOrderCancel) {
    @("Holiwyn", "Portfolio", "Open orders", "Cancel")
  } elseif ($EventDetailSummary) {
    @("Mexico vs. Ecuador", "4 markets", "8 outcomes")
  } elseif ($SearchQuery -or $SearchClearQuery) {
    @("Holiwyn", "Search World Cup markets", "zzzz", "0 results")
  } elseif ($HomeSearchQuery -or $HomeClearSearch) {
    @("Holiwyn", "Search World Cup markets", "clean", "Games")
  } elseif ($AccountPersistence) {
    @("Holiwyn", "Account", "Signed in", "Demo balance")
  } elseif ($AccountPreferences -or $AccountLanguageSummary) {
    @("Holiwyn", "Account", "Preferences", "Ticket default", "Sell 500 USDT")
  } elseif ($AccountProfileSyncError) {
    @("Holiwyn", "Account", "Preferences", "Profile sync unavailable", "Using local preferences on this device.")
  } elseif ($AccountSavedSummary) {
    @("Holiwyn", "Account", "Preferences", "Saved markets", "1 saved")
  } elseif ($AccountPositionSummary) {
    @("Holiwyn", "Account", "Preferences", "Open positions: 1")
  } elseif ($AccountPortfolioValue) {
    @("Holiwyn", "Account", "Preferences", "Open positions: 1")
  } elseif ($LanguagePersistence) {
    @("Holiwyn", "EN")
  } elseif ($PortfolioPersistence) {
    @("World Cup winner", "France", "Place buy order")
  } elseif ($TicketDefaultsPersistence) {
    @("World Cup winner", "France", "500", "Place sell order")
  } elseif ($Account -or $AccountLogin) {
    @("Holiwyn", "Account", "Signed out", "Demo balance")
  } else {
    @("Holiwyn", "World Cup", "Games", "Futures")
  }
  $homeHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-home.xml" -Expected $launchExpected -RestartUrl $launchUrl
  Save-Screenshot -Name "cycle-current-holiwyn-smoke.png"

  if ($Deep) {
    if ($ServerUnavailable) {
      Save-Screenshot -Name "cycle-current-holiwyn-server-unavailable.png"
      $serverUnavailableHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-unavailable.xml"
      Assert-HierarchyContains -Path $serverUnavailableHierarchy -Expected @("Server sync unavailable", "Showing local fake-token portfolio.", "Open orders", "Cancel")
      return
    }

    if ($ServerOrderFailure) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "featured-future-france"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-ticket.png"
      $serverTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-order-ticket.xml"
      Assert-HierarchyContains -Path $serverTicketHierarchy -Expected @("Fake balance", "10,000 USDT", "Estimated cost", "Est. shares", "Avg price", "Place buy order")
      Invoke-TapHierarchyNode -Path $serverTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-server-order-error.png"
      $serverOrderErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-server-order-error.xml"
      Assert-HierarchyContains -Path $serverOrderErrorHierarchy -Expected @("Order failed. Try again.", "ticket-order-error", "Place buy order")
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
        $accountPersistenceRestartUrl = "exp://10.0.2.2:$Port/--/?forceAccount=1"
        & $adb -s $Device shell am start -a android.intent.action.VIEW -d $accountPersistenceRestartUrl | Out-Null
        Start-Sleep -Seconds 10
        Save-Screenshot -Name "cycle-current-holiwyn-account-persistence-restored.png"
        $accountPersistenceRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-persistence-restored.xml"
        Assert-HierarchyContains -Path $accountPersistenceRestoredHierarchy -Expected @("Signed in", "Holiwyn Demo", "Demo", "Mock login active.", "Sign out")
        return
      }
      Assert-HierarchyContains -Path $accountHierarchy -Expected @("Account", "Signed out", "Demo balance", "10,000 USDT", "Continue with phone", "Continue with email", "Mock login ready.", "Preferences")
      if ($AccountLogin) {
        Invoke-TapHierarchyNode -Path $accountHierarchy -Identifier "account-login-phone"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-account-signed-in.png"
        $signedInHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-signed-in.xml"
        Assert-HierarchyContains -Path $signedInHierarchy -Expected @("Signed in", "Holiwyn Demo", "Demo", "Mock login active.", "Sign out")
        Invoke-TapHierarchyNode -Path $signedInHierarchy -Identifier "account-sign-out"
        Start-Sleep -Seconds 1
        Save-Screenshot -Name "cycle-current-holiwyn-account-signed-out.png"
        $signedOutHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-signed-out.xml"
        Assert-HierarchyContains -Path $signedOutHierarchy -Expected @("Signed out", "Continue with phone", "Continue with email", "Mock login ready.")
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
      $languageRestartUrl = "exp://10.0.2.2:$Port"
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $languageRestartUrl | Out-Null
      Start-Sleep -Seconds 10
      Save-Screenshot -Name "cycle-current-holiwyn-language-persistence-restored.png"
      $languageRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-language-persistence-restored.xml"
      Assert-HierarchyContains -Path $languageRestoredHierarchy -Expected @("Holiwyn", "EN")
      return
    }

    if ($AccountPreferences) {
      Save-Screenshot -Name "cycle-current-holiwyn-account-preferences.png"
      $accountPreferencesHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-preferences.xml"
      Assert-HierarchyContains -Path $accountPreferencesHierarchy -Expected @("Account", "Preferences", "Ticket default", "Sell 500 USDT", "Fake-token mode only")
      return
    }

    if ($AccountProfileSyncError) {
      Save-Screenshot -Name "cycle-current-holiwyn-account-profile-sync-error.png"
      $accountProfileSyncHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-profile-sync-error.xml"
      Assert-HierarchyContains -Path $accountProfileSyncHierarchy -Expected @("Account", "Preferences", "Profile sync unavailable", "Using local preferences on this device.", "Fake-token mode only")
      return
    }

    if ($AccountSavedSummary) {
      Save-Screenshot -Name "cycle-current-holiwyn-account-saved-summary.png"
      $accountSavedSummaryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-saved-summary.xml"
      Assert-HierarchyContains -Path $accountSavedSummaryHierarchy -Expected @("Account", "Preferences", "Language: English", "Saved markets: 1 saved", "Ticket default: Buy 100 USDT")
      return
    }

    if ($AccountPositionSummary) {
      Save-Screenshot -Name "cycle-current-holiwyn-account-position-summary.png"
      $accountPositionSummaryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-account-position-summary.xml"
      Assert-HierarchyContains -Path $accountPositionSummaryHierarchy -Expected @("Account", "Preferences", "Open positions: 1", "Ticket default: Buy 100 USDT")
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
      Assert-HierarchyContains -Path $homeLiveHierarchy -Expected @("Live", "France vs. Argentina", "Games")
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
      $savedPersistenceRestartUrl = "exp://10.0.2.2:$Port/--/?forceSearch=1"
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
      Assert-HierarchyContains -Path $futureCardStatsHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "USDT", "France", "Argentina", "Spain")
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
      Assert-HierarchyContains -Path $futureListTicketHierarchy -Expected @("World Cup winner", "France", "Fake balance", "10,000 USDT", "Est. shares", "Avg price", "Place buy order")
      return
    }

    if ($FutureListOrder) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $futureListOrderListHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-list.xml"
      Assert-HierarchyContains -Path $futureListOrderListHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "France")
      Invoke-TapHierarchyNode -Path $futureListOrderListHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      $futureListOrderTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-ticket.xml"
      Assert-HierarchyContains -Path $futureListOrderTicketHierarchy -Expected @("World Cup winner", "France", "Fake balance", "10,000 USDT", "Place buy order")
      Invoke-TapHierarchyNode -Path $futureListOrderTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-order-portfolio.png"
      $futureListOrderPortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-order-portfolio.xml"
      Assert-HierarchyContains -Path $futureListOrderPortfolioHierarchy -Expected @("Portfolio", "Order placed", "World Cup winner", "France", "Invested", "Entry", "Current value", "Est. P/L")
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
      Assert-HierarchyContains -Path $futureListSellTicketHierarchy -Expected @("World Cup winner", "France", "Buy", "Sell", "Place buy order")
      Invoke-TapHierarchyNode -Path $futureListSellTicketHierarchy -Identifier "ticket-side-sell"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-sell-ticket.png"
      $futureListSellActiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-sell-active.xml"
      Assert-HierarchyContains -Path $futureListSellActiveHierarchy -Expected @("World Cup winner", "France", "Sell", "Estimated proceeds", "Est. shares", "Avg price", "Place sell order")
      return
    }

    if ($FutureListClose) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "world-cup-futures-tab"
      Start-Sleep -Seconds 1
      & $adb -s $Device shell input swipe 540 1480 540 1040 300 | Out-Null
      Start-Sleep -Seconds 1
      $futureListCloseListHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-close-list.xml"
      Assert-HierarchyContains -Path $futureListCloseListHierarchy -Expected @("World Cup winner", "Volume", "Liquidity", "France")
      Invoke-TapHierarchyNode -Path $futureListCloseListHierarchy -Identifier "future-outcome-world-cup-winner-france"
      Start-Sleep -Seconds 1
      $futureListCloseTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-close-ticket.xml"
      Assert-HierarchyContains -Path $futureListCloseTicketHierarchy -Expected @("World Cup winner", "France", "Fake balance", "10,000 USDT", "Place buy order")
      Invoke-TapHierarchyNode -Path $futureListCloseTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      $futureListClosePortfolioHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-close-portfolio.xml"
      Assert-HierarchyContains -Path $futureListClosePortfolioHierarchy -Expected @("Portfolio", "World Cup winner", "France", "Close position", "Order placed")
      Invoke-TapHierarchyNode -Path $futureListClosePortfolioHierarchy -Identifier "close-position-" -StartsWith
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-future-list-close-closed.png"
      $futureListCloseClosedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-future-list-close-closed.xml"
      Assert-HierarchyContains -Path $futureListCloseClosedHierarchy -Expected @("Fake balance", "10,008.82 USDT", "No positions yet", "Recent activity", "Closed", "Bought", "World Cup winner")
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
      Assert-HierarchyContains -Path $portfolioPersistenceTicketHierarchy -Expected @("World Cup winner", "France", "Place buy order")
      Invoke-TapHierarchyNode -Path $portfolioPersistenceTicketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 2
      Save-Screenshot -Name "cycle-current-holiwyn-portfolio-persistence-open.png"
      $portfolioPersistenceOpenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-portfolio-persistence-open.xml"
      Assert-HierarchyContains -Path $portfolioPersistenceOpenHierarchy -Expected @("Portfolio", "Open positions", "Recent activity", "1", "World Cup winner", "France", "Order placed")
      Start-Sleep -Seconds 2
      & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
      Start-Sleep -Seconds 2
      $portfolioPersistenceRestartUrl = "exp://10.0.2.2:$Port/--/?forcePortfolio=1"
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
      Assert-HierarchyContains -Path $ticketDefaultsSeededHierarchy -Expected @("World Cup winner", "France", "500", "Place sell order")
      Start-Sleep -Seconds 2
      & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
      Start-Sleep -Seconds 2
      $ticketDefaultsRestartUrl = "exp://10.0.2.2:$Port/--/?forceWorldCupWinnerFranceTicket=1"
      & $adb -s $Device shell am start -a android.intent.action.VIEW -d $ticketDefaultsRestartUrl | Out-Null
      Start-Sleep -Seconds 10
      Save-Screenshot -Name "cycle-current-holiwyn-ticket-defaults-restored.png"
      $ticketDefaultsRestoredHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-defaults-restored.xml"
      Assert-HierarchyContains -Path $ticketDefaultsRestoredHierarchy -Expected @("World Cup winner", "France", "500", "Place sell order")
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
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "event-card-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-save-detail.png"
      $eventDetailSaveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-detail.xml"
      Assert-HierarchyContains -Path $eventDetailSaveHierarchy -Expected @("Mexico vs. Ecuador", "Volume", "Liquidity", "☆")
      Invoke-TapHierarchyNode -Path $eventDetailSaveHierarchy -Identifier "event-detail-save-mexico-ecuador"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-save-star.png"
      $eventDetailSavedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-star.xml"
      Assert-HierarchyContains -Path $eventDetailSavedHierarchy -Expected @("Mexico vs. Ecuador", "★")
      Invoke-TapHierarchyNode -Path $eventDetailSavedHierarchy -Identifier "event-detail-back"
      Start-Sleep -Seconds 1
      $eventDetailSaveHomeHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-home.xml"
      Invoke-TapHierarchyNode -Path $eventDetailSaveHomeHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $eventDetailSaveSearchHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-search.xml"
      Invoke-TapHierarchyNode -Path $eventDetailSaveSearchHierarchy -Identifier "search-filter-saved"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-save-search-saved.png"
      $eventDetailSaveSearchSavedHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-save-search-saved.xml"
      Assert-HierarchyContains -Path $eventDetailSaveSearchSavedHierarchy -Expected @("Saved", "Mexico vs. Ecuador", "1 result", "★")
      return
    }

    if ($SearchSort) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "holiwyn-search-tab"
      Start-Sleep -Seconds 1
      $searchSortScreenHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-sort-screen.xml"
      Assert-HierarchyContains -Path $searchSortScreenHierarchy -Expected @("Top results", "Popular", "Live first", "Mexico vs. Ecuador")
      Invoke-TapHierarchyNode -Path $searchSortScreenHierarchy -Identifier "search-sort-live"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-search-sort-live.png"
      $searchSortLiveHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-sort-live.xml"
      Assert-HierarchyContains -Path $searchSortLiveHierarchy -Expected @("Live first", "France vs. Argentina", "Live", "Volume", "Liquidity")
      return
    }

    if ($OpenOrderCancel) {
      Save-Screenshot -Name "cycle-current-holiwyn-open-order.png"
      $openOrderHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-open-order.xml"
      Assert-HierarchyContains -Path $openOrderHierarchy -Expected @("Open orders", "Mexico vs. Ecuador winner", "Remaining", "Cancel")
      Invoke-TapHierarchyNode -Path $openOrderHierarchy -Identifier "cancel-open-order-smoke-open-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-open-order-canceled.png"
      $openOrderCanceledHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-open-order-canceled.xml"
      Assert-HierarchyContains -Path $openOrderCanceledHierarchy -Expected @("Recent activity", "Canceled", "Mexico vs. Ecuador winner", "250 USDT")
      return
    }

    if (-not $EventDetailSummary) {
      Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "event-card-mexico-ecuador"
      Start-Sleep -Seconds 1
    }
    Save-Screenshot -Name "cycle-current-holiwyn-event-detail.png"
    $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
    Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Mexico vs. Ecuador", "Volume", "Liquidity", "Traders", "Best bid", "Best ask", "Spread", "Markets", "Game lines", "Props")

    if ($EventDetailSummary) {
      Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("4 markets", "8 outcomes", "Match winner")
      return
    }

    if ($EventDetailTrade) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-outcome-mexico-ecuador-winner-mexico"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-ticket.png"
      $eventDetailTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailTicketHierarchy -Expected @("Mexico", "Mexico vs. Ecuador", "Fake balance", "10,000 USDT", "Est. shares", "Avg price", "Place buy order")
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
    Assert-HierarchyContains -Path $ticketHierarchy -Expected @("Fake balance", "10,000 USDT", "Max", "500 USDT", "1,000 USDT", "Estimated cost", "Est. shares", "Avg price", "Estimated payout", "Place buy order")

    if ($SellTicket) {
      Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "ticket-side-sell"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-sell-ticket.png"
      $sellTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-sell-ticket.xml"
      Assert-HierarchyContains -Path $sellTicketHierarchy -Expected @("Sell", "Estimated proceeds", "Est. shares", "Avg price", "Place sell order")
      return
    }

    if ($OrderFailure) {
      Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-ticket-order-error.png"
      $ticketOrderErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-order-error.xml"
      Assert-HierarchyContains -Path $ticketOrderErrorHierarchy -Expected @("Order failed. Try again.", "Place buy order", "ticket-order-error")
      return
    }

    Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "ticket-max-amount"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-ticket-max.png"
    $ticketMaxHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-max.xml"
    Assert-HierarchyContains -Path $ticketMaxHierarchy -Expected @("10,000", "Estimated cost", "Est. shares", "Avg price", "10,000 USDT")

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
    Assert-HierarchyContainsAny -Path $liveHierarchy -ExpectedAny @("No live markets right now.", "Live ·")

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
