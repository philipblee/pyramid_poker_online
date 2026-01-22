# find-dead-code.ps1 - More detailed version

Write-Host "Searching for potentially unused functions..." -ForegroundColor Cyan

$jsFiles = git ls-files "*.js"
$report = @()

foreach ($file in $jsFiles) {
    $content = Get-Content $file -Raw

    # Find all function definitions
    $functionMatches = [regex]::Matches($content, 'function\s+(\w+)\s*\(')
    foreach ($match in $functionMatches) {
        $funcName = $match.Groups[1].Value

        # Count total occurrences
        $allMatches = & git grep "$funcName" -- '*.js' '*.html'
        $count = if ($allMatches) { $allMatches.Count } else { 0 }

        $report += [PSCustomObject]@{
            Function = $funcName
            File = $file
            Occurrences = $count
            Type = 'function'
        }
    }

    # Find const definitions
    $constMatches = [regex]::Matches($content, 'const\s+(\w+)\s*=\s*(?:function|\()')
    foreach ($match in $constMatches) {
        $funcName = $match.Groups[1].Value

        $allMatches = & git grep "$funcName" -- '*.js' '*.html'
        $count = if ($allMatches) { $allMatches.Count } else { 0 }

        $report += [PSCustomObject]@{
            Function = $funcName
            File = $file
            Occurrences = $count
            Type = 'const'
        }
    }
}

# Sort by occurrences
$sorted = $report | Sort-Object Occurrences

# Show low-usage functions
Write-Host "`nFunctions with 1-2 occurrences (likely unused):" -ForegroundColor Yellow
$sorted | Where-Object { $_.Occurrences -le 2 } | Format-Table -AutoSize

$sorted | Export-Csv "function-usage-report.csv" -NoTypeInformation
Write-Host "`nFull report saved to function-usage-report.csv" -ForegroundColor Green
