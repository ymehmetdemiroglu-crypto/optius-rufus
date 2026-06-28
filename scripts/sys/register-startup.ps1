# scripts/sys/register-startup.ps1
# PowerShell script to register start.bat as a Task Scheduler task on system startup

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[INFO] Registering Server Startup Task in Windows..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Check if running as Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "X Error: This script requires Administrator privileges to register startup tasks."
    Write-Host "Please restart PowerShell as Administrator and run the script again." -ForegroundColor Yellow
    Exit 1
}

# Define paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$batPath = Join-Path $projectDir "start.bat"

if (-not (Test-Path $batPath)) {
    Write-Error "X Error: Could not locate start.bat at $batPath"
    Exit 1
}

$taskName = "OptimusRufusDaemonStartup"
$taskDescription = "Launches the Optimus Rufus Headless Daemon via PM2 on system boot."

# Create Task Action
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`"" -WorkingDirectory $projectDir

# Create Task Trigger (At Startup)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Create Task Settings (Allow running on battery, don't stop task, run with highest privilege)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Get current user identity
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Host "User: Task will register under user: $currentUser" -ForegroundColor Gray
Write-Host "[INFO] Registering scheduled task '$taskName'..." -ForegroundColor Gray

# Register the Scheduled Task
Register-ScheduledTask -TaskName $taskName `
                       -Description $taskDescription `
                       -Action $action `
                       -Trigger $trigger `
                       -Settings $settings `
                       -User $currentUser `
                       -RunLevel Highest `
                       -Force | Out-Null

Write-Host ""
Write-Host "[SUCCESS] Scheduled Task '$taskName' registered successfully!" -ForegroundColor Green
Write-Host "   The daemon server will now start automatically whenever your laptop boots." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
