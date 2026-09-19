import { Check, Clock, Copy, Database, Lightbulb, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"

import type { SolutionResult } from "~services/prompt"
import { highlightCode } from "~utils/highlight"

interface CodetantraResultProps {
  result: SolutionResult
  language?: string | null
  streaming?: boolean
}

const CodetantraResult = ({
  result,
  language,
  streaming = false
}: CodetantraResultProps) => {
  const [copied, setCopied] = useState(false)

  const highlightedCode = useMemo(
    () => highlightCode(result.code, language),
    [result.code, language]
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can be denied by the browser; the code is still
      // visible for the user to select and copy manually.
    }
  }

  return (
    <div className="plasmo-w-full plasmo-flex plasmo-flex-col plasmo-gap-3 plasmo-text-left">
      <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
        <span className="plasmo-flex plasmo-items-center plasmo-gap-1.5 plasmo-text-xs plasmo-font-semibold plasmo-text-gray-500 plasmo-uppercase plasmo-tracking-wide dark:plasmo-text-gray-400">
          {streaming && (
            <Loader2
              size={12}
              className="plasmo-animate-spin plasmo-text-[#463aa1] dark:plasmo-text-indigo-300"
            />
          )}
          {streaming ? "Generating..." : "Suggested code"}
        </span>
        {!streaming && (
          <button
            type="button"
            onClick={handleCopy}
            className="plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-xs plasmo-text-[#463aa1] hover:plasmo-underline dark:plasmo-text-indigo-300">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      <pre className="plasmo-w-full plasmo-rounded-md plasmo-overflow-x-auto plasmo-text-xs plasmo-font-mono plasmo-leading-relaxed">
        <code
          className="hljs plasmo-block plasmo-rounded-md"
          // highlight.js escapes the source before tokenizing, so this is
          // safe to inject - see ~utils/highlight.ts
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>

      {!streaming && result.questionExplanation && (
        <div className="plasmo-rounded-md plasmo-bg-indigo-50 plasmo-border plasmo-border-indigo-100 plasmo-p-3 dark:plasmo-bg-indigo-950 dark:plasmo-border-indigo-900">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-1.5 plasmo-text-xs plasmo-font-semibold plasmo-text-indigo-700 plasmo-uppercase plasmo-tracking-wide dark:plasmo-text-indigo-300">
            <Lightbulb size={12} />
            Explanation
          </div>
          <p className="plasmo-text-xs plasmo-text-gray-700 plasmo-mt-1.5 plasmo-leading-relaxed plasmo-whitespace-pre-wrap dark:plasmo-text-gray-300">
            {result.questionExplanation}
          </p>
        </div>
      )}

      {!streaming && (result.timeComplexity || result.spaceComplexity) && (
        <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-2">
          {result.timeComplexity && (
            <div className="plasmo-rounded-md plasmo-bg-gray-50 plasmo-border plasmo-border-gray-200 plasmo-p-2 plasmo-max-h-20 plasmo-overflow-y-auto dark:plasmo-bg-gray-800 dark:plasmo-border-gray-700">
              <div className="plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-semibold plasmo-text-gray-500 plasmo-uppercase plasmo-tracking-wide dark:plasmo-text-gray-400">
                <Clock size={11} />
                Time
              </div>
              <code className="plasmo-block plasmo-font-mono plasmo-text-xs plasmo-text-gray-800 plasmo-mt-0.5 plasmo-break-words dark:plasmo-text-gray-200">
                {result.timeComplexity}
              </code>
            </div>
          )}
          {result.spaceComplexity && (
            <div className="plasmo-rounded-md plasmo-bg-gray-50 plasmo-border plasmo-border-gray-200 plasmo-p-2 plasmo-max-h-20 plasmo-overflow-y-auto dark:plasmo-bg-gray-800 dark:plasmo-border-gray-700">
              <div className="plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-semibold plasmo-text-gray-500 plasmo-uppercase plasmo-tracking-wide dark:plasmo-text-gray-400">
                <Database size={11} />
                Space
              </div>
              <code className="plasmo-block plasmo-font-mono plasmo-text-xs plasmo-text-gray-800 plasmo-mt-0.5 plasmo-break-words dark:plasmo-text-gray-200">
                {result.spaceComplexity}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CodetantraResult
