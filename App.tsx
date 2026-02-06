import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Dashboard } from './components/Dashboard';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-8 font-sans">
            <div className="max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-900 font-serif font-bold text-2xl">!</div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-serif text-slate-900 font-bold">System Protocol Interrupted</h1>
                    <p className="text-slate-500 text-sm">The Academy interface encountered an unexpected anomaly.</p>
                </div>
                <div className="text-slate-500 font-mono text-[10px] bg-slate-50 p-4 rounded text-left overflow-auto max-h-32 border border-slate-200">
                    {this.state.error?.message || 'Unknown Error'}
                </div>
                <button onClick={() => window.location.reload()} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-900 transition-colors">
                    Reinitialize System
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
        <div className="min-h-screen selection:bg-red-900/30">
            <Dashboard />
        </div>
    </ErrorBoundary>
  );
};

export default App;