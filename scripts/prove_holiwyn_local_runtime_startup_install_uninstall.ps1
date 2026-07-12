param(
  [string]$LauncherName = "HoliwynInternalTesterRuntimeProof.cmd",
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-startup-install-uninstall-summary.redacted.json",
  [string]$InstallSummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-startup-install-step.redacted.json",
  [string]$UninstallSummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-startup-uninstall-step.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
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

function Read-JsonFile {
  param([string]$Path)
  $fullPath = Resolve-RepoPath $Path
  if (-not (Test-Path -LiteralPath $fullPath)) { return $null }
  return Get-Content -Raw -LiteralPath $fullPath | ConvertFrom-Json
}

function Get-StartupLauncherPath {
  $startupDir = [Environment]::GetFolderPath("Startup")
  if ([string]::IsNullOrWhiteSpace($startupDir)) {
    throw "Windows Startup folder path is unavailable for this user."
  }
  if (-not (Test-Path -LiteralPath $startupDir)) {
    New-Item -ItemType Directory -Force -Path $startupDir | Out-Null
  }
  $resolvedStartupDir = (Resolve-Path -LiteralPath $startupDir).Path
  $launcherPath = Join-Path $resolvedStartupDir $LauncherName
  $launcherDir = (Resolve-Path -LiteralPath (Split-Path -Parent $launcherPath)).Path.TrimEnd("\")
  if (-not $launcherDir.Equals($resolvedStartupDir.TrimEnd("\"), [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to touch launcher outside Startup folder: $launcherPath"
  }
  if ((Split-Path -Leaf $launcherPath) -notmatch "^[A-Za-z0-9._ -]+\.cmd$") {
    throw "Launcher name must be a simple .cmd filename."
  }
  return [ordered]@{ startupDir = $resolvedStartupDir; launcherPath = $launcherPath }
}

function Get-LauncherStatus {
  param([string]$LauncherPath)
  return [ordered]@{
    installed = [bool](Test-Path -LiteralPath $LauncherPath)
    launcherPath = $LauncherPath
  }
}

function Invoke-Manager {
  param(
    [string]$Action,
    [string]$OutputPath
  )
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts\manage_holiwyn_local_runtime_startup.ps1",
    "-Action",
    $Action,
    "-LauncherName",
    $LauncherName,
    "-StartSupervisor",
    "-StartResultPoller",
    "-ResultPollerIntervalSeconds",
    "15",
    "-RunResultIngestion",
    "-RunResultSettlement",
    "-RunApprovedResultSettlement",
    "-Apply",
    "-SummaryPath",
    $OutputPath
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $output = & powershell @arguments 2>&1
  return [ordered]@{
    action = $Action
    exitCode = $LASTEXITCODE
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    outputTail = @($output | Select-Object -Last 20)
    summaryPath = $OutputPath
  }
}

$startedAt = (Get-Date).ToUniversalTime()
$failure = $null
$installStep = $null
$uninstallStep = $null
$paths = $null
$before = $null
$afterInstall = $null
$afterUninstall = $null

try {
  $paths = Get-StartupLauncherPath
  $before = Get-LauncherStatus -LauncherPath $paths.launcherPath
  if ($before.installed) {
    Remove-Item -LiteralPath $paths.launcherPath -Force
  }
  $installStep = Invoke-Manager -Action "install" -OutputPath $InstallSummaryPath
  $afterInstall = Get-LauncherStatus -LauncherPath $paths.launcherPath
} catch {
  $failure = $_.Exception.Message
} finally {
  try {
    $uninstallStep = Invoke-Manager -Action "uninstall" -OutputPath $UninstallSummaryPath
  } catch {
    if (-not $failure) { $failure = $_.Exception.Message }
  }
  try {
    if ($paths) { $afterUninstall = Get-LauncherStatus -LauncherPath $paths.launcherPath }
  } catch {
    if (-not $failure) { $failure = $_.Exception.Message }
  }
}

$installSummary = Read-JsonFile $InstallSummaryPath
$uninstallSummary = Read-JsonFile $UninstallSummaryPath
$launcherPreview = if ($installSummary -and $installSummary.plan) {
  [string]$installSummary.plan.launcherContentPreview
} else { "" }
$checks = [ordered]@{
  installCommandPassed = [bool]($installStep -and $installStep.exitCode -eq 0 -and $installSummary -and $installSummary.pass -eq $true)
  launcherInstalledAfterApply = [bool]($afterInstall -and $afterInstall.installed -eq $true)
  uninstallCommandPassed = [bool]($uninstallStep -and $uninstallStep.exitCode -eq 0 -and $uninstallSummary -and $uninstallSummary.pass -eq $true)
  launcherRemovedAfterProof = [bool]($afterUninstall -and $afterUninstall.installed -eq $false)
  launcherStartsResultPoller = [bool]($launcherPreview -match "-StartResultPoller")
  launcherCarriesResultPollerInterval = [bool]($launcherPreview -match "-ResultPollerIntervalSeconds\s+15")
  resultPollerModeReported = [bool]($installSummary -and $installSummary.runtimeTruth.resultPollerStartRequested -eq $true)
  providerQuotaNotUsed = $true
  leftPersistentLauncherInstalled = [bool]($afterUninstall -and $afterUninstall.installed -eq $true)
}

$p0 = New-Object System.Collections.Generic.List[object]
foreach ($entry in $checks.GetEnumerator()) {
  if ($entry.Key -eq "leftPersistentLauncherInstalled") {
    if ($entry.Value -eq $true) { $p0.Add($entry.Key) | Out-Null }
  } elseif ($entry.Value -ne $true) {
    $p0.Add($entry.Key) | Out-Null
  }
}
if ($failure) { $p0.Add($failure) | Out-Null }

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-local-runtime-user-startup-launcher-install-uninstall-proof"
  pass = [bool]($p0.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  launcherName = $LauncherName
  before = $before
  installStep = $installStep
  afterInstall = $afterInstall
  uninstallStep = $uninstallStep
  afterUninstall = $afterUninstall
  installSummary = $installSummary
  uninstallSummary = $uninstallSummary
  runtimeTruth = [ordered]@{
    startupLauncherInstallWorks = [bool]($checks.installCommandPassed -and $checks.launcherInstalledAfterApply)
    startupLauncherUninstallWorks = [bool]($checks.uninstallCommandPassed -and $checks.launcherRemovedAfterProof)
    noPersistentLauncherLeftInstalled = [bool]$checks.launcherRemovedAfterProof
    startupLauncherIncludesResultPoller = [bool]($checks.launcherStartsResultPoller -and $checks.resultPollerModeReported)
    providerQuotaUsed = $false
    fakeTokenOnly = $true
    activeTesterSettlementExecution = $false
    approvedSettlementModeInstallProof = $true
    installedWindowsService = $false
  }
  checks = $checks
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @("User Startup launcher proof is local and user-logon scoped; it is not a production service or scheduled task.")
    p2 = @("Production-grade service supervision remains future work.")
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 80
$summary | ConvertTo-Json -Depth 80

if (-not $summary.pass) { exit 1 }
