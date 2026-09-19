import { describe, expect, it } from "vitest"

import { AppError } from "~services/errors"
import {
  buildPrompt,
  extractLiveCode,
  extractSection,
  MARKERS,
  parseDelimitedResponse
} from "~services/prompt"

const fullResponse = [
  MARKERS.CODE,
  "print('hi')",
  MARKERS.EXPLANATION,
  "Prints a greeting.",
  MARKERS.TIME,
  "O(1)",
  MARKERS.SPACE,
  "O(1)",
  MARKERS.END
].join("\n")

describe("parseDelimitedResponse", () => {
  it("parses a complete, well-formed response", () => {
    const result = parseDelimitedResponse(fullResponse)

    expect(result.code).toBe("print('hi')")
    expect(result.questionExplanation).toBe("Prints a greeting.")
    expect(result.timeComplexity).toBe("O(1)")
    expect(result.spaceComplexity).toBe("O(1)")
  })

  it("fills in missing trailing sections with empty strings", () => {
    const result = parseDelimitedResponse(`${MARKERS.CODE}\nx = 1`)
    expect(result.code).toBe("x = 1")
    expect(result.questionExplanation).toBe("")
    expect(result.timeComplexity).toBe("")
    expect(result.spaceComplexity).toBe("")
  })

  it("throws a PARSE_ERROR AppError when the code marker is missing", () => {
    expect(() => parseDelimitedResponse("no markers here")).toThrowError(
      AppError
    )
  })
})

describe("extractSection", () => {
  it("returns null when the start marker isn't present", () => {
    expect(extractSection("hello", "@@X@@", "@@Y@@")).toBeNull()
  })

  it("returns everything after the start marker when the end marker hasn't arrived yet", () => {
    expect(extractSection("@@X@@partial code", "@@X@@", "@@Y@@")).toBe(
      "partial code"
    )
  })

  it("returns only the text between the two markers once both are present", () => {
    expect(extractSection("@@X@@full code@@Y@@rest", "@@X@@", "@@Y@@")).toBe(
      "full code"
    )
  })
})

describe("buildPrompt", () => {
  const baseInput = {
    question: "Reverse a string",
    allFilesCode: { "main.py": "def reverse(s): pass" }
  }

  it("omits the error/debug section when no errorOutput is given", () => {
    const prompt = buildPrompt(baseInput)
    expect(prompt).not.toContain("failed test output")
    expect(prompt).not.toContain("Diagnose and fix")
  })

  it("includes the error output and debug instruction when errorOutput is given", () => {
    const prompt = buildPrompt({
      ...baseInput,
      errorOutput: "IndexError: string index out of range"
    })

    expect(prompt).toContain("failed test output")
    expect(prompt).toContain("IndexError: string index out of range")
    expect(prompt).toContain("Diagnose and fix")
  })

  it("omits the required-language directive when no language is given", () => {
    const prompt = buildPrompt(baseInput)
    expect(prompt).not.toContain("Required programming language")
  })

  it("states the required language explicitly when one is given", () => {
    const prompt = buildPrompt({ ...baseInput, language: "java" })
    expect(prompt).toContain("Required programming language: Java")
    expect(prompt).toContain("Write the solution in Java")
  })

  it("ignores an unrecognized language id rather than printing it raw", () => {
    const prompt = buildPrompt({ ...baseInput, language: "not-a-real-lang" })
    expect(prompt).not.toContain("Required programming language")
  })
})

describe("extractLiveCode", () => {
  it("shows the code accumulated so far while still streaming", () => {
    const buffer = `${MARKERS.CODE}\nfunction foo() {`
    expect(extractLiveCode(buffer)).toBe("function foo() {")
  })

  it("returns an empty string before the code marker has arrived", () => {
    expect(extractLiveCode("some prefix text")).toBe("")
  })
})
