param(
  [int]$Port = 3002,
  [string]$AuthBaseUrl = "",
  [string]$AllowlistEmails = "system-liquidity-bot@local.test,holiwyn-mobile-dev@test.local,holiwyn-bot-admin@test.local",
  [string]$SummaryPath = "",
  [int]$WaitSeconds = 45,
  [switch]$Restart,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RuntimeDir = Join-Path $RepoRoot ".runtime\internal-beta-backend"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Test-HttpOk([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return [int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Get-PortListenerPids([int]$TargetPort) {
  try {
    return @(Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique |
      Where-Object { $_ })
  } catch {
    return @()
  }
}

function Stop-PortListeners([int]$TargetPort) {
  $pids = @(Get-PortListenerPids $TargetPort)
  $stopped = @()
  foreach ($listenerPid in $pids) {
    Stop-Process -Id $listenerPid -Force -ErrorAction Stop
    $stopped += [pscustomobject]@{ pid = $listenerPid; port = $TargetPort }
  }
  if ($stopped.Count -gt 0) {
    Start-Sleep -Seconds 2
  }
  return $stopped
}

function Get-LanIp {
  try {
    $candidate = Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.IPAddress -notlike "0.*" -and
        $_.AddressState -eq "Preferred" -and
        $_.InterfaceAlias -notmatch "Tailscale|VMware|WSL|Hyper-V|Bluetooth|Loopback"
      } |
      Sort-Object @{ Expression = { if ($_.PrefixOrigin -eq "Dhcp") { 0 } else { 1 } } }, InterfaceMetric |
      Select-Object -First 1
    if ($candidate -and $candidate.IPAddress) {
      return $candidate.IPAddress
    }
  } catch {
    return ""
  }
  return ""
}

$healthUrl = "http://127.0.0.1:$Port/api/health"
$resolvedAuthBaseUrl = if ($AuthBaseUrl.Trim()) { $AuthBaseUrl.Trim().TrimEnd("/") } else { "http://127.0.0.1:$Port" }
$lanIp = Get-LanIp
$lanBaseUrl = if ($lanIp) { "http://$lanIp`:$Port" } else { "" }
$started = $null
$stopped = @()
$status = "unknown"

if ($CheckOnly) {
  $status = if (Test-HttpOk $healthUrl) { "healthy" } else { "unhealthy" }
} else {
  if ($Restart) {
    $stopped = @(Stop-PortListeners $Port)
  }

  if ((Test-HttpOk $healthUrl) -and -not $Restart) {
    $status = "already_healthy"
  } else {
    $stdoutPath = Join-Path $RuntimeDir "backend-$Port.out.log"
    $stderrPath = Join-Path $RuntimeDir "backend-$Port.err.log"
    $command = @"
`$env:REFERENCE_STALE_MS='90000'
`$env:INTERNAL_TRADING_BETA_ENABLED='true'
`$env:TRADING_KILL_SWITCH='false'
`$env:NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED='true'
`$env:NEXTAUTH_URL='$resolvedAuthBaseUrl'
`$env:INTERNAL_TRADING_ALLOWLIST_EMAILS='$AllowlistEmails'
`$env:POLY_BOTS_ENABLED='true'
`$env:POLY_BOTS_LIVE_TRADING='true'
`$env:POLY_BOTS_GLOBAL_KILL_SWITCH='false'
`$env:LIVE_SYSTEM_LIQUIDITY_ENABLED='true'
`$env:SYSTEM_LIQUIDITY_DRY_RUN='false'
npm run dev -- -p $Port
"@

    $process = Start-Process `
      -FilePath "powershell.exe" `
      -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command) `
      -WorkingDirectory $RepoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath `
      -PassThru

    $started = [pscustomobject]@{
      pid = $process.Id
      port = $Port
      stdout = $stdoutPath
      stderr = $stderrPath
    }

    $deadline = (Get-Date).AddSeconds($WaitSeconds)
    do {
      if (Test-HttpOk $healthUrl) {
        $status = "healthy"
        break
      }
      Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)

    if ($status -ne "healthy") {
      $status = "unhealthy_after_start"
    }
  }
}

$summary = [ordered]@{
  status = $status
  port = $Port
  healthUrl = $healthUrl
  lanBaseUrl = $lanBaseUrl
  nextAuthUrl = $resolvedAuthBaseUrl
  internalTradingBetaEnabled = $true
  tradingKillSwitch = $false
  nextPublicInternalTradingBetaEnabled = $true
  polyBotsEnabled = $true
  polyBotsLiveTrading = $true
  polyBotsGlobalKillSwitch = $false
  liveSystemLiquidityEnabled = $true
  systemLiquidityDryRun = $false
  allowlistEmails = @($AllowlistEmails.Split(",") | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ })
  stoppedListeners = $stopped
  startedProcess = $started
  intentionallyKeepsBackendRunning = (-not $CheckOnly) -and ($status -in @("healthy", "already_healthy"))
  notes = @(
    "This helper is for local fake-token internal MVP testing only.",
    "It does not enable production trading or deposit/withdraw flows.",
    "NEXTAUTH_URL is set to the local backend port by default so Google start/callback use the same local auth origin; pass -AuthBaseUrl to reuse a hosted backend auth origin.",
    "Keep order book UI hidden; this only starts the backend route layer for simple ticket/order/portfolio proof."
  )
}

if ($SummaryPath.Trim()) {
  $resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
    $SummaryPath
  } else {
    Join-Path $RepoRoot $SummaryPath
  }
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $resolvedSummaryPath -Encoding UTF8
}

$summary | ConvertTo-Json -Depth 6

if ($status -notin @("healthy", "already_healthy")) {
  exit 1
}
