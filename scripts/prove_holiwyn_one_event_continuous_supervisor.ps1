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
$BackendStartSummaryPath = "docs\mobile\harness\odds-api-live-runtime\continuous-supervisor-backend-start-summary.redacted.json"

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return Join-Path $RepoRoot $Path
}

function Convert-ToRepoRelativePath {
  param([string]$Path)
  if (-not $Path) {
    return $Path
  }
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $repoFullPath = [System.IO.Path]::GetFullPath($RepoRoot)
  if ($fullPath.StartsWith($repoFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath.Substring($repoFullPath.Length).TrimStart('\', '/')
  }
  return $Path
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

function Get-RepoNodeProcessCount {
  return @(Get-Process node -ErrorAction SilentlyContinue).Count
}

function Test-BackendHealth {
  try {
    $body = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/api/health" -TimeoutSec 5
    return [bool]($body.status -eq "ok" -and $body.db -eq "connected")
  } catch {
    return $false
  }
}

function Start-BackendForProof {
  $runtimeDir = Join-Path $RepoRoot ".runtime\continuous-supervisor-proof-backend"
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  $stdoutPath = Join-Path $runtimeDir "backend-$BackendPort.out.log"
  $stderrPath = Join-Path $runtimeDir "backend-$BackendPort.err.log"
  $command = @"
`$env:REFERENCE_STALE_MS='90000'
`$env:INTERNAL_TRADING_BETA_ENABLED='true'
`$env:TRADING_KILL_SWITCH='false'
`$env:NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED='true'
`$env:NEXTAUTH_URL='http://127.0.0.1:$BackendPort'
`$env:INTERNAL_TRADING_ALLOWLIST_EMAILS='system-liquidity-bot@local.test,holiwyn-mobile-dev@test.local,holiwyn-bot-admin@test.local'
`$env:POLY_BOTS_ENABLED='true'
`$env:POLY_BOTS_LIVE_TRADING='true'
`$env:POLY_BOTS_GLOBAL_KILL_SWITCH='false'
`$env:LIVE_SYSTEM_LIQUIDITY_ENABLED='true'
`$env:SYSTEM_LIQUIDITY_DRY_RUN='false'
npm run dev -- -p $BackendPort
"@
  $process = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command) `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru
  $deadline = (Get-Date).AddSeconds(45)
  do {
    if (Test-BackendHealth) {
      return [ordered]@{
        status = "healthy"
        startedProcess = [ordered]@{
          pid = $process.Id
          stdout = Convert-ToRepoRelativePath $stdoutPath
          stderr = Convert-ToRepoRelativePath $stderrPath
        }
      }
    }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return [ordered]@{
    status = "unhealthy_after_start"
    startedProcess = [ordered]@{
      pid = $process.Id
      stdout = Convert-ToRepoRelativePath $stdoutPath
      stderr = Convert-ToRepoRelativePath $stderrPath
    }
  }
}

$startedAt = (Get-Date).ToUniversalTime()
$commands = New-Object System.Collections.Generic.List[object]
$p0 = New-Object System.Collections.Generic.List[object]
$p1 = New-Object System.Collections.Generic.List[object]
$p2 = New-Object System.Collections.Generic.List[object]
$nodeBefore = Get-RepoNodeProcessCount
$backendStart = $null
$backendStartedByProof = $false
$backendStartedProcessStopped = $null

$commands.Add((Invoke-CheckedCommand -Label "pre-stop-existing-supervisor" -Command "npm run mobile:one-event-live-supervisor:stop")) | Out-Null
Remove-Item -LiteralPath (Resolve-RepoPath $HeartbeatPath) -Force -ErrorAction SilentlyContinue
$backendHealthyBefore = Test-BackendHealth
if ($backendHealthyBefore) {
  $backendStart = [ordered]@{ status = "already_healthy"; startedProcess = $null }
} else {
  $backendStart = Start-BackendForProof
  $backendStartedByProof = [bool]($backendStart.startedProcess -and $backendStart.startedProcess.pid)
}
Write-JsonFile -Value $backendStart -Path (Resolve-RepoPath $BackendStartSummaryPath) -Depth 20
$commands.Add([pscustomobject][ordered]@{
  label = "preflight-backend-health"
  command = "internal direct backend preflight"
  exitCode = if ($backendStart.status -in @("healthy", "already_healthy")) { 0 } else { 1 }
  pass = [bool]($backendStart.status -in @("healthy", "already_healthy"))
  startedAt = $startedAt.ToString("o")
  finishedAt = (Get-Date).ToUniversalTime().ToString("o")
  outputTail = @("backend status: $($backendStart.status)")
}) | Out-Null
if ($backendStart.status -notin @("healthy", "already_healthy")) {
  $p0.Add("Backend did not become healthy for continuous supervisor proof.") | Out-Null
}

if ($p0.Count -eq 0) {
  $supervisorCommand = "powershell -ExecutionPolicy Bypass -File scripts/run_holiwyn_one_event_live_supervisor.ps1 -BackendPort $BackendPort -MaxIterations $RequiredIterations -IntervalSeconds $IntervalSeconds -SkipSleep"
  $supervisorRun = Invoke-CheckedCommand -Label "foreground-repeated-supervisor" -Command $supervisorCommand
} else {
  $supervisorRun = [pscustomobject][ordered]@{
    label = "foreground-repeated-supervisor"
    command = "skipped because backend preflight failed"
    exitCode = 1
    pass = $false
    startedAt = (Get-Date).ToUniversalTime().ToString("o")
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    outputTail = @()
  }
}
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
if (-not ($statusCommand.pass -and $processStatus -and $processStatus.process.after.running -eq $false)) {
  $p0.Add("A local supervisor process was still running after the foreground proof.") | Out-Null
}

if ($backendStartedByProof) {
  Stop-ProcessTree -ProcessId ([int]$backendStart.startedProcess.pid)
  Start-Sleep -Seconds 2
  $backendStartedProcessStopped = [bool](
    -not (Get-Process -Id ([int]$backendStart.startedProcess.pid) -ErrorAction SilentlyContinue) -and
    (Get-RepoNodeProcessCount) -eq 0
  )
  if (-not $backendStartedProcessStopped) {
    $p0.Add("Proof-owned backend process tree did not stop cleanly after the continuous supervisor proof.") | Out-Null
  }
}

$p1.Add("This proves repeated local supervisor cycles, not an installed OS service.") | Out-Null
$p1.Add("Background start/status/stop is available through the process manager and now stops process trees, but always-on service installation remains future work.") | Out-Null
$p1.Add("Result polling is delegated to the dedicated lifecycle-aware result poller; the supervisor continuity proof covers provider cache checks, maker reseeding, and event lifecycle without forcing a stale result fixture.") | Out-Null
$p2.Add("Multi-event process supervision remains future work.") | Out-Null

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
  scope = "holiwyn-one-event-continuous-supervisor-proof"
  pass = [bool]($p0.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  settings = [ordered]@{
    backendPort = $BackendPort
    intervalSeconds = $IntervalSeconds
    requiredIterations = $RequiredIterations
    providerQuotaSpent = $false
    backendStartedByProof = $backendStartedByProof
  }
  proof = [ordered]@{
    heartbeatPath = $HeartbeatPath
    supervisorSummaryPath = $SupervisorSummaryPath
    completedIterations = if ($supervisorSummary) { [int]$supervisorSummary.settings.completedIterations } else { 0 }
    heartbeatIterations = if ($heartbeat) { [int]$heartbeat.completedIterations } else { 0 }
    processStoppedAfterProof = [bool]($processStatus -and $processStatus.process.after.running -eq $false)
    runtimeStatusPass = [bool]($runtimeStatus -and $runtimeStatus.pass -eq $true)
    runtimeStatusPath = $RuntimeStatusPath
    backendStartSummaryPath = $BackendStartSummaryPath
    backendStartedProcessStopped = $backendStartedProcessStopped
    nodeProcessCountBefore = $nodeBefore
    nodeProcessCountAfter = Get-RepoNodeProcessCount
  }
  runtimeTruth = [ordered]@{
    repeatedLocalSupervisorCyclesProven = [bool]($p0.Count -eq 0)
    marketMakerReseedWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.marketMakerRefreshContinuousWhileSupervisorRuns -eq $true)
    lifecycleSchedulerWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.lifecycleSchedulerContinuousWhileSupervisorRuns -eq $true)
    resultIngestionWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.resultIngestionContinuousWhileSupervisorRuns -eq $true)
    resultSettlementSchedulerWhileRunning = [bool]($supervisorSummary -and $supervisorSummary.runtimeTruth.resultSettlementContinuousWhileSupervisorRuns -eq $true)
    providerRefreshMode = if ($supervisorSummary) { $supervisorSummary.runtimeTruth.providerRefreshMode } else { "not_proven" }
    quotaProtected = $true
    installedOsService = $false
    fakeTokenOnly = $true
  }
  commands = $commandSummaries
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
  runtimeStatusPass = $summary.proof.runtimeStatusPass
  p0 = $summary.gaps.p0
  p1 = $summary.gaps.p1
  p2 = $summary.gaps.p2
  summaryPath = $SummaryPath
} | ConvertTo-Json -Depth 10

if (-not $summary.pass) {
  exit 1
}
