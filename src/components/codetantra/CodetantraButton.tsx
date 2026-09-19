import type { ReactNode } from "react"

interface CodetantraButtonProps {
  children: ReactNode
  handleOnClick: () => void
  disabled?: boolean
  loading?: boolean
}

const CodetantraButton = ({
  children,
  handleOnClick,
  disabled = false,
  loading = false
}: CodetantraButtonProps) => {
  return (
    <button
      type="button"
      onClick={handleOnClick}
      disabled={disabled}
      aria-busy={loading}
      className={`
        plasmo-w-full plasmo-max-w-xs plasmo-mx-auto
        plasmo-px-4 plasmo-py-2.5
        plasmo-rounded-md
        plasmo-text-white
        plasmo-font-medium
        plasmo-text-sm

        plasmo-bg-[#463aa1]

        plasmo-transition-all
        plasmo-duration-200
        plasmo-ease-out

        disabled:plasmo-opacity-60
        disabled:plasmo-cursor-not-allowed

        enabled:hover:plasmo-bg-gradient-to-r
        enabled:hover:plasmo-from-[#463aa1]
        enabled:hover:plasmo-to-[#021431]

        enabled:hover:plasmo-shadow-lg
        enabled:hover:plasmo--translate-y-[2px]

        enabled:active:plasmo-scale-95
        enabled:active:plasmo-translate-y-0

        focus-visible:plasmo-outline
        focus-visible:plasmo-outline-2
        focus-visible:plasmo-outline-offset-2
        focus-visible:plasmo-outline-[#463aa1]
      `}>
      {children}
    </button>
  )
}

export default CodetantraButton
