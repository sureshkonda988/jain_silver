# PowerShell script to restart the backend server
Write-Host "Restarting Jain Silver Backend Server..." -ForegroundColor Cyan

# Stop the server first
& "$PSScriptRoot\stop-backend.ps1"

# Wait a moment
Start-Sleep -Seconds 2

# Start the server
& "$PSScriptRoot\start-backend.ps1"

