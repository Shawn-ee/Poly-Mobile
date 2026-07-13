param(
  [switch]$StartDb,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ComposeFile = Join-Path $RepoRoot "docker-compose.yml"
$summary = [ordered]@{
  dockerCliAvailable = $false
  dockerDaemonReachable = $false
  composeFileFound = $false
  databaseUrlSource = ""
  databaseHost = ""
  databasePort = $null
  databaseName = ""
  databaseUser = ""
  databaseTcpReachable = $false
  usesDefaultLocalComposePort = $false
  canStartLocalDb = $false
  nextSteps = @(
    "Run npm run mobile:backend-readiness:start if local Postgres should be started.",
    "Run npm run db:push or npm run db:migrate when schema setup is needed.",
    "Run npm run mobile:dev-credential after database readiness passes."
  )
}

function Read-EnvDatabaseUrl {
  if ($env:DATABASE_URL) {
    return @{ Source = "process env"; Value = $env:DATABASE_URL }
  }

  $candidates = New-Object System.Collections.Generic.List[string]
  if (-not [string]::IsNullOrWhiteSpace($env:DOTENV_CONFIG_PATH)) {
    $candidates.Add($env:DOTENV_CONFIG_PATH) | Out-Null
  }
  foreach ($fileName in @(".env.local", ".env", ".env.example")) {
    $candidates.Add((Join-Path $RepoRoot $fileName)) | Out-Null
  }
  $current = $RepoRoot.Path
  for ($depth = 0; $depth -lt 8; $depth += 1) {
    $candidates.Add((Join-Path $current "Poly\.env")) | Out-Null
    $parent = Split-Path -Parent $current
    if ($parent -eq $current -or [string]::IsNullOrWhiteSpace($parent)) {
      break
    }
    $current = $parent
  }

  foreach ($path in ($candidates | Select-Object -Unique)) {
    if (-not $path -or -not (Test-Path -LiteralPath $path)) {
      continue
    }

    $line = Get-Content -LiteralPath $path | Where-Object { $_ -match "^\s*DATABASE_URL\s*=" } | Select-Object -First 1
    if ($line) {
      $value = ($line -replace "^\s*DATABASE_URL\s*=\s*", "").Trim().Trim('"').Trim("'")
      return @{ Source = $path; Value = $value }
    }
  }

  return @{ Source = "missing"; Value = "" }
}

function Parse-DatabaseUrl($url) {
  if (-not $url) {
    return $null
  }

  try {
    $uri = [Uri]$url
    $database = $uri.AbsolutePath.TrimStart("/")
    $user = ""
    if ($uri.UserInfo) {
      $user = ($uri.UserInfo -split ":", 2)[0]
    }
    return @{
      Host = $uri.Host
      Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
      Database = $database
      User = $user
      Masked = $url -replace "://([^:]+):([^@]+)@", '://$1:[redacted]@'
    }
  } catch {
    throw "DATABASE_URL could not be parsed: $($_.Exception.Message)"
  }
}

function Test-TcpPort($hostName, $port) {
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $connect = $client.BeginConnect($hostName, [int]$port, $null, $null)
    $success = $connect.AsyncWaitHandle.WaitOne(2000, $false)
    if ($success) {
      $client.EndConnect($connect)
    }
    $client.Close()
    return $success
  } catch {
    return $false
  }
}

Write-Host "MOBILE BACKEND READINESS"

$dockerAvailable = $false
$dockerDaemonAvailable = $false
try {
  $dockerVersion = docker --version
  $dockerAvailable = $LASTEXITCODE -eq 0
  if ($dockerAvailable) {
    Write-Host "PASS Docker CLI available: $dockerVersion"
    $summary.dockerCliAvailable = $true
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $dockerInfoOutput = docker info --format "{{.ServerVersion}}" 2>&1
      $dockerInfoExitCode = $LASTEXITCODE
      if ($dockerInfoExitCode -eq 0) {
        $dockerDaemonAvailable = $true
      } else {
        $dockerPsOutput = docker ps --format "{{.ID}}" 2>&1
        $dockerPsExitCode = $LASTEXITCODE
        $dockerDaemonAvailable = $dockerPsExitCode -eq 0
      }
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($dockerDaemonAvailable) {
      if ($dockerInfoExitCode -eq 0) {
        Write-Host "PASS Docker daemon is reachable."
      } else {
        Write-Host "PASS Docker daemon is reachable through docker ps fallback."
      }
      $summary.dockerDaemonReachable = $true
    } else {
      Write-Host "WARN Docker daemon is not reachable. Start Docker Desktop before starting local Postgres."
      if ($dockerInfoOutput) {
        Write-Host ($dockerInfoOutput | Out-String).Trim()
      }
      if ($dockerPsOutput) {
        Write-Host ($dockerPsOutput | Out-String).Trim()
      }
    }
  }
} catch {
  Write-Host "WARN Docker CLI unavailable: $($_.Exception.Message)"
}

if (-not (Test-Path $ComposeFile)) {
  throw "docker-compose.yml was not found at $ComposeFile"
}
Write-Host "PASS Compose file found."
$summary.composeFileFound = $true
$summary.canStartLocalDb = $dockerAvailable -and $dockerDaemonAvailable

if ($StartDb) {
  if (-not $dockerAvailable -or -not $dockerDaemonAvailable) {
    throw "Cannot start db because Docker daemon is unavailable."
  }
  docker compose -f $ComposeFile up -d db
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose up -d db failed."
  }
  Write-Host "PASS Requested local db start through docker compose."
}

if ($dockerAvailable -and $dockerDaemonAvailable) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    docker compose -f $ComposeFile ps db
    if ($LASTEXITCODE -ne 0) {
      Write-Host "WARN Could not inspect docker compose db service."
    }
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

$databaseUrl = Read-EnvDatabaseUrl
$parsed = Parse-DatabaseUrl $databaseUrl.Value
if (-not $parsed) {
  throw "DATABASE_URL is missing from env/.env.local/.env/.env.example."
}

Write-Host "DATABASE_URL source: $($databaseUrl.Source)"
Write-Host "DATABASE_URL target: $($parsed.Masked)"
Write-Host "DATABASE target parts: user=$($parsed.User) host=$($parsed.Host) port=$($parsed.Port) database=$($parsed.Database)"
$summary.databaseUrlSource = $databaseUrl.Source
$summary.databaseHost = $parsed.Host
$summary.databasePort = [int]$parsed.Port
$summary.databaseName = $parsed.Database
$summary.databaseUser = $parsed.User

$portOpen = Test-TcpPort $parsed.Host $parsed.Port
if ($portOpen) {
  Write-Host "PASS Database TCP port is reachable."
  $summary.databaseTcpReachable = $true
} else {
  Write-Host "WARN Database TCP port is not reachable at $($parsed.Host):$($parsed.Port)."
}

if ($parsed.Host -in @("localhost", "127.0.0.1") -and [int]$parsed.Port -eq 5432) {
  Write-Host "PASS DATABASE_URL points at the local docker-compose port."
  $summary.usesDefaultLocalComposePort = $true
} else {
  Write-Host "WARN DATABASE_URL does not point at the default local docker-compose port."
}

Write-Host "NEXT STEPS"
Write-Host "1. Run npm run mobile:backend-readiness:start if local Postgres should be started."
Write-Host "2. Run npm run db:push or npm run db:migrate when schema setup is needed."
Write-Host "3. Run npm run mobile:dev-credential after database readiness passes."

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
  $summary | ConvertTo-Json -Depth 4 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "SUMMARY written to $resolvedSummaryPath"
}
