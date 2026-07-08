param(
  [string]$ReferenceModel = "SM_S911U1",
  [string[]]$KnownReferenceEndpoints = @("172.16.200.27:39897", "172.16.200.27:38797"),
  [string]$HoliwynModel = "SM_X526C",
  [string]$SummaryPath = "../docs/mobile/harness/cycle-current-polymarket-reference-device-preflight.json",
  [switch]$ExpectBlocked
)

$ErrorActionPreference = "Stop"

function Invoke-AdbText {
  param([string[]]$Arguments)
  $output = & adb @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  [pscustomobject]@{
    ExitCode = $exitCode
    Output = ($output -join "`n")
  }
}

function Get-AdbDevices {
  $result = Invoke-AdbText -Arguments @("devices", "-l")
  if ($result.ExitCode -ne 0) {
    throw "adb devices failed: $($result.Output)"
  }
  $result.Output -split "`n" |
    Where-Object { $_ -match "\sdevice\s" } |
    ForEach-Object {
      $line = $_.Trim()
      $serial = ($line -split "\s+")[0]
      $model = if ($line -match "model:([^\s]+)") { $matches[1] } else { "" }
      [pscustomobject]@{
        Serial = $serial
        Model = $model
        Line = $line
      }
    }
}

function Get-MdnsServices {
  $result = Invoke-AdbText -Arguments @("mdns", "services")
  if ($result.ExitCode -ne 0) {
    return @()
  }
  $result.Output -split "`n" |
    Where-Object { $_ -match "_adb-tls-connect\._tcp" } |
    ForEach-Object { $_.Trim() }
}

function Test-AdbEndpoint {
  param([string]$Endpoint)
  $result = Invoke-AdbText -Arguments @("connect", $Endpoint)
  [pscustomobject]@{
    Endpoint = $Endpoint
    ExitCode = $result.ExitCode
    Output = $result.Output
    Connected = ($result.Output -match "connected to|already connected")
  }
}

$devicesBefore = @(Get-AdbDevices)
$mdnsBefore = @(Get-MdnsServices)
$connectAttempts = @()

$referenceDevice = $devicesBefore | Where-Object { $_.Model -eq $ReferenceModel } | Select-Object -First 1
if (-not $referenceDevice) {
  foreach ($endpoint in $KnownReferenceEndpoints) {
    $connectAttempts += Test-AdbEndpoint -Endpoint $endpoint
  }
  $devicesAfterConnect = @(Get-AdbDevices)
  $referenceDevice = $devicesAfterConnect | Where-Object { $_.Model -eq $ReferenceModel } | Select-Object -First 1
} else {
  $devicesAfterConnect = $devicesBefore
}

$holiwynDevice = $devicesAfterConnect | Where-Object { $_.Model -eq $HoliwynModel } | Select-Object -First 1
$status = if ($referenceDevice -and $holiwynDevice) { "pass" } elseif ($ExpectBlocked) { "expected_blocked" } else { "blocked" }
$blockingReason = if (-not $referenceDevice) {
  "Reference Android device model $ReferenceModel is not connected or discoverable through adb/mdns."
} elseif (-not $holiwynDevice) {
  "Holiwyn Android proof device model $HoliwynModel is not connected."
} else {
  ""
}

$summary = [pscustomobject]@{
  status = $status
  referenceModel = $ReferenceModel
  holiwynModel = $HoliwynModel
  referenceDevice = $referenceDevice
  holiwynDevice = $holiwynDevice
  devicesBefore = $devicesBefore
  devicesAfterConnect = $devicesAfterConnect
  mdnsBefore = $mdnsBefore
  knownReferenceEndpoints = $KnownReferenceEndpoints
  connectAttempts = $connectAttempts
  blockingReason = $blockingReason
  generatedAt = (Get-Date).ToString("o")
}

$resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
  $SummaryPath
} else {
  Join-Path (Get-Location) $SummaryPath
}
$summaryDir = Split-Path -Parent $resolvedSummaryPath
if ($summaryDir -and -not (Test-Path $summaryDir)) {
  New-Item -ItemType Directory -Force -Path $summaryDir | Out-Null
}
$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8

Write-Host "Polymarket reference device preflight: $status"
if ($referenceDevice) {
  Write-Host "Reference device: $($referenceDevice.Serial) $($referenceDevice.Model)"
} else {
  Write-Host "Reference device missing: $ReferenceModel"
}
if ($holiwynDevice) {
  Write-Host "Holiwyn device: $($holiwynDevice.Serial) $($holiwynDevice.Model)"
} else {
  Write-Host "Holiwyn device missing: $HoliwynModel"
}
Write-Host "Summary: $resolvedSummaryPath"

if ($status -eq "blocked") {
  throw $blockingReason
}
