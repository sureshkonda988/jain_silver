# Test Backend Connection
Write-Host "Testing Backend Server..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get -TimeoutSec 5
    Write-Host "✓ Backend is running!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "✗ Backend connection failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "1. Backend server is running (npm start in backend folder)" -ForegroundColor Gray
    Write-Host "2. MongoDB is running" -ForegroundColor Gray
    Write-Host "3. Port 5000 is not blocked" -ForegroundColor Gray
}

