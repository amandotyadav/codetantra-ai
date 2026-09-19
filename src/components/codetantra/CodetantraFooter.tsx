const CodetantraFooter = () => {
  return (
    <div
      className="
        plasmo-w-full
        plasmo-py-2
        plasmo-px-4
        plasmo-border-t
        plasmo-border-gray-200
        plasmo-text-xs
        plasmo-text-gray-500
        plasmo-flex
        plasmo-items-center
        plasmo-justify-center
        plasmo-gap-1
        dark:plasmo-border-gray-700
        dark:plasmo-text-gray-400
        dark:plasmo-bg-gray-900
      ">
      <span>Made with</span>

      <span className="plasmo-text-red-500 plasmo-heart-scale">❤️</span>

      <span>by</span>

      <a
        href="https://www.linkedin.com/in/amandotyadav/"
        target="_blank"
        rel="noopener noreferrer"
        className="
          plasmo-relative
          plasmo-font-semibold
          plasmo-text-transparent
          plasmo-bg-clip-text
          plasmo-bg-gradient-to-r
          plasmo-from-gray-700
          plasmo-to-black
          hover:plasmo-from-black
          hover:plasmo-to-gray-600
          dark:plasmo-from-gray-300
          dark:plasmo-to-white
          dark:hover:plasmo-from-white
          dark:hover:plasmo-to-gray-300
          plasmo-transition-all
          plasmo-duration-300
          plasmo-cursor-pointer
          after:plasmo-content-['']
          after:plasmo-absolute
          after:plasmo-left-0
          after:plasmo-bottom-0
          after:plasmo-h-[1px]
          after:plasmo-w-0
          after:plasmo-bg-black
          dark:after:plasmo-bg-white
          after:plasmo-transition-all
          after:plasmo-duration-300
          hover:after:plasmo-w-full
        ">
        amandotyadav
      </a>
    </div>
  )
}

export default CodetantraFooter
