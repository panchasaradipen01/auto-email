import * as Sentry from '@sentry/nextjs';

/**
 * Initializes Sentry if SENTRY_DSN is configured in environment variables.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1, // Sample 10% of transactions in prod
    debug: false,
  });
}

/**
 * Wrapper helper to log error context and report exceptions to Sentry.
 */
export function captureException(error: any, context?: Record<string, any>) {
  console.error('Exception Intercepted:', error, context || '');
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
