param(
  [ValidateSet("buy", "sell")]
  [string]$Side = "buy",
  [string]$Username = "",
  [string]$SummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-server-order-proof.json",
  [int]$Port = 0,
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp"
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

function Invoke-NativeOutput {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command,
    [Parameter(Mandatory = $true)]
    [string]$Label
  )

  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $raw = & $Command 2>&1 | Out-String
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE. $raw"
  }
  return $raw
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

function Read-LiquiditySummary {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot,
    [Parameter(Mandatory = $true)]
    [string]$Side
  )

  $relativePath = if ($Side -eq "sell") {
    "docs/mobile/harness/cycle-current-mobile-server-sell-fill-liquidity.json"
  } else {
    "docs/mobile/harness/cycle-current-mobile-server-order-fill-liquidity.json"
  }
  $path = Join-Path $RepoRoot $relativePath
  if (-not (Test-Path $path)) {
    throw "Liquidity summary was not written: $relativePath."
  }

  Get-Content -Raw -Path $path | ConvertFrom-Json
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$proofUsername = if ($Username) { $Username } else { "holiwyn-mobile-proof-$Side-$stamp" }
$resolvedSummaryPath = Join-Path $repoRoot $SummaryPath

$previousProofUsername = $env:MOBILE_DEV_USERNAME
$previousApiKey = $env:EXPO_PUBLIC_API_KEY
$previousProofEventId = $env:MOBILE_PROOF_EVENT_ID
$previousProofMarketId = $env:MOBILE_PROOF_MARKET_ID
$previousProofOutcomeId = $env:MOBILE_PROOF_OUTCOME_ID

try {
  $env:MOBILE_DEV_USERNAME = $proofUsername

  Push-Location $repoRoot
  try {
    $preProofNoiseGate = Invoke-ProofNoiseGate `
      -RepoRoot $repoRoot `
      -Label "Pre-proof noise gate" `
      -SummaryPath "docs/mobile/harness/cycle-current-mobile-samsung-server-order-proof-noise-gate-pre.json"

    Invoke-CheckedNative -Label "World Cup proof seed" -Command { cmd /c npx.cmd tsx scripts/import_worldcup_today_markets.ts }
    if ($Side -eq "sell") {
      Invoke-CheckedNative -Label "Sell liquidity preparation" -Command { cmd /c npm.cmd run mobile:server-sell-fill-liquidity }
    } else {
      Invoke-CheckedNative -Label "Buy liquidity preparation" -Command { cmd /c npm.cmd run mobile:server-order-fill-liquidity }
    }
    $liquiditySummary = Read-LiquiditySummary -RepoRoot $repoRoot -Side $Side
    $env:MOBILE_PROOF_EVENT_ID = $liquiditySummary.event.id
    $env:MOBILE_PROOF_MARKET_ID = $liquiditySummary.market.id
    $env:MOBILE_PROOF_OUTCOME_ID = $liquiditySummary.outcome.id

    $credentialRaw = Invoke-NativeOutput -Label "Mobile dev credential" -Command { cmd /c npm.cmd run mobile:dev-credential }
    $credential = ConvertFrom-FirstJsonObject -Raw $credentialRaw
    $env:EXPO_PUBLIC_API_KEY = $credential.token

    Push-Location (Join-Path $repoRoot "mobile")
    try {
      if ($Side -eq "sell") {
        $resolvedPort = if ($Port -gt 0) { $Port } else { 8159 }
        Invoke-CheckedNative -Label "Samsung sell order smoke" -Command {
          powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerSellOrderFilled -Port $resolvedPort -Device $Device
        }
      } else {
        $resolvedPort = if ($Port -gt 0) { $Port } else { 8158 }
        Invoke-CheckedNative -Label "Samsung buy order smoke" -Command {
          powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerOrderFilled -Port $resolvedPort -Device $Device
        }
      }
    } finally {
      Pop-Location
    }

    $postProofNoiseGate = Invoke-ProofNoiseGate `
      -RepoRoot $repoRoot `
      -Label "Post-proof noise gate" `
      -SummaryPath "docs/mobile/harness/cycle-current-mobile-samsung-server-order-proof-noise-gate.json"

    $orderSummaryRaw = Invoke-NativeOutput -Label "Order proof summary" -Command { cmd /c npx.cmd tsx scripts/summarize_mobile_open_order_cancel_proof.ts --username=$proofUsername }
    $orderSummary = ConvertFrom-FirstJsonObject -Raw $orderSummaryRaw

    $summary = [ordered]@{
      ready = $true
      side = $Side
      username = $proofUsername
      userId = $credential.userId
      keyId = $credential.keyId
      port = $resolvedPort
      event = $liquiditySummary.event
      market = $liquiditySummary.market
      outcome = $liquiditySummary.outcome
      makerOrder = $liquiditySummary.makerOrder
      mobileUser = $liquiditySummary.mobileUser
      orderSummary = $orderSummary
      proofNoiseGate = [ordered]@{
        pre = $preProofNoiseGate.harnessGate
        post = $postProofNoiseGate.harnessGate
        preSummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-server-order-proof-noise-gate-pre.json"
        postSummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-server-order-proof-noise-gate.json"
      }
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
  if ($null -eq $previousProofEventId) {
    Remove-Item Env:\MOBILE_PROOF_EVENT_ID -ErrorAction SilentlyContinue
  } else {
    $env:MOBILE_PROOF_EVENT_ID = $previousProofEventId
  }
  if ($null -eq $previousProofMarketId) {
    Remove-Item Env:\MOBILE_PROOF_MARKET_ID -ErrorAction SilentlyContinue
  } else {
    $env:MOBILE_PROOF_MARKET_ID = $previousProofMarketId
  }
  if ($null -eq $previousProofOutcomeId) {
    Remove-Item Env:\MOBILE_PROOF_OUTCOME_ID -ErrorAction SilentlyContinue
  } else {
    $env:MOBILE_PROOF_OUTCOME_ID = $previousProofOutcomeId
  }
}
