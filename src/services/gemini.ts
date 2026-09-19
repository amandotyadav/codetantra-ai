import { AppError } from "~services/errors"
import {
  buildPrompt,
  parseDelimitedResponse,
  type GenerateSolutionInput,
  type SolutionResult
} from "~services/prompt"
import { readSseData } from "~services/sse"

/**
 * Everything here runs entirely in the browser: the extracted question/code
 * is sent directly from this device to Google's Generative Language API
 * using the user's own API key. Nothing passes through any third-party
 * server operated by this extension.
 */

const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_STREAM_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`
const REQUEST_TIMEOUT_MS = 60000

/**
 * Gemini returns 429 for both short-lived rate limiting and genuine quota
 * exhaustion (free-tier daily/monthly limits or a billing issue). It
 * doesn't cleanly flag which one in the status code, so this inspects the
 * error body: a per-day/per-month quota violation, or any mention of
 * billing, means the key is actually out of quota rather than just
 * momentarily throttled.
 */
export const isGeminiQuotaExhausted = async (
  response: Response
): Promise<boolean> => {
  try {
    const body = await response.clone().json()
    const message: string = body?.error?.message ?? ""
    const violations: Array<{ quotaId?: string; quotaMetric?: string }> =
      body?.error?.details?.flatMap(
        (detail: { violations?: unknown }) =>
          (detail.violations as typeof violations) ?? []
      ) ?? []

    const mentionsLongWindow = violations.some((violation) =>
      /perday|permonth|daily|monthly/i.test(
        `${violation.quotaId ?? ""} ${violation.quotaMetric ?? ""}`
      )
    )

    return (
      mentionsLongWindow || /billing|exceeded your current quota/i.test(message)
    )
  } catch {
    return false
  }
}

/**
 * Verifies an API key by listing available models - the cheapest read-only
 * call the API offers, so testing a key doesn't burn generation quota.
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  )
  return response.ok
}

/**
 * Streams the solution as it's generated, calling `onDelta` with each new
 * chunk of raw text (including the section markers - see ~services/prompt),
 * and resolves with the fully parsed result once the stream ends.
 */
export const generateSolution = async (
  apiKey: string,
  input: GenerateSolutionInput,
  onDelta?: (delta: string) => void
): Promise<SolutionResult> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response

  try {
    response = await fetch(
      `${GEMINI_STREAM_ENDPOINT}?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(input) }] }],
          generationConfig: { temperature: 0.2 }
        }),
        signal: controller.signal
      }
    )
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("TIMEOUT", "Gemini request timed out")
    }
    throw new AppError("NETWORK_ERROR", "Failed to reach Gemini API")
  }

  if (response.status === 400 || response.status === 403) {
    clearTimeout(timeout)
    throw new AppError("INVALID_API_KEY", "Gemini rejected the API key")
  }

  if (response.status === 429) {
    const quotaExhausted = await isGeminiQuotaExhausted(response)
    clearTimeout(timeout)
    throw new AppError(
      quotaExhausted ? "QUOTA_EXCEEDED" : "RATE_LIMITED",
      "Gemini declined the request (429)"
    )
  }

  if (!response.ok) {
    clearTimeout(timeout)
    throw new AppError("UNKNOWN", `Gemini request failed (${response.status})`)
  }

  let fullText = ""

  try {
    for await (const data of readSseData(response)) {
      let json: unknown
      try {
        json = JSON.parse(data)
      } catch {
        continue
      }

      const deltaText = (
        json as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }
      )?.candidates?.[0]?.content?.parts?.[0]?.text

      if (deltaText) {
        fullText += deltaText
        onDelta?.(deltaText)
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("TIMEOUT", "Gemini request timed out")
    }
    throw new AppError(
      "NETWORK_ERROR",
      "Lost connection to Gemini mid-response"
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!fullText) {
    throw new AppError("EMPTY_RESPONSE", "Gemini returned no content")
  }

  return parseDelimitedResponse(fullText)
}
