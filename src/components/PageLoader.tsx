/**
 * PageLoader
 *
 * Full-page Suspense fallback shown while a lazy-loaded route chunk is being
 * fetched.  Matches the dual-ring spinner style used throughout the app.
 */

export default function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex flex-col items-center justify-center gap-5 min-h-[60vh] animate-fade-up"
    >
      {/* Dual-ring spinner — same as processing states */}
      <div className="relative w-14 h-14">
        <svg
          className="absolute inset-0 w-14 h-14 animate-spin text-magenta"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle className="opacity-15" cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M52 28a24 24 0 00-24-24v4a20 20 0 0120 20h4z" />
        </svg>
        <svg
          className="absolute inset-0 w-14 h-14 animate-spin text-teal"
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle className="opacity-10" cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-60" fill="currentColor" d="M46 28a18 18 0 00-18-18v3a15 15 0 0115 15h3z" />
        </svg>
      </div>

      <p className="text-sm text-muted">Loading…</p>
    </div>
  )
}
