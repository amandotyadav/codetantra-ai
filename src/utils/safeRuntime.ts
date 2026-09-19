/**
 * chrome.runtime can become entirely undefined (not just missing an id) if
 * the extension is reloaded/updated while this content script's page stays
 * open - the whole extension context is torn down but the page keeps
 * running the old script. Calling chrome.runtime.sendMessage in that state
 * throws an uncaught TypeError. These wrappers fail silently instead: there
 * is nothing meaningful to do except tell the user to refresh the page,
 * and a crash here shouldn't break the rest of the page.
 */

export const isExtensionContextValid = (): boolean => {
  try {
    return Boolean(chrome.runtime?.id)
  } catch {
    return false
  }
}

export const safeSendMessage = (message: unknown): void => {
  try {
    chrome.runtime?.sendMessage(message)
  } catch {
    // Extension context invalidated; ignore.
  }
}
