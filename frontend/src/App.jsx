import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { ToastProvider } from './components/Toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ExamInterface from './components/ExamInterface';

function PrivateRoute({ children }) {
	const { isAuthenticated } = useAuthStore();
	return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
	const { checkAuth } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, []);

	return (
		<ToastProvider>
			<Router>
				<Routes>
					<Route path="/" element={<Login />} />
					<Route
						path="/dashboard"
						element={
							<PrivateRoute>
								<Dashboard />
							</PrivateRoute>
						}
					/>
					<Route
						path="/exam/:testId"
						element={
							<PrivateRoute>
								<ExamInterface />
							</PrivateRoute>
						}
					/>
				</Routes>
			</Router>
		</ToastProvider>
	);
}

export default App;
