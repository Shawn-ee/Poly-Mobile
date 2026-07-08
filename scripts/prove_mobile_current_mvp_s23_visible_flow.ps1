param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8289,
  [string]$ExpoHost = "172.16.200.14",
  [string]$MobileApiBaseUrl = "http://172.16.200.14:3002",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$EventSlug = "argentina-vs-egypt",
  [string]$Cycle = "MB",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-MB-current-mvp-s23-visible-flow",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-MB-current-mvp-s23-visible-flow",
  [string]$CashoutBidPrice = "0.60",
  [switch]$SeedCounterparty,
  [switch]$ExpectFilledHistory,
  [switch]$ExpectOpenOrder,
  [switch]$ExpectCancel,
  [switch]$ExpectCashout,
  [switch]$ExpectLiveEmptyOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$mobileRoot = Join-Path $repoRoot "mobile"
$resolvedOutputDir = Join-Path $repoRoot $OutputDir
$resolvedHierarchyOutputDir = Join-Path $repoRoot $HierarchyOutputDir
$expoOut = Join-Path $repoRoot ".runtime\mobile-current-mvp-s23-expo.out.log"
$expoErr = Join-Path $repoRoot ".runtime\mobile-current-mvp-s23-expo.err.log"
$adb = "adb"

if (($ExpectOpenOrder -and $ExpectFilledHistory) -or ($ExpectCancel -and $ExpectFilledHistory)) {
  throw "Choose open-order/cancel proof or filled-history/cashout proof, not both."
}
if ($ExpectCashout -and (-not $ExpectFilledHistory)) {
  throw "Cashout proof requires -ExpectFilledHistory so a filled position exists first."
}

$expectOpenOrderState = [bool]$ExpectOpenOrder -or [bool]$ExpectCancel

New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $resolvedHierarchyOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $expoOut) | Out-Null

function Assert-Contains {
  param([string]$Path, [string[]]$Expected)
  $raw = Get-Content -Raw -Path $Path
  foreach ($item in $Expected) {
    if ($raw -notmatch [regex]::Escape($item)) {
      throw "Missing expected UI text/label '$item' in $Path"
    }
  }
}

function Assert-NotContains {
  param([string]$Path, [string[]]$Unexpected)
  $raw = Get-Content -Raw -Path $Path
  foreach ($item in $Unexpected) {
    if ($raw -match [regex]::Escape($item)) {
      throw "Unexpected UI text/label '$item' in $Path"
    }
  }
}

function Save-Screenshot {
  param([string]$Name)
  $remote = "/sdcard/$Name"
  $local = Join-Path $resolvedOutputDir $Name
  & $adb -s $Device shell screencap -p $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  return $local
}

function Save-Hierarchy {
  param([string]$Name)
  $remote = "/sdcard/window-hierarchy.xml"
  $local = Join-Path $resolvedHierarchyOutputDir $Name
  & $adb -s $Device shell uiautomator dump $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  if ((-not (Test-Path $local)) -or ((Get-Item $local).Length -eq 0)) {
    throw "UI hierarchy dump was empty: $local"
  }
  return $local
}

function Invoke-TapNode {
  param(
    [string]$Path,
    [string]$Identifier,
    [switch]$StartsWith,
    [double]$XRatio = 0.5,
    [double]$YRatio = 0.5
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $query = if ($StartsWith) {
    "//*[starts-with(@resource-id,'$Identifier') or starts-with(@content-desc,'$Identifier')]"
  } else {
    "//*[@resource-id='$Identifier' or @content-desc='$Identifier']"
  }
  $node = $hierarchy.SelectSingleNode($query)
  if (-not $node) {
    throw "Missing tappable node '$Identifier' in $Path"
  }
  if ($node.bounds -notmatch "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
    throw "Invalid bounds for '$Identifier': $($node.bounds)"
  }
  $left = [int]$Matches[1]
  $top = [int]$Matches[2]
  $right = [int]$Matches[3]
  $bottom = [int]$Matches[4]
  $x = [math]::Floor($left + (($right - $left) * $XRatio))
  $y = [math]::Floor($top + (($bottom - $top) * $YRatio))
  & $adb -s $Device shell input tap $x $y | Out-Null
}

function Dismiss-ExpoDeveloperMenu {
  param([string]$NamePrefix)

  $xmlPath = Save-Hierarchy -Name "$NamePrefix-preflight.xml"
  $raw = Get-Content -Raw -Path $xmlPath
  if ($raw -notmatch [regex]::Escape("This is the developer menu") -and $raw -notmatch [regex]::Escape("SDK version")) {
    return $xmlPath
  }

  & $adb -s $Device shell input tap 1000 1300 | Out-Null
  Start-Sleep -Seconds 2
  $xmlPath = Save-Hierarchy -Name "$NamePrefix-preflight-after-close.xml"
  $raw = Get-Content -Raw -Path $xmlPath
  if ($raw -notmatch [regex]::Escape("This is the developer menu") -and $raw -notmatch [regex]::Escape("SDK version")) {
    return $xmlPath
  }

  & $adb -s $Device shell input tap 540 2040 | Out-Null
  Start-Sleep -Seconds 3
  $xmlPath = Save-Hierarchy -Name "$NamePrefix-preflight-after-continue.xml"
  $raw = Get-Content -Raw -Path $xmlPath
  if ($raw -notmatch [regex]::Escape("This is the developer menu") -and $raw -notmatch [regex]::Escape("SDK version")) {
    return $xmlPath
  }

  & $adb -s $Device shell input keyevent 4 | Out-Null
  Start-Sleep -Seconds 2
  return Save-Hierarchy -Name "$NamePrefix-preflight-after-back.xml"
}

function Wait-ExpoReady {
  param([int]$TargetPort)
  for ($attempt = 1; $attempt -le 60; $attempt++) {
    try {
      $status = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$TargetPort/status" -TimeoutSec 2
      if ($status.StatusCode -eq 200) {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  throw "Expo did not become ready on port $TargetPort"
}

function Get-JsonField {
  param([string]$Raw, [string]$Name)
  $match = [regex]::Match($Raw, '"' + [regex]::Escape($Name) + '"\s*:\s*"([^"]+)"')
  if (-not $match.Success) {
    throw "Could not read JSON field '$Name' from credential output."
  }
  return $match.Groups[1].Value
}

function Start-Link {
  param([string]$Url)
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d "'$Url'" | Out-Null
}

function Write-JsonNoBom {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Value,
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [int]$Depth = 6
  )
  $json = $Value | ConvertTo-Json -Depth $Depth
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath (Split-Path -Parent $Path)).Path + "\" + (Split-Path -Leaf $Path), ($json -replace "`r`n", "`n") + "`n", $utf8NoBom)
}

Push-Location $repoRoot
$previousEnv = @{
  MOBILE_DEV_USERNAME = $env:MOBILE_DEV_USERNAME
  EXPO_PUBLIC_API_KEY = $env:EXPO_PUBLIC_API_KEY
  EXPO_PUBLIC_API_BASE_URL = $env:EXPO_PUBLIC_API_BASE_URL
  EXPO_PUBLIC_MARKET_DATA_MODE = $env:EXPO_PUBLIC_MARKET_DATA_MODE
  EXPO_PUBLIC_ORDER_MODE = $env:EXPO_PUBLIC_ORDER_MODE
  EXPO_PUBLIC_SHOW_ORDERBOOK = $env:EXPO_PUBLIC_SHOW_ORDERBOOK
  EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
}
$expo = $null
try {
  $deviceInfo = (& $adb -s $Device shell getprop ro.product.model).Trim()
  if (-not $deviceInfo) {
    throw "Target Android device is not reachable: $Device"
  }

  $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 5
  if ($health.status -ne "ok") {
    throw "Backend health is not ok."
  }

  $counterpartyProofPath = Join-Path $HierarchyOutputDir "cycle-$Cycle-current-mvp-counterparty.json"
  if ($SeedCounterparty) {
    cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts "--eventSlug=$EventSlug" "--marketGroupKey=spread" "--line=1.5" "--outcomeSide=away" "--askPrice=0.52" "--askSize=80" "--cleanupProofBids" "--proofUserPrefix=holiwyn-mobile-" "--output=$counterpartyProofPath" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Counterparty seed failed for $EventSlug."
    }
  }

  $env:MOBILE_DEV_USERNAME = "holiwyn-mobile-$($Cycle.ToLower())-s23-$(Get-Date -Format yyyyMMddHHmmss)"
  $credentialRaw = cmd /c npm.cmd run mobile:dev-credential 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "Mobile dev credential creation failed."
  }
  $apiKey = Get-JsonField -Raw $credentialRaw -Name "token"
  $keyId = Get-JsonField -Raw $credentialRaw -Name "keyId"

  $env:EXPO_PUBLIC_API_KEY = $apiKey
  $env:EXPO_PUBLIC_API_BASE_URL = $MobileApiBaseUrl
  $env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"
  $env:EXPO_PUBLIC_ORDER_MODE = "server"
  $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"
  Remove-Item Env:\EXPO_PUBLIC_SHOW_ORDERBOOK -ErrorAction SilentlyContinue

  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList @("expo", "start", "--port", "$Port", "--offline", "--clear") -WorkingDirectory $mobileRoot -RedirectStandardOutput $expoOut -RedirectStandardError $expoErr -WindowStyle Hidden -PassThru
  Wait-ExpoReady -TargetPort $Port
  Start-Sleep -Seconds 10

  & $adb -s $Device shell pm clear host.exp.exponent | Out-Null
  Start-Sleep -Seconds 2
  $encodedKey = [uri]::EscapeDataString($apiKey)
  Start-Link -Url "exp://${ExpoHost}:$Port/--/?forceResetState=1&apiKey=$encodedKey"
  Start-Sleep -Seconds 18
  Dismiss-ExpoDeveloperMenu -NamePrefix "cycle-$Cycle-current-mvp-home" | Out-Null

  Save-Screenshot -Name "cycle-$Cycle-current-mvp-home.png" | Out-Null
  $homeXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-home.xml"
  Assert-Contains -Path $homeXml -Expected @("Holiwyn", "World Cup", "Argentina vs. Egypt", "event-card-$EventSlug", "home-compact-retail-feed", "home-card-source-provider-winner-local-lines")
  if ($ExpectLiveEmptyOnly) {
    Assert-Contains -Path $homeXml -Expected @("Time TBD", "Active")
  }
  Assert-NotContains -Path $homeXml -Unexpected @("This is the developer menu", "SDK version")
  Assert-NotContains -Path $homeXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "Provider Breadth", "EL-A Provider Breadth", "mobile-el-a-provider-breadth")

  Invoke-TapNode -Path $homeXml -Identifier "holiwyn-live-tab"
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-current-mvp-live.png" | Out-Null
  $liveXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-live.xml"
  if ($ExpectLiveEmptyOnly) {
    Assert-Contains -Path $liveXml -Expected @("live-world-cup-games-focus", "No live markets right now.")
    Assert-NotContains -Path $liveXml -Unexpected @("event-card-$EventSlug", "Order Book", "event-detail-open-order-book", "Chat", "Provider Breadth", "EL-A Provider Breadth", "mobile-el-a-provider-breadth")

    Invoke-TapNode -Path $liveXml -Identifier "holiwyn-home-tab"
    Start-Sleep -Seconds 1
    $homeReturnXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-home-return.xml"
    Assert-Contains -Path $homeReturnXml -Expected @("event-card-$EventSlug", "home-card-source-provider-winner-local-lines")

    $summary = [ordered]@{
      cycle = $Cycle
      result = "pass"
      generatedAt = (Get-Date).ToUniversalTime().ToString("o")
      device = $Device
      model = $deviceInfo
      backendBaseUrl = $BackendBaseUrl
      mobileApiBaseUrl = $MobileApiBaseUrl
      expoPort = $Port
      keyId = "redacted"
      apiKey = "redacted"
      eventSlug = $EventSlug
      assertions = [ordered]@{
        homeShowsCurrentMatch = $true
        homeLabelsStaleMatchAsActive = $true
        liveRouteHidesStaleMatch = $true
        liveShowsEmptyState = $true
        homeStillShowsProviderWinnerLocalLinesDisclosure = $true
        orderbookHidden = $true
      }
      artifacts = [System.Collections.Generic.List[string]]@(
        "$OutputDir\cycle-$Cycle-current-mvp-home.png",
        "$HierarchyOutputDir\cycle-$Cycle-current-mvp-home.xml",
        "$OutputDir\cycle-$Cycle-current-mvp-live.png",
        "$HierarchyOutputDir\cycle-$Cycle-current-mvp-live.xml",
        "$HierarchyOutputDir\cycle-$Cycle-current-mvp-home-return.xml"
      )
    }
    $summaryPath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-current-mvp-s23-visible-flow.json"
    Write-JsonNoBom -Value $summary -Path $summaryPath -Depth 6
    Write-Host "Proof summary: $summaryPath"
    return
  }
  Assert-Contains -Path $liveXml -Expected @("live-world-cup-games-focus", "live-source-readiness", "home-card-source-provider-winner-local-lines", "event-card-$EventSlug")
  Assert-NotContains -Path $liveXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "Provider Breadth", "EL-A Provider Breadth", "mobile-el-a-provider-breadth")

  Invoke-TapNode -Path $liveXml -Identifier "holiwyn-home-tab"
  Start-Sleep -Seconds 1
  $homeXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-home-return.xml"
  Assert-Contains -Path $homeXml -Expected @("event-card-$EventSlug", "home-card-source-provider-winner-local-lines")

  Invoke-TapNode -Path $homeXml -Identifier "event-card-$EventSlug" -StartsWith -YRatio 0.28
  Start-Sleep -Seconds 5
  Save-Screenshot -Name "cycle-$Cycle-current-mvp-detail-top.png" | Out-Null
  $detailTopXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-detail-top.xml"
  $detailTopRaw = Get-Content -Raw -Path $detailTopXml
  if ($detailTopRaw -notmatch [regex]::Escape("event-detail-back")) {
    & $adb -s $Device shell input tap 540 900 | Out-Null
    Start-Sleep -Seconds 4
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-detail-top-retry.png" | Out-Null
    $detailTopXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-detail-top-retry.xml"
  }
  Assert-Contains -Path $detailTopXml -Expected @("event-detail-back", "Game", "ARG", "EGY", "Argentina", "Egypt")
  Assert-NotContains -Path $detailTopXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "event-detail-chat")

  $lineXml = $null
  for ($attempt = 1; $attempt -le 5; $attempt++) {
    & $adb -s $Device shell input swipe 540 2100 540 760 450 | Out-Null
    Start-Sleep -Seconds 1
    $candidate = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-lines-attempt-$attempt.xml"
    $candidateRaw = Get-Content -Raw -Path $candidate
    if (
      $candidateRaw -match [regex]::Escape("selection-market-type-spread") -and
      $candidateRaw -match [regex]::Escape("selection-line-1.5") -and
      $candidateRaw -match [regex]::Escape("provider-source-contract-fixture") -and
      $candidateRaw -match [regex]::Escape("line-market-local-test-pricing")
    ) {
      $lineXml = $candidate
      break
    }
  }
  if (-not $lineXml) {
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-lines-failed.png" | Out-Null
    throw "Could not find current MVP spread line market on S23."
  }
  & $adb -s $Device shell input swipe 540 920 540 1450 320 | Out-Null
  Start-Sleep -Seconds 1
  $lineXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-lines-settled.xml"
  Save-Screenshot -Name "cycle-$Cycle-current-mvp-lines.png" | Out-Null
  Assert-Contains -Path $lineXml -Expected @("Spread", "Totals", "Local test pricing", "line-market-local-test-pricing", "event-detail-line-section-clearance-24", "event-detail-line-source-banner", "line-source-contract-fixture", "line-family-readiness-spread-contract-fixture", "line-family-readiness-total-contract-fixture", "line-family-readiness-team_total-contract-fixture", "selection-market-type-spread", "selection-line-1.5", "provider-source-contract-fixture")
  Assert-NotContains -Path $lineXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Invoke-TapNode -Path $lineXml -Identifier "event-detail-outcome-spread-" -StartsWith
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-current-mvp-ticket.png" | Out-Null
  $ticketXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-ticket.xml"
  Assert-Contains -Path $ticketXml -Expected @("trade-ticket", "Choose an amount", "ticket-preset-25", "ticket-market-type-spread", "ticket-line-1.5", "provider-source-contract-fixture", "ticket-local-test-pricing")
  Assert-NotContains -Path $ticketXml -Unexpected @("Order Book", "Chat")

  Invoke-TapNode -Path $ticketXml -Identifier "ticket-preset-25"
  Start-Sleep -Milliseconds 800
  Save-Screenshot -Name "cycle-$Cycle-current-mvp-ticket-ready.png" | Out-Null
  $ticketReadyXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-ticket-ready.xml"
  Assert-Contains -Path $ticketReadyXml -Expected @('$25', "Swipe to buy", "place-mock-order", "ticket-line-1.5", "provider-source-contract-fixture", "ticket-local-test-pricing")

  & $adb -s $Device shell input swipe 540 2070 540 1000 4000 | Out-Null
  Start-Sleep -Seconds 7
  Save-Screenshot -Name "cycle-$Cycle-current-mvp-after-submit.png" | Out-Null
  $afterSubmitXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-after-submit.xml"
  Assert-Contains -Path $afterSubmitXml -Expected @("Portfolio", "portfolio-market-type-spread", "portfolio-line-1.5", "portfolio-provider-source-contract-fixture", "portfolio-local-test-pricing")
  if ($expectOpenOrderState) {
    Assert-Contains -Path $afterSubmitXml -Expected @("portfolio-tab-orders", "open-order-row-", "open-order-source-badge", "open-order-source-note", "portfolio-source-badge-local", "cancel-open-order-")
  }
  Assert-NotContains -Path $afterSubmitXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  $historyXml = $null
  $cancelHistoryXml = $null
  $cashoutCounterpartyProofPath = $null
  $cashoutTicketXml = $null
  $cashoutHistoryXml = $null
  if ($ExpectCancel) {
    Invoke-TapNode -Path $afterSubmitXml -Identifier "cancel-open-order-" -StartsWith
    Start-Sleep -Seconds 5
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-after-cancel.png" | Out-Null
    $afterCancelXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-after-cancel.xml"
    Assert-Contains -Path $afterCancelXml -Expected @("Portfolio", "portfolio-tab-orders", "No open orders")
    Invoke-TapNode -Path $afterCancelXml -Identifier "portfolio-tab-history"
    Start-Sleep -Seconds 2
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-canceled-history.png" | Out-Null
    $cancelHistoryXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-canceled-history.xml"
    Assert-Contains -Path $cancelHistoryXml -Expected @("Portfolio", "portfolio-tab-history", "activity-row-", "Canceled", "portfolio-history-market-context-readable", "portfolio-market-type-spread", "portfolio-line-1.5", "portfolio-provider-source-contract-fixture", "portfolio-local-test-pricing")
  } elseif ($ExpectCashout) {
    Assert-Contains -Path $afterSubmitXml -Expected @("position-card-", "portfolio-position-cash-out-", "portfolio-position-source-badge")
    $cashoutCounterpartyProofPath = Join-Path $HierarchyOutputDir "cycle-$Cycle-current-mvp-line-cashout-counterparty.json"
    $cashoutCounterpartyProofAbsolutePath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-current-mvp-line-cashout-counterparty.json"
    cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts "--eventSlug=$EventSlug" "--marketGroupKey=spread" "--line=1.5" "--outcomeSide=away" "--makerSide=BUY" "--bidPrice=$CashoutBidPrice" "--bidSize=80" "--cleanupBlockingMarketBids" "--cleanupProofAsks" "--cleanupBlockingAsks" "--proofUserPrefix=holiwyn-mobile-" "--output=$cashoutCounterpartyProofAbsolutePath" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Line cashout counterparty seed failed for $EventSlug."
    }
    Invoke-TapNode -Path $afterSubmitXml -Identifier "portfolio-position-cash-out-" -StartsWith
    Start-Sleep -Seconds 2
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-line-cashout-ticket.png" | Out-Null
    $cashoutTicketXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-line-cashout-ticket.xml"
    Assert-Contains -Path $cashoutTicketXml -Expected @("cashout-ticket", "cashout-full-position", "cashout-current-price", "cashout-estimated-proceeds", "swipe-to-cashout")
    Assert-NotContains -Path $cashoutTicketXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

    & $adb -s $Device shell input swipe 540 2070 540 1450 2400 | Out-Null
    Start-Sleep -Seconds 7
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-after-line-cashout.png" | Out-Null
    $afterCashoutXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-after-line-cashout.xml"
    Assert-Contains -Path $afterCashoutXml -Expected @("Portfolio")
    Assert-NotContains -Path $afterCashoutXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")
    Invoke-TapNode -Path $afterCashoutXml -Identifier "portfolio-tab-history"
    Start-Sleep -Seconds 2
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-line-cashout-history.png" | Out-Null
    $cashoutHistoryXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-line-cashout-history.xml"
    Assert-Contains -Path $cashoutHistoryXml -Expected @("Portfolio", "portfolio-tab-history", "activity-row-", "activity-sold", "portfolio-history-market-context-readable", "portfolio-market-type-spread", "portfolio-line-1.5", "portfolio-provider-source-contract-fixture", "portfolio-local-test-pricing")
    Assert-NotContains -Path $cashoutHistoryXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")
  } elseif (-not $expectOpenOrderState) {
    Invoke-TapNode -Path $afterSubmitXml -Identifier "portfolio-tab-history"
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-$Cycle-current-mvp-portfolio-history.png" | Out-Null
    $historyXml = Save-Hierarchy -Name "cycle-$Cycle-current-mvp-portfolio-history.xml"
  }
  if ($ExpectFilledHistory -and (-not $ExpectCashout)) {
    Assert-Contains -Path $historyXml -Expected @("Portfolio", "portfolio-tab-history", "activity-row-", "portfolio-history-market-context-readable", "portfolio-market-type-spread", "portfolio-line-1.5", "portfolio-provider-source-contract-fixture", "portfolio-local-test-pricing")
  } elseif ((-not $expectOpenOrderState) -and (-not $ExpectCancel) -and (-not $ExpectCashout)) {
    Assert-Contains -Path $historyXml -Expected @("Portfolio", "portfolio-tab-history", "No history", "portfolio-market-type-spread", "portfolio-line-1.5", "portfolio-provider-source-contract-fixture")
  }

  $summary = [ordered]@{
    cycle = $Cycle
    result = "pass"
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    device = $Device
    model = $deviceInfo
    backendBaseUrl = $BackendBaseUrl
    mobileApiBaseUrl = $MobileApiBaseUrl
    expoPort = $Port
    keyId = "redacted"
    apiKey = "redacted"
    eventSlug = $EventSlug
    seededCounterparty = [bool]$SeedCounterparty
    counterpartyProof = if ($SeedCounterparty) { $counterpartyProofPath } else { $null }
    cashoutBidPrice = if ($ExpectCashout) { $CashoutBidPrice } else { $null }
    cashoutCounterpartyProof = $cashoutCounterpartyProofPath
    assertions = [ordered]@{
      homeShowsCurrentMatch = $true
      homeShowsProviderWinnerLocalLinesDisclosure = $true
      liveShowsProviderWinnerLocalLinesDisclosure = $true
      detailShowsGameLines = $true
      detailShowsLineFamilyReadiness = $true
      detailShowsProviderWinnerLocalLineSplit = $true
      lineMarketsAreContractFixture = $true
      orderbookHidden = $true
      ticketPreservesLine = $true
      swipeSubmitReachedPortfolio = $true
      portfolioOpenOrderPreservesLineSource = $true
      openOrderVisible = $expectOpenOrderState
      openOrderSourceBadgeVisible = $expectOpenOrderState
      historyShowsEmptyStateUntilFill = (-not [bool]$ExpectFilledHistory) -and (-not $expectOpenOrderState)
      filledHistoryVisible = [bool]$ExpectFilledHistory
      cancelSubmitted = [bool]$ExpectCancel
      canceledHistoryVisible = [bool]$ExpectCancel
      cashoutTicketOpened = [bool]$ExpectCashout
      cashoutSellSubmitted = [bool]$ExpectCashout
      cashoutHistoryVisible = [bool]$ExpectCashout
    }
    artifacts = [System.Collections.Generic.List[string]]@(
      "$OutputDir\cycle-$Cycle-current-mvp-home.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-home.xml",
      "$OutputDir\cycle-$Cycle-current-mvp-live.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-live.xml",
      "$OutputDir\cycle-$Cycle-current-mvp-detail-top.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-detail-top.xml",
      "$OutputDir\cycle-$Cycle-current-mvp-lines.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-lines-attempt-*.xml",
      "$OutputDir\cycle-$Cycle-current-mvp-ticket-ready.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-ticket-ready.xml",
      "$OutputDir\cycle-$Cycle-current-mvp-after-submit.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-after-submit.xml"
    )
  }
  if ($ExpectCancel) {
    $summary.artifacts.Add("$OutputDir\cycle-$Cycle-current-mvp-after-cancel.png")
    $summary.artifacts.Add("$HierarchyOutputDir\cycle-$Cycle-current-mvp-after-cancel.xml")
    $summary.artifacts.Add("$OutputDir\cycle-$Cycle-current-mvp-canceled-history.png")
    $summary.artifacts.Add("$HierarchyOutputDir\cycle-$Cycle-current-mvp-canceled-history.xml")
  } elseif ($ExpectCashout) {
    $summary.artifacts.Add("$OutputDir\cycle-$Cycle-current-mvp-line-cashout-ticket.png")
    $summary.artifacts.Add("$HierarchyOutputDir\cycle-$Cycle-current-mvp-line-cashout-ticket.xml")
    $summary.artifacts.Add("$OutputDir\cycle-$Cycle-current-mvp-after-line-cashout.png")
    $summary.artifacts.Add("$HierarchyOutputDir\cycle-$Cycle-current-mvp-after-line-cashout.xml")
    $summary.artifacts.Add("$OutputDir\cycle-$Cycle-current-mvp-line-cashout-history.png")
    $summary.artifacts.Add("$HierarchyOutputDir\cycle-$Cycle-current-mvp-line-cashout-history.xml")
  } elseif (-not $expectOpenOrderState) {
    $summary.artifacts.Add("$OutputDir\cycle-$Cycle-current-mvp-portfolio-history.png")
    $summary.artifacts.Add("$HierarchyOutputDir\cycle-$Cycle-current-mvp-portfolio-history.xml")
  }
  $summaryPath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-current-mvp-s23-visible-flow.json"
  Write-JsonNoBom -Value $summary -Path $summaryPath -Depth 6
  Write-Host "Proof summary: $summaryPath"
} finally {
  if ($expo -and -not $expo.HasExited) {
    Stop-Process -Id $expo.Id -Force -ErrorAction SilentlyContinue
  }
  $portOwners = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($ownerPid in $portOwners) {
    Stop-Process -Id $ownerPid -Force -ErrorAction SilentlyContinue
  }
  foreach ($key in $previousEnv.Keys) {
    if ($null -eq $previousEnv[$key]) {
      Remove-Item "Env:\$key" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($key, $previousEnv[$key], "Process")
    }
  }
  Pop-Location
}
