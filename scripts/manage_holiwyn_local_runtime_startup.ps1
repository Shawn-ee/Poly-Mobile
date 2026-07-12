param(
  [ValidateSet("plan", "status", "install", "uninstall")]
  [string]$Action = "status",
  [string]$LauncherName = "HoliwynInternalTesterRuntime.cmd",
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [switch]$StartSupervisor,
  [switch]$StartResultPoller,
  [switch]$RunResultIngestion,
  [switch]$RunResultSettlement,
  [switch]$RunApprovedResultSettlement,
  [string]$ResultSettlementPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [string]$ResultSettlementApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-settlement-approval.redacted.json",
  [switch]$RunProviderProof,
  [switch]$RunLiveResultIngestion,
  [int]$ResultPollerIntervalSeconds = 15,
  [switch]$Apply,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-startup-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
}

function ConvertTo-RepoPath {
  param([string]$Path)
  if ($Path.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $Path.Replace($RepoRoot + "\", "").Replace("\", "/")
  }
  return $Path
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path,
    [int]$Depth = 60
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Get-StartupDirectory {
  $path = [Environment]::GetFolderPath("Startup")
  if ([string]::IsNullOrWhiteSpace($path)) {
    throw "Windows Startup folder path is unavailable for this user."
  }
  if (-not (Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
  }
  return (Resolve-Path -LiteralPath $path).Path
}

function Assert-SafeLauncherPath {
  param([string]$StartupDir, [string]$LauncherPath)
  $fullStartupDir = (Resolve-Path -LiteralPath $StartupDir).Path.TrimEnd("\")
  $fullLauncherDir = (Resolve-Path -LiteralPath (Split-Path -Parent $LauncherPath)).Path.TrimEnd("\")
  if (-not $fullLauncherDir.Equals($fullStartupDir, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to touch launcher outside the user's Startup folder: $LauncherPath"
  }
  $leaf = Split-Path -Leaf $LauncherPath
  if ($leaf -notmatch "^[A-Za-z0-9._ -]+\.cmd$") {
    throw "Launcher name must be a simple .cmd filename."
  }
}

function Build-RuntimeArguments {
  $args = New-Object System.Collections.Generic.List[string]
  $args.Add("-NoProfile") | Out-Null
  $args.Add("-ExecutionPolicy") | Out-Null
  $args.Add("Bypass") | Out-Null
  $args.Add("-File") | Out-Null
  $args.Add("scripts\manage_holiwyn_internal_tester_runtime.ps1") | Out-Null
  $args.Add("-Action") | Out-Null
  $args.Add("start") | Out-Null
  $args.Add("-BackendPort") | Out-Null
  $args.Add("$BackendPort") | Out-Null
  $args.Add("-ExpoPort") | Out-Null
  $args.Add("$ExpoPort") | Out-Null
  $args.Add("-WaitForReady") | Out-Null
  if ($StartSupervisor) { $args.Add("-StartSupervisor") | Out-Null }
  if ($StartResultPoller) {
    $args.Add("-StartResultPoller") | Out-Null
    $args.Add("-ResultPollerIntervalSeconds") | Out-Null
    $args.Add("$ResultPollerIntervalSeconds") | Out-Null
  }
  if ($RunResultIngestion) { $args.Add("-RunResultIngestion") | Out-Null }
  if ($RunResultSettlement) { $args.Add("-RunResultSettlement") | Out-Null }
  if ($RunApprovedResultSettlement) {
    $args.Add("-RunApprovedResultSettlement") | Out-Null
    $args.Add("-ResultSettlementPath") | Out-Null
    $args.Add($ResultSettlementPath) | Out-Null
    $args.Add("-ResultSettlementApprovalPath") | Out-Null
    $args.Add($ResultSettlementApprovalPath) | Out-Null
  }
  if ($RunProviderProof) { $args.Add("-RunProviderProof") | Out-Null }
  if ($RunLiveResultIngestion) { $args.Add("-RunLiveResultIngestion") | Out-Null }
  return $args
}

function Quote-CmdArgument {
  param([string]$Value)
  if ($Value -match '[\s&()^=;!+,`~\[\]{}]') {
    return '"' + ($Value -replace '"', '\"') + '"'
  }
  return $Value
}

function Build-LauncherContent {
  $runtimeArgs = Build-RuntimeArguments
  $argumentString = ($runtimeArgs | ForEach-Object { Quote-CmdArgument $_ }) -join " "
  return @(
    "@echo off",
    "cd /d ""$RepoRoot""",
    "start ""Holiwyn Internal Tester Runtime"" /min powershell.exe $argumentString"
  ) -join "`r`n"
}

function Get-LauncherStatus {
  param([string]$StartupDir, [string]$LauncherPath)
  $exists = Test-Path -LiteralPath $LauncherPath
  $hash = $null
  if ($exists) {
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $LauncherPath).Hash
  }
  return [ordered]@{
    installed = [bool]$exists
    launcherName = Split-Path -Leaf $LauncherPath
    startupDirectory = $StartupDir
    launcherPath = $LauncherPath
    contentSha256 = $hash
  }
}

$startedAt = (Get-Date).ToUniversalTime()
$p0 = New-Object System.Collections.Generic.List[object]
$operation = [ordered]@{
  action = $Action
  apply = [bool]$Apply
  startedAt = $startedAt.ToString("o")
  result = "no_mutation"
}

$startupDir = $null
$launcherPath = $null
$before = $null
$after = $null
$plan = $null

try {
  $startupDir = Get-StartupDirectory
  $launcherPath = Join-Path $startupDir $LauncherName
  Assert-SafeLauncherPath -StartupDir $startupDir -LauncherPath $launcherPath
  if ($RunApprovedResultSettlement -and -not $RunResultSettlement) {
    throw "RunApprovedResultSettlement requires RunResultSettlement."
  }
  $launcherContent = Build-LauncherContent
  $plan = [ordered]@{
    launcherName = $LauncherName
    startupDirectory = $startupDir
    launcherPath = $launcherPath
    repoRoot = $RepoRoot
    launcherContentPreview = $launcherContent
    providerQuotaMode = if ($RunProviderProof -or $RunLiveResultIngestion) {
      "quota-spending modes are explicitly requested and still require THE_ODDS_API_KEY in the user environment"
    } else {
      "default user Startup launcher spends no provider quota"
    }
    resultPollerMode = if ($StartResultPoller) {
      "dedicated result poller will be started by the internal tester runtime manager at user logon"
    } else {
      "dedicated result poller not requested"
    }
    settlementMode = if ($RunApprovedResultSettlement) {
      "approved trusted-result settlement scheduler is requested; execution still waits for CLOSED market and exact approval match"
    } elseif ($RunResultSettlement) {
      "trusted-result settlement scheduler remains dry-run unless separate guarded execution controls are used"
    } else {
      "settlement scheduler not requested"
    }
    startMode = "runs when the Windows user logs in; not a production Windows service"
  }
  $before = Get-LauncherStatus -StartupDir $startupDir -LauncherPath $launcherPath

  if ($Action -eq "install") {
    if (($RunProviderProof -or $RunLiveResultIngestion) -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
      throw "Provider/live-result startup modes require THE_ODDS_API_KEY in the user environment. The key is not read from files or printed."
    }
    if ($Apply) {
      [System.IO.File]::WriteAllText($launcherPath, "$launcherContent`r`n", [System.Text.UTF8Encoding]::new($false))
      $operation.result = "installed_or_updated"
    } else {
      $operation.result = "dry_run_install_plan_only"
    }
  } elseif ($Action -eq "uninstall") {
    if ($Apply) {
      if (Test-Path -LiteralPath $launcherPath) {
        Remove-Item -LiteralPath $launcherPath -Force
      }
      $operation.result = "uninstalled_if_present"
    } else {
      $operation.result = "dry_run_uninstall_plan_only"
    }
  } elseif ($Action -eq "status") {
    $operation.result = if ($before.installed) { "installed" } else { "not_installed" }
  } else {
    $operation.result = "plan_only"
  }

  $after = Get-LauncherStatus -StartupDir $startupDir -LauncherPath $launcherPath
  if ($Action -eq "install" -and $Apply -and -not $after.installed) {
    $p0.Add("startup_launcher_not_installed_after_apply") | Out-Null
  }
  if ($Action -eq "uninstall" -and $Apply -and $after.installed) {
    $p0.Add("startup_launcher_still_installed_after_uninstall") | Out-Null
  }
} catch {
  $p0.Add($_.Exception.Message) | Out-Null
  $operation.result = "failed"
  if ($startupDir -and $launcherPath) {
    try { $after = Get-LauncherStatus -StartupDir $startupDir -LauncherPath $launcherPath } catch {}
  }
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-local-runtime-user-startup-launcher"
  pass = [bool]($p0.Count -eq 0)
  operation = $operation
  plan = $plan
  before = $before
  after = $after
  runtimeTruth = [ordered]@{
    startupLauncherManagerAvailable = [bool]($startupDir -ne $null)
    installedStartupLauncher = [bool]($after -and $after.installed)
    dryRunDefault = [bool](-not $Apply)
    persistentOsStartupMutationRequiresApply = $true
    defaultPlanUsesProviderQuota = [bool]($RunProviderProof -or $RunLiveResultIngestion)
    fakeTokenOnly = $true
    activeTesterSettlementExecution = $false
    approvedSettlementModeRequested = [bool]$RunApprovedResultSettlement
    resultPollerStartRequested = [bool]$StartResultPoller
    resultPollerIntervalSeconds = if ($StartResultPoller) { $ResultPollerIntervalSeconds } else { 0 }
    userLevelStartupFallback = $true
    installedWindowsService = $false
  }
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @("User Startup launcher is a local internal-testing fallback that runs at user logon only; it is not a production service, scheduled daemon, or health-monitored worker.")
    p2 = @("Production service supervision and multi-event runtime install remain future work.")
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 80
$summary | ConvertTo-Json -Depth 80

if (-not $summary.pass) { exit 1 }
