param(
  [string]$ReportPath = "docs\mobile\POLYMARKET_AUDIT_GATE_REPORT.md",
  [string]$Cycle = "Cycle JO",
  [switch]$AllowPending
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ReportPath)) {
  throw "Audit gate report not found: $ReportPath"
}

$content = Get-Content -Path $ReportPath -Raw
$cyclePattern = "(?ms)^##\s+$([regex]::Escape($Cycle))\b(?<body>.*?)(?=^##\s+|\z)"
$cycleMatch = [regex]::Match($content, $cyclePattern)
if (-not $cycleMatch.Success) {
  throw "Cycle section not found in audit gate report: $Cycle"
}

$body = $cycleMatch.Groups["body"].Value
$statusMatch = [regex]::Match($body, "Gate status:\s*`?(?<status>[^`\r\n]+)`?", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
if (-not $statusMatch.Success) {
  throw "Gate status not found for $Cycle"
}

$status = $statusMatch.Groups["status"].Value.Trim().Trim([char]96)
$isPass = $status -ieq "Pass"
$isPending = $status -match "Pending"

if ($isPass) {
  Write-Output "$Cycle audit gate: Pass"
  exit 0
}

if ($AllowPending -and $isPending) {
  Write-Output "$Cycle audit gate: $status (allowed for in-progress/manual-review state)"
  exit 0
}

throw "$Cycle audit gate is not pass: $status"
