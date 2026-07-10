param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8291,
  [string]$ExpoHost = "172.16.200.14",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$MobileApiBaseUrl = "http://172.16.200.14:3002",
  [string]$Cycle = "RX",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-RX-google-auth-return",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-RX-google-auth-return",
  [switch]$VerifyPersistence,
  [switch]$VerifyLogout
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $repoRoot "mobile"
$resolvedOutputDir = Join-Path $repoRoot $OutputDir
$resolvedHierarchyOutputDir = Join-Path $repoRoot $HierarchyOutputDir
New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $resolvedHierarchyOutputDir | Out-Null

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  throw "ADB not found at $adb"
}

function Invoke-JsonCommand {
  param([scriptblock]$Command)
  $raw = & $Command 2>&1 | Out-String
  $start = $raw.IndexOf("{")
  $end = $raw.LastIndexOf("}")
  $userIdMarker = $raw.LastIndexOf('"userId"')
  if ($userIdMarker -ge 0) {
    $start = $raw.LastIndexOf("{", $userIdMarker)
  }
  if ($start -lt 0 -or $end -lt $start) {
    throw "Command did not emit JSON: $raw"
  }
  return $raw.Substring($start, $end - $start + 1) | ConvertFrom-Json
}

function Wait-ExpoReady {
  param([int]$ReadyPort)
  for ($attempt = 1; $attempt -le 75; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$ReadyPort/status" -UseBasicParsing -TimeoutSec 2
      if ([string]$response.Content -match "packager-status:running") {
        return
      }
    } catch {
      # Metro is still starting.
    }
    $listener = Get-NetTCPConnection -LocalPort $ReadyPort -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
      Start-Sleep -Seconds 6
      return
    }
    Start-Sleep -Seconds 2
  }
  throw "Expo Metro did not become ready on port $ReadyPort"
}

function Save-UiHierarchy {
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

function Save-Screenshot {
  param([string]$Name)
  $remote = "/sdcard/$Name"
  $local = Join-Path $resolvedOutputDir $Name
  & $adb -s $Device shell screencap -p $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  if ((-not (Test-Path $local)) -or ((Get-Item $local).Length -eq 0)) {
    throw "Screenshot was empty: $local"
  }
  return $local
}

function Assert-Contains {
  param(
    [string]$Path,
    [string[]]$Expected
  )
  $content = Get-Content -Raw -Path $Path
  foreach ($value in $Expected) {
    if ($content -notmatch [regex]::Escape($value)) {
      throw "Missing expected UI marker: $value"
    }
  }
}

function Assert-NotContains {
  param(
    [string]$Path,
    [string[]]$Unexpected
  )
  $content = Get-Content -Raw -Path $Path
  foreach ($value in $Unexpected) {
    if ($content -match [regex]::Escape($value)) {
      throw "Unexpected UI marker: $value"
    }
  }
}

function Tap-UiNode {
  param(
    [string]$Path,
    [string]$Marker
  )
  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $escaped = $Marker.Replace("'", "&apos;")
  $node = $hierarchy.SelectSingleNode("//*[contains(@content-desc,'$escaped') or @resource-id='$escaped' or @text='$escaped']")
  if (-not $node -or $node.bounds -notmatch "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
    throw "Unable to tap UI marker: $Marker"
  }
  $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
  $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
  & $adb -s $Device shell input tap $x $y | Out-Null
}

function Dismiss-ExpoMenuIfPresent {
  param([string]$Path)
  $content = Get-Content -Raw -Path $Path
  if ($content -match "This is the developer menu" -and $content -match "Continue") {
    [xml]$hierarchy = $content
    $node = $hierarchy.SelectSingleNode("//*[@content-desc='Continue' or @text='Continue']")
    if ($node -and $node.bounds -match "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
      $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
      $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
      & $adb -s $Device shell input tap $x $y | Out-Null
      Start-Sleep -Seconds 6
      return $true
    }
  }
  if ($content -match "SDK version:" -and $content -match "Runtime version:") {
    & $adb -s $Device shell input keyevent 4 | Out-Null
    Start-Sleep -Seconds 4
    return $true
  }
  return $false
}

function Stop-ExpoProcess {
  param(
    [System.Diagnostics.Process]$Process,
    [int]$ExpoPort
  )
  if ($Process -and -not $Process.HasExited) {
    & taskkill.exe /PID $Process.Id /T /F | Out-Null
  }
  $listeners = Get-NetTCPConnection -LocalPort $ExpoPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $listeners) {
    if ($processId) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

$expo = $null
$previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
$previousMarketMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
$previousApiBase = $env:EXPO_PUBLIC_API_BASE_URL
$previousApiKey = $env:EXPO_PUBLIC_API_KEY
$previousSoftInput = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
$previousDatabaseUrl = $env:DATABASE_URL

try {
  if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/polymarket"
  }
  $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 5
  if ($health.status -ne "ok") {
    throw "Backend health was not ok: $($health | ConvertTo-Json -Compress)"
  }

  $credential = Invoke-JsonCommand -Command {
    Push-Location $repoRoot
    try {
      cmd /c "npx.cmd tsx -r dotenv/config scripts/create_mobile_dev_credential.ts 2>&1"
    } finally {
      Pop-Location
    }
  }
  if (-not $credential.token) {
    throw "Mobile dev credential did not include a token."
  }
  $portfolioRoute = Invoke-RestMethod -Uri "$BackendBaseUrl/api/portfolio" -Headers @{ Authorization = "Bearer $($credential.token)" } -TimeoutSec 8
  if (-not $portfolioRoute) {
    throw "Portfolio route did not return a payload for the mobile credential."
  }

  Push-Location $mobileRoot
  try {
    npm run typecheck

    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"
    $env:EXPO_PUBLIC_API_BASE_URL = $MobileApiBaseUrl
    Remove-Item Env:\EXPO_PUBLIC_API_KEY -ErrorAction SilentlyContinue
    $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"

    $expoLog = Join-Path $mobileRoot "mobile-google-auth-return-expo.log"
    $expoErr = Join-Path $mobileRoot "mobile-google-auth-return-expo-error.log"
    $expo = Start-Process -FilePath "npx.cmd" -ArgumentList @("expo", "start", "--port", "$Port", "--offline", "--clear") -WorkingDirectory $mobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErr -WindowStyle Hidden -PassThru
    Wait-ExpoReady -ReadyPort $Port
  } finally {
    Pop-Location
  }

  & $adb -s $Device get-state | Out-Null
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
  Start-Sleep -Seconds 2

  $encodedApiKey = [uri]::EscapeDataString($credential.token)
  $launchUrl = "exp://${ExpoHost}:$Port/--/?forceResetState=1,googleAuth=success,forcePortfolio=1,forceRuntimePortfolioSync=1,apiKey=$encodedApiKey"
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d "'$launchUrl'" | Out-Null
  Start-Sleep -Seconds 18

  $portfolioXml = Save-UiHierarchy -Name "cycle-$Cycle-google-auth-return-portfolio.xml"
  if (Dismiss-ExpoMenuIfPresent -Path $portfolioXml) {
    $portfolioXml = Save-UiHierarchy -Name "cycle-$Cycle-google-auth-return-portfolio.xml"
  }
  Assert-Contains -Path $portfolioXml -Expected @(
    "portfolio-screen",
    "portfolio-account-google-connected",
    "portfolio-google-login-connected-visible",
    "Google connected",
    "Server profile loaded"
  )
  $portfolioPng = Save-Screenshot -Name "cycle-$Cycle-google-auth-return-portfolio.png"

  $persistenceXml = $null
  $persistencePng = $null
  if ($VerifyPersistence) {
    & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null
    Start-Sleep -Seconds 2
    $portfolioOnlyUrl = "exp://${ExpoHost}:$Port/--/?forcePortfolio=1"
    & $adb -s $Device shell am start -a android.intent.action.VIEW -d "'$portfolioOnlyUrl'" | Out-Null
    Start-Sleep -Seconds 16
    $persistenceXml = Save-UiHierarchy -Name "cycle-$Cycle-google-auth-persisted-portfolio.xml"
    if (Dismiss-ExpoMenuIfPresent -Path $persistenceXml) {
      $persistenceXml = Save-UiHierarchy -Name "cycle-$Cycle-google-auth-persisted-portfolio.xml"
    }
    Assert-Contains -Path $persistenceXml -Expected @(
      "portfolio-screen",
      "portfolio-account-google-connected",
      "portfolio-google-login-connected-visible",
      "Google connected",
      "Server profile loaded"
    )
    $persistencePng = Save-Screenshot -Name "cycle-$Cycle-google-auth-persisted-portfolio.png"
  }

  $logoutAccountXml = $null
  $logoutSignedOutXml = $null
  $logoutSignedOutPng = $null
  if ($VerifyLogout) {
    $accountUrl = "exp://${ExpoHost}:$Port/--/?forceAccount=1"
    & $adb -s $Device shell am start -a android.intent.action.VIEW -d "'$accountUrl'" | Out-Null
    Start-Sleep -Seconds 8
    $logoutAccountXml = Save-UiHierarchy -Name "cycle-$Cycle-google-auth-account-connected.xml"
    Assert-Contains -Path $logoutAccountXml -Expected @(
      "account-screen",
      "account-login-google-connected",
      "account-sign-out-google"
    )
    Tap-UiNode -Path $logoutAccountXml -Marker "account-sign-out-google"
    Start-Sleep -Seconds 8
    $logoutSignedOutXml = Save-UiHierarchy -Name "cycle-$Cycle-google-auth-account-signed-out.xml"
    Assert-Contains -Path $logoutSignedOutXml -Expected @(
      "Continue with Google"
    )
    Assert-NotContains -Path $logoutSignedOutXml -Unexpected @(
      "account-login-google-connected",
      "account-sign-out-google",
      "portfolio-account-google-connected",
      "portfolio-google-login-connected-visible",
      "Server profile loaded"
    )
    $logoutSignedOutPng = Save-Screenshot -Name "cycle-$Cycle-google-auth-account-signed-out.png"
  }

  $summary = [ordered]@{
    cycle = $Cycle
    result = "pass"
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    device = $Device
    backendBaseUrl = $BackendBaseUrl
    mobileApiBaseUrl = $MobileApiBaseUrl
    expoPort = $Port
    keyId = "redacted"
    apiKey = "redacted"
    assertions = [ordered]@{
      portfolioOpened = $true
      googleConnectedVisible = $true
      serverProfileLoadedVisible = $true
      portfolioRouteReadableWithReturnedKey = $true
      persistedReturnedKeyAfterRestart = [bool]$VerifyPersistence
      logoutClearsPersistedCredential = [bool]$VerifyLogout
    }
    artifacts = @(
      $portfolioXml.Replace("$repoRoot\", ""),
      $portfolioPng.Replace("$repoRoot\", "")
    )
  }
  if ($VerifyPersistence) {
    $summary.artifacts += @(
      $persistenceXml.Replace("$repoRoot\", ""),
      $persistencePng.Replace("$repoRoot\", "")
    )
  }
  if ($VerifyLogout) {
    $summary.artifacts += @(
      $logoutAccountXml.Replace("$repoRoot\", ""),
      $logoutSignedOutXml.Replace("$repoRoot\", ""),
      $logoutSignedOutPng.Replace("$repoRoot\", "")
    )
  }
  $summaryPath = Join-Path $resolvedHierarchyOutputDir "cycle-$Cycle-google-auth-return-summary.json"
  $summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -Path $summaryPath
  Write-Host "Proof summary: $summaryPath"
} finally {
  Stop-ExpoProcess -Process $expo -ExpoPort $Port
  if ($null -eq $previousOrderMode) { Remove-Item Env:\EXPO_PUBLIC_ORDER_MODE -ErrorAction SilentlyContinue } else { $env:EXPO_PUBLIC_ORDER_MODE = $previousOrderMode }
  if ($null -eq $previousMarketMode) { Remove-Item Env:\EXPO_PUBLIC_MARKET_DATA_MODE -ErrorAction SilentlyContinue } else { $env:EXPO_PUBLIC_MARKET_DATA_MODE = $previousMarketMode }
  if ($null -eq $previousApiBase) { Remove-Item Env:\EXPO_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue } else { $env:EXPO_PUBLIC_API_BASE_URL = $previousApiBase }
  if ($null -eq $previousApiKey) { Remove-Item Env:\EXPO_PUBLIC_API_KEY -ErrorAction SilentlyContinue } else { $env:EXPO_PUBLIC_API_KEY = $previousApiKey }
  if ($null -eq $previousSoftInput) { Remove-Item Env:\EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT -ErrorAction SilentlyContinue } else { $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = $previousSoftInput }
  if ($null -eq $previousDatabaseUrl) { Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue } else { $env:DATABASE_URL = $previousDatabaseUrl }
}
