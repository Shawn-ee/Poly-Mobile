param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$ApkPath = ".\dist\holiwyn-preview.apk",
  [string]$PackageName = "com.holiwyn.mobile",
  [string]$LaunchUrl = "holiwyn://qa?forcePortfolio=1",
  [string]$SummaryPath = "..\docs\mobile\harness\cycle-current-samsung-apk-smoke.json",
  [switch]$AllowMissing
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ResolvedApkPath = if ([System.IO.Path]::IsPathRooted($ApkPath)) { $ApkPath } else { Join-Path $MobileRoot $ApkPath }
$ResolvedSummaryPath = Join-Path $MobileRoot $SummaryPath
$adb = Get-Command adb -ErrorAction SilentlyContinue

function Write-Summary {
  param(
    [bool]$Ready,
    [string]$Status,
    [string]$Blocker = "",
    [string]$Foreground = "",
    [string]$ProcessState = ""
  )
  $summary = [ordered]@{
    ready = $Ready
    status = $Status
    blocker = $Blocker
    checkedAt = (Get-Date).ToUniversalTime().ToString("o")
    device = $Device
    apkPath = $ResolvedApkPath
    packageName = $PackageName
    launchUrl = $LaunchUrl
    foreground = $Foreground
    processState = $ProcessState
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ResolvedSummaryPath) | Out-Null
  $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $ResolvedSummaryPath -Encoding utf8
  $summary | ConvertTo-Json -Depth 5
}

if ($null -eq $adb) {
  Write-Summary -Ready $false -Status "blocked" -Blocker "adb_not_found"
  exit 1
}

$deviceList = (& adb devices -l) -join "`n"
if ($deviceList -notmatch [regex]::Escape($Device)) {
  Write-Summary -Ready $false -Status "blocked" -Blocker "samsung_not_visible"
  exit 1
}

if (!(Test-Path $ResolvedApkPath)) {
  Write-Summary -Ready $false -Status "blocked" -Blocker "apk_missing"
  if ($AllowMissing) {
    exit 0
  }
  exit 1
}

& adb -s $Device install -r $ResolvedApkPath | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Summary -Ready $false -Status "blocked" -Blocker "apk_install_failed"
  exit 1
}

& adb -s $Device shell monkey -p $PackageName -c android.intent.category.LAUNCHER 1 | Out-Null
Start-Sleep -Seconds 3
& adb -s $Device shell am start -a android.intent.action.VIEW -d "'$LaunchUrl'" | Out-Null
Start-Sleep -Seconds 5

$windowState = (& adb -s $Device shell dumpsys window) -join "`n"
$processState = (& adb -s $Device shell dumpsys activity processes) -join "`n"
$focusLines = (($windowState -split "`n") | Where-Object { $_ -match "mCurrentFocus|mFocusedApp" }) -join "`n"
if ($windowState -match "Application Error: $([regex]::Escape($PackageName))" -or $processState -match "mCrashing=true") {
  Write-Summary -Ready $false -Status "blocked" -Blocker "apk_launch_crashed" -Foreground $focusLines -ProcessState "mCrashing=true"
  exit 1
}
if ($focusLines -notmatch [regex]::Escape($PackageName)) {
  Write-Summary -Ready $false -Status "blocked" -Blocker "apk_not_foreground" -Foreground $focusLines
  exit 1
}

Write-Summary -Ready $true -Status "installed_and_launched" -Foreground $focusLines -ProcessState "running"
