
import { LoaderCircle } from 'lucide-react'

function Loader({ message = 'Loading...', fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'min-h-screen bg-warm-white' : 'min-h-40 py-10'
      }`}
    >
      <LoaderCircle
        size={32}
        className="animate-spin text-maroon"
        aria-hidden="true"
      />

      <p className="text-sm text-burgundy/70">{message}</p>
      <span className="sr-only">Please wait</span>
    </div>
  )
}

export default Loader
