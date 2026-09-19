/**
 * Custom modules
 */
import { CircleHelp, RotateCcw, Settings, X } from "lucide-react"

import icon from "~assets/icon.png"
import { safeSendMessage } from "~utils/safeRuntime"

interface CodetantraHeaderProps {
  onClose: () => void
  onReset: () => void
}

const CodetantraHeader = ({ onClose, onReset }: CodetantraHeaderProps) => {
  const handleOpenSettings = () => {
    safeSendMessage({ type: "OPEN_OPTIONS_PAGE" })
  }

  const handleOpenHelp = () => {
    safeSendMessage({ type: "OPEN_HELP_PAGE" })
  }

  return (
    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-4 plasmo-py-2 plasmo-bg-[#021431] plasmo-text-white">
      <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-2 drag-handle">
        <img src={icon} alt="" className="plasmo-size-6" />
        <h2
          className="plasmo-font-semibold plasmo-text-sm plasmo-cursor-move"
          title="Shortcut: Ctrl+Shift+Y to open/close">
          CODETANTRA AI
        </h2>
      </div>

      <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
        <button
          type="button"
          onClick={handleOpenHelp}
          title="Help"
          aria-label="Open help page"
          className="plasmo-text-gray-300 hover:plasmo-text-white">
          <CircleHelp size={14} />
        </button>
        <button
          type="button"
          onClick={handleOpenSettings}
          title="Settings"
          aria-label="Open settings page"
          className="plasmo-text-gray-300 hover:plasmo-text-white">
          <Settings size={14} />
        </button>
        <button
          type="button"
          onClick={onReset}
          title="Reset panel position and size"
          aria-label="Reset panel position and size"
          className="plasmo-text-gray-300 hover:plasmo-text-white">
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close (Ctrl+Shift+Y)"
          aria-label="Close"
          className="plasmo-text-gray-300 hover:plasmo-text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default CodetantraHeader
