param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8289,
  [string]$ExpoHost = "127.0.0.1",
  [string]$MobileApiBaseUrl = "http://172.16.200.14:3002",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$EventSlug = "odds-api-single-soccer-test",
  [string]$LineMarketGroupKey = "totals",
  [string]$LineMarketType = "totals",
  [string]$LineValue = "2.5",
  [string]$LineOutcomeSide = "over",
  [string]$LineOutcomeLabel = "Over 2.5",
  [string]$LineReferenceSource = "contract-fixture",
  [string]$CashoutBidPrice = "0.58",
  [decimal]$MaxExpectedCashoutShares = 200,
  [string]$Cycle = "ODDSAPIS23",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-ODDSAPIS23-odds-api-s23-visible-flow",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-ODDSAPIS23-odds-api-s23-visible-flow",
  [string]$DotenvPath = "",
  [switch]$SkipReplaySeed,
  [string]$HomeExpectedTitle = "",
  [string]$TeamAExpected = "",
  [string]$TeamBExpected = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = [string](Resolve-Path (Join-Path $PSScriptRoot ".."))
$mobileRoot = Join-Path $repoRoot "mobile"
$resolvedOutputDir = Join-Path $repoRoot $OutputDir
$resolvedHierarchyOutputDir = Join-Path $repoRoot $HierarchyOutputDir
$expoOut = Join-Path $repoRoot ".runtime\mobile-odds-api-s23-expo.out.log"
$expoErr = Join-Path $repoRoot ".runtime\mobile-odds-api-s23-expo.err.log"
$adb = "adb"

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Get-FirstJsonValue {
  param([object[]]$Values)
  foreach ($value in $Values) {
    if ($value -and "$value".Trim().Length -gt 0) {
      return "$value"
    }
  }
  return $null
}

function Resolve-CurrentExpectedEvent {
  $readiness = Read-JsonFile -Path (Join-Path $repoRoot "docs\mobile\harness\odds-api-live-runtime\internal-tester-readiness-gate-summary.redacted.json")
  $liveRuntime = Read-JsonFile -Path (Join-Path $repoRoot "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json")
  $title = Get-FirstJsonValue -Values @(
    $HomeExpectedTitle,
    $liveRuntime.event.title,
    $readiness.testerReady.event.title,
    "Argentina vs. England"
  )
  $parts = $title -split "\s+vs\.\s+", 2
  $teamA = Get-FirstJsonValue -Values @($TeamAExpected, $(if ($parts.Count -ge 1) { $parts[0] } else { $null }), "Argentina")
  $teamB = Get-FirstJsonValue -Values @($TeamBExpected, $(if ($parts.Count -ge 2) { $parts[1] } else { $null }), "England")
  return [ordered]@{
    title = $title
    teamA = $teamA
    teamB = $teamB
  }
}

$expectedEvent = Resolve-CurrentExpectedEvent
$HomeExpectedTitle = $expectedEvent.title
$TeamAExpected = $expectedEvent.teamA
$TeamBExpected = $expectedEvent.teamB

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

function Set-LocalDatabaseEnv {
  Set-ProofDotenvPath
  if ($env:DATABASE_URL) {
    return
  }
  $candidates = New-Object System.Collections.Generic.List[string]
  if ($env:DOTENV_CONFIG_PATH) {
    $candidates.Add($env:DOTENV_CONFIG_PATH) | Out-Null
  }
  $candidates.Add((Join-Path $repoRoot ".env.local")) | Out-Null
  $candidates.Add((Join-Path $repoRoot ".env")) | Out-Null
  $candidates.Add("C:\Users\hecto\Desktop\projects\PolyProj\Poly\.env") | Out-Null
  foreach ($path in ($candidates | Select-Object -Unique)) {
    if (-not $path -or -not (Test-Path -LiteralPath $path)) {
      continue
    }
    $line = Get-Content -LiteralPath $path | Where-Object { $_ -match "^\s*DATABASE_URL\s*=" } | Select-Object -First 1
    if ($line) {
      $env:DATABASE_URL = ($line -replace "^\s*DATABASE_URL\s*=\s*", "").Trim().Trim('"').Trim("'")
      return
    }
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

function Wait-HierarchyContains {
  param(
    [string]$NamePrefix,
    [string[]]$Expected,
    [string]$RestartUrl = "",
    [int]$TimeoutSeconds = 90,
    [int]$IntervalSeconds = 3
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $attempt = 0
  $lastPath = $null
  while ((Get-Date) -lt $deadline) {
    $attempt += 1
    $lastPath = Save-Hierarchy -Name "$NamePrefix-attempt-$attempt.xml"
    $raw = Get-Content -Raw -Path $lastPath
    if ($raw -match [regex]::Escape("This is the developer menu") -or $raw -match [regex]::Escape("SDK version")) {
      if ($raw -match [regex]::Escape("Continue")) {
        try {
          Tap-Node -Path $lastPath -Identifier "Continue"
        } catch {
          & $adb -s $Device shell input tap 540 2070 | Out-Null
        }
      } else {
        & $adb -s $Device shell input keyevent KEYCODE_BACK | Out-Null
      }
      Start-Sleep -Seconds 2
      continue
    }
    if ($RestartUrl -and $raw -match [regex]::Escape("Play Store") -and $raw -match [regex]::Escape("OneDrive")) {
      Start-Link -Url $RestartUrl
      Start-Sleep -Seconds 6
      continue
    }
    if ($RestartUrl -and $raw -notmatch [regex]::Escape("host.exp.exponent")) {
      Start-Link -Url $RestartUrl
      Start-Sleep -Seconds 6
      continue
    }
    $found = $true
    foreach ($item in $Expected) {
      if ($raw -notmatch [regex]::Escape($item)) {
        $found = $false
        break
      }
    }
    if ($found) {
      return $lastPath
    }
    Start-Sleep -Seconds $IntervalSeconds
  }
  if ($lastPath) {
    return $lastPath
  }
  return Save-Hierarchy -Name "$NamePrefix-timeout.xml"
}

function Get-CashoutAvailableShares {
  param([string]$Path)
  $raw = Get-Content -Raw -Path $Path
  $match = [regex]::Match($raw, "cashout-available-shares-([0-9]+(?:\.[0-9]+)?)")
  if (-not $match.Success) {
    throw "Could not read cashout available shares marker from $Path"
  }
  return [decimal]::Parse($match.Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture)
}

function Format-ProofShareAmount {
  param([decimal]$Value)
  $text = $Value.ToString("0.######", [Globalization.CultureInfo]::InvariantCulture)
  if ($text -eq "-0") { return "0" }
  return $text
}

function Assert-CashoutSharesWithinExpectedProofBound {
  param(
    [decimal]$Value,
    [decimal]$MaxExpected
  )
  if ($Value -le 0) {
    throw "Cashout available shares must be positive, got $Value."
  }
  if ($Value -gt $MaxExpected) {
    throw "Cashout available shares $Value exceeds expected proof bound $MaxExpected. This likely means Max is using wallet/stale quantity instead of owned shares."
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

function Format-ArtifactPath {
  param([string]$Path)
  $candidate = [string]$Path
  try {
    $resolved = Resolve-Path -LiteralPath ([string]$Path) -ErrorAction Stop
    $candidate = [string]$resolved.ProviderPath
  } catch {
    $candidate = [string]$Path
  }
  $repoRootPrefix = $repoRoot.ToLowerInvariant()
  if ($candidate.ToLowerInvariant().StartsWith($repoRootPrefix)) {
    return $candidate.Substring($repoRoot.Length).TrimStart([char[]]@("\", "/"))
  }
  return $candidate
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

function Tap-TextNode {
  param(
    [string]$Path,
    [string]$Text,
    [double]$XRatio = 0.25,
    [double]$YRatio = 0.5
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $node = $hierarchy.SelectSingleNode("//*[@text='$Text']")
  if (-not $node) {
    throw "Missing text node '$Text' in $Path"
  }
  if ($node.bounds -notmatch "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
    throw "Invalid bounds for '$Text': $($node.bounds)"
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
  for ($attempt = 1; $attempt -le 8; $attempt++) {
    $xmlPath = Save-Hierarchy -Name "$NamePrefix-preflight-$attempt.xml"
    $raw = Get-Content -Raw -Path $xmlPath
    $hasDeveloperIntro = $raw -match [regex]::Escape("This is the developer menu")
    $hasExpoSheet = $raw -match [regex]::Escape("SDK version") -or $raw -match [regex]::Escape("Connected to expo-cli")
    if (-not $hasDeveloperIntro -and -not $hasExpoSheet) {
      return $xmlPath
    }

    if ($raw -match [regex]::Escape("Continue")) {
      try {
        Tap-Node -Path $xmlPath -Identifier "Continue"
      } catch {
        & $adb -s $Device shell input tap 540 2070 | Out-Null
      }
    } else {
      & $adb -s $Device shell input keyevent KEYCODE_BACK | Out-Null
      Start-Sleep -Milliseconds 500
      & $adb -s $Device shell input tap 1000 780 | Out-Null
    }
    Start-Sleep -Seconds 2

    $afterPath = Save-Hierarchy -Name "$NamePrefix-preflight-after-action-$attempt.xml"
    $afterRaw = Get-Content -Raw -Path $afterPath
    if ($afterRaw -notmatch [regex]::Escape("This is the developer menu") -and $afterRaw -notmatch [regex]::Escape("SDK version")) {
      return $afterPath
    }
    Start-Sleep -Seconds 1
  }

  return Save-Hierarchy -Name "$NamePrefix-preflight-after-dismiss-attempts.xml"
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
  & $adb -s $Device shell am force-stop com.android.chrome | Out-Null
  & $adb -s $Device shell am start -W -p host.exp.exponent -a android.intent.action.VIEW -d $Url | Out-Null
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
  DATABASE_URL = $env:DATABASE_URL
  DOTENV_CONFIG_PATH = $env:DOTENV_CONFIG_PATH
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
  Set-LocalDatabaseEnv

  if (-not $SkipReplaySeed) {
    cmd /c npm run mobile:one-event-cached-restore | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "The Odds API cached live event restore failed."
    }
  }

  $counterpartyProofPath = Join-Path $HierarchyOutputDir "cycle-$Cycle-odds-api-counterparty.json"
  cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts "--eventSlug=$EventSlug" "--marketGroupKey=$LineMarketGroupKey" "--line=$LineValue" "--outcomeSide=$LineOutcomeSide" "--askPrice=0.58" "--askSize=100" "--mintQuantity=150" "--makerBalance=250" "--cleanupProofBids" "--cleanupBlockingBids" "--cleanupBlockingMarketBids" "--resetSelectedMarketState" "--liquidityPurpose=buy-fill" "--proofUserPrefix=holiwyn-mobile-" "--output=$counterpartyProofPath" | Out-Null
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

  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  & $adb -s $Device shell pm clear host.exp.exponent | Out-Null
  Start-Sleep -Seconds 2
  $encodedKey = [uri]::EscapeDataString($apiKey)
  $launchUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1&apiKey=$encodedKey"
  Start-Link -Url $launchUrl
  Start-Sleep -Seconds 6
  Dismiss-ExpoDeveloperMenu -NamePrefix "cycle-$Cycle-home" | Out-Null

  $homeXml = Wait-HierarchyContains -NamePrefix "cycle-$Cycle-home" -Expected @("event-card-$EventSlug", $HomeExpectedTitle) -RestartUrl $launchUrl -TimeoutSeconds 120 -IntervalSeconds 4
  Save-Screenshot -Name "cycle-$Cycle-home.png" | Out-Null
  Assert-Contains -Path $homeXml -Expected @("Holiwyn", "World Cup", "Matches", $HomeExpectedTitle, "event-card-$EventSlug", "home-compact-retail-feed")
  Assert-NotContains -Path $homeXml -Unexpected @("This is the developer menu", "SDK version", "Order Book", "event-detail-open-order-book", "Chat", "Provider Breadth")

  Tap-TextNode -Path $homeXml -Text $HomeExpectedTitle
  Start-Sleep -Seconds 5
  Save-Screenshot -Name "cycle-$Cycle-detail-top.png" | Out-Null
  $detailTopXml = Save-Hierarchy -Name "cycle-$Cycle-detail-top.xml"
  $detailTopRaw = Get-Content -Raw -Path $detailTopXml
  if ($detailTopRaw -notmatch [regex]::Escape("event-detail-back")) {
    Tap-Node -Path $homeXml -Identifier "event-card-$EventSlug" -StartsWith -XRatio 0.25 -YRatio 0.38
    Start-Sleep -Seconds 4
    Save-Screenshot -Name "cycle-$Cycle-detail-top-retry.png" | Out-Null
    $detailTopXml = Save-Hierarchy -Name "cycle-$Cycle-detail-top-retry.xml"
  }
  Assert-Contains -Path $detailTopXml -Expected @("event-detail-back", "Game", $TeamAExpected, $TeamBExpected, "Game Lines", "Player Props")
  Assert-NotContains -Path $detailTopXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat", "event-detail-chat")

  $lineXml = $null
  $lineTokens = @("selection-market-type-$LineMarketType", "selection-line-$LineValue", "selection-side-$LineOutcomeSide")
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
    throw "Could not find tradable $LineMarketType line $LineValue on S23."
  }
  Save-Screenshot -Name "cycle-$Cycle-line-market.png" | Out-Null
  Assert-Contains -Path $lineXml -Expected @("selection-market-type-$LineMarketType", "selection-line-$LineValue", "selection-side-$LineOutcomeSide")
  Assert-AnyContains -Path $lineXml -AnyExpected @($LineOutcomeLabel, "Over") -Reason "selected sportsbook line outcome label"
  Assert-NotContains -Path $lineXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Tap-NodeContainingAll -Path $lineXml -Tokens $lineTokens
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-ticket-initial.png" | Out-Null
  $ticketXml = Save-Hierarchy -Name "cycle-$Cycle-ticket-initial.xml"
  Assert-Contains -Path $ticketXml -Expected @("trade-ticket", "Choose an amount", "ticket-preset-25", "ticket-market-type-$LineMarketType", "ticket-line-$LineValue")
  Assert-NotContains -Path $ticketXml -Unexpected @("Order Book", "Chat")

  Tap-Node -Path $ticketXml -Identifier "ticket-preset-25"
  Start-Sleep -Milliseconds 800
  Save-Screenshot -Name "cycle-$Cycle-ticket-ready.png" | Out-Null
  $ticketReadyXml = Save-Hierarchy -Name "cycle-$Cycle-ticket-ready.xml"
  Assert-Contains -Path $ticketReadyXml -Expected @('$25', "Swipe to buy", "place-mock-order", "swipe-submit-gesture-required", "ticket-line-$LineValue")

  & $adb -s $Device shell input swipe 540 2070 540 980 4000 | Out-Null
  $afterSubmitXml = Wait-HierarchyContains -NamePrefix "cycle-$Cycle-after-submit" -Expected @(
    "Portfolio",
    "position-card-",
    "portfolio-position-cash-out-"
  ) -TimeoutSeconds 60 -IntervalSeconds 2
  $canonicalAfterSubmitXml = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-after-submit.xml"
  if ($afterSubmitXml -ne $canonicalAfterSubmitXml) {
    Copy-Item -LiteralPath $afterSubmitXml -Destination $canonicalAfterSubmitXml -Force
    $afterSubmitXml = $canonicalAfterSubmitXml
  }
  Save-Screenshot -Name "cycle-$Cycle-after-submit.png" | Out-Null
  Assert-Contains -Path $afterSubmitXml -Expected @("Portfolio", "portfolio-market-type-$LineMarketType", "portfolio-line-$LineValue")
  Assert-Contains -Path $afterSubmitXml -Expected @("position-card-", "portfolio-position-cash-out-", "portfolio-position-source-badge")
  Assert-NotContains -Path $afterSubmitXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  $cashoutCounterpartyProofPath = Join-Path $HierarchyOutputDir "cycle-$Cycle-odds-api-cashout-counterparty.json"
  $cashoutCounterpartyProofAbsolutePath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-odds-api-cashout-counterparty.json"
  cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts "--eventSlug=$EventSlug" "--marketGroupKey=$LineMarketGroupKey" "--line=$LineValue" "--outcomeSide=$LineOutcomeSide" "--makerSide=BUY" "--bidPrice=$CashoutBidPrice" "--bidSize=80" "--cleanupBlockingMarketBids" "--cleanupProofAsks" "--cleanupBlockingAsks" "--liquidityPurpose=cashout-sell-fill" "--proofUserPrefix=holiwyn-mobile-" "--output=$cashoutCounterpartyProofAbsolutePath" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Sportsbook line cashout counterparty seed failed for $EventSlug."
  }

  Tap-Node -Path $afterSubmitXml -Identifier "portfolio-position-cash-out-" -StartsWith
  Start-Sleep -Seconds 6
  Save-Screenshot -Name "cycle-$Cycle-cashout-ticket.png" | Out-Null
  $cashoutTicketXml = Save-Hierarchy -Name "cycle-$Cycle-cashout-ticket.xml"
  Assert-Contains -Path $cashoutTicketXml -Expected @(
    "trade-ticket",
    "cashout-ticket-no-yes-no-selector",
    "cashout-close-existing-position",
    "cashout-mode-active-true",
    "cashout-source-position-present",
    "cashout-effective-side-sell",
    "cashout-share-quantity-display",
    "cashout-share-keypad",
    "Choose shares",
    "ticket-max-amount",
    "cashout-max-owned-shares",
    "ticket-line-$LineValue"
  )
  Assert-NotContains -Path $cashoutTicketXml -Unexpected @(
    "ticket-side-enabled",
    "ticket-side-buy",
    "Swipe to sell",
    "9,000 USDT",
    "9000 USDT",
    "10,000 USDT",
    "10000 USDT",
    "Order Book",
    "event-detail-open-order-book",
    "Chat"
  )

  $ownedShares = Get-CashoutAvailableShares -Path $cashoutTicketXml
  Assert-CashoutSharesWithinExpectedProofBound -Value $ownedShares -MaxExpected $MaxExpectedCashoutShares
  $ownedSharesText = Format-ProofShareAmount -Value $ownedShares
  Tap-Node -Path $cashoutTicketXml -Identifier "ticket-max-amount"
  Start-Sleep -Milliseconds 800
  Save-Screenshot -Name "cycle-$Cycle-cashout-ticket-ready.png" | Out-Null
  $cashoutTicketReadyXml = Save-Hierarchy -Name "cycle-$Cycle-cashout-ticket-ready.xml"
  Assert-Contains -Path $cashoutTicketReadyXml -Expected @(
    "trade-ticket",
    "cashout-ticket-no-yes-no-selector",
    "cashout-close-existing-position",
    "cashout-mode-active-true",
    "cashout-source-position-present",
    "cashout-effective-side-sell",
    "cashout-share-quantity-display",
    "cashout-amount-is-shares",
    "cashout-max-owned-shares",
    $ownedSharesText,
    "shares",
    "Swipe to cash out",
    "swipe-submit-gesture-required",
    "ticket-line-$LineValue"
  )
  Assert-NotContains -Path $cashoutTicketReadyXml -Unexpected @(
    "ticket-side-enabled",
    "ticket-side-buy",
    "Swipe to sell",
    "9,000 USDT",
    "9000 USDT",
    "10,000 USDT",
    "10000 USDT",
    "Order Book",
    "event-detail-open-order-book",
    "Chat"
  )
  $readyOwnedShares = Get-CashoutAvailableShares -Path $cashoutTicketReadyXml
  Assert-CashoutSharesWithinExpectedProofBound -Value $readyOwnedShares -MaxExpected $MaxExpectedCashoutShares

  & $adb -s $Device shell input swipe 540 2070 540 1450 2400 | Out-Null
  Start-Sleep -Seconds 7
  Save-Screenshot -Name "cycle-$Cycle-after-cashout.png" | Out-Null
  $afterCashoutXml = Save-Hierarchy -Name "cycle-$Cycle-after-cashout.xml"
  Assert-Contains -Path $afterCashoutXml -Expected @("Portfolio")
  Assert-NotContains -Path $afterCashoutXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  Tap-Node -Path $afterCashoutXml -Identifier "portfolio-tab-history"
  Start-Sleep -Seconds 2
  Save-Screenshot -Name "cycle-$Cycle-portfolio-history.png" | Out-Null
  $historyXml = Save-Hierarchy -Name "cycle-$Cycle-portfolio-history.xml"
  Assert-Contains -Path $historyXml -Expected @("Portfolio", "portfolio-tab-history", "activity-row-", "activity-sold", "portfolio-market-type-$LineMarketType", "portfolio-line-$LineValue")
  Assert-NotContains -Path $historyXml -Unexpected @("Order Book", "event-detail-open-order-book", "Chat")

  $artifacts = @(
    "$OutputDir\cycle-$Cycle-home.png",
    $homeXml,
    "$OutputDir\cycle-$Cycle-detail-top.png",
    $detailTopXml,
    "$OutputDir\cycle-$Cycle-line-market.png",
    $lineXml,
    "$OutputDir\cycle-$Cycle-ticket-initial.png",
    "$HierarchyOutputDir\cycle-$Cycle-ticket-initial.xml",
    "$OutputDir\cycle-$Cycle-ticket-ready.png",
    "$HierarchyOutputDir\cycle-$Cycle-ticket-ready.xml",
    "$OutputDir\cycle-$Cycle-after-submit.png",
    "$HierarchyOutputDir\cycle-$Cycle-after-submit.xml",
    "$OutputDir\cycle-$Cycle-cashout-ticket.png",
    "$HierarchyOutputDir\cycle-$Cycle-cashout-ticket.xml",
    "$OutputDir\cycle-$Cycle-cashout-ticket-ready.png",
    "$HierarchyOutputDir\cycle-$Cycle-cashout-ticket-ready.xml",
    "$OutputDir\cycle-$Cycle-after-cashout.png",
    "$HierarchyOutputDir\cycle-$Cycle-after-cashout.xml",
    "$OutputDir\cycle-$Cycle-portfolio-history.png",
    "$HierarchyOutputDir\cycle-$Cycle-portfolio-history.xml"
  ) | ForEach-Object { Format-ArtifactPath $_ }

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
    skipReplaySeed = [bool]$SkipReplaySeed
    expectedTitle = $HomeExpectedTitle
    selectedMarket = [ordered]@{
      marketGroupKey = $LineMarketGroupKey
      marketType = $LineMarketType
      line = $LineValue
      outcomeSide = $LineOutcomeSide
      outcomeLabel = $LineOutcomeLabel
      referenceSource = $LineReferenceSource
    }
    counterpartyProof = $counterpartyProofPath
    cashoutBidPrice = $CashoutBidPrice
    maxExpectedCashoutShares = $MaxExpectedCashoutShares
    observedCashoutShares = [decimal]$ownedShares
    cashoutCounterpartyProof = $cashoutCounterpartyProofPath
    assertions = [ordered]@{
      homeShowsTemporarySportsbookEvent = $true
      homeKeepsMvpFeedClean = $true
      detailShowsGameLines = $true
      detailHidesOrderBookAndChat = $true
      sportsbookLineVisible = $true
      ticketPreservesSportsbookLineIdentity = $true
      swipeSubmitReachedPortfolio = $true
      portfolioPreservesSportsbookLineIdentity = $true
      cashoutTicketOpened = $true
      cashoutTicketIsClosePositionMode = $true
      cashoutMaxUsesOwnedShares = $true
      cashoutTicketHidesYesNoSelector = $true
      cashoutSellSubmitted = $true
      cashoutHistoryVisible = $true
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
