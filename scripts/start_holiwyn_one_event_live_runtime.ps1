param(
  [int]$BackendPort = 3002,
  [string]$BackendBaseUrl = "",
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-runtime-launch-summary.redacted.json",
  [string]$LiveProofSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json",
  [int]$MaxProofAgeHours = 24,
  [switch]$RestartBackend,
  [switch]$RunProviderProof,
  [switch]$SeedMaker,
  [int]$RefreshIterations = 2,
  [int]$MaxCredits = 16,
  [int]$MinRemaining = 2,
  [switch]$SkipSleep
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ResolvedBackendBaseUrl = if ($BackendBaseUrl.Trim()) {
  $BackendBaseUrl.Trim().TrimEnd("/")
} else {
  "http://127.0.0.1:$BackendPort"
}

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return Join-Path $RepoRoot $Path
}

function ConvertTo-RepoPath {
  param([string]$Path)
  return $Path.Replace($RepoRoot + "\", "").Replace("\", "/")
}

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path,
    [int]$Depth = 20
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Test-HttpHealth {
  param([string]$Url)
  try {
    $body = Invoke-RestMethod -Uri "$Url/api/health" -TimeoutSec 8
    return [ordered]@{
      ok = [bool]($body.status -eq "ok" -and $body.db -eq "connected")
      body = $body
      error = $null
    }
  } catch {
    return [ordered]@{
      ok = $false
      body = $null
      error = $_.Exception.Message
    }
  }
}

function Get-PortListeners {
  param([int[]]$Ports)
  try {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $Ports -contains $_.LocalPort } |
      Select-Object LocalAddress, LocalPort, OwningProcess)
  } catch {
    return @()
  }
}

function Get-DockerPostgresStatus {
  try {
    $rows = @(docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>$null)
    $postgres = $rows | Where-Object { $_ -match "postgres|poly_postgres" } | Select-Object -First 1
    if (-not $postgres) {
      return [ordered]@{ ok = $false; status = "not_found"; raw = @($rows) }
    }
    return [ordered]@{ ok = [bool]($postgres -match "healthy|Up"); status = $postgres; raw = @($rows) }
  } catch {
    return [ordered]@{ ok = $false; status = "docker_unavailable"; error = $_.Exception.Message; raw = @() }
  }
}

function Invoke-AdbWithTimeout {
  param(
    [string[]]$Arguments,
    [int]$TimeoutSeconds = 5
  )
  $tempOut = [System.IO.Path]::GetTempFileName()
  $tempErr = [System.IO.Path]::GetTempFileName()
  try {
    $process = Start-Process `
      -FilePath "adb" `
      -ArgumentList $Arguments `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $tempOut `
      -RedirectStandardError $tempErr `
      -PassThru
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch {}
      return [ordered]@{ ok = $false; timedOut = $true; output = ""; error = "adb timed out after ${TimeoutSeconds}s" }
    }
    $stdout = if (Test-Path -LiteralPath $tempOut) { Get-Content -Raw -LiteralPath $tempOut } else { "" }
    $stderr = if (Test-Path -LiteralPath $tempErr) { Get-Content -Raw -LiteralPath $tempErr } else { "" }
    $exitCode = $process.ExitCode
    return [ordered]@{
      ok = [bool]($exitCode -eq 0 -or ($null -eq $exitCode -and [string]::IsNullOrWhiteSpace($stderr)))
      timedOut = $false
      exitCode = $exitCode
      output = $stdout
      error = $stderr
    }
  } catch {
    return [ordered]@{ ok = $false; timedOut = $false; output = ""; error = $_.Exception.Message }
  } finally {
    Remove-Item -LiteralPath $tempOut, $tempErr -Force -ErrorAction SilentlyContinue
  }
}

function Get-S23Status {
  try {
    $adbResult = Invoke-AdbWithTimeout -Arguments @("devices", "-l")
    if (-not $adbResult.ok) {
      return [ordered]@{
        connected = $false
        deviceId = $null
        model = $null
        raw = $adbResult.output
        adbTimedOut = [bool]$adbResult.timedOut
        error = $adbResult.error
      }
    }
    $devices = @($adbResult.output -split "`r?`n" | Where-Object { $_ -match "\sdevice\s" })
    $line = $devices |
      Where-Object { $_ -match "adb-R3CW20LFMLW|R3CW20LFMLW|SM_S911U1|model:SM_S911U1" } |
      Select-Object -First 1
    $serial = if ($line -and $line -match "^(\S+)") { $Matches[1] } else { $null }
    return [ordered]@{
      connected = [bool]$line
      deviceId = $serial
      model = if ($line -and $line -match "model:([^ ]+)") { $Matches[1] } else { $null }
      raw = $line
      adbTimedOut = $false
    }
  } catch {
    return [ordered]@{ connected = $false; deviceId = $null; model = $null; error = $_.Exception.Message }
  }
}

function Get-ProofFreshness {
  param(
    [string]$Path,
    [int]$MaxAgeHours
  )
  $json = Read-JsonFile $Path
  if (-not $json) {
    return [ordered]@{
      present = $false
      pass = $false
      fresh = $false
      reason = "missing"
      summaryPath = ConvertTo-RepoPath $Path
    }
  }
  $generatedAt = [string]$json.generatedAt
  $ageHours = $null
  $fresh = $false
  if ($generatedAt) {
    try {
      $parsed = [datetimeoffset]::Parse($generatedAt)
      $ageHours = [math]::Round(((Get-Date).ToUniversalTime() - $parsed.UtcDateTime).TotalHours, 2)
      $fresh = [bool]($ageHours -ge 0 -and $ageHours -le $MaxAgeHours)
    } catch {
      $ageHours = $null
      $fresh = $false
    }
  }
  return [ordered]@{
    present = $true
    pass = [bool]($json.pass -eq $true -or $json.result -eq "pass")
    fresh = $fresh
    reason = if ($fresh) { "fresh" } else { "stale_or_unparseable" }
    generatedAt = $generatedAt
    ageHours = $ageHours
    maxAgeHours = $MaxAgeHours
    summaryPath = ConvertTo-RepoPath $Path
    event = $json.event
    selectedMarket = $json.selectedMarket
    marketMaker = $json.marketMaker
    gaps = $json.gaps
  }
}

$backendStart = $null
$backendHealthBefore = Test-HttpHealth $ResolvedBackendBaseUrl
if ($RestartBackend -or -not $backendHealthBefore.ok) {
  $backendSummaryPath = "docs\mobile\harness\odds-api-live-runtime\backend-start-summary.json"
  $backendCommand = "powershell -ExecutionPolicy Bypass -File scripts/start_holiwyn_internal_beta_backend.ps1 -Port $BackendPort -SummaryPath `"$backendSummaryPath`""
  if ($RestartBackend) {
    $backendCommand += " -Restart"
  }
  cmd /c $backendCommand | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Backend start/check failed."
  }
  $backendStart = Read-JsonFile (Resolve-RepoPath $backendSummaryPath)
}
$backendHealthAfter = Test-HttpHealth $ResolvedBackendBaseUrl
if (-not $backendHealthAfter.ok) {
  throw "Backend is not healthy at $ResolvedBackendBaseUrl."
}

$liveProofExitCode = $null
if ($RunProviderProof) {
  if ([string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
    throw "RunProviderProof requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
  }
  $proofArgs = @(
    "npm", "run", "mobile:odds-api-live-runtime-proof", "--",
    "--baseUrl=$ResolvedBackendBaseUrl",
    "--summaryPath=$LiveProofSummaryPath",
    "--refreshIterations=$RefreshIterations",
    "--maxCredits=$MaxCredits",
    "--minRemaining=$MinRemaining"
  )
  if ($SkipSleep) {
    $proofArgs += "--skipSleep"
  }
  & $proofArgs[0] $proofArgs[1..($proofArgs.Count - 1)]
  $liveProofExitCode = $LASTEXITCODE
  if ($liveProofExitCode -ne 0) {
    throw "One-event live provider proof failed."
  }
}

$resolvedLiveProofSummaryPath = Resolve-RepoPath $LiveProofSummaryPath
if (-not $RunProviderProof -and -not (Test-Path -LiteralPath $resolvedLiveProofSummaryPath)) {
  $canonicalLiveProofSummaryPath = Resolve-RepoPath "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json"
  if (Test-Path -LiteralPath $canonicalLiveProofSummaryPath) {
    $resolvedLiveProofSummaryPath = $canonicalLiveProofSummaryPath
  }
}
$liveProof = Get-ProofFreshness -Path $resolvedLiveProofSummaryPath -MaxAgeHours $MaxProofAgeHours
$makerSeed = $null
if ($SeedMaker) {
  $makerSeedPath = "docs\mobile\harness\odds-api-live-runtime\shifted-maker-seed-summary.redacted.json"
  cmd /c npm run mobile:one-event-live-maker-seed -- "--summaryPath=$makerSeedPath" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Local shifted maker seeding failed."
  }
  $makerSeed = Read-JsonFile (Resolve-RepoPath $makerSeedPath)
}
$docker = Get-DockerPostgresStatus
$s23 = Get-S23Status
$listeners = @(Get-PortListeners @(3002, 8081, 8289))

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-live-runtime-launch"
  pass = [bool]($backendHealthAfter.ok -and $docker.ok -and $liveProof.present -and $liveProof.pass)
  backend = [ordered]@{
    baseUrl = $ResolvedBackendBaseUrl
    healthBefore = $backendHealthBefore
    healthAfter = $backendHealthAfter
    startSummary = $backendStart
  }
  dockerPostgres = $docker
  s23 = $s23
  provider = [ordered]@{
    liveProofRanThisLaunch = [bool]$RunProviderProof
    liveProofExitCode = $liveProofExitCode
    quotaPolicy = [ordered]@{
      oneEventOnly = $true
      maxCredits = $MaxCredits
      minRemaining = $MinRemaining
      refreshIterations = $RefreshIterations
      keySource = "THE_ODDS_API_KEY process environment only"
      cachedModeUsesQuota = $false
    }
    proof = $liveProof
  }
  runtime = [ordered]@{
    backendContinuous = $true
    providerRefreshContinuous = $false
    marketMakerContinuous = $false
    makerSeededThisLaunch = [bool]$SeedMaker
    makerSeedSummary = $makerSeed
    mode = if ($RunProviderProof) { "bounded-live-provider-proof" } else { "cached-proof-runtime-check" }
    notes = @(
      "Backend can stay running locally on the configured port.",
      "Provider refresh is bounded proof mode unless a future daemon is added.",
      "Market-maker quotes are seeded by the proof runner and are not an unattended daemon.",
      "Automatic event close/suspend and official-result settlement remain documented P1 gaps."
    )
  }
  listeners = $listeners
  commands = [ordered]@{
    cachedCheck = "npm run mobile:one-event-live-runtime"
    cachedCheckWithMaker = "npm run mobile:one-event-live-runtime -- -SeedMaker"
    liveProviderProof = "set THE_ODDS_API_KEY in the local process, then npm run mobile:one-event-live-runtime:provider"
    s23VisibleProof = "npm run mobile:the-odds-api-s23-visible-flow -- -SkipReplaySeed -HomeExpectedTitle `"Spain vs. France`" -TeamAExpected `"France`" -TeamBExpected `"Spain`""
  }
}

$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
Write-JsonFile -Value $summary -Path $resolvedSummaryPath -Depth 30
$summary | ConvertTo-Json -Depth 30

if (-not $summary.pass) {
  exit 1
}
