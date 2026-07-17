param(
  [int]$BackendPort = 3002,
  [string]$EventSlugs = "",
  [int]$MaxEvents = 3,
  [int]$MaxIterationsPerEvent = 1,
  [string]$AllowlistSummaryPath = "docs\mobile\harness\the-odds-api-event-catalog\runtime-allowlist-summary.redacted.json",
  [string]$SummaryPath = "docs\mobile\harness\odds-api-live-runtime\event-allowlist-supervisor-summary.redacted.json",
  [string]$RuntimeArtifactRoot = ".runtime\holiwyn-event-allowlist-supervisor",
  [string]$EventProofRoot = "docs\mobile\harness\odds-api-live-runtime\events",
  [switch]$SkipDataHygiene,
  [switch]$SkipMakerSeed,
  [switch]$SkipLifecycleScheduler,
  [switch]$RunStaleGuard,
  [switch]$EnforceStaleGuard
)

$ErrorActionPreference = "Stop"
$LegacyEventSlug = "odds-api-single-soccer-test"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if ($MaxEvents -lt 1 -or $MaxEvents -gt 3) {
  throw "MaxEvents must be between 1 and 3."
}
if ($MaxIterationsPerEvent -lt 1 -or $MaxIterationsPerEvent -gt 3) {
  throw "MaxIterationsPerEvent must be between 1 and 3."
}
if ($EnforceStaleGuard -and -not $RunStaleGuard) {
  throw "EnforceStaleGuard requires RunStaleGuard."
}

function Resolve-RepoPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return Join-Path $RepoRoot $Path
}

function ConvertTo-RepoPath {
  param([string]$Path)
  $resolved = Resolve-RepoPath $Path
  if ($resolved.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    $relative = $resolved.Substring($RepoRoot.Length) -replace "^[\\/]+", ""
    return $relative.Replace("\", "/")
  }
  return $resolved.Replace("\", "/")
}

function Read-JsonFile {
  param([string]$Path)
  $resolved = Resolve-RepoPath $Path
  if (-not (Test-Path -LiteralPath $resolved)) { return $null }
  return Get-Content -Raw -LiteralPath $resolved | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [object]$Value,
    [Parameter(Mandatory = $true)] [string]$Path
  )
  $resolved = Resolve-RepoPath $Path
  $directory = Split-Path -Parent $resolved
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $json = ($Value | ConvertTo-Json -Depth 60) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($resolved, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

function Assert-SafeSlug {
  param([string]$Slug)
  if ($Slug -notmatch "^[a-z0-9][a-z0-9-]{0,119}$") {
    throw "Unsafe event slug: $Slug"
  }
}

$allowlistArgs = @(
  "run", "mobile:event-runtime-allowlist", "--",
  "--summaryPath=$AllowlistSummaryPath"
)
if (-not [string]::IsNullOrWhiteSpace($EventSlugs)) {
  $allowlistArgs += "--eventSlugs=$EventSlugs"
}
& npm.cmd @allowlistArgs | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Event runtime allowlist report failed."
}

$allowlist = Read-JsonFile $AllowlistSummaryPath
if (-not $allowlist -or $allowlist.pass -ne $true) {
  throw "Event runtime allowlist is missing or unsafe."
}
$selected = @($allowlist.entries | Where-Object { $_.allowlisted -eq $true -and $_.runtimeEligible -eq $true })
if ($selected.Count -lt 1) {
  throw "The allowlist has no runtime-eligible event owner."
}
if ($selected.Count -gt $MaxEvents) {
  throw "The allowlist selected $($selected.Count) events, exceeding MaxEvents=$MaxEvents."
}

$runs = New-Object System.Collections.Generic.List[object]
$startedAt = (Get-Date).ToUniversalTime()
foreach ($entry in $selected) {
  $slug = [string]$entry.slug
  Assert-SafeSlug $slug
  $artifactDir = Join-Path $RuntimeArtifactRoot $slug
  $childSummaryPath = Join-Path $artifactDir "one-event-live-supervisor-summary.redacted.json"
  $childHeartbeatPath = Join-Path $artifactDir "one-event-live-supervisor-heartbeat.redacted.json"
  $proofPath = if ($slug -eq $LegacyEventSlug) {
    "docs\mobile\harness\odds-api-live-runtime\one-event-live-runtime-summary.redacted.json"
  } else {
    Join-Path (Join-Path $EventProofRoot $slug) "one-event-live-runtime-summary.redacted.json"
  }
  if (-not (Test-Path -LiteralPath (Resolve-RepoPath $proofPath))) {
    $runs.Add([ordered]@{
      eventSlug = $slug
      title = [string]$entry.title
      pass = $false
      executed = $false
      reason = "matching_cached_provider_proof_missing"
      proofPath = (ConvertTo-RepoPath $proofPath)
    }) | Out-Null
    continue
  }

  $childArgs = @(
    "run", "mobile:one-event-live-supervisor", "--",
    "-BackendPort", "$BackendPort",
    "-EventSlug", $slug,
    "-SummaryPath", $childSummaryPath,
    "-HeartbeatPath", $childHeartbeatPath,
    "-LiveProofSummaryPath", $proofPath,
    "-MaxIterations", "$MaxIterationsPerEvent",
    "-IntervalSeconds", "0",
    "-SkipSleep",
    "-RuntimeArtifactDir", $artifactDir
  )
  if ($SkipDataHygiene) { $childArgs += "-SkipDataHygiene" }
  if ($SkipMakerSeed) { $childArgs += "-SkipMakerSeed" }
  if ($SkipLifecycleScheduler) { $childArgs += "-SkipLifecycleScheduler" }
  if ($RunStaleGuard) { $childArgs += "-RunStaleGuard" }
  if ($EnforceStaleGuard) { $childArgs += "-EnforceStaleGuard" }

  $eventStartedAt = (Get-Date).ToUniversalTime()
  & npm.cmd @childArgs | Out-Null
  $exitCode = $LASTEXITCODE
  $childSummary = Read-JsonFile $childSummaryPath
  $childPass = [bool]($exitCode -eq 0 -and $childSummary -and $childSummary.pass -eq $true)
  $runs.Add([ordered]@{
    eventSlug = $slug
    title = [string]$entry.title
    pass = $childPass
    executed = $true
    exitCode = $exitCode
    startedAt = $eventStartedAt.ToString("o")
    completedAt = (Get-Date).ToUniversalTime().ToString("o")
    proofPath = (ConvertTo-RepoPath $proofPath)
    artifactDir = (ConvertTo-RepoPath $artifactDir)
    childSummaryPath = (ConvertTo-RepoPath $childSummaryPath)
    child = if ($childSummary) {
      [ordered]@{
        selectedEventSlug = $childSummary.settings.eventSlug
        completedIterations = $childSummary.settings.completedIterations
        makerSeeded = $childSummary.settings.makerSeedEnabled
        lifecycleSchedulerEnabled = $childSummary.settings.lifecycleSchedulerEnabled
        providerProofRunsCompleted = $childSummary.settings.providerProofRunsCompleted
        providerQuotaUsed = [bool]($childSummary.settings.providerProofRunsCompleted -gt 0)
        gaps = $childSummary.gaps
      }
    } else {
      $null
    }
  }) | Out-Null
}

$skipped = @($allowlist.entries | Where-Object { -not ($_.allowlisted -eq $true -and $_.runtimeEligible -eq $true) } | ForEach-Object {
  [ordered]@{
    eventSlug = [string]$_.slug
    title = [string]$_.title
    archived = [bool]$_.archived
    allowlisted = [bool]$_.allowlisted
    runtimeEligible = [bool]$_.runtimeEligible
    reason = if ($_.archived) { "archived_catalog_record" } elseif (-not $_.allowlisted) { "not_allowlisted" } else { "not_runtime_eligible" }
  }
})
$pass = [bool]($runs.Count -eq $selected.Count -and @($runs | Where-Object { -not $_.pass }).Count -eq 0)
$p0Gaps = @()
if (-not $pass) {
  $p0Gaps = @("One or more allowlisted event supervisors failed or lacked matching provider proof.")
}
$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "holiwyn-event-allowlist-supervisor"
  pass = $pass
  startedAt = $startedAt.ToString("o")
  completedAt = (Get-Date).ToUniversalTime().ToString("o")
  policy = [ordered]@{
    mode = "bounded-sequential-local"
    fakeTokenOnly = $true
    providerRefreshEnabled = $false
    providerQuotaUsed = $false
    maxEvents = $MaxEvents
    maxIterationsPerEvent = $MaxIterationsPerEvent
    eventEvidenceIsolated = $true
    archivedEventsSkipped = $true
    leavesExpoRunning = $false
    leavesChildSupervisorsRunning = $false
  }
  allowlist = [ordered]@{
    summaryPath = (ConvertTo-RepoPath $AllowlistSummaryPath)
    providerEventCount = $allowlist.counts.providerEvents
    selectedRuntimeOwnerCount = $selected.Count
    archivedEventCount = $allowlist.counts.archivedEvents
  }
  runs = @($runs | ForEach-Object { $_ })
  skipped = $skipped
  gaps = [ordered]@{
    p0 = $p0Gaps
    p1 = @(
      "The bounded supervisor is sequential and foreground-only; installed unattended ownership remains incomplete.",
      "Concurrent multi-event workers need event-scoped durable heartbeat/service names before they are safe."
    )
    p2 = @("A future operator UI may display and control the allowlist supervisor.")
  }
}

Write-JsonFile -Value $summary -Path $SummaryPath
$summary | ConvertTo-Json -Depth 60
if (-not $pass) { exit 1 }
