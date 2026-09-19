/**
 * Import styles
 */
import cssText from "data-text:~styles/style.css"
/**
 * React hooks
 */
import { useEffect, useRef, useState } from "react"
/**
 * Custom modules
 */
import Draggable from "react-draggable"

/**
 * Components
 */
import CodetantraButtons from "~components/codetantra/CodetantraButtons"
import CodetantraFooter from "~components/codetantra/CodetantraFooter"
import CodetantraHeader from "~components/codetantra/CodetantraHeader"
import { injectGenerateButton } from "~utils/injectGenerateButton"
import { isDarkTheme, watchTheme } from "~utils/theme"

/**
 * Define the url where this content script runs
 */
export const config = {
  matches: ["*://*.codetantra.com/*"],
  all_frames: true
}

/**
 * Export styles
 */
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const DEFAULT_POSITION = { x: 100, y: 100 }
const DEFAULT_SIZE = { width: 320, height: 420 }
const MIN_WIDTH = 320
const MIN_HEIGHT = 340
const SIZE_STORAGE_KEY = "ct-size"
const POSITION_STORAGE_KEY = "ct-position"

/**
 * CodetantraWindow
 */
const CodetantraWindow = () => {
  // Only export in iframe window not on window.top
  if (window === window.top) return null

  // State to toggle the visibility of the CodeTantraWindow - hidden by
  // default on every page load; the user opens it via the toolbar icon or
  // the keyboard shortcut rather than it appearing automatically.
  const [visible, setVisible] = useState(false)

  // State to store the position and (user-resizable) size of the panel
  const [position, setPosition] = useState(DEFAULT_POSITION)
  const [size, setSize] = useState(DEFAULT_SIZE)

  // Follows CodeTantra's own light/dark theme - see ~utils/theme
  const [dark, setDark] = useState(() => isDarkTheme())

  // Set when the toolbar "Generate Code" button (injected into CodeTantra's
  // own Prev/Submit/Next bar) is clicked while the panel is closed - opens
  // the panel and tells CodetantraButtons to start generating immediately.
  const [pendingGenerate, setPendingGenerate] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Restore the saved position and size (best-effort; ignore corrupt data)
    try {
      const savedSize = localStorage.getItem(SIZE_STORAGE_KEY)
      if (savedSize) {
        const { width, height } = JSON.parse(savedSize)
        const maxWidth = window.innerWidth * 0.9
        const maxHeight = window.innerHeight * 0.9

        setSize({
          width: Math.max(
            MIN_WIDTH,
            Math.min(Number(width) || DEFAULT_SIZE.width, maxWidth)
          ),
          height: Math.max(
            MIN_HEIGHT,
            Math.min(Number(height) || DEFAULT_SIZE.height, maxHeight)
          )
        })
      }
    } catch {
      // Ignore malformed saved size, keep the default
    }

    try {
      const savedPosition = localStorage.getItem(POSITION_STORAGE_KEY)
      if (savedPosition) {
        let { x, y } = JSON.parse(savedPosition)

        const maxX = window.innerWidth - DEFAULT_SIZE.width
        const maxY = window.innerHeight - DEFAULT_SIZE.height

        x = Math.max(0, Math.min(Number(x) || 0, maxX))
        y = Math.max(0, Math.min(Number(y) || 0, maxY))

        setPosition({ x, y })
      }
    } catch {
      // Ignore malformed saved position, keep the default
    }

    // Callback for listening the message
    const listener = (message: any) => {
      if (message?.type === "TOGGLE_CODETANTRA_AI") {
        setVisible((prev) => !prev)
      }
    }

    // Guard against the extension having been reloaded/updated while this
    // page stayed open, which invalidates chrome.runtime in this context.
    if (!chrome.runtime?.id) return

    // Listen for the message
    chrome.runtime.onMessage.addListener(listener)

    // Cleanup function
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  // Keep the panel in sync with CodeTantra's own theme.
  useEffect(() => watchTheme(setDark), [])

  // Inject the "Generate Code" button into CodeTantra's own toolbar.
  useEffect(
    () =>
      injectGenerateButton(() => {
        setVisible(true)
        setPendingGenerate(true)
      }),
    []
  )

  // Keep the panel's top-left corner inside the viewport - resizing grows
  // the box from its bottom-right corner, so a panel positioned near an
  // edge can otherwise push itself (or its resize handle) off-screen.
  const clampPositionToViewport = (width: number, height: number) => {
    setPosition((prev) => {
      const maxX = Math.max(0, window.innerWidth - width)
      const maxY = Math.max(0, window.innerHeight - height)
      const x = Math.max(0, Math.min(prev.x, maxX))
      const y = Math.max(0, Math.min(prev.y, maxY))

      if (x === prev.x && y === prev.y) return prev

      const clamped = { x, y }
      try {
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(clamped))
      } catch {
        // Ignore storage failures (e.g. quota, private mode)
      }
      return clamped
    })
  }

  // Persist the panel's size whenever the user drags the native resize
  // handle (bottom-right corner of the container), and re-clamp position
  // so growing the panel can't push it off-screen.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const { width, height } = entry.contentRect
      // Only persist meaningful, user-driven sizes.
      if (width < 10 || height < 10) return

      clampPositionToViewport(width, height)

      try {
        localStorage.setItem(
          SIZE_STORAGE_KEY,
          JSON.stringify({
            width: Math.round(width),
            height: Math.round(height)
          })
        )
      } catch {
        // Ignore storage failures (e.g. quota, private mode)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // If the browser window itself shrinks (e.g. resizing the browser, or
  // rotating a device), shrink the panel to fit and keep it on-screen
  // rather than letting it hang off the edge or block interaction.
  useEffect(() => {
    const handleWindowResize = () => {
      const maxWidth = Math.max(MIN_WIDTH, window.innerWidth * 0.9)
      const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight * 0.9)

      setSize((prev) => {
        const width = Math.min(prev.width, maxWidth)
        const height = Math.min(prev.height, maxHeight)
        return width === prev.width && height === prev.height
          ? prev
          : { width, height }
      })

      clampPositionToViewport(
        containerRef.current?.offsetWidth ?? DEFAULT_SIZE.width,
        containerRef.current?.offsetHeight ?? DEFAULT_SIZE.height
      )
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [])

  // Restore the panel to its default position and size.
  const handleReset = () => {
    setPosition(DEFAULT_POSITION)
    setSize(DEFAULT_SIZE)
    try {
      localStorage.removeItem(POSITION_STORAGE_KEY)
      localStorage.removeItem(SIZE_STORAGE_KEY)
    } catch {
      // Ignore storage failures (e.g. quota, private mode)
    }
  }

  // Hide the window based on state
  if (!visible) return null

  return (
    <Draggable
      nodeRef={containerRef}
      handle=".drag-handle"
      position={position}
      onStop={(e, data) => {
        let x = data.x
        let y = data.y

        const maxX = window.innerWidth - size.width
        const maxY = window.innerHeight - size.height

        // Clamp values
        x = Math.max(0, Math.min(x, maxX))
        y = Math.max(0, Math.min(y, maxY))

        const newPos = { x, y }

        setPosition(newPos)
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(newPos))
      }}>
      <div
        ref={containerRef}
        id="codetantra-container"
        className={`plasmo-fixed plasmo-top-0 plasmo-left-0 plasmo-flex plasmo-flex-col plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg plasmo-overflow-hidden plasmo-border plasmo-border-gray-200 plasmo-resize dark:plasmo-bg-gray-900 dark:plasmo-border-gray-700 ${dark ? "plasmo-dark" : ""}`}
        style={{
          zIndex: 999999,
          width: size.width,
          height: size.height,
          minWidth: MIN_WIDTH,
          minHeight: MIN_HEIGHT,
          maxWidth: "90vw",
          maxHeight: "90vh"
        }}>
        {/**
         * CodetantraWindow
         */}
        <div className="plasmo-shrink-0">
          <CodetantraHeader
            onClose={() => setVisible(false)}
            onReset={handleReset}
          />
        </div>

        {/**
         * CodetantraButtons - the only scroll container in the panel
         */}
        <div className="plasmo-flex-1 plasmo-min-h-0 plasmo-overflow-y-auto plasmo-bg-white dark:plasmo-bg-gray-900">
          <CodetantraButtons
            autoGenerate={pendingGenerate}
            onAutoGenerateHandled={() => setPendingGenerate(false)}
          />
        </div>

        {/**
         * CodetantraFooter
         */}
        <div className="plasmo-shrink-0">
          <CodetantraFooter />
        </div>
      </div>
    </Draggable>
  )
}

export default CodetantraWindow
