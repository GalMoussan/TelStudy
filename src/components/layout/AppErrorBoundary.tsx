'use client';
import React from 'react';
import { Card } from '@/components/ui';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-sm font-mono text-[var(--error)]">Something went wrong</p>
          {this.state.errorMessage && (
            <p className="text-xs text-[var(--muted)] max-w-xs">{this.state.errorMessage}</p>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="text-xs font-mono text-[var(--accent)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Retry
          </button>
        </Card>
      );
    }

    return this.props.children;
  }
}
