# Kill any existing Node processes on port 5000
Write-Host "🛑 Stopping any existing backend processes..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $processes) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "   Killed process $pid" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Start the backend
Write-Host "`n🚀 Starting backend server..." -ForegroundColor Green
Write-Host "   Watch for: '✅ Rate updater started (updates every second)'" -ForegroundColor Cyan
Write-Host "   Watch for: '✅ Fetched live rate: ₹161.xx/gram...'" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

node server.js

