param(
  [int]$BackendPort = 3002,
  [int]$IntervalSeconds = 1,
  [int]$RequiredIterations = 2,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-continuous-supervisor-proof-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$HeartbeatPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-heartbeat.redacted.json"
$SupervisorSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-summary.redacted.json"
$ProcessSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-process-summary.redacted.json"
$RuntimeStatusPath = "docs\mobile\harness\odds-api-live-runtime\one-event-runtime-status-summary.redacted.json"

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return Join-Path $RepoRoot $Path
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
    [int]$Depth = 50
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $output = cmd /c $Command 2>&1
  $exitCode = $LASTEXITCODE
  return [ordered]@{
    label = $Label
    command = $Command
    exitCode = $exitCode
    pass = [bool]($exitCode -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    outputTail = @($output | Select-Object -Last 20)
  }
}

function Get-NodeProcessCount {
  return @(Get-Process node -ErrorAction SilentlyContinue).Count
}

$startedAt = (Get-Date).ToUniversalTime()
$commands = New-Object System.Collections.Generic.List[object]
$p0 = New-Object System.Collections.Generic.List[object]
$p1 = New-Object System.Collections.Generic.List[object]
$p2 = New-Object System.Collections.Generic.List[object]
$nodeBefore = Get-NodeProcessCount

$commands.Add((Invoke-CheckedCommand -Label "pre-stop-existing-supervisor" -Command "npm run mobile:one-event-live-supervisor:stop")) | Out-Null
Remove-Item -LiteralPath (Resolve-RepoPath $HeartbeatPath) -Force -ErrorAction SilentlyContinue

$supervisorCommand = "powershell -ExecutionPolicy Bypass -File scripts/run_holiwyn_one_event_live_supervisor.ps1 -BackendPort $BackendPort -MaxIterations $RequiredIterations -IntervalSeconds $IntervalSeconds -RunResultSettlement"
$supervisorRun = Invoke-CheckedCommand -Label "foreground-repeated-supervisor" -Command $supervisorCommand
$commands.Add($supervisorRun) | Out-Null

$heartbeat = Read-JsonFile (Resolve-RepoPath $HeartbeatPath)
$supervisorSummary = Read-JsonFile (Resolve-RepoPath $SupervisorSummaryPath)

$runtimeStatusCommand = Invoke-CheckedCommand -Label "runtime-status-after-repeated-supervisor" -Command "npm run mobile:one-event-runtime-status"
$commands.Add($runtimeStatusCommand) | Out-Null
$runtimeStatus = Read-JsonFile (Resolve-RepoPath $RuntimeStatusPath)

$statusCommand = Invoke-CheckedCommand -Label "status-after-foreground-proof" -Command "npm run mobile:one-event-live-supervisor:status"
$commands.Add($statusCommand) | Out-Null
$processStatus = Read-JsonFile (Resolve-RepoPath $ProcessSummaryPath)

if (-not ($supervisorRun.pass -and $supervisorSummary -and $supervisorSummary.pass -eq $true)) {
  $p0.Add("Repeated local supervisor command did not pass.") | Out-Null
}
if (-not ($supervisorSummary -and [int]$supervisorSummary.settings.completedIterations -ge $RequiredIterations)) {
  $p0.Add("Supervisor summary did not prove the required repeated iterations.") | Out-Null
}
if (-not ($heartbeat -and [int]$heartbeat.completedIterations -ge $RequiredIterations)) {
  $p0.Add("Supervisor heartbeat did not prove the required repeated iterations.") | Out-Null
}
if (-not ($runtimeStatusCommand.pass -and $runtimeStatus -and $runtimeStatus.pass -eq $true)) {
  $p0.Add("Runtime status did not pass after repeated supervisor proof.") | Out-Null
}
if (-not ($statusCommand.pass -and $processStatus -and $processStatus.process.after.running -eq $false)) {
  $p0.Add("A local supervisor process was still running after the foreground proof.") | Out-Null
}

$p1.Add("This proves repeated local supervisor cycles, not an installed OS service.") | Out-Null
$p1.Add("Background start/status/stop is available through the process manager and now stops process trees, but always-on service installation remains future work.") | Out-Null
$p1.Add("Official result API ingestion and unattended settlement execution remain future work.") | Out-Null
$p2.Add("Multi-event process supervision remains future work.") | Out-Null

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-continuous-supervisor-proof"
  pass = [bool]($p0.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  settings = [ordered]@{
    backendPort = $BackendPort
    intervalSeconds = $IntervalSeconds
    requiredIterations = $RequiredIterations
    providerQuotaSpent = $false
  }
  proof = [ordered]@{
    heartbeatPath = $HeartbeatPath
    supervisorSummaryPath = $SupervisorSummaryPath
    completedIterations = if ($supervisorSummary) { [int]$supervisorSummary.settings.completedIterations } else { 0 }
    heartbeatIterations = if ($heartbeat) { [int]$heartbeat.completedIterations } else { 0 }
    processStoppedAfterProof = [bool]($processStatus -and $processStatus.process.after.running -eq $false)
    runtimeStatusPass = [bool]($runtimeStatus -and $runtimeStatus.pass -eq $true)
    runtimeStatusPath = $RuntimeStatusPath
    nodeProcessCountBefore = $nodeBefore
    nodeProcessCountAfter = Get-NodeProcessCount
  }
  runtimeTruth = [ordered]@{
    repeatedLocalSupervisorCyclesProven = [bool]($p0.Count -eq 0)
    marketMakerReseedWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.marketMakerRefreshContinuousWhileSupervisorRuns -eq $true)
    lifecycleSchedulerWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.lifecycleSchedulerContinuousWhileSupervisorRuns -eq $true)
    resultSettlementSchedulerWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.resultSettlementContinuousWhileSupervisorRuns -eq $true)
    providerRefreshMode = if ($supervisorSummary) { $supervisorSummary.runtimeTruth.providerRefreshMode } else { "not_proven" }
    quotaProtected = $true
    installedOsService = $false
    fakeTokenOnly = $true
  }
  commands = @($commands | ForEach-Object { $_ })
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @($p1 | ForEach-Object { $_ })
    p2 = @($p2 | ForEach-Object { $_ })
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 70
$summary | ConvertTo-Json -Depth 70

if (-not $summary.pass) {
  exit 1
}
