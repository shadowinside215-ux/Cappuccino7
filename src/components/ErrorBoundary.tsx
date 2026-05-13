import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 p-12 bg-white rounded-[3rem] shadow-2xl border border-stone-100">
            <div className="flex justify-center">
              <div className="p-6 bg-red-50 rounded-3xl text-red-500">
                <AlertTriangle size={48} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">
                Oops!
              </h1>
              <p className="text-stone-500 font-bold leading-relaxed">
                Something went wrong while rendering this page. We've been notified and are working on a fix.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl"
            >
              <RotateCcw size={16} />
              Reload Application
            </button>
            
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
              Error ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
