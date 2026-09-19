import { describe, expect, it } from "vitest"

import { AppError, getFriendlyMessage } from "~services/errors"

describe("getFriendlyMessage", () => {
  it("returns a specific, non-technical message for known error codes", () => {
    const message = getFriendlyMessage(
      new AppError("NO_API_KEY", "internal detail")
    )
    expect(message).not.toContain("internal detail")
    expect(message.toLowerCase()).toContain("api key")
  })

  it("falls back to a generic message for unknown errors", () => {
    expect(getFriendlyMessage(new Error("boom"))).toBe(
      "Something went wrong. Please try again."
    )
    expect(getFriendlyMessage("not an error")).toBe(
      "Something went wrong. Please try again."
    )
  })
})
