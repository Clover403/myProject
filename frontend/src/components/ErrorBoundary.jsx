import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="bg-white dark:bg-[#1a1d24] rounded-lg shadow-lg p-6 border border-red-200 dark:border-red-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Application Error</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Sorry, something went wrong. The application has encountered an unexpected error.
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                      <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
                        {this.state.error && this.state.error.toString()}
                      </div>
                      <div>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                      </div>
                    </div>
                  </details>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;