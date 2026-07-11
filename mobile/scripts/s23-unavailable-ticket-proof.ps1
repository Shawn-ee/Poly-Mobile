param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8183,
  [string]$ExpoHost = "",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-VX-unavailable-ticket-s23-proof",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-VX-unavailable-ticket-s23-proof"
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
  param([int]$Port)
  for ($attempt = 1; $attempt -le 45; $attempt++) {
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
    Start-Sleep -Seconds 2
  }
  throw "Expo Metro did not become ready on port $Port"
}

function Save-Screenshot {
  param([string]$Name)
  $remote = "/sdcard/$Name"
  $local = Join-Path $ResolvedOutputDir $Name
  & $adb -s $Device shell screencap -p $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  Write-Host "S23 unavailable ticket proof screenshot: $local"
}

function Save-UiHierarchy {
  param([string]$Name)
  $remote = "/sdcard/window-hierarchy.xml"
  $local = Join-Path $ResolvedHierarchyOutputDir $Name
  & $adb -s $Device shell uiautomator dump $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  Write-Host "S23 unavailable ticket proof hierarchy: $local"
  return $local
}

function Assert-HierarchyContains {
  param([string]$Path, [string[]]$Expected)
  $hierarchy = Get-Content -Raw -Path $Path
  foreach ($value in $Expected) {
    if ($hierarchy -notmatch [regex]::Escape($value)) {
      throw "UI hierarchy missing expected text or label: $value"
    }
  }
}

function Assert-HierarchyDoesNotContain {
  param([string]$Path, [string[]]$Unexpected)
  $hierarchy = Get-Content -Raw -Path $Path
  foreach ($value in $Unexpected) {
    if ($hierarchy -match [regex]::Escape($value)) {
      throw "UI hierarchy contains unexpected text or label: $value"
    }
  }
}

function Wait-HierarchyContains {
  param(
    [string]$Name,
    [string[]]$Expected,
    [int]$Attempts = 30,
    [int]$DelaySeconds = 4
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

function Start-DeepLink {
  param([string]$Url)
  & $adb -s $Device shell am start -a android.intent.action.VIEW -d "'$Url'" | Out-Null
}

function Dismiss-ExpoDeveloperMenuIfPresent {
  $path = Save-UiHierarchy -Name "cycle-VX-unavailable-ticket-expo-menu.xml"
  $hierarchy = Get-Content -Raw -Path $path
  if ($hierarchy -match "This is the developer menu" -and $hierarchy -match "Continue") {
    [xml]$xml = $hierarchy
    $node = $xml.SelectSingleNode("//*[@text='Continue' or @content-desc='Continue']")
    if ($node -and $node.bounds -match "^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$") {
      $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
      $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
      & $adb -s $Device shell input tap $x $y | Out-Null
      Start-Sleep -Seconds 2
    }
  }
  if ($hierarchy -match "SDK version:" -and $hierarchy -match "Connected to expo-cli") {
    & $adb -s $Device shell input tap 1000 780 | Out-Null
    Start-Sleep -Seconds 2
  }
}

function Stop-ProofNodeProcesses {
  $mobileRootText = [string]$MobileRoot
  Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -and (
        $_.CommandLine -like "*$mobileRootText*" -or
        $_.CommandLine -like "*expo start --port $Port*"
      )
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

$resolvedExpoHost = if ($ExpoHost) { $ExpoHost } else { Resolve-LanIpv4 }
$adb = (Get-Command adb -ErrorAction Stop).Source
$expoLog = Join-Path $MobileRoot "mobile-s23-unavailable-ticket-proof-expo.log"
$expoErrorLog = Join-Path $MobileRoot "mobile-s23-unavailable-ticket-proof-expo-error.log"
$previousSmokeInputFlag = $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT
$env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = "1"

Push-Location $MobileRoot
try {
  npm run typecheck
  Write-Host "S23 unavailable ticket proof target: $Device"
  Write-Host "Expo host: $resolvedExpoHost"
  Write-Host "Expo port: $Port"

  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null

  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList @("expo", "start", "--port", "$Port", "--offline", "--clear") -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Wait-ExpoReady -Port $Port
  Start-Sleep -Seconds 16

  Start-DeepLink -Url "exp://${resolvedExpoHost}:$Port/--/?forceResetState=1&forceUnavailableTradeTicket=1"
  Start-Sleep -Seconds 10
  Dismiss-ExpoDeveloperMenuIfPresent
  Start-Sleep -Seconds 3

  $ticketPath = Wait-HierarchyContains -Name "cycle-VX-unavailable-ticket.xml" -Expected @(
    "trade-ticket",
    "ticket-market-status-visible",
    "ticket-readonly-market-state",
    "ticket-keypad-readonly-disabled"
  )
  Save-Screenshot -Name "cycle-VX-unavailable-ticket.png"
  Assert-HierarchyContains -Path $ticketPath -Expected @(
    "ticket-market-status-visible",
    "ticket-readonly-market-state",
    "ticket-amount-entry-disabled",
    "ticket-availability-unavailable",
    "ticket-market-status-PROOF_UNAVAILABLE",
    "ticket-side-disabled-readonly",
    "ticket-preset-disabled-readonly",
    "ticket-keypad-readonly-disabled",
    "ticket-keypad-disabled-readonly",
    "ticket-unavailable-footer-compact",
    "ticket-unavailable-single-visible-message",
    "Market unavailable",
    "Trading is disabled for this market."
  )
  Assert-HierarchyDoesNotContain -Path $ticketPath -Unexpected @(
    "SDK version:",
    "Connected to expo-cli",
    "Reload",
    "Show developer action button",
    "Show Performance Monitor",
    "Show Element Inspector"
  )
} finally {
  if ($previousSmokeInputFlag) {
    $env:EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT = $previousSmokeInputFlag
  } else {
    Remove-Item Env:\EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT -ErrorAction SilentlyContinue
  }
  if ($expo -and -not $expo.HasExited) {
    Stop-Process -Id $expo.Id -Force
  }
  Stop-ProofNodeProcesses
  Pop-Location
}
