import { CircleHelp } from "lucide-react"
import { useEffect, useState } from "react"

import icon from "~assets/icon.png"
import { testApiKey } from "~services/llm"
import {
  clearApiKey,
  getApiKey,
  getProvider,
  setApiKey,
  setProvider,
  type Provider
} from "~services/storage"

import "~styles/style.css"

type Status =
  | { type: "idle" }
  | { type: "checking" }
  | { type: "saved" }
  | { type: "cleared" }
  | { type: "invalid" }
  | { type: "error"; message: string }

const PROVIDERS: {
  id: Provider
  label: string
  keyHint: string
  getKeyUrl: string
}[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    keyHint: "AIza...",
    getKeyUrl: "https://aistudio.google.com/app/apikey"
  },
  {
    id: "openai",
    label: "OpenAI",
    keyHint: "sk-...",
    getKeyUrl: "https://platform.openai.com/api-keys"
  }
]

const OptionsPage = () => {
  const [provider, setActiveProvider] = useState<Provider>("gemini")
  const [apiKey, setApiKeyInput] = useState("")
  const [hasSavedKey, setHasSavedKey] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [status, setStatus] = useState<Status>({ type: "idle" })

  const providerMeta = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0]

  const loadKeyFor = async (targetProvider: Provider) => {
    const existing = await getApiKey(targetProvider)
    setApiKeyInput(existing ?? "")
    setHasSavedKey(Boolean(existing))
    setStatus({ type: "idle" })
  }

  useEffect(() => {
    getProvider().then((savedProvider) => {
      setActiveProvider(savedProvider)
      loadKeyFor(savedProvider)
    })
  }, [])

  const handleProviderChange = async (nextProvider: Provider) => {
    setActiveProvider(nextProvider)
    await setProvider(nextProvider)
    await loadKeyFor(nextProvider)
  }

  const handleSave = async () => {
    const trimmed = apiKey.trim()

    if (!trimmed) {
      setStatus({ type: "error", message: "Enter an API key first." })
      return
    }

    setStatus({ type: "checking" })

    try {
      const valid = await testApiKey(provider, trimmed)

      if (!valid) {
        setStatus({ type: "invalid" })
        return
      }

      await setApiKey(provider, trimmed)
      setHasSavedKey(true)
      setStatus({ type: "saved" })
    } catch {
      setStatus({
        type: "error",
        message:
          "Couldn't reach the provider to verify the key. Check your connection."
      })
    }
  }

  const handleClear = async () => {
    await clearApiKey(provider)
    setApiKeyInput("")
    setHasSavedKey(false)
    setStatus({ type: "cleared" })
  }

  return (
    <div className="plasmo-min-h-screen plasmo-bg-gray-50 plasmo-flex plasmo-justify-center plasmo-py-12 plasmo-px-4">
      <div className="plasmo-w-full plasmo-max-w-lg plasmo-bg-white plasmo-rounded-lg plasmo-shadow-sm plasmo-border plasmo-border-gray-200 plasmo-p-8">
        <div className="plasmo-flex plasmo-items-start plasmo-justify-between plasmo-gap-3 plasmo-mb-6">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
            <img src={icon} alt="" className="plasmo-size-8" />
            <div>
              <h1 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-900">
                CodeTantra AI Settings
              </h1>
              <p className="plasmo-text-sm plasmo-text-gray-500">
                Connect your own AI provider API key
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              chrome.tabs.create({
                url: chrome.runtime.getURL("tabs/help.html")
              })
            }
            title="Help"
            className="plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-xs plasmo-text-gray-500 hover:plasmo-text-[#463aa1] plasmo-shrink-0">
            <CircleHelp size={14} />
            Need help?
          </button>
        </div>

        <span className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
          AI Provider
        </span>

        <div
          role="tablist"
          aria-label="AI provider"
          className="plasmo-flex plasmo-gap-2 plasmo-mb-5">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={provider === p.id}
              onClick={() => handleProviderChange(p.id)}
              className={`plasmo-flex-1 plasmo-rounded-md plasmo-border plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-transition-colors ${
                provider === p.id
                  ? "plasmo-border-[#463aa1] plasmo-bg-[#463aa1]/10 plasmo-text-[#463aa1]"
                  : "plasmo-border-gray-300 plasmo-text-gray-600 hover:plasmo-bg-gray-50"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        <label
          htmlFor="api-key"
          className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
          {providerMeta.label} API key
        </label>

        <div className="plasmo-flex plasmo-gap-2">
          <input
            id="api-key"
            type={reveal ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={providerMeta.keyHint}
            autoComplete="off"
            spellCheck={false}
            className="plasmo-flex-1 plasmo-rounded-md plasmo-border plasmo-border-gray-300 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-[#463aa1] focus:plasmo-border-transparent"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide API key" : "Show API key"}
            className="plasmo-px-3 plasmo-rounded-md plasmo-border plasmo-border-gray-300 plasmo-text-sm plasmo-text-gray-600 hover:plasmo-bg-gray-50">
            {reveal ? "Hide" : "Show"}
          </button>
        </div>

        <p className="plasmo-text-xs plasmo-text-gray-500 plasmo-mt-2">
          Your key is stored only in this browser (chrome.storage.local) and is
          sent directly to {providerMeta.label}'s API when you use the
          extension. It is never sent to any server operated by this extension.{" "}
          <a
            href={providerMeta.getKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="plasmo-text-[#463aa1] plasmo-underline">
            Get a {providerMeta.label} API key
          </a>
          .
        </p>

        <div className="plasmo-flex plasmo-gap-2 plasmo-mt-5">
          <button
            type="button"
            onClick={handleSave}
            disabled={status.type === "checking"}
            className="plasmo-flex-1 plasmo-rounded-md plasmo-bg-[#463aa1] plasmo-text-white plasmo-text-sm plasmo-font-medium plasmo-px-4 plasmo-py-2.5 hover:plasmo-bg-[#372e80] disabled:plasmo-opacity-60 plasmo-transition-colors">
            {status.type === "checking" ? "Verifying..." : "Save key"}
          </button>

          {hasSavedKey && (
            <button
              type="button"
              onClick={handleClear}
              className="plasmo-rounded-md plasmo-border plasmo-border-gray-300 plasmo-text-sm plasmo-text-gray-700 plasmo-px-4 plasmo-py-2.5 hover:plasmo-bg-gray-50">
              Remove
            </button>
          )}
        </div>

        <div
          role="status"
          aria-live="polite"
          className="plasmo-mt-4 plasmo-text-sm">
          {status.type === "saved" && (
            <p className="plasmo-text-green-600">API key saved.</p>
          )}
          {status.type === "cleared" && (
            <p className="plasmo-text-gray-500">API key removed.</p>
          )}
          {status.type === "invalid" && (
            <p className="plasmo-text-red-600">
              That key was rejected by {providerMeta.label}. Double-check it and
              try again.
            </p>
          )}
          {status.type === "error" && (
            <p className="plasmo-text-red-600">{status.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
