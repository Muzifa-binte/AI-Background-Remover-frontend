import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import UploadZone from '../components/UploadZone'
import ImageCanvas from '../components/ImageCanvas'
import DownloadButton from '../components/DownloadButton'
import QualityToggle from '../components/QualityToggle'
import BackgroundPicker from '../components/BackgroundPicker'
import { useUpload } from '../hooks/useUpload'
import type { BgSettings } from '../hooks/useReplaceBg'

const FEATURE_CHIPS = [
  { label: 'JPEG, PNG, WebP',       icon: '🖼️' },
  { label: 'Up to 10 MB',           icon: '⚡' },
  { label: 'Transparent PNG output', icon: '✨' },
  { label: 'AI-powered',            icon: '🤖' },
  { label: 'Instant download',      icon: '⬇️' },
  { label: 'Dark mode',             icon: '🌙' },
]

// Steps shown in sequence while the AI is working.
// Each step advances every STEP_INTERVAL ms so the UI always feels alive.
const FAST_STEPS = [
  { text: 'Uploading image…',        sub: 'Sending to AI server'           },
  { text: 'Analysing subject…',      sub: 'ISNet detecting edges'          },
  { text: 'Removing background…',    sub: 'Generating alpha mask'          },
  { text: 'Refining edges…',         sub: 'Smoothing transparency'         },
  { text: 'Almost done…',            sub: 'Saving your PNG'                },
]
const STANDARD_STEPS = [
  { text: 'Uploading image…',        sub: 'Sending to AI server'           },
  { text: 'Detecting subject…',      sub: 'U²-Net portrait analysis'       },
  { text: 'Isolating person…',       sub: 'Human segmentation model'       },
  { text: 'Refining edges…',         sub: 'Smoothing hair & skin boundary' },
  { text: 'Almost done…',            sub: 'Saving your PNG'                },
]
const QUALITY_STEPS = [
  { text: 'Uploading image…',        sub: 'Sending to AI server'           },
  { text: 'Analysing subject…',      sub: 'BiRefNet deep feature pass 1/2' },
  { text: 'Fine-detail processing…', sub: 'BiRefNet deep feature pass 2/2' },
  { text: 'Removing background…',    sub: 'Generating high-res alpha mask' },
  { text: 'Refining edges…',         sub: 'Hair & fur detail pass'         },
  { text: 'Almost done…',            sub: 'Saving your PNG'                },
]
const STEP_INTERVAL = 2800  // ms between step advances

export default function HomePage() {
  const { status, result, originalUrl, error, quality, setQuality, upload, reset } = useUpload()
  
  // Background replacement state
  const [showReplaceBg, setShowReplaceBg] = useState(false)
  const [replaceStatus, setReplaceStatus] = useState<'idle' | 'replacing' | 'done' | 'error'>('idle')
  const [replaceResult, setReplaceResult] = useState<any>(null)
  const [replaceError, setReplaceError] = useState<string | null>(null)
  
  // Background settings
  const [bgSettings, setBgSettings] = useState<BgSettings>({
    bgType: 'solid',
    solidColor: '#ffffff',
    gradientStart: '#e8336d',
    gradientEnd: '#2fbfb0',
    gradientDir: 'vertical',
    bgFile: null,
    bgFit: 'cover',
    libraryUrl: null,
  })

  const updateBgSetting = <K extends keyof BgSettings>(key: K, value: BgSettings[K]) => {
    setBgSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetBgSettings = () => {
    setBgSettings({
      bgType: 'solid',
      solidColor: '#ffffff',
      gradientStart: '#e8336d',
      gradientEnd: '#2fbfb0',
      gradientDir: 'vertical',
      bgFile: null,
      bgFit: 'cover',
      libraryUrl: null,
    })
  }

  const isReplacing = replaceStatus === 'replacing'
  const replaceDone = replaceStatus === 'done' && replaceResult !== null

  // Replace background function
  const handleReplaceBackground = async () => {
    if (!result) return

    setReplaceStatus('replacing')
    setReplaceResult(null)
    setReplaceError(null)

    const formData = new FormData()
    formData.append('fg_filename', result.output_filename)
    formData.append('bg_type', bgSettings.bgType === 'library' ? 'image' : bgSettings.bgType)
    formData.append('solid_color', bgSettings.solidColor)
    formData.append('gradient_start', bgSettings.gradientStart)
    formData.append('gradient_end', bgSettings.gradientEnd)
    formData.append('gradient_dir', bgSettings.gradientDir)
    formData.append('bg_fit', bgSettings.bgFit)
    
    if ((bgSettings.bgType === 'image' || bgSettings.bgType === 'library') && bgSettings.bgFile) {
      formData.append('bg_file', bgSettings.bgFile)
    }

    try {
      const res = await axios.post('/api/replace-background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setReplaceResult(res.data)
      setReplaceStatus('done')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Background replacement failed. Please try again.'
      setReplaceError(msg)
      setReplaceStatus('error')
    }
  }

  // ── Processing step cycling ──────────────────────────────────────────────
  const steps = quality === 'quality' ? QUALITY_STEPS
              : quality === 'standard' ? STANDARD_STEPS
              : FAST_STEPS
  const [stepIdx, setStepIdx] = useState(0)
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'uploading') {
      setStepIdx(0)
      stepTimer.current = setInterval(() => {
        setStepIdx(prev => Math.min(prev + 1, steps.length - 1))
      }, STEP_INTERVAL)
    } else {
      if (stepTimer.current) {
        clearInterval(stepTimer.current)
        stepTimer.current = null
      }
    }
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current)
    }
  }, [status, steps.length])

  const isUploading = status === 'uploading'
  const isDone      = status === 'success' && result !== null && originalUrl !== null

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-10">

      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-3">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-magenta/30 bg-magenta/8 text-xs font-medium text-magenta">
          <span className="w-1.5 h-1.5 rounded-full bg-magenta animate-pulse" aria-hidden="true" />
          AI-Powered Background Removal
        </span>

        <h1 className="text-4xl sm:text-5xl font-display font-bold text-primary leading-tight tracking-tight">
          Remove Backgrounds{' '}
          <span className="text-gradient-brand">Instantly</span>
        </h1>

        <p className="text-secondary text-base max-w-md leading-relaxed">
          Drop any photo — our AI isolates the subject and hands you a crisp transparent PNG in seconds.
        </p>
      </div>

      {/* Upload / Result area */}
      {!isDone ? (
        <div className="flex flex-col gap-5">
          <UploadZone onFile={upload} disabled={isUploading} />

          {/* Quality selector — shown when idle */}
          {!isUploading && (
            <div className="flex justify-center">
              <QualityToggle value={quality} onChange={setQuality} disabled={isUploading} />
            </div>
          )}

          {/* Processing state */}
          {isUploading && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-5 py-8 animate-fade-up"
            >
              {/* Spinner */}
              <div className="relative w-14 h-14">
                <svg className="absolute inset-0 w-14 h-14 animate-spin text-magenta" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56" aria-hidden="true">
                  <circle className="opacity-15" cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M52 28a24 24 0 00-24-24v4a20 20 0 0120 20h4z" />
                </svg>
                <svg className="absolute inset-0 w-14 h-14 animate-spin text-teal" style={{ animationDuration: '2s', animationDirection: 'reverse' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56" aria-hidden="true">
                  <circle className="opacity-10" cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-60" fill="currentColor" d="M46 28a18 18 0 00-18-18v3a15 15 0 0115 15h3z" />
                </svg>
              </div>

              {/* Animated step text */}
              <div className="text-center">
                <p
                  key={stepIdx}
                  className="text-primary font-medium animate-fade-up"
                >
                  {steps[stepIdx].text}
                </p>
                <p
                  key={`sub-${stepIdx}`}
                  className="text-muted text-sm mt-0.5 animate-fade-up"
                >
                  {steps[stepIdx].sub}
                </p>
              </div>

              {/* Step progress dots */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`
                      rounded-full transition-all duration-500
                      ${i === stepIdx
                        ? 'w-4 h-2 bg-magenta'
                        : i < stepIdx
                        ? 'w-2 h-2 bg-magenta/40'
                        : 'w-2 h-2 bg-border'
                      }
                    `}
                  />
                ))}
              </div>

              {/* Quality badge */}
              <span className="text-xs px-2.5 py-1 rounded-full border border-border text-muted bg-surface-raised">
                {quality === 'quality'  ? '✨ BiRefNet — best edges'
               : quality === 'standard' ? '👤 U²-Net — portrait mode'
               :                          '⚡ ISNet — fast mode'}
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg bg-surface border border-danger/40 px-4 py-3.5 animate-fade-up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-8.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75-1.5a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-danger">Something went wrong</p>
                <p className="text-xs text-secondary mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Result */
        <div className="flex flex-col gap-5">
          <ImageCanvas
            originalUrl={originalUrl!}
            resultUrl={`/api/download/${result!.output_filename}`}
          />

          {/* Actions bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 bg-surface-raised rounded-xl border border-border">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-success shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.574a.75.75 0 00-1.188-.918l-3.454 4.472-1.696-1.697a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.124-.096l4.024-5.07z" clipRule="evenodd"/>
              </svg>
              Background removed
              {result?.quality === 'quality' && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-magenta/10 text-magenta border border-magenta/20">
                  BiRefNet
                </span>
              )}
              {result?.quality === 'standard' && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/20">
                  Portrait
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReplaceBg(!showReplaceBg)}
                className="btn-ghost text-sm"
              >
                {showReplaceBg ? 'Hide Replace BG' : 'Replace Background'}
              </button>
              <button
                onClick={reset}
                className="btn-ghost text-sm"
              >
                Try another
              </button>
              <DownloadButton
                downloadUrl={`/api/download/${result!.output_filename}`}
                filename={result!.output_filename}
              />
            </div>
          </div>

          {/* Background replacement section */}
          {showReplaceBg && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <BackgroundPicker
                  settings={bgSettings}
                  onChange={updateBgSetting}
                  onReset={resetBgSettings}
                  disabled={isReplacing}
                />
              </div>

              {/* Replace background button */}
              <button
                onClick={handleReplaceBackground}
                disabled={isReplacing}
                className={`
                  w-full flex items-center justify-center gap-2
                  px-5 py-3 rounded-xl font-semibold text-sm
                  transition-all duration-200
                  ${!isReplacing
                    ? 'bg-magenta hover:bg-magenta-hover text-white shadow-sm hover:shadow-md active:scale-95'
                    : 'bg-surface-raised text-muted border border-border cursor-not-allowed'
                  }
                `}
              >
                {isReplacing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Replacing background…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                    </svg>
                    Apply New Background
                  </>
                )}
              </button>

              {/* Replace background result */}
              {replaceDone && replaceResult && (
                <div className="flex flex-col gap-3 animate-fade-up">
                  <ImageCanvas
                    originalUrl={originalUrl!}
                    resultUrl={`/api/download/${replaceResult.output_filename}`}
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap p-3 bg-surface-raised rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.574a.75.75 0 00-1.188-.918l-3.454 4.472-1.696-1.697a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.124-.096l4.024-5.07z" clipRule="evenodd" />
                      </svg>
                      Background replaced
                    </div>
                    <DownloadButton
                      downloadUrl={`/api/download/${replaceResult.output_filename}`}
                      filename={replaceResult.output_filename}
                    />
                  </div>
                </div>
              )}

              {/* Replace background error */}
              {replaceError && (
                <div role="alert" className="flex items-start gap-3 rounded-lg bg-surface border border-danger/40 px-4 py-3.5 animate-fade-up">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-8.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75-1.5a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-danger">Background replacement failed</p>
                    <p className="text-xs text-secondary mt-0.5">{replaceError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tip — shown only for fast/standard mode results */}
          {result?.quality === 'fast' && (
            <p className="text-xs text-center text-muted px-2">
              Not happy with the edges?{' '}
              <button onClick={reset} className="text-magenta underline underline-offset-2 hover:no-underline">
                Try again
              </button>
              {' '}with <strong className="text-secondary">Standard</strong> (portraits) or{' '}
              <strong className="text-secondary">Quality</strong> (BiRefNet) for finer detail.
            </p>
          )}
          {result?.quality === 'standard' && (
            <p className="text-xs text-center text-muted px-2">
              Need even sharper edges?{' '}
              <button onClick={reset} className="text-magenta underline underline-offset-2 hover:no-underline">
                Try again
              </button>
              {' '}with <strong className="text-secondary">Quality mode</strong> (BiRefNet) for the best possible result.
            </p>
          )}
        </div>
      )}

      {/* Feature chips — only on idle */}
      {!isDone && !isUploading && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted uppercase tracking-widest font-medium">What we support</p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Supported features">
            {FEATURE_CHIPS.map(({ label, icon }) => (
              <li key={label} className="chip gap-1.5">
                <span aria-hidden="true">{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
