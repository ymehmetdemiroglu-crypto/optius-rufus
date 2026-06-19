Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Optimus Rufus Headless Daemon..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 1. Installing dependencies..." -ForegroundColor Gray
npm install

Write-Host ""
Write-Host "🏗️ 2. Compiling daemon TypeScript..." -ForegroundColor Gray
npm run build:server

Write-Host ""
Write-Host "💾 3. Creating logs directory..." -ForegroundColor Gray
if (-not (Test-Path logs)) {
    New-Item -ItemType Directory -Path logs | Out-Null
}

Write-Host ""
Write-Host "⚙️ 4. Starting daemon process via PM2..." -ForegroundColor Gray
npx pm2 start ecosystem.config.cjs

Write-Host ""
Write-Host "📊 5. Current Process Status:" -ForegroundColor Gray
npx pm2 status

Write-Host ""
Write-Host "✅ Startup complete!" -ForegroundColor Green
Write-Host "Monitor health with: npm run daemon:health" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan
