import { useEffect } from 'react'
import UploadZone from '../components/UploadZone'
import DownloadButton from '../components/DownloadButton'
import CropControls from '../components/CropControls'
import QualityToggle from '../components/QualityToggle'
import ImageCanvas from '../components/ImageCanvas'
import SendToMenu from '../components/SendToMenu'
import { useSmartCrop } from '../hooks/useSmartCrop'
import { useActiveImage } from '../contexts/ActiveImageContext'

const FEATURE_CHIPS = [
  { label: 'Auto subject detection', icon: '🎯' },
  { label: 'Aspect ratio lock',       icon: '⬜' },
  { label: 'Adjustable padding',      icon: '📐' },
  { label: 'Transparent PNG output',  icon: '✨' },
  { label: 'E-commerce ready',        icon: '🛍️' },
]

export default function SmartCropPage() {
  const {
    status, result, originalUrl, error,
    settings, updateSetting, resetSettings,
    crop, reCrop, reset, hasFile,
  } = useSmartCrop()

  // ── Pipeline handoff: auto-load if navigated via "Send to…" ────────────
  const { activeFile } = useActiveImage()
  useEffect(() => {
    if (activeFile && !hasFile) {
      crop(activeFile)
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isProcessing = status === 'processing'
  const isDone       = status === 'done' && result !== null

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal/30 bg-teal/8 text-xs font-medium text-teal">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" aria-hidden="true" />
          Smart Cropping
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary leading-tight tracking-tight">
          Auto-Crop to{' '}
          <span className="text-gradient-brand">Your Subject</span>
        </h1>
        <p className="text-secondary text-sm max-w-md leading-relaxed">
          Upload a photo — we detect the subject and crop tightly around it.
          Adjust settings and <strong>Re-crop</strong> instantly without re-uploading.
        </p>
      </div>

      {/* ── Single column layout ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* ── Upload / result section ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3">

          {/* Upload zone — only when no file yet */}
          {!isDone && !isProcessing && (
            <UploadZone onFile={crop} disabled={isProcessing} />
          )}

          {/* Processing spinner */}
          {isProcessing && (
            <div role="status" aria-live="polite"
              className="flex flex-col items-center gap-3 py-8 animate-fade-up">
              <div className="relative w-10 h-10">
                <svg className="absolute inset-0 w-10 h-10 animate-spin text-teal"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56" aria-hidden="true">
                  <circle className="opacity-15" cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M52 28a24 24 0 00-24-24v4a20 20 0 0120 20h4z" />
                </svg>
                <svg className="absolute inset-0 w-10 h-10 animate-spin text-magenta"
                  style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56" aria-hidden="true">
                  <circle className="opacity-10" cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-60" fill="currentColor" d="M46 28a18 18 0 00-18-18v3a15 15 0 0115 15h3z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-primary text-sm font-medium">Removing background &amp; detecting subject…</p>
                <p className="text-muted text-xs mt-0.5">This usually takes a few seconds</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div role="alert"
              className="flex items-start gap-3 rounded-lg bg-surface border border-danger/40 px-4 py-3.5 animate-fade-up">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-8.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75-1.5a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-danger">Processing failed</p>
                <p className="text-xs text-secondary mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {isDone && result && (
            <div className="flex flex-col gap-3 animate-fade-up">

              {/* Before / After comparison with ImageCanvas */}
              <ImageCanvas
                originalUrl={originalUrl!}
                resultUrl={`/api/download/${result.cropped_filename}?v=${result.upload_id}`}
              />

              {/* Crop metadata chips */}
              {result.crop_meta && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    { label: `${result.crop_meta.width} × ${result.crop_meta.height}px`, icon: '📐' },
                    { label: `from ${result.crop_meta.original.width} × ${result.crop_meta.original.height}px`, icon: '🖼️' },
                    { label: settings.aspectRatio === 'free' ? 'Free ratio' : settings.aspectRatio, icon: '⬜' },
                    { label: `${Math.round(settings.paddingPct * 100)}% padding`, icon: '🔲' },
                    { label: result.crop_meta.crop_mode === 'center' ? 'Center crop' : 'Subject crop', icon: result.crop_meta.crop_mode === 'center' ? '🎯' : '✂️' },
                  ].map(({ label, icon }) => (
                    <span key={label} className="chip gap-1 text-[10px]">
                      <span aria-hidden="true">{icon}</span>{label}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 flex-wrap
                p-3 bg-surface-raised rounded-lg border border-border">
                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                    className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.574a.75.75 0 00-1.188-.918l-3.454 4.472-1.696-1.697a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.124-.096l4.024-5.07z" clipRule="evenodd" />
                  </svg>
                  Subject detected &amp; cropped
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <a
                    href={`/api/download/${result.removed_filename}`}
                    download={result.removed_filename}
                    className="btn-ghost text-xs"
                  >
                    Transparent PNG
                  </a>
                  <button onClick={reset} className="btn-ghost text-xs">
                    New image
                  </button>
                  <SendToMenu excludeRoute="/smart-crop" />
                  <DownloadButton
                    downloadUrl={`/api/download/${result.cropped_filename}`}
                    filename={result.cropped_filename}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feature chips — first idle only */}
          {!isDone && !isProcessing && !hasFile && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-[10px] text-muted uppercase tracking-widest font-medium">Features</p>
              <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Smart crop features">
                {FEATURE_CHIPS.map(({ label, icon }) => (
                  <li key={label} className="chip gap-1 text-[10px]">
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Crop controls (below image) ─────────────────────────────────── */}
        <div className="flex flex-col gap-3" aria-label="Crop settings">

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <CropControls
              settings={settings}
              onChange={updateSetting}
              onReset={resetSettings}
              disabled={isProcessing}
            />
            {/* Quality selector inside the controls panel */}
            <div className="mt-4 pt-4 border-t border-border">
              <QualityToggle
                value={settings.quality}
                onChange={q => updateSetting('quality', q)}
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Re-crop button — shown once a file is loaded */}
          {hasFile && (
            <button
              onClick={reCrop}
              disabled={isProcessing}
              className={`
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg font-semibold text-xs
                transition-all duration-200
                ${!isProcessing
                  ? 'bg-magenta hover:bg-magenta-hover text-white shadow-sm hover:shadow-md active:scale-95'
                  : 'bg-surface-raised text-muted border border-border cursor-not-allowed'
                }
              `}
              aria-label="Re-crop with current settings"
            >
              {isProcessing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                    fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                  {isDone ? 'Re-crop with Settings' : 'Crop with Settings'}
                </>
              )}
            </button>
          )}

          {/* Tip — before first upload */}
          {!hasFile && (
            <div className="flex items-start gap-2.5 rounded-lg bg-surface-raised
              border border-border px-3.5 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
                fill="currentColor" className="w-4 h-4 text-teal shrink-0 mt-0.5" aria-hidden="true">
                <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-muted leading-relaxed">
                Upload an image, then change aspect ratio or padding and hit
                <strong className="text-primary"> Re-crop with Settings</strong> — no
                re-upload needed.
              </p>
            </div>
          )}

          {/* Post-result tip */}
          {isDone && (
            <div className="flex items-start gap-2.5 rounded-lg bg-teal/5
              border border-teal/20 px-3.5 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
                fill="currentColor" className="w-4 h-4 text-teal shrink-0 mt-0.5" aria-hidden="true">
                <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-muted leading-relaxed">
                Change the aspect ratio or padding, then click
                <strong className="text-teal"> Re-crop with Settings</strong> to
                update the result instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
