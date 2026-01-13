# 🎯 AI Interview Partner with Anti-Cheating Proctoring

A comprehensive AI-powered interview practice platform featuring adaptive interviewing, real-time anti-cheating detection, and detailed feedback generation. Built with FastAPI, React, and YOLO-based computer vision.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Node](https://img.shields.io/badge/Node-18+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)
![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-7.2+-646CFF.svg)
![YOLO](https://img.shields.io/badge/YOLO-v8-00FFFF.svg)
![LLaMA](https://img.shields.io/badge/LLaMA-3.3--70B-FF6F00.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 📋 Overview

This microservice provides an end-to-end interview practice solution with intelligent proctoring capabilities. The system combines natural language processing with computer vision to create a realistic interview environment while maintaining integrity through anti-cheating measures.

### Sub-Services

- **Backend**: FastAPI server handling interview orchestration, LLM interactions, and business logic
- **React Frontend**: Modern React interface with voice/text input, real-time webcam monitoring
- **ML Service**: Python-based YOLO detection service for anti-cheating monitoring

---

## ✨ Key Features

### 🎙️ Interactive Interview Experience
- **Dual Input Modes**: Text-based chat or voice-enabled speech recognition
- **Voice Output**: Text-to-speech for agent responses (auto-play in voice mode)
- **Real-time Conversation**: Natural back-and-forth dialogue flow

### 🤖 Adaptive AI Interviewer
- **LLM-Powered**: Uses Groq's LLaMA 3.3 70B for intelligent responses
- **Adaptive Persona**: Automatically detects and adapts to user communication style:
  - Confused: Patient and explanatory
  - Efficient: Brief and direct
  - Chatty: Friendly but redirecting
  - Edge-case: Graceful handling of unusual responses
- **Role-Specific Questions**: Tailored question banks for different job roles

### 🛡️ Anti-Cheating Proctoring
- **YOLO-Based Detection**: Real-time computer vision monitoring
- **Multiple Detection Types**:
  - Mobile device detection
  - Multiple faces detection
  - Tab switching detection
- **Alert System**: Toast notifications for critical violations
- **Timeline Logging**: Complete cheating event history

### 📊 Intelligent Follow-ups
- **Context-Aware**: Generates follow-up questions based on user responses
- **Adaptive Depth**: Probes deeper or moves forward based on answer quality
- **Natural Flow**: Maintains conversational interview rhythm

### 📈 Structured Feedback
- **Comprehensive Scores**: Technical, Communication, Confidence (0-10 scale)
- **Detailed Analysis**: Overall summary with specific strengths and weaknesses
- **Actionable Recommendations**: Personalized improvement suggestions
- **Cheating Summary**: Integrated proctoring report (hidden from UI)

### 👥 User Behavior Support
- **Confused Users**: Extra guidance and clarification
- **Efficient Users**: Streamlined, concise interactions
- **Chatty Users**: Professional redirection
- **Edge Cases**: Graceful handling of unexpected inputs

---

## 🏗️ Architecture

```
interview-service/
├── backend/                # FastAPI Backend (Port 8005)
│   ├── main.py            # Entry point
│   ├── routers/           # API endpoints
│   │   ├── interview_router.py
│   │   └── cheating_router.py
│   ├── services/          # Business logic
│   │   ├── llm_agent.py
│   │   ├── memory_manager.py
│   │   ├── questionnaire.py
│   │   └── cheating_monitor.py
│   └── utils/             # Configuration & helpers
│
├── react-frontend/        # React + Vite (Port 5173)
│   ├── src/
│   │   ├── pages/        # Main views
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React Context (state)
│   │   ├── hooks/        # Custom React hooks
│   │   └── services/     # API clients
│   └── package.json
│
└── README.md
```
### 🔶 High-Level System Architecture (Mermaid Diagram)



<img width="1130" height="310" alt="image" src="https://github.com/user-attachments/assets/aa755ff4-3f9c-4c67-9576-43f1deb97127" />

**ML Service** (separate, port 8001): YOLO-based detection service





## 🚀 Installation

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18 or higher
- **npm** or **yarn**
- **Groq API Key**: Sign up at [https://console.groq.com](https://console.groq.com)

### 1. Clone Repository

```bash
git clone https://github.com/Shreyas12324/ExamPlatformAntiCheating.git
cd ExamPlatformAntiCheating/interview-service
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Frontend Setup

```bash
cd react-frontend

# Install dependencies
npm install

# No additional configuration needed
```

### 4. ML Service Setup

```bash
cd ../../ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# YOLO model (yolov8n.pt) should be present
```

---

## ▶️ Running the Application

You need to run **three services** in separate terminals:

### Terminal 1: ML Service

```bash
cd ml-service
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
python main.py
```

ML service runs on **http://localhost:8001**

### Terminal 2: Backend

```bash
cd interview-service/backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
python main.py
```

Backend runs on **http://localhost:8005**

### Terminal 3: Frontend

```bash
cd interview-service/react-frontend
npm run dev
```

Frontend runs on **http://localhost:5173**

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Groq**: LLM API (LLaMA 3.3 70B Versatile)
- **Pydantic**: Data validation
- **Python-dotenv**: Environment management
- **HTTPX**: Async HTTP client

### Frontend
- **React 19.2**: UI framework
- **Vite 7.2**: Build tool
- **React Router DOM**: Navigation
- **React Hot Toast**: Notifications
- **Tailwind CSS**: Styling
- **React Webcam**: Camera access
- **Web Speech API**: Voice recognition & synthesis

### ML Service
- **YOLOv8**: Object detection
- **OpenCV**: Computer vision
- **FastAPI**: API server
- **Ultralytics**: YOLO implementation

### Infrastructure
- **In-Memory Storage**: Fast session management
- **CORS**: Cross-origin support
- **RESTful APIs**: Standard HTTP endpoints

---

## 📂 Folder Structure

```
interview-service/
│
├── backend/
│   ├── main.py                      # FastAPI app entry
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment template
│   │
│   ├── routers/
│   │   ├── interview_router.py      # Interview lifecycle endpoints
│   │   └── cheating_router.py       # Proctoring endpoints
│   │
│   ├── services/
│   │   ├── llm_agent.py             # Groq LLM integration
│   │   ├── memory_manager.py        # Conversation history
│   │   ├── questionnaire.py         # Question bank management
│   │   └── cheating_monitor.py      # Monitoring orchestration
│   │
│   └── utils/
│       ├── config.py                # Settings & validation
│       ├── role_data.py             # Job role configurations
│       └── scoring.py               # Scoring logic
│
├── react-frontend/
│   ├── src/
│   │   ├── main.jsx                 # App entry point
│   │   ├── App.jsx                  # Root component
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Interview setup
│   │   │   ├── Interview.jsx        # Main interview UI
│   │   │   └── Feedback.jsx         # Results display
│   │   │
│   │   ├── components/
│   │   │   ├── ChatBubble.jsx       # Message display
│   │   │   ├── ChatInput.jsx        # Input interface
│   │   │   ├── VoiceRecorder.jsx    # Speech-to-text
│   │   │   ├── VoicePlayer.jsx      # Text-to-speech
│   │   │   ├── WebcamFeed.jsx       # Camera monitoring
│   │   │   ├── Header.jsx           # Navigation bar
│   │   │   └── Toast.jsx            # Notifications
│   │   │
│   │   ├── context/
│   │   │   └── InterviewContext.jsx # Global state
│   │   │
│   │   ├── hooks/
│   │   │   ├── useInterview.js      # Interview state logic
│   │   │   ├── useVoice.js          # Voice controls
│   │   │   └── useWebcam.js         # Camera controls
│   │   │
│   │   └── services/
│   │       ├── api.js               # Backend API client
│   │       └── voice.js             # Speech API wrapper
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# LLM Configuration
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# ML Service Configuration
ML_SERVICE_URL=http://localhost:8001

# Server Configuration
PORT=8005
HOST=0.0.0.0

# Interview Configuration
MAX_QUESTIONS=7
MIN_QUESTIONS=5

# Cheating Detection Configuration
CHEATING_CHECK_INTERVAL=3
```

### Role Configuration

Edit `backend/utils/role_data.py` to add custom job roles and question banks.

---

## 🧪 API Documentation

Once the backend is running, access interactive API docs:

- **Swagger UI**: http://localhost:8005/docs
- **ReDoc**: http://localhost:8005/redoc

### Key Endpoints

- `POST /interview/start` - Start new interview
- `POST /interview/next` - Submit answer, get next question
- `POST /interview/end` - End interview, get feedback
- `POST /cheating/log` - Log cheating event

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards

- **Python**: Follow PEP 8, use Black formatter (line length 88)
- **JavaScript/React**: Use Prettier defaults, ESLint recommended rules
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for new features
- **Tests**: Add tests for new functionality (when applicable)

### Issues

Found a bug or have a suggestion? Please open an issue with:
- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq**: For providing fast LLM inference
- **Ultralytics**: For YOLO implementation
- **FastAPI**: For excellent Python web framework
- **React Team**: For powerful UI library

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

**Repository**: [https://github.com/Shreyas12324/ExamPlatformAntiCheating](https://github.com/Shreyas12324/ExamPlatformAntiCheating)

---
---

