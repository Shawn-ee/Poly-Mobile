param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8289,
  [string]$ExpoHost = "172.16.200.14",
  [string]$MobileApiBaseUrl = "http://172.16.200.14:3002",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$EventSlug = "odds-api-single-soccer-test",
  [string]$LineMarketGroupKey = "spread",
  [string]$LineValue = "0.5",
  [string]$LineOutcomeSide = "home",
  [string]$LineOutcomeLabel = "Argentina -0.5",
  [string]$Cycle = "ODDSAPIS23",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-ODDSAPIS23-odds-api-s23-visible-flow",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-ODDSAPIS23-odds-api-s23-visible-flow",
  [string]$DotenvPath = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$mobileRoot = Join-Path $repoRoot "mobile"
$resolvedOutputDir = Join-Path $repoRoot $OutputDir
$resolvedHierarchyOutputDir = Join-Path $repoRoot $HierarchyOutputDir
$expoOut = Join-Path $repoRoot ".runtime\mobile-odds-api-s23-expo.out.log"
$expoErr = Join-Path $repoRoot ".runtime\mobile-odds-api-s23-expo.err.log"
$adb = "adb"

New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $resolvedHierarchyOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $expoOut) | Out-Null

function Set-ProofDotenvPath {
  if ($DotenvPath -and (Test-Path -LiteralPath $DotenvPath)) {
    $env:DOTENV_CONFIG_PATH = (Resolve-Path -LiteralPath $DotenvPath).Path
    return
  }
  if ($env:DOTENV_CONFIG_PATH -and (Test-Path -LiteralPath $env:DOTENV_CONFIG_PATH)) {
    return
  }
  $repoEnv = Join-Path $repoRoot ".env"
  if (Test-Path -LiteralPath $repoEnv) {
    $env:DOTENV_CONFIG_PATH = $repoEnv
    return
  }
  $defaultProjectEnv = "C:\Users\hecto\Desktop\projects\PolyProj\Poly\.env"
  if (Test-Path -LiteralPath $defaultProjectEnv) {
    $env:DOTENV_CONFIG_PATH = $defaultProjectEnv
  }
}

function Assert-Contains {
  param([string]$Path, [string[]]$Expected)
  $raw = Get-Content -Raw -Path $Path
  foreach ($item in $Expected) {
    if ($raw -notmatch [regex]::Escape($item)) {
      throw "Missing expected UI text/label '$item' in $Path"
    }
  }
}

function Assert-AnyContains {
  param([string]$Path, [string[]]$AnyExpected, [string]$Reason)
  $raw = Get-Content -Raw -Path $Path
  foreach ($item in $AnyExpected) {
    if ($raw -match [regex]::Escape($item)) {
      return
    }
  }
  throw "Missing expected UI text/label for $Reason. Expected one of: $($AnyExpected -join ', ') in $Path"
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

function Tap-Node {
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

function Tap-NodeContainingAll {
  param(
    [string]$Path,
    [string[]]$Tokens,
    [double]$XRatio = 0.5,
    [double]$YRatio = 0.5
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $nodes = $hierarchy.SelectNodes("//*[@content-desc]")
  foreach ($node in $nodes) {
    $desc = [string]$node.GetAttribute("content-desc")
    $matchesAll = $true
    foreach ($token in $Tokens) {
      if (-not $desc.Contains($token)) {
        $matchesAll = $false
        break
      }
    }
    if (-not $matchesAll) {
      continue
    }
    if ($node.bounds -match "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
      $left = [int]$Matches[1]
      $top = [int]$Matches[2]
      $right = [int]$Matches[3]
      $bottom = [int]$Matches[4]
      if ($right -gt $left -and $bottom -gt $top -and $top -ge 0 -and $top -le 2340) {
        $x = [math]::Floor($left + (($right - $left) * $XRatio))
        $y = [math]::Floor($top + (($bottom - $top) * $YRatio))
        & $adb -s $Device shell input tap $x $y | Out-Null
        return
      }
    }
  }
  throw "Missing tappable node containing tokens: $($Tokens -join ', ') in $Path"
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
    [int]$Depth = 8
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
  MOBILE_DEV_MAX_ORDER_SIZE = $env:MOBILE_DEV_MAX_ORDER_SIZE
  MOBILE_DEV_MAX_ORDER_NOTIONAL = $env:MOBILE_DEV_MAX_ORDER_NOTIONAL
  MOBILE_DEV_DAILY_NOTIONAL = $env:MOBILE_DEV_DAILY_NOTIONAL
}
$expo = $null
try {
  $deviceInfo = (& $adb -s $Device shell getprop ro.product.model).Trim()
  if (-not $deviceInfo) {
    throw "Target Android device is not reachable: $Device"
  }
  Write-Host "Using Android device: $Device ($deviceInfo)"

  $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 5
  if ($health.status -ne "ok") {
    throw "Backend health is not ok."
  }

  $replayPath = "docs/mobile/harness/the-odds-api-single-event/event-odds.redacted.json"
  cmd /c npm run mobile:the-odds-api-single-event -- "--fromRedactedOdds=$replayPath" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "The Odds API replay seed failed."
  }

  $counterpartyProofPath = Join-Path $HierarchyOutputDir "cycle-$Cycle-odds-api-counterparty.json"
  cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts "--eventSlug=$EventSlug" "--marketGroupKey=$LineMarketGroupKey" "--line=$LineValue" "--outcomeSide=$LineOutcomeSide" "--askPrice=0.58" "--askSize=100" "--mintQuantity=150" "--makerBalance=250" "--cleanupProofBids" "--cleanupBlockingBids" "--cleanupBlockingMarketBids" "--liquidityPurpose=buy-fill" "--proofUserPrefix=holiwyn-mobile-" "--output=$counterpartyProofPath" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Sportsbook line counterparty seed failed for $EventSlug."
  }

  $env:MOBILE_DEV_USERNAME = "holiwyn-mobile-$($Cycle.ToLower())-s23-$(Get-Date -Format yyyyMMddHHmmss)"
  $env:MOBILE_DEV_MAX_ORDER_SIZE = "10000.000000"
  $env:MOBILE_DEV_MAX_ORDER_NOTIONAL = "10000.000000"
  $env:MOBILE_DEV_DAILY_NOTIONAL = "50000.000000"
  Set-ProofDotenvPath
  $credentialRaw = cmd /c npx.cmd tsx -r dotenv/config scripts/create_mobile_dev_credential.ts 2>&1 | Out-String
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
  Dismiss-ExpoDeveloperMenu -NamePrefix "cycle-$Cycle-home" | Out-Null

  Save-Screenshot -Name "cycle-$Cycle-home.png" | Out-Null
  $homeXml = Save-Hierarchy -Name "cycle-$Cycle-home.xml"
  Assert-Contains -Path $homeXml -Expected @("Holiwyn", "World Cup", "Matches", "Switzerland vs. Argentina", "event-card-$EventSlug", "home-compact-retail-feed", "home-card-source-sportsbook-odds", "home-card-source-partial-provider-backed")
  Assert-NotContains -Path $homeXml -Unexpected @("This is the developer menu", "SDK version", "Order Book", "event-detail-open-order-book", "Chat", "Provider Breadth")

  Tap-Node -Path $homeXml -Identifier "event-card-$EventSlug" -StartsWith -YRatio 0.28
  Start-Sleep -Seconds 5
  Save-Screenshot -Name "cycle-$Cycle-detail-top.png" | Out-Null
  $detailTopXml = Save-Hierarchy -Name "cycle-$Cycle-detail-top.xml"
  $detailTopRaw = Get-Content -Raw -Path $detailTopXml
  if ($detailTopRaw -notmatch [regex]::Escape("event-detail-back")) {
    & $adb -s $Device shell input tap 540 900 | Out-Null
    Start-Sleep -Seconds 4
    Save-Screenshot -Name "cycle-$Cycle-detail-top-retry.png" | Out-Null
    $detailTopXml = Save-Hierarchy -Name "cycle-$Cycle-detail-top-retry.xml"
  }
  Assert-Contains -Path $detailTopXml -Expected @("event-detail-back", "Game", "Argentina", "Switzerland", "Game Lines", "Player Props")
  Assert-NotContains -Path $detailTopXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "event-detail-chat")

  $lineXml = $null
  $lineTokens = @("selection-provider-source-sportsbook-odds", "selection-market-type-spread", "selection-line-$LineValue", "selection-side-$LineOutcomeSide")
  for ($attempt = 1; (-not $lineXml) -and $attempt -le 8; $attempt++) {
    $candidate = Save-Hierarchy -Name "cycle-$Cycle-line-attempt-$attempt.xml"
    $candidateRaw = Get-Content -Raw -Path $candidate
    $found = $true
    foreach ($token in $lineTokens) {
      if ($candidateRaw -notmatch [regex]::Escape($token)) {
        $found = $false
        break
      }
    }
    if ($found) {
      $lineXml = $candidate
      break
    }
    & $adb -s $Device shell input swipe 540 2050 540 700 450 | Out-Null
    Start-Sleep -Seconds 1
  }
  if (-not $lineXml) {
    Save-Screenshot -Name "cycle-$Cycle-line-not-found.png" | Out-Null
    throw "Could not find sportsbook-backed spread line $LineValue on S23."
  }
  Save-Screenshot -Name "cycle-$Cycle-line-market.png" | Out-Null
  Assert-Contains -Path $lineXml -Expected @("selection-provider-source-sportsbook-odds", "selection-market-type-spread", "selection-line-$LineValue", "selection-side-$LineOutcomeSide", "line-market-sportsbook-odds", "market-source-sportsbook-readable")
  Assert-AnyContains -Path $lineXml -AnyExpected @($LineOutcomeLabel, "Argentina") -Reason "selected sportsbook spread outcome label"
  Assert-NotContains -Path $lineXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Tap-NodeContainingAll -Path $lineXml -Tokens $lineTokens
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-ticket-initial.png" | Out-Null
  $ticketXml = Save-Hierarchy -Name "cycle-$Cycle-ticket-initial.xml"
  Assert-Contains -Path $ticketXml -Expected @("trade-ticket", "Choose an amount", "ticket-preset-25", "ticket-market-type-spread", "ticket-line-$LineValue", "ticket-provider-source-sportsbook-odds", "ticket-source-sportsbook-odds", "ticket-provider-backed-pricing", "ticket-sportsbook-odds-pricing")
  Assert-NotContains -Path $ticketXml -Unexpected @("Order Book", "Chat")

  Tap-Node -Path $ticketXml -Identifier "ticket-preset-25"
  Start-Sleep -Milliseconds 800
  Save-Screenshot -Name "cycle-$Cycle-ticket-ready.png" | Out-Null
  $ticketReadyXml = Save-Hierarchy -Name "cycle-$Cycle-ticket-ready.xml"
  Assert-Contains -Path $ticketReadyXml -Expected @('$25', "Swipe to buy", "place-mock-order", "swipe-submit-gesture-required", "ticket-provider-source-sportsbook-odds", "ticket-line-$LineValue")

  & $adb -s $Device shell input swipe 540 2070 540 980 4000 | Out-Null
  Start-Sleep -Seconds 7
  Save-Screenshot -Name "cycle-$Cycle-after-submit.png" | Out-Null
  $afterSubmitXml = Save-Hierarchy -Name "cycle-$Cycle-after-submit.xml"
  Assert-Contains -Path $afterSubmitXml -Expected @("Portfolio", "portfolio-market-type-spread", "portfolio-line-$LineValue", "portfolio-provider-source-sportsbook-odds", "portfolio-provider-backed-pricing", "portfolio-sportsbook-odds-pricing")
  Assert-AnyContains -Path $afterSubmitXml -AnyExpected @("position-card-", "open-order-row-") -Reason "portfolio position or open order after sportsbook fake-token order"
  Assert-NotContains -Path $afterSubmitXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Tap-Node -Path $afterSubmitXml -Identifier "portfolio-tab-history"
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-portfolio-history.png" | Out-Null
  $historyXml = Save-Hierarchy -Name "cycle-$Cycle-portfolio-history.xml"
  Assert-Contains -Path $historyXml -Expected @("Portfolio", "portfolio-tab-history", "activity-row-", "portfolio-market-type-spread", "portfolio-line-$LineValue", "portfolio-provider-source-sportsbook-odds")
  Assert-NotContains -Path $historyXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  $artifacts = @(
    "$OutputDir\cycle-$Cycle-home.png",
    "$HierarchyOutputDir\cycle-$Cycle-home.xml",
    "$OutputDir\cycle-$Cycle-detail-top.png",
    "$HierarchyOutputDir\cycle-$Cycle-detail-top.xml",
    "$OutputDir\cycle-$Cycle-line-market.png",
    "$HierarchyOutputDir\cycle-$Cycle-line-attempt-1.xml",
    "$OutputDir\cycle-$Cycle-ticket-initial.png",
    "$HierarchyOutputDir\cycle-$Cycle-ticket-initial.xml",
    "$OutputDir\cycle-$Cycle-ticket-ready.png",
    "$HierarchyOutputDir\cycle-$Cycle-ticket-ready.xml",
    "$OutputDir\cycle-$Cycle-after-submit.png",
    "$HierarchyOutputDir\cycle-$Cycle-after-submit.xml",
    "$OutputDir\cycle-$Cycle-portfolio-history.png",
    "$HierarchyOutputDir\cycle-$Cycle-portfolio-history.xml"
  )

  $summary = [ordered]@{
    cycle = $Cycle
    result = "pass"
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    device = $Device
    model = $deviceInfo
    backendBaseUrl = $BackendBaseUrl
    mobileApiBaseUrl = $MobileApiBaseUrl
    expoPort = $Port
    keyId = $keyId
    apiKey = "redacted"
    eventSlug = $EventSlug
    selectedMarket = [ordered]@{
      marketGroupKey = $LineMarketGroupKey
      marketType = "spread"
      line = $LineValue
      outcomeSide = $LineOutcomeSide
      outcomeLabel = $LineOutcomeLabel
      referenceSource = "sportsbook-odds"
    }
    counterpartyProof = $counterpartyProofPath
    assertions = [ordered]@{
      homeShowsTemporarySportsbookEvent = $true
      homeKeepsMvpFeedClean = $true
      detailShowsGameLines = $true
      detailHidesOrderBookAndChat = $true
      sportsbookSpreadLineVisible = $true
      ticketPreservesSportsbookLineIdentity = $true
      swipeSubmitReachedPortfolio = $true
      portfolioPreservesSportsbookLineIdentity = $true
      historyPreservesSportsbookLineIdentity = $true
    }
    artifacts = $artifacts
  }
  $summaryPath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-odds-api-s23-visible-flow.json"
  Write-JsonNoBom -Value $summary -Path $summaryPath -Depth 8
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
