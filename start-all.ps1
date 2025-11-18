# Start all services for Anti-Cheating Exam Platform
# Run this script from the exam-platform root directory

Write-Host "🚀 Starting Anti-Cheating Exam Platform..." -ForegroundColor Green
Write-Host ""

# Check if MongoDB is running
Write-Host "📊 Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoRunning) {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB not detected. Please start MongoDB first." -ForegroundColor Red
    Write-Host "   You can start it with: net start MongoDB" -ForegroundColor Yellow
    Write-Host ""
}

# Start Backend
Write-Host "📦 Starting Backend (Express)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 2

# Start ML Service
Write-Host "🤖 Starting ML Service (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ml-service'; .\venv\Scripts\Activate.ps1; python main.py"
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🎨 Starting Frontend (React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Services are running on:" -ForegroundColor Cyan
Write-Host "   Backend:    http://localhost:8000" -ForegroundColor White
Write-Host "   ML Service: http://localhost:8001" -ForegroundColor White
Write-Host "   Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Open your browser to http://localhost:5173 to start!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the services." -ForegroundColor Yellow
