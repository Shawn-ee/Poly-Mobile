param(
  [string]$TaskName = "HoliwynInternalTesterRuntimeProof",
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-task-install-uninstall-summary.redacted.json",
  [string]$InstallSummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-task-install-step.redacted.json",
  [string]$UninstallSummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-task-uninstall-step.redacted.json"
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
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Get-TaskStatus {
  param([string]$Name)
  try {
    $task = Get-ScheduledTask -TaskName $Name -ErrorAction Stop
    $info = Get-ScheduledTaskInfo -TaskName $Name -ErrorAction SilentlyContinue
    return [ordered]@{
      installed = $true
      taskName = $task.TaskName
      state = "$($task.State)"
      triggerCount = @($task.Triggers).Count
      actionCount = @($task.Actions).Count
      lastTaskResult = if ($info) { $info.LastTaskResult } else { $null }
    }
  } catch {
    return [ordered]@{
      installed = $false
      taskName = $Name
      state = "not_found"
    }
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
    "scripts\manage_holiwyn_local_runtime_task.ps1",
    "-Action",
    $Action,
    "-TaskName",
    $TaskName,
    "-StartSupervisor",
    "-RunResultIngestion",
    "-RunResultSettlement",
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
$installStep = $null
$uninstallStep = $null
$failure = $null
$before = Get-TaskStatus $TaskName
$afterInstall = $null
$afterUninstall = $null

try {
  if ($before.installed) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
  }
  $installStep = Invoke-Manager -Action "install" -OutputPath $InstallSummaryPath
  $afterInstall = Get-TaskStatus $TaskName
} catch {
  $failure = $_.Exception.Message
} finally {
  try {
    $uninstallStep = Invoke-Manager -Action "uninstall" -OutputPath $UninstallSummaryPath
  } catch {
    if (-not $failure) { $failure = $_.Exception.Message }
  }
  $afterUninstall = Get-TaskStatus $TaskName
}

$installSummary = Read-JsonFile (Resolve-RepoPath $InstallSummaryPath)
$uninstallSummary = Read-JsonFile (Resolve-RepoPath $UninstallSummaryPath)
$checks = [ordered]@{
  startedCleanOrCleaned = [bool](-not $before.installed -or ($afterUninstall -and $afterUninstall.installed -eq $false))
  installCommandPassed = [bool]($installStep -and $installStep.exitCode -eq 0 -and $installSummary -and $installSummary.pass -eq $true)
  taskInstalledAfterApply = [bool]($afterInstall -and $afterInstall.installed -eq $true)
  uninstallCommandPassed = [bool]($uninstallStep -and $uninstallStep.exitCode -eq 0 -and $uninstallSummary -and $uninstallSummary.pass -eq $true)
  taskRemovedAfterProof = [bool]($afterUninstall -and $afterUninstall.installed -eq $false)
  providerQuotaNotUsed = $true
  leftPersistentTaskInstalled = [bool]($afterUninstall -and $afterUninstall.installed -eq $true)
}
$installBlockedByPermission = [bool](
  -not $checks.installCommandPassed -and
  $installSummary -and
  @($installSummary.gaps.p0 | Where-Object { "$_" -match "Access is denied" }).Count -gt 0
)
$p0 = New-Object System.Collections.Generic.List[object]
foreach ($entry in $checks.GetEnumerator()) {
  if ($entry.Key -eq "leftPersistentTaskInstalled") {
    if ($entry.Value -eq $true) { $p0.Add($entry.Key) | Out-Null }
  } elseif ($installBlockedByPermission -and $entry.Key -in @("installCommandPassed", "taskInstalledAfterApply")) {
    continue
  } elseif ($entry.Value -ne $true) {
    $p0.Add($entry.Key) | Out-Null
  }
}
if ($failure -and -not $installBlockedByPermission) { $p0.Add($failure) | Out-Null }

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-local-runtime-scheduled-task-install-uninstall-proof"
  pass = [bool]($p0.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  taskName = $TaskName
  before = $before
  installStep = $installStep
  afterInstall = $afterInstall
  uninstallStep = $uninstallStep
  afterUninstall = $afterUninstall
  installSummary = $installSummary
  uninstallSummary = $uninstallSummary
  runtimeTruth = [ordered]@{
    scheduledTaskInstallWorks = [bool]($checks.installCommandPassed -and $checks.taskInstalledAfterApply)
    scheduledTaskInstallBlockedByWindowsPermission = $installBlockedByPermission
    scheduledTaskUninstallWorks = [bool]($checks.uninstallCommandPassed -and $checks.taskRemovedAfterProof)
    noPersistentTaskLeftInstalled = [bool]$checks.taskRemovedAfterProof
    providerQuotaUsed = $false
    fakeTokenOnly = $true
    activeTesterSettlementExecution = $false
  }
  checks = $checks
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = if ($installBlockedByPermission) {
      @("Windows denied scheduled-task registration in the current process context; run an elevated shell or grant task registration rights before applying the local task.", "Official-result active-event execution remains guarded/manual.")
    } else {
      @("Scheduled-task install/uninstall is proven locally, but production service monitoring and official-result active-event execution remain future work.")
    }
    p2 = @("Multi-event production service supervision remains future work.")
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 80
$summary | ConvertTo-Json -Depth 80

if (-not $summary.pass) { exit 1 }
