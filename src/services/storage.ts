/**
 * Thin wrapper around chrome.storage.local for the extension's own settings.
 *
 * API keys are kept in chrome.storage.local (not .sync) so they never leave
 * the user's machine through Chrome's sync infrastructure - each is only
 * ever read locally and sent directly to that provider's own API.
 */

export type Provider = "gemini" | "openai"

const PROVIDER_STORAGE_KEY = "ct_ai_provider"
const API_KEY_STORAGE_KEYS: Record<Provider, string> = {
  gemini: "ct_ai_gemini_api_key",
  openai: "ct_ai_openai_api_key"
}

export const getProvider = async (): Promise<Provider> => {
  try {
    const result = await chrome.storage.local.get(PROVIDER_STORAGE_KEY)
    const value = result[PROVIDER_STORAGE_KEY]
    return value === "openai" ? "openai" : "gemini"
  } catch {
    return "gemini"
  }
}

export const setProvider = async (provider: Provider): Promise<void> => {
  await chrome.storage.local.set({ [PROVIDER_STORAGE_KEY]: provider })
}

export const getApiKey = async (provider: Provider): Promise<string | null> => {
  try {
    const storageKey = API_KEY_STORAGE_KEYS[provider]
    const result = await chrome.storage.local.get(storageKey)
    const value = result[storageKey]
    return typeof value === "string" && value.trim() ? value.trim() : null
  } catch {
    // chrome.storage can throw if the extension context was invalidated
    // (e.g. the extension was reloaded/updated while the page stayed open).
    return null
  }
}

export const setApiKey = async (
  provider: Provider,
  apiKey: string
): Promise<void> => {
  await chrome.storage.local.set({
    [API_KEY_STORAGE_KEYS[provider]]: apiKey.trim()
  })
}

export const clearApiKey = async (provider: Provider): Promise<void> => {
  await chrome.storage.local.remove(API_KEY_STORAGE_KEYS[provider])
}

/**
 * The API key for whichever provider is currently active, or null if that
 * provider has no key configured.
 */
export const getActiveApiKey = async (): Promise<string | null> => {
  const provider = await getProvider()
  return getApiKey(provider)
}
