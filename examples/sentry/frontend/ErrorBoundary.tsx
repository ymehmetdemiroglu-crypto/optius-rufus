import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react";

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
    >
      {children}
    </SentryErrorBoundary>
  );
}
