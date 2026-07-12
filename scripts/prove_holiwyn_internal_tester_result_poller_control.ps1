param(
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [int]$ResultPollerIntervalSeconds = 1,
  [int]$WaitSeconds = 60,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\internal-tester-result-poller-control-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RuntimeSummaryPath = "docs\mobile\harness\odds-api-live-runtime\internal-tester-runtime-manager-summary.redacted.json"
$PollerHeartbeatPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-heartbeat.redacted.json"

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
    [int]$Depth = 80
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

function Get-RuntimeDigest {
  param([object]$Summary)
  if (-not $Summary) { return $null }
  function Short-Text {
    param([object]$Value)
    $valueText = if ($null -eq $Value) { $null } else { [string]$Value }
    if ($valueText -and $valueText.Length -gt 180) {
      return $valueText.Substring(0, 180) + "...[truncated]"
    }
    return $valueText
  }
  return [ordered]@{
    generatedAt = $Summary.generatedAt
    pass = [bool]($Summary.pass -eq $true)
    action = $Summary.action
    operations = @($Summary.operations | ForEach-Object {
      [ordered]@{
        target = $_.target
        result = Short-Text $_.result
        exitCode = $_.exitCode
      }
    })
    readiness = [ordered]@{
      backendReady = [bool]$Summary.readiness.backendReady
      expoReady = [bool]$Summary.readiness.expoReady
      postgresReady = [bool]$Summary.readiness.postgresReady
      s23Connected = [bool]$Summary.readiness.s23Connected
    }
    backend = [ordered]@{
      portOwner = $Summary.backend.portOwner
      ownedByManager = [bool]$Summary.backend.ownedByManager
    }
    expo = [ordered]@{
      portOwner = $Summary.expo.portOwner
      ownedByManager = [bool]$Summary.expo.ownedByManager
    }
    resultPoller = [ordered]@{
      startRequested = [bool]$Summary.resultPoller.startRequested
      statusSummaryPath = $Summary.resultPoller.statusSummaryPath
      running = [bool]($Summary.resultPoller.processSummary.process.after.running -eq $true)
      resultPollingMode = $Summary.resultPoller.processSummary.runtimeTruth.resultPollingMode
      activeTesterSettlementExecution = [bool]$Summary.resultPoller.processSummary.runtimeTruth.activeTesterSettlementExecution
    }
    runtimeTruth = $Summary.runtimeTruth
  }
}

$startedAt = (Get-Date).ToUniversalTime()
$commands = New-Object System.Collections.Generic.List[object]
$p0 = New-Object System.Collections.Generic.List[object]
$p1 = New-Object System.Collections.Generic.List[object]
$p2 = New-Object System.Collections.Generic.List[object]

try {
  $commands.Add((Invoke-CheckedCommand -Label "pre-stop-internal-runtime" -Command "npm run mobile:internal-tester-runtime -- -Action stop")) | Out-Null
  Remove-Item -LiteralPath (Resolve-RepoPath $PollerHeartbeatPath) -Force -ErrorAction SilentlyContinue

  $startCommand = "npm run mobile:internal-tester-runtime -- -Action start -StartResultPoller -ResultPollerIntervalSeconds $ResultPollerIntervalSeconds -BackendPort $BackendPort -ExpoPort $ExpoPort"
  $commands.Add((Invoke-CheckedCommand -Label "start-internal-runtime-with-result-poller" -Command $startCommand)) | Out-Null
  $startSummary = Read-JsonFile (Resolve-RepoPath $RuntimeSummaryPath)

  $deadline = (Get-Date).AddSeconds($WaitSeconds)
  $heartbeat = $null
  while ((Get-Date) -lt $deadline) {
    $heartbeat = Read-JsonFile (Resolve-RepoPath $PollerHeartbeatPath)
    if ($heartbeat -and [int]$heartbeat.completedIterations -ge 1) { break }
    Start-Sleep -Seconds 2
  }

  $commands.Add((Invoke-CheckedCommand -Label "status-internal-runtime-with-result-poller" -Command "npm run mobile:internal-tester-runtime -- -Action status")) | Out-Null
  $statusSummary = Read-JsonFile (Resolve-RepoPath $RuntimeSummaryPath)
} finally {
  $commands.Add((Invoke-CheckedCommand -Label "stop-internal-runtime-with-result-poller" -Command "npm run mobile:internal-tester-runtime -- -Action stop")) | Out-Null
}

$stopSummary = Read-JsonFile (Resolve-RepoPath $RuntimeSummaryPath)
$heartbeat = Read-JsonFile (Resolve-RepoPath $PollerHeartbeatPath)

if (-not ($startSummary -and $startSummary.pass -eq $true)) {
  $p0.Add("Internal tester runtime start with result poller did not pass.") | Out-Null
}
if (-not ($startSummary -and $startSummary.resultPoller.processSummary.process.after.running -eq $true)) {
  $p0.Add("Internal tester runtime did not start the result poller.") | Out-Null
}
if (-not ($statusSummary -and $statusSummary.resultPoller.processSummary.process.after.running -eq $true)) {
  $p0.Add("Internal tester runtime status did not report the result poller running.") | Out-Null
}
if (-not ($heartbeat -and [int]$heartbeat.completedIterations -ge 1)) {
  $p0.Add("Result poller heartbeat did not advance while started by internal tester runtime.") | Out-Null
}
if (-not ($stopSummary -and $stopSummary.resultPoller.processSummary.process.after.running -eq $false)) {
  $p0.Add("Internal tester runtime stop did not stop the result poller.") | Out-Null
}

$p1.Add("This proves local control-plane start/status/stop for the result poller, not an installed OS service.") | Out-Null
$p1.Add("Live result ingestion remains explicit and quota-capped when enabled.") | Out-Null
$p2.Add("Multi-event result poller orchestration remains future work.") | Out-Null

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-internal-tester-result-poller-control"
  pass = [bool]($p0.Count -eq 0)
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  settings = [ordered]@{
    backendPort = $BackendPort
    expoPort = $ExpoPort
    resultPollerIntervalSeconds = $ResultPollerIntervalSeconds
    providerQuotaSpent = $false
  }
  runtimeTruth = [ordered]@{
    internalTesterRuntimeCanStartResultPoller = [bool]($startSummary -and $startSummary.resultPoller.processSummary.process.after.running -eq $true)
    internalTesterRuntimeCanReportResultPoller = [bool]($statusSummary -and $statusSummary.resultPoller.processSummary.process.after.running -eq $true)
    internalTesterRuntimeCanStopResultPoller = [bool]($stopSummary -and $stopSummary.resultPoller.processSummary.process.after.running -eq $false)
    heartbeatAdvanced = [bool]($heartbeat -and [int]$heartbeat.completedIterations -ge 1)
    providerQuotaUsed = $false
    activeTesterSettlementExecution = $false
    installedOsService = $false
    fakeTokenOnly = $true
  }
  proof = [ordered]@{
    startSummary = Get-RuntimeDigest $startSummary
    statusSummary = Get-RuntimeDigest $statusSummary
    stopSummary = Get-RuntimeDigest $stopSummary
    heartbeatPath = $PollerHeartbeatPath
    heartbeatIterations = if ($heartbeat) { [int]$heartbeat.completedIterations } else { 0 }
  }
  commands = @($commands | ForEach-Object { $_ })
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @($p1 | ForEach-Object { $_ })
    p2 = @($p2 | ForEach-Object { $_ })
  }
}

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 100
$summary | ConvertTo-Json -Depth 100

if (-not $summary.pass) { exit 1 }
