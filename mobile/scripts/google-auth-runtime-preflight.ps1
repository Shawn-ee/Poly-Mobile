param(
  [string]$BackendAuthBase = "",
  [string]$MobileReturnUrl = "",
  [string]$SummaryPath = "",
  [switch]$RequireConfigured,
  [switch]$RequirePhysicalDeviceCallback,
  [int]$TimeoutSeconds = 10
)

$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")

Add-Type -AssemblyName System.Net.Http

function Read-DotEnv {
  param([string]$Path)
  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#") -or $trimmed -notmatch "=") {
      continue
    }
    $parts = $trimmed -split "=", 2
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($name.Length -gt 0 -and -not $values.ContainsKey($name)) {
      $values[$name] = $value
    }
  }
  return $values
}

function Resolve-ConfigValue {
  param(
    [hashtable]$MobileEnv,
    [hashtable]$RootEnv,
    [string[]]$Names,
    [string]$Fallback = ""
  )
  foreach ($name in $Names) {
    $processValue = [Environment]::GetEnvironmentVariable($name)
    if (-not [string]::IsNullOrWhiteSpace($processValue)) {
      return $processValue.Trim()
    }
    if ($MobileEnv.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($MobileEnv[$name])) {
      return $MobileEnv[$name].Trim()
    }
    if ($RootEnv.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($RootEnv[$name])) {
      return $RootEnv[$name].Trim()
    }
  }
  return $Fallback
}

function Test-ConfiguredSecret {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }
  return $Value -notmatch "replace_with|replace-with|\.\.\.|your-|example|changeme"
}

function New-NoRedirectClient {
  param([int]$TimeoutSeconds)
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.AllowAutoRedirect = $false
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
  return $client
}

function Get-QueryValue {
  param(
    [string]$Query,
    [string]$Name
  )
  if ([string]::IsNullOrWhiteSpace($Query)) {
    return ""
  }
  $cleanQuery = $Query.TrimStart("?")
  foreach ($part in $cleanQuery -split "&") {
    if ($part -notmatch "=") {
      continue
    }
    $pair = $part -split "=", 2
    if ([Uri]::UnescapeDataString($pair[0]) -eq $Name) {
      return [Uri]::UnescapeDataString($pair[1].Replace("+", " "))
    }
  }
  return ""
}

$mobileEnv = Read-DotEnv (Join-Path $MobileRoot ".env")
$rootEnv = Read-DotEnv (Join-Path $RepoRoot ".env")

$apiBase = Resolve-ConfigValue $mobileEnv $rootEnv @("EXPO_PUBLIC_API_BASE_URL") "http://127.0.0.1:3002"
$resolvedBackendAuthBase = if ($BackendAuthBase) {
  $BackendAuthBase.Trim()
} else {
  Resolve-ConfigValue $mobileEnv $rootEnv @("EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL") $apiBase
}
$resolvedMobileReturnUrl = if ($MobileReturnUrl) {
  $MobileReturnUrl.Trim()
} else {
  Resolve-ConfigValue $mobileEnv $rootEnv @("EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL") "holiwyn://auth/google"
}
$nextAuthUrl = Resolve-ConfigValue $mobileEnv $rootEnv @("NEXTAUTH_URL") ""
$googleClientId = Resolve-ConfigValue $mobileEnv $rootEnv @("GOOGLE_CLIENT_ID") ""
$googleClientSecret = Resolve-ConfigValue $mobileEnv $rootEnv @("GOOGLE_CLIENT_SECRET") ""
$expectedCallback = if ($nextAuthUrl) { "$($nextAuthUrl.TrimEnd('/'))/api/auth/google/callback" } else { "" }
$observedRedirectUri = ""
$observedRedirectHost = ""
$redirectUriOriginMatches = $false
$redirectUriPathMatches = $false
$redirectUriMatchesExpected = $false

$checks = New-Object System.Collections.Generic.List[object]
$checks.Add([pscustomobject]@{
  Name = "Backend auth base is configured"
  Pass = -not [string]::IsNullOrWhiteSpace($resolvedBackendAuthBase)
  Detail = "Using backend auth origin from mobile/server env."
})
$checks.Add([pscustomobject]@{
  Name = "Mobile return URL is configured"
  Pass = -not [string]::IsNullOrWhiteSpace($resolvedMobileReturnUrl)
  Detail = "Return URL is present without exposing credentials."
})
$checks.Add([pscustomobject]@{
  Name = "NEXTAUTH_URL is configured"
  Pass = Test-ConfiguredSecret $nextAuthUrl
  Detail = "Backend callback origin is present."
})
$checks.Add([pscustomobject]@{
  Name = "GOOGLE_CLIENT_ID is configured"
  Pass = Test-ConfiguredSecret $googleClientId
  Detail = "Server-side Google client id is present."
})
$checks.Add([pscustomobject]@{
  Name = "GOOGLE_CLIENT_SECRET is configured"
  Pass = Test-ConfiguredSecret $googleClientSecret
  Detail = "Server-side Google client secret is present."
})

try {
  $returnUri = [Uri]$resolvedMobileReturnUrl
  $isAllowedReturnScheme = $returnUri.Scheme -in @("holiwyn", "exp", "exps")
  $checks.Add([pscustomobject]@{
    Name = "Mobile return URL uses an allowed app/dev scheme"
    Pass = $isAllowedReturnScheme
    Detail = "Allowed schemes are holiwyn:, exp:, and exps:."
  })
} catch {
  $checks.Add([pscustomobject]@{
    Name = "Mobile return URL parses"
    Pass = $false
    Detail = "Return URL is not a valid URI."
  })
}

if ($RequirePhysicalDeviceCallback) {
  $physicalReady = $nextAuthUrl -match "^https://" -or $nextAuthUrl -match "^http://(?!127\.0\.0\.1|localhost)([^/]+)"
  $checks.Add([pscustomobject]@{
    Name = "NEXTAUTH_URL is reachable by a physical Android browser"
    Pass = $physicalReady
    Detail = "Use HTTPS hosted auth or a LAN IP callback for S23 Expo/manual testing."
  })
}

$canProbeRoute = ($checks | Where-Object { $_.Name -in @(
  "Backend auth base is configured",
  "Mobile return URL is configured",
  "NEXTAUTH_URL is configured",
  "GOOGLE_CLIENT_ID is configured"
) -and -not $_.Pass }).Count -eq 0

if ($canProbeRoute) {
  $startUri = "$($resolvedBackendAuthBase.TrimEnd('/'))/api/auth/google/start?returnTo=$([Uri]::EscapeDataString('/portfolio'))&mobileReturnTo=$([Uri]::EscapeDataString($resolvedMobileReturnUrl))"
  try {
    $client = New-NoRedirectClient $TimeoutSeconds
    $response = $client.GetAsync($startUri).GetAwaiter().GetResult()
    $location = $response.Headers.Location
    $redirectHost = if ($location) { $location.Host } else { "" }
    $redirectUriParam = if ($location) { Get-QueryValue $location.Query "redirect_uri" } else { "" }
    $observedRedirectUri = $redirectUriParam
    $observedRedirectHost = $redirectHost
    try {
      $expectedCallbackUri = [Uri]$expectedCallback
      $observedCallbackUri = [Uri]$observedRedirectUri
      $redirectUriOriginMatches = $observedCallbackUri.GetLeftPart([System.UriPartial]::Authority) -eq $expectedCallbackUri.GetLeftPart([System.UriPartial]::Authority)
      $redirectUriPathMatches = $observedCallbackUri.AbsolutePath -eq $expectedCallbackUri.AbsolutePath
    } catch {
      $redirectUriOriginMatches = $false
      $redirectUriPathMatches = $false
    }
    $redirectUriMatchesExpected = $redirectUriParam -eq $expectedCallback
    $checks.Add([pscustomobject]@{
      Name = "Google start route returns a redirect"
      Pass = [int]$response.StatusCode -ge 300 -and [int]$response.StatusCode -lt 400
      Detail = "Expected a 3xx response from backend auth start."
    })
    $checks.Add([pscustomobject]@{
      Name = "Google start redirect points at accounts.google.com"
      Pass = $redirectHost -eq "accounts.google.com"
      Detail = "Redirect host is checked without printing query secrets."
    })
    $checks.Add([pscustomobject]@{
      Name = "Google redirect_uri matches NEXTAUTH_URL callback"
      Pass = $redirectUriMatchesExpected
      Detail = "Google Cloud authorized redirect URI should match this callback exactly."
    })
  } catch {
    $checks.Add([pscustomobject]@{
      Name = "Google start route is reachable"
      Pass = $false
      Detail = $_.Exception.Message
    })
  }
}

$failed = $checks | Where-Object { -not $_.Pass }
foreach ($check in $checks) {
  $prefix = if ($check.Pass) { "PASS" } else { "FAIL" }
  Write-Host "$prefix $($check.Name) - $($check.Detail)"
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  scope = "google-auth-runtime-preflight"
  backendAuthBaseConfigured = -not [string]::IsNullOrWhiteSpace($resolvedBackendAuthBase)
  mobileReturnUrlScheme = if ($resolvedMobileReturnUrl) {
    try { ([Uri]$resolvedMobileReturnUrl).Scheme } catch { "invalid" }
  } else {
    ""
  }
  nextAuthUrlConfigured = Test-ConfiguredSecret $nextAuthUrl
  googleClientIdConfigured = Test-ConfiguredSecret $googleClientId
  googleClientSecretConfigured = Test-ConfiguredSecret $googleClientSecret
  expectedCallback = $expectedCallback
  observedGoogleRedirectUri = $observedRedirectUri
  observedGoogleRedirectHost = $observedRedirectHost
  redirectUriOriginMatches = $redirectUriOriginMatches
  redirectUriPathMatches = $redirectUriPathMatches
  redirectUriMatchesExpected = $redirectUriMatchesExpected
  fixHint = if ($observedRedirectUri -and -not $redirectUriMatchesExpected) {
    "Set the running backend NEXTAUTH_URL and the preflight config to the same origin, restart the backend, then register the exact redirect_uri emitted by /api/auth/google/start in Google Cloud Authorized redirect URIs."
  } else {
    ""
  }
  requireConfigured = [bool]$RequireConfigured
  requirePhysicalDeviceCallback = [bool]$RequirePhysicalDeviceCallback
  readyForRuntimeStart = ($failed.Count -eq 0)
  failedChecks = @($failed | ForEach-Object { $_.Name })
  checks = @($checks | ForEach-Object {
    [ordered]@{
      name = $_.Name
      pass = [bool]$_.Pass
      detail = $_.Detail
    }
  })
}

if ($SummaryPath.Trim()) {
  $resolvedSummaryPath = if ([System.IO.Path]::IsPathRooted($SummaryPath)) {
    $SummaryPath
  } else {
    Join-Path $RepoRoot $SummaryPath
  }
  $summaryDirectory = Split-Path -Parent $resolvedSummaryPath
  if ($summaryDirectory -and -not (Test-Path -LiteralPath $summaryDirectory)) {
    New-Item -ItemType Directory -Path $summaryDirectory -Force | Out-Null
  }
  $summary | ConvertTo-Json -Depth 8 | Set-Content -Path $resolvedSummaryPath -Encoding UTF8
  Write-Host "SUMMARY written to $resolvedSummaryPath"
}

if ($RequireConfigured -and $failed.Count -gt 0) {
  throw "Google auth runtime preflight failed: $($failed.Name -join ', ')"
}

if ($failed.Count -gt 0) {
  Write-Host "WARN Google auth runtime preflight found non-strict issues. Rerun with -RequireConfigured to fail on these."
}
