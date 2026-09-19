import { describe, expect, it } from "vitest"

import { isGeminiQuotaExhausted } from "~services/gemini"
import { isOpenAiQuotaExhausted } from "~services/openai"

const mockResponse = (body: unknown): Response =>
  ({
    clone: () => mockResponse(body),
    json: async () => body
  }) as unknown as Response

describe("isOpenAiQuotaExhausted", () => {
  it("returns true when OpenAI reports insufficient_quota", async () => {
    const response = mockResponse({ error: { code: "insufficient_quota" } })
    expect(await isOpenAiQuotaExhausted(response)).toBe(true)
  })

  it("returns false for a transient rate_limit_exceeded error", async () => {
    const response = mockResponse({ error: { code: "rate_limit_exceeded" } })
    expect(await isOpenAiQuotaExhausted(response)).toBe(false)
  })

  it("returns false when the body can't be parsed", async () => {
    const response = {
      clone: () => response,
      json: async () => {
        throw new Error("not json")
      }
    } as unknown as Response
    expect(await isOpenAiQuotaExhausted(response)).toBe(false)
  })
})

describe("isGeminiQuotaExhausted", () => {
  it("returns true when the error message mentions exceeding quota/billing", async () => {
    const response = mockResponse({
      error: {
        message:
          "You exceeded your current quota, please check your plan and billing details."
      }
    })
    expect(await isGeminiQuotaExhausted(response)).toBe(true)
  })

  it("returns true for a per-day quota violation", async () => {
    const response = mockResponse({
      error: {
        message: "Resource exhausted",
        details: [
          {
            violations: [{ quotaId: "GenerateContentRequestsPerDayPerProject" }]
          }
        ]
      }
    })
    expect(await isGeminiQuotaExhausted(response)).toBe(true)
  })

  it("returns false for a generic per-minute rate limit", async () => {
    const response = mockResponse({
      error: {
        message: "Resource exhausted, try again later",
        details: [
          {
            violations: [
              { quotaId: "GenerateContentRequestsPerMinutePerProject" }
            ]
          }
        ]
      }
    })
    expect(await isGeminiQuotaExhausted(response)).toBe(false)
  })
})
