import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ZipFormat } from '../hooks/useBatch'

// ── Types ──────────────────────────────────────────────────────────────────

interface FormatOption {
  id:          ZipFormat
  label:       string
  ext:         string
  icon:        string
  description: string
  lossless:    boolean
}

export interface ZipExportModalProps {
  isOpen:        boolean
  onClose:       () => void
  fileCount:     number
  isZipping:     boolean
  zipError:      string | null
  onDownload:    (format: ZipFormat, quality: number) => void
}

// ── Constants ──────────────────────────────────────────────────────────────

const FORMATS: FormatOption[] = [
  { id: 'png',  label: 'PNG',  ext: '.png',  icon: '🖼️', description: 'Lossless · keeps transparency', lossless: true  },
  { id: 'jpeg', label: 'JPEG', ext: '.jpg',  icon: '📷', description: 'Smaller · white background',    lossless: false },
  { id: 'webp', label: 'WebP', ext: '.webp', icon: '⚡', description: 'Best compression · modern',      lossless: false },
]

const DEFAULT_QUALITY = 90

// ── ZipExportModal ─────────────────────────────────────────────────────────

export default function ZipExportModal({
  isOpen,
  onClose,
  fileCount,
  isZipping,
  zipError,
  onDownload,
}: ZipExportModalProps) {
  const [format,  setFormat]  = useState<ZipFormat>('png')
  const [quality, setQuality] = useState(DEFAULT_QUALITY)

  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setFormat('png')
      setQuality(DEFAULT_QUALITY)
      setTimeout(() => closeRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Escape key to close (unless zipping in progress)
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isZipping) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, isZipping])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return
    const els = modalRef.current.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )
    const first = els[0], last = els[els.length - 1]
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus() } }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [isOpen])

  const currentFmt = FORMATS.find(f => f.id === format)!
  const isLossless = currentFmt.lossless

  const handleDownload = useCallback(() => {
    onDownload(format, quality)
  }, [format, quality, onDownload])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isZipping) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zip-export-modal-title"
    >
      {/* ── Modal panel ──────────────────────────────────────────────────── */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl animate-fade-up overflow-hidden"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.55)' }}
      >

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* ZIP icon */}
            <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className="w-4 h-4 text-teal" aria-hidden="true">
                <path fillRule="evenodd" d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" clipRule="evenodd" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
            </div>
            <div>
              <h2 id="zip-export-modal-title" className="text-base font-display font-bold text-primary leading-tight">
                Download All as ZIP
              </h2>
              <p className="text-xs text-muted">
                {fileCount} image{fileCount !== 1 ? 's' : ''} · choose format &amp; quality
              </p>
            </div>
          </div>

          <button
            ref={closeRef}
            onClick={onClose}
            disabled={isZipping}
            aria-label="Close ZIP export dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-surface-raised transition-colors focus:outline-none focus:shadow-focus disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* ── Body — 2 columns ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 divide-x divide-border">

          {/* LEFT — Format tabs ─────────────────────────────────────────── */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-3">Format</p>
            <div className="flex gap-3" role="radiogroup" aria-label="ZIP image format">
              {FORMATS.map(fmt => {
                const active = format === fmt.id
                return (
                  <button
                    key={fmt.id}
                    role="radio"
                    aria-checked={active}
                    id={`zip-format-${fmt.id}`}
                    onClick={() => setFormat(fmt.id)}
                    disabled={isZipping}
                    className={`
                      flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2
                      text-center transition-all duration-150 focus:outline-none focus:shadow-focus
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${active
                        ? 'border-teal bg-teal/8 text-teal shadow-sm'
                        : 'border-border bg-surface-raised text-secondary hover:border-border-strong hover:text-primary'
                      }
                    `}
                  >
                    <span className="text-2xl leading-none" aria-hidden="true">{fmt.icon}</span>
                    <span className="text-sm font-bold">{fmt.label}</span>
                    <span className="text-[10px] font-mono opacity-60">{fmt.ext}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-muted text-center">{currentFmt.description}</p>
          </div>

          {/* RIGHT — Quality + info ──────────────────────────────────────── */}
          <div className="px-6 py-5 flex flex-col gap-4">

            {/* Quality row */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-widest ${isLossless ? 'text-muted' : 'text-secondary'}`}>
                  Quality
                </p>
                {isLossless ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-raised border border-border text-[11px] text-muted font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Lossless — N/A
                  </span>
                ) : (
                  <span className="font-mono text-2xl font-bold text-primary tabular-nums leading-none">
                    {quality}<span className="text-sm font-medium text-muted">%</span>
                  </span>
                )}
              </div>

              <input
                id="zip-quality-slider"
                type="range"
                min={1} max={100} step={1}
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                disabled={isLossless || isZipping}
                aria-label="ZIP export quality"
                aria-valuemin={1} aria-valuemax={100} aria-valuenow={quality}
                aria-disabled={isLossless}
                className={`w-full ${isLossless || isZipping ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  background: isLossless
                    ? undefined
                    : `linear-gradient(to right, var(--accent-teal) 0%, var(--accent-teal) ${quality}%, var(--border-strong) ${quality}%, var(--border-strong) 100%)`,
                }}
              />

              {!isLossless ? (
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-muted">Low</span>
                  <span className="text-xs text-muted">High</span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted text-center">PNG is lossless — quality does not apply</p>
              )}
            </div>

            {/* ZIP info pill */}
            <div className="flex items-center gap-2.5 rounded-lg bg-teal/5 border border-teal/20 px-3 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                className="w-4 h-4 text-teal shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0012.5 4H11V3.5A1.5 1.5 0 009.5 2h-6zm0 1.5h6v1H12a.5.5 0 01.5.5v.5h-9v-2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-[10px] text-teal/70 font-medium uppercase tracking-wide">ZIP contents</p>
                <p className="text-sm font-semibold text-primary">
                  {fileCount} file{fileCount !== 1 ? 's' : ''} · {format.toUpperCase()}
                  {!isLossless && ` @ ${quality}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {zipError && (
          <div role="alert" className="mx-6 mb-0 mt-0 flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
              className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true">
              <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.75a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-danger">{zipError}</p>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised flex items-center justify-between gap-4">
          <p className="text-xs text-muted truncate min-w-0">
            Each file named{' '}
            <span className="font-mono font-medium text-secondary">
              photo_no_bg{currentFmt.ext}
            </span>
          </p>

          <button
            id="zip-download-button"
            onClick={handleDownload}
            disabled={isZipping}
            className="
              shrink-0 inline-flex items-center gap-2 px-6 py-2.5
              rounded-xl font-bold text-sm text-white
              bg-teal hover:bg-teal-hover
              shadow-md hover:shadow-lg
              transition-all duration-200 active:scale-[0.98]
              focus:outline-none focus:shadow-focus
              disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
              disabled:hover:bg-teal
            "
            aria-label={isZipping ? 'Building ZIP…' : `Download ${fileCount} files as ${format.toUpperCase()} ZIP`}
          >
            {isZipping ? (
              <>
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Building ZIP…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                  className="w-4 h-4" aria-hidden="true">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Download ZIP
                <span className="text-xs font-normal opacity-80 bg-white/20 px-1.5 py-0.5 rounded-md">
                  {fileCount} {format.toUpperCase()}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
