import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: any): State {
    // Update state so the next render will show the fallback UI
    let processedError: Error;
    
    // Handle different error types
    if (error instanceof Error) {
      processedError = error;
    } else if (typeof error === 'object') {
      try {
        processedError = new Error(JSON.stringify(error, null, 2));
      } catch (e) {
        processedError = new Error('An unknown error occurred');
      }
    } else if (typeof error === 'string') {
      processedError = new Error(error);
    } else {
      processedError = new Error('An unknown error occurred');
    }
    
    return {
      hasError: true,
      error: processedError,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      hasError: true
    });
    
    // Try to extract more useful information from the error
    let detailedError = error;
    
    // Handle common error types better
    if (error instanceof TypeError) {
      console.info('TypeError detected, likely a property access on undefined or null');
    } else if (error instanceof ReferenceError) {
      console.info('ReferenceError detected, likely an undefined variable');
    } else if (error.message?.includes('import') || error.message?.includes('require')) {
      console.info('Module loading error detected');
    }
    
    this.setState({
      errorInfo,
      error: detailedError
    });
    
    // If it's a dependency loading error, we could try to recover
    if (error.message?.includes('jszip') || error.message?.includes('file-saver')) {
      // Wait 2 seconds and then try to reset the error state
      setTimeout(() => {
        console.info('Attempting recovery from library loading error...');
        this.handleReset();
      }, 2000);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 p-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <FaExclamationTriangle className="text-red-500 text-5xl" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">
              Something went wrong
            </h1>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 rounded-md p-4 mb-4">
              <p className="text-red-800 dark:text-red-300 font-medium">
                {this.state.error && this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer text-red-600 dark:text-red-400">
                    View technical details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-red-100 dark:bg-red-900/50 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <FaRedo className="mr-2" /> Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
