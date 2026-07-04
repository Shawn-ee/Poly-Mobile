param(
  [string]$Device = "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp",
  [int]$Port = 8278,
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-FI-home-route-server-filled",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-FI-home-route-server-filled"
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
$proofUsername = "holiwyn-mobile-fi-$stamp"
$eventProofPath = "docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-event.json"
$counterpartyProofPath = "docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-counterparty.json"

$previousProofUsername = $env:MOBILE_DEV_USERNAME
$previousApiKey = $env:EXPO_PUBLIC_API_KEY
$previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
$previousMarketDataMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
$previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL

try {
  Push-Location $repoRoot
  try {
    cmd /c npx.cmd tsx scripts/prove_mobile_el_a_provider_breadth.ts --output=$eventProofPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Route-backed provider event proof failed."
    }
    $eventProofFullPath = Join-Path $repoRoot $eventProofPath
    $eventProof = Get-Content -Raw -Path $eventProofFullPath | ConvertFrom-Json
    if (-not $eventProof.pass) {
      throw "Route-backed provider event proof did not pass."
    }

    cmd /c npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts --eventSlug=$($eventProof.eventSlug) --output=$counterpartyProofPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Route-backed spread counterparty seed failed."
    }

    $env:MOBILE_DEV_USERNAME = $proofUsername
    $credentialRaw = cmd /c npm.cmd run mobile:dev-credential 2>&1 | Out-String
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

    powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\smoke-tablet.ps1" `
      -LocalMvpHomeRouteServerFilledFlow `
      -Device $Device `
      -Port $Port `
      -BackendBaseUrl $BackendBaseUrl `
      -ServerEventSlug $eventProof.eventSlug `
      -OutputDir $OutputDir `
      -HierarchyOutputDir $HierarchyOutputDir

    if ($LASTEXITCODE -ne 0) {
      throw "Tablet Home route-backed server filled smoke failed."
    }

    $summaryPath = Join-Path $repoRoot (Join-Path $HierarchyOutputDir "cycle-FI-home-route-server-filled-wrapper.json")
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $summaryPath) | Out-Null
    [ordered]@{
      cycle = "FI"
      result = "pass"
      username = $proofUsername
      userId = $credential.userId
      keyId = $credential.keyId
      token = "redacted"
      eventSlug = $eventProof.eventSlug
      eventProofPath = $eventProofPath
      counterpartyProofPath = $counterpartyProofPath
      tabletProofPath = Join-Path $HierarchyOutputDir "cycle-FI-home-route-server-filled-proof.json"
      orderMode = "server"
      marketDataMode = "server"
      backendBaseUrl = $BackendBaseUrl
    } | ConvertTo-Json -Depth 5 | Set-Content -Path $summaryPath -Encoding utf8
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
}
