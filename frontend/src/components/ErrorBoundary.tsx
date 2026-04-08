import React, { Component, ErrorInfo, ReactNode } from "react";
import { HandDrawnCard } from "./HandDrawnCard";
import { HandDrawnButton } from "./HandDrawnButton";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches rendering errors in descendant components and displays a
 * doodle-themed fallback UI instead of crashing the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <HandDrawnCard className="max-w-md w-full text-center">
            <h2 className="font-heading text-2xl font-bold text-[#DC2626] mb-3">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. You can try again or go back to the
              home page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-gray-100 p-3 rounded mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <HandDrawnButton variant="primary" onClick={this.handleRetry}>
                Try Again
              </HandDrawnButton>
              <HandDrawnButton
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      );
    }

    return this.props.children;
  }
}
