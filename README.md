#     Anti-Cheating Exam Platform

A secure online examination platform with AI-powered anti-cheating detection using ReactJS, Express.js, MongoDB, FastAPI, and Python.

##   Features

### Frontend (ReactJS)
-   Clean and intuitive exam interface
-   Question navigation panel (left sidebar)
-   Timer with auto-submit on expiry
-   Webcam preview and monitoring (right sidebar)
-   Tab-switch and window-blur detection
-   Auto-save progress every 10 seconds
-   Real-time webcam capture and ML analysis
-   Visual progress tracking (answered/unanswered)
-   Responsive design with TailwindCSS

### Backend (Express + Node + MongoDB)
-   Complete authentication system (JWT-based)
-   User signup/signin with email verification
-   Test and question management
-   Progress tracking and auto-save
-   Answer submission and scoring
-   Cheating event logging
-   Integration with FastAPI ML service

### ML Service (FastAPI + Python)
-   `/ml/check_face` endpoint for webcam analysis
-   Multi-person detection
-   Face position and orientation tracking
-   Eye gaze detection
-   Face size/distance monitoring
-   Cheating score calculation (0-100)
-   Severity classification (low/medium/high/critical)
-   Basic liveness detection

## 📁 Project Structure

```
exam-platform/
├── backend/                    # Express.js Backend
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── examController.js   # Test & question management
│   │   └── cheatingController.js # Cheating detection & logging
│   ├── models/
│   │   ├── usersModel.js       # User schema
│   │   ├── testModel.js        # Test schema
│   │   ├── questionModel.js    # Question schema
│   │   ├── userProgressModel.js # Progress tracking
│   │   └── cheatingLogModel.js # Cheating logs
│   ├── routers/
│   │   ├── authRouter.js
│   │   ├── examRouter.js
│   │   └── cheatingRouter.js
│   ├── middlewares/
│   │   ├── identification.js   # JWT verification
│   │   ├── validator.js        # Input validation (Joi)
│   │   └── sendMail.js         # Email service
│   ├── utils/
│   │   └── hashing.js          # Password hashing
│   ├── index.js                # Server entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx       # Login/Signup page
│   │   │   ├── Dashboard.jsx   # Test listing
│   │   │   ├── ExamInterface.jsx # Main exam UI
│   │   │   ├── Timer.jsx       # Countdown timer
│   │   │   ├── QuestionNavigator.jsx
│   │   │   └── WebcamMonitor.jsx # Webcam capture
│   │   ├── store.js            # Zustand state management
│   │   ├── App.jsx             # Router & routes
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
│
└── ml-service/                 # FastAPI ML Service
    ├── main.py                 # FastAPI app & endpoints
    ├── advanced_models.py      # Production ML examples
    └── requirements.txt
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- Python (3.9+)
- MongoDB (local or Atlas)
- Git

### 1. Backend Setup (Express + MongoDB)

```powershell
# Navigate to backend
cd exam-platform/backend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env and configure:
# - MONGO_URI (your MongoDB connection string)
# - TOKEN_SECRET (random secret key)
# - EMAIL credentials (for verification)
# - FASTAPI_URL=http://localhost:8001

# Start the server
npm run dev
```

Backend will run on **http://localhost:8000**

### 2. ML Service Setup (FastAPI + Python)

```powershell
# Navigate to ml-service
cd exam-platform/ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

ML Service will run on **http://localhost:8001**

### 3. Frontend Setup (React + Vite)

```powershell
# Navigate to frontend
cd exam-platform/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on **http://localhost:5173**

## 🎮 Usage

### Admin/Teacher Flow

1. **Create Account** (type: `admin`)
2. **Login** to dashboard
3. **Create Test** via API (see API docs below)
4. **Add Questions** to the test
5. **Activate Test** for students

### Student Flow

1. **Create Account** (type: `candidate`)
2. **Login** to dashboard
3. **Select Test** from available tests
4. **Read Instructions** carefully
5. **Start Test** (webcam permission required)
6. **Answer Questions** while being monitored
7. **Submit Test** when done

### Anti-Cheating Features in Action

- **Tab Switch Detection**: If student switches tabs → logged as "medium" severity
- **Multiple Faces**: If >1 face detected → logged as "critical" (score: 90)
- **No Face**: If no face detected → logged as "high" (score: 70)
- **Gaze Away**: If face not centered → logged as "medium" (score: 30)
- **Periodic Capture**: Webcam captured every 15 seconds + on question change

## 📡 API Endpoints

### Authentication
```
POST /api/auth/signup       - Create new account
POST /api/auth/signin       - Login
POST /api/auth/signout      - Logout
```

### Exam Management
```
GET  /api/exam/all                   - Get all tests
GET  /api/exam/:testId               - Get test details
GET  /api/exam/:testId/questions     - Get questions (without answers)
POST /api/exam/create                - Create test (admin)
POST /api/exam/add-questions         - Add questions (admin)
POST /api/exam/start                 - Start test attempt
POST /api/exam/save-answer           - Save answer
POST /api/exam/submit                - Submit test
POST /api/exam/update-time           - Auto-save time remaining
```

### Cheating Detection
```
POST /api/cheating/log              - Log cheating event
POST /api/cheating/check-webcam     - Send webcam image for ML analysis
GET  /api/cheating/logs/:progressId - Get logs for attempt
GET  /api/cheating/admin/logs/:testId - Get all logs (admin)
```

### ML Service
```
GET  /                              - Health check
POST /ml/check_face                 - Analyze webcam image
POST /ml/check_liveness             - Liveness detection (basic)
```

## 🧪 Sample Test Data

You can create a test using this API call (use Postman or similar):

```json
POST /api/exam/create
Headers: { "Authorization": "Bearer <token>" }

{
  "title": "JavaScript Fundamentals",
  "description": "Test your JS knowledge",
  "duration": 30,
  "totalMarks": 10,
  "passingMarks": 6,
  "allowedAttempts": 2,
  "instructions": "Answer all questions carefully."
}
```

Then add questions:

```json
POST /api/exam/add-questions

{
  "testId": "<test-id>",
  "questions": [
    {
      "questionText": "What is JavaScript?",
      "options": [
        { "optionIndex": "A", "optionText": "A programming language" },
        { "optionIndex": "B", "optionText": "A coffee brand" },
        { "optionIndex": "C", "optionText": "A car model" },
        { "optionIndex": "D", "optionText": "None of the above" }
      ],
      "correctAnswer": "A",
      "marks": 1,
      "questionNumber": 1
    }
  ]
}
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- HTTP-only cookies
- CORS configuration
- Helmet.js security headers
- Input validation with Joi
- Tab-switch detection
- Window blur detection
- Webcam monitoring
- ML-based cheating detection

## 🚀 Production Deployment

### Backend (Express)
- Deploy on **Heroku**, **Railway**, **Render**, or **AWS EC2**
- Use **MongoDB Atlas** for database
- Set environment variables
- Enable HTTPS

### ML Service (FastAPI)
- Deploy on **AWS Lambda** + API Gateway
- Or use **Google Cloud Run**
- Or deploy on dedicated server with **Docker**

### Frontend (React)
- Deploy on **Vercel**, **Netlify**, or **AWS S3 + CloudFront**
- Update `VITE_API_URL` to production backend URL

## 📈 Future Enhancements

- [ ] Advanced ML models (YOLO, MediaPipe, InsightFace)
- [ ] Real-time admin dashboard with Socket.io
- [ ] Video recording option
- [ ] Phone/object detection
- [ ] Advanced head pose estimation
- [ ] Proctoring reports with screenshots
- [ ] Mobile app support
- [ ] Multi-language support
- [ ] Question bank management
- [ ] Bulk question import (CSV/JSON)

## 🐛 Troubleshooting

### Webcam not working
- Ensure browser has camera permission
- Use HTTPS in production (required for webcam)
- Check browser compatibility (Chrome/Edge recommended)

### ML Service connection failed
- Verify FastAPI is running on port 8001
- Check `FASTAPI_URL` in backend `.env`
- Check firewall/network settings

### MongoDB connection failed
- Verify MongoDB is running
- Check `MONGO_URI` in `.env`
- Ensure network access (for Atlas)

## 📄 License

MIT License - feel free to use for educational purposes.


