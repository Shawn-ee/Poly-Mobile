param(
  [string]$Device = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
  [int]$Port = 8335,
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$EventSlug = "argentina-vs-egypt",
  [string]$ProviderEventSlug = "fifwc-arg-egy-2026-07-07",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-RI-current-route-server-filled",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-RI-current-route-server-filled",
  [switch]$TradeTicketScreenProofOnly
)

$ErrorActionPreference = "Stop"

function Read-JsonStringField {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Raw,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $match = [regex]::Match($Raw, '"' + [regex]::Escape($Name) + '"\s*:\s*"([^"]+)"')
  if (-not $match.Success) {
    throw "Command output did not include JSON field '$Name'."
  }
  return $match.Groups[1].Value
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$proofUsername = "holiwyn-mobile-ri-$stamp"
$restoreProofPath = "docs/mobile/harness/cycle-RI-current-route-server-filled/cycle-RI-current-match-restore.json"
$lineProofPath = "docs/mobile/harness/cycle-RI-current-route-server-filled/cycle-RI-current-match-line-markets.json"
$counterpartyProofPath = "docs/mobile/harness/cycle-RI-current-route-server-filled/cycle-RI-current-route-counterparty.json"

$previousProofUsername = $env:MOBILE_DEV_USERNAME
$previousApiKey = $env:EXPO_PUBLIC_API_KEY
$previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
$previousMarketDataMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
$previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
$previousDatabaseUrl = $env:DATABASE_URL

try {
  Push-Location $repoRoot
  try {
    if (-not $env:DATABASE_URL) {
      $env:DATABASE_URL = "postgresql://" + "postgres:postgres" + "@127.0.0.1:5432/polymarket"
    }

    cmd /c npx.cmd tsx -r dotenv/config scripts/restore_current_mobile_mvp_match.ts --eventSlug=$EventSlug --providerEventSlug=$ProviderEventSlug --output=$restoreProofPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Current MVP provider match restore failed."
    }

    cmd /c npx.cmd tsx -r dotenv/config scripts/seed_mobile_mvp_match_line_markets.ts --eventSlug=$EventSlug --cycle=RI --output=$lineProofPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Current MVP line market seed failed."
    }

    cmd /c npx.cmd tsx -r dotenv/config scripts/seed_mobile_route_spread_counterparty.ts --eventSlug=$EventSlug --marketGroupKey=team-totals --outcomeSide=over --line=1.5 --askSize=200 --mintQuantity=240 --makerBalance=300 --cleanupProofBids --cleanupProofAsks --cleanupBlockingAsks --output=$counterpartyProofPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Current route team-total counterparty seed failed."
    }

    $env:MOBILE_DEV_USERNAME = $proofUsername
    $credentialRaw = cmd /c "npm.cmd run mobile:dev-credential 2>&1" | Out-String
    if ($LASTEXITCODE -ne 0) {
      throw "Mobile dev credential creation failed."
    }
    $credential = [pscustomobject]@{
      userId = Read-JsonStringField -Raw $credentialRaw -Name "userId"
      keyId = Read-JsonStringField -Raw $credentialRaw -Name "keyId"
      token = Read-JsonStringField -Raw $credentialRaw -Name "token"
    }

    $env:EXPO_PUBLIC_API_KEY = $credential.token
    $env:EXPO_PUBLIC_ORDER_MODE = "server"
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"
    $env:EXPO_PUBLIC_API_BASE_URL = $BackendBaseUrl

    $smokeArgs = @(
      "-ExecutionPolicy", "Bypass",
      "-File", "$PSScriptRoot\smoke-tablet.ps1",
      "-LocalMvpCurrentRouteServerFilledFlow",
      "-Port", "$Port",
      "-Device", "$Device",
      "-BackendBaseUrl", "$BackendBaseUrl",
      "-ServerEventSlug", "$EventSlug",
      "-OutputDir", "$OutputDir",
      "-HierarchyOutputDir", "$HierarchyOutputDir"
    )
    if ($TradeTicketScreenProofOnly) {
      $smokeArgs += "-TradeTicketScreenProofOnly"
    }
    & powershell @smokeArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Current route filled mobile proof failed."
    }
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
  if ($null -eq $previousOrderMode) {
    Remove-Item Env:\EXPO_PUBLIC_ORDER_MODE -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_ORDER_MODE = $previousOrderMode
  }
  if ($null -eq $previousMarketDataMode) {
    Remove-Item Env:\EXPO_PUBLIC_MARKET_DATA_MODE -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_MARKET_DATA_MODE = $previousMarketDataMode
  }
  if ($null -eq $previousApiBaseUrl) {
    Remove-Item Env:\EXPO_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:EXPO_PUBLIC_API_BASE_URL = $previousApiBaseUrl
  }
  if ($null -eq $previousDatabaseUrl) {
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $previousDatabaseUrl
  }
}
