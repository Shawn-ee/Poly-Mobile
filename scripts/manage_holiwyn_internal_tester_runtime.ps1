param(
  [ValidateSet("start", "status", "stop")]
  [string]$Action = "status",
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [switch]$StartSupervisor,
  [switch]$StartResultPoller,
  [switch]$RunResultIngestion,
  [switch]$RunResultSettlement,
  [switch]$RunApprovedResultSettlement,
  [string]$ResultSettlementPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
  [string]$ResultSettlementApprovalPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-audit-approved.redacted.json",
  [switch]$RunLiveResultIngestion,
  [switch]$RunProviderProof,
  [int]$ResultPollerIntervalSeconds = 15,
  [switch]$Force,
  [switch]$ReplaceExternalExpo,
  [switch]$WaitForReady,
  [switch]$RuntimeOnlyArtifacts,
  [int]$WaitSeconds = 45,
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\internal-tester-runtime-manager-summary.redacted.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RuntimeDir = Join-Path $RepoRoot ".runtime\holiwyn-internal-tester-runtime"
$StatePath = Join-Path $RuntimeDir "runtime-state.json"
$BackendOutPath = Join-Path $RuntimeDir "backend.out.log"
$BackendErrPath = Join-Path $RuntimeDir "backend.err.log"
$ExpoOutPath = Join-Path $RuntimeDir "expo.out.log"
$ExpoErrPath = Join-Path $RuntimeDir "expo.err.log"
$SupervisorProcessSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-live-supervisor-process-summary.redacted.json"
$ResultPollerProcessSummaryPath = "docs\mobile\harness\odds-api-live-runtime\one-event-result-poller-process-summary.redacted.json"
$SupervisorRuntimeDir = Join-Path $RepoRoot ".runtime\one-event-live-supervisor"
$SupervisorStatePath = Join-Path $SupervisorRuntimeDir "supervisor-process-state.json"
$SupervisorOutPath = Join-Path $SupervisorRuntimeDir "supervisor.out.log"
$SupervisorErrPath = Join-Path $SupervisorRuntimeDir "supervisor.err.log"
$ResultPollerRuntimeDir = Join-Path $RepoRoot ".runtime\one-event-result-poller"
$ResultPollerStatePath = Join-Path $ResultPollerRuntimeDir "result-poller-process-state.json"
$ResultPollerOutPath = Join-Path $ResultPollerRuntimeDir "result-poller.out.log"
$ResultPollerErrPath = Join-Path $ResultPollerRuntimeDir "result-poller.err.log"
$BackendBaseUrl = "http://127.0.0.1:$BackendPort"

if ($RuntimeOnlyArtifacts) {
  $SummaryPath = Join-Path $RuntimeDir "internal-tester-runtime-manager-summary.redacted.json"
  $SupervisorProcessSummaryPath = Join-Path $SupervisorRuntimeDir "one-event-live-supervisor-process-summary.redacted.json"
  $ResultPollerProcessSummaryPath = Join-Path $ResultPollerRuntimeDir "one-event-result-poller-process-summary.redacted.json"
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $SupervisorRuntimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $ResultPollerRuntimeDir | Out-Null

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
}

function ConvertTo-RepoPath {
  param([string]$Path)
  return $Path.Replace($RepoRoot + "\", "").Replace("\", "/")
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
    [int]$Depth = 50
  )
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Select-ProcessSummaryDigest {
  param([object]$Summary)
  if (-not $Summary) { return $null }
  return [ordered]@{
    generatedAt = $Summary.generatedAt
    scope = $Summary.scope
    pass = $Summary.pass
    operation = if ($Summary.operation) {
      [ordered]@{
        action = $Summary.operation.action
        result = $Summary.operation.result
        pid = $Summary.operation.pid
      }
    } else { $null }
    process = if ($Summary.process) {
      [ordered]@{
        statePath = $Summary.process.statePath
        stdout = $Summary.process.stdout
        stderr = $Summary.process.stderr
        before = if ($Summary.process.before) {
          [ordered]@{
            known = $Summary.process.before.known
            pid = $Summary.process.before.pid
            running = $Summary.process.before.running
          }
        } else { $null }
        after = if ($Summary.process.after) {
          [ordered]@{
            known = $Summary.process.after.known
            pid = $Summary.process.after.pid
            running = $Summary.process.after.running
          }
        } else { $null }
      }
    } else { $null }
    runtimeTruth = if ($Summary.runtimeTruth) {
      [ordered]@{
        backgroundProcessManagerAvailable = $Summary.runtimeTruth.backgroundProcessManagerAvailable
        localBackgroundProcessRunning = $Summary.runtimeTruth.localBackgroundProcessRunning
        installedOsService = $Summary.runtimeTruth.installedOsService
        providerRefreshMode = $Summary.runtimeTruth.providerRefreshMode
        resultPollingMode = $Summary.runtimeTruth.resultPollingMode
        resultSettlementMode = $Summary.runtimeTruth.resultSettlementMode
        fakeTokenOnly = $Summary.runtimeTruth.fakeTokenOnly
      }
    } else { $null }
    gapCounts = if ($Summary.gaps) {
      [ordered]@{
        p0 = @($Summary.gaps.p0).Count
        p1 = @($Summary.gaps.p1).Count
        p2 = @($Summary.gaps.p2).Count
      }
    } elseif ($Summary.supervisor -and $Summary.supervisor.digest -and $Summary.supervisor.digest.gapCounts) {
      $Summary.supervisor.digest.gapCounts
    } elseif ($Summary.poller -and $Summary.poller.digest -and $Summary.poller.digest.gapCounts) {
      $Summary.poller.digest.gapCounts
    } else { $null }
  }
}

function Select-HealthDigest {
  param([object]$Health)
  if (-not $Health) { return $null }
  return [ordered]@{
    ok = $Health.ok
    status = if ($Health.body) { $Health.body.status } else { $null }
    db = if ($Health.body) { $Health.body.db } else { $null }
    env = if ($Health.body) { $Health.body.env } else { $null }
    timestamp = if ($Health.body) { $Health.body.timestamp } else { $null }
    error = $Health.error
  }
}

function Select-LiveRuntimeStatusDigest {
  param([object]$Status)
  if (-not $Status) { return $null }
  $state = if ($Status.body) { $Status.body.currentRuntimeState } else { $null }
  return [ordered]@{
    ok = $Status.ok
    status = $Status.status
    currentRuntimeState = if ($state) {
      [ordered]@{
        mode = $state.mode
        localCapabilityReady = $state.localCapabilityReady
        allLoopsRunning = $state.allLoopsRunning
        supervisorRunning = $state.supervisorRunning
        resultPollerRunning = $state.resultPollerRunning
        quotaSpendingLoopRunning = $state.quotaSpendingLoopRunning
        providerSnapshotFresh = $state.providerSnapshotFresh
        testerReadyRightNow = $state.testerReadyRightNow
        p0 = @($state.p0)
        p1 = @($state.p1)
        nextAction = $state.nextAction
      }
    } else { $null }
    providerQuotaUsedByStatus = if ($Status.body) { $Status.body.runtimeTruth.providerQuotaUsedByStatus } else { $null }
    error = $Status.error
  }
}

function Select-OperationResultDigest {
  param([object]$Result)
  if ($null -eq $Result) { return $null }
  $text = [string]$Result
  if ($text.Length -gt 200) { return "captured_output_redacted" }
  return $text
}

function Test-HttpHealth {
  param([string]$Url)
  try {
    $body = Invoke-RestMethod -Uri "$Url/api/health" -TimeoutSec 8
    return [ordered]@{
      ok = [bool]($body.status -eq "ok" -and $body.db -eq "connected")
      body = $body
      error = $null
    }
  } catch {
    return [ordered]@{ ok = $false; body = $null; error = $_.Exception.Message }
  }
}

function Get-LiveRuntimeStatus {
  param([string]$Url)
  try {
    $body = Invoke-RestMethod -Uri "$Url/api/internal/live-runtime/status" -TimeoutSec 10
    return [ordered]@{
      ok = $true
      status = 200
      body = $body
      error = $null
    }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    return [ordered]@{
      ok = $false
      status = $statusCode
      body = $null
      error = $_.Exception.Message
    }
  }
}

function Wait-LiveRuntimeWarm {
  param([int]$DeadlineSeconds)
  $deadline = (Get-Date).AddSeconds($DeadlineSeconds)
  do {
    $status = Get-LiveRuntimeStatus $BackendBaseUrl
    $state = if ($status.body) { $status.body.currentRuntimeState } else { $null }
    if (
      $status.ok -and
      $state -and
      $state.mode -eq "warm_no_quota_runtime" -and
      $state.allLoopsRunning -eq $true -and
      $state.quotaSpendingLoopRunning -eq $false
    ) {
      return [ordered]@{ ready = $true; status = $status }
    }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return [ordered]@{ ready = $false; status = Get-LiveRuntimeStatus $BackendBaseUrl }
}

function Get-PortOwner {
  param([int]$Port)
  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if (-not $connection) { return $null }
    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
    return [ordered]@{
      port = $Port
      pid = [int]$connection.OwningProcess
      processName = if ($process) { $process.ProcessName } else { $null }
    }
  } catch {
    return $null
  }
}

function Test-ProcessRunning {
  param([object]$State, [string]$Name)
  if (-not $State -or -not $State.$Name -or -not $State.$Name.pid) { return $false }
  return [bool](Get-Process -Id ([int]$State.$Name.pid) -ErrorAction SilentlyContinue)
}

function Test-ProcessDescendant {
  param([int]$ChildPid, [int]$AncestorPid)
  if (-not $ChildPid -or -not $AncestorPid) { return $false }
  if ($ChildPid -eq $AncestorPid) { return $true }
  $currentPid = $ChildPid
  for ($depth = 0; $depth -lt 12; $depth++) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $currentPid" -ErrorAction SilentlyContinue
    if (-not $process -or -not $process.ParentProcessId) { return $false }
    if ([int]$process.ParentProcessId -eq $AncestorPid) { return $true }
    if ([int]$process.ParentProcessId -eq $currentPid) { return $false }
    $currentPid = [int]$process.ParentProcessId
  }
  return $false
}

function Stop-OwnedProcessTree {
  param([object]$ProcessState)
  if (-not $ProcessState -or -not $ProcessState.pid -or -not $ProcessState.owned) { return "not_owned" }
  $process = Get-Process -Id ([int]$ProcessState.pid) -ErrorAction SilentlyContinue
  if (-not $process) { return "not_running" }
  $output = & taskkill /PID ([int]$ProcessState.pid) /T /F 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop owned process pid=$($ProcessState.pid): $output"
  }
  return "stopped"
}

function Stop-ExternalExpoListener {
  param([object]$PortOwner)
  if (-not $PortOwner -or -not $PortOwner.pid) { return "not_running" }
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($PortOwner.pid)" -ErrorAction SilentlyContinue
  $commandLine = if ($process) { [string]$process.CommandLine } else { "" }
  $looksLikeExpo =
    $PortOwner.processName -eq "node" -and
    ($commandLine -match "expo|metro|@expo|react-native|mobile")
  if (-not $looksLikeExpo) {
    throw "Refusing to stop external listener pid=$($PortOwner.pid) on port $ExpoPort because it does not look like Expo/Metro. Stop it manually or use the existing listener."
  }
  $output = & taskkill /PID ([int]$PortOwner.pid) /T /F 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop external Expo listener pid=$($PortOwner.pid): $output"
  }
  return "stopped_external_expo_listener"
}

function Start-OwnedBackend {
  $args = @("-NoProfile", "-Command", "npm run dev -- -p $BackendPort")
  $process = Start-Process `
    -FilePath "powershell" `
    -ArgumentList $args `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $BackendOutPath `
    -RedirectStandardError $BackendErrPath `
    -PassThru
  return [ordered]@{
    owned = $true
    pid = $process.Id
    command = "npm run dev -- -p $BackendPort"
    stdout = ConvertTo-RepoPath $BackendOutPath
    stderr = ConvertTo-RepoPath $BackendErrPath
    startedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function Start-OwnedExpo {
  $expoCommand = @"
`$env:EXPO_PUBLIC_API_BASE_URL = '$BackendBaseUrl'
`$env:EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL = '$BackendBaseUrl'
`$env:EXPO_PUBLIC_ORDER_MODE = 'server'
`$env:EXPO_PUBLIC_MARKET_DATA_MODE = 'server'
`$env:EXPO_PUBLIC_SHOW_ORDERBOOK = '0'
npm --prefix mobile run start -- --host localhost --port $ExpoPort
"@
  $args = @("-NoProfile", "-Command", $expoCommand)
  $process = Start-Process `
    -FilePath "powershell" `
    -ArgumentList $args `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $ExpoOutPath `
    -RedirectStandardError $ExpoErrPath `
    -PassThru
  return [ordered]@{
    owned = $true
    pid = $process.Id
    command = "npm --prefix mobile run start -- --host localhost --port $ExpoPort"
    env = [ordered]@{
      EXPO_PUBLIC_API_BASE_URL = $BackendBaseUrl
      EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL = $BackendBaseUrl
      EXPO_PUBLIC_ORDER_MODE = "server"
      EXPO_PUBLIC_MARKET_DATA_MODE = "server"
      EXPO_PUBLIC_SHOW_ORDERBOOK = "0"
    }
    stdout = ConvertTo-RepoPath $ExpoOutPath
    stderr = ConvertTo-RepoPath $ExpoErrPath
    startedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function Stop-LocalSupervisorIfRunning {
  $output = & powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_live_supervisor.ps1 -Action stop -SummaryPath $SupervisorProcessSummaryPath 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop existing supervisor before direct start: $($output -join "`n")"
  }
}

function Stop-LocalResultPollerIfRunning {
  $output = & powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_result_poller.ps1 -Action stop -SummaryPath $ResultPollerProcessSummaryPath 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop existing result poller before direct start: $($output -join "`n")"
  }
}

function Start-LocalSupervisorDirect {
  Stop-LocalSupervisorIfRunning
  $args = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $RepoRoot "scripts\run_holiwyn_one_event_live_supervisor.ps1"),
    "-BackendPort", "$BackendPort", "-IntervalSeconds", "15", "-Continuous", "-MaxIterations", "0"
  )
  if ($RuntimeOnlyArtifacts) {
    $args += "-RuntimeArtifactDir"
    $args += (Join-Path $SupervisorRuntimeDir "artifacts")
  }
  if ($RunProviderProof) { $args += "-RunProviderProof" }
  if ($RunResultIngestion) { $args += "-RunResultIngestion" }
  if ($RunLiveResultIngestion) { $args += "-RunLiveResultIngestion" }
  if ($RunResultSettlement) { $args += "-RunResultSettlement" }
  if ($RunApprovedResultSettlement) {
    $args += "-RunApprovedResultSettlement"
    $args += "-ResultSettlementPath"
    $args += $ResultSettlementPath
    $args += "-ResultSettlementApprovalPath"
    $args += $ResultSettlementApprovalPath
  }
  $process = Start-Process `
    -FilePath "powershell" `
    -ArgumentList $args `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $SupervisorOutPath `
    -RedirectStandardError $SupervisorErrPath `
    -PassThru
  $state = [ordered]@{
    pid = $process.Id
    startedAt = (Get-Date).ToUniversalTime().ToString("o")
    command = "powershell " + ($args -join " ")
    continuous = $true
    maxIterations = 0
    intervalSeconds = 15
    runProviderProof = [bool]$RunProviderProof
    runStaleGuard = $false
    enforceStaleGuard = $false
    runResultIngestion = [bool]$RunResultIngestion
    runLiveResultIngestion = [bool]$RunLiveResultIngestion
    resultIngestionEveryIterations = 0
    maxLiveResultIngestionRuns = 0
    maxCreditsPerResultIngestion = 0
    runResultSettlement = [bool]$RunResultSettlement
    runApprovedResultSettlement = [bool]$RunApprovedResultSettlement
    resultSettlementPath = if ($RunApprovedResultSettlement -or $RunResultIngestion) { $ResultSettlementPath } else { $null }
    resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
    providerProofEveryIterations = 0
    maxProviderProofRuns = 0
    refreshIterations = 0
    maxCreditsPerProviderProof = 0
    minRemaining = 0
    stdout = ConvertTo-RepoPath $SupervisorOutPath
    stderr = ConvertTo-RepoPath $SupervisorErrPath
  }
  Write-JsonFile -Value $state -Path $SupervisorStatePath -Depth 30
  return [ordered]@{ pid = $process.Id; statePath = ConvertTo-RepoPath $SupervisorStatePath }
}

function Start-LocalResultPollerDirect {
  Stop-LocalResultPollerIfRunning
  $args = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $RepoRoot "scripts\run_holiwyn_one_event_result_poller.ps1"),
    "-EventSlug", "odds-api-single-soccer-test",
    "-ResultPath", "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
    "-IntervalSeconds", "$ResultPollerIntervalSeconds", "-Continuous", "-MaxIterations", "0"
  )
  if ($RuntimeOnlyArtifacts) {
    $args += "-RuntimeArtifactDir"
    $args += (Join-Path $ResultPollerRuntimeDir "artifacts")
  }
  if ($RunLiveResultIngestion) { $args += "-RunLiveResultIngestion" }
  if ($RunApprovedResultSettlement) {
    $args += "-RunResultSettlement"
    $args += "-RunApprovedResultSettlement"
    $args += "-ResultSettlementApprovalPath"
    $args += $ResultSettlementApprovalPath
  }
  $process = Start-Process `
    -FilePath "powershell" `
    -ArgumentList $args `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $ResultPollerOutPath `
    -RedirectStandardError $ResultPollerErrPath `
    -PassThru
  $state = [ordered]@{
    pid = $process.Id
    startedAt = (Get-Date).ToUniversalTime().ToString("o")
    command = "powershell " + ($args -join " ")
    eventSlug = "odds-api-single-soccer-test"
    resultPath = "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json"
    continuous = $true
    maxIterations = 0
    intervalSeconds = $ResultPollerIntervalSeconds
    runLiveResultIngestion = [bool]$RunLiveResultIngestion
    resultIngestionEveryIterations = 0
    maxLiveResultIngestionRuns = 0
    maxCreditsPerResultIngestion = 0
    runResultSettlement = [bool]$RunApprovedResultSettlement
    runApprovedResultSettlement = [bool]$RunApprovedResultSettlement
    resultSettlementApprovalPath = if ($RunApprovedResultSettlement) { $ResultSettlementApprovalPath } else { $null }
    stdout = ConvertTo-RepoPath $ResultPollerOutPath
    stderr = ConvertTo-RepoPath $ResultPollerErrPath
  }
  Write-JsonFile -Value $state -Path $ResultPollerStatePath -Depth 30
  return [ordered]@{ pid = $process.Id; statePath = ConvertTo-RepoPath $ResultPollerStatePath }
}

function Invoke-AdbWithTimeout {
  param(
    [string[]]$Arguments,
    [int]$TimeoutSeconds = 5
  )
  $tempOut = [System.IO.Path]::GetTempFileName()
  $tempErr = [System.IO.Path]::GetTempFileName()
  try {
    $process = Start-Process `
      -FilePath "adb" `
      -ArgumentList $Arguments `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $tempOut `
      -RedirectStandardError $tempErr `
      -PassThru
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch {}
      return [ordered]@{
        ok = $false
        timedOut = $true
        exitCode = $null
        output = ""
        error = "adb timed out after ${TimeoutSeconds}s"
      }
    }
    $stdout = if (Test-Path -LiteralPath $tempOut) { Get-Content -Raw -LiteralPath $tempOut } else { "" }
    $stderr = if (Test-Path -LiteralPath $tempErr) { Get-Content -Raw -LiteralPath $tempErr } else { "" }
    $exitCode = $process.ExitCode
    $ok = [bool]($exitCode -eq 0 -or ($null -eq $exitCode -and [string]::IsNullOrWhiteSpace($stderr)))
    return [ordered]@{
      ok = $ok
      timedOut = $false
      exitCode = $exitCode
      output = $stdout
      error = $stderr
    }
  } catch {
    return [ordered]@{
      ok = $false
      timedOut = $false
      exitCode = $null
      output = ""
      error = $_.Exception.Message
    }
  } finally {
    Remove-Item -LiteralPath $tempOut, $tempErr -Force -ErrorAction SilentlyContinue
  }
}

function Set-S23AdbReverse {
  param([object]$Device)
  if (-not $Device -or -not $Device.connected -or -not $Device.deviceId) {
    return [ordered]@{ attempted = $false; ok = $false; reason = "s23_not_connected"; ports = @() }
  }
  $ports = @($BackendPort, $ExpoPort)
  $results = @()
  foreach ($port in $ports) {
    $adbResult = Invoke-AdbWithTimeout -Arguments @("-s", $Device.deviceId, "reverse", "tcp:$port", "tcp:$port")
    if (-not $adbResult) {
      $adbResult = [ordered]@{
        ok = $false
        exitCode = $null
        timedOut = $false
        output = ""
        error = "adb reverse returned no result"
      }
    }
    $adbOutput = (($adbResult.output, $adbResult.error | Where-Object { $null -ne $_ }) -join "").Trim()
    $results += [ordered]@{
      port = $port
      ok = [bool]$adbResult.ok
      exitCode = $adbResult.exitCode
      timedOut = [bool]$adbResult.timedOut
      output = $adbOutput
    }
  }
  return [ordered]@{
    attempted = $true
    ok = [bool](-not (@($results | Where-Object { -not $_.ok }) | Select-Object -First 1))
    deviceId = $Device.deviceId
    model = $Device.model
    ports = @($results | ForEach-Object { $_ })
  }
}

function Get-DockerPostgresStatus {
  try {
    $rows = @(docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>$null)
    $postgres = $rows | Where-Object { $_ -match "postgres|poly_postgres" } | Select-Object -First 1
    return [ordered]@{
      ok = [bool]($postgres -and $postgres -match "healthy|Up")
      status = if ($postgres) { $postgres } else { "not_found" }
      raw = @($rows)
    }
  } catch {
    return [ordered]@{ ok = $false; status = "docker_unavailable"; error = $_.Exception.Message; raw = @() }
  }
}

function Get-S23Status {
  try {
    $adbResult = Invoke-AdbWithTimeout -Arguments @("devices", "-l")
    if (-not $adbResult.ok) {
      return [ordered]@{
        connected = $false
        deviceId = $null
        model = $null
        raw = $adbResult.output
        adbTimedOut = [bool]$adbResult.timedOut
        error = $adbResult.error
      }
    }
    $devices = @($adbResult.output -split "`r?`n" | Where-Object { $_ -match "\sdevice\s" })
    $line = $devices |
      Where-Object { $_ -match "adb-R3CW20LFMLW|R3CW20LFMLW|SM_S911U1|model:SM_S911U1" } |
      Select-Object -First 1
    $serial = if ($line -and $line -match "^(\S+)") { $Matches[1] } else { $null }
    return [ordered]@{
      connected = [bool]$line
      deviceId = $serial
      model = if ($line -and $line -match "model:([^ ]+)") { $Matches[1] } else { $null }
      raw = $line
      adbTimedOut = $false
    }
  } catch {
    return [ordered]@{ connected = $false; deviceId = $null; model = $null; error = $_.Exception.Message }
  }
}

function Wait-UntilReady {
  param([int]$DeadlineSeconds)
  $deadline = (Get-Date).AddSeconds($DeadlineSeconds)
  do {
    $health = Test-HttpHealth $BackendBaseUrl
    $expoOwner = Get-PortOwner $ExpoPort
    if ($health.ok -and $expoOwner) {
      return [ordered]@{ ready = $true; backendHealth = $health; expoOwner = $expoOwner }
    }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return [ordered]@{
    ready = $false
    backendHealth = Test-HttpHealth $BackendBaseUrl
    expoOwner = Get-PortOwner $ExpoPort
  }
}

$startedAt = (Get-Date).ToUniversalTime()
$stateBefore = Read-JsonFile $StatePath
$operations = New-Object System.Collections.Generic.List[object]
$s23Before = Get-S23Status
$adbReverse = if ($Action -eq "start") { Set-S23AdbReverse $s23Before } else { [ordered]@{ attempted = $false; ok = $false; reason = "action_$Action"; ports = @() } }
if ($adbReverse.attempted) {
  $operations.Add([ordered]@{ target = "s23-adb-reverse"; result = if ($adbReverse.ok) { "configured" } else { "failed_or_partial" }; details = $adbReverse }) | Out-Null
}
$state = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  backend = if ($stateBefore -and $stateBefore.backend) { $stateBefore.backend } else { $null }
  expo = if ($stateBefore -and $stateBefore.expo) { $stateBefore.expo } else { $null }
}

if ($Action -eq "stop") {
  $operations.Add([ordered]@{ target = "supervisor"; result = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_live_supervisor.ps1 -Action stop -SummaryPath $SupervisorProcessSummaryPath | Out-String).Trim() }) | Out-Null
  $operations.Add([ordered]@{ target = "result-poller"; result = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_result_poller.ps1 -Action stop -SummaryPath $ResultPollerProcessSummaryPath | Out-String).Trim() }) | Out-Null
  $operations.Add([ordered]@{ target = "expo"; result = Stop-OwnedProcessTree $state.expo }) | Out-Null
  $operations.Add([ordered]@{ target = "backend"; result = Stop-OwnedProcessTree $state.backend }) | Out-Null
  $state.backend = $null
  $state.expo = $null
} elseif ($Action -eq "start") {
  $backendOwner = Get-PortOwner $BackendPort
  $expoOwner = Get-PortOwner $ExpoPort
  $backendOwnedByManager = [bool]($state.backend -and $state.backend.owned -and $backendOwner -and $state.backend.pid -eq $backendOwner.pid)
  $expoOwnedByManager = [bool]($state.expo -and $state.expo.owned -and $expoOwner -and $state.expo.pid -eq $expoOwner.pid)
  if ($backendOwner -and (-not $Force -or -not $backendOwnedByManager)) {
    $state.backend = [ordered]@{ owned = $false; pid = $backendOwner.pid; command = "external-listener"; detected = $backendOwner }
    $operations.Add([ordered]@{ target = "backend"; result = "external_listener_reused"; pid = $backendOwner.pid }) | Out-Null
  } else {
    if ($Force) { $operations.Add([ordered]@{ target = "backend"; result = Stop-OwnedProcessTree $state.backend }) | Out-Null }
    $state.backend = Start-OwnedBackend
    $operations.Add([ordered]@{ target = "backend"; result = "started"; pid = $state.backend.pid }) | Out-Null
  }
  if ($expoOwner -and -not $Force) {
    $state.expo = [ordered]@{ owned = $false; pid = $expoOwner.pid; command = "external-listener"; detected = $expoOwner }
    $operations.Add([ordered]@{ target = "expo"; result = "external_listener_reused"; pid = $expoOwner.pid }) | Out-Null
  } elseif ($expoOwner -and $Force -and -not $expoOwnedByManager -and -not $ReplaceExternalExpo) {
    $state.expo = [ordered]@{ owned = $false; pid = $expoOwner.pid; command = "external-listener"; detected = $expoOwner; forceBlocked = "replace_external_expo_not_requested" }
    $operations.Add([ordered]@{ target = "expo"; result = "external_listener_reused_force_requires_replace_external_expo"; pid = $expoOwner.pid }) | Out-Null
  } else {
    if ($Force -and $expoOwnedByManager) {
      $operations.Add([ordered]@{ target = "expo"; result = Stop-OwnedProcessTree $state.expo }) | Out-Null
    } elseif ($Force -and $expoOwner -and $ReplaceExternalExpo) {
      $operations.Add([ordered]@{ target = "expo"; result = Stop-ExternalExpoListener $expoOwner; pid = $expoOwner.pid }) | Out-Null
    }
    $state.expo = Start-OwnedExpo
    $operations.Add([ordered]@{ target = "expo"; result = "started"; pid = $state.expo.pid }) | Out-Null
  }

  if ($StartSupervisor) {
    $supervisorStart = Start-LocalSupervisorDirect
    $operations.Add([ordered]@{ target = "supervisor"; result = "started_direct"; pid = $supervisorStart.pid; statePath = $supervisorStart.statePath }) | Out-Null
  }

  if ($StartResultPoller) {
    $pollerStart = Start-LocalResultPollerDirect
    $operations.Add([ordered]@{ target = "result-poller"; result = "started_direct"; pid = $pollerStart.pid; statePath = $pollerStart.statePath }) | Out-Null
  }
}

if ($Action -ne "status") {
  Write-JsonFile -Value $state -Path $StatePath -Depth 20
}

if ($WaitForReady -or $Action -eq "start") {
  $wait = Wait-UntilReady $WaitSeconds
} else {
  $statusHealth = Test-HttpHealth $BackendBaseUrl
  $statusExpoOwner = Get-PortOwner $ExpoPort
  $wait = [ordered]@{
    ready = [bool]($statusHealth.ok -and $statusExpoOwner)
    backendHealth = $statusHealth
    expoOwner = $statusExpoOwner
    note = "No wait requested; this is an immediate readiness snapshot."
  }
}

$shouldRequireWarmRuntimeStatus = [bool]($Action -eq "start" -and $StartSupervisor -and $StartResultPoller)
$liveRuntimeStatusWait = if ($shouldRequireWarmRuntimeStatus) {
  Wait-LiveRuntimeWarm $WaitSeconds
} else {
  [ordered]@{ ready = $false; status = Get-LiveRuntimeStatus $BackendBaseUrl; reason = "warm_runtime_not_required_for_this_action" }
}
$liveRuntimeStatus = $liveRuntimeStatusWait.status

$backendOwnerAfter = Get-PortOwner $BackendPort
$expoOwnerAfter = Get-PortOwner $ExpoPort
$supervisorStatusText = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_live_supervisor.ps1 -Action status -SummaryPath $SupervisorProcessSummaryPath | Out-String)
$supervisorProcessSummary = Select-ProcessSummaryDigest (Read-JsonFile (Resolve-RepoPath $SupervisorProcessSummaryPath))
$resultPollerStatusText = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_result_poller.ps1 -Action status -SummaryPath $ResultPollerProcessSummaryPath | Out-String)
$resultPollerProcessSummary = Select-ProcessSummaryDigest (Read-JsonFile (Resolve-RepoPath $ResultPollerProcessSummaryPath))
$docker = Get-DockerPostgresStatus
$s23 = Get-S23Status
$backendHealth = Test-HttpHealth $BackendBaseUrl
$backendOwnedRunning = Test-ProcessRunning $state "backend"
$expoOwnedRunning = Test-ProcessRunning $state "expo"
$expoPortOwnedByManagedProcessTree = [bool](
  $state.expo -and
  $state.expo.pid -and
  $expoOwnerAfter -and
  (Test-ProcessDescendant -ChildPid ([int]$expoOwnerAfter.pid) -AncestorPid ([int]$state.expo.pid))
)
$managerStartedExpoUsesServerMode = [bool]($state.expo -and $state.expo.owned -and $expoOwnedRunning -and $expoPortOwnedByManagedProcessTree -and $state.expo.env.EXPO_PUBLIC_ORDER_MODE -eq "server" -and $state.expo.env.EXPO_PUBLIC_MARKET_DATA_MODE -eq "server" -and $state.expo.env.EXPO_PUBLIC_API_BASE_URL -eq $BackendBaseUrl)
$externalExpoServerModeUnverified = [bool]($expoOwnerAfter -and -not $managerStartedExpoUsesServerMode)
$expoServerModeSource = if ($managerStartedExpoUsesServerMode) {
  "manager_owned_server_env"
} elseif ($externalExpoServerModeUnverified) {
  "external_listener_unverified"
} elseif ($expoOwnerAfter) {
  "listener_without_server_env"
} else {
  "not_listening"
}

$p0 = New-Object System.Collections.Generic.List[object]
if ($Action -eq "stop") {
  if ($supervisorProcessSummary -and $supervisorProcessSummary.process.after.running -eq $true) {
    $p0.Add("supervisor_still_running_after_stop") | Out-Null
  }
  if ($resultPollerProcessSummary -and $resultPollerProcessSummary.process.after.running -eq $true) {
    $p0.Add("result_poller_still_running_after_stop") | Out-Null
  }
} else {
  if (-not $backendHealth.ok) { $p0.Add("backend_health_failed") | Out-Null }
  if (-not $docker.ok) { $p0.Add("postgres_not_healthy") | Out-Null }
  if (-not $expoOwnerAfter) { $p0.Add("expo_port_not_listening") | Out-Null }
  if ($Action -eq "start" -and $s23Before.connected -and -not $adbReverse.ok) { $p0.Add("s23_adb_reverse_failed") | Out-Null }
  if ($StartSupervisor -and -not ($supervisorProcessSummary -and $supervisorProcessSummary.process.after.running -eq $true)) {
    $p0.Add("supervisor_not_running_after_start") | Out-Null
  }
  if ($StartResultPoller -and -not ($resultPollerProcessSummary -and $resultPollerProcessSummary.process.after.running -eq $true)) {
    $p0.Add("result_poller_not_running_after_start") | Out-Null
  }
  $processLevelWarmRuntimeObserved = [bool](
    $supervisorProcessSummary -and
    $supervisorProcessSummary.process.after.running -eq $true -and
    $resultPollerProcessSummary -and
    $resultPollerProcessSummary.process.after.running -eq $true
  )
  if ($shouldRequireWarmRuntimeStatus -and -not $liveRuntimeStatusWait.ready -and -not $processLevelWarmRuntimeObserved) {
    $p0.Add("live_runtime_status_not_warm_after_loop_start") | Out-Null
  }
}
$p1 = New-Object System.Collections.Generic.List[object]
if ($shouldRequireWarmRuntimeStatus -and -not $liveRuntimeStatusWait.ready) {
  $p1.Add("Backend live-runtime status route did not report warm during start, but direct process proof is accepted when supervisor and result-poller are both running.") | Out-Null
}
if ($externalExpoServerModeUnverified) {
  $p1.Add("External Expo listener reused; server-mode env cannot be verified. Use -Force -ReplaceExternalExpo or stop the old Expo server if S23 shows stale, fixture, or non-server behavior.") | Out-Null
}
$p1.Add("Use -Force -ReplaceExternalExpo only when you intentionally want the runtime manager to stop an external Expo/Metro listener on the Expo port and start a verified server-mode listener.") | Out-Null
$p1.Add("This is a local process control plane, not an installed OS service.") | Out-Null
$p1.Add("Official-result auto-execution still requires trusted operator confirmation.") | Out-Null

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-internal-tester-runtime-manager"
  pass = [bool]($p0.Count -eq 0)
  action = $Action
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  operations = @($operations | ForEach-Object { $_ })
  backend = [ordered]@{
    baseUrl = $BackendBaseUrl
    health = Select-HealthDigest $backendHealth
    portOwner = $backendOwnerAfter
    ownedByManager = [bool]($state.backend -and $state.backend.owned)
    ownedProcessRunning = $backendOwnedRunning
  }
  expo = [ordered]@{
    port = $ExpoPort
    portOwner = $expoOwnerAfter
    ownedByManager = [bool]($state.expo -and $state.expo.owned)
    ownedProcessRunning = $expoOwnedRunning
    serverModeEnv = if ($state.expo -and $state.expo.env) { $state.expo.env } else { $null }
    serverModeSource = $expoServerModeSource
    serverModeVerified = $managerStartedExpoUsesServerMode
    externalServerModeUnverified = $externalExpoServerModeUnverified
  }
  dockerPostgres = $docker
  s23 = $s23
  adbReverse = $adbReverse
  supervisor = [ordered]@{
    startRequested = [bool]$StartSupervisor
    statusSummaryPath = $SupervisorProcessSummaryPath
    processSummary = $supervisorProcessSummary
    statusOutputTail = @()
  }
  resultPoller = [ordered]@{
    startRequested = [bool]$StartResultPoller
    statusSummaryPath = $ResultPollerProcessSummaryPath
    processSummary = $resultPollerProcessSummary
    statusOutputTail = @()
  }
  readiness = [ordered]@{
    waitRequested = [bool]($WaitForReady -or $Action -eq "start")
    waitResult = [ordered]@{
      ready = $wait.ready
      backendHealth = Select-HealthDigest $wait.backendHealth
      expoOwner = $wait.expoOwner
      note = $wait.note
    }
    backendReady = [bool]$backendHealth.ok
    expoReady = [bool]$expoOwnerAfter
    postgresReady = [bool]$docker.ok
    s23Connected = [bool]$s23.connected
  }
  liveRuntimeStatus = [ordered]@{
    checked = $true
    warmRuntimeRequired = $shouldRequireWarmRuntimeStatus
    warmRuntimeObserved = [bool]$liveRuntimeStatusWait.ready
    statusDigest = Select-LiveRuntimeStatusDigest $liveRuntimeStatus
  }
  runtimeTruth = [ordered]@{
    localControlPlaneAvailable = $true
    backendStartStopAvailableWhenPortFree = $true
    expoStartStopAvailableWhenPortFree = $true
    supervisorBackgroundProcessAvailable = $true
    resultPollerBackgroundProcessAvailable = $true
    resultPollerBackgroundProcessRunning = [bool]($resultPollerProcessSummary -and $resultPollerProcessSummary.process.after.running -eq $true)
    liveRuntimeStatusWarmObserved = [bool]$liveRuntimeStatusWait.ready
    liveRuntimeStatusWarmRequiredForLoopStart = $shouldRequireWarmRuntimeStatus
    managerStartedExpoUsesServerMode = $managerStartedExpoUsesServerMode
    expoServerModeSource = $expoServerModeSource
    externalExpoServerModeUnverified = $externalExpoServerModeUnverified
    replaceExternalExpoAvailable = $true
    replaceExternalExpoRequested = [bool]$ReplaceExternalExpo
    s23AdbReverseConfiguredOnStart = [bool]($Action -ne "start" -or $adbReverse.ok -or -not $s23Before.connected)
    stopsOnlyOwnedBackendExpoProcesses = $true
    installedOsService = $false
    fakeTokenOnly = $true
    approvedSettlementModeRequested = [bool]$RunApprovedResultSettlement
    activeTesterSettlementExecution = $false
  }
  statePath = ConvertTo-RepoPath $StatePath
  logs = [ordered]@{
    backendStdout = ConvertTo-RepoPath $BackendOutPath
    backendStderr = ConvertTo-RepoPath $BackendErrPath
    expoStdout = ConvertTo-RepoPath $ExpoOutPath
    expoStderr = ConvertTo-RepoPath $ExpoErrPath
  }
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { $_ })
    p1 = @($p1 | ForEach-Object { $_ })
    p2 = @("Multi-event production process supervision remains future work.")
  }
}

$outputSummary = [ordered]@{
  generatedAt = [string]$summary.generatedAt
  scope = [string]$summary.scope
  pass = [bool]$summary.pass
  action = [string]$summary.action
  startedAt = [string]$summary.startedAt
  completedAt = [string]$summary.completedAt
  operations = @($operations | ForEach-Object {
    [ordered]@{
      target = [string]$_.target
      result = Select-OperationResultDigest $_.result
      pid = if ($_.pid) { [int]$_.pid } else { $null }
    }
  })
  backend = [ordered]@{
    baseUrl = [string]$BackendBaseUrl
    health = Select-HealthDigest $backendHealth
    portOwner = if ($backendOwnerAfter) {
      [ordered]@{ port = [int]$backendOwnerAfter.port; pid = [int]$backendOwnerAfter.pid; processName = [string]$backendOwnerAfter.processName }
    } else { $null }
    ownedByManager = [bool]($state.backend -and $state.backend.owned)
    ownedProcessRunning = [bool]$backendOwnedRunning
  }
  expo = [ordered]@{
    port = [int]$ExpoPort
    portOwner = if ($expoOwnerAfter) {
      [ordered]@{ port = [int]$expoOwnerAfter.port; pid = [int]$expoOwnerAfter.pid; processName = [string]$expoOwnerAfter.processName }
    } else { $null }
    ownedByManager = [bool]($state.expo -and $state.expo.owned)
    ownedProcessRunning = [bool]$expoOwnedRunning
    serverModeSource = [string]$expoServerModeSource
    serverModeVerified = [bool]$managerStartedExpoUsesServerMode
    externalServerModeUnverified = [bool]$externalExpoServerModeUnverified
  }
  dockerPostgres = [ordered]@{
    ok = [bool]$docker.ok
    status = [string]$docker.status
  }
  s23 = [ordered]@{
    connected = [bool]$s23.connected
    deviceId = if ($s23.deviceId) { [string]$s23.deviceId } else { $null }
    model = if ($s23.model) { [string]$s23.model } else { $null }
    raw = if ($s23.raw) { [string]$s23.raw } else { $null }
    adbTimedOut = [bool]$s23.adbTimedOut
    error = if ($s23.error) { [string]$s23.error } else { $null }
  }
  supervisor = [ordered]@{
    startRequested = [bool]$StartSupervisor
    statusSummaryPath = [string]$SupervisorProcessSummaryPath
    processSummary = [ordered]@{
      pass = [bool]$supervisorProcessSummary.pass
      operation = [ordered]@{
        action = [string]$supervisorProcessSummary.operation.action
        result = [string]$supervisorProcessSummary.operation.result
        pid = if ($supervisorProcessSummary.operation.pid) { [int]$supervisorProcessSummary.operation.pid } else { $null }
      }
      process = [ordered]@{
        before = [ordered]@{
          pid = if ($supervisorProcessSummary.process.before.pid) { [int]$supervisorProcessSummary.process.before.pid } else { $null }
          running = [bool]$supervisorProcessSummary.process.before.running
        }
        after = [ordered]@{
          pid = if ($supervisorProcessSummary.process.after.pid) { [int]$supervisorProcessSummary.process.after.pid } else { $null }
          running = [bool]$supervisorProcessSummary.process.after.running
        }
      }
    }
  }
  resultPoller = [ordered]@{
    startRequested = [bool]$StartResultPoller
    statusSummaryPath = [string]$ResultPollerProcessSummaryPath
    processSummary = [ordered]@{
      pass = [bool]$resultPollerProcessSummary.pass
      operation = [ordered]@{
        action = [string]$resultPollerProcessSummary.operation.action
        result = [string]$resultPollerProcessSummary.operation.result
        pid = if ($resultPollerProcessSummary.operation.pid) { [int]$resultPollerProcessSummary.operation.pid } else { $null }
      }
      process = [ordered]@{
        before = [ordered]@{
          pid = if ($resultPollerProcessSummary.process.before.pid) { [int]$resultPollerProcessSummary.process.before.pid } else { $null }
          running = [bool]$resultPollerProcessSummary.process.before.running
        }
        after = [ordered]@{
          pid = if ($resultPollerProcessSummary.process.after.pid) { [int]$resultPollerProcessSummary.process.after.pid } else { $null }
          running = [bool]$resultPollerProcessSummary.process.after.running
        }
      }
    }
  }
  readiness = [ordered]@{
    waitRequested = [bool]($WaitForReady -or $Action -eq "start")
    backendReady = [bool]$backendHealth.ok
    expoReady = [bool]$expoOwnerAfter
    postgresReady = [bool]$docker.ok
    s23Connected = [bool]$s23.connected
  }
  liveRuntimeStatus = [ordered]@{
    checked = $true
    warmRuntimeRequired = [bool]$shouldRequireWarmRuntimeStatus
    warmRuntimeObserved = [bool]$liveRuntimeStatusWait.ready
    statusDigest = Select-LiveRuntimeStatusDigest $liveRuntimeStatus
  }
  runtimeTruth = [ordered]@{
    localControlPlaneAvailable = $true
    backendStartStopAvailableWhenPortFree = $true
    expoStartStopAvailableWhenPortFree = $true
    supervisorBackgroundProcessAvailable = $true
    resultPollerBackgroundProcessAvailable = $true
    resultPollerBackgroundProcessRunning = [bool]($resultPollerProcessSummary -and $resultPollerProcessSummary.process.after.running -eq $true)
    liveRuntimeStatusWarmObserved = [bool]$liveRuntimeStatusWait.ready
    liveRuntimeStatusWarmRequiredForLoopStart = [bool]$shouldRequireWarmRuntimeStatus
    managerStartedExpoUsesServerMode = [bool]$managerStartedExpoUsesServerMode
    expoServerModeSource = [string]$expoServerModeSource
    externalExpoServerModeUnverified = [bool]$externalExpoServerModeUnverified
    replaceExternalExpoAvailable = $true
    replaceExternalExpoRequested = [bool]$ReplaceExternalExpo
    s23AdbReverseConfiguredOnStart = [bool]($Action -ne "start" -or $adbReverse.ok -or -not $s23Before.connected)
    stopsOnlyOwnedBackendExpoProcesses = $true
    installedOsService = $false
    approvedSettlementModeRequested = [bool]$RunApprovedResultSettlement
    activeTesterSettlementExecution = $false
    fakeTokenOnly = $true
  }
  statePath = ConvertTo-RepoPath $StatePath
  gaps = [ordered]@{
    p0 = @($p0 | ForEach-Object { [string]$_ })
    p1 = @($p1 | ForEach-Object { [string]$_ })
    p2 = @("Multi-event production process supervision remains future work.")
  }
}
Write-JsonFile -Value $outputSummary -Path (Resolve-RepoPath $SummaryPath) -Depth 8
$outputSummary | ConvertTo-Json -Depth 8

if (-not $outputSummary.pass) { exit 1 }
