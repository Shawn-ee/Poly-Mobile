param(
  [string[]]$EventSlugs = @("argentina-vs-egypt", "switzerland-vs-colombia"),
  [int]$BackendPort = 3002,
  [int]$ExpoPort = 8081,
  [int]$DurationSeconds = 28800,
  [int]$PollMs = 5000,
  [string]$BotRoot = "",
  [string]$AdminUserId = $env:POLY_DEV_ADMIN_USER_ID,
  [string]$ApiBaseUrl = "",
  [string]$MobileApiKey = $env:EXPO_PUBLIC_API_KEY,
  [switch]$CreateMobileDevCredential,
  [switch]$SkipBackend,
  [switch]$SkipSnapshotWatch,
  [switch]$SkipBots,
  [switch]$SkipExpo
)

$ErrorActionPreference = "Stop"

$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $BotRoot.Trim()) {
  $BotRoot = (Resolve-Path (Join-Path $AppRoot "..\poly-bot")).Path
}
if (-not (Test-Path $BotRoot)) {
  throw "poly-bot repo was not found at $BotRoot"
}

$RuntimeDir = Join-Path $AppRoot ".runtime\rehearsal"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Test-HttpOk([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return [int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Test-PortListening([int]$Port) {
  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $connections
  } catch {
    return $false
  }
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
    return $null
  }
  return $null
}

function Get-LocalAdminUserId {
  Push-Location $AppRoot
  try {
    $probe = "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.user.findFirst({where:{isAdmin:true},select:{id:true}}).then(x=>{console.log(x && x.id ? x.id : ''); process.exit(x && x.id ? 0 : 1);}).catch(e=>{console.error(e.message); process.exit(1);});"
    $found = (& node -e $probe).Trim()
    if (-not $found) {
      throw "No local admin user exists."
    }
    return $found
  } finally {
    Pop-Location
  }
}

function New-MobileDevCredential {
  Push-Location $AppRoot
  try {
    $rawOutput = & cmd /c npm.cmd run mobile:dev-credential 2>&1
    $lines = @($rawOutput | ForEach-Object { [string]$_ })
    $jsonStart = -1
    for ($index = 0; $index -lt $lines.Count; $index += 1) {
      if ($lines[$index].Trim() -eq "{") {
        $jsonStart = $index
        break
      }
    }
    if ($jsonStart -lt 0) {
      throw "Mobile dev credential command did not emit JSON."
    }
    $depth = 0
    $jsonEnd = -1
    for ($index = $jsonStart; $index -lt $lines.Count; $index += 1) {
      $line = $lines[$index]
      $depth += ([regex]::Matches($line, "\{")).Count
      $depth -= ([regex]::Matches($line, "\}")).Count
      if ($depth -eq 0) {
        $jsonEnd = $index
        break
      }
    }
    if ($jsonEnd -lt $jsonStart) {
      throw "Mobile dev credential JSON was incomplete."
    }
    $jsonText = ($lines[$jsonStart..$jsonEnd] -join "`n")
    try {
      $created = $jsonText | ConvertFrom-Json
    } catch {
      throw "Mobile dev credential JSON could not be parsed. The generated credential should be disabled before retrying."
    }
    if (-not $created.token) {
      throw "Mobile dev credential JSON did not include a token."
    }
    return [pscustomobject]@{
      token = [string]$created.token
      userId = [string]$created.userId
      username = [string]$created.username
      keyId = [string]$created.keyId
      targetBalanceUSDT = [string]$created.targetBalanceUSDT
    }
  } finally {
    Pop-Location
  }
}

function Start-RehearsalProcess(
  [string]$Name,
  [string]$WorkingDirectory,
  [string]$Command
) {
  $safeName = $Name -replace "[^a-zA-Z0-9_.-]", "-"
  $stdoutPath = Join-Path $RuntimeDir "$safeName.out.log"
  $stderrPath = Join-Path $RuntimeDir "$safeName.err.log"
  $process = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $Command) `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru

  return [pscustomobject]@{
    name = $Name
    pid = $process.Id
    workingDirectory = $WorkingDirectory
    stdout = $stdoutPath
    stderr = $stderrPath
  }
}

if (-not $ApiBaseUrl.Trim()) {
  $lanIp = Get-LanIp
  if (-not $lanIp) {
    $lanIp = "127.0.0.1"
  }
  $ApiBaseUrl = "http://$lanIp`:$BackendPort"
}

if (-not $AdminUserId.Trim()) {
  $AdminUserId = Get-LocalAdminUserId
}

$mobileCredential = $null
if (-not $MobileApiKey.Trim() -and $CreateMobileDevCredential) {
  $mobileCredential = New-MobileDevCredential
  $MobileApiKey = $mobileCredential.token
}

$started = @()
$skipped = @()
$backendHealthUrl = "http://127.0.0.1:$BackendPort/api/health"

if ($SkipBackend) {
  $skipped += [pscustomobject]@{ name = "backend"; reason = "skip flag" }
} elseif (Test-HttpOk $backendHealthUrl) {
  $skipped += [pscustomobject]@{ name = "backend"; reason = "already healthy"; url = $backendHealthUrl }
} else {
$backendCommand = @"
`$env:REFERENCE_STALE_MS='90000'
`$env:INTERNAL_TRADING_BETA_ENABLED='true'
`$env:TRADING_KILL_SWITCH='false'
npm run dev -- -p $BackendPort
"@
  $started += Start-RehearsalProcess -Name "poly-backend-$BackendPort" -WorkingDirectory $AppRoot -Command $backendCommand
}

if ($SkipSnapshotWatch) {
  $skipped += [pscustomobject]@{ name = "reference-snapshot-watch"; reason = "skip flag" }
} else {
  $snapshotCommand = @"
npm run reference:snapshot-watch -- --onlyMmEnabled true --pollMs $PollMs --durationSeconds $DurationSeconds
"@
  $started += Start-RehearsalProcess -Name "reference-snapshot-watch" -WorkingDirectory $AppRoot -Command $snapshotCommand
}

if ($SkipBots) {
  $skipped += [pscustomobject]@{ name = "local-maker-bots"; reason = "skip flag" }
} else {
  foreach ($eventSlug in $EventSlugs) {
    $botCommand = @"
`$env:LIVE_SYSTEM_LIQUIDITY_ENABLED='true'
`$env:SYSTEM_LIQUIDITY_DRY_RUN='false'
`$env:POLY_BOTS_ENABLED='true'
`$env:POLY_BOTS_LIVE_TRADING='true'
`$env:POLY_BOTS_GLOBAL_KILL_SWITCH='false'
`$env:QUOTE_OFFSET_TICKS='2'
`$env:TICK_SIZE='0.01'
`$env:REFERENCE_STALE_MS='90000'
`$env:MAX_SINGLE_ORDER_NOTIONAL_CENTS='500'
`$env:MAX_SINGLE_ORDER_SIZE_SHARES='5'
`$env:MAX_OPEN_ORDER_NOTIONAL_CENTS='10000'
`$env:MAX_PER_MARKET_EXPOSURE_CENTS='50000'
`$env:MAX_GLOBAL_EXPOSURE_CENTS='6000000'
`$env:MIN_CASH_RESERVE_CENTS='1000'
`$env:MIN_OUTCOME_INVENTORY='2'
`$env:MAX_OPEN_ORDERS_PER_MARKET='4'
npm run bot:polymarket:mm:live-local -- --baseUrl http://127.0.0.1:$BackendPort --eventSlug $eventSlug --maxMarkets 3 --durationSeconds $DurationSeconds --pollMs $PollMs --confirmLive true --devAdminUserId $AdminUserId
"@
    $started += Start-RehearsalProcess -Name "local-maker-$eventSlug" -WorkingDirectory $BotRoot -Command $botCommand
  }
}

if ($SkipExpo) {
  $skipped += [pscustomobject]@{ name = "expo"; reason = "skip flag" }
} elseif (Test-PortListening $ExpoPort) {
  $skipped += [pscustomobject]@{ name = "expo"; reason = "port already listening"; port = $ExpoPort }
} else {
  $apiKeyLine = ""
  if ($MobileApiKey.Trim()) {
    $apiKeyLine = "`$env:EXPO_PUBLIC_API_KEY='$MobileApiKey'"
  }
  $expoCommand = @"
`$env:EXPO_PUBLIC_ORDER_MODE='server'
`$env:EXPO_PUBLIC_MARKET_DATA_MODE='server'
`$env:EXPO_PUBLIC_API_BASE_URL='$ApiBaseUrl'
$apiKeyLine
npm run start -- --host lan --port $ExpoPort
"@
  $started += Start-RehearsalProcess -Name "mobile-expo-$ExpoPort" -WorkingDirectory (Join-Path $AppRoot "mobile") -Command $expoCommand
}

$summary = [pscustomobject]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  backendHealthUrl = $backendHealthUrl
  mobileApiBaseUrl = $ApiBaseUrl
  mobileApiKey = if ($MobileApiKey.Trim()) { "configured" } else { "missing" }
  createdMobileCredential = if ($mobileCredential) {
    [pscustomobject]@{
      userId = $mobileCredential.userId
      username = $mobileCredential.username
      keyId = $mobileCredential.keyId
      targetBalanceUSDT = $mobileCredential.targetBalanceUSDT
      token = "[redacted]"
    }
  } else {
    $null
  }
  eventSlugs = $EventSlugs
  durationSeconds = $DurationSeconds
  pollMs = $PollMs
  started = $started
  skipped = $skipped
  runtimeDir = $RuntimeDir
}

$summaryPath = Join-Path $RuntimeDir "latest-summary.json"
$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryPath -Encoding UTF8
$summary | ConvertTo-Json -Depth 6
