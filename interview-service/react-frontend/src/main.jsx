import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { InterviewProvider } from './context/InterviewContext';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <InterviewProvider>
        <App />
      </InterviewProvider>
    </ErrorBoundary>
  </StrictMode>
);
