import { useState } from 'react'

interface ImageCanvasProps {
  originalUrl: string
  resultUrl: string
}

type View = 'result' | 'original' | 'split'

const viewLabels: Record<View, { label: string; icon: React.ReactNode }> = {
  result: {
    label: 'Result',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
        <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.574a5.5 5.5 0 00-7.688 7.688L11.844 5.574zm1.06 1.06L3.514 12.844a5.5 5.5 0 007.689-7.689l1.701-1.521z" clipRule="evenodd"/>
      </svg>
    ),
  },
  original: {
    label: 'Original',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
        <path d="M2.5 3.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zM2 7a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zm1 3a1 1 0 100 2h10a1 1 0 100-2H3z"/>
      </svg>
    ),
  },
  split: {
    label: 'Compare',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
        <path d="M8.75 1a.75.75 0 00-1.5 0v14a.75.75 0 001.5 0V1zM3 4.5A1.5 1.5 0 014.5 3h2a.75.75 0 010 1.5h-2v7h2a.75.75 0 010 1.5h-2A1.5 1.5 0 013 11.5v-7zM9.5 4.5h2A1.5 1.5 0 0113 6v4a1.5 1.5 0 01-1.5 1.5h-2a.75.75 0 010-1.5h2v-4h-2a.75.75 0 010-1.5z"/>
      </svg>
    ),
  },
}

export default function ImageCanvas({ originalUrl, resultUrl }: ImageCanvasProps) {
  const [view, setView] = useState<View>('result')

  return (
    <div className="w-full flex flex-col gap-3 animate-fade-up">
      {/* View switcher */}
      <div
        className="flex items-center gap-1 self-center bg-surface-raised border border-border rounded-lg p-1 shadow-sm"
        role="tablist"
        aria-label="Image view"
      >
        {(Object.entries(viewLabels) as [View, typeof viewLabels[View]][]).map(([v, { label, icon }]) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150
              ${view === v
                ? 'bg-magenta text-white shadow-sm'
                : 'text-muted hover:text-secondary hover:bg-surface'
              }
            `}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      {view === 'split' ? (
        /* Side-by-side comparison view */
        <div className="grid grid-cols-2 gap-3">
          {/* Original panel */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted text-center font-medium">Original</p>
            <div className="rounded-xl overflow-hidden border border-border bg-checker aspect-square">
              <img
                src={originalUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Result panel */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted text-center font-medium">Result</p>
            <div className="rounded-xl overflow-hidden border border-border bg-checker aspect-square">
              <img
                src={resultUrl}
                alt="Result"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Single image view */
        <div
          className="relative w-full overflow-hidden rounded-xl border border-border bg-checker shadow-md"
          style={{ minHeight: 320 }}
          aria-label={`Image preview — ${view} view`}
        >
          {view === 'result' && (
            <img
              src={resultUrl}
              alt="Background removed result"
              className="w-full h-full object-contain max-h-[520px]"
            />
          )}

          {view === 'original' && (
            <img
              src={originalUrl}
              alt="Original uploaded image"
              className="w-full h-full object-contain max-h-[520px]"
            />
          )}
        </div>
      )}


    </div>
  )
}
