param(
  [string]$Device = "emulator-5554",
  [int]$Port = 8082,
  [string]$OutputDir = "docs\mobile\screenshots",
  [string]$BackendBaseUrl = "http://127.0.0.1:3000",
  [switch]$Deep
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

function Save-Screenshot {
  param(
    [string]$Name
  )
  $remote = "/sdcard/$Name"
  $local = Join-Path $ResolvedOutputDir $Name
  & $adb -s $Device shell screencap -p $remote | Out-Null
  & $adb -s $Device pull $remote $local | Out-Null
  Write-Host "Smoke screenshot: $local"
}

Push-Location $MobileRoot
try {
  npm run typecheck

  try {
    $health = Invoke-RestMethod -Uri "$BackendBaseUrl/api/health" -TimeoutSec 4
    Write-Host "Backend health: $($health.status)"
  } catch {
    Write-Host "Backend health: unavailable, continuing with app mock fallback."
  }

  $adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if (-not (Test-Path $adb)) {
    throw "ADB not found at $adb"
  }

  & $adb -s $Device reverse "tcp:$Port" "tcp:$Port" | Out-Null
  & $adb -s $Device shell am force-stop host.exp.exponent | Out-Null

  $expoLog = Join-Path $MobileRoot "mobile-smoke-expo.log"
  $expoErrorLog = Join-Path $MobileRoot "mobile-smoke-expo-error.log"
  $expo = Start-Process -FilePath "npx.cmd" -ArgumentList @("expo", "start", "--host", "localhost", "--port", "$Port") -WorkingDirectory $MobileRoot -RedirectStandardOutput $expoLog -RedirectStandardError $expoErrorLog -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds 8

  & $adb -s $Device shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:$Port" | Out-Null
  Start-Sleep -Seconds 10

  Save-Screenshot -Name "cycle-current-holiwyn-smoke.png"

  if ($Deep) {
    & $adb -s $Device shell input tap 230 850 | Out-Null
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-ticket.png"

    & $adb -s $Device shell input tap 540 1740 | Out-Null
    Start-Sleep -Seconds 1
    Save-Screenshot -Name "cycle-current-holiwyn-portfolio.png"
  }
}
finally {
  if ($expo -and -not $expo.HasExited) {
    Stop-Process -Id $expo.Id -Force
  }
  Pop-Location
}
