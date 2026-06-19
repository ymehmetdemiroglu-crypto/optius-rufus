@echo off
echo ===================================================
echo 🚀 Starting Optimus Rufus Headless Daemon...
echo ===================================================
echo.

echo 📦 1. Installing dependencies...
call npm install

echo.
echo 🏗️ 2. Compiling daemon TypeScript...
call npm run build:server

echo.
echo 💾 3. Creating logs directory...
if not exist logs mkdir logs

echo.
echo ⚙️ 4. Starting daemon process via PM2...
call npx pm2 start ecosystem.config.cjs

echo.
echo 📊 5. Current Process Status:
call npx pm2 status

echo.
echo ✅ Startup complete!
echo Monitor health with: npm run daemon:health
echo ===================================================
