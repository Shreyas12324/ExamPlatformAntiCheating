# Quick Start Guide

This guide will help you get the Anti-Cheating Exam Platform running in 5 minutes.

## Step 1: Install Dependencies

### Backend
```powershell
cd d:\major_project\exam-platform\backend
npm install
```

### Frontend
```powershell
cd d:\major_project\exam-platform\frontend
npm install
```

### ML Service
```powershell
cd d:\major_project\exam-platform\ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Step 2: Configure Environment

### Backend (.env)
```powershell
cd d:\major_project\exam-platform\backend
Copy-Item .env.example .env
```

Edit `.env` and set:
```
MONGO_URI=mongodb://localhost:27017/exam-platform
TOKEN_SECRET=your_secret_key_12345
FASTAPI_URL=http://localhost:8001
CLIENT_URL=http://localhost:5173
```

### Start MongoDB
Make sure MongoDB is running on your machine or use MongoDB Atlas cloud.

## Step 3: Start All Services

Open 3 separate PowerShell terminals:

### Terminal 1 - Backend
```powershell
cd d:\major_project\exam-platform\backend
npm run dev
```
✅ Backend running on http://localhost:8000

### Terminal 2 - ML Service
```powershell
cd d:\major_project\exam-platform\ml-service
.\venv\Scripts\Activate.ps1
python main.py
```
✅ ML Service running on http://localhost:8001

### Terminal 3 - Frontend
```powershell
cd d:\major_project\exam-platform\frontend
npm run dev
```
✅ Frontend running on http://localhost:5173

## Step 4: Create Test Data

### Option A: Use the provided test creation script
```powershell
cd d:\major_project\exam-platform\backend
node seed-data.js
```

### Option B: Manual API calls (use Postman)

1. **Create Admin Account**
   - POST http://localhost:8000/api/auth/signup
   - Body: `{ "email": "admin@test.com", "password": "admin123", "type": "admin" }`

2. **Login**
   - POST http://localhost:8000/api/auth/signin
   - Body: `{ "email": "admin@test.com", "password": "admin123" }`
   - Copy the token from response

3. **Create Test**
   - POST http://localhost:8000/api/exam/create
   - Headers: `Authorization: Bearer <token>`
   - Body: See README for sample

## Step 5: Test the Platform

1. Open http://localhost:5173
2. Create a candidate account
3. Login and select test
4. Allow webcam access
5. Start the test
6. Try switching tabs (will be logged!)
7. Complete and submit

## Common Issues

### "Failed to connect to MongoDB"
- Install MongoDB or use MongoDB Atlas
- Update MONGO_URI in .env

### "Webcam not detected"
- Grant camera permission in browser
- Try Chrome or Edge browser

### "ML Service connection failed"
- Ensure FastAPI is running on port 8001
- Check FASTAPI_URL in backend .env

### Port already in use
- Change ports in respective config files
- Backend: Edit index.js
- Frontend: Edit vite.config.js
- ML Service: Edit main.py

## Next Steps

- Create multiple tests
- Add more questions
- Customize ML detection threshold
- Deploy to production

Enjoy! 🚀
