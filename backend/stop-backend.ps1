# PowerShell script to stop the backend server
Write-Host "Stopping Jain Silver Backend Server..." -ForegroundColor Yellow

# Find process using port 5000
$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Found server process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
        Stop-Process -Id $processId -Force
        Write-Host "✅ Server stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Process not found, but port 5000 is in use" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No server found running on port 5000" -ForegroundColor Cyan
}

