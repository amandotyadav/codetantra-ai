import { AppError } from "~services/errors"
import { LANGUAGE_DISPLAY_NAMES } from "~utils/languages"

export interface SolutionResult {
  code: string
  questionExplanation: string
  timeComplexity: string
  spaceComplexity: string
}

export interface GenerateSolutionInput {
  question: string
  testCases?: string
  courseName?: string | null
  allFilesCode: Record<string, string>
  /**
   * Compiler error or failed test-case output currently shown on the page
   * (see ~utils/extract.ts getErrorOutput). When present, the model is
   * asked to fix that specific problem in the existing code rather than
   * write a fresh solution from scratch.
   */
  errorOutput?: string | null
  /**
   * highlight.js language id read from CodeTantra's own language selector
   * (see ~utils/extract.ts getEditorLanguage). When present, this is
   * stated explicitly so the model can't default to the wrong language
   * (e.g. writing C++ for a Java exercise) if the provided file content
   * happens to be ambiguous or missing.
   */
  language?: string | null
}

/**
 * The response is plain text with these literal section markers, rather
 * than JSON. JSON can't be usefully streamed field-by-field (the "code"
 * field's content is escaped and interleaved with the rest of the object,
 * so there's nothing clean to show while it's still arriving); plain text
 * with markers can be sliced out of the buffer incrementally as chunks
 * stream in, so the code can be shown live as it's generated.
 */
export const MARKERS = {
  CODE: "@@CT_AI_CODE@@",
  EXPLANATION: "@@CT_AI_EXPLANATION@@",
  TIME: "@@CT_AI_TIME_COMPLEXITY@@",
  SPACE: "@@CT_AI_SPACE_COMPLEXITY@@",
  END: "@@CT_AI_END@@"
}

export const buildPrompt = ({
  question,
  testCases,
  courseName,
  allFilesCode,
  errorOutput,
  language
}: GenerateSolutionInput): string => {
  const filesSection = Object.entries(allFilesCode)
    .map(([file, code]) => `FILE: ${file}\n----------------\n${code}`)
    .join("\n\n")

  const languageName = language ? LANGUAGE_DISPLAY_NAMES[language] : null

  return `
You are an expert programmer helping a student solve a coding exercise.

Course:
${courseName ?? "Unknown"}
${languageName ? `\nRequired programming language: ${languageName}. Write the solution in ${languageName} ONLY, regardless of what language any other part of this prompt might suggest.\n` : ""}
Problem:
${question}

${testCases ? `Sample Test Cases:\n${testCases}` : ""}

Files Provided:
${filesSection || "(no files detected)"}

${
  errorOutput
    ? `The student ran or submitted this code and got the following error /
failed test output:
${errorOutput}
`
    : ""
}

Instructions:

1. Carefully understand the problem and the given files.${languageName ? ` Write the solution in ${languageName} - this is required, not a suggestion, even if the files provided look ambiguous or empty.` : ""}
2. Identify which file contains incomplete or missing logic (often marked
   with comments like "write your code here" or TODO).
3. ONLY modify that file.
4. Do not modify driver code or other files.
5. Ensure the solution works with the provided test cases.
6. Keep the solution simple, correct, and easy for a student to follow.
7. Add "\\n" in printf calls where required (especially in C).
8. For Python, use consistent indentation.
9. Do NOT add any comments in the code - no "//", "#", "/* */", docstrings,
   or inline remarks. Return only plain, uncommented code. Put any
   explanation of the approach in the explanation section instead.
10. Format the code exactly as it would appear in a real source file:
    every statement and import on its own line, with normal indentation.
    Never collapse multiple statements onto one line. No markdown code
    fences (no \`\`\`).
11. The time and space complexity sections must contain SHORT Big-O
    notation ONLY (e.g. "O(n)", "O(n log n)", "O(1)") - a few characters,
    no sentences, no reasoning, no words like "average-case" or "where n
    is". Put any reasoning behind the complexity in the explanation
    section instead, if relevant.
${
  errorOutput
    ? `12. An error/failed test output was provided above. Diagnose and fix
    THAT SPECIFIC problem using the student's existing code as your
    starting point. Do not rewrite unrelated working parts of the file,
    and explain what was wrong and how you fixed it in the explanation
    section.`
    : ""
}

Respond with ONLY plain text in EXACTLY this structure - these five
markers, each on their own line, in this exact order, each appearing
exactly once, with nothing before the first marker or after the last one:

${MARKERS.CODE}
<complete updated code of ONLY the file that needed changes>
${MARKERS.EXPLANATION}
<simple, clear explanation of the approach>
${MARKERS.TIME}
<short Big-O notation only>
${MARKERS.SPACE}
<short Big-O notation only>
${MARKERS.END}
`.trim()
}

/**
 * Extracts the text between `startMarker` and `endMarker` in `buffer`. If
 * `endMarker` hasn't arrived yet, returns everything after `startMarker` -
 * this is what makes it safe to call on a partial, still-streaming buffer
 * to get a live preview of a section before it's finished.
 */
export const extractSection = (
  buffer: string,
  startMarker: string,
  endMarker: string | null
): string | null => {
  const startIndex = buffer.indexOf(startMarker)
  if (startIndex === -1) return null

  const contentStart = startIndex + startMarker.length
  const endIndex = endMarker ? buffer.indexOf(endMarker, contentStart) : -1

  return endIndex === -1
    ? buffer.slice(contentStart)
    : buffer.slice(contentStart, endIndex)
}

/**
 * A live, in-progress preview of the code section only - used to show code
 * appearing as it streams in, before the response is complete.
 */
export const extractLiveCode = (buffer: string): string =>
  (extractSection(buffer, MARKERS.CODE, MARKERS.EXPLANATION) ?? "").trim()

export const parseDelimitedResponse = (text: string): SolutionResult => {
  const code = extractSection(text, MARKERS.CODE, MARKERS.EXPLANATION)

  if (code === null) {
    throw new AppError(
      "PARSE_ERROR",
      "LLM response missing the expected code section"
    )
  }

  const explanation = extractSection(text, MARKERS.EXPLANATION, MARKERS.TIME)
  const time = extractSection(text, MARKERS.TIME, MARKERS.SPACE)
  const space = extractSection(text, MARKERS.SPACE, MARKERS.END)

  return {
    code: code.trim(),
    questionExplanation: (explanation ?? "").trim(),
    timeComplexity: (time ?? "").trim(),
    spaceComplexity: (space ?? "").trim()
  }
}
