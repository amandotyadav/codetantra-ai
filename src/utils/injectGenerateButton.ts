const BUTTON_ID = "ct-ai-toolbar-generate-btn"
const REINSERT_DEBOUNCE_MS = 400

const findPrevButton = (): HTMLElement | null => {
  const buttons = Array.from(document.querySelectorAll("button"))
  return buttons.find((b) => b.textContent?.trim() === "Prev") ?? null
}

/**
 * Injects a "Generate Code" button into CodeTantra's own bottom toolbar,
 * immediately before its "Prev" button, so generation can be triggered
 * without opening the floating panel first. Re-inserts itself if
 * CodeTantra re-renders that toolbar (e.g. navigating between questions
 * removes and recreates it) and our button gets removed along with it.
 *
 * Calls `onClick` when clicked. Returns a cleanup function.
 */
export const injectGenerateButton = (onClick: () => void): (() => void) => {
  const ensureInjected = () => {
    const prevButton = findPrevButton()
    if (!prevButton?.parentElement) return

    const existing = document.getElementById(BUTTON_ID)
    // Already correctly placed immediately before Prev - nothing to do.
    if (existing && existing.nextElementSibling === prevButton) return
    existing?.remove()

    const button = document.createElement("button")
    button.id = BUTTON_ID
    button.type = "button"
    button.textContent = "Generate Code"
    // Reuses CodeTantra's own DaisyUI button sizing/shape classes (this
    // button lives in CodeTantra's own DOM, not our shadow root, so their
    // stylesheet applies to it) with our own brand color so it still reads
    // as something the extension added, not a native CodeTantra control.
    button.className = "btn btn-xs rounded gap-0"
    button.style.backgroundColor = "#463aa1"
    button.style.borderColor = "#463aa1"
    button.style.color = "#fff"
    button.addEventListener("click", onClick)

    prevButton.parentElement.insertBefore(button, prevButton)
  }

  ensureInjected()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(ensureInjected, REINSERT_DEBOUNCE_MS)
  })

  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    observer.disconnect()
    document.getElementById(BUTTON_ID)?.remove()
  }
}
