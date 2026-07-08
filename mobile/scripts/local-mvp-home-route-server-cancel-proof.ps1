param(
  [string]$Device = "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp",
  [int]$Port = 8277,
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$OutputDir = "docs\mobile\screenshots\cycle-OB-current-mvp-home-server-cancel",
  [string]$HierarchyOutputDir = "docs\mobile\harness\cycle-OB-current-mvp-home-server-cancel"
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
$proofUsername = "holiwyn-mobile-ob-$stamp"
$inspectionProofPath = "docs/mobile/harness/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-state-inspection.json"

$previousProofUsername = $env:MOBILE_DEV_USERNAME
$previousApiKey = $env:EXPO_PUBLIC_API_KEY
$previousOrderMode = $env:EXPO_PUBLIC_ORDER_MODE
$previousMarketDataMode = $env:EXPO_PUBLIC_MARKET_DATA_MODE
$previousApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL

try {
  Push-Location $repoRoot
  try {
    cmd /c npx.cmd tsx scripts/inspect_mobile_mvp_current_state.ts --cycle=OB --output=$inspectionProofPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Current MVP state inspection failed."
    }
    $inspectionProofFullPath = Join-Path $repoRoot $inspectionProofPath
    $inspectionProof = Get-Content -Raw -Path $inspectionProofFullPath | ConvertFrom-Json
    if ($inspectionProof.result -ne "inspection-pass") {
      throw "Current MVP state inspection did not pass."
    }
    if (-not $inspectionProof.selectedMvpEvent.slug) {
      throw "Current MVP state inspection did not select an event slug."
    }
    $selectedEventSlug = $inspectionProof.selectedMvpEvent.slug
    $selectedEventTitle = $inspectionProof.selectedMvpEvent.title
    Write-Host "Current MVP selected event: $selectedEventSlug ($selectedEventTitle)"

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
      -LocalMvpHomeRouteServerCancelFlow `
      -Device $Device `
      -Port $Port `
      -BackendBaseUrl $BackendBaseUrl `
      -ServerEventSlug $selectedEventSlug `
      -OutputDir $OutputDir `
      -HierarchyOutputDir $HierarchyOutputDir

    if ($LASTEXITCODE -ne 0) {
      throw "S23 Home route-backed server cancel smoke failed."
    }

    $summaryPath = Join-Path $repoRoot (Join-Path $HierarchyOutputDir "cycle-OB-current-mvp-home-server-cancel-wrapper.json")
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $summaryPath) | Out-Null
    [ordered]@{
      cycle = "OB"
      result = "pass"
      username = $proofUsername
      userId = $credential.userId
      keyId = "redacted"
      token = "redacted"
      eventSlug = $selectedEventSlug
      eventTitle = $selectedEventTitle
      inspectionProofPath = $inspectionProofPath
      androidProofPath = Join-Path $HierarchyOutputDir "cycle-OB-current-mvp-home-server-cancel-proof.json"
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
