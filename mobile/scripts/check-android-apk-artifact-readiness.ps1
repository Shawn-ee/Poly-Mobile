param(
  [string]$ApkPath = ".\dist\holiwyn-preview.apk",
  [string]$SummaryPath = "..\docs\mobile\harness\cycle-current-android-apk-artifact-readiness.json"
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$ResolvedApkPath = if ([System.IO.Path]::IsPathRooted($ApkPath)) { $ApkPath } else { Join-Path $MobileRoot $ApkPath }
$ResolvedSummaryPath = Join-Path $MobileRoot $SummaryPath

$AppJsonPath = Join-Path $MobileRoot "app.json"
$EasJsonPath = Join-Path $MobileRoot "eas.json"
$PackageJsonPath = Join-Path $MobileRoot "package.json"
$AndroidProjectPath = Join-Path $MobileRoot "android"
$GradleWrapperPath = Join-Path $AndroidProjectPath "gradlew.bat"
$ExpoBinPath = Join-Path $MobileRoot "node_modules\.bin\expo.cmd"
$LocalEasBinPath = Join-Path $MobileRoot "node_modules\.bin\eas.cmd"
$ExpoDevClientPath = Join-Path $MobileRoot "node_modules\expo-dev-client"
$AndroidSdkFromEnv = [Environment]::GetEnvironmentVariable("ANDROID_HOME")
$AndroidSdkFallback = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$AndroidSdkPath = if ($AndroidSdkFromEnv) { $AndroidSdkFromEnv } else { $AndroidSdkFallback }

$findings = New-Object System.Collections.Generic.List[object]
$blockers = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$nextActions = New-Object System.Collections.Generic.List[string]

function Add-Finding {
  param([string]$Id, [bool]$Ready, [string]$Detail)
  $findings.Add([ordered]@{
    id = $Id
    ready = $Ready
    detail = $Detail
  }) | Out-Null
}

function Add-Unique {
  param($List, [string]$Value)
  if (!$List.Contains($Value)) {
    $List.Add($Value) | Out-Null
  }
}

$hasAppJson = Test-Path $AppJsonPath
$hasEasJson = Test-Path $EasJsonPath
$hasPackageJson = Test-Path $PackageJsonPath
$hasApk = Test-Path $ResolvedApkPath
$hasAndroidProject = Test-Path $AndroidProjectPath
$hasGradleWrapper = Test-Path $GradleWrapperPath
$hasExpoBin = Test-Path $ExpoBinPath
$hasLocalEasBin = Test-Path $LocalEasBinPath
$hasExpoDevClient = Test-Path $ExpoDevClientPath
$hasAndroidSdk = $AndroidSdkPath -and (Test-Path $AndroidSdkPath)
$hasPlatformTools = $hasAndroidSdk -and (Test-Path (Join-Path $AndroidSdkPath "platform-tools\adb.exe"))
$javaCommand = Get-Command java -ErrorAction SilentlyContinue
$easCommand = Get-Command eas -ErrorAction SilentlyContinue

Add-Finding "apk-file" $hasApk $(if ($hasApk) { "APK exists at $ResolvedApkPath." } else { "APK is missing at $ResolvedApkPath." })
Add-Finding "expo-config" $hasAppJson $(if ($hasAppJson) { "mobile/app.json exists." } else { "mobile/app.json is missing." })
Add-Finding "eas-config" $hasEasJson $(if ($hasEasJson) { "mobile/eas.json exists." } else { "mobile/eas.json is missing." })
Add-Finding "package-config" $hasPackageJson $(if ($hasPackageJson) { "mobile/package.json exists." } else { "mobile/package.json is missing." })
Add-Finding "local-expo-cli" $hasExpoBin $(if ($hasExpoBin) { "Local Expo CLI shim exists." } else { "Local Expo CLI shim is missing." })
Add-Finding "eas-cli" ($hasLocalEasBin -or ($null -ne $easCommand)) $(if ($hasLocalEasBin) { "Local EAS CLI shim exists." } elseif ($null -ne $easCommand) { "Global EAS CLI exists at $($easCommand.Source)." } else { "EAS CLI is not installed locally or globally." })
Add-Finding "android-sdk" $hasAndroidSdk $(if ($hasAndroidSdk) { "Android SDK exists at $AndroidSdkPath." } else { "Android SDK not found from ANDROID_HOME or LOCALAPPDATA fallback." })
Add-Finding "android-platform-tools" $hasPlatformTools $(if ($hasPlatformTools) { "Android platform-tools adb.exe exists." } else { "Android platform-tools adb.exe is missing." })
Add-Finding "java" ($null -ne $javaCommand) $(if ($null -ne $javaCommand) { "Java exists at $($javaCommand.Source)." } else { "Java was not found on PATH." })
Add-Finding "native-android-project" $hasAndroidProject $(if ($hasAndroidProject) { "mobile/android exists." } else { "mobile/android does not exist; managed Expo project has not been prebuilt locally." })
Add-Finding "gradle-wrapper" $hasGradleWrapper $(if ($hasGradleWrapper) { "Gradle wrapper exists." } else { "Gradle wrapper is not available because mobile/android is not generated." })
Add-Finding "expo-dev-client" $hasExpoDevClient $(if ($hasExpoDevClient) { "expo-dev-client is installed." } else { "expo-dev-client is not installed; preview APK is the current managed-build lane." })

if (!$hasApk) {
  Add-Unique $blockers "apk_missing"
  Add-Unique $nextActions "Build or provide mobile/dist/holiwyn-preview.apk, then run npm run smoke:samsung:apk."
}
if (!$hasEasJson -or !$hasAppJson -or !$hasPackageJson) {
  Add-Unique $blockers "apk_config_missing"
  Add-Unique $nextActions "Restore missing mobile app/build configuration before attempting an APK build."
}
if (!$hasLocalEasBin -and $null -eq $easCommand) {
  Add-Unique $warnings "EAS CLI is unavailable; cloud/local EAS builds cannot be launched from this workspace yet."
  Add-Unique $nextActions "Install eas-cli or use an existing generated APK artifact."
}
if (!$hasAndroidProject) {
  Add-Unique $warnings "No native Android project exists; local Gradle builds require a prebuild step, while EAS can build from managed Expo config."
}
if (!$hasGradleWrapper) {
  Add-Unique $warnings "No Gradle wrapper exists; local APK assembly is unavailable until mobile/android is generated."
}
if (!$hasExpoDevClient) {
  Add-Unique $warnings "expo-dev-client is not installed; the immediate path is preview-apk rather than a dev-client APK."
}
if (!$hasAndroidSdk -or !$hasPlatformTools) {
  Add-Unique $warnings "Android SDK/platform-tools are incomplete for local install checks."
}
if ($null -eq $javaCommand) {
  Add-Unique $warnings "Java is missing from PATH; local Android builds will fail until Java is configured."
}

$canRunApkSmoke = $hasApk -and $hasPlatformTools
$canAttemptCloudEasBuild = $hasAppJson -and $hasEasJson -and $hasPackageJson -and ($hasLocalEasBin -or ($null -ne $easCommand))
$canAttemptLocalGradleBuild = $hasAndroidProject -and $hasGradleWrapper -and $hasAndroidSdk -and ($null -ne $javaCommand)
$ready = $hasApk -and $canRunApkSmoke

if ($canAttemptCloudEasBuild -and !$hasApk) {
  Add-Unique $nextActions "Run EAS preview-apk build and copy the resulting artifact to mobile/dist/holiwyn-preview.apk."
}
if ($canAttemptLocalGradleBuild -and !$hasApk) {
  Add-Unique $nextActions "Run the Gradle wrapper inside mobile/android to produce an installable debug/release APK."
}
if (!$canAttemptCloudEasBuild -and !$canAttemptLocalGradleBuild -and !$hasApk) {
  Add-Unique $nextActions "Use the managed preview-apk lane once EAS CLI is available, or explicitly generate mobile/android before local Gradle assembly."
}

$blockerItems = $blockers.ToArray()
$warningItems = $warnings.ToArray()
$findingItems = $findings.ToArray()
$nextActionItems = $nextActions.ToArray()

$status = "apk_artifact_missing"
if ($hasApk -and $canRunApkSmoke) {
  $status = "apk_ready_for_samsung_smoke"
} elseif ($hasApk) {
  $status = "apk_present_install_tooling_incomplete"
}

$summary = @{
  ready = $ready
  status = $status
  checkedAt = (Get-Date).ToUniversalTime().ToString("o")
  repoRoot = $RepoRoot.Path
  mobileRoot = $MobileRoot.Path
  apkPath = $ResolvedApkPath
  buildCapabilities = @{
    canRunApkSmoke = $canRunApkSmoke
    canAttemptCloudEasBuild = $canAttemptCloudEasBuild
    canAttemptLocalGradleBuild = $canAttemptLocalGradleBuild
  }
  blockers = $blockerItems
  warnings = $warningItems
  findings = $findingItems
  nextActions = $nextActionItems
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ResolvedSummaryPath) | Out-Null
$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $ResolvedSummaryPath -Encoding utf8

Write-Host "Android APK artifact readiness:"
Write-Host "- status: $($summary.status)"
Write-Host "- APK: $ResolvedApkPath"
Write-Host "- summary: $ResolvedSummaryPath"
if ($blockers.Count -gt 0) {
  Write-Host "Blockers:"
  foreach ($blocker in $blockers) {
    Write-Host "- $blocker"
  }
}
if ($warnings.Count -gt 0) {
  Write-Host "Warnings:"
  foreach ($warning in $warnings) {
    Write-Host "- $warning"
  }
}
