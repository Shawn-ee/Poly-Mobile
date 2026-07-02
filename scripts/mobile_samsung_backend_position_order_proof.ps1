param(
  [string]$SetupSummaryPath = "docs/mobile/harness/cycle-current-mobile-backend-position-order-setup.json",
  [string]$SummaryPath = "docs/mobile/harness/cycle-current-mobile-samsung-backend-position-order-proof.json",
  [int]$Port = 8175
)

$ErrorActionPreference = "Stop"

function ConvertFrom-FirstJsonObject {
  param([string]$Raw)

  $jsonStart = $Raw.IndexOf("{`r`n  `"ready`"")
  if ($jsonStart -lt 0) {
    $jsonStart = $Raw.IndexOf("{`n  `"ready`"")
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

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedSummaryPath = Join-Path $repoRoot $SummaryPath
$previousApiKey = $env:EXPO_PUBLIC_API_KEY

try {
  Push-Location $repoRoot
  try {
    $setupRaw = cmd /c npx.cmd tsx scripts/create_mobile_backend_position_order_proof.ts --summaryPath=$SetupSummaryPath 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
      throw "Backend position order proof setup failed with exit code $LASTEXITCODE.`n$setupRaw"
    }
    $setup = ConvertFrom-FirstJsonObject -Raw $setupRaw
    $env:EXPO_PUBLIC_API_KEY = $setup.credential.token

    Push-Location (Join-Path $repoRoot "mobile")
    try {
      Invoke-CheckedNative -Label "Samsung backend position order smoke" -Command {
        powershell -ExecutionPolicy Bypass -File .\scripts\smoke-samsung.ps1 -ServerPositionFallbackOrder -Port $Port
      }
    } finally {
      Pop-Location
    }

    $orderSummaryRaw = cmd /c npx.cmd tsx scripts/summarize_mobile_open_order_cancel_proof.ts --username=$($setup.user.username) 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
      throw "Backend position order summary failed with exit code $LASTEXITCODE.`n$orderSummaryRaw"
    }
    $orderSummary = ConvertFrom-FirstJsonObject -Raw $orderSummaryRaw

    $latestOrder = $orderSummary.latestOrder
    if (-not $latestOrder) {
      throw "Backend position order proof did not create an order."
    }
    if ($latestOrder.market.id -ne $setup.market.id) {
      throw "Latest order market did not match proof market."
    }
    if ($latestOrder.outcome.id -ne $setup.outcome.id) {
      throw "Latest order outcome did not match proof outcome."
    }
    if ($latestOrder.side -ne "BUY") {
      throw "Latest order side was not BUY."
    }

    $summary = [ordered]@{
      ready = $true
      port = $Port
      setup = [ordered]@{
        user = $setup.user
        keyId = $setup.credential.keyId
        market = $setup.market
        outcome = $setup.outcome
        seededDepth = $setup.seededDepth
        setupSummaryPath = $SetupSummaryPath
      }
      orderSummary = $orderSummary
      evidence = [ordered]@{
        readyHierarchy = "docs/mobile/harness/cycle-current-holiwyn-server-position-fallback-order-ready.xml"
        ticketHierarchy = "docs/mobile/harness/cycle-current-holiwyn-server-position-fallback-order-ticket.xml"
        portfolioHierarchy = "docs/mobile/harness/cycle-current-holiwyn-server-position-fallback-order-portfolio.xml"
        ticketScreenshot = "docs/mobile/screenshots/cycle-current-holiwyn-server-position-fallback-order-ticket.png"
        portfolioScreenshot = "docs/mobile/screenshots/cycle-current-holiwyn-server-position-fallback-order-portfolio.png"
      }
      summaryPath = $SummaryPath
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $resolvedSummaryPath) | Out-Null
    $summary | ConvertTo-Json -Depth 7 | Set-Content -Path $resolvedSummaryPath -Encoding utf8
    $summary | ConvertTo-Json -Depth 7
  } finally {
    Pop-Location
  }
} finally {
  if ($null -eq $previousApiKey) {
    Remove-Item Env:\EXPO_PUBLIC_API_KEY -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_API_KEY = $previousApiKey
  }
}
