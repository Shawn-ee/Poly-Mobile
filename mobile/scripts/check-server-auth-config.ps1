$ErrorActionPreference = "Stop"

$MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AppPath = Join-Path $MobileRoot "App.tsx"
$ApiPath = Join-Path $MobileRoot "src\api.ts"
$EnvPath = Join-Path $MobileRoot ".env.example"

$app = Get-Content -Raw -LiteralPath $AppPath
$api = Get-Content -Raw -LiteralPath $ApiPath
$envExample = Get-Content -Raw -LiteralPath $EnvPath

$checks = @(
  @{ Name = "App reads EXPO_PUBLIC_API_KEY"; Pass = $app -match "EXPO_PUBLIC_API_KEY" },
  @{ Name = "App passes API key into PolyApi"; Pass = $app -match "new PolyApi\(DEFAULT_API_BASE,\s*DEFAULT_API_KEY\)" },
  @{ Name = "PolyApi sends Bearer Authorization"; Pass = $api.Contains('headers.set("Authorization", `Bearer ${this.apiKey}`);') },
  @{ Name = "Env example uses Android emulator host backend"; Pass = $envExample -match "EXPO_PUBLIC_API_BASE_URL=http://10\.0\.2\.2:3000" },
  @{ Name = "Env example declares order mode"; Pass = $envExample -match "EXPO_PUBLIC_ORDER_MODE=mock" }
)

$failed = $checks | Where-Object { -not $_.Pass }
foreach ($check in $checks) {
  Write-Host "$(if ($check.Pass) { 'PASS' } else { 'FAIL' }) $($check.Name)"
}

if ($failed.Count -gt 0) {
  throw "Server auth config check failed: $($failed.Name -join ', ')"
}
