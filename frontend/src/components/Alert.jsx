import React from 'react';

const Alert = ({ type = 'info', title, message, onClose }) => {
  const styles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: '✅',
      iconBg: 'bg-green-100',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: '❌',
      iconBg: 'bg-red-100',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: '⚠️',
      iconBg: 'bg-amber-100',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`border rounded-lg p-4 ${style.container} animate-slide-down`}
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center`}>
          <span className="text-base">{style.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold mb-1">{title}</h3>
          )}
          {message && (
            <p className="text-xs leading-relaxed">{message}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Zamknij"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
