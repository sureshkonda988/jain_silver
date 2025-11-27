# Backend Startup Script for Jain Silver
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Jain Silver Backend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Kill any existing Node processes on port 5000
Write-Host "🛑 Checking for existing backend processes..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "   Stopping process $pid..." -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "✅ Cleaned up existing processes" -ForegroundColor Green
} else {
    Write-Host "✅ No existing processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host "   Server will run on: http://192.168.0.5:5000" -ForegroundColor Cyan
Write-Host "   API endpoints: http://192.168.0.5:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Watch for these messages:" -ForegroundColor Yellow
Write-Host "   ✅ MongoDB Connected" -ForegroundColor White
Write-Host "   ✅ Rate updater started (updates every second)" -ForegroundColor White
Write-Host "   ✅ Fetched live rate: ₹161.xx/gram..." -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
node server.js
