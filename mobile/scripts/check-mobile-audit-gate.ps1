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
$cyclePattern = "(?ms)^#{1,6}\s+$([regex]::Escape($Cycle))\b(?<body>.*?)(?=^#{1,6}\s+|\z)"
$cycleMatch = [regex]::Match($content, $cyclePattern)
if (-not $cycleMatch.Success) {
  throw "Cycle section not found in audit gate report: $Cycle"
}

$body = $cycleMatch.Groups["body"].Value
$statusMatch = [regex]::Match($body, "Gate status:\s*`?(?<status>[^`\r\n]+)`?", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

if ($statusMatch.Success) {
  $status = $statusMatch.Groups["status"].Value.Trim().Trim([char]96)
} else {
  $p0Match = [regex]::Match($body, "P0 result:\s*`?(?<status>[^`\r\n]+)`?", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if (-not $p0Match.Success) {
    throw "Gate status or P0 result not found for $Cycle"
  }
  $status = $p0Match.Groups["status"].Value.Trim().Trim([char]96)
}

$isPass = $status -match "^\s*Pass\b"
$isPending = $status -match "Pending"

if ($isPass) {
  Write-Output "$Cycle audit gate: Pass"
  exit 0
}

if ($AllowPending -and $isPending) {
  Write-Output "$Cycle audit gate: $status (allowed for in-progress/manual-review state)"
  exit 0
}

$unresolvedP0Match = [regex]::Match($body, "Unresolved P0:\s*(?<p0>[^\r\n]+)", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$androidProofMatch = [regex]::Match($body, "Android proof:\s*(?<proof>[^\r\n]+)", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$details = @()
if ($unresolvedP0Match.Success) {
  $details += "Unresolved P0: $($unresolvedP0Match.Groups["p0"].Value.Trim())"
}
if ($androidProofMatch.Success) {
  $details += "Android proof: $($androidProofMatch.Groups["proof"].Value.Trim())"
}

if ($details.Count -gt 0) {
  throw "$Cycle audit gate is not pass: $status. $($details -join ' ')"
}

throw "$Cycle audit gate is not pass: $status"
