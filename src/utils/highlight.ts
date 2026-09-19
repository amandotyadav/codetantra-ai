import hljs from "highlight.js/lib/core"
import c from "highlight.js/lib/languages/c"
import cpp from "highlight.js/lib/languages/cpp"
import java from "highlight.js/lib/languages/java"
import javascript from "highlight.js/lib/languages/javascript"
import python from "highlight.js/lib/languages/python"
import typescript from "highlight.js/lib/languages/typescript"

import { HLJS_LANGUAGE_IDS } from "~utils/languages"

/**
 * Only the languages CodeTantra exercises commonly use are registered, to
 * keep the bundle small rather than pulling in highlight.js's full
 * language set.
 */
hljs.registerLanguage("c", c)
hljs.registerLanguage("cpp", cpp)
hljs.registerLanguage("java", java)
hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("typescript", typescript)

const escapeHtml = (code: string): string => {
  const div = document.createElement("div")
  div.textContent = code
  return div.innerHTML
}

/**
 * Returns highlighted HTML (safe to inject: highlight.js escapes the input
 * before wrapping it in <span> tokens) or the plain, HTML-escaped code if
 * highlighting fails for any reason.
 *
 * When `language` is a known id (from ~utils/extract.ts reading CodeTantra's
 * own language selector) it's used directly for accurate highlighting;
 * otherwise falls back to auto-detection across the registered languages.
 */
export const highlightCode = (
  code: string,
  language?: string | null
): string => {
  try {
    if (language && HLJS_LANGUAGE_IDS.includes(language)) {
      return hljs.highlight(code, { language }).value
    }
    return hljs.highlightAuto(code, HLJS_LANGUAGE_IDS).value
  } catch {
    return escapeHtml(code)
  }
}
