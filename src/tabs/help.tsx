import {
  Bug,
  Keyboard,
  Move,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles
} from "lucide-react"
import type { ReactNode } from "react"

import icon from "~assets/icon.png"

import "~styles/style.css"

const Section = ({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Sparkles
  title: string
  children: ReactNode
}) => (
  <div className="plasmo-flex plasmo-gap-3">
    <div className="plasmo-shrink-0 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-size-9 plasmo-rounded-full plasmo-bg-indigo-50 plasmo-text-[#463aa1]">
      <Icon size={18} />
    </div>
    <div>
      <h2 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-900">
        {title}
      </h2>
      <div className="plasmo-text-sm plasmo-text-gray-600 plasmo-mt-1 plasmo-leading-relaxed">
        {children}
      </div>
    </div>
  </div>
)

const HelpPage = () => {
  return (
    <div className="plasmo-min-h-screen plasmo-bg-gray-50 plasmo-flex plasmo-justify-center plasmo-py-12 plasmo-px-4">
      <div className="plasmo-w-full plasmo-max-w-2xl plasmo-bg-white plasmo-rounded-lg plasmo-shadow-sm plasmo-border plasmo-border-gray-200 plasmo-p-8">
        <div className="plasmo-flex plasmo-items-start plasmo-justify-between plasmo-gap-3 plasmo-mb-8">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
            <img src={icon} alt="" className="plasmo-size-9" />
            <div>
              <h1 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-900">
                CodeTantra AI Help
              </h1>
              <p className="plasmo-text-sm plasmo-text-gray-500">
                How to set up and use the extension
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => chrome.runtime.openOptionsPage()}
            className="plasmo-flex plasmo-items-center plasmo-gap-1.5 plasmo-shrink-0 plasmo-rounded-md plasmo-bg-[#463aa1] plasmo-text-white plasmo-text-xs plasmo-font-medium plasmo-px-3 plasmo-py-1.5 hover:plasmo-bg-[#372e80]">
            <Settings size={13} />
            Open Settings
          </button>
        </div>

        <div className="plasmo-flex plasmo-flex-col plasmo-gap-6">
          <Section icon={Settings} title="1. Add an API key">
            <p>
              Open the extension's <strong>Settings</strong> page (gear icon in
              the panel header, or right-click the extension icon → Options),
              pick Google Gemini or OpenAI, and paste in your own API key. Keys
              are stored only in your browser and sent directly to that provider
              - never to any server run by this extension.
            </p>
          </Section>

          <Section icon={Sparkles} title="2. Generate, Regenerate, or Debug">
            <ul className="plasmo-list-disc plasmo-pl-4 plasmo-space-y-1">
              <li>
                <strong>Generate Code</strong> reads the current question and
                your editor's files, then streams back a suggested solution.
              </li>
              <li>
                <strong>↻ Regenerate</strong> asks again using the same
                extracted question/code, without re-reading the page.
              </li>
              <li>
                <strong>Debug from error on page</strong> reads a visible
                compiler error or failed test output and asks the AI to fix that
                specific problem instead of writing a fresh solution.
              </li>
            </ul>
          </Section>

          <Section icon={Keyboard} title="Opening and closing the panel">
            <p>
              Click the toolbar icon, press{" "}
              <kbd className="plasmo-px-1 plasmo-py-0.5 plasmo-rounded plasmo-border plasmo-border-gray-300 plasmo-bg-gray-100 plasmo-text-xs">
                Ctrl+Shift+Y
              </kbd>
              , or click the purple "Generate Code" button injected into
              CodeTantra's own toolbar (it opens the panel automatically). The
              panel starts closed on every page load.
            </p>
            <p className="plasmo-mt-2 plasmo-text-xs plasmo-text-gray-500">
              If the keyboard shortcut doesn't respond, another extension may
              already be using it - check and reassign it at{" "}
              <code className="plasmo-text-[11px]">
                chrome://extensions/shortcuts
              </code>
              .
            </p>
          </Section>

          <Section icon={Move} title="Moving and resizing">
            <p>
              Drag the panel by its header to move it. Drag the bottom-right
              corner to resize it - it remembers both between page loads. The{" "}
              <RotateCcw size={12} className="plasmo-inline plasmo-mb-0.5" />{" "}
              icon in the header resets it back to its default position and
              size.
            </p>
          </Section>

          <Section icon={Bug} title="Troubleshooting">
            <ul className="plasmo-list-disc plasmo-pl-4 plasmo-space-y-1">
              <li>
                <strong>Wrong language generated:</strong> make sure
                CodeTantra's own language selector for the file is set correctly
                before generating.
              </li>
              <li>
                <strong>Quota/rate-limit errors:</strong> the panel tells you
                which one occurred; a quota error means the key itself is out of
                credits, not just temporarily throttled.
              </li>
              <li>
                <strong>No files extracted:</strong> make sure the Explorer
                sidebar in CodeTantra is visible before generating.
              </li>
            </ul>
          </Section>

          <Section icon={ShieldCheck} title="Privacy & academic integrity">
            <p>
              No analytics or tracking is included, and no backend server run by
              this extension ever sees your code or API key. This tool can
              generate full solutions to CodeTantra exercises - check your
              institution's academic integrity policy before using it on graded
              work.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default HelpPage
