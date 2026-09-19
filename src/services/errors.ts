/**
 * A small typed error so the UI can show a specific, user-friendly message
 * instead of a raw stack trace or a generic "something went wrong".
 */
export type AppErrorCode =
  | "NO_API_KEY"
  | "INVALID_API_KEY"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "NO_QUESTION_FOUND"
  | "NO_ERROR_FOUND"
  | "EMPTY_RESPONSE"
  | "PARSE_ERROR"
  | "CONTEXT_INVALIDATED"
  | "UNKNOWN"

export class AppError extends Error {
  code: AppErrorCode

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.name = "AppError"
    this.code = code
  }
}

export const getFriendlyMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    switch (error.code) {
      case "NO_API_KEY":
        return "Add an API key in the extension options to use this feature."
      case "INVALID_API_KEY":
        return "Your API key was rejected. Check it in the extension options."
      case "QUOTA_EXCEEDED":
        return "This API key has run out of quota or free credits. Check your plan/billing with the provider, or switch to a different key in the extension options."
      case "RATE_LIMITED":
        return "Too many requests right now. Please wait a moment and try again."
      case "NETWORK_ERROR":
        return "Couldn't reach the AI provider. Check your internet connection and try again."
      case "TIMEOUT":
        return "The request took too long and was cancelled. Please try again."
      case "NO_QUESTION_FOUND":
        return "Couldn't find a question on this page. Open a CodeTantra problem and try again."
      case "NO_ERROR_FOUND":
        return "Couldn't find an error or failed test output on this page. Run or submit your code first, then try again."
      case "EMPTY_RESPONSE":
        return "The AI provider returned an empty response. Please try again."
      case "PARSE_ERROR":
        return "Received an unexpected response from the AI provider. Please try again."
      case "CONTEXT_INVALIDATED":
        return "The extension was updated or reloaded. Please refresh this page and try again."
      default:
        return "Something went wrong. Please try again."
    }
  }

  return "Something went wrong. Please try again."
}
