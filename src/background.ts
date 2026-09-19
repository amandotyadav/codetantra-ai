import { AppError } from "~services/errors"
import { generateSolution } from "~services/llm"
import {
  GENERATE_SOLUTION_PORT,
  isOpenHelpPageMessage,
  isOpenOptionsPageMessage,
  isStartGenerateMessage,
  type GenerateSolutionStreamMessage
} from "~services/messages"

/**
 * Sends the toggle message to a tab, ignoring the expected error when no
 * content script is listening there (e.g. chrome:// pages, other sites).
 */
const toggleOnTab = (tabId: number) => {
  chrome.tabs.sendMessage(tabId, { type: "TOGGLE_CODETANTRA_AI" }, () => {
    // Reading chrome.runtime.lastError prevents Chrome from logging an
    // "Unchecked runtime.lastError" warning when there's no listener.
    void chrome.runtime.lastError
  })
}

/**
 * Handle the user click on extension icon to toggle ui
 */
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return
  toggleOnTab(tab.id)
})

/**
 * Handle the keyboard shortcut to toggle ui
 */
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-codetantra-ai" && tab?.id) {
    toggleOnTab(tab.id)
  }
})

chrome.runtime.onMessage.addListener((message) => {
  if (isOpenOptionsPageMessage(message)) {
    chrome.runtime.openOptionsPage()
    return
  }

  if (isOpenHelpPageMessage(message)) {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/help.html") })
  }
})

/**
 * The actual LLM API call runs here (in the service worker) rather than in
 * the content script, so it isn't subject to the host page's Content
 * Security Policy and the API key never has to touch page-adjacent code.
 * It streams over a long-lived port so the content script can show code
 * appearing as it's generated instead of waiting for the whole response.
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== GENERATE_SOLUTION_PORT) return

  port.onMessage.addListener((message) => {
    if (!isStartGenerateMessage(message)) return

    const post = (msg: GenerateSolutionStreamMessage) => {
      try {
        port.postMessage(msg)
      } catch {
        // The content script's tab/frame may have gone away mid-stream.
      }
    }

    generateSolution(message.payload, (delta) => post({ type: "CHUNK", delta }))
      .then((result) => post({ type: "DONE", result }))
      .catch((error) => {
        post(
          error instanceof AppError
            ? { type: "ERROR", code: error.code, message: error.message }
            : { type: "ERROR", code: "UNKNOWN", message: "Unexpected error" }
        )
      })
  })
})
