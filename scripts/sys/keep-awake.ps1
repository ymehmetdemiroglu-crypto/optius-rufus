# scripts/sys/keep-awake.ps1
# Script to prevent Windows laptop from sleeping/hibernating when plugged in

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🔋 Optimizing Windows Power Settings to Keep Laptop Awake..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Check if running as Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "⚠️ This script should be run as Administrator to apply power settings system-wide."
}

# Apply powercfg commands for AC (plugged in) power
Write-Host "⚙️ Disabling standby (sleep) timeout on AC power..." -ForegroundColor Gray
powercfg /change standby-timeout-ac 0

Write-Host "⚙️ Disabling hibernate timeout on AC power..." -ForegroundColor Gray
powercfg /change hibernate-timeout-ac 0

Write-Host "⚙️ Disabling disk timeout on AC power..." -ForegroundColor Gray
powercfg /change disk-timeout-ac 0

Write-Host "⚙️ Disabling display turn-off timeout on AC power..." -ForegroundColor Gray
powercfg /change monitor-timeout-ac 0

Write-Host ""
Write-Host "✅ Power settings applied successfully. Your laptop is configured to remain awake indefinitely when plugged in." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
