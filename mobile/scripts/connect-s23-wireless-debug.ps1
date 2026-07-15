param(
  [Parameter(Mandatory = $true)]
  [string]$Address,
  [string]$ExpectedModel = "SM-S911U1",
  [switch]$StayAwake,
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

if ($Address -notmatch "^[^:\s]+:\d+$") {
  throw "Address must look like 172.16.200.27:39897."
}

$connectLines = Invoke-AdbLines -Arguments @("connect", $Address)
$deviceLines = Invoke-AdbLines -Arguments @("devices", "-l")
$deviceList = $deviceLines -join "`n"
$connected = $deviceList -match [regex]::Escape($Address)
$model = $null
$modelMatches = $false
$stayAwakeApplied = $false

if ($connected) {
  $modelResult = Invoke-AdbLines -Arguments @("-s", $Address, "shell", "getprop", "ro.product.model")
  $model = ($modelResult | Select-Object -First 1).Trim()
  $modelMatches = $model -eq $ExpectedModel -or $model -eq $ExpectedModel.Replace("-", "_") -or $model.Replace("_", "-") -eq $ExpectedModel

  if ($StayAwake) {
    Invoke-AdbLines -Arguments @("-s", $Address, "shell", "settings", "put", "global", "stay_on_while_plugged_in", "3") | Out-Null
    $stayAwakeApplied = $true
  }
}

$failures = @()
if (-not $connected) {
  $failures += "ADB did not list the S23 after connecting to $Address."
}
if ($connected -and -not $modelMatches) {
  $failures += "Connected device model '$model' does not match expected S23 model '$ExpectedModel'."
}

$summary = [ordered]@{
  pass = [bool]($failures.Count -eq 0)
  address = $Address
  expectedModel = $ExpectedModel
  connected = [bool]$connected
  model = $model
  modelMatches = [bool]$modelMatches
  stayAwakeApplied = [bool]$stayAwakeApplied
  connectOutput = $connectLines
  adbDevices = $deviceLines
  failures = $failures
}

$resolvedSummaryPath = Resolve-SummaryPath -Path $SummaryPath
if ($resolvedSummaryPath) {
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "S23 WIRELESS CONNECT SUMMARY written to $resolvedSummaryPath"
}

if ($failures.Count -gt 0) {
  Write-Host "BLOCKED S23 wireless connection failed."
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  exit 2
}

Write-Host "PASS S23 connected at $Address, model $model."
if ($stayAwakeApplied) {
  Write-Host "PASS S23 stay-awake while plugged in is enabled."
}
