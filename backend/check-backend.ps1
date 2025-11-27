# PowerShell script to check backend server status
Write-Host "Checking Jain Silver Backend Server Status..." -ForegroundColor Cyan
Write-Host ""

# Check if port 5000 is in use
$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Host "✅ Server is RUNNING" -ForegroundColor Green
    Write-Host "   Port: 5000" -ForegroundColor White
    Write-Host "   Process ID: $processId" -ForegroundColor White
    if ($process) {
        Write-Host "   Process: $($process.ProcessName)" -ForegroundColor White
        Write-Host "   Started: $($process.StartTime)" -ForegroundColor White
    }
    Write-Host ""
    
    # Test the server
    Write-Host "Testing server endpoint..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is responding correctly!" -ForegroundColor Green
            $json = $response.Content | ConvertFrom-Json
            Write-Host "   Message: $($json.message)" -ForegroundColor White
            Write-Host "   Status: $($json.status)" -ForegroundColor White
        }
    } catch {
        Write-Host "⚠️  Server is running but not responding: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Server is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the server, run: .\start-backend.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "MongoDB Connection:" -ForegroundColor Cyan
$mongoConnection = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if ($mongoConnection) {
    Write-Host "✅ MongoDB is running on port 27017" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB might not be running (port 27017 not in use)" -ForegroundColor Yellow
    Write-Host "   Make sure MongoDB is started before running the backend" -ForegroundColor Yellow
}

