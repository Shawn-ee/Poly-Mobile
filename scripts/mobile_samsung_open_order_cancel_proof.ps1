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
    $jsonStart = $Raw.IndexOf("{")
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

function Invoke-ProofNoiseGate {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot,
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [string]$SummaryPath
  )

  Push-Location $RepoRoot
  try {
    Invoke-CheckedNative -Label $Label -Command {
      cmd /c npx.cmd tsx scripts/mobile_proof_noise_report.ts --failOnOpenOrders --failOnLockedBalance --summaryPath=$SummaryPath
    }
    $resolvedGatePath = Join-Path $RepoRoot $SummaryPath
    if (-not (Test-Path $resolvedGatePath)) {
      throw "$Label did not write proof noise gate summary: $SummaryPath."
    }
    return Get-Content -Raw -Path $resolvedGatePath | ConvertFrom-Json
  } finally {
    Pop-Location
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
    $preProofNoiseGate = Invoke-ProofNoiseGate `
      -RepoRoot $repoRoot `
      -Label "Pre-proof noise gate" `
      -SummaryPath "docs/mobile/harness/cycle-current-mobile-samsung-open-order-cancel-proof-noise-gate-pre.json"

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

    $postProofNoiseGate = Invoke-ProofNoiseGate `
      -RepoRoot $repoRoot `
      -Label "Post-proof noise gate" `
      -SummaryPath "docs/mobile/harness/cycle-current-mobile-samsung-open-order-cancel-proof-noise-gate.json"

    $orderSummaryRaw = cmd /c npx.cmd tsx scripts/summarize_mobile_open_order_cancel_proof.ts --username=$proofUsername 2>&1 | Out-String
    $orderSummary = ConvertFrom-FirstJsonObject -Raw $orderSummaryRaw

    $summary = [ordered]@{
      ready = $true
      username = $proofUsername
      userId = $credential.userId
      keyId = $credential.keyId
      port = $Port
      summaryPath = $SummaryPath
      orderSummary = $orderSummary
      proofNoiseGate = [ordered]@{
        pre = $preProofNoiseGate.harnessGate
        post = $postProofNoiseGate.harnessGate
        preSummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-open-order-cancel-proof-noise-gate-pre.json"
        postSummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-open-order-cancel-proof-noise-gate.json"
      }
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
