import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
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
                Something went wrong while rendering this page.
              </p>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest text-center mt-2">
                {this.props.fallbackTitle || "Application Critical Failure"}
              </p>
            </div>

            <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 overflow-hidden">
              <p className="text-xs text-stone-600 font-black uppercase tracking-widest text-center mb-2">Error Insight</p>
              <div className="text-[10px] text-stone-400 font-bold leading-relaxed text-center break-words opacity-60">
                {this.state.error?.message || "Operational anomaly detected"}
              </div>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl"
            >
              <RotateCcw size={16} />
              Reload Station
            </button>
          </div>
          
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 px-6 py-3 bg-stone-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Protocol Delta Active</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
