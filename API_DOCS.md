# API Documentation

## Base URLs
- Backend: `http://localhost:8000/api`
- ML Service: `http://localhost:8001`

## Authentication

All protected routes require JWT token in either:
- Cookie: `Authorization=Bearer <token>`
- Header: `Authorization: Bearer <token>` (with `client: not-browser` header)

---

## Auth Endpoints

### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "type": "candidate" // or "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your account has been created successfully",
  "result": {
    "_id": "...",
    "email": "user@example.com",
    "type": "candidate"
  }
}
```

### POST /api/auth/signin
Login to get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "candidate",
  "message": "logged in successfully"
}
```

### POST /api/auth/signout
Logout (clears cookie).

**Response:**
```json
{
  "success": true,
  "message": "logged out successfully"
}
```

---

## Exam Endpoints

### GET /api/exam/all
Get all active tests. (Protected)

**Response:**
```json
{
  "success": true,
  "tests": [
    {
      "_id": "...",
      "title": "JavaScript Basics",
      "description": "...",
      "duration": 30,
      "totalMarks": 10,
      "passingMarks": 6,
      "allowedAttempts": 2
    }
  ]
}
```

### GET /api/exam/:testId
Get test details. (Protected)

**Response:**
```json
{
  "success": true,
  "test": {
    "_id": "...",
    "title": "JavaScript Basics",
    "duration": 30,
    "totalMarks": 10,
    "instructions": "..."
  }
}
```

### GET /api/exam/:testId/questions
Get questions for a test (without correct answers). (Protected)

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "_id": "...",
      "questionText": "What is JavaScript?",
      "options": [
        { "optionIndex": "A", "optionText": "..." },
        { "optionIndex": "B", "optionText": "..." }
      ],
      "marks": 1,
      "questionNumber": 1
    }
  ]
}
```

### POST /api/exam/create
Create a new test. (Admin only, Protected)

**Request:**
```json
{
  "title": "JavaScript Fundamentals",
  "description": "Test your JS knowledge",
  "duration": 30,
  "totalMarks": 10,
  "passingMarks": 6,
  "allowedAttempts": 2,
  "instructions": "..."
}
```

### POST /api/exam/add-questions
Add questions to a test. (Admin only, Protected)

**Request:**
```json
{
  "testId": "...",
  "questions": [
    {
      "questionText": "What is JavaScript?",
      "options": [
        { "optionIndex": "A", "optionText": "Programming language" },
        { "optionIndex": "B", "optionText": "Coffee" }
      ],
      "correctAnswer": "A",
      "marks": 1,
      "questionNumber": 1
    }
  ]
}
```

### POST /api/exam/start
Start a test attempt. (Protected)

**Request:**
```json
{
  "testId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test started successfully",
  "progress": {
    "_id": "...",
    "userId": "...",
    "testId": "...",
    "answers": [],
    "timeRemaining": 1800,
    "status": "in-progress"
  }
}
```

### POST /api/exam/save-answer
Save/update answer for a question. (Protected)

**Request:**
```json
{
  "progressId": "...",
  "questionId": "...",
  "selectedAnswer": "A"
}
```

### POST /api/exam/submit
Submit the test for grading. (Protected)

**Request:**
```json
{
  "progressId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test submitted successfully",
  "progress": {
    "totalScore": 8,
    "isPassed": true,
    "answers": [...]
  }
}
```

### POST /api/exam/update-time
Auto-save time remaining. (Protected)

**Request:**
```json
{
  "progressId": "...",
  "timeRemaining": 1500
}
```

---

## Cheating Detection Endpoints

### POST /api/cheating/log
Log a cheating event (tab switch, window blur, etc.). (Protected)

**Request:**
```json
{
  "testId": "...",
  "progressId": "...",
  "eventType": "tab-switch",
  "severity": "medium",
  "description": "User switched tab",
  "questionNumber": 3
}
```

### POST /api/cheating/check-webcam
Send webcam image for ML analysis. (Protected, multipart/form-data)

**Request (FormData):**
```
image: [File]
testId: "..."
progressId: "..."
questionNumber: 3
```

**Response:**
```json
{
  "success": true,
  "cheatingScore": 45,
  "severity": "medium",
  "details": {
    "num_faces": 1,
    "issues": ["Face not centered - possible looking away"]
  }
}
```

### GET /api/cheating/logs/:progressId
Get all cheating logs for a test attempt. (Protected)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "eventType": "tab-switch",
      "severity": "medium",
      "timestamp": "2025-11-07T01:00:00.000Z"
    }
  ]
}
```

---

## ML Service Endpoints

### GET /
Health check.

**Response:**
```json
{
  "status": "online",
  "service": "Anti-Cheating ML Service",
  "version": "1.0.0"
}
```

### POST /ml/check_face
Analyze webcam image for cheating indicators.

**Request (multipart/form-data):**
```
image: [File]
```

**Response:**
```json
{
  "success": true,
  "cheating_score": 30,
  "severity": "low",
  "num_faces": 1,
  "issues": ["Face not centered"],
  "message": "Face not centered - possible looking away",
  "analysis": {
    "faces_detected": 1,
    "optimal_condition": true
  }
}
```

**Cheating Score Ranges:**
- 0-30: Low severity
- 31-59: Medium severity
- 60-79: High severity
- 80-100: Critical severity

**Detected Issues:**
- No face detected (score: 70)
- Multiple faces (score: 90)
- Face not centered (score: +30)
- Face too small/large (score: +15-25)
- Eyes not visible (score: +20)

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
