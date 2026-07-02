param(
  [string]$Username = "",
  [string]$SummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-open-order-cancel-proof.json",
  [int]$Port = 8156
)

$ErrorActionPreference = "Stop"

function ConvertFrom-FirstJsonObject {
  param([string]$Raw)

  $jsonStart = $Raw.IndexOf("{`r`n  `"userId`"")
  if ($jsonStart -lt 0) {
    $jsonStart = $Raw.IndexOf("{`n  `"userId`"")
  }
  if ($jsonStart -lt 0) {
    throw "Command did not emit a parseable JSON object."
  }

  return $Raw.Substring($jsonStart) | ConvertFrom-Json
}

function Invoke-CheckedNative {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command,
    [Parameter(Mandatory = $true)]
    [string]$Label
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE."
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$proofUsername = if ($Username) { $Username } else { "holiwyn-mobile-open-cancel-$stamp" }
$resolvedSummaryPath = Join-Path $repoRoot $SummaryPath

$previousProofUsername = $env:MOBILE_DEV_USERNAME
$previousApiKey = $env:EXPO_PUBLIC_API_KEY

try {
  $env:MOBILE_DEV_USERNAME = $proofUsername

  Push-Location $repoRoot
  try {
    Invoke-CheckedNative -Label "World Cup proof seed" -Command { cmd /c npx.cmd tsx scripts/import_worldcup_today_markets.ts }

    $credentialRaw = cmd /c npm.cmd run mobile:dev-credential 2>&1 | Out-String
    $credential = ConvertFrom-FirstJsonObject -Raw $credentialRaw
    $env:EXPO_PUBLIC_API_KEY = $credential.token

    Push-Location (Join-Path $repoRoot "mobile")
    try {
      Invoke-CheckedNative -Label "Samsung open-order cancel smoke" -Command {
        powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerOpenOrderCancel -Port $Port
      }
    } finally {
      Pop-Location
    }

    $summary = [ordered]@{
      ready = $true
      username = $proofUsername
      userId = $credential.userId
      keyId = $credential.keyId
      port = $Port
      summaryPath = $SummaryPath
      evidence = [ordered]@{
        portfolioXml = "docs/mobile/harness/cycle-current-holiwyn-server-order-success-portfolio.xml"
        canceledXml = "docs/mobile/harness/cycle-current-holiwyn-server-open-order-canceled.xml"
        portfolioScreenshot = "docs/mobile/screenshots/cycle-current-holiwyn-server-order-success-portfolio.png"
        canceledScreenshot = "docs/mobile/screenshots/cycle-current-holiwyn-server-open-order-canceled.png"
      }
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $resolvedSummaryPath) | Out-Null
    $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $resolvedSummaryPath -Encoding utf8
    $summary | ConvertTo-Json -Depth 5
  } finally {
    Pop-Location
  }
} finally {
  if ($null -eq $previousProofUsername) {
    Remove-Item Env:\MOBILE_DEV_USERNAME -ErrorAction SilentlyContinue
  } else {
    $env:MOBILE_DEV_USERNAME = $previousProofUsername
  }
  if ($null -eq $previousApiKey) {
    Remove-Item Env:\EXPO_PUBLIC_API_KEY -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_API_KEY = $previousApiKey
  }
}
