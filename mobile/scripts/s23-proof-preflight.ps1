param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [string]$ExpectedModel = "SM-S911U1",
  [switch]$ExpectBlocked,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

function Invoke-AdbLines {
  param([string[]]$Arguments)
  try {
    return @(& adb @Arguments 2>&1)
  } catch {
    return @("ADB_ERROR: $($_.Exception.Message)")
  }
}

function Resolve-SummaryPath {
  param([string]$Path)
  if (-not $Path.Trim()) {
    return ""
  }
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return Join-Path $MobileRoot $Path
}

$deviceLines = Invoke-AdbLines -Arguments @("devices", "-l")
$mdnsLines = Invoke-AdbLines -Arguments @("mdns", "services")
$deviceList = $deviceLines -join "`n"
$mdnsList = $mdnsLines -join "`n"

$deviceReachable = $deviceList -match [regex]::Escape($Device)
$modelMatches = $false
$model = $null

if ($deviceReachable) {
  $modelResult = Invoke-AdbLines -Arguments @("-s", $Device, "shell", "getprop", "ro.product.model")
  $model = ($modelResult | Select-Object -First 1).Trim()
  $modelMatches = $model -eq $ExpectedModel -or $model -eq $ExpectedModel.Replace("-", "_") -or $model.Replace("_", "-") -eq $ExpectedModel
}

$mdnsDiscoverable = $mdnsList -match [regex]::Escape($Device) -or $mdnsList -match "_adb-tls-connect._tcp"
$failures = @()
if (-not $deviceReachable) {
  $failures += "S23 proof device is not attached to adb: $Device"
}
if (-not $mdnsDiscoverable) {
  $failures += "No adb wireless debugging service is discoverable through mdns."
}
if ($deviceReachable -and -not $modelMatches) {
  $failures += "Attached device model '$model' does not match expected S23 model '$ExpectedModel'."
}

$ready = $failures.Count -eq 0
$summary = [ordered]@{
  ready = [bool]$ready
  expectedBlocked = [bool]$ExpectBlocked
  device = $Device
  expectedModel = $ExpectedModel
  deviceReachable = [bool]$deviceReachable
  mdnsDiscoverable = [bool]$mdnsDiscoverable
  model = $model
  modelMatches = [bool]$modelMatches
  adbDevices = $deviceLines
  mdnsServices = $mdnsLines
  failures = $failures
  nextActions = @(
    "Turn on Wireless debugging on the Samsung S23.",
    "Pair/connect the phone with adb if mdns shows a new host:port.",
    "Rerun this preflight before starting Android screenshot/XML proof."
  )
}

$resolvedSummaryPath = Resolve-SummaryPath -Path $SummaryPath
if ($resolvedSummaryPath) {
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "S23 PROOF PREFLIGHT SUMMARY written to $resolvedSummaryPath"
}

if (-not $ready) {
  Write-Host "BLOCKED S23 proof preflight is not ready."
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  if ($ExpectBlocked) {
    Write-Host "PASS S23 proof preflight blocked as expected."
    exit 0
  }
  exit 2
}

if ($ExpectBlocked) {
  throw "Expected S23 proof preflight to block, but all checks passed."
}

Write-Host "PASS S23 proof preflight is ready for Android screenshot/XML proof."
