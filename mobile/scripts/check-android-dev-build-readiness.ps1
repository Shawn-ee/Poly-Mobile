param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp"
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AppJsonPath = Join-Path $MobileRoot "app.json"
$EasJsonPath = Join-Path $MobileRoot "eas.json"
$PackageJsonPath = Join-Path $MobileRoot "package.json"

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $failures.Add($Message) | Out-Null
}

function Add-Warning {
  param([string]$Message)
  $warnings.Add($Message) | Out-Null
}

if (!(Test-Path $AppJsonPath)) {
  Add-Failure "Missing mobile/app.json."
}
if (!(Test-Path $EasJsonPath)) {
  Add-Failure "Missing mobile/eas.json."
}
if (!(Test-Path $PackageJsonPath)) {
  Add-Failure "Missing mobile/package.json."
}

if (Test-Path $AppJsonPath) {
  $appConfig = Get-Content -Raw $AppJsonPath | ConvertFrom-Json
  if ($appConfig.expo.name -ne "Holiwyn") {
    Add-Failure "Expo app name must be Holiwyn."
  }
  if ($appConfig.expo.slug -ne "holiwyn-mobile") {
    Add-Failure "Expo slug must be holiwyn-mobile."
  }
  if ($appConfig.expo.scheme -ne "holiwyn") {
    Add-Failure "Expo scheme must be holiwyn for deep-link/dev-build testing."
  }
  if ($appConfig.expo.android.package -ne "com.holiwyn.mobile") {
    Add-Failure "Android package must be com.holiwyn.mobile."
  }
}

if (Test-Path $EasJsonPath) {
  $easConfig = Get-Content -Raw $EasJsonPath | ConvertFrom-Json
  if ($null -eq $easConfig.build.development) {
    Add-Failure "eas.json must define a development profile."
  } elseif ($easConfig.build.development.android.buildType -ne "apk") {
    Add-Failure "development profile must build an Android APK."
  }
  if ($null -eq $easConfig.build."preview-apk") {
    Add-Failure "eas.json must define a preview-apk profile."
  } elseif ($easConfig.build."preview-apk".android.buildType -ne "apk") {
    Add-Failure "preview-apk profile must build an Android APK."
  }
}

if (Test-Path $PackageJsonPath) {
  $packageConfig = Get-Content -Raw $PackageJsonPath | ConvertFrom-Json
  if ($null -eq $packageConfig.dependencies."expo-dev-client") {
    Add-Warning "expo-dev-client is not installed yet; use preview-apk now, or install expo-dev-client before using the development profile."
  }
}

$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($null -eq $adb) {
  Add-Warning "adb was not found on PATH; Samsung install checks cannot run."
} else {
  $deviceList = (& adb devices -l) -join "`n"
  if ($deviceList -notmatch [regex]::Escape($Device)) {
    Add-Warning "Samsung device '$Device' is not currently visible to adb."
  }
}

Write-Host "Android dev-build readiness:"
Write-Host "- app.json: checked"
Write-Host "- eas.json: checked"
Write-Host "- package.json: checked"

if ($warnings.Count -gt 0) {
  Write-Host "Warnings:"
  foreach ($warning in $warnings) {
    Write-Host "- $warning"
  }
}

if ($failures.Count -gt 0) {
  Write-Host "Failures:"
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  exit 1
}

Write-Host "Result: ready for preview APK configuration."
