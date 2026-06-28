# scripts/sys/register-user-startup.ps1
# Script to create a startup shortcut in the user's Startup folder

$WshShell = New-Object -ComObject WScript.Shell
$startupPath = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = Join-Path $startupPath "OptimusRufusDaemon.lnk"

$projectDir = "c:\Users\hp\OneDrive\Desktop\optimus rufus webapp"
$batPath = Join-Path $projectDir "start.bat"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[INFO] Creating User Startup Shortcut..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Target: $batPath" -ForegroundColor Gray
Write-Host "Destination: $shortcutPath" -ForegroundColor Gray

try {
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batPath
    $Shortcut.WorkingDirectory = $projectDir
    $Shortcut.Save()
    Write-Host "[SUCCESS] User Startup Shortcut created successfully!" -ForegroundColor Green
    Write-Host "The daemon will start automatically on login." -ForegroundColor Green
} catch {
    Write-Error "X Error: Failed to create shortcut: $_"
}
Write-Host "===================================================" -ForegroundColor Cyan
