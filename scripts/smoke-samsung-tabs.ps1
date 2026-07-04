param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8180,
  [string]$ExpoHost = "",
  [string]$OutputDir = "docs\mobile\screenshots",
  [string]$HierarchyOutputDir = "docs\mobile\harness"
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
$ResolvedHierarchyOutputDir = Join-Path $RepoRoot $HierarchyOutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $ResolvedHierarchyOutputDir | Out-Null

function Resolve-LanIpv4 {
  $addresses = ipconfig |
    Select-String -Pattern "IPv4 Address|IPv4" |
    ForEach-Object {
      if ($_.Line -match ":\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)") {
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
  if ($preferred) { return $preferred }

  $first = $addresses | Select-Object -First 1
  if ($first) { return $first }

  throw "Could not detect a LAN IPv4 address. Pass -ExpoHost manually."
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
      if ($content -match "packager-status:running") { return }
    } catch {
      # Metro is still warming up.
    }
    Start-Sleep -Seconds $DelaySeconds
  }

  throw "Expo Metro did not become ready on port $Port"
}

function Save-Screenshot {
  param([string]$Name)
  $remote = "/sdcard/$Name"
  $local = Join-Path $ResolvedOutputDir $Name
  & $adb -s $Device shell screencap -p $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  Write-Host "Tab smoke screenshot: $local"
}

function Save-UiHierarchy {
  param([string]$Name)
  $remote = "/sdcard/window-hierarchy.xml"
  $local = Join-Path $ResolvedHierarchyOutputDir $Name
  & $adb -s $Device shell uiautomator dump $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  Write-Host "Tab smoke hierarchy: $local"
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

function Invoke-TapHierarchyNode {
  param(
    [string]$Path,
    [string]$Identifier
  )

  [xml]$hierarchy = Get-Content -Raw -Path $Path
  $node = $hierarchy.SelectSingleNode("//*[@resource-id='$Identifier' or @content-desc='$Identifier']")
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

function Start-DeepLink {
  param([string]$Url)
  $quotedUrl = "'$Url'"
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d $quotedUrl | Out-Null
}

function Dismiss-ExpoDeveloperMenuIfPresent {
  $path = Save-UiHierarchy -Name "cycle-current-holiwyn-tab-smoke-expo-menu.xml"
  $hierarchy = Get-Content -Raw -Path $path
  if ($hierarchy -match "This is the developer menu" -and $hierarchy -match "Continue") {
    Invoke-TapHierarchyNode -Path $path -Identifier "Continue"
    Start-Sleep -Seconds 2
  }
}

function Wait-HierarchyContains {
  param(
    [string]$Name,
    [string[]]$Expected,
    [int]$Attempts = 8,
    [int]$DelaySeconds = 3
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    $path = Save-UiHierarchy -Name $Name
    try {
      Assert-HierarchyContains -Path $path -Expected $Expected
      return $path
    } catch {
      if ($attempt -eq $Attempts) { throw }
      Start-Sleep -Seconds $DelaySeconds
    }
  }
}

$resolvedExpoHost = if ($ExpoHost) { $ExpoHost } else { Resolve-LanIpv4 }
$adb = (Get-Command adb -ErrorAction Stop).Source
$expoLog = Join-Path $MobileRoot "mobile-tab-smoke-expo.log"
$expoErrorLog = Join-Path $MobileRoot "mobile-tab-smoke-expo-error.log"
$previousSmokeInputFlag = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
$env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"

Push-Location $MobileRoot
try {
  npm run typecheck

  Write-Host "Samsung tab smoke target: $Device"
  Write-Host "Expo host: $resolvedExpoHost"
  Write-Host "Expo port: $Port"

  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null

  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList @("expo", "start", "--port", "$Port", "--offline", "--clear") -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Wait-ExpoReady -Port $Port
  Start-Sleep -Seconds 18

  $launchUrl = "exp://${resolvedExpoHost}:$Port/--/?forceResetState=1"
  Start-DeepLink -Url $launchUrl
  Start-Sleep -Seconds 10
  Dismiss-ExpoDeveloperMenuIfPresent

  $homePath = Wait-HierarchyContains -Name "cycle-current-holiwyn-tab-smoke-home.xml" -Expected @("Holiwyn", "World Cup", "Games", "Futures", "holiwyn-home-tab")
  Save-Screenshot -Name "cycle-current-holiwyn-tab-smoke-home.png"

  $tabs = @(
    @{ Name = "live"; Id = "holiwyn-live-tab"; Expected = @("Live World Cup", "5 markets", "11 outcomes", "Australia vs. Egypt", "holiwyn-live-tab") },
    @{ Name = "portfolio"; Id = "holiwyn-portfolio-tab"; Expected = @("Portfolio", "Fake balance", "Open positions", "Recent activity", "holiwyn-portfolio-tab") },
    @{ Name = "search"; Id = "holiwyn-search-tab"; Expected = @("Search World Cup markets", "Top results", "Mexico vs. Ecuador", "holiwyn-search-tab") },
    @{ Name = "account"; Id = "header-account-action"; Expected = @("Account", "Demo balance", "Preferences", "header-account-action") }
  )

  $currentPath = $homePath
  foreach ($tab in $tabs) {
    Invoke-TapHierarchyNode -Path $currentPath -Identifier $tab.Id
    Start-Sleep -Seconds 2
    $currentPath = Wait-HierarchyContains -Name "cycle-current-holiwyn-tab-smoke-$($tab.Name).xml" -Expected $tab.Expected -Attempts 4 -DelaySeconds 2
    Save-Screenshot -Name "cycle-current-holiwyn-tab-smoke-$($tab.Name).png"
  }
} finally {
  if ($previousSmokeInputFlag) {
    $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = $previousSmokeInputFlag
  } else {
    Remove-Item Env:\EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT -ErrorAction SilentlyContinue
  }
  if ($expo -and -not $expo.HasExited) {
    Stop-Process -Id $expo.Id -Force
  }
  Pop-Location
}
