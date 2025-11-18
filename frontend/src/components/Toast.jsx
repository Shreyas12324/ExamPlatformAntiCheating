import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within ToastProvider');
	}
	return context;
};

export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);

	const addToast = useCallback((message, type = 'info', duration = 5000) => {
		const id = Date.now() + Math.random();
		const toast = { id, message, type, duration };
		
		setToasts((prev) => [...prev, toast]);

		if (duration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, duration);
		}
	}, []);

	const removeToast = useCallback((id) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}
			<ToastContainer toasts={toasts} removeToast={removeToast} />
		</ToastContext.Provider>
	);
};

const ToastContainer = ({ toasts, removeToast }) => {
	return (
		<div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
			))}
		</div>
	);
};

const Toast = ({ toast, onClose }) => {
	const { message, type } = toast;

	const colors = {
		info: 'bg-blue-600 border-blue-700',
		success: 'bg-green-600 border-green-700',
		warning: 'bg-yellow-500 border-yellow-600',
		error: 'bg-red-600 border-red-700',
		critical: 'bg-red-700 border-red-800',
	};

	const icons = {
		info: 'ℹ️',
		success: '✅',
		warning: '⚠️',
		error: '❌',
		critical: '🚨',
	};

	return (
		<div
			className={`${colors[type] || colors.info} text-white px-6 py-4 rounded-lg shadow-2xl border-2 animate-slide-in-right flex items-start gap-3 min-w-[300px] max-w-md`}
		>
			<span className="text-2xl flex-shrink-0">{icons[type] || icons.info}</span>
			<div className="flex-1">
				<p className="font-semibold text-sm leading-tight">{message}</p>
			</div>
			<button
				onClick={onClose}
				className="text-white hover:text-gray-200 font-bold text-xl flex-shrink-0 leading-none"
			>
				×
			</button>
		</div>
	);
};
