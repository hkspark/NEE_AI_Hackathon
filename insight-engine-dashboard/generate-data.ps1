# Regenerates web/data.js from data/feedback.csv.
# Run this whenever the CSV changes, then rebuild the Docker image.
param(
    [string]$Csv = "$PSScriptRoot\data\feedback.csv",
    [string]$Out = "$PSScriptRoot\web\data.js"
)

if (-not (Test-Path $Csv)) { Write-Error "CSV not found: $Csv"; exit 1 }

$data = Import-Csv $Csv
$json = $data | ConvertTo-Json -Depth 3 -Compress
$content = "// Auto-generated from data/feedback.csv ($($data.Count) responses). Do not edit by hand.`n" +
           "window.FEEDBACK_DATA = $json;`n"
Set-Content -Path $Out -Value $content -Encoding utf8
Write-Host "Wrote $Out ($($data.Count) records)."
