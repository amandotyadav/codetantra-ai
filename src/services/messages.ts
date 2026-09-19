import type { AppErrorCode } from "~services/errors"
import type { GenerateSolutionInput, SolutionResult } from "~services/prompt"

/**
 * Streaming generation runs over a long-lived port (rather than a single
 * request/response message) between the content script (page context,
 * subject to the host page's CSP) and the background service worker, which
 * performs the actual network call. This lets the background worker push
 * incremental chunks as they arrive instead of only a final result. Errors
 * are sent as plain objects since Error instances don't survive
 * chrome.runtime message serialization.
 */
export const GENERATE_SOLUTION_PORT = "generate-solution-stream"

export interface StartGenerateMessage {
  type: "START"
  payload: GenerateSolutionInput
}

export type GenerateSolutionStreamMessage =
  | { type: "CHUNK"; delta: string }
  | { type: "DONE"; result: SolutionResult }
  | { type: "ERROR"; code: AppErrorCode; message: string }

export const isStartGenerateMessage = (
  message: unknown
): message is StartGenerateMessage =>
  typeof message === "object" &&
  message !== null &&
  (message as { type?: unknown }).type === "START"

/**
 * chrome.runtime.openOptionsPage() only works from an extension page or the
 * background service worker, not from a content script - so the content
 * script asks the background worker to open it instead.
 */
export interface OpenOptionsPageMessage {
  type: "OPEN_OPTIONS_PAGE"
}

export const isOpenOptionsPageMessage = (
  message: unknown
): message is OpenOptionsPageMessage =>
  typeof message === "object" &&
  message !== null &&
  (message as { type?: unknown }).type === "OPEN_OPTIONS_PAGE"

/**
 * chrome.tabs.create is only available to the background service worker,
 * not a content script - so the content script asks the background worker
 * to open the help page in a new tab instead.
 */
export interface OpenHelpPageMessage {
  type: "OPEN_HELP_PAGE"
}

export const isOpenHelpPageMessage = (
  message: unknown
): message is OpenHelpPageMessage =>
  typeof message === "object" &&
  message !== null &&
  (message as { type?: unknown }).type === "OPEN_HELP_PAGE"
