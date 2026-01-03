# THQ Label - Smart Backup Script
# Creates ZIP archive without heavy folders

$ProjectName = "thq-label"
# Go up one level from scripts/ to project root
$SourcePath = (Get-Item $PSScriptRoot).Parent.FullName
$BackupFolder = "C:\Backups\thq-label"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ZipName = "$ProjectName`_$Date.zip"
$TempFolder = "$env:TEMP\backup_temp_$Date"

# Create backup folder
if (!(Test-Path $BackupFolder)) {
    New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
}

Write-Host "`n=== BACKUP ===" -ForegroundColor Cyan
Write-Host "Source: $SourcePath"
Write-Host "Target: $BackupFolder\$ZipName`n"

# Remove old temp if exists
if (Test-Path $TempFolder) {
    Remove-Item -Path $TempFolder -Recurse -Force
}

Write-Host "Copying files..." -ForegroundColor Yellow

# Copy without heavy folders using robocopy
robocopy $SourcePath $TempFolder /E /NFL /NDL /NJH /NJS /NC /NS /XD node_modules .next .git .turbo coverage | Out-Null

Write-Host "Creating archive..." -ForegroundColor Yellow

# Create ZIP
$ZipPath = "$BackupFolder\$ZipName"
Compress-Archive -Path "$TempFolder\*" -DestinationPath $ZipPath -Force

# Cleanup temp
Remove-Item -Path $TempFolder -Recurse -Force

# Show result
$Size = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Archive: $ZipPath"
Write-Host "Size: $Size MB`n"

# Show recent backups
Write-Host "Recent backups:" -ForegroundColor Cyan
Get-ChildItem $BackupFolder -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
    $s = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  $($_.Name) - $s MB"
}
