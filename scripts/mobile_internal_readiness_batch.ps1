param(
  [string]$OutputDir = "docs\mobile\harness\batch-internal-readiness-latest",
  [string]$BackendBaseUrl = "http://127.0.0.1:3002",
  [string]$Cycle = "BATCHREADINESS",
  [ValidateSet("cached", "refresh")]
  [string]$ProviderDiscoveryMode = "cached"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ResolvedOutputDir = Join-Path $RepoRoot $OutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

function ConvertTo-RepoPath {
  param([string]$Path)
  return $Path.Replace($RepoRoot.Path + "\", "").Replace("\", "/")
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
    [int]$Depth = 20
  )

  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $json = ($Value | ConvertTo-Json -Depth $Depth) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Normalize-JsonFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }
  $json = Read-JsonFile $Path
  if ($null -ne $json) {
    Write-JsonFile -Value $json -Path $Path -Depth 20
  }
}

function Get-JsonGeneratedAt {
  param([object]$Json)
  if (-not $Json) {
    return $null
  }
  if ($Json.generatedAt) {
    return [string]$Json.generatedAt
  }
  if ($Json.summary -and $Json.summary.generatedAt) {
    return [string]$Json.summary.generatedAt
  }
  return $null
}

function Get-CachedProviderEvidence {
  param(
    [string]$Name,
    [string]$Path,
    [object]$Json,
    [int]$MaxAgeHours
  )

  $generatedAt = Get-JsonGeneratedAt $Json
  $ageHours = $null
  $staleAt = $null
  $hoursUntilStale = $null
  $fresh = $false
  if ($generatedAt) {
    try {
      $parsed = [datetimeoffset]::Parse($generatedAt)
      $nowUtc = (Get-Date).ToUniversalTime()
      $ageHours = [math]::Round(($nowUtc - $parsed.UtcDateTime).TotalHours, 2)
      $staleAtDate = $parsed.UtcDateTime.AddHours($MaxAgeHours)
      $staleAt = $staleAtDate.ToString("o")
      $hoursUntilStale = [math]::Round(($staleAtDate - $nowUtc).TotalHours, 2)
      $fresh = [bool]($ageHours -ge 0 -and $ageHours -le $MaxAgeHours)
    } catch {
      $ageHours = $null
      $staleAt = $null
      $hoursUntilStale = $null
      $fresh = $false
    }
  }

  return [ordered]@{
    name = $Name
    summaryPath = ConvertTo-RepoPath $Path
    generatedAt = $generatedAt
    ageHours = $ageHours
    maxAgeHours = $MaxAgeHours
    staleAt = $staleAt
    hoursUntilStale = $hoursUntilStale
    fresh = $fresh
    present = [bool]$Json
  }
}

function Resolve-RepoArtifactPath {
  param([string]$ArtifactPath)
  if ([string]::IsNullOrWhiteSpace($ArtifactPath)) {
    return $null
  }
  if ([System.IO.Path]::IsPathRooted($ArtifactPath)) {
    return $ArtifactPath
  }
  return Join-Path $RepoRoot ($ArtifactPath.Replace("/", "\"))
}

function Test-RepoArtifactExists {
  param([string]$ArtifactPath)
  $resolvedArtifact = Resolve-RepoArtifactPath $ArtifactPath
  if (-not $resolvedArtifact) {
    return $false
  }
  if ($resolvedArtifact -match "[\*\?]") {
    return [bool](Get-ChildItem -Path $resolvedArtifact -ErrorAction SilentlyContinue | Select-Object -First 1)
  }
  return Test-Path -LiteralPath $resolvedArtifact
}

function Get-S23ProofEvidence {
  param(
    [string]$Name,
    [string]$SummaryPath,
    [string[]]$RequiredAssertions,
    [int]$MaxAgeHours = 24
  )

  $summary = Read-JsonFile $SummaryPath
  $missingArtifacts = New-Object System.Collections.Generic.List[string]
  $failedAssertions = New-Object System.Collections.Generic.List[string]

  if (-not $summary) {
    return [ordered]@{
      name = $Name
      summaryPath = ConvertTo-RepoPath $SummaryPath
      pass = $false
      reason = "summary_missing"
      generatedAt = $null
      device = $null
      model = $null
      missingArtifacts = @()
      failedAssertions = $RequiredAssertions
    }
  }

  foreach ($artifact in @($summary.artifacts)) {
    if (-not (Test-RepoArtifactExists ([string]$artifact))) {
      $missingArtifacts.Add([string]$artifact) | Out-Null
    }
  }
  foreach ($artifactField in @("counterpartyProof", "cleanupProof", "cashoutCounterpartyProof")) {
    $artifactValue = $summary.$artifactField
    if ($artifactValue) {
      if (-not (Test-RepoArtifactExists ([string]$artifactValue))) {
        $missingArtifacts.Add([string]$artifactValue) | Out-Null
      }
    }
  }

  foreach ($assertion in $RequiredAssertions) {
    if (-not ($summary.assertions -and ($summary.assertions.$assertion -eq $true))) {
      $failedAssertions.Add($assertion) | Out-Null
    }
  }

  $resultPass = [bool]($summary.result -eq "pass")
  $deviceMatches = [bool]($summary.device -eq "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp")
  $modelMatches = [bool]($summary.model -eq "SM-S911U1")
  $proofAgeHours = $null
  $proofFresh = $false
  $proofStaleAt = $null
  $hoursUntilStale = $null
  if ($summary.generatedAt) {
    try {
      $nowUtc = (Get-Date).ToUniversalTime()
      $proofGeneratedAt = [datetimeoffset]::Parse([string]$summary.generatedAt)
      $staleAtUtc = $proofGeneratedAt.UtcDateTime.AddHours($MaxAgeHours)
      $proofAgeHours = [math]::Round(($nowUtc - $proofGeneratedAt.UtcDateTime).TotalHours, 2)
      $hoursUntilStale = [math]::Round(($staleAtUtc - $nowUtc).TotalHours, 2)
      $proofStaleAt = $staleAtUtc.ToString("o")
      $proofFresh = [bool]($proofAgeHours -ge 0 -and $proofAgeHours -le $MaxAgeHours)
    } catch {
      $proofAgeHours = $null
      $proofFresh = $false
      $proofStaleAt = $null
      $hoursUntilStale = $null
    }
  }
  $pass = [bool]($resultPass -and $deviceMatches -and $modelMatches -and $proofFresh -and $missingArtifacts.Count -eq 0 -and $failedAssertions.Count -eq 0)
  $reason = if ($pass) {
    "pass"
  } elseif (-not $resultPass) {
    "summary_result_not_pass"
  } elseif (-not $deviceMatches -or -not $modelMatches) {
    "wrong_device"
  } elseif (-not $proofFresh) {
    "proof_stale_or_unparseable"
  } elseif ($missingArtifacts.Count -gt 0) {
    "artifact_missing"
  } else {
    "assertion_missing"
  }

  return [ordered]@{
    name = $Name
    summaryPath = ConvertTo-RepoPath $SummaryPath
    pass = $pass
    reason = $reason
    generatedAt = $summary.generatedAt
    proofAgeHours = $proofAgeHours
    maxAgeHours = $MaxAgeHours
    staleAt = $proofStaleAt
    hoursUntilStale = $hoursUntilStale
    fresh = $proofFresh
    device = $summary.device
    model = $summary.model
    eventSlug = $summary.eventSlug
    lineMarketGroupKey = $summary.lineMarketGroupKey
    lineValue = $summary.lineValue
    lineOutcomeLabel = $summary.lineOutcomeLabel
    missingArtifacts = $missingArtifacts.ToArray()
    failedAssertions = $failedAssertions.ToArray()
  }
}

function Invoke-BatchCommand {
  param(
    [string]$Name,
    [string]$Command,
    [string]$OutputPath,
    [switch]$AllowNonZero
  )

  $stdoutPath = Join-Path $ResolvedOutputDir "$Name.stdout.log"
  $stderrPath = Join-Path $ResolvedOutputDir "$Name.stderr.log"
  Write-Host "RUN $Name"

  $previousLocation = Get-Location
  try {
    Set-Location $RepoRoot
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", $Command) -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $exitCode = $process.ExitCode
  } finally {
    Set-Location $previousLocation
  }

  if ($exitCode -ne 0 -and -not $AllowNonZero) {
    throw "$Name failed with exit code $exitCode. See $stdoutPath"
  }

  return [ordered]@{
    name = $Name
    command = $Command
    exitCode = $exitCode
    allowedNonZero = [bool]$AllowNonZero
    outputPath = ConvertTo-RepoPath $OutputPath
    stdoutPath = ConvertTo-RepoPath $stdoutPath
    stderrPath = if (Test-Path -LiteralPath $stderrPath) { ConvertTo-RepoPath $stderrPath } else { $null }
    producedJson = Test-Path -LiteralPath $OutputPath
  }
}

function Add-CachedOrRunBatchCommand {
  param(
    [System.Collections.Generic.List[object]]$StepList,
    [string]$Name,
    [string]$Command,
    [string]$OutputPath,
    [bool]$UseCached,
    [switch]$AllowNonZero
  )

  if ($UseCached -and (Test-Path -LiteralPath $OutputPath)) {
    $StepList.Add([ordered]@{
      name = $Name
      command = "cached:$Name"
      exitCode = 0
      allowedNonZero = [bool]$AllowNonZero
      outputPath = ConvertTo-RepoPath $OutputPath
      stdoutPath = $null
      stderrPath = $null
      producedJson = $true
      cached = $true
      reason = "provider_discovery_mode_cached"
    }) | Out-Null
    return
  }

  $StepList.Add((Invoke-BatchCommand -Name $Name -Command $Command -OutputPath $OutputPath -AllowNonZero:$AllowNonZero)) | Out-Null
}

function Invoke-OptionalTextCommand {
  param(
    [string]$Command,
    [int]$TimeoutSeconds = 8
  )

  try {
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c $Command"
    $psi.WorkingDirectory = $RepoRoot.Path
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $process = [System.Diagnostics.Process]::Start($psi)
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try { $process.Kill($true) } catch {}
      return [ordered]@{
        exitCode = $null
        timedOut = $true
        stdout = ""
        stderr = "Timed out after $TimeoutSeconds seconds."
      }
    }

    return [ordered]@{
      exitCode = $process.ExitCode
      timedOut = $false
      stdout = $process.StandardOutput.ReadToEnd().Trim()
      stderr = $process.StandardError.ReadToEnd().Trim()
    }
  } catch {
    return [ordered]@{
      exitCode = $null
      timedOut = $false
      stdout = ""
      stderr = $_.Exception.Message
    }
  }
}

function Get-EnvironmentHealthSnapshot {
  $gitBranch = Invoke-OptionalTextCommand "git branch --show-current"
  $gitStatus = Invoke-OptionalTextCommand "git status --short --branch"
  $adbDevices = Invoke-OptionalTextCommand "adb devices -l"
  $dockerDb = Invoke-OptionalTextCommand "docker ps --filter ""name=poly_postgres"" --format ""{{.Names}} {{.Status}} {{.Ports}}"""
  $ports = Invoke-OptionalTextCommand "powershell -NoProfile -Command ""Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { `$_.LocalPort -in 3002,8081,8289,19000,19001,19002 } | Select-Object LocalPort,OwningProcess | Sort-Object LocalPort | ConvertTo-Json -Compress"""
  $botProcesses = Invoke-OptionalTextCommand "powershell -NoProfile -Command ""Get-CimInstance Win32_Process | Where-Object { `$_.Name -match 'node|npm|tsx|powershell' -and `$_.CommandLine -match 'bot:polymarket|reference:snapshot-watch|poly-bot|soak_orderbook|refresh_reference_snapshots' -and `$_.CommandLine -notmatch 'Where-Object' } | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress"""

  $gitStatusLines = if ($gitStatus.stdout) { @($gitStatus.stdout -split "`r?`n") } else { @() }
  $dirtyLines = @($gitStatusLines | Where-Object { $_ -and ($_ -notmatch '^## ') })
  $adbConnected = [bool]($adbDevices.stdout -match "adb-R3CW20LFMLW-7OpoO6\._adb-tls-connect\._tcp\s+device")
  $dbHealthy = [bool]($dockerDb.stdout -match "poly_postgres" -and $dockerDb.stdout -match "\(healthy\)")
  $expoRunning = [bool]($ports.stdout -match '"LocalPort":8081' -or $ports.stdout -match '"LocalPort":19000' -or $ports.stdout -match '"LocalPort":19001' -or $ports.stdout -match '"LocalPort":19002')
  $backendPortListening = [bool]($ports.stdout -match '"LocalPort":3002')
  $proofPortListening = [bool]($ports.stdout -match '"LocalPort":8289')
  $botRunning = [bool]($botProcesses.stdout -and $botProcesses.stdout -ne "[]" -and $botProcesses.stdout -ne "null")

  return [ordered]@{
    git = [ordered]@{
      branch = $gitBranch.stdout
      status = $gitStatus.stdout
      worktreeClean = ($gitStatus.exitCode -eq 0 -and $dirtyLines.Count -eq 0)
    }
    android = [ordered]@{
      targetDeviceId = "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp"
      targetModel = "SM_S911U1"
      s23Connected = $adbConnected
      adbDevices = $adbDevices.stdout
    }
    docker = [ordered]@{
      polyPostgresHealthy = $dbHealthy
      polyPostgresStatus = $dockerDb.stdout
    }
    localServices = [ordered]@{
      backendPort3002Listening = $backendPortListening
      expoRunning = $expoRunning
      proofPort8289Listening = $proofPortListening
      listeningPortsJson = $ports.stdout
    }
    bot = [ordered]@{
      runningContinuously = $botRunning
      matchingProcessesJson = $botProcesses.stdout
    }
  }
}

$backendPath = Join-Path $ResolvedOutputDir "mobile-backend-readiness.json"
$credentialPath = Join-Path $ResolvedOutputDir "mobile-credential-readiness.json"
$googleAuthPath = Join-Path $ResolvedOutputDir "google-auth-runtime-preflight.json"
$googlePhysicalPath = Join-Path $ResolvedOutputDir "google-auth-physical-callback-preflight.json"
$googleLanPhysicalPath = Join-Path $ResolvedOutputDir "google-auth-lan-callback-preflight.json"
$internalMvpStartupPath = Join-Path $ResolvedOutputDir "internal-mvp-startup-contract.json"
$localMatchBreadthPath = Join-Path $ResolvedOutputDir "mobile-mvp-local-match-breadth.json"
$currentStatePath = Join-Path $ResolvedOutputDir "mobile-current-state-inspection.json"
$providerSnapshotRefreshPath = Join-Path $ResolvedOutputDir "provider-snapshot-refresh.json"
$exchangePath = Join-Path $ResolvedOutputDir "internal-exchange-readiness.json"
$providerTradableFlowPath = Join-Path $ResolvedOutputDir "provider-visible-tradable-flow.json"
$matchScanPath = Join-Path $ResolvedOutputDir "worldcup-match-event-scan.json"
$lineScanPath = Join-Path $ResolvedOutputDir "provider-line-breadth-scan.json"
$rootTypecheckMarkerPath = Join-Path $ResolvedOutputDir "root-typecheck.json"
$jestCiMarkerPath = Join-Path $ResolvedOutputDir "jest-ci.json"
$mobileTypecheckMarkerPath = Join-Path $ResolvedOutputDir "mobile-typecheck.json"
$filledS23ProofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-XG-full-local-mvp-s23-flow\cycle-XG-current-mvp-s23-visible-flow.json"
$cancelS23ProofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-XH-open-order-cancel-s23-flow\cycle-XH-current-mvp-s23-visible-flow.json"
$cashoutS23ProofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-XI-cashout-sell-s23-flow\cycle-XI-current-mvp-s23-visible-flow.json"
$totalsS23ProofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-WF-line-family-s23-proof\cycle-WF-current-mvp-s23-visible-flow.json"
$teamTotalsS23ProofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-WG-team-total-s23-proof\cycle-WG-current-mvp-s23-visible-flow.json"
$sportsbookS23ProofPath = Join-Path $RepoRoot "docs\mobile\harness\cycle-ODDSAPIS23-odds-api-s23-visible-flow\cycle-ODDSAPIS23-odds-api-s23-visible-flow.json"
$sportsbookSingleEventSummaryPath = Join-Path $RepoRoot "docs\mobile\harness\the-odds-api-single-event\single-event-summary.redacted.json"
$sportsbookMobileFlowProofPath = Join-Path $RepoRoot "docs\mobile\harness\the-odds-api-single-event\mobile-flow-proof.redacted.json"
$s23ProofMaxAgeHours = 24
$cachedProviderEvidenceMaxAgeHours = 24
$sportsbookBackendProofMaxAgeHours = 24
$backendRepoPath = ConvertTo-RepoPath $backendPath
$credentialRepoPath = ConvertTo-RepoPath $credentialPath
$googleAuthRepoPath = ConvertTo-RepoPath $googleAuthPath
$googlePhysicalRepoPath = ConvertTo-RepoPath $googlePhysicalPath
$googleLanPhysicalRepoPath = ConvertTo-RepoPath $googleLanPhysicalPath
$internalMvpStartupRepoPath = ConvertTo-RepoPath $internalMvpStartupPath
$localMatchBreadthRepoPath = ConvertTo-RepoPath $localMatchBreadthPath
$currentStateRepoPath = ConvertTo-RepoPath $currentStatePath
$providerSnapshotRefreshRepoPath = ConvertTo-RepoPath $providerSnapshotRefreshPath
$exchangeRepoPath = ConvertTo-RepoPath $exchangePath
$providerTradableFlowRepoPath = ConvertTo-RepoPath $providerTradableFlowPath
$matchScanRepoPath = ConvertTo-RepoPath $matchScanPath
$lineScanRepoPath = ConvertTo-RepoPath $lineScanPath
$rootTypecheckMarkerRepoPath = ConvertTo-RepoPath $rootTypecheckMarkerPath
$jestCiMarkerRepoPath = ConvertTo-RepoPath $jestCiMarkerPath
$mobileTypecheckMarkerRepoPath = ConvertTo-RepoPath $mobileTypecheckMarkerPath
$s23ProofRecoveryCommands = @(
  [ordered]@{
    name = "filled-buy-history"
    summaryPath = ConvertTo-RepoPath $filledS23ProofPath
    command = "powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle XG -OutputDir docs\mobile\screenshots\cycle-XG-full-local-mvp-s23-flow -HierarchyOutputDir docs\mobile\harness\cycle-XG-full-local-mvp-s23-flow -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle `"Australia vs. Egypt`" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineOutcomeLabel `"Egypt +1.5`" -SeedCounterparty -ExpectFilledHistory"
  },
  [ordered]@{
    name = "open-order-cancel"
    summaryPath = ConvertTo-RepoPath $cancelS23ProofPath
    command = "powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle XH -OutputDir docs\mobile\screenshots\cycle-XH-open-order-cancel-s23-flow -HierarchyOutputDir docs\mobile\harness\cycle-XH-open-order-cancel-s23-flow -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle `"Australia vs. Egypt`" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineOutcomeLabel `"Egypt +1.5`" -ExpectOpenOrder -ExpectCancel"
  },
  [ordered]@{
    name = "cashout-sell-history"
    summaryPath = ConvertTo-RepoPath $cashoutS23ProofPath
    command = "powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle XI -OutputDir docs\mobile\screenshots\cycle-XI-cashout-sell-s23-flow -HierarchyOutputDir docs\mobile\harness\cycle-XI-cashout-sell-s23-flow -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle `"Australia vs. Egypt`" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineOutcomeLabel `"Egypt +1.5`" -SeedCounterparty -ExpectFilledHistory -ExpectCashout"
  },
  [ordered]@{
    name = "totals-filled-buy-history"
    summaryPath = ConvertTo-RepoPath $totalsS23ProofPath
    command = "powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle WF -OutputDir docs\mobile\screenshots\cycle-WF-line-family-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-WF-line-family-s23-proof -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle `"Australia vs. Egypt`" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineMarketGroupKey totals -LineMarketType totals -LineGroupTitle Total -LineValue 2.5 -LineOutcomeSide over -LineOutcomeLabel `"Over 2.5`" -SeedCounterparty -ExpectFilledHistory"
  },
  [ordered]@{
    name = "team-totals-filled-buy-history"
    summaryPath = ConvertTo-RepoPath $teamTotalsS23ProofPath
    command = "powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle WG -OutputDir docs\mobile\screenshots\cycle-WG-team-total-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-WG-team-total-s23-proof -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle `"Australia vs. Egypt`" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineMarketGroupKey team-totals -LineMarketType team-total -LineValue 1.5 -LineOutcomeSide over -LineOutcomeLabel `"Australia Over 1.5`" -LineTapPrefix event-detail-outcome-team-total-goals- -SeedCounterparty -ExpectFilledHistory"
  },
  [ordered]@{
    name = "temporary-sportsbook-filled-buy-history"
    summaryPath = ConvertTo-RepoPath $sportsbookS23ProofPath
    command = "npm run mobile:the-odds-api-s23-visible-flow"
  }
)

$environmentHealth = Get-EnvironmentHealthSnapshot
$providerDiscoveryRefresh = [bool]($ProviderDiscoveryMode -eq "refresh")

$steps = New-Object System.Collections.Generic.List[object]
$steps.Add((Invoke-BatchCommand -Name "backend-readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_backend_readiness.ps1 -SummaryPath `"$backendRepoPath`"" -OutputPath $backendPath))
$steps.Add((Invoke-BatchCommand -Name "credential-readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_credential_readiness.ps1 -SummaryPath `"$credentialRepoPath`"" -OutputPath $credentialPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "google-auth-runtime-preflight" -Command "powershell -ExecutionPolicy Bypass -File mobile\scripts\google-auth-runtime-preflight.ps1 -BackendAuthBase `"$BackendBaseUrl`" -NextAuthUrl `"$BackendBaseUrl`" -SummaryPath `"$googleAuthRepoPath`"" -OutputPath $googleAuthPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "google-auth-physical-callback-preflight" -Command "powershell -ExecutionPolicy Bypass -File mobile\scripts\google-auth-runtime-preflight.ps1 -BackendAuthBase `"$BackendBaseUrl`" -NextAuthUrl `"$BackendBaseUrl`" -RequirePhysicalDeviceCallback -SummaryPath `"$googlePhysicalRepoPath`"" -OutputPath $googlePhysicalPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "google-auth-lan-callback-preflight" -Command "powershell -ExecutionPolicy Bypass -File scripts\mobile_google_lan_auth_preflight.ps1 -BackendPort 3002 -SummaryPath `"$googleLanPhysicalRepoPath`"" -OutputPath $googleLanPhysicalPath -AllowNonZero))
$steps.Add((Invoke-BatchCommand -Name "internal-mvp-startup-contract" -Command "powershell -ExecutionPolicy Bypass -File scripts\start_poly_mobile_rehearsal.ps1 -SkipBackend -SkipSnapshotWatch -SkipBots -SkipExpo -SummaryPath `"$internalMvpStartupRepoPath`"" -OutputPath $internalMvpStartupPath))
$steps.Add((Invoke-BatchCommand -Name "local-match-breadth" -Command "npx.cmd tsx scripts/seed_mobile_mvp_local_match_breadth.ts --baseUrl=$BackendBaseUrl --summaryPath=`"$localMatchBreadthRepoPath`"" -OutputPath $localMatchBreadthPath))
$steps.Add((Invoke-BatchCommand -Name "current-state" -Command "npx.cmd tsx scripts/inspect_mobile_mvp_current_state.ts --baseUrl=$BackendBaseUrl --summaryPath=`"$currentStateRepoPath`" --cycle=$Cycle" -OutputPath $currentStatePath))
Add-CachedOrRunBatchCommand -StepList $steps -Name "provider-snapshot-refresh" -Command "npm.cmd run reference:snapshot-refresh -- --once true --eventSlug argentina-vs-egypt --summaryPath `"$providerSnapshotRefreshRepoPath`"" -OutputPath $providerSnapshotRefreshPath -AllowNonZero -UseCached:(-not $providerDiscoveryRefresh)
Add-CachedOrRunBatchCommand -StepList $steps -Name "internal-exchange-readiness" -Command "npm.cmd run poly:internal-exchange-readiness -- --summaryPath `"$exchangeRepoPath`"" -OutputPath $exchangePath -AllowNonZero -UseCached:(-not $providerDiscoveryRefresh)
Add-CachedOrRunBatchCommand -StepList $steps -Name "provider-visible-tradable-flow" -Command "npx.cmd tsx scripts/prove_mobile_provider_visible_tradable_flow.ts --cycle=$Cycle --baseUrl=$BackendBaseUrl --summaryPath=`"$providerTradableFlowRepoPath`"" -OutputPath $providerTradableFlowPath -AllowNonZero -UseCached:(-not $providerDiscoveryRefresh)
Add-CachedOrRunBatchCommand -StepList $steps -Name "worldcup-match-scan" -Command "npm.cmd run inspect:polymarket-worldcup-matches -- --output `"$matchScanRepoPath`"" -OutputPath $matchScanPath -UseCached:(-not $providerDiscoveryRefresh)
Add-CachedOrRunBatchCommand -StepList $steps -Name "provider-line-scan" -Command "npm.cmd run mobile:provider-line-breadth-scan -- --summaryPath=`"$lineScanRepoPath`" --cycle=$Cycle" -OutputPath $lineScanPath -UseCached:(-not $providerDiscoveryRefresh)
$steps.Add((Invoke-BatchCommand -Name "root-typecheck" -Command "npx.cmd tsc --noEmit --pretty false --incremental false && node -e `"require('fs').writeFileSync('$rootTypecheckMarkerRepoPath', JSON.stringify({ pass: true, command: 'npx tsc --noEmit --pretty false --incremental false', generatedAt: new Date().toISOString() }, null, 2) + '\n')`"" -OutputPath $rootTypecheckMarkerPath))
$steps.Add((Invoke-BatchCommand -Name "jest-ci" -Command "npm.cmd run test:ci && node -e `"require('fs').writeFileSync('$jestCiMarkerRepoPath', JSON.stringify({ pass: true, command: 'npm run test:ci', generatedAt: new Date().toISOString() }, null, 2) + '\n')`"" -OutputPath $jestCiMarkerPath))
$steps.Add((Invoke-BatchCommand -Name "mobile-typecheck" -Command "npm.cmd --prefix mobile run typecheck && node -e `"require('fs').writeFileSync('$mobileTypecheckMarkerRepoPath', JSON.stringify({ pass: true, command: 'npm --prefix mobile run typecheck', generatedAt: new Date().toISOString() }, null, 2) + '\n')`"" -OutputPath $mobileTypecheckMarkerPath))

$backend = Read-JsonFile $backendPath
$credential = Read-JsonFile $credentialPath
$googleAuth = Read-JsonFile $googleAuthPath
$googlePhysical = Read-JsonFile $googlePhysicalPath
$googleLanPhysical = Read-JsonFile $googleLanPhysicalPath
$internalMvpStartup = Read-JsonFile $internalMvpStartupPath
$localMatchBreadth = Read-JsonFile $localMatchBreadthPath
$currentState = Read-JsonFile $currentStatePath
$providerSnapshotRefresh = Read-JsonFile $providerSnapshotRefreshPath
$exchange = Read-JsonFile $exchangePath
$providerTradableFlow = Read-JsonFile $providerTradableFlowPath
$matchScan = Read-JsonFile $matchScanPath
$lineScan = Read-JsonFile $lineScanPath
$rootTypecheck = Read-JsonFile $rootTypecheckMarkerPath
$jestCi = Read-JsonFile $jestCiMarkerPath
$mobileTypecheck = Read-JsonFile $mobileTypecheckMarkerPath
$sportsbookSingleEventSummary = Read-JsonFile $sportsbookSingleEventSummaryPath
$sportsbookMobileFlowProof = Read-JsonFile $sportsbookMobileFlowProofPath
$cachedProviderEvidence = @(
  (Get-CachedProviderEvidence -Name "provider-snapshot-refresh" -Path $providerSnapshotRefreshPath -Json $providerSnapshotRefresh -MaxAgeHours $cachedProviderEvidenceMaxAgeHours),
  (Get-CachedProviderEvidence -Name "internal-exchange-readiness" -Path $exchangePath -Json $exchange -MaxAgeHours $cachedProviderEvidenceMaxAgeHours),
  (Get-CachedProviderEvidence -Name "provider-visible-tradable-flow" -Path $providerTradableFlowPath -Json $providerTradableFlow -MaxAgeHours $cachedProviderEvidenceMaxAgeHours),
  (Get-CachedProviderEvidence -Name "worldcup-match-scan" -Path $matchScanPath -Json $matchScan -MaxAgeHours $cachedProviderEvidenceMaxAgeHours),
  (Get-CachedProviderEvidence -Name "provider-line-scan" -Path $lineScanPath -Json $lineScan -MaxAgeHours $cachedProviderEvidenceMaxAgeHours)
)
$cachedProviderEvidenceFresh = [bool](($cachedProviderEvidence | Where-Object { -not $_.fresh }).Count -eq 0)
$providerEvidenceNextStale = $cachedProviderEvidence |
  Where-Object { $null -ne $_.hoursUntilStale } |
  Sort-Object hoursUntilStale |
  Select-Object -First 1
$sportsbookBackendProofs = @(
  (Get-CachedProviderEvidence -Name "sportsbook-single-event-live-seed" -Path $sportsbookSingleEventSummaryPath -Json $sportsbookSingleEventSummary -MaxAgeHours $sportsbookBackendProofMaxAgeHours),
  (Get-CachedProviderEvidence -Name "sportsbook-mobile-fake-token-flow" -Path $sportsbookMobileFlowProofPath -Json $sportsbookMobileFlowProof -MaxAgeHours $sportsbookBackendProofMaxAgeHours)
)
$sportsbookBackendProofNextStale = $sportsbookBackendProofs |
  Where-Object { $null -ne $_.hoursUntilStale } |
  Sort-Object hoursUntilStale |
  Select-Object -First 1
$lineFamilyFilledAssertions = @("homeShowsCurrentMatch", "detailShowsGameLines", "detailShowsLineFamilyReadiness", "detailShowsProviderUnavailableLineFamilies", "detailShowsProviderAndFixtureLineSplit", "lineMarketsAreContractFixture", "ticketPreservesLine", "swipeSubmitReachedPortfolio", "filledPositionVisible", "filledHistoryVisible", "orderbookHidden")
$sportsbookFilledAssertions = @("homeShowsTemporarySportsbookEvent", "homeKeepsMvpFeedClean", "detailShowsGameLines", "detailHidesOrderBookAndChat", "sportsbookSpreadLineVisible", "ticketPreservesSportsbookLineIdentity", "swipeSubmitReachedPortfolio", "portfolioPreservesSportsbookLineIdentity", "historyPreservesSportsbookLineIdentity")
$s23Proofs = @(
  (Get-S23ProofEvidence -Name "filled-buy-history" -SummaryPath $filledS23ProofPath -RequiredAssertions @("homeShowsCurrentMatch", "liveShowsPredictionOnlyLocalMvpSourceDisclosure", "detailShowsGameLines", "ticketPreservesLine", "swipeSubmitReachedPortfolio", "filledPositionVisible", "filledHistoryVisible", "orderbookHidden") -MaxAgeHours $s23ProofMaxAgeHours),
  (Get-S23ProofEvidence -Name "open-order-cancel" -SummaryPath $cancelS23ProofPath -RequiredAssertions @("homeShowsCurrentMatch", "liveShowsPredictionOnlyLocalMvpSourceDisclosure", "detailShowsGameLines", "ticketPreservesLine", "swipeSubmitReachedPortfolio", "openOrderVisible", "openOrderSourceBadgeVisible", "cancelSubmitted", "canceledHistoryVisible", "orderbookHidden") -MaxAgeHours $s23ProofMaxAgeHours),
  (Get-S23ProofEvidence -Name "cashout-sell-history" -SummaryPath $cashoutS23ProofPath -RequiredAssertions @("homeShowsCurrentMatch", "liveShowsPredictionOnlyLocalMvpSourceDisclosure", "detailShowsGameLines", "ticketPreservesLine", "swipeSubmitReachedPortfolio", "filledPositionVisible", "filledHistoryVisible", "cashoutTicketOpened", "cashoutSellSubmitted", "cashoutHistoryVisible", "orderbookHidden") -MaxAgeHours $s23ProofMaxAgeHours),
  (Get-S23ProofEvidence -Name "totals-filled-buy-history" -SummaryPath $totalsS23ProofPath -RequiredAssertions $lineFamilyFilledAssertions -MaxAgeHours $s23ProofMaxAgeHours),
  (Get-S23ProofEvidence -Name "team-totals-filled-buy-history" -SummaryPath $teamTotalsS23ProofPath -RequiredAssertions $lineFamilyFilledAssertions -MaxAgeHours $s23ProofMaxAgeHours),
  (Get-S23ProofEvidence -Name "temporary-sportsbook-filled-buy-history" -SummaryPath $sportsbookS23ProofPath -RequiredAssertions $sportsbookFilledAssertions -MaxAgeHours $s23ProofMaxAgeHours)
)
$s23NextStaleProof = $s23Proofs |
  Where-Object { $null -ne $_.hoursUntilStale } |
  Sort-Object hoursUntilStale |
  Select-Object -First 1

$backendReady = [bool]($backend -and $backend.dockerCliAvailable -and $backend.dockerDaemonReachable -and $backend.databaseTcpReachable)
$localMvpReady = [bool]($currentState -and $currentState.diagnosis.serviceReadiness.localMvpPathReady)
$localMatchBreadthReady = [bool]($localMatchBreadth -and $localMatchBreadth.pass)
$s23LocalMvpDeviceProofReady = [bool](($s23Proofs | Where-Object { -not $_.pass }).Count -eq 0)
$sportsbookS23BridgeProofReady = [bool](@($s23Proofs | Where-Object { $_.name -eq "temporary-sportsbook-filled-buy-history" -and $_.pass }).Count -eq 1)
$sportsbookBackendProofReady = [bool](
  ($sportsbookSingleEventSummary -and $sportsbookSingleEventSummary.pass) -and
  ($sportsbookMobileFlowProof -and $sportsbookMobileFlowProof.pass) -and
  (($sportsbookBackendProofs | Where-Object { -not $_.fresh }).Count -eq 0)
)
$rootTypecheckReady = [bool]($rootTypecheck -and $rootTypecheck.pass)
$jestCiReady = [bool]($jestCi -and $jestCi.pass)
$mobileTypecheckReady = [bool]($mobileTypecheck -and $mobileTypecheck.pass)
$providerExchangeReady = [bool]($exchange -and $exchange.readyForInternalMobileExchange)
$providerSnapshotRefreshSucceeded = [bool]($providerSnapshotRefresh -and $providerSnapshotRefresh.summary -and ([int]$providerSnapshotRefresh.summary.errorCount -eq 0))
$providerSnapshotRefreshUpdatedCount = if ($providerSnapshotRefresh -and $providerSnapshotRefresh.summary) { [int]$providerSnapshotRefresh.summary.snapshotsUpdated } else { $null }
$providerMvpTradableFlowReady = [bool]($providerTradableFlow -and $providerTradableFlow.pass)
$providerMvpTradableFlowBlocker = if ($providerTradableFlow -and $providerTradableFlow.blocker) { [string]$providerTradableFlow.blocker } else { $null }
$providerExchangeBlockers = if ($exchange -and $exchange.blockers) { @($exchange.blockers) } else { @() }
$providerBooksUnavailableOrClosed = $providerExchangeBlockers -contains "provider_books_unavailable_or_closed"
$usableMatchCount = if ($matchScan) { [int]$matchScan.summary.usableMatchEventCount } else { 0 }
$worldCupMatchEventCount = if ($matchScan) { [int]$matchScan.summary.matchEventCount } else { $null }
$openWorldCupMatchEventCount = if ($matchScan -and $matchScan.summary.openMatchEventCount -ne $null) { [int]$matchScan.summary.openMatchEventCount } else { $null }
$closedOrEndedWorldCupMatchEventCount = if ($matchScan -and $matchScan.summary.closedOrEndedMatchEventCount -ne $null) { [int]$matchScan.summary.closedOrEndedMatchEventCount } else { $null }
$excludedGenericWorldCupMatchEventCount = if ($matchScan -and $matchScan.summary.excludedGenericWorldCupMatchEventCount -ne $null) { [int]$matchScan.summary.excludedGenericWorldCupMatchEventCount } else { $null }
$openWorldCupEventCount = if ($matchScan -and $matchScan.summary.openWorldCupEventCount -ne $null) { [int]$matchScan.summary.openWorldCupEventCount } else { $null }
$usableOpenWorldCupEventCount = if ($matchScan -and $matchScan.summary.usableOpenWorldCupEventCount -ne $null) { [int]$matchScan.summary.usableOpenWorldCupEventCount } else { $null }
$usableOpenNonMatchWorldCupEventCount = if ($matchScan -and $matchScan.summary.usableOpenNonMatchWorldCupEventCount -ne $null) { [int]$matchScan.summary.usableOpenNonMatchWorldCupEventCount } else { $null }
$attachReadyLineCount = if ($lineScan) { [int]$lineScan.totals.attachReadyProviderLineCandidateCount } else { 0 }
$providerLineCandidateCount = if ($lineScan) { [int]$lineScan.totals.providerLineCandidateCount } else { $null }
$identityCompleteLineCandidateCount = if ($lineScan -and $lineScan.totals.identityCompleteProviderLineCandidateCount -ne $null) { [int]$lineScan.totals.identityCompleteProviderLineCandidateCount } else { $null }
$closedOrUnavailableLineIdentityCount = if ($lineScan -and $lineScan.totals.closedOrUnavailableIdentityLineCandidateCount -ne $null) { [int]$lineScan.totals.closedOrUnavailableIdentityLineCandidateCount } else { $null }
$serverModeApiKeySource = if ($credential) { [string]$credential.apiKeySource } else { $null }
$ambientServerModeReady = [bool]($credential -and $credential.readyForServerBackedSamsungProof -and ($serverModeApiKeySource -eq "environment"))
$localRuntimeServerModeReady = [bool]($credential -and $credential.readyForServerBackedSamsungProof -and ($serverModeApiKeySource -eq "local-runtime-env"))
$googleAuthRuntimeReady = [bool]($googleAuth -and $googleAuth.readyForRuntimeStart)
$googleAuthFailedChecks = New-Object System.Collections.Generic.List[string]
if ($googleAuth -and $googleAuth.failedChecks) {
  foreach ($failedCheck in @($googleAuth.failedChecks)) {
    if (-not [string]::IsNullOrWhiteSpace([string]$failedCheck)) {
      $googleAuthFailedChecks.Add([string]$failedCheck) | Out-Null
    }
  }
}
$googlePhysicalCallbackReady = [bool]($googlePhysical -and $googlePhysical.readyForRuntimeStart)
$googlePhysicalFailedChecks = New-Object System.Collections.Generic.List[string]
if ($googlePhysical -and $googlePhysical.failedChecks) {
  foreach ($failedCheck in @($googlePhysical.failedChecks)) {
    if (-not [string]::IsNullOrWhiteSpace([string]$failedCheck)) {
      $googlePhysicalFailedChecks.Add([string]$failedCheck) | Out-Null
    }
  }
}
$googleLanCallbackReady = [bool]($googleLanPhysical -and $googleLanPhysical.readyForRuntimeStart)
$googleLanFailedChecks = New-Object System.Collections.Generic.List[string]
if ($googleLanPhysical -and $googleLanPhysical.failedChecks) {
  foreach ($failedCheck in @($googleLanPhysical.failedChecks)) {
    if (-not [string]::IsNullOrWhiteSpace([string]$failedCheck)) {
      $googleLanFailedChecks.Add([string]$failedCheck) | Out-Null
    }
  }
}
$googleS23ConsentReady = [bool]($googleLanCallbackReady -or $googlePhysicalCallbackReady)
$googleS23ConsentSource = if ($googleLanCallbackReady) {
  "lan-callback-preflight"
} elseif ($googlePhysicalCallbackReady) {
  "physical-callback-preflight"
} else {
  "not-ready"
}
$googleS23ConsentExpectedCallback = if ($googleLanCallbackReady -and $googleLanPhysical -and $googleLanPhysical.expectedCallback) {
  [string]$googleLanPhysical.expectedCallback
} elseif ($googlePhysicalCallbackReady -and $googlePhysical -and $googlePhysical.expectedCallback) {
  [string]$googlePhysical.expectedCallback
} else {
  ""
}
$internalMvpStartupReady = [bool](
  $internalMvpStartup -and
  $internalMvpStartup.mobileApiBaseUrl -and
  $internalMvpStartup.backendAuthBaseUrl -and
  $internalMvpStartup.expectedGoogleCallback -and
  ([string]$internalMvpStartup.mobileApiBaseUrl).TrimEnd("/") -eq ([string]$internalMvpStartup.backendAuthBaseUrl).TrimEnd("/") -and
  ([string]$internalMvpStartup.expectedGoogleCallback) -eq "$(([string]$internalMvpStartup.backendAuthBaseUrl).TrimEnd('/'))/api/auth/google/callback" -and
  ([string]$internalMvpStartup.mobileApiKey) -eq "missing" -and
  @($internalMvpStartup.started).Count -eq 0
)

$p0Blockers = @()
if (-not $backendReady) { $p0Blockers += "backend_or_local_database_not_ready" }
if (-not $internalMvpStartupReady) { $p0Blockers += "internal_mvp_startup_contract_not_ready" }
if (-not $localMatchBreadthReady) { $p0Blockers += "local_mvp_match_breadth_not_ready" }
if (-not $localMvpReady) { $p0Blockers += "local_mvp_route_not_ready" }
if (-not $s23LocalMvpDeviceProofReady) { $p0Blockers += "s23_local_mvp_device_proof_not_ready" }
if (-not $rootTypecheckReady) { $p0Blockers += "root_typecheck_failed" }
if (-not $jestCiReady) { $p0Blockers += "jest_ci_failed" }
if (-not $mobileTypecheckReady) { $p0Blockers += "mobile_typecheck_failed" }

$p1Blockers = @()
if (-not $providerExchangeReady) {
  if ($providerBooksUnavailableOrClosed) {
    $p1Blockers += "provider_worldcup_match_books_unavailable_or_closed"
  } else {
    $p1Blockers += "provider_internal_exchange_not_ready"
  }
}
if ($providerSnapshotRefresh -and -not $providerSnapshotRefreshSucceeded) {
  $p1Blockers += "provider_snapshot_refresh_has_errors"
}
if ($providerTradableFlow -and -not $providerMvpTradableFlowReady) {
  if ($providerMvpTradableFlowBlocker -eq "provider_mvp_match_bot_quote_unavailable") {
    $p1Blockers += "provider_mvp_match_bot_quote_unavailable"
  } elseif ($providerMvpTradableFlowBlocker -eq "provider_mvp_match_snapshot_not_mm_safe") {
    $p1Blockers += "provider_mvp_match_snapshot_not_mm_safe"
  } elseif ($providerMvpTradableFlowBlocker -eq "provider_mvp_match_market_not_found") {
    $p1Blockers += "provider_mvp_match_market_not_found"
  } elseif ($providerMvpTradableFlowBlocker -eq "non_mvp_provider_event_rejected") {
    $p1Blockers += "provider_tradable_proof_non_mvp_event_rejected"
  } else {
    $p1Blockers += "provider_mvp_tradable_flow_not_ready"
  }
}
if ($usableMatchCount -lt 1) { $p1Blockers += "no_usable_polymarket_worldcup_team_match_books" }
if ($attachReadyLineCount -lt 1) { $p1Blockers += "no_attach_ready_polymarket_worldcup_line_markets" }
if ($ProviderDiscoveryMode -eq "cached" -and -not $cachedProviderEvidenceFresh) { $p1Blockers += "provider_cached_evidence_stale" }
if (-not $sportsbookBackendProofReady) { $p1Blockers += "temporary_sportsbook_backend_proof_stale_or_missing" }
if ($credential -and -not $credential.readyForServerBackedSamsungProof) { $p1Blockers += "manual_server_mode_needs_generated_mobile_api_key" }
if ($googleAuth -and -not $googleAuthRuntimeReady) {
  if ($googleLanCallbackReady -and $googleAuthFailedChecks.Contains("Google redirect_uri matches NEXTAUTH_URL callback")) {
    # A phone-ready backend intentionally emits a LAN callback while the localhost
    # probe expects localhost. The LAN preflight is authoritative for S23 consent.
  } elseif ($googleAuthFailedChecks.Contains("Google redirect_uri matches NEXTAUTH_URL callback")) {
    $p1Blockers += "google_redirect_uri_mismatch"
  } else {
    $p1Blockers += "google_auth_runtime_preflight_has_warnings"
  }
}
if ($googlePhysical -and -not $googlePhysicalCallbackReady) {
  if ($googleLanCallbackReady -and $googlePhysicalFailedChecks.Contains("NEXTAUTH_URL is reachable by a physical Android browser")) {
    # The localhost physical probe is expected to fail when the LAN callback is
    # the active S23-ready path. Keep the failed check in the raw JSON only.
  } elseif ($googlePhysicalFailedChecks.Contains("NEXTAUTH_URL is reachable by a physical Android browser")) {
    $p1Blockers += "google_physical_callback_not_phone_reachable"
  } else {
    $p1Blockers += "google_physical_callback_preflight_has_warnings"
  }
}
if ($googleLanPhysical -and -not $googleLanCallbackReady) {
  if ($googleLanFailedChecks.Contains("Google redirect_uri matches NEXTAUTH_URL callback")) {
    $p1Blockers += "google_lan_callback_redirect_uri_mismatch"
  } elseif ($googleLanFailedChecks.Contains("LAN IPv4 address is detected")) {
    $p1Blockers += "google_lan_ip_not_detected"
  } else {
    $p1Blockers += "google_lan_callback_preflight_has_warnings"
  }
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "mobile-internal-readiness-batch"
  cycle = $Cycle
  backendBaseUrl = $BackendBaseUrl
  providerDiscoveryMode = $ProviderDiscoveryMode
  outputDir = ConvertTo-RepoPath $ResolvedOutputDir
  gapListPath = "docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md"
  steps = $steps
  environmentHealthCaptured = "before-batch-steps"
  environmentHealth = $environmentHealth
  readiness = [ordered]@{
    localMvpReadyForInternalTesting = ($p0Blockers.Count -eq 0)
    providerBackedExchangeReady = $providerExchangeReady
    backendReady = $backendReady
    worktreeClean = $environmentHealth.git.worktreeClean
    dbContainerHealthy = $environmentHealth.docker.polyPostgresHealthy
    s23Connected = $environmentHealth.android.s23Connected
    expoRunning = $environmentHealth.localServices.expoRunning
    botRunningContinuously = $environmentHealth.bot.runningContinuously
    currentRouteLocalMvpReady = $localMvpReady
    mobileCredentialCanBeCreated = [bool]($credential -and $credential.readyToCreateCredential)
    ambientApiKeyReadyForManualServerMode = $ambientServerModeReady
    serverModeApiKeySource = $serverModeApiKeySource
    localRuntimeEnvReadyForManualServerMode = $localRuntimeServerModeReady
    googleAuthRuntimeReady = $googleAuthRuntimeReady
    googleAuthFailedChecks = $googleAuthFailedChecks.ToArray()
    googlePhysicalCallbackReady = $googlePhysicalCallbackReady
    googlePhysicalFailedChecks = $googlePhysicalFailedChecks.ToArray()
    googleLanCallbackReady = $googleLanCallbackReady
    googleLanFailedChecks = $googleLanFailedChecks.ToArray()
    googleS23ConsentReady = $googleS23ConsentReady
    googleS23ConsentSource = $googleS23ConsentSource
    googleS23ConsentExpectedCallback = $googleS23ConsentExpectedCallback
    internalMvpStartupReady = $internalMvpStartupReady
    internalMvpStartupMobileApiBaseUrl = if ($internalMvpStartup) { $internalMvpStartup.mobileApiBaseUrl } else { $null }
    internalMvpStartupBackendAuthBaseUrl = if ($internalMvpStartup) { $internalMvpStartup.backendAuthBaseUrl } else { $null }
    internalMvpStartupExpectedGoogleCallback = if ($internalMvpStartup) { $internalMvpStartup.expectedGoogleCallback } else { $null }
    localMatchBreadthReady = $localMatchBreadthReady
    localMatchBreadthEventCount = if ($localMatchBreadth) { $localMatchBreadth.after.eventCount } else { $null }
    s23LocalMvpDeviceProofReady = $s23LocalMvpDeviceProofReady
    s23ProofMaxAgeHours = $s23ProofMaxAgeHours
    s23ProofNextStaleName = if ($s23NextStaleProof) { $s23NextStaleProof.name } else { $null }
    s23ProofNextStaleAt = if ($s23NextStaleProof) { $s23NextStaleProof.staleAt } else { $null }
    s23ProofHoursUntilStale = if ($s23NextStaleProof) { $s23NextStaleProof.hoursUntilStale } else { $null }
    s23Proofs = $s23Proofs
    temporarySportsbookS23BridgeProofReady = $sportsbookS23BridgeProofReady
    temporarySportsbookBackendProofReady = $sportsbookBackendProofReady
    temporarySportsbookBackendProofMaxAgeHours = $sportsbookBackendProofMaxAgeHours
    temporarySportsbookBackendProofNextStaleName = if ($sportsbookBackendProofNextStale) { $sportsbookBackendProofNextStale.name } else { $null }
    temporarySportsbookBackendProofNextStaleAt = if ($sportsbookBackendProofNextStale) { $sportsbookBackendProofNextStale.staleAt } else { $null }
    temporarySportsbookBackendProofHoursUntilStale = if ($sportsbookBackendProofNextStale) { $sportsbookBackendProofNextStale.hoursUntilStale } else { $null }
    temporarySportsbookBackendProofs = $sportsbookBackendProofs
    rootTypecheckReady = $rootTypecheckReady
    jestCiReady = $jestCiReady
    mobileTypecheckReady = $mobileTypecheckReady
    mobileVisibleEventCount = if ($exchange) { $exchange.mobileExposure.mobileVisibleEventCount } else { $null }
    providerVisibleMarketCount = if ($exchange) { $exchange.providerMarkets.mobileVisibleCount } else { $null }
    providerLocalMmReadyMarketCount = if ($exchange) { $exchange.providerMarkets.localMmReadyCount } else { $null }
    providerBooksUnavailableOrClosed = $providerBooksUnavailableOrClosed
    providerSnapshotRefreshSucceeded = $providerSnapshotRefreshSucceeded
    providerSnapshotRefreshUpdatedCount = $providerSnapshotRefreshUpdatedCount
    cachedProviderEvidenceFresh = $cachedProviderEvidenceFresh
    cachedProviderEvidenceMaxAgeHours = $cachedProviderEvidenceMaxAgeHours
    cachedProviderEvidenceNextStaleName = if ($providerEvidenceNextStale) { $providerEvidenceNextStale.name } else { $null }
    cachedProviderEvidenceNextStaleAt = if ($providerEvidenceNextStale) { $providerEvidenceNextStale.staleAt } else { $null }
    cachedProviderEvidenceHoursUntilStale = if ($providerEvidenceNextStale) { $providerEvidenceNextStale.hoursUntilStale } else { $null }
    cachedProviderEvidence = $cachedProviderEvidence
    providerMvpTradableFlowReady = $providerMvpTradableFlowReady
    providerMvpTradableFlowBlocker = $providerMvpTradableFlowBlocker
    worldCupTeamMatchEventCount = $worldCupMatchEventCount
    openWorldCupTeamMatchEventCount = $openWorldCupMatchEventCount
    closedOrEndedWorldCupTeamMatchEventCount = $closedOrEndedWorldCupMatchEventCount
    excludedGenericWorldCupMatchEventCount = $excludedGenericWorldCupMatchEventCount
    usableWorldCupTeamMatchEventCount = $usableMatchCount
    openWorldCupProviderEventCount = $openWorldCupEventCount
    usableOpenWorldCupProviderEventCount = $usableOpenWorldCupEventCount
    usableOpenNonMatchWorldCupProviderEventCount = $usableOpenNonMatchWorldCupEventCount
    providerLineCandidateCount = $providerLineCandidateCount
    identityCompleteProviderLineCandidateCount = $identityCompleteLineCandidateCount
    closedOrUnavailableProviderLineIdentityCount = $closedOrUnavailableLineIdentityCount
    attachReadyProviderLineCandidateCount = $attachReadyLineCount
  }
  blockers = [ordered]@{
    p0 = $p0Blockers
    p1 = $p1Blockers
  }
  recovery = [ordered]@{
    s23ProofRefreshCommands = $s23ProofRecoveryCommands
    providerRefreshCommand = "npm run mobile:internal-readiness-batch:provider-refresh"
    rerunBatchCommand = "npm run mobile:internal-readiness-batch"
  }
  interpretation = if ($p0Blockers.Count -eq 0) {
    "Local MVP fake-token flow is ready for internal testing; provider-backed breadth/line/MM readiness remains tracked P1 debt."
  } else {
    "Local MVP internal testing is blocked until P0 readiness issues are fixed."
  }
  nextActions = @(
    "For internal user-flow testing, keep using Home -> Event Detail -> contract-shaped line market -> Trade Ticket -> fake-token order -> Portfolio/history.",
    "Do not import futures, awards, player props, or non-World-Cup events to fake match breadth.",
    'If `s23_local_mvp_device_proof_not_ready` appears, run the S23 proof refresh commands in `recovery.s23ProofRefreshCommands`, then rerun `npm run mobile:internal-readiness-batch`.',
    'Use `npm run mobile:internal-readiness-batch:provider-refresh` after provider imports, provider refresh, or line-market discovery changes.',
    'If `provider_cached_evidence_stale` appears, run `npm run mobile:internal-readiness-batch:provider-refresh` before making provider-backed parity decisions.',
    "Run npm run mobile:manual-testing-env before manual server-mode S23 testing if EXPO_PUBLIC_API_KEY is not already set; the batch can recognize the generated local .runtime env file without committing the token.",
    "For real Google consent proof, run npm run mobile:google-auth-lan-preflight, restart the backend with the LAN NEXTAUTH_URL it reports if needed, register that exact callback in Google Cloud, then run npm run mobile:google-auth-runtime-preflight:strict before manual S23 login."
  )
}

$summaryPath = Join-Path $ResolvedOutputDir "internal-readiness-batch-summary.json"
Write-JsonFile -Value $summary -Path $summaryPath -Depth 20
$stepCount = $steps.Count
for ($stepIndex = 0; $stepIndex -lt $stepCount; $stepIndex++) {
  $step = $steps[$stepIndex]
  if ($step.cached -eq $true) {
    continue
  }
  $stepOutputPath = Resolve-RepoArtifactPath ([string]$step.outputPath)
  if ($stepOutputPath) {
    Normalize-JsonFile $stepOutputPath
  }
}
$gapListPath = Join-Path $RepoRoot "docs\mobile\audits\BATCH_INTERNAL_READINESS_GAP_LIST.md"
& npx.cmd tsx scripts/write_mobile_internal_readiness_gap_list.ts "--summaryPath=$(ConvertTo-RepoPath $summaryPath)" "--output=$(ConvertTo-RepoPath $gapListPath)"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to write mobile internal readiness gap list."
}
Write-Host "SUMMARY $(ConvertTo-RepoPath $summaryPath)"
Write-Host "GAP_LIST $(ConvertTo-RepoPath $gapListPath)"
Write-Output ($summary | ConvertTo-Json -Depth 20)

if ($p0Blockers.Count -gt 0) {
  exit 1
}
