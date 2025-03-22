/**
 * Error handling utilities
 */

type ErrorWithMessage = {
  message: string;
};

/**
 * Type guard to determine if an error has a message
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) return error.message;
  return String(error);
}

/**
 * Navigate to the error page with appropriate error details
 */
export function navigateToErrorPage(
  navigate: (path: string) => void,
  error: unknown,
  statusCode = 500
): void {
  const errorMessage = getErrorMessage(error);
  navigate(`/error?code=${statusCode}&message=${encodeURIComponent(errorMessage)}`);
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown, navigate?: (path: string) => void): void {
  console.error('API Error:', error);
  
  // Log to error monitoring service if available (e.g. Sentry)
  // logErrorToService(error);
  
  if (navigate) {
    navigateToErrorPage(navigate, error);
  }
} 