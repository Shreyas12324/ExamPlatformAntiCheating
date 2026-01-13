import axios from 'axios';

// Base URL from environment variable or default
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8005';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interview API endpoints
export const startInterview = async data => {
  const response = await api.post('/interview/start', data);
  return response.data;
};

export const sendAnswer = async data => {
  const response = await api.post('/interview/next', data);
  return response.data;
};

export const endInterview = async data => {
  const response = await api.post('/interview/end', data);
  return response.data;
};

// Cheating API endpoints
export const logCheatingEvent = async data => {
  const response = await api.post('/cheating/log', data);
  return response.data;
};

export const getCheatingTimeline = async interviewId => {
  const response = await api.get(`/cheating/timeline/${interviewId}`);
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
