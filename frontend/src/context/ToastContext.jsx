import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };
  
  const Icon = icons[type] || Info;
  return <Icon className="w-5 h-5 flex-shrink-0" />;
};

const Toast = ({ toast, onRemove, isDark }) => {
  const typeStyles = {
    success: isDark 
      ? "bg-green-900 border-green-700 text-green-100" 
      : "bg-green-50 border-green-200 text-green-800",
    error: isDark 
      ? "bg-red-900 border-red-700 text-red-100" 
      : "bg-red-50 border-red-200 text-red-800",
    warning: isDark 
      ? "bg-yellow-900 border-yellow-700 text-yellow-100" 
      : "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: isDark 
      ? "bg-blue-900 border-blue-700 text-blue-100" 
      : "bg-blue-50 border-blue-200 text-blue-800"
  };

  const iconStyles = {
    success: isDark ? "text-green-400" : "text-green-500",
    error: isDark ? "text-red-400" : "text-red-500",
    warning: isDark ? "text-yellow-400" : "text-yellow-500",
    info: isDark ? "text-blue-400" : "text-blue-500"
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md min-w-[300px]
        transform transition-all duration-300 ease-in-out
        ${typeStyles[toast.type]} ${toast.isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className={iconStyles[toast.type]}>
        <ToastIcon type={toast.type} />
      </div>
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm mb-1">{toast.title}</div>
        )}
        <div className="text-sm">{toast.message}</div>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className={`ml-2 rounded-full p-1 hover:bg-black/10 transition-colors ${
          isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children, isDark = false }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 4000,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => 
          prev.map(t => 
            t.id === id ? { ...t, isExiting: true } : t
          )
        );
        
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 300); // Animation duration
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => 
      prev.map(t => 
        t.id === id ? { ...t, isExiting: true } : t
      )
    );
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const toast = {
    success: (message, options = {}) => 
      addToast({ ...options, message, type: 'success' }),
    error: (message, options = {}) => 
      addToast({ ...options, message, type: 'error' }),
    warning: (message, options = {}) => 
      addToast({ ...options, message, type: 'warning' }),
    info: (message, options = {}) => 
      addToast({ ...options, message, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
          {toasts.map(toastItem => (
            <Toast
              key={toastItem.id}
              toast={toastItem}
              onRemove={removeToast}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;