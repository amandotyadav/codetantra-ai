import { Sparkles } from "lucide-react"

interface CodetantraEmptyStateProps {
  mode: "idle" | "thinking"
}

const CodetantraEmptyState = ({ mode }: CodetantraEmptyStateProps) => {
  return (
    <div className="plasmo-flex plasmo-flex-1 plasmo-min-h-0 plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-gap-3 plasmo-text-center plasmo-py-4">
      <div className="ct-float plasmo-flex plasmo-items-center plasmo-justify-center plasmo-size-12 plasmo-rounded-full plasmo-bg-indigo-50 dark:plasmo-bg-indigo-950">
        <Sparkles
          size={22}
          className="plasmo-text-[#463aa1] dark:plasmo-text-indigo-300"
        />
      </div>

      {mode === "idle" ? (
        <div>
          <p className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 dark:plasmo-text-gray-200">
            Ready when you are
          </p>
          <p className="plasmo-text-xs plasmo-text-gray-400 plasmo-mt-1 plasmo-max-w-[220px] dark:plasmo-text-gray-500">
            Click "Generate Code" to get an AI-suggested solution for this
            problem.
          </p>
        </div>
      ) : (
        <div>
          <p className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1 plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 dark:plasmo-text-gray-200">
            Thinking
            <span className="plasmo-flex plasmo-gap-0.5">
              <span className="ct-dot plasmo-size-1 plasmo-rounded-full plasmo-bg-gray-400 [animation-delay:0s]" />
              <span className="ct-dot plasmo-size-1 plasmo-rounded-full plasmo-bg-gray-400 [animation-delay:0.2s]" />
              <span className="ct-dot plasmo-size-1 plasmo-rounded-full plasmo-bg-gray-400 [animation-delay:0.4s]" />
            </span>
          </p>
          <p className="plasmo-text-xs plasmo-text-gray-400 plasmo-mt-1 plasmo-max-w-[220px] dark:plasmo-text-gray-500">
            Reading the question and your code...
          </p>
        </div>
      )}
    </div>
  )
}

export default CodetantraEmptyState
