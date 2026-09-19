import { cleanQuestion } from "~utils/cleanText"
import { LANGUAGE_ALIASES } from "~utils/languages"

export const getQuestion = async (): Promise<string | null> => {
  // Immediately check if the element is available or not
  const el = document.querySelector(".ql-editor")

  if (el?.textContent?.trim()) {
    return cleanQuestion(el.textContent)
  }

  // wait if the element is not found
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector(".ql-editor")

      if (el?.textContent?.trim()) {
        observer.disconnect()
        resolve(cleanQuestion(el.textContent))
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, 5000)
  })
}

export const getSampleTestCases = (): string => {
  const container = document.querySelector(".collapse-content")

  if (!container) return ""

  const testCases: string[] = []

  // Each test case block
  const blocks = container.querySelectorAll(":scope > div > div")

  blocks.forEach((block, index) => {
    // 🏷️ Get title (Test case 1, 2, ...)
    const titleEl = block.querySelector(".font-semibold")
    const title = titleEl?.textContent?.trim() || `Test Case ${index + 1}`

    // 📥 Get all rows inside this test case
    const rows = block.querySelectorAll("tbody tr")

    const lines: string[] = []

    rows.forEach((row) => {
      const firstTd = row.querySelector("td")
      if (!firstTd) return

      const codes = firstTd.querySelectorAll("code")

      let line = ""

      codes.forEach((code) => {
        const text = code.textContent
          ?.replace(/\u00A0/g, " ")
          .replace(/·/g, " ")
          .trim()

        if (text) {
          line += text + " "
        }
      })

      if (line.trim()) {
        lines.push(line.trim())
      }
    })

    if (lines.length) {
      testCases.push(`${title}:\n${lines.join("\n")}`)
    }
  })

  return testCases.join("\n\n")
}

// Helper function for getting the code from editor
export const getEditorCode = (): string => {
  const editor = document.querySelector(".cm-content")
  if (!editor) return ""

  return (editor as HTMLElement).innerText
}

const findFilesHeader = (): HTMLElement | null => {
  const headers = Array.from(document.querySelectorAll("h2"))
  return headers.find((h) => h.textContent?.includes("Files")) ?? null
}

export const getAllFilesCode = async () => {
  const files: Record<string, string> = {}

  // The Explorer button *toggles* the sidebar, so only click it if the
  // Files section isn't already visible - clicking it unconditionally
  // closes an already-open sidebar instead of opening it, which is what
  // made a second Generate/Debug/Regenerate in the same session silently
  // extract no files at all.
  let filesHeader = findFilesHeader()

  if (!filesHeader) {
    const sidebarButton = document.querySelector(
      "button[title='Explorer']"
    ) as HTMLElement | null

    if (!sidebarButton) {
      return files
    }

    sidebarButton.click()
    await new Promise((res) => setTimeout(res, 500))
    filesHeader = findFilesHeader()
  }

  if (!filesHeader) {
    return files
  }

  const container = filesHeader.parentElement
  if (!container) return files

  const sidebarFiles = Array.from(
    container.querySelectorAll("ul li button")
  ) as HTMLElement[]

  // sequential clicks
  for (const btn of sidebarFiles) {
    btn.click()
    await new Promise((res) => setTimeout(res, 500))
  }

  // Get tabs
  const tabs = Array.from(
    document.querySelectorAll("ul li div[title]")
  ) as HTMLElement[]

  // Extract code from each tab
  for (const tab of tabs) {
    const fileName = tab.getAttribute("title")

    if (!fileName) continue

    const button = tab.querySelector("button") as HTMLElement
    button?.click()

    await new Promise((res) => setTimeout(res, 800))

    const code = getEditorCode()

    files[fileName] = code
  }

  return files
}

/**
 * CodeTantra shows the selected language in a small dropdown/label above
 * the editor (e.g. "Java", "C"). There's no stable class name for it, so
 * this looks for a leaf DOM element whose entire text is exactly one of
 * the languages we support - accurate when it matches, and harmless (the
 * caller falls back to auto-detection) when CodeTantra's markup changes
 * and nothing matches.
 */
export const getEditorLanguage = (): string | null => {
  const elements = document.querySelectorAll<HTMLElement>("button, div, span")

  for (const el of elements) {
    // Skip containers with more than one child element - we only want
    // small "just the language name (+ maybe an icon)" labels, not large
    // blocks of unrelated content that happen to contain a language word.
    if (el.children.length > 1) continue

    const text = el.textContent
      ?.trim()
      .toLowerCase()
      .replace(/[▾▼⌄]/g, "")
      .trim()

    if (text && LANGUAGE_ALIASES[text]) {
      return LANGUAGE_ALIASES[text]
    }
  }

  return null
}

/**
 * Best-effort extraction of compiler errors / failed test-case output
 * currently visible on the page (e.g. after a Run or Submit). CodeTantra
 * has no documented selector for this, so this looks for elements styled
 * as errors (Tailwind/DaisyUI's "text-error"/"text-red-*" conventions, or
 * role="alert") with substantial text - harmless (returns null, and the
 * caller shows a clear "nothing found" message) if none match.
 */
export const getErrorOutput = (): string | null => {
  const selectors = [
    "[class*='text-error']",
    "[class*='text-red']",
    "[role='alert']"
  ]
  const seen = new Set<string>()
  const lines: string[] = []
  let totalLength = 0
  const MAX_LENGTH = 4000

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((el) => {
      const text = el.textContent?.trim()

      if (
        !text ||
        text.length < 4 ||
        seen.has(text) ||
        totalLength >= MAX_LENGTH
      ) {
        return
      }

      seen.add(text)
      lines.push(text)
      totalLength += text.length
    })
  }

  return lines.length ? lines.join("\n").slice(0, MAX_LENGTH) : null
}

export const getCourseName = (): string | null => {
  const el = document.querySelector("[aria-current='page']")

  if (el?.textContent?.trim()) {
    return el.textContent.trim()
  }

  return null
}
