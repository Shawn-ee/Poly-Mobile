param(
  [ValidateSet("buy", "sell")]
  [string]$Side = "buy",
  [string]$Username = "",
  [string]$SummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-server-order-proof.json",
  [int]$Port = 0
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

$repoRoot = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$proofUsername = if ($Username) { $Username } else { "holiwyn-mobile-proof-$Side-$stamp" }
$resolvedSummaryPath = Join-Path $repoRoot $SummaryPath

$previousProofUsername = $env:MOBILE_DEV_USERNAME
$previousApiKey = $env:EXPO_PUBLIC_API_KEY

try {
  $env:MOBILE_DEV_USERNAME = $proofUsername

  Push-Location $repoRoot
  try {
    if ($Side -eq "sell") {
      cmd /c npm.cmd run mobile:server-sell-fill-liquidity
    } else {
      cmd /c npm.cmd run mobile:server-order-fill-liquidity
    }

    $credentialRaw = cmd /c npm.cmd run mobile:dev-credential 2>&1 | Out-String
    $credential = ConvertFrom-FirstJsonObject -Raw $credentialRaw
    $env:EXPO_PUBLIC_API_KEY = $credential.token

    Push-Location (Join-Path $repoRoot "mobile")
    try {
      if ($Side -eq "sell") {
        $resolvedPort = if ($Port -gt 0) { $Port } else { 8159 }
        powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerSellOrderFilled -Port $resolvedPort
      } else {
        $resolvedPort = if ($Port -gt 0) { $Port } else { 8158 }
        powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerOrderFilled -Port $resolvedPort
      }
    } finally {
      Pop-Location
    }

    $summary = [ordered]@{
      ready = $true
      side = $Side
      username = $proofUsername
      userId = $credential.userId
      keyId = $credential.keyId
      port = $resolvedPort
      summaryPath = $SummaryPath
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
