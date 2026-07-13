param(
  [string]$EventSlug = "odds-api-single-soccer-test",
  [int]$IntervalSeconds = 1,
  [int]$RequiredIterations = 1,
  [int]$WaitSeconds = 90,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-continuous-result-poller-proof-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$HeartbeatPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-heartbeat.redacted.json"
$PollerSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-summary.redacted.json"
$ProcessSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-process-summary.redacted.json"

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
}

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path,
    [int]$Depth = 70
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Stop-ProcessTree {
  param([int]$ProcessId)
  if (-not $ProcessId) {
    return
  }
  $children = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ParentProcessId -eq $ProcessId })
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId ([int]$child.ProcessId)
  }
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)] [string]$Label,
    [Parameter(Mandatory = $true)] [string]$Command,
    [int]$TimeoutSeconds = 180
  )
  $startedAt = (Get-Date).ToUniversalTime()
  $runtimeDir = Join-Path $RepoRoot ".runtime\command-capture"
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  $safeLabel = ($Label -replace '[^A-Za-z0-9_.-]', '-')
  $stamp = [Guid]::NewGuid().ToString("N")
  $stdoutPath = Join-Path $runtimeDir "$safeLabel-$stamp.out.log"
  $stderrPath = Join-Path $runtimeDir "$safeLabel-$stamp.err.log"
  $process = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $Command) `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru
  $completed = $process.WaitForExit($TimeoutSeconds * 1000)
  if (-not $completed) {
    Stop-ProcessTree -ProcessId $process.Id
    $exitCode = 124
  } else {
    $process.Refresh()
    $exitCode = if ($null -ne $process.ExitCode) { [int]$process.ExitCode } else { 0 }
  }
  $output = @()
  if (Test-Path -LiteralPath $stdoutPath) {
    $output += Get-Content -LiteralPath $stdoutPath -Tail 20 -ErrorAction SilentlyContinue
  }
  if (Test-Path -LiteralPath $stderrPath) {
    $output += Get-Content -LiteralPath $stderrPath -Tail 20 -ErrorAction SilentlyContinue
  }
  return [pscustomobject][ordered]@{
    label = $Label
    command = $Command
    exitCode = $exitCode
    pass = [bool]($exitCode -eq 0)
    startedAt = $startedAt.ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    timedOut = [bool](-not $completed)
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
$runningStatus = $null
$stoppedStatus = $null

try {
  $commands.Add((Invoke-CheckedCommand -Label "pre-stop-existing-result-poller" -Command "npm run mobile:one-event-result-poller:stop")) | Out-Null
  Remove-Item -LiteralPath (Resolve-RepoPath $HeartbeatPath) -Force -ErrorAction SilentlyContinue

  $startCommand = "npm run mobile:one-event-result-poller:process -- -Action start -EventSlug $EventSlug -Continuous -MaxIterations 0 -IntervalSeconds $IntervalSeconds -RunResultSettlement -Force"
  $start = Invoke-CheckedCommand -Label "start-background-result-poller" -Command $startCommand
  $commands.Add($start) | Out-Null

  $deadline = (Get-Date).AddSeconds($WaitSeconds)
  $heartbeat = $null
  while ((Get-Date) -lt $deadline) {
    $heartbeat = Read-JsonFile (Resolve-RepoPath $HeartbeatPath)
    if ($heartbeat -and [int]$heartbeat.completedIterations -ge $RequiredIterations) {
      break
    }
    Start-Sleep -Seconds 2
  }

  $statusRunning = Invoke-CheckedCommand -Label "status-while-result-poller-running" -Command "npm run mobile:one-event-result-poller:status"
  $commands.Add($statusRunning) | Out-Null
  $runningStatus = Read-JsonFile (Resolve-RepoPath $ProcessSummaryPath)

  $stop = Invoke-CheckedCommand -Label "stop-background-result-poller" -Command "npm run mobile:one-event-result-poller:stop"
  $commands.Add($stop) | Out-Null
  $stoppedStatus = Read-JsonFile (Resolve-RepoPath $ProcessSummaryPath)

  $foregroundSummaryCommand = "powershell -ExecutionPolicy Bypass -File scripts/run_holiwyn_one_event_result_poller.ps1 -EventSlug $EventSlug -ResultPath docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json -MaxIterations 2 -IntervalSeconds 1 -RunResultSettlement -SkipSleep"
  $commands.Add((Invoke-CheckedCommand -Label "refresh-foreground-result-poller-summary" -Command $foregroundSummaryCommand)) | Out-Null
} finally {
  $cleanupStatus = Read-JsonFile (Resolve-RepoPath $ProcessSummaryPath)
  if ($cleanupStatus -and $cleanupStatus.process.after.running -eq $true) {
    $commands.Add((Invoke-CheckedCommand -Label "cleanup-stop-background-result-poller" -Command "npm run mobile:one-event-result-poller:stop")) | Out-Null
    $stoppedStatus = Read-JsonFile (Resolve-RepoPath $ProcessSummaryPath)
  }
}

$heartbeat = Read-JsonFile (Resolve-RepoPath $HeartbeatPath)
$pollerSummary = Read-JsonFile (Resolve-RepoPath $PollerSummaryPath)
$processSummary = Read-JsonFile (Resolve-RepoPath $ProcessSummaryPath)

if (-not ($commands[1].pass)) {
  $p0.Add("Background result poller did not start.") | Out-Null
}
if (-not ($heartbeat -and [int]$heartbeat.completedIterations -ge $RequiredIterations)) {
  $p0.Add("Background result poller heartbeat did not reach the required iterations.") | Out-Null
}
if (-not ($runningStatus -and $runningStatus.process.after.running -eq $true)) {
  $p0.Add("Result poller process manager did not report a running process during proof.") | Out-Null
}
if (-not ($stoppedStatus -and $stoppedStatus.process.after.running -eq $false)) {
  $p0.Add("Result poller process manager did not stop cleanly after proof.") | Out-Null
}
if (-not ($pollerSummary -and $pollerSummary.pass -eq $true)) {
  $p0.Add("Result poller summary did not pass.") | Out-Null
}

$p1.Add("This proves a local background result-poller process, not an installed OS service.") | Out-Null
$p1.Add("Default proof uses provider-shaped replay evidence and spends no Odds API quota; live score polling remains explicit and quota-capped.") | Out-Null
$p2.Add("Multi-event official-result queue supervision remains future work.") | Out-Null

$commandSummaries = @($commands | ForEach-Object {
  [ordered]@{
    label = [string]$_.label
    command = [string]$_.command
    exitCode = [int]$_.exitCode
    pass = [bool]$_.pass
    timedOut = [bool]$_.timedOut
    startedAt = [string]$_.startedAt
    finishedAt = [string]$_.finishedAt
    outputTail = @($_.outputTail | ForEach-Object { [string]$_ })
  }
})

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-one-event-continuous-result-poller-proof"
  pass = [bool]($p0.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  settings = [ordered]@{
    eventSlug = $EventSlug
    intervalSeconds = $IntervalSeconds
    requiredIterations = $RequiredIterations
    providerQuotaSpent = $false
  }
  proof = [ordered]@{
    heartbeatPath = $HeartbeatPath
    pollerSummaryPath = $PollerSummaryPath
    processSummaryPath = $ProcessSummaryPath
    completedIterations = if ($pollerSummary) { [int]$pollerSummary.settings.completedIterations } else { 0 }
    heartbeatIterations = if ($heartbeat) { [int]$heartbeat.completedIterations } else { 0 }
    processRunningDuringProof = [bool]($runningStatus -and $runningStatus.process.after.running -eq $true)
    processStoppedAfterProof = [bool]($stoppedStatus -and $stoppedStatus.process.after.running -eq $false)
    nodeProcessCountBefore = $nodeBefore
    nodeProcessCountAfter = Get-NodeProcessCount
  }
  runtimeTruth = [ordered]@{
    backgroundPollerRan = [bool]($runningStatus -and $runningStatus.process.after.running -eq $true)
    stoppedCleanly = [bool]($stoppedStatus -and $stoppedStatus.process.after.running -eq $false)
    resultPollingWhileProcessRuns = [bool]($heartbeat -and [int]$heartbeat.completedIterations -ge $RequiredIterations)
    settlementSchedulerWhileProcessRuns = [bool]($pollerSummary -and $pollerSummary.runtimeTruth.settlementSchedulerContinuousWhileRunnerRuns -eq $true)
    providerQuotaUsed = $false
    activeTesterSettlementExecution = $false
    installedOsService = $false
    fakeTokenOnly = $true
  }
  commands = $commandSummaries
  processSummary = $processSummary
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @($p1 | ForEach-Object { $_ })
    p2 = @($p2 | ForEach-Object { $_ })
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 30
[ordered]@{
  pass = $summary.pass
  generatedAt = $summary.generatedAt
  scope = $summary.scope
  completedIterations = $summary.proof.completedIterations
  heartbeatIterations = $summary.proof.heartbeatIterations
  processRunningDuringProof = $summary.proof.processRunningDuringProof
  processStoppedAfterProof = $summary.proof.processStoppedAfterProof
  p0 = $summary.gaps.p0
  p1 = $summary.gaps.p1
  p2 = $summary.gaps.p2
  summaryPath = $SummaryPath
} | ConvertTo-Json -Depth 10

if (-not $summary.pass) {
  exit 1
}
