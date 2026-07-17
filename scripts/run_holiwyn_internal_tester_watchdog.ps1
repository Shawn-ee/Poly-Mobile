param(
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [int]$MaxIterations = 1,
  [int]$IntervalSeconds = 15,
  [switch]$Continuous,
  [switch]$RequireSupervisor,
  [switch]$RequireResultPoller,
  [switch]$RunResultIngestion,
  [switch]$RunResultSettlement,
  [switch]$RunApprovedResultSettlement,
  [switch]$RunProviderProof,
  [switch]$RunLiveResultIngestion,
  [switch]$DryRun,
  [switch]$StopLoopProcessesAfterRun,
  [switch]$SkipSleep,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\internal-tester-watchdog-summary.redacted.json"
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
    [int]$Depth = 80
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

function Get-NestedBool {
  param([object]$Value, [string[]]$Path)
  $cursor = $Value
  foreach ($key in $Path) {
    if (-not $cursor) { return $false }
    if (-not ($cursor.PSObject.Properties.Name -contains $key)) { return $false }
    $cursor = $cursor.$key
  }
  return [bool]$cursor
}

function Invoke-CapturedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $output = cmd /c $Command 2>&1
  return [ordered]@{
    label = $Label
    command = $Command
    exitCode = $LASTEXITCODE
    pass = [bool]($LASTEXITCODE -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    outputTail = @($output | Select-Object -Last 30)
  }
}

function Invoke-RuntimeManager {
  param([string[]]$ManagerArgs)
  $startedAt = (Get-Date).ToUniversalTime()
  $output = & powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_internal_tester_runtime.ps1 @ManagerArgs 2>&1
  return [ordered]@{
    label = "internal-tester-runtime-manager"
    args = @($ManagerArgs)
    exitCode = $LASTEXITCODE
    pass = [bool]($LASTEXITCODE -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    outputTail = @($output | Select-Object -Last 30)
  }
}

function Get-ManagerSummary {
  param([string]$StatusPath)
  return Read-JsonFile (Resolve-RepoPath $StatusPath)
}

function Get-Readiness {
  param([object]$Summary)
  return [ordered]@{
    backend = Get-NestedBool $Summary @("readiness", "backendReady")
    expo = Get-NestedBool $Summary @("readiness", "expoReady")
    postgres = Get-NestedBool $Summary @("readiness", "postgresReady")
    s23 = Get-NestedBool $Summary @("readiness", "s23Connected")
  }
}

if ($Continuous -and $MaxIterations -gt 0) {
  throw "Use either -Continuous or -MaxIterations, not both. Pass -Continuous for an open-ended local watchdog."
}
if ($RunProviderProof -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
  throw "RunProviderProof requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
}
if ($RunLiveResultIngestion -and [string]::IsNullOrWhiteSpace($env:THE_ODDS_API_KEY)) {
  throw "RunLiveResultIngestion requires THE_ODDS_API_KEY in the process environment. The key is not read from files or printed."
}

$startedAt = (Get-Date).ToUniversalTime()
$iterations = New-Object System.Collections.Generic.List[object]
$commands = New-Object System.Collections.Generic.List[object]
$statusPath = "docs\mobile\harness\odds-api-live-runtime\internal-tester-runtime-manager-summary.redacted.json"
$maxLoopCount = if ($Continuous) { [int]::MaxValue } else { [Math]::Max(1, $MaxIterations) }
$iteration = 0

while ($iteration -lt $maxLoopCount) {
  $iteration += 1
  $iterationStartedAt = (Get-Date).ToUniversalTime()

  $statusResult = Invoke-RuntimeManager -ManagerArgs @(
    "-Action", "status",
    "-BackendPort", "$BackendPort",
    "-ExpoPort", "$ExpoPort",
    "-SummaryPath", $statusPath
  )
  $commands.Add($statusResult) | Out-Null
  $statusSummary = Get-ManagerSummary $statusPath
  $readyBefore = Get-Readiness $statusSummary
  $baseRuntimeReady = [bool]($readyBefore.backend -and $readyBefore.expo -and $readyBefore.postgres)

  $startResult = $null
  $readyAfter = $readyBefore
  if (-not $baseRuntimeReady -and -not $DryRun) {
    $startResult = Invoke-RuntimeManager -ManagerArgs @(
      "-Action", "start",
      "-BackendPort", "$BackendPort",
      "-ExpoPort", "$ExpoPort",
      "-WaitForReady",
      "-SummaryPath", $statusPath
    )
    $commands.Add($startResult) | Out-Null
    $statusSummary = Get-ManagerSummary $statusPath
    $readyAfter = Get-Readiness $statusSummary
    $baseRuntimeReady = [bool]($readyAfter.backend -and $readyAfter.expo -and $readyAfter.postgres)
  }

  $supervisorProof = $null
  if ($RequireSupervisor -and -not $DryRun) {
    $supervisorProof = Invoke-CapturedCommand `
      -Label "foreground-repeated-supervisor-proof" `
      -Command "npm run mobile:one-event-live-supervisor:continuous-proof"
    $commands.Add($supervisorProof) | Out-Null
  }

  $resultPollerProof = $null
  if ($RequireResultPoller -and -not $DryRun) {
    $resultPollerProof = Invoke-CapturedCommand `
      -Label "background-result-poller-proof" `
      -Command "npm run mobile:one-event-result-poller:continuous-proof"
    $commands.Add($resultPollerProof) | Out-Null
  }

  $runtimePass = [bool](
    $baseRuntimeReady -and
    ((-not $RequireSupervisor) -or ($supervisorProof -and $supervisorProof.pass)) -and
    ((-not $RequireResultPoller) -or ($resultPollerProof -and $resultPollerProof.pass))
  )

  $iterations.Add([ordered]@{
    iteration = $iteration
    startedAt = $iterationStartedAt.ToString("o")
    completedAt = (Get-Date).ToUniversalTime().ToString("o")
    readyBeforeStart = $readyBefore
    startAttempted = [bool]($startResult -ne $null)
    startExitCode = if ($startResult) { $startResult.exitCode } else { $null }
    readyAfterStart = $readyAfter
    supervisorProofExitCode = if ($supervisorProof) { $supervisorProof.exitCode } else { $null }
    resultPollerProofExitCode = if ($resultPollerProof) { $resultPollerProof.exitCode } else { $null }
    runtimePassAfterIteration = $runtimePass
  }) | Out-Null

  if (-not $Continuous -and $iteration -ge $maxLoopCount) { break }
  if (-not $SkipSleep) { Start-Sleep -Seconds $IntervalSeconds }
}

$cleanup = [ordered]@{
  requested = [bool]$StopLoopProcessesAfterRun
  supervisor = $null
  resultPoller = $null
}
if ($StopLoopProcessesAfterRun -and -not $DryRun) {
  if ($RequireSupervisor) {
    $cleanup.supervisor = Invoke-CapturedCommand `
      -Label "cleanup-stop-supervisor" `
      -Command "npm run mobile:one-event-live-supervisor:stop"
  }
  if ($RequireResultPoller) {
    $cleanup.resultPoller = Invoke-CapturedCommand `
      -Label "cleanup-stop-result-poller" `
      -Command "npm run mobile:one-event-result-poller:stop"
  }
}

$failedIterations = @($iterations | Where-Object { $_.runtimePassAfterIteration -ne $true })
$cleanupFailed = [bool](
  $StopLoopProcessesAfterRun -and (
    ($cleanup.supervisor -and -not $cleanup.supervisor.pass) -or
    ($cleanup.resultPoller -and -not $cleanup.resultPoller.pass)
  )
)
$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-internal-tester-watchdog"
  pass = [bool]($failedIterations.Count -eq 0 -and -not $cleanupFailed)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  maxIterations = if ($Continuous) { 0 } else { $MaxIterations }
  continuous = [bool]$Continuous
  intervalSeconds = $IntervalSeconds
  requireSupervisor = [bool]$RequireSupervisor
  requireResultPoller = [bool]$RequireResultPoller
  runProviderProof = [bool]$RunProviderProof
  runLiveResultIngestion = [bool]$RunLiveResultIngestion
  dryRun = [bool]$DryRun
  stopLoopProcessesAfterRun = [bool]$StopLoopProcessesAfterRun
  iterations = @($iterations | ForEach-Object { $_ })
  cleanup = $cleanup
  commandCount = $commands.Count
  commandTail = @($commands | Select-Object -Last 6)
  runtimeTruth = [ordered]@{
    watchdogCanVerifyBaseRuntime = $true
    watchdogCanStartBackendExpoWhenMissing = $true
    supervisorProofMode = if ($RequireSupervisor) { "foreground repeated local supervisor proof; no provider quota by default" } else { "not required" }
    resultPollerProofMode = if ($RequireResultPoller) { "background result-poller proof with clean stop; no provider quota by default" } else { "not required" }
    noProviderQuotaByDefault = [bool]((-not $RunProviderProof) -and (-not $RunLiveResultIngestion))
    usesExistingInternalTesterRuntimeManager = $true
    stopsLoopProcessesOnly = [bool]$StopLoopProcessesAfterRun
    installedOsService = $false
    fakeTokenOnly = $true
  }
  gaps = [ordered]@{
    p0 = @(
      $failedIterations | ForEach-Object { "watchdog_iteration_$($_.iteration)_not_ready" }
      if ($cleanupFailed) { "managed_loop_cleanup_failed" }
    )
    p1 = @("This is a foreground/local watchdog proof, not an installed OS service.", "The supervisor proof is repeated foreground execution; installed unattended service ownership remains future work.")
    p2 = @("Multi-event runtime watchdog policies remain future work.")
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 100
$summary | ConvertTo-Json -Depth 100

if (-not $summary.pass) { exit 1 }
