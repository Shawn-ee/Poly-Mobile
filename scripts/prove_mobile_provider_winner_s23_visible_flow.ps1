param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8289,
  [string]$ExpoHost = "172.16.200.14",
  [string]$MobileApiBaseUrl = "http://172.16.200.14:3002",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$EventSlug = "argentina-vs-egypt",
  [string]$TargetProviderMarketId = "2793741",
  [string]$CounterpartyAskPrice = "0.70",
  [string]$Cycle = "MQ",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-MQ-provider-winner-s23-visible-flow",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-MQ-provider-winner-s23-visible-flow",
  [switch]$SeedCounterparty,
  [switch]$ExpectFilledHistory
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$mobileRoot = Join-Path $repoRoot "mobile"
$resolvedOutputDir = Join-Path $repoRoot $OutputDir
$resolvedHierarchyOutputDir = Join-Path $repoRoot $HierarchyOutputDir
$expoOut = Join-Path $repoRoot ".runtime\mobile-current-mvp-s23-expo.out.log"
$expoErr = Join-Path $repoRoot ".runtime\mobile-current-mvp-s23-expo.err.log"
$adb = "adb"

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

function Invoke-TapProviderWinnerOutcome {
  param(
    [string]$Path,
    [string]$ProviderMarketId
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $providerFilter = if ($ProviderMarketId) { " and contains(@content-desc,'selection-provider-market-$ProviderMarketId')" } else { "" }
  $nodes = $hierarchy.SelectNodes("//*[contains(@content-desc,'selection-provider-source-polymarket') and contains(@content-desc,'selection-market-type-winner') and contains(@content-desc,'selection-contract-side-yes')$providerFilter]")
  if ($nodes.Count -eq 0 -and $ProviderMarketId) {
    $nodes = $hierarchy.SelectNodes("//*[contains(@content-desc,'provider-regulation-1x2-outcome-EGY') or contains(@content-desc,'selection-provider-market-$ProviderMarketId')]")
  }
  foreach ($node in $nodes) {
    if ($node.bounds -match "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
      $left = [int]$Matches[1]
      $top = [int]$Matches[2]
      $right = [int]$Matches[3]
      $bottom = [int]$Matches[4]
      if ($right -gt $left -and $bottom -gt $top -and $top -ge 0 -and $bottom -le 2340) {
        $x = [math]::Floor($left + (($right - $left) * 0.5))
        $y = [math]::Floor($top + (($bottom - $top) * 0.5))
        & $adb -s $Device shell input tap $x $y | Out-Null
        return
      }
    }
  }
  throw "Missing tappable provider-backed winner Yes outcome in $Path"
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

  $counterpartyProofPath = Join-Path $HierarchyOutputDir "cycle-$Cycle-provider-winner-counterparty.json"
  if ($SeedCounterparty) {
    cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts "--eventSlug=$EventSlug" "--marketGroupKey=main" "--externalMarketId=$TargetProviderMarketId" "--outcomeSide=yes" "--askPrice=$CounterpartyAskPrice" "--askSize=80" "--cleanupProofBids" "--cleanupBlockingBids" "--proofUserPrefix=holiwyn-mobile-" "--output=$counterpartyProofPath" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Provider winner counterparty seed failed for $EventSlug."
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
  Assert-Contains -Path $homeXml -Expected @("Holiwyn", "World Cup", "Argentina vs. Egypt", "event-card-$EventSlug", "home-compact-retail-feed")
  Assert-NotContains -Path $homeXml -Unexpected @("This is the developer menu", "SDK version")
  Assert-NotContains -Path $homeXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "Provider Breadth", "EL-A Provider Breadth", "mobile-el-a-provider-breadth")

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
  Assert-Contains -Path $detailTopXml -Expected @("event-detail-back", "Game", "ARG", "EGY", "Argentina", "Egypt", "provider-regulation-1x2-composed", "provider-regulation-1x2-outcome-ARG", "provider-regulation-1x2-outcome-DRA", "provider-regulation-1x2-outcome-EGY")
  Assert-NotContains -Path $detailTopXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "event-detail-chat")

  $winnerXml = $null
  for ($attempt = 1; $attempt -le 5; $attempt++) {
    & $adb -s $Device shell input swipe 540 2100 540 760 450 | Out-Null
    Start-Sleep -Seconds 1
    $candidate = Save-Hierarchy -Name "cycle-$Cycle-provider-winner-attempt-$attempt.xml"
    $candidateRaw = Get-Content -Raw -Path $candidate
    if (
      $candidateRaw -match [regex]::Escape("Regulation Time Winner") -and
      $candidateRaw -match [regex]::Escape("provider-source-polymarket") -and
      $candidateRaw -match [regex]::Escape("selection-market-type-winner")
    ) {
      $winnerXml = $candidate
      break
    }
  }
  if (-not $winnerXml) {
    Save-Screenshot -Name "cycle-$Cycle-provider-winner-failed.png" | Out-Null
    throw "Could not find provider-backed Regulation Winner market on S23."
  }
  & $adb -s $Device shell input swipe 540 920 540 1450 320 | Out-Null
  Start-Sleep -Seconds 1
  $winnerXml = Save-Hierarchy -Name "cycle-$Cycle-provider-winner-settled.xml"
  Save-Screenshot -Name "cycle-$Cycle-provider-winner.png" | Out-Null
  Assert-Contains -Path $winnerXml -Expected @("Regulation Time Winner", "Provider", "Argentina", "Draw", "Egypt", "selection-market-type-winner", "selection-line-none", "provider-source-polymarket", "selection-provider-market-2793738", "selection-provider-market-2793739", "selection-provider-market-2793741")
  Assert-NotContains -Path $winnerXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Invoke-TapProviderWinnerOutcome -Path $winnerXml -ProviderMarketId $TargetProviderMarketId
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-provider-winner-ticket.png" | Out-Null
  $ticketXml = Save-Hierarchy -Name "cycle-$Cycle-provider-winner-ticket.xml"
  Assert-Contains -Path $ticketXml -Expected @("trade-ticket", "Choose an amount", "ticket-preset-25", "ticket-market-type-winner", "ticket-line-none", "provider-source-polymarket")
  Assert-NotContains -Path $ticketXml -Unexpected @("Order Book", "Chat")

  Invoke-TapNode -Path $ticketXml -Identifier "ticket-preset-25"
  Start-Sleep -Milliseconds 800
  Save-Screenshot -Name "cycle-$Cycle-provider-winner-ticket-ready.png" | Out-Null
  $ticketReadyXml = Save-Hierarchy -Name "cycle-$Cycle-provider-winner-ticket-ready.xml"
  Assert-Contains -Path $ticketReadyXml -Expected @('$25', "Swipe to buy", "place-mock-order", "ticket-market-type-winner", "ticket-line-none", "provider-source-polymarket")

  & $adb -s $Device shell input swipe 540 2070 540 1000 4000 | Out-Null
  Start-Sleep -Seconds 7
  Save-Screenshot -Name "cycle-$Cycle-provider-winner-after-submit.png" | Out-Null
  $afterSubmitXml = Save-Hierarchy -Name "cycle-$Cycle-provider-winner-after-submit.xml"
  Assert-Contains -Path $afterSubmitXml -Expected @("Portfolio", "portfolio-market-type-winner", "portfolio-line-none", "portfolio-provider-source-polymarket")
  if ($ExpectFilledHistory) {
    Assert-Contains -Path $afterSubmitXml -Expected @("position-card-", "portfolio-position-source-badge")
  }
  Assert-NotContains -Path $afterSubmitXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Invoke-TapNode -Path $afterSubmitXml -Identifier "portfolio-tab-history"
  Start-Sleep -Seconds 1
  Save-Screenshot -Name "cycle-$Cycle-provider-winner-portfolio-history.png" | Out-Null
  $historyXml = Save-Hierarchy -Name "cycle-$Cycle-provider-winner-portfolio-history.xml"
  Assert-Contains -Path $historyXml -Expected @("Portfolio", "portfolio-tab-history", "portfolio-market-type-winner", "portfolio-line-none", "portfolio-provider-source-polymarket")
  if ($ExpectFilledHistory) {
    Assert-Contains -Path $historyXml -Expected @("activity-row-", "portfolio-history-source-badge")
    Assert-NotContains -Path $historyXml -Unexpected @("No history")
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
    targetProviderMarketId = $TargetProviderMarketId
    counterpartyAskPrice = if ($SeedCounterparty) { $CounterpartyAskPrice } else { $null }
    seededCounterparty = [bool]$SeedCounterparty
    counterpartyProof = if ($SeedCounterparty) { $counterpartyProofPath } else { $null }
    assertions = [ordered]@{
      homeShowsCurrentMatch = $true
      detailShowsProviderWinner = $true
      detailShowsComposedRegulationWinner1x2 = $true
      regulationWinnerIsPolymarketBacked = $true
      orderbookHidden = $true
      ticketPreservesProviderWinner = $true
      swipeSubmitReachedPortfolio = $true
      portfolioPreservesProviderWinnerSource = $true
      historyPreservesProviderWinnerSource = $true
      filledHistoryVisible = [bool]$ExpectFilledHistory
    }
    artifacts = @(
      "$OutputDir\cycle-$Cycle-current-mvp-home.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-home.xml",
      "$OutputDir\cycle-$Cycle-current-mvp-detail-top.png",
      "$HierarchyOutputDir\cycle-$Cycle-current-mvp-detail-top.xml",
      "$OutputDir\cycle-$Cycle-provider-winner.png",
      "$HierarchyOutputDir\cycle-$Cycle-provider-winner-attempt-*.xml",
      "$OutputDir\cycle-$Cycle-provider-winner-ticket-ready.png",
      "$HierarchyOutputDir\cycle-$Cycle-provider-winner-ticket-ready.xml",
      "$OutputDir\cycle-$Cycle-provider-winner-after-submit.png",
      "$HierarchyOutputDir\cycle-$Cycle-provider-winner-after-submit.xml",
      "$OutputDir\cycle-$Cycle-provider-winner-portfolio-history.png",
      "$HierarchyOutputDir\cycle-$Cycle-provider-winner-portfolio-history.xml"
    )
  }
  $summaryPath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-provider-winner-s23-visible-flow.json"
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
