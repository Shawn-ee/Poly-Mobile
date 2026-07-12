param(
  [ValidateSet("plan", "status", "install", "uninstall")]
  [string]$Action = "status",
  [string]$TaskName = "HoliwynInternalTesterRuntime",
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [switch]$StartSupervisor,
  [switch]$StartResultPoller,
  [switch]$RunResultIngestion,
  [switch]$RunResultSettlement,
  [switch]$RunApprovedResultSettlement,
  [string]$ResultSettlementPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [string]$ResultSettlementApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-audit-approved.redacted.json",
  [switch]$RunProviderProof,
  [switch]$RunLiveResultIngestion,
  [int]$ResultPollerIntervalSeconds = 15,
  [switch]$AtLogon,
  [string]$DailyAt = "",
  [switch]$Apply,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\local-runtime-task-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RuntimeDir = Join-Path $RepoRoot ".runtime\holiwyn-local-runtime-task"
$TaskOutPath = Join-Path $RuntimeDir "scheduled-task.out.log"
$TaskErrPath = Join-Path $RuntimeDir "scheduled-task.err.log"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
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
    [int]$Depth = 50
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
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
      lastRunTime = if ($info) { $info.LastRunTime.ToUniversalTime().ToString("o") } else { $null }
      nextRunTime = if ($info -and $info.NextRunTime -and $info.NextRunTime.Year -gt 1900) { $info.NextRunTime.ToUniversalTime().ToString("o") } else { $null }
      lastTaskResult = if ($info) { $info.LastTaskResult } else { $null }
      triggerCount = @($task.Triggers).Count
      actionCount = @($task.Actions).Count
    }
  } catch {
    return [ordered]@{
      installed = $false
      taskName = $Name
      state = "not_found"
      error = $null
    }
  }
}

function Build-TaskCommand {
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

function Build-TaskPlan {
  $taskArgs = Build-TaskCommand
  $argumentString = ($taskArgs | ForEach-Object {
    if ($_ -match "\s") { "`"$_`"" } else { $_ }
  }) -join " "
  $triggers = New-Object System.Collections.Generic.List[object]
  if ($AtLogon -or [string]::IsNullOrWhiteSpace($DailyAt)) {
    $triggers.Add([ordered]@{ type = "AtLogon"; enabled = $true }) | Out-Null
  }
  if (-not [string]::IsNullOrWhiteSpace($DailyAt)) {
    $triggers.Add([ordered]@{ type = "Daily"; at = $DailyAt; enabled = $true }) | Out-Null
  }
  return [ordered]@{
    taskName = $TaskName
    workingDirectory = $RepoRoot
    executable = "powershell.exe"
    arguments = $argumentString
    logs = [ordered]@{
      stdout = ConvertTo-RepoPath $TaskOutPath
      stderr = ConvertTo-RepoPath $TaskErrPath
    }
    triggerPlan = @($triggers | ForEach-Object { $_ })
    providerQuotaMode = if ($RunProviderProof -or $RunLiveResultIngestion) {
      "quota-spending modes are explicitly requested and still require THE_ODDS_API_KEY in the scheduled task environment"
    } else {
      "default scheduled task plan spends no provider quota"
    }
    resultPollerMode = if ($StartResultPoller) {
      "dedicated result poller will be started by the internal tester runtime manager"
    } else {
      "dedicated result poller not requested"
    }
    settlementMode = if ($RunResultSettlement) {
      if ($RunApprovedResultSettlement) {
        "approved trusted-result settlement scheduler is requested; execution still waits for CLOSED market and exact approval match"
      } else {
        "trusted-result settlement scheduler remains dry-run unless separate guarded execution controls are used"
      }
    } else {
      "settlement scheduler not requested"
    }
  }
}

function Install-Task {
  param([object]$Plan)
  if (($RunProviderProof -or $RunLiveResultIngestion) -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
    throw "Provider/live-result scheduled modes require THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
  }
  $action = New-ScheduledTaskAction `
    -Execute $Plan.executable `
    -Argument $Plan.arguments `
    -WorkingDirectory $Plan.workingDirectory
  $triggers = New-Object System.Collections.Generic.List[object]
  foreach ($trigger in $Plan.triggerPlan) {
    if ($trigger.type -eq "AtLogon") {
      $triggers.Add((New-ScheduledTaskTrigger -AtLogOn)) | Out-Null
    } elseif ($trigger.type -eq "Daily") {
      $triggers.Add((New-ScheduledTaskTrigger -Daily -At ([DateTime]::Parse($trigger.at)))) | Out-Null
    }
  }
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 12)
  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($triggers | ForEach-Object { $_ }) `
    -Settings $settings `
    -Description "Holiwyn local internal tester runtime. Fake-token local development only." `
    -Force | Out-Null
}

$startedAt = (Get-Date).ToUniversalTime()
$plan = Build-TaskPlan
$before = Get-TaskStatus $TaskName
$operation = [ordered]@{
  action = $Action
  apply = [bool]$Apply
  startedAt = $startedAt.ToString("o")
  result = "no_mutation"
}
$p0 = New-Object System.Collections.Generic.List[object]

try {
  if ($RunApprovedResultSettlement -and -not $RunResultSettlement) {
    throw "RunApprovedResultSettlement requires RunResultSettlement."
  }
  if ($Action -eq "install") {
    if ($Apply) {
      Install-Task -Plan $plan
      $operation.result = "installed_or_updated"
    } else {
      $operation.result = "dry_run_install_plan_only"
    }
  } elseif ($Action -eq "uninstall") {
    if ($Apply) {
      Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
      $operation.result = "uninstalled_if_present"
    } else {
      $operation.result = "dry_run_uninstall_plan_only"
    }
  } elseif ($Action -eq "status") {
    $operation.result = if ($before.installed) { "installed" } else { "not_installed" }
  } else {
    $operation.result = "plan_only"
  }
} catch {
  $p0.Add($_.Exception.Message) | Out-Null
  $operation.result = "failed"
}

$after = Get-TaskStatus $TaskName
if ($Action -eq "install" -and $Apply -and -not $after.installed) {
  $p0.Add("scheduled_task_not_installed_after_apply") | Out-Null
}
if ($Action -eq "uninstall" -and $Apply -and $after.installed) {
  $p0.Add("scheduled_task_still_installed_after_uninstall") | Out-Null
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-local-runtime-scheduled-task"
  pass = [bool]($p0.Count -eq 0)
  operation = $operation
  plan = $plan
  before = $before
  after = $after
  runtimeTruth = [ordered]@{
    scheduledTaskManagerAvailable = $true
    installedScheduledTask = [bool]$after.installed
    dryRunDefault = [bool](-not $Apply)
    persistentOsTaskMutationRequiresApply = $true
    fakeTokenOnly = $true
    defaultPlanUsesProviderQuota = [bool]($RunProviderProof -or $RunLiveResultIngestion)
    activeTesterSettlementExecution = $false
    approvedSettlementModeRequested = [bool]$RunApprovedResultSettlement
    resultPollerStartRequested = [bool]$StartResultPoller
    resultPollerIntervalSeconds = if ($StartResultPoller) { $ResultPollerIntervalSeconds } else { 0 }
  }
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = if ($after.installed) {
      @("Installed local scheduled task exists, but production service monitoring and official-result active-event execution remain future work.")
    } else {
      @("Local scheduled-task installer exists but is not installed unless run with -Apply.", "Official-result active-event execution remains guarded/manual.")
    }
    p2 = @("Multi-event production service supervision remains future work.")
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 60
$summary | ConvertTo-Json -Depth 60

if (-not $summary.pass) { exit 1 }
