import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";

/* ── App-level Error Boundary ─────────────────────────── */

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[AppErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Something went wrong.
            </h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred. Please reload the page.
            </p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Page-level Error Boundary ────────────────────────── */

interface PageErrorBoundaryProps {
  children: ReactNode;
}

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[PageErrorBoundary]", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Page error.
            </h2>
            <p className="text-muted-foreground text-sm">
              Something went wrong on this page.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" asChild>
                <a href="/">Go to Dashboard</a>
              </Button>
              <Button onClick={this.handleRetry}>Retry</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
