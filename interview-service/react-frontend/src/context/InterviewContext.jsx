import { createContext, useContext, useState } from 'react';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [interviewData, setInterviewDataState] = useState({
    interviewId: null,
    role: null,
    persona: null,
    userName: null,
    audioMode: 'text',
    messages: [],
    cheatingAlerts: [],
    interviewEnded: false,
    feedback: null,
    cheating_summary: null,
  });

  const setInterviewData = data => {
    setInterviewDataState(prev => ({
      ...prev,
      ...data,
    }));
  };

  const addMessage = message => {
    setInterviewDataState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const addAlert = alert => {
    setInterviewDataState(prev => ({
      ...prev,
      cheatingAlerts: [...prev.cheatingAlerts, alert],
    }));
  };

  const setFeedback = (feedback, cheating_summary) => {
    setInterviewDataState(prev => ({
      ...prev,
      feedback,
      cheating_summary,
      interviewEnded: true,
    }));
  };

  const resetInterview = () => {
    setInterviewDataState({
      interviewId: null,
      role: null,
      persona: null,
      userName: null,
      audioMode: 'text',
      messages: [],
      cheatingAlerts: [],
      interviewEnded: false,
      feedback: null,
      cheating_summary: null,
    });
  };

  return (
    <InterviewContext.Provider
      value={{
        interviewData,
        setInterviewData,
        addMessage,
        addAlert,
        setFeedback,
        resetInterview,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
