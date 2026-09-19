/**
 * Best-effort detection of whether CodeTantra is currently in dark mode, so
 * the panel can match it instead of always being light. CodeTantra appears
 * to use DaisyUI (its "collapse-content" class, also used in
 * ~utils/extract.ts, is a DaisyUI convention), which drives theme through a
 * `data-theme` attribute on <html> - but since that's undocumented and
 * could change, this falls back through a few signals and finally to the
 * OS-level preference, so it degrades gracefully rather than breaking.
 */
const DARK_THEME_NAME_PATTERN =
  /dark|night|dracula|black|halloween|forest|luxury|business|coffee|dim|sunset|synthwave/

export const isDarkTheme = (): boolean => {
  const html = document.documentElement
  const dataTheme = html.getAttribute("data-theme")?.toLowerCase()

  if (dataTheme) {
    return DARK_THEME_NAME_PATTERN.test(dataTheme)
  }

  if (
    html.classList.contains("dark") ||
    document.body?.classList.contains("dark")
  ) {
    return true
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
}

/**
 * Calls `onChange` whenever the detected theme might have changed: when
 * CodeTantra's <html> attributes/class change, or the OS-level preference
 * changes (used when neither of those signals is present). Returns a
 * cleanup function.
 */
export const watchTheme = (
  onChange: (isDark: boolean) => void
): (() => void) => {
  const notify = () => onChange(isDarkTheme())

  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"]
  })

  const media = window.matchMedia?.("(prefers-color-scheme: dark)")
  media?.addEventListener("change", notify)

  return () => {
    observer.disconnect()
    media?.removeEventListener("change", notify)
  }
}
