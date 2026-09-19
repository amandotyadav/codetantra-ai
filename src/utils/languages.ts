/**
 * Languages CodeTantra exercises commonly use, and the highlight.js
 * language id each maps to. Shared between the editor-language detector
 * (~utils/extract.ts) and the syntax highlighter (~utils/highlight.ts) so
 * the two stay in sync.
 */
export const LANGUAGE_ALIASES: Record<string, string> = {
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  java: "java",
  python: "python",
  python3: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript"
}

export const HLJS_LANGUAGE_IDS = Array.from(
  new Set(Object.values(LANGUAGE_ALIASES))
)

/**
 * Human-readable name for each highlight.js language id, for telling the
 * LLM which language to write in (see ~services/prompt.ts).
 */
export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  c: "C",
  cpp: "C++",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript"
}
