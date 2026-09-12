'use client';

import { Component, ReactNode } from 'react';

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { hasError: boolean; message: string };

export default class ClassroomErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    // Sirf console — server pe log bhejna ho to yahan karein
    console.error('[ClassroomErrorBoundary]', error);
  }

  private reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
          <h3 className="text-lg font-bold text-rose-200">
            {this.props.fallbackTitle || 'Classroom could not be loaded'}
          </h3>
          <p className="mt-2 text-sm text-rose-200/70 break-words">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 transition"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}