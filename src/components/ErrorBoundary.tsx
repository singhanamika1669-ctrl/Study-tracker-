import React from 'react';
import {RotateCcw, ShieldAlert} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg = error instanceof Error ? error.message : 'Unexpected runtime issue';
    return {hasError: true, message: msg};
  }

  override componentDidCatch(_error: unknown) {
    // Kept silent in production UI; screen gives clean user recovery control
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#08101c] p-5 text-white">
          <div className="w-full max-w-md rounded-2xl border border-sky-500/30 bg-[#0f1b2d] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="font-display text-lg font-extrabold text-white">
              Study Tracker — Base Recovery
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Koi runtime glitch aa gaya tha, par aapka saved study data safe hai. App ko
              dobara reload karein.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-sky-400"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Study Tracker
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
