import { describe, expect, it } from "vitest"

import { cleanQuestion } from "~utils/cleanText"

describe("cleanQuestion", () => {
  it("collapses repeated newlines and whitespace to a single space", () => {
    expect(cleanQuestion("line one\n\n\nline two")).toBe("line one line two")
  })

  it("collapses repeated whitespace to a single space", () => {
    expect(cleanQuestion("a   b\t\tc")).toBe("a b c")
  })

  it("trims leading and trailing whitespace", () => {
    expect(cleanQuestion("  hello world  ")).toBe("hello world")
  })
})
