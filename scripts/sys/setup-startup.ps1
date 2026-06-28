# Get the absolute path of this script's directory and workspace root
$ScriptPath = $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path (Split-Path $ScriptPath -Parent) -Parent

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "⚙️ Registering Windows Task Scheduler Auto-Start..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Workspace Root: $WorkspaceRoot" -ForegroundColor Gray

# Define action: navigate to workspace root, run docker compose, and start PM2 daemon
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d `"$WorkspaceRoot`" && docker compose up -d && npx pm2 start ecosystem.config.cjs"

# Define trigger: At logon of the current user (reliable for Docker Desktop)
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# Define principal: Run as current user with elevated privileges
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Highest

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

$TaskName = "OptimusRufusServerAutoStart"

# Unregister existing task if it exists
Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false

# Register the new task
try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -ErrorAction Stop | Out-Null
    Write-Host "✅ Scheduled task '$TaskName' registered successfully!" -ForegroundColor Green
    Write-Host "The stack will automatically spin up when you log in to Windows." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to register scheduled task: $_" -ForegroundColor Red
    Write-Host "Please ensure you are running PowerShell as Administrator." -ForegroundColor Yellow
}
Write-Host "===================================================" -ForegroundColor Cyan
