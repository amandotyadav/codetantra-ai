import { AppError } from "~services/errors"
import {
  buildPrompt,
  parseDelimitedResponse,
  type GenerateSolutionInput,
  type SolutionResult
} from "~services/prompt"
import { readSseData } from "~services/sse"

/**
 * Sent directly from this device to OpenAI's API using the user's own API
 * key. Nothing passes through any third-party server operated by this
 * extension.
 */

const OPENAI_MODEL = "gpt-4o-mini"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"
const REQUEST_TIMEOUT_MS = 60000

/**
 * OpenAI returns 429 for both transient rate limiting and a genuinely
 * exhausted quota/billing balance, distinguished by `error.code` in the
 * response body: "insufficient_quota" means the key is actually out of
 * credits, not just momentarily throttled.
 */
export const isOpenAiQuotaExhausted = async (
  response: Response
): Promise<boolean> => {
  try {
    const body = await response.clone().json()
    return body?.error?.code === "insufficient_quota"
  } catch {
    return false
  }
}

/**
 * Verifies an API key with the cheapest read-only call OpenAI offers, so
 * testing a key doesn't burn generation quota.
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
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
    response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        stream: true,
        messages: [{ role: "user", content: buildPrompt(input) }]
      }),
      signal: controller.signal
    })
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("TIMEOUT", "OpenAI request timed out")
    }
    throw new AppError("NETWORK_ERROR", "Failed to reach OpenAI API")
  }

  if (response.status === 401 || response.status === 403) {
    clearTimeout(timeout)
    throw new AppError("INVALID_API_KEY", "OpenAI rejected the API key")
  }

  if (response.status === 429) {
    const quotaExhausted = await isOpenAiQuotaExhausted(response)
    clearTimeout(timeout)
    throw new AppError(
      quotaExhausted ? "QUOTA_EXCEEDED" : "RATE_LIMITED",
      "OpenAI declined the request (429)"
    )
  }

  if (!response.ok) {
    clearTimeout(timeout)
    throw new AppError("UNKNOWN", `OpenAI request failed (${response.status})`)
  }

  let fullText = ""

  try {
    for await (const data of readSseData(response)) {
      if (data === "[DONE]") break

      let json: unknown
      try {
        json = JSON.parse(data)
      } catch {
        continue
      }

      const deltaText = (
        json as { choices?: Array<{ delta?: { content?: string } }> }
      )?.choices?.[0]?.delta?.content

      if (deltaText) {
        fullText += deltaText
        onDelta?.(deltaText)
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("TIMEOUT", "OpenAI request timed out")
    }
    throw new AppError(
      "NETWORK_ERROR",
      "Lost connection to OpenAI mid-response"
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!fullText) {
    throw new AppError("EMPTY_RESPONSE", "OpenAI returned no content")
  }

  return parseDelimitedResponse(fullText)
}
