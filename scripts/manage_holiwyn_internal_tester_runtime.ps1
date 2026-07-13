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
$BackendBaseUrl = "http://127.0.0.1:$BackendPort"

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

function Set-S23AdbReverse {
  param([object]$Device)
  if (-not $Device -or -not $Device.connected -or -not $Device.deviceId) {
    return [ordered]@{ attempted = $false; ok = $false; reason = "s23_not_connected"; ports = @() }
  }
  $ports = @($BackendPort, $ExpoPort)
  $results = New-Object System.Collections.Generic.List[object]
  foreach ($port in $ports) {
    $output = @(adb -s $Device.deviceId reverse "tcp:$port" "tcp:$port" 2>&1)
    $results.Add([ordered]@{
      port = $port
      ok = [bool]($LASTEXITCODE -eq 0)
      exitCode = $LASTEXITCODE
      output = ($output -join "`n")
    }) | Out-Null
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
    $devices = @(adb devices -l 2>$null)
    $line = $devices | Where-Object { $_ -match "adb-R3CW20LFMLW|R3CW20LFMLW|SM_S911U1" } | Select-Object -First 1
    return [ordered]@{
      connected = [bool]$line
      deviceId = if ($line) { "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" } else { $null }
      model = if ($line -and $line -match "model:([^ ]+)") { $Matches[1] } else { $null }
      raw = $line
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
  $operations.Add([ordered]@{ target = "supervisor"; result = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_live_supervisor.ps1 -Action stop | Out-String).Trim() }) | Out-Null
  $operations.Add([ordered]@{ target = "result-poller"; result = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_result_poller.ps1 -Action stop | Out-String).Trim() }) | Out-Null
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
    $supervisorArgs = @(
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/manage_holiwyn_one_event_live_supervisor.ps1",
      "-Action", "start", "-Continuous", "-MaxIterations", "0", "-BackendPort", "$BackendPort", "-Force"
    )
    if ($RunProviderProof) { $supervisorArgs += "-RunProviderProof" }
    if ($RunResultIngestion) { $supervisorArgs += "-RunResultIngestion" }
    if ($RunLiveResultIngestion) { $supervisorArgs += "-RunLiveResultIngestion" }
    if ($RunResultSettlement) { $supervisorArgs += "-RunResultSettlement" }
    if ($RunApprovedResultSettlement) {
      $supervisorArgs += "-RunApprovedResultSettlement"
      $supervisorArgs += "-ResultSettlementPath"
      $supervisorArgs += $ResultSettlementPath
      $supervisorArgs += "-ResultSettlementApprovalPath"
      $supervisorArgs += $ResultSettlementApprovalPath
    }
    & powershell @supervisorArgs | Out-Null
    $operations.Add([ordered]@{ target = "supervisor"; result = if ($LASTEXITCODE -eq 0) { "started_or_running" } else { "failed" }; exitCode = $LASTEXITCODE }) | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Supervisor start failed." }
  }

  if ($StartResultPoller) {
    $pollerArgs = @(
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/manage_holiwyn_one_event_result_poller.ps1",
      "-Action", "start", "-Continuous", "-MaxIterations", "0", "-IntervalSeconds", "$ResultPollerIntervalSeconds", "-Force"
    )
    if ($RunLiveResultIngestion) { $pollerArgs += "-RunLiveResultIngestion" }
    if ($RunApprovedResultSettlement) {
      $pollerArgs += "-RunApprovedResultSettlement"
      $pollerArgs += "-ResultSettlementApprovalPath"
      $pollerArgs += $ResultSettlementApprovalPath
    }
    & powershell @pollerArgs | Out-Null
    $operations.Add([ordered]@{ target = "result-poller"; result = if ($LASTEXITCODE -eq 0) { "started_or_running" } else { "failed" }; exitCode = $LASTEXITCODE }) | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Result poller start failed." }
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

$backendOwnerAfter = Get-PortOwner $BackendPort
$expoOwnerAfter = Get-PortOwner $ExpoPort
$supervisorStatusText = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_live_supervisor.ps1 -Action status | Out-String)
$supervisorProcessSummary = Read-JsonFile (Resolve-RepoPath $SupervisorProcessSummaryPath)
$resultPollerStatusText = (& powershell -NoProfile -ExecutionPolicy Bypass -File scripts/manage_holiwyn_one_event_result_poller.ps1 -Action status | Out-String)
$resultPollerProcessSummary = Read-JsonFile (Resolve-RepoPath $ResultPollerProcessSummaryPath)
$docker = Get-DockerPostgresStatus
$s23 = Get-S23Status
$backendHealth = Test-HttpHealth $BackendBaseUrl
$backendOwnedRunning = Test-ProcessRunning $state "backend"
$expoOwnedRunning = Test-ProcessRunning $state "expo"
$managerStartedExpoUsesServerMode = [bool]($state.expo -and $state.expo.owned -and $expoOwnedRunning -and $expoOwnerAfter -and $state.expo.pid -eq $expoOwnerAfter.pid -and $state.expo.env.EXPO_PUBLIC_ORDER_MODE -eq "server" -and $state.expo.env.EXPO_PUBLIC_MARKET_DATA_MODE -eq "server" -and $state.expo.env.EXPO_PUBLIC_API_BASE_URL -eq $BackendBaseUrl)
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
}
$p1 = New-Object System.Collections.Generic.List[object]
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
    health = $backendHealth
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
    statusOutputTail = @($supervisorStatusText -split "`r?`n" | Select-Object -Last 20)
  }
  resultPoller = [ordered]@{
    startRequested = [bool]$StartResultPoller
    statusSummaryPath = $ResultPollerProcessSummaryPath
    processSummary = $resultPollerProcessSummary
    statusOutputTail = @($resultPollerStatusText -split "`r?`n" | Select-Object -Last 20)
  }
  readiness = [ordered]@{
    waitRequested = [bool]($WaitForReady -or $Action -eq "start")
    waitResult = $wait
    backendReady = [bool]$backendHealth.ok
    expoReady = [bool]$expoOwnerAfter
    postgresReady = [bool]$docker.ok
    s23Connected = [bool]$s23.connected
  }
  runtimeTruth = [ordered]@{
    localControlPlaneAvailable = $true
    backendStartStopAvailableWhenPortFree = $true
    expoStartStopAvailableWhenPortFree = $true
    supervisorBackgroundProcessAvailable = $true
    resultPollerBackgroundProcessAvailable = $true
    resultPollerBackgroundProcessRunning = [bool]($resultPollerProcessSummary -and $resultPollerProcessSummary.process.after.running -eq $true)
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

Write-JsonFile -Value $summary -Path (Resolve-RepoPath $SummaryPath) -Depth 70
$summary | ConvertTo-Json -Depth 70

if (-not $summary.pass) { exit 1 }
