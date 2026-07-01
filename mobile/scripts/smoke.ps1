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
  [switch]$SearchQuery
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
    [int]$Attempts = 5,
    [int]$DelaySeconds = 4
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
  $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"
  $expoArgs = @("expo", "start", "--host", "localhost", "--port", "$Port")
  if ($OrderFailure -or $OpenOrderCancel -or $EventDetailTrade -or $SearchQuery) {
    $expoArgs += "--clear"
  }
  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList $expoArgs -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds $(if ($OrderFailure -or $OpenOrderCancel -or $EventDetailTrade -or $SearchQuery) { 18 } else { 8 })

  $launchUrl = if ($OrderFailure) {
    "exp://10.0.2.2:$Port/--/?forceOrderFailure=1"
  } elseif ($OpenOrderCancel) {
    "exp://10.0.2.2:$Port/--/?forceOpenOrder=1"
  } elseif ($SearchQuery) {
    "exp://10.0.2.2:$Port/--/?forceSearchQuery=zzzz"
  } else {
    "exp://10.0.2.2:$Port"
  }
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d $launchUrl | Out-Null
  Start-Sleep -Seconds 10

  $launchExpected = if ($OpenOrderCancel) {
    @("Holiwyn", "Portfolio", "Open orders", "Cancel")
  } elseif ($SearchQuery) {
    @("Holiwyn", "Search World Cup markets", "zzzz", "0 results")
  } else {
    @("Holiwyn", "World Cup", "Games", "Futures")
  }
  $homeHierarchy = Wait-HierarchyContains -Name "cycle-current-holiwyn-home.xml" -Expected $launchExpected -RestartUrl $launchUrl
  Save-Screenshot -Name "cycle-current-holiwyn-smoke.png"

  if ($Deep) {
    if ($SearchQuery) {
      Save-Screenshot -Name "cycle-current-holiwyn-search-query.png"
      $searchQueryHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-search-query.xml"
      Assert-HierarchyContains -Path $searchQueryHierarchy -Expected @("zzzz", "Results", "0 results", "No markets match your search.", "Clear")
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

    Invoke-TapHierarchyNode -Path $homeHierarchy -Identifier "event-card-mexico-ecuador"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-event-detail.png"
    $eventDetailHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail.xml"
    Assert-HierarchyContains -Path $eventDetailHierarchy -Expected @("Mexico vs. Ecuador", "Markets", "Game lines", "Props", "Total goals over 2.5")

    if ($EventDetailTrade) {
      Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-outcome-mexico-ecuador-winner-mexico"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-event-detail-ticket.png"
      $eventDetailTicketHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-event-detail-ticket.xml"
      Assert-HierarchyContains -Path $eventDetailTicketHierarchy -Expected @("Mexico", "Mexico vs. Ecuador", "Fake balance", "10,000 USDT", "Place mock order")
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
    Assert-HierarchyContains -Path $ticketHierarchy -Expected @("Fake balance", "10,000 USDT", "Max", "500 USDT", "1,000 USDT", "Estimated cost", "Estimated payout", "Place mock order")

    if ($OrderFailure) {
      Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "place-mock-order"
      Start-Sleep -Seconds 1
      Save-Screenshot -Name "cycle-current-holiwyn-ticket-order-error.png"
      $ticketOrderErrorHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-order-error.xml"
      Assert-HierarchyContains -Path $ticketOrderErrorHierarchy -Expected @("Order failed. Try again.", "Place mock order", "ticket-order-error")
      return
    }

    Invoke-TapHierarchyNode -Path $ticketHierarchy -Identifier "ticket-max-amount"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-ticket-max.png"
    $ticketMaxHierarchy = Save-UiHierarchy -Name "cycle-current-holiwyn-ticket-max.xml"
    Assert-HierarchyContains -Path $ticketMaxHierarchy -Expected @("10,000", "Estimated cost", "10,000 USDT")

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
  Pop-Location
}
