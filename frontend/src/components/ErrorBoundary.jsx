import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, resetError }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();
    navigate('/app');
  };

  const handleReload = () => {
    resetError();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-layout p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Ups! Coś poszło nie tak
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Wystąpił nieoczekiwany błąd w aplikacji. Przepraszamy za niedogodności.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
              {error.toString()}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
            }}
          >
            <HomeIcon className="w-5 h-5" />
            Wróć do dashboardu
          </button>
          <button
            onClick={handleReload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Odśwież stronę
          </button>
        </div>

        {import.meta.env.DEV && errorInfo && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
              Szczegóły techniczne (tylko w trybie deweloperskim)
            </summary>
            <pre className="mt-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-auto max-h-64">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;
