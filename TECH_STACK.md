# Anti-Cheating Exam Platform - Technologies Used

## Frontend Stack
- **React 18.3** - UI library
- **Vite 5.4** - Build tool & dev server
- **TailwindCSS 3.4** - Styling
- **Zustand 4.5** - State management
- **Axios 1.7** - HTTP client
- **React Router 6.26** - Routing
- **React Webcam 7.2** - Webcam integration

## Backend Stack
- **Node.js 18+** - Runtime
- **Express.js 4.21** - Web framework
- **MongoDB 8.15** - Database
- **Mongoose 8.15** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Joi 17.13** - Validation
- **Nodemailer 6.10** - Email service
- **Multer 1.4** - File upload
- **Helmet 7.2** - Security headers
- **CORS 2.8** - Cross-origin requests

## ML Service Stack
- **Python 3.9+** - Language
- **FastAPI 0.115** - Web framework
- **Uvicorn 0.32** - ASGI server
- **OpenCV 4.10** - Computer vision
- **NumPy 1.26** - Array operations
- **Pillow 10.4** - Image processing

## Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Anti-Cheating Features
- **Tab Switch Detection** - Browser visibility API
- **Window Blur Detection** - Focus event listeners
- **Face Detection** - OpenCV Haar Cascades
- **Multi-person Detection** - ML-based
- **Gaze Tracking** - Eye position analysis
- **Position Monitoring** - Face centering
- **Periodic Capture** - 15-second intervals
- **Event Logging** - MongoDB-backed

## Architecture
- **Three-tier Architecture**
  - Frontend (React SPA)
  - Backend API (Express REST API)
  - ML Service (FastAPI microservice)
- **RESTful API Design**
- **JWT-based Authentication**
- **Real-time Monitoring**
- **Auto-save Mechanism**
- **Responsive Design**

## Database Schema
- **Users** - Authentication & profiles
- **Tests** - Exam definitions
- **Questions** - MCQ data
- **UserProgress** - Attempt tracking
- **CheatingLogs** - Violation records

## Security Measures
- JWT tokens with 8-hour expiry
- HTTP-only cookies
- Password hashing (bcrypt, 12 rounds)
- HMAC for verification codes
- Input validation (Joi schemas)
- CORS configuration
- Helmet security headers
- Protected routes (middleware)

## Deployment Ready
- Environment-based configs
- Production/development modes
- Docker-ready structure
- Cloud-compatible (AWS, Heroku, Vercel)
