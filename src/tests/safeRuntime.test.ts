import { afterEach, describe, expect, it, vi } from "vitest"

import { isExtensionContextValid, safeSendMessage } from "~utils/safeRuntime"

const originalChrome = (globalThis as { chrome?: unknown }).chrome

afterEach(() => {
  ;(globalThis as { chrome?: unknown }).chrome = originalChrome
})

describe("isExtensionContextValid", () => {
  it("returns true when chrome.runtime.id is present", () => {
    ;(globalThis as any).chrome = { runtime: { id: "abc123" } }
    expect(isExtensionContextValid()).toBe(true)
  })

  it("returns false when chrome.runtime is undefined (context invalidated)", () => {
    ;(globalThis as any).chrome = { runtime: undefined }
    expect(isExtensionContextValid()).toBe(false)
  })

  it("returns false when chrome itself throws on access", () => {
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      get() {
        throw new Error("boom")
      }
    })
    expect(isExtensionContextValid()).toBe(false)
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: originalChrome,
      writable: true
    })
  })
})

describe("safeSendMessage", () => {
  it("calls chrome.runtime.sendMessage when available", () => {
    const sendMessage = vi.fn()
    ;(globalThis as any).chrome = { runtime: { sendMessage } }
    safeSendMessage({ type: "PING" })
    expect(sendMessage).toHaveBeenCalledWith({ type: "PING" })
  })

  it("does not throw when chrome.runtime is undefined", () => {
    ;(globalThis as any).chrome = { runtime: undefined }
    expect(() => safeSendMessage({ type: "PING" })).not.toThrow()
  })

  it("does not throw when sendMessage itself throws", () => {
    ;(globalThis as any).chrome = {
      runtime: {
        sendMessage: () => {
          throw new Error("Extension context invalidated.")
        }
      }
    }
    expect(() => safeSendMessage({ type: "PING" })).not.toThrow()
  })
})
