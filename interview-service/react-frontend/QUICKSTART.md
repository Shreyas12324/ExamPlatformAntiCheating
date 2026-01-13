# Interview Practice Partner - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend API running on port 8005
- ML service running on port 8001
- Modern web browser (Chrome/Edge recommended)

## 📦 Installation

```bash
# Navigate to frontend directory
cd interview-service/react-frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Start development server
npm run dev
```

## 🌐 Environment Setup

Edit `.env` file:

```env
VITE_BACKEND_URL=http://localhost:8005
```

## 🎯 Usage Flow

### 1. Start Backend Services

```bash
# Terminal 1: Start ML service
cd ml-service
python main.py

# Terminal 2: Start backend API
cd interview-service/backend
python main.py

# Terminal 3: Start React frontend
cd interview-service/react-frontend
npm run dev
```

### 2. Open Application

Navigate to `http://localhost:5173` in your browser

### 3. Conduct Interview

1. **Home Page**
   - Select role (SDE, Sales, Retail Associate, HR)
   - Choose persona (Efficient, Confused, Chatty, Edge-case)
   - Enter your name
   - Click "Start Interview"

2. **Interview Page**
   - Allow webcam and microphone permissions
   - Read the greeting and first question
   - Answer using text input or voice recorder
   - Webcam captures frames every 3 seconds
   - View alerts in the right sidebar
   - Click "End Interview" when done

3. **Feedback Page**
   - Review your scores (Technical, Communication, Confidence)
   - Read strengths and weaknesses
   - Check recommendations
   - View cheating summary
   - Start new interview or print feedback

## 🎤 Voice Features

### Speech-to-Text (Input)
- Click "Use Voice Input" button
- Click "Start Listening"
- Speak clearly into microphone
- Click "Stop Listening" when done
- Review transcript and click "Use"

### Text-to-Speech (Output)
- Agent messages have a speaker icon 🔊
- Click to hear the message read aloud
- Click again to stop playback

## 📹 Webcam Monitoring

- **Green Status**: Normal behavior
- **Yellow Status**: Warning detected
- **Red Status**: Critical violation

### Controls
- **Pause/Resume**: Stop/start monitoring
- **Mirror**: Toggle camera flip
- **Manual Capture**: Take screenshot immediately

### Detection Types
- 👤 No face detected
- 👥 Multiple faces
- 👀 Looking away
- ↔️ Too far from camera
- 🔍 Too close to camera
- 📱 Mobile device detected

## 🎨 Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in text input

## 🐛 Troubleshooting

### Webcam not detected
```
Solution: Allow camera permissions in browser settings
Chrome: chrome://settings/content/camera
```

### Microphone not working
```
Solution: Allow microphone permissions
Chrome: chrome://settings/content/microphone
```

### Backend connection failed
```
Solution: Check if backend is running
curl http://localhost:8005/health
```

### Voice features not working
```
Solution: Use Chrome or Edge browser
Safari has limited voice support
Firefox has no voice support
```

## 📊 API Endpoints

### Interview
- `POST /interview/start` - Start session
- `POST /interview/next` - Send answer
- `POST /interview/end` - Get feedback

### Cheating
- `POST /cheating/log` - Log event
- `GET /cheating/timeline/:id` - Get timeline

## 🔧 Development

### File Structure
```
src/
├── components/      # UI components
├── pages/          # Route pages
├── services/       # API & utilities
├── hooks/          # Custom hooks
├── context/        # Global state
└── styles/         # CSS files
```

### Adding New Features

1. Create component in `src/components/`
2. Add route in `src/App.jsx`
3. Update API in `src/services/api.js`
4. Add to context if needed

### Code Style

- Use functional components
- Prefer hooks over classes
- Use Tailwind for styling
- Follow ESLint rules

## 📱 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome  | ✅ Full | Recommended |
| Edge    | ✅ Full | Recommended |
| Safari  | ⚠️ Partial | No STT |
| Firefox | ❌ Limited | No voice |

## 🚢 Production Deployment

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Set in hosting platform:
- `VITE_BACKEND_URL` - Your backend API URL

## 📈 Performance Tips

1. **Optimize Images**: Webcam captures are compressed
2. **Lazy Loading**: Routes are code-split
3. **Memoization**: Callbacks are memoized
4. **Network**: API calls are batched

## 🔒 Security

- Webcam data sent as base64
- No localStorage usage
- HTTPS recommended for production
- Environment variables for secrets

## 🆘 Common Issues

### Issue: "Module not found"
```bash
Solution: npm install
```

### Issue: "Port already in use"
```bash
Solution: Change port in vite.config.js
```

### Issue: "CORS error"
```bash
Solution: Check backend CORS settings
```

## 📞 Support

- Check backend logs for API errors
- Use browser console for client errors
- Review network tab for failed requests

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

**Ready to practice your interview skills? Start the app and good luck! 🎯**
