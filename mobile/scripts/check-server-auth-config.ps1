$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AppPath = Join-Path $MobileRoot "App.tsx"
$ApiPath = Join-Path $MobileRoot "src\api.ts"
$EnvPath = Join-Path $MobileRoot ".env.example"
$RepoRoot = Resolve-Path (Join-Path $MobileRoot "..")
$GoogleStartPath = Join-Path $RepoRoot "src\app\api\auth\google\start\route.ts"
$GoogleCallbackPath = Join-Path $RepoRoot "src\app\api\auth\google\callback\route.ts"
$MobileReturnAllowlistPath = Join-Path $RepoRoot "src\lib\mobileReturnUrl.ts"

$app = Get-Content -Raw -LiteralPath $AppPath
$api = Get-Content -Raw -LiteralPath $ApiPath
$envExample = Get-Content -Raw -LiteralPath $EnvPath
$googleStart = Get-Content -Raw -LiteralPath $GoogleStartPath
$googleCallback = Get-Content -Raw -LiteralPath $GoogleCallbackPath
$mobileReturnAllowlist = Get-Content -Raw -LiteralPath $MobileReturnAllowlistPath

$checks = @(
  @{ Name = "App reads EXPO_PUBLIC_API_KEY"; Pass = $app -match "EXPO_PUBLIC_API_KEY" },
  @{ Name = "App passes runtime API key into PolyApi"; Pass = $app -match "new PolyApi\(DEFAULT_API_BASE,\s*runtimeApiKey\)" },
  @{ Name = "App can store returned mobile auth API key"; Pass = $app -match "storeMobileAuthApiKey\(returnedApiKey\)" },
  @{ Name = "App launches backend Google OAuth start route"; Pass = $app -match "/api/auth/google/start" -and $app -match "mobileReturnTo=" },
  @{ Name = "App does not expose Google OAuth secrets"; Pass = $app -notmatch "EXPO_PUBLIC_GOOGLE_CLIENT_SECRET" -and $app -notmatch "EXPO_PUBLIC_GOOGLE_ACCESS_TOKEN" },
  @{ Name = "App does not use a separate mobile Google OAuth client"; Pass = $app -notmatch "EXPO_PUBLIC_GOOGLE_CLIENT_ID" -and $app -notmatch "androidClientId" -and $app -notmatch "webClientId" },
  @{ Name = "PolyApi sends Bearer Authorization"; Pass = $api.Contains('headers.set("Authorization", `Bearer ${this.apiKey}`);') },
  @{ Name = "Backend Google start route uses server GOOGLE_CLIENT_ID"; Pass = $googleStart -match "GOOGLE_CLIENT_ID" -and $googleStart -notmatch "EXPO_PUBLIC_GOOGLE_CLIENT_ID" },
  @{ Name = "Backend Google callback uses server GOOGLE_CLIENT_SECRET"; Pass = $googleCallback -match "GOOGLE_CLIENT_SECRET" -and $googleCallback -notmatch "EXPO_PUBLIC_GOOGLE_CLIENT_SECRET" },
  @{ Name = "Backend Google callback performs server token exchange"; Pass = $googleCallback -match "https://oauth2.googleapis.com/token" -and $googleCallback -match "https://openidconnect.googleapis.com/v1/userinfo" },
  @{ Name = "Backend mints a Holiwyn mobile API credential after Google login"; Pass = $googleCallback -match "createApiCredential" -and $googleCallback -match "Holiwyn Mobile Google" -and $googleCallback -match "apiKey: mobileCredential\.token" },
  @{ Name = "Backend allowlists Holiwyn and dev Expo return links"; Pass = $mobileReturnAllowlist -match 'url\.protocol === "holiwyn:"' -and $mobileReturnAllowlist -match 'url\.protocol === "exp:"' -and $mobileReturnAllowlist -match 'nodeEnv !== "production"' },
  @{ Name = "Env example uses Android emulator host backend"; Pass = $envExample -match "EXPO_PUBLIC_API_BASE_URL=http://10\.0\.2\.2:3002" },
  @{ Name = "Env example keeps Google Cloud credentials off mobile"; Pass = $envExample -match "Google Cloud client IDs, secrets, and Google tokens must stay on the backend" },
  @{ Name = "Env example declares order mode"; Pass = $envExample -match "EXPO_PUBLIC_ORDER_MODE=mock" }
)

$failed = $checks | Where-Object { -not $_.Pass }
foreach ($check in $checks) {
  Write-Host "$(if ($check.Pass) { 'PASS' } else { 'FAIL' }) $($check.Name)"
}

if ($failed.Count -gt 0) {
  throw "Server auth config check failed: $($failed.Name -join ', ')"
}
