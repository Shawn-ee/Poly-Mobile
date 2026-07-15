param(
  [string]$SecretPath = ".runtime\secrets\the-odds-api-key.txt",
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\live-provider-key-preflight.redacted.json",
  [string]$LiveProofSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json",
  [int]$RefreshIterations = 2,
  [int]$MaxCredits = 16,
  [int]$MinRemaining = 2,
  [switch]$RunProviderProof,
  [switch]$ForceProviderRefresh,
  [switch]$SkipSleep
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

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

function Get-SecretStatus {
  param([string]$ResolvedSecretPath)
  $envPresent = -not [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)
  $filePresent = Test-Path -LiteralPath $ResolvedSecretPath
  $fileHasValue = $false
  if ($filePresent) {
    $fileHasValue = -not [string]::IsNullOrWhiteSpace((Get-Content -Raw -LiteralPath $ResolvedSecretPath))
  }
  return [ordered]@{
    envPresent = [bool]$envPresent
    filePresent = [bool]$filePresent
    fileHasValue = [bool]$fileHasValue
    source = if ($envPresent) { "process_env" } elseif ($fileHasValue) { "runtime_secret_file" } else { "missing" }
  }
}

$resolvedSecretPath = Resolve-RepoPath $SecretPath
$resolvedSummaryPath = Resolve-RepoPath $SummaryPath
$secretStatus = Get-SecretStatus $resolvedSecretPath
$runtimePreflightPath = Resolve-RepoPath ".runtime\live-odds-refresh-preflight.redacted.json"
$runtimePreflight = $null
$providerExitCode = $null
$providerRan = $false
$providerError = $null
$providerBlockedReason = $null

if ($RunProviderProof) {
  $previousKey = $env:THE_ODDS_API_KEY
  try {
    if (-not $secretStatus.envPresent) {
      if (-not $secretStatus.fileHasValue) {
        throw "Live provider refresh requires THE_ODDS_API_KEY in the process environment or an ignored local secret file at $SecretPath."
      }
      $env:THE_ODDS_API_KEY = (Get-Content -Raw -LiteralPath $resolvedSecretPath).Trim()
    }

    & npm.cmd run mobile:live-odds-refresh-preflight -- "--summaryPath=$(ConvertTo-RepoPath $runtimePreflightPath)" | Out-Null
    $runtimePreflightExitCode = $LASTEXITCODE
    $runtimePreflight = Get-Content -Raw -LiteralPath $runtimePreflightPath | ConvertFrom-Json
    if ($runtimePreflight.readiness.quotaSpendingLoopRunning -eq $true) {
      $providerBlockedReason = "quota_spending_loop_already_running"
      throw "A quota-spending loop is already reported running; refusing to start another live provider refresh."
    }
    if ($runtimePreflightExitCode -ne 0 -and -not $ForceProviderRefresh) {
      throw "Live odds refresh preflight failed; refusing to spend provider quota."
    }
    if ($runtimePreflight.canRunLiveRefreshNow -ne $true -and -not $ForceProviderRefresh) {
      $providerBlockedReason = "live_refresh_preflight_not_ready"
      throw "Live odds refresh preflight did not mark refresh as runnable; rerun with -ForceProviderRefresh only for an intentional quota-spending override."
    }

    $providerRan = $true
    $args = @(
      "-ExecutionPolicy", "Bypass",
      "-File", "scripts\start_holiwyn_one_event_live_runtime.ps1",
      "-RunProviderProof",
      "-LiveProofSummaryPath", $LiveProofSummaryPath,
      "-RefreshIterations", "$RefreshIterations",
      "-MaxCredits", "$MaxCredits",
      "-MinRemaining", "$MinRemaining",
      "-SkipLiveOddsPreflight"
    )
    if ($ForceProviderRefresh) {
      $args += "-ForceProviderRefresh"
    }
    if ($SkipSleep) {
      $args += "-SkipSleep"
    }
    & powershell @args
    $providerExitCode = $LASTEXITCODE
    if ($providerExitCode -ne 0) {
      throw "Live provider runtime proof failed with exit code $providerExitCode."
    }
  } catch {
    $providerError = $_.Exception.Message
    if (-not $providerExitCode) {
      $providerExitCode = 1
    }
  } finally {
    if ($null -ne $previousKey) {
      $env:THE_ODDS_API_KEY = $previousKey
    } else {
      Remove-Item Env:\THE_ODDS_API_KEY -ErrorAction SilentlyContinue
    }
  }
}

$p1 = New-Object System.Collections.Generic.List[string]
if (-not ($secretStatus.envPresent -or $secretStatus.fileHasValue)) {
  $p1.Add("live_provider_secret_missing")
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-live-provider-secret-preflight"
  pass = [bool]((-not $RunProviderProof -and ($secretStatus.envPresent -or $secretStatus.fileHasValue)) -or ($RunProviderProof -and $providerExitCode -eq 0))
  providerQuotaUsedByPreflight = $false
  providerProofRan = [bool]$providerRan
  providerProofMayHaveUsedQuota = [bool]$providerRan
  providerProofExitCode = $providerExitCode
  providerProofError = $providerError
  providerBlockedReason = $providerBlockedReason
  runtimePreflight = if ($runtimePreflight) {
    [ordered]@{
      path = ConvertTo-RepoPath $runtimePreflightPath
      pass = [bool]$runtimePreflight.pass
      canRunLiveRefreshNow = [bool]$runtimePreflight.canRunLiveRefreshNow
      liveOddsReady = [bool]$runtimePreflight.readiness.liveOddsReady
      providerSnapshotFresh = [bool]$runtimePreflight.readiness.providerSnapshotFresh
      quotaSpendingLoopRunning = [bool]$runtimePreflight.readiness.quotaSpendingLoopRunning
      providerKeyConfigured = [bool]$runtimePreflight.providerKeyConfigured
      providerKeyValuePrinted = [bool]$runtimePreflight.providerKeyValuePrinted
      commandLineContainsSecret = [bool]$runtimePreflight.commandLineContainsSecret
    }
  } else {
    $null
  }
  secret = [ordered]@{
    checked = $true
    source = $secretStatus.source
    envPresent = $secretStatus.envPresent
    filePresent = $secretStatus.filePresent
    fileHasValue = $secretStatus.fileHasValue
    filePath = ConvertTo-RepoPath $resolvedSecretPath
    valuePrinted = $false
    valueStoredInRepo = $false
    gitignoreCoversRuntime = $true
  }
  policy = [ordered]@{
    oneEventOnly = $true
    refreshIterations = $RefreshIterations
    maxCredits = $MaxCredits
    minRemaining = $MinRemaining
    liveProofSummaryPath = $LiveProofSummaryPath
    commandLineContainsSecret = $false
    defaultModeSpendsQuota = $false
    checksNoQuotaRuntimePreflightBeforeProviderRefresh = $true
    refusesConcurrentQuotaSpendingLoop = $true
    forceProviderRefreshAvailable = $true
  }
  nextAction = if ($secretStatus.envPresent -or $secretStatus.fileHasValue) {
    "run_provider_secret_refresh_when_live_mobile_odds_refresh_is_intentional"
  } else {
    "write_the_key_to_ignored_runtime_secret_file_or_set_process_env_before_live_refresh"
  }
  p0 = @()
  p1 = @($p1.ToArray())
  note = "Preflight is local-only and redacted. It never prints the provider key. The secret file path is under .runtime, which is ignored by git. Passing -RunProviderProof may spend provider quota under the existing one-event caps after a no-quota runtime preflight confirms no quota-spending loop is already running."
}

Write-JsonFile -Value $summary -Path $resolvedSummaryPath
$summary | ConvertTo-Json -Depth 20

if ($RunProviderProof -and $providerExitCode -ne 0) {
  exit $providerExitCode
}
