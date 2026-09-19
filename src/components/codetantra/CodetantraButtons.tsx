import { Bug } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { AppError, getFriendlyMessage } from "~services/errors"
import {
  GENERATE_SOLUTION_PORT,
  type GenerateSolutionStreamMessage
} from "~services/messages"
import {
  extractLiveCode,
  type GenerateSolutionInput,
  type SolutionResult
} from "~services/prompt"
import { getActiveApiKey } from "~services/storage"
import {
  getAllFilesCode,
  getCourseName,
  getEditorLanguage,
  getErrorOutput,
  getQuestion,
  getSampleTestCases
} from "~utils/extract"
import { isExtensionContextValid, safeSendMessage } from "~utils/safeRuntime"

import CodetantraButton from "./CodetantraButton"
import CodetantraEmptyState from "./CodetantraEmptyState"
import CodetantraResult from "./CodetantraResult"

type ViewState =
  | { status: "idle" }
  | { status: "streaming"; liveCode: string }
  | { status: "success"; result: SolutionResult }
  | { status: "error"; message: string; showsOpenSettings: boolean }

interface CodetantraButtonsProps {
  /** Set when the injected toolbar button was clicked - start generating
   * immediately once mounted, then notify the parent it's been handled. */
  autoGenerate?: boolean
  onAutoGenerateHandled?: () => void
}

const CodetantraButtons = ({
  autoGenerate = false,
  onAutoGenerateHandled
}: CodetantraButtonsProps) => {
  const [state, setState] = useState<ViewState>({ status: "idle" })
  const [language, setLanguage] = useState<string | null>(null)

  // The last successfully extracted request, kept so "Regenerate" can ask
  // for another attempt without re-scraping the page.
  const lastPayloadRef = useRef<GenerateSolutionInput | null>(null)
  const bufferRef = useRef("")

  const runGeneration = (payload: GenerateSolutionInput) => {
    lastPayloadRef.current = payload
    bufferRef.current = ""
    setState({ status: "streaming", liveCode: "" })

    if (!isExtensionContextValid()) {
      const error = new AppError(
        "CONTEXT_INVALIDATED",
        "Extension context invalidated"
      )
      setState({
        status: "error",
        message: getFriendlyMessage(error),
        showsOpenSettings: false
      })
      return
    }

    let port: chrome.runtime.Port

    try {
      port = chrome.runtime.connect({ name: GENERATE_SOLUTION_PORT })
    } catch {
      const error = new AppError(
        "CONTEXT_INVALIDATED",
        "Extension context invalidated"
      )
      setState({
        status: "error",
        message: getFriendlyMessage(error),
        showsOpenSettings: false
      })
      return
    }

    port.onMessage.addListener((message: GenerateSolutionStreamMessage) => {
      if (message.type === "CHUNK") {
        bufferRef.current += message.delta
        setState({
          status: "streaming",
          liveCode: extractLiveCode(bufferRef.current)
        })
        return
      }

      if (message.type === "DONE") {
        setState({ status: "success", result: message.result })
        port.disconnect()
        return
      }

      if (message.type === "ERROR") {
        const error = new AppError(message.code, message.message)
        setState({
          status: "error",
          message: getFriendlyMessage(error),
          showsOpenSettings:
            error.code === "NO_API_KEY" ||
            error.code === "INVALID_API_KEY" ||
            error.code === "QUOTA_EXCEEDED"
        })
        port.disconnect()
      }
    })

    port.postMessage({ type: "START", payload })
  }

  const extractCommonFields = async () => {
    const question = await getQuestion()
    if (!question) {
      throw new AppError("NO_QUESTION_FOUND", "No question found on page")
    }

    const testCases = getSampleTestCases()
    const courseName = getCourseName()
    const allFilesCode = await getAllFilesCode()
    const language = getEditorLanguage()
    setLanguage(language)

    return { question, testCases, courseName, allFilesCode, language }
  }

  const withApiKeyCheck = async (run: () => Promise<void>) => {
    setState({ status: "streaming", liveCode: "" })

    try {
      if (!isExtensionContextValid()) {
        throw new AppError(
          "CONTEXT_INVALIDATED",
          "Extension context invalidated"
        )
      }

      const apiKey = await getActiveApiKey()
      if (!apiKey) {
        throw new AppError("NO_API_KEY", "No API key configured")
      }

      await run()
    } catch (error) {
      const message = getFriendlyMessage(error)
      const showsOpenSettings =
        error instanceof AppError &&
        (error.code === "NO_API_KEY" ||
          error.code === "INVALID_API_KEY" ||
          error.code === "QUOTA_EXCEEDED")

      setState({ status: "error", message, showsOpenSettings })
    }
  }

  const handleGenerate = () =>
    withApiKeyCheck(async () => {
      const fields = await extractCommonFields()
      runGeneration(fields)
    })

  const handleDebugError = () =>
    withApiKeyCheck(async () => {
      const errorOutput = getErrorOutput()
      if (!errorOutput) {
        throw new AppError("NO_ERROR_FOUND", "No error output found on page")
      }

      const fields = await extractCommonFields()
      runGeneration({ ...fields, errorOutput })
    })

  const handleRegenerate = () => {
    if (!lastPayloadRef.current) return
    runGeneration(lastPayloadRef.current)
  }

  const handleOpenOptions = () => {
    safeSendMessage({ type: "OPEN_OPTIONS_PAGE" })
  }

  // Triggered by the "Generate Code" button injected into CodeTantra's own
  // toolbar (see ~utils/injectGenerateButton), which opens the panel and
  // sets autoGenerate rather than calling handleGenerate directly - this
  // component doesn't exist yet at the moment that button is clicked if
  // the panel was closed, so the parent passes the intent down as a prop
  // instead of an event fired before mount.
  useEffect(() => {
    if (!autoGenerate) return
    handleGenerate()
    onAutoGenerateHandled?.()
  }, [autoGenerate])

  const isBusy = state.status === "streaming"
  const canRegenerate = lastPayloadRef.current !== null && !isBusy

  return (
    <div className="plasmo-w-full plasmo-min-h-full plasmo-p-6 plasmo-flex plasmo-flex-col plasmo-space-y-4 plasmo-items-center">
      <div className="plasmo-w-full plasmo-max-w-xs plasmo-mx-auto plasmo-flex plasmo-gap-2">
        <CodetantraButton
          handleOnClick={handleGenerate}
          loading={isBusy}
          disabled={isBusy}>
          {isBusy ? "Generating..." : "Generate Code"}
        </CodetantraButton>

        {canRegenerate && (
          <button
            type="button"
            onClick={handleRegenerate}
            title="Regenerate using the same question and code"
            aria-label="Regenerate"
            className="plasmo-shrink-0 plasmo-rounded-md plasmo-border plasmo-border-gray-300 plasmo-px-3 plasmo-text-sm plasmo-text-gray-600 hover:plasmo-bg-gray-50 focus-visible:plasmo-outline focus-visible:plasmo-outline-2 focus-visible:plasmo-outline-offset-2 focus-visible:plasmo-outline-[#463aa1] dark:plasmo-border-gray-600 dark:plasmo-text-gray-300 dark:hover:plasmo-bg-gray-800">
            ↻
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleDebugError}
        disabled={isBusy}
        className="plasmo-flex plasmo-items-center plasmo-gap-1.5 plasmo-text-xs plasmo-text-gray-500 hover:plasmo-text-[#463aa1] disabled:plasmo-opacity-60 disabled:plasmo-cursor-not-allowed dark:plasmo-text-gray-400 dark:hover:plasmo-text-indigo-300">
        <Bug size={13} />
        Debug from error on page
      </button>

      {state.status === "error" && (
        <div
          role="alert"
          className="plasmo-w-full plasmo-text-xs plasmo-text-red-700 plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-rounded-md plasmo-p-3 dark:plasmo-text-red-300 dark:plasmo-bg-red-950 dark:plasmo-border-red-900">
          <p>{state.message}</p>
          {state.showsOpenSettings && (
            <button
              type="button"
              onClick={handleOpenOptions}
              className="plasmo-mt-2 plasmo-text-[#463aa1] plasmo-font-medium hover:plasmo-underline dark:plasmo-text-indigo-300">
              Open settings
            </button>
          )}
        </div>
      )}

      {state.status === "idle" && <CodetantraEmptyState mode="idle" />}

      {state.status === "streaming" &&
        (state.liveCode ? (
          <CodetantraResult
            result={{
              code: state.liveCode,
              questionExplanation: "",
              timeComplexity: "",
              spaceComplexity: ""
            }}
            language={language}
            streaming
          />
        ) : (
          <CodetantraEmptyState mode="thinking" />
        ))}

      {state.status === "success" && (
        <CodetantraResult result={state.result} language={language} />
      )}
    </div>
  )
}

export default CodetantraButtons
