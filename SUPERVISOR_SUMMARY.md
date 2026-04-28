# AI-Powered Online Examination & Interview Platform with Anti-Cheating Proctoring

**Project Summary Report**

---

## 1. Introduction & Objective

This project presents an integrated platform for conducting secure online examinations and AI-powered interviews with real-time cheating detection. The system addresses the growing need for remote proctoring solutions in educational and recruitment settings by leveraging computer vision, machine learning, and large language models.

**Key Objectives:**
- Develop a secure MCQ-based examination platform with automated proctoring
- Implement an AI-driven interview system with conversational assessment capabilities
- Deploy real-time cheating detection using webcam-based behavioral analysis
- Achieve high accuracy in detecting malpractice through computer vision techniques

---

## 2. Proposed Methodology

### 2.1 System Design Approach

The platform follows a **microservices architecture** with three independent, loosely-coupled services communicating via RESTful APIs:

| Service | Technology | Port | Responsibility |
|---------|------------|------|----------------|
| Frontend | React + Vite | 5173 | User Interface & Webcam Capture |
| Backend API | Express.js / FastAPI | 5000/8005 | Business Logic, Authentication, LLM Integration |
| ML Service | FastAPI + YOLO | 8001 | Computer Vision & Cheating Detection |

### 2.2 Anti-Cheating Detection Methodology

Our cheating detection pipeline employs a multi-modal approach:

1. **Face Detection & Tracking**: OpenCV Haar Cascades for real-time face localization and counting
2. **Eye Detection**: Haar Cascade eye detector for basic gaze verification
3. **Face Position Analysis**: Monitoring face centering, distance from camera, and visibility
4. **Object Detection**: YOLOv8 for detecting unauthorized items (mobile phones, secondary persons)
5. **Behavioral Event Logging**: Tab-switch detection, window blur monitoring, periodic webcam capture (every 15 seconds)

**Cheating Score Calculation:**

| Violation Type | Score Impact | Severity |
|----------------|--------------|----------|
| No face detected | +70 | High |
| Multiple faces detected | +90 | Critical |
| Mobile phone detected | +85 | Critical |
| Face not centered (looking away) | +30 | Medium |
| Face too far from camera | +25 | Medium |
| Eyes not visible | +5 | Low |

### 2.3 Interview Assessment Methodology

The AI Interview module employs:
- **LLM-based Conversational Agent**: Groq API for generating contextual questions and evaluating responses
- **Role-based Question Generation**: Technical questions tailored to job roles (Frontend, Backend, Data Science, etc.)
- **Memory Management**: Conversation history tracking for coherent multi-turn dialogues
- **Real-time Proctoring**: Parallel cheating detection during interview sessions

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                           │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │   Exam Platform (React)  │    │   Interview Platform (React)        │ │
│  │   • MCQ Interface        │    │   • Chat Interface                  │ │
│  │   • Question Navigator   │    │   • Voice Recorder                  │ │
│  │   • Timer Component      │    │   • Webcam Feed                     │ │
│  │   • Webcam Monitor       │    │   • Feedback Display                │ │
│  └───────────┬─────────────┘    └──────────────┬──────────────────────┘ │
└──────────────┼──────────────────────────────────┼───────────────────────┘
               │ HTTP/REST                         │ HTTP/REST
               ▼                                   ▼
┌──────────────────────────────┐    ┌────────────────────────────────────┐
│   EXAM BACKEND (Express.js)  │    │   INTERVIEW BACKEND (FastAPI)      │
│   Port 5000                  │    │   Port 8005                        │
│   • JWT Authentication       │    │   • Interview State Management     │
│   • Test/Question CRUD       │    │   • LLM Agent (Groq)               │
│   • Progress Tracking        │    │   • Memory Manager                 │
│   • Cheating Log Storage     │    │   • Role-based Questionnaire       │
│   • MongoDB Integration      │    │   • Scoring Engine                 │
└──────────────┬───────────────┘    └──────────────┬─────────────────────┘
               │                                    │
               └──────────────┬─────────────────────┘
                              │ Image Analysis Requests
                              ▼
               ┌──────────────────────────────────────┐
               │       ML SERVICE (FastAPI + YOLO)    │
               │       Port 8001                      │
               │   • Face Detection (Haar Cascade)    │
               │   • Multi-person Detection (YOLO)    │
               │   • Mobile Phone Detection           │
               │   • Gaze Tracking                    │
               │   • Cheating Score Calculation       │
               └──────────────────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────┐
               │         DATA LAYER                   │
               │   • MongoDB (User, Test, Progress)   │
               │   • In-memory State (Interviews)     │
               │   • Cheating Logs                    │
               └──────────────────────────────────────┘
```

### 3.2 Data Flow

1. **Exam Flow**: User Login → Test Selection → Question Rendering → Periodic Webcam Capture → ML Analysis → Cheating Score → Auto-save Progress → Submission
2. **Interview Flow**: Role Selection → LLM Greeting → Question-Answer Loop → Parallel Proctoring → Feedback Generation

---

## 4. Experimental Results

### 4.1 Preliminary Study: Head Pose Analysis for Cheating Detection

To validate the importance of head pose features in cheating detection, we conducted an exploratory analysis on a benchmark dataset before platform development.

**Dataset & Setup:**
- **Dataset**: MSU Online Exam Proctoring (OEP) Database
- **Subjects**: 24 participants
- **Samples**: 338 extracted frames (frame_skip=30)
- **Features**: 11 (7 original + 4 engineered)
- **Feature Extraction**: MediaPipe FaceMesh with PnP algorithm for head pose; Farneback optical flow for motion

### 4.2 Class Distribution

| Label | Behavior Type | Count | Percentage |
|-------|---------------|-------|------------|
| 1 | Normal | 63 | 19% |
| 2 | Cheating Type 1 | 161 | 48% |
| 3 | Cheating Type 2 | 81 | 24% |
| 5 | Cheating Type 3 | 5 | 1% |
| 6 | Cheating Type 4 | 26 | 8% |

### 4.3 Feature Importance Analysis (RandomForest)

| Rank | Feature | Importance |
|------|---------|------------|
| 1 | head_stability | 13.63% |
| 2 | motion_mean_5 | 11.14% |
| 3 | roll | 10.08% |
| 4 | pitch | 8.90% |
| 5 | yaw | 8.17% |
| 6 | motion_std_5 | 7.72% |
| 7 | delta_yaw | 7.37% |

**Key Finding**: Head pose angles (pitch, yaw, roll) combined contribute **27.15%** importance, validating their significance in cheating detection. This preliminary study informed our platform design, confirming that face orientation and movement patterns are reliable indicators of suspicious behavior.

### 4.4 Model Performance

| Model | Weighted F1-Score | Cross-Validation |
|-------|------------------|------------------|
| **RandomForest** | **0.856** | 5-fold Stratified |
| XGBoost | 0.849 | 5-fold Stratified |

- **Class Imbalance Handling**: SMOTE (Synthetic Minority Over-sampling)
- **Feature Scaling**: StandardScaler normalization
- **Best Model**: RandomForest with F1-score of **85.6%**

### 4.5 Head Pose Statistics

| Metric | Pitch (°) | Yaw (°) | Roll (°) |
|--------|-----------|---------|----------|
| Min | -177.90 | -83.93 | -178.04 |
| Max | 130.18 | 48.42 | 174.63 |
| Mean | 85.43 | -70.12 | 118.59 |

---

## 5. Key Findings & Conclusions

### From Preliminary Study:
1. **Head pose angles** (pitch, yaw, roll) are significant predictors of cheating behavior (27.15% combined importance)
2. **Head stability** emerged as the strongest single feature (13.63%), validating face position monitoring
3. The RandomForest classifier achieves **85.6% F1-score** on the MSU-OEP dataset

### Platform Implementation:
1. Real-time face detection and position tracking successfully identifies looking-away behavior
2. YOLOv8 object detection reliably identifies mobile phones and multiple persons
3. Multi-tier cheating score (0-100) with severity levels enables graduated response
4. LLM-powered interview module provides intelligent conversational assessment
5. Standard webcam input ensures accessibility across devices

---

## 6. NodeGPT Architecture Diagram Prompt

```
Create a system architecture diagram for an "AI-Powered Online Exam & Interview Platform with Anti-Cheating Proctoring" with the following components:

TOP LAYER - "Client Layer (Browser)":
- Two boxes side by side: "Exam Platform (React)" and "Interview Platform (React)"
- Exam Platform contains: MCQ Interface, Question Navigator, Timer, Webcam Monitor
- Interview Platform contains: Chat Interface, Voice Recorder, Webcam Feed, Feedback Display

MIDDLE LAYER - "Application Layer":
- Two backend boxes connected to respective frontends:
  - "Exam Backend (Express.js + MongoDB)" with: JWT Auth, Test CRUD, Progress Tracking, Cheating Logs
  - "Interview Backend (FastAPI)" with: LLM Agent (Groq), Memory Manager, Questionnaire, Scoring Engine

BOTTOM LAYER - "ML/AI Layer":
- Central box "ML Service (FastAPI + YOLOv8)" connected to both backends
- Contains: Face Detection (Haar Cascade), Eye Detection, Multi-person Detection, Mobile Phone Detection, Face Position Analysis, Cheating Score Calculator

DATA LAYER - At the bottom:
- "MongoDB Database" storing: Users, Tests, Questions, Progress, Cheating Logs

Use arrows to show:
- Webcam images flowing from frontends to ML Service
- Cheating scores returning to backends
- REST API connections between all layers
- Data persistence to MongoDB

Color scheme: Blue for frontend, Green for backend, Orange for ML service, Gray for database
Style: Modern, clean, microservices architecture with clear separation of concerns
```

---

**Technologies Used**: React, Vite, TailwindCSS, Express.js, FastAPI, MongoDB, OpenCV, YOLOv8, Groq LLM

**Model Artifacts**: YOLOv8n.pt (object detection), Haar Cascade classifiers (face/eye detection)
