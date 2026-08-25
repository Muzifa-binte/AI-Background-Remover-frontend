import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveImage } from '../contexts/ActiveImageContext'
import { imageService } from '../services/imageService'
import { useToast } from '../hooks/useToast'
import UploadZone from '../components/UploadZone'
import SendToMenu from '../components/SendToMenu'
import type { AdvancedAnalysis, BatchAdvancedAnalysisItem } from '../types'

export default function AIAnalysisPage() {
  const { activeFile, activePreviewUrl, setActiveImage, setOutput } = useActiveImage()
  const navigate = useNavigate()

  const findLibraryBgByName = (name: string): string => {
    const clean = name.toLowerCase()
    if (clean.includes('white') || clean.includes('studio')) return 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('grey') || clean.includes('gray')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('marble')) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('beige')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('concrete') || clean.includes('dark')) return 'https://images.unsplash.com/photo-1604076913837-52ab5629fde9?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('wood')) return 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('forest') || clean.includes('green') || clean.includes('nature')) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('mountain') || clean.includes('mist')) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('sky') || clean.includes('blue')) return 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('beach') || clean.includes('sea') || clean.includes('ocean')) return 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('office') || clean.includes('interior')) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=900&fit=crop&q=85'
    if (clean.includes('street') || clean.includes('night') || clean.includes('cyberpunk')) return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=900&fit=crop&q=85'
    return 'https://images.unsplash.com/photo-1550684376-efcomment-a-blur?w=1200&h=900&fit=crop&q=85'
  }

  const applyBackgroundPreset = (type: 'solid' | 'library', value: string) => {
    const preset = {
      bgType: type,
      solidColor: type === 'solid' ? value : '#ffffff',
      libraryUrl: type === 'library' ? value : null,
    }
    sessionStorage.setItem('bg_preset_settings', JSON.stringify(preset))
    if (file && previewUrl) {
      setActiveImage(file, previewUrl)
      navigate('/replace-bg')
    }
  }
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')

  // ── Single Tab State ───────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AdvancedAnalysis | null>(null)

  const [showGrid, setShowGrid] = useState(false)
  const [showBoxes, setShowBoxes] = useState(true)
  const [hoveredBoxIdx, setHoveredBoxIdx] = useState<number | null>(null)

  // ── Batch Tab State ────────────────────────────────────────────────────────
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<BatchAdvancedAnalysisItem[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // File input ref for batch selector
  const batchInputRef = useRef<HTMLInputElement>(null)

  // ── Synchronize with active image context on mount ──────────────────────────
  useEffect(() => {
    if (activeFile && !file) {
      setFile(activeFile)
      setPreviewUrl(activePreviewUrl)

      // Check session cache first to prevent re-running when navigating back
      const cacheKey = `ai_analysis_${activeFile.name}_${activeFile.size}_${activeFile.lastModified}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setAnalysis(parsed)
          return
        } catch (e) {
          // ignore cache error
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile])

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== activePreviewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl, activePreviewUrl])

  // ── Run Single Analysis ────────────────────────────────────────────────────
  const runSingleAnalysis = async (targetFile: File) => {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const data = await imageService.analyzeAdvanced(targetFile)
      setAnalysis(data)

      // Save to session cache
      const cacheKey = `ai_analysis_${targetFile.name}_${targetFile.size}_${targetFile.lastModified}`
      sessionStorage.setItem(cacheKey, JSON.stringify(data))

      // Register the file in the pipeline context so SendToMenu works
      // We use the local server route or object preview URL as fallback
      const localUrl = URL.createObjectURL(targetFile)
      setOutput(localUrl, targetFile.name)
      showToast('Image analysis complete!', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to analyze image.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSingleUpload = (uploadedFile: File) => {
    const pUrl = URL.createObjectURL(uploadedFile)
    setFile(uploadedFile)
    setPreviewUrl(pUrl)
    setActiveImage(uploadedFile, pUrl)
    runSingleAnalysis(uploadedFile)
  }

  const resetSingle = () => {
    setFile(null)
    setPreviewUrl(null)
    setAnalysis(null)
    setError(null)
    setActiveImage(null, null)
  }

  // ── Run Batch Analysis ─────────────────────────────────────────────────────
  const runBatchAnalysis = async () => {
    if (batchFiles.length === 0) return
    setBatchLoading(true)
    setBatchError(null)
    setBatchResults([])
    setExpandedIndex(null)
    try {
      const response = await imageService.analyzeAdvancedBatch(batchFiles)
      setBatchResults(response.results)
      showToast('Batch analysis completed!', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to complete batch analysis.'
      setBatchError(msg)
      showToast(msg, 'error')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      if (filesArray.length > 10) {
        showToast('Maximum 10 files allowed for batch analysis.', 'error')
        setBatchFiles(filesArray.slice(0, 10))
      } else {
        setBatchFiles(filesArray)
      }
    }
  }

  const removeBatchFile = (index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index))
  }

  const copyToClipboard = (text: string, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text)
    showToast(message, 'success')
  }

  return (
    <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Hero Header */}
      <div className="text-center flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet/30 bg-violet/8 text-xs font-medium text-violet">
          <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" aria-hidden="true" />
          Advanced AI Analysis
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary leading-tight tracking-tight">
          Visual Insights &amp;{' '}
          <span className="text-gradient-brand">Advanced Metrics</span>
        </h1>
        <p className="text-secondary text-sm max-w-md leading-relaxed">
          Extract color palettes, identify visual balance, outline objects, and receive styling suggestions.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center border-b border-border mb-4">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('single')}
            className={`
              pb-4 text-sm font-semibold border-b-2 transition-all duration-150
              ${activeTab === 'single'
                ? 'border-magenta text-magenta'
                : 'border-transparent text-secondary hover:text-primary hover:border-border'
              }
            `}
          >
            Single Image Analysis
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`
              pb-4 text-sm font-semibold border-b-2 transition-all duration-150
              ${activeTab === 'batch'
                ? 'border-magenta text-magenta'
                : 'border-transparent text-secondary hover:text-primary hover:border-border'
              }
            `}
          >
            Batch AI Analysis
          </button>
        </nav>
      </div>

      {/* ── Tab 1: Single Image Analysis ────────────────────────────────────── */}
      {activeTab === 'single' && (
        <div className="w-full flex flex-col gap-6">
          {!file && !loading && (
            <UploadZone onFile={handleSingleUpload} disabled={loading} />
          )}

          {/* Staged state preview (waiting for analysis trigger) */}
          {file && previewUrl && !analysis && !loading && !error && (
            <div className="card p-6 flex flex-col items-center gap-4 text-center max-w-lg mx-auto animate-fade-up">
              <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-surface-raised flex items-center justify-center p-4 min-h-[300px]">
                <img src={previewUrl} className="max-w-full max-h-[400px] object-contain rounded-xl select-none" alt="Staged target" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Image Loaded</h3>
                <p className="text-xs text-secondary mt-1">Ready for advanced visual analysis and insights</p>
              </div>
              <div className="flex gap-3 w-full justify-center">
                <button
                  onClick={resetSingle}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Change Image
                </button>
                <button
                  onClick={() => runSingleAnalysis(file)}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 font-bold shadow-md"
                >
                  <span>🔍</span> Run AI Visual Analysis
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-12 animate-fade-up">
              <div className="relative w-12 h-12">
                <svg className="absolute inset-0 w-12 h-12 animate-spin text-violet" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56">
                  <circle className="opacity-15" cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M52 28a24 24 0 00-24-24v4a20 20 0 0120 20h4z" />
                </svg>
                <svg className="absolute inset-0 w-12 h-12 animate-spin text-magenta" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56">
                  <circle className="opacity-10" cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-60" fill="currentColor" d="M46 28a18 18 0 00-18-18v3a15 15 0 0115 15h3z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-primary font-medium">Running advanced neural analysis…</p>
                <p className="text-muted text-xs mt-0.5">Detecting objects, composing grids, and calculating colors</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-lg bg-surface border border-danger/40 px-4 py-3.5 animate-fade-up">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-8.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75-1.5a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-danger">Analysis Failed</p>
                <p className="text-xs text-secondary mt-0.5">{error}</p>
                <button onClick={resetSingle} className="text-xs text-magenta underline hover:no-underline mt-2">Try another image</button>
              </div>
            </div>
          )}

          {/* Results View */}
          {file && previewUrl && analysis && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
              {/* Image Canvas Panel */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Descriptive Filename suggestion */}
                <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider leading-none">Suggested Filename</p>
                    <p className="text-xs font-semibold text-primary truncate mt-1">{analysis.suggested_filename}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(analysis.suggested_filename, 'Copied suggested filename!')}
                    className="text-xs font-bold text-magenta hover:text-magenta-hover shrink-0 flex items-center gap-1.5 bg-magenta/5 border border-magenta/20 px-2.5 py-1 rounded-lg transition-all"
                  >
                    <span>📋</span> Copy Name
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-raised flex items-center justify-center p-4 w-full">
                  {/* Image container */}
                  <div className="relative w-full h-auto">
                    <img src={previewUrl} className="w-full h-auto rounded-xl select-none" alt="Analyzed target" />

                    {/* Rule of Thirds Grid Line Overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                        <div className="border-r border-b border-white/40 border-dashed" />
                        <div className="border-r border-b border-white/40 border-dashed" />
                        <div className="border-b border-white/40 border-dashed" />
                        <div className="border-r border-b border-white/40 border-dashed" />
                        <div className="border-r border-b border-white/40 border-dashed" />
                        <div className="border-b border-white/40 border-dashed" />
                        <div className="border-r border-white/40 border-dashed" />
                        <div className="border-r border-white/40 border-dashed" />
                        <div className="border-transparent" />
                      </div>
                    )}

                    {/* Bounding Boxes Overlay */}
                    {showBoxes && analysis.object_detection && analysis.object_detection.map((obj, idx) => {
                      const [ymin, xmin, ymax, xmax] = obj.box_2d
                      const top = `${ymin}%`
                      const left = `${xmin}%`
                      const height = `${ymax - ymin}%`
                      const width = `${xmax - xmin}%`
                      const isHovered = hoveredBoxIdx === idx

                      return (
                        <div
                          key={idx}
                          className={`absolute border-2 rounded transition-all duration-150 z-20 cursor-pointer ${
                            isHovered
                              ? 'border-magenta bg-magenta/15 shadow-[0_0_12px_rgba(232,51,109,0.4)]'
                              : 'border-teal bg-teal/5 hover:border-magenta'
                          }`}
                          style={{ top, left, height, width }}
                          onMouseEnter={() => setHoveredBoxIdx(idx)}
                          onMouseLeave={() => setHoveredBoxIdx(null)}
                        >
                          <span
                            className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow transition-colors ${
                              isHovered ? 'bg-magenta' : 'bg-teal'
                            }`}
                          >
                            {obj.label} ({Math.round(obj.confidence * 100)}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Overlays / Action controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface rounded-xl border border-border">
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={e => setShowGrid(e.target.checked)}
                        className="rounded border-border text-magenta focus:ring-magenta"
                      />
                      Rule of Thirds Grid
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBoxes}
                        onChange={e => setShowBoxes(e.target.checked)}
                        className="rounded border-border text-magenta focus:ring-magenta"
                      />
                      Object Bounding Boxes
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={resetSingle} className="btn-ghost text-xs py-1.5 px-3">
                      Clear &amp; Reset
                    </button>
                    <SendToMenu excludeRoute="/ai-analysis" />
                  </div>
                </div>

                {/* Detected Objects Details */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Detected Objects</h3>
                  {analysis.object_detection.length === 0 ? (
                    <p className="text-secondary text-sm">No specific objects isolated.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analysis.object_detection.map((obj, idx) => (
                        <button
                          key={idx}
                          onMouseEnter={() => setHoveredBoxIdx(idx)}
                          onMouseLeave={() => setHoveredBoxIdx(null)}
                          className={`
                            px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all duration-150
                            ${hoveredBoxIdx === idx
                              ? 'bg-magenta/10 border-magenta text-magenta scale-[1.02]'
                              : 'bg-surface-raised border-border text-secondary hover:border-border-strong'
                            }
                          `}
                        >
                          <span className="w-2 h-2 rounded-full bg-teal" />
                          {obj.label}
                          <span className="text-[10px] text-muted">{Math.round(obj.confidence * 100)}% Match</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Data & Analysis Panels */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Color Palette Card */}
                <div className="card p-5 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-1">Color Scheme &amp; Palette</h3>
                    <p className="text-xs text-muted">Hover colors for design advice. Click swatches to copy hex codes.</p>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-10 w-full rounded-xl overflow-hidden flex border border-border">
                    {analysis.color_palette.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-full transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: color.hex,
                          width: `${Math.max(5, color.percentage)}%`,
                        }}
                        onClick={() => copyToClipboard(color.hex, `Copied ${color.name} (${color.hex})`)}
                        title={`${color.name} - ${color.percentage}%`}
                      />
                    ))}
                  </div>

                  {/* Individual Swatch Details */}
                  <div className="flex flex-col gap-2.5">
                    {analysis.color_palette.map((color, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start gap-3 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-surface-raised transition-all cursor-pointer"
                        onClick={() => copyToClipboard(color.hex, `Copied ${color.name} (${color.hex})`)}
                      >
                        {/* Swatch circle */}
                        <div
                          className="w-10 h-10 rounded-lg shadow-inner flex items-center justify-center shrink-0 border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        >
                          <span
                            className="text-[9px] font-bold"
                            style={{ color: color.text_color }}
                          >
                            {color.percentage}%
                          </span>
                        </div>
                        {/* Info details */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-primary truncate leading-snug">{color.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-muted group-hover:text-magenta transition-colors">
                                {color.hex}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  applyBackgroundPreset('solid', color.hex)
                                }}
                                className="text-[10px] px-2 py-0.5 rounded border border-magenta text-magenta hover:bg-magenta/5 font-semibold transition-all shrink-0"
                              >
                                Apply BG
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-secondary leading-relaxed">
                            {color.use_case}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Backgrounds Card */}
                {analysis.suggested_backgrounds && analysis.suggested_backgrounds.length > 0 && (
                  <div className="card p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-0.5">Suggested Backgrounds</h3>
                      <p className="text-xs text-muted">Directly apply solid colors or scenery backdrops to this image.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {analysis.suggested_backgrounds.map((bg, idx) => {
                        const isColor = bg.startsWith('#')
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isColor) {
                                applyBackgroundPreset('solid', bg)
                              } else {
                                const matchedUrl = findLibraryBgByName(bg)
                                applyBackgroundPreset('library', matchedUrl)
                              }
                            }}
                            className="p-2.5 bg-surface-raised hover:bg-surface border border-border hover:border-border-strong rounded-xl text-left text-xs font-bold flex items-center gap-2 transition-all group/btn"
                          >
                            {isColor ? (
                              <span className="w-5 h-5 rounded border border-black/10 shrink-0 shadow-sm" style={{ backgroundColor: bg }} />
                            ) : (
                              <span className="shrink-0 text-base">🖼️</span>
                            )}
                            <span className="truncate group-hover/btn:text-magenta transition-colors">{bg}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Composition Card */}
                <div className="card p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Composition Assessment</h3>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-teal/15 text-teal shrink-0 mt-0.5 font-bold text-xs">3/3</div>
                      <div>
                        <h4 className="text-xs font-semibold text-primary uppercase">Rule of Thirds</h4>
                        <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                          {analysis.composition.rule_of_thirds}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-teal/15 text-teal shrink-0 mt-0.5 font-bold text-xs">↖↗</div>
                      <div>
                        <h4 className="text-xs font-semibold text-primary uppercase">Leading Lines</h4>
                        <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                          {analysis.composition.leading_lines}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-teal/15 text-teal shrink-0 mt-0.5 font-bold text-xs">⚖️</div>
                      <div>
                        <h4 className="text-xs font-semibold text-primary uppercase">Visual Balance</h4>
                        <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                          {analysis.composition.balance}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 border-t border-border pt-3 mt-1">
                      <div className="p-1 rounded bg-magenta/10 text-magenta shrink-0 mt-0.5 font-bold text-xs">✂️</div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-magenta uppercase">Crop Recommendation</h4>
                          <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                            {analysis.composition.crop_recommendation}
                          </p>
                        </div>
                        {analysis.suggested_crop && (
                          <button
                            onClick={() => {
                              const preset = {
                                aspectRatio: analysis.suggested_crop.aspect_ratio || 'free',
                                paddingPct: analysis.suggested_crop.padding_pct ?? 0.05
                              }
                              sessionStorage.setItem('crop_preset_settings', JSON.stringify(preset))
                              if (file && previewUrl) {
                                setActiveImage(file, previewUrl)
                                navigate('/smart-crop')
                              }
                            }}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start shadow-sm"
                          >
                            <span>✂️</span> Apply Crop Suggestion ({analysis.suggested_crop.aspect_ratio})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimal Enhancement Card */}
                {analysis.optimal_enhancement && (
                  <div className="card p-5 flex flex-col gap-4 animate-fade-up">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-0.5">Optimal Enhancements</h3>
                      <p className="text-xs text-muted">AI-tuned optimal color, light, and sharpening filters.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-secondary bg-surface-raised p-3.5 rounded-xl border border-border font-mono">
                      <div className="flex justify-between border-b border-border/40 pb-1">
                        <span>Brightness:</span> <span className="font-bold text-primary">{analysis.optimal_enhancement.brightness}x</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-1">
                        <span>Contrast:</span> <span className="font-bold text-primary">{analysis.optimal_enhancement.contrast}x</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-1">
                        <span>Saturation:</span> <span className="font-bold text-primary">{analysis.optimal_enhancement.saturation}x</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-1">
                        <span>Sharpness:</span> <span className="font-bold text-primary">{analysis.optimal_enhancement.sharpness}x</span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-1">
                        <span>Auto White Balance:</span> <span className="font-bold text-primary">{analysis.optimal_enhancement.auto_wb ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const preset = {
                          brightness: analysis.optimal_enhancement.brightness,
                          contrast: analysis.optimal_enhancement.contrast,
                          saturation: analysis.optimal_enhancement.saturation,
                          sharpness: analysis.optimal_enhancement.sharpness,
                          denoise: analysis.optimal_enhancement.denoise,
                          auto_wb: analysis.optimal_enhancement.auto_wb,
                          denoise_strength: analysis.optimal_enhancement.denoise_strength
                        }
                        sessionStorage.setItem('enhance_preset_settings', JSON.stringify(preset))
                        if (file && previewUrl) {
                          setActiveImage(file, previewUrl)
                          navigate('/enhance')
                        }
                      }}
                      className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-2 shadow-sm animate-pulse-glow"
                    >
                      <span>✨</span> Apply Optimal Enhancements
                    </button>
                  </div>
                )}

                {/* Style Suggestions Card */}
                <div className="card p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Artistic Style Transfer Recommendations</h3>
                  <div className="flex flex-col gap-3">
                    {analysis.style_transfer.map((rec, idx) => (
                      <div key={idx} className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gradient-brand">{rec.style}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-violet/10 text-violet border border-violet/20 font-medium">Style</span>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                          {rec.description}
                        </p>
                        {/* Prompt generator copy area */}
                        <div className="bg-surface border border-border rounded-lg p-2 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-mono text-muted truncate">
                            {rec.prompts}
                          </span>
                          <button
                            onClick={() => copyToClipboard(rec.prompts, `Copied prompt for ${rec.style}!`)}
                            className="text-xs font-medium text-magenta hover:text-magenta-hover shrink-0"
                            title="Copy prompt"
                          >
                            Copy Prompt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Batch AI Analysis ───────────────────────────────────────── */}
      {activeTab === 'batch' && (
        <div className="w-full flex flex-col gap-6">
          {/* File Selector */}
          <div className="card p-6 flex flex-col items-center gap-4 text-center">
            <input
              type="file"
              ref={batchInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBatchFileSelect}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-violet/10 text-violet flex items-center justify-center text-2xl mb-1">
              📂
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Upload Multiple Images</h3>
              <p className="text-xs text-secondary mt-1">Select up to 10 images (JPEG, PNG, WebP) to analyze at once</p>
            </div>
            <button
              onClick={() => batchInputRef.current?.click()}
              disabled={batchLoading}
              className="btn-primary"
            >
              Select Images
            </button>
          </div>

          {/* Files selected list */}
          {batchFiles.length > 0 && !batchLoading && batchResults.length === 0 && (
            <div className="card p-5 flex flex-col gap-3 animate-fade-up">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm font-semibold text-secondary">
                  {batchFiles.length} file{batchFiles.length > 1 ? 's' : ''} queued
                </span>
                <button
                  onClick={() => setBatchFiles([])}
                  className="text-xs text-danger underline hover:no-underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {batchFiles.map((f, idx) => (
                  <div key={idx} className="p-3 bg-surface-raised border border-border rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{f.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => removeBatchFile(idx)}
                      className="text-muted hover:text-danger text-lg px-1"
                      title="Remove file"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={runBatchAnalysis}
                className="btn-primary w-full justify-center mt-3"
              >
                📊 Run Batch Analysis
              </button>
            </div>
          )}

          {/* Batch Error Banner */}
          {batchError && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 flex items-start gap-3 animate-fade-up">
              <span className="text-danger shrink-0 mt-0.5 font-bold">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-danger">Batch Analysis Failed</p>
                <p className="text-xs text-secondary mt-0.5">{batchError}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {batchLoading && (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-12 animate-fade-up">
              <div className="relative w-12 h-12">
                <svg className="absolute inset-0 w-12 h-12 animate-spin text-violet" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 56 56">
                  <circle className="opacity-15" cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M52 28a24 24 0 00-24-24v4a20 20 0 0120 20h4z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-primary font-medium">Running batch neural analytics…</p>
                <p className="text-muted text-xs mt-0.5">Running multiple parallel analysis sweeps</p>
              </div>
            </div>
          )}

          {/* Batch Results View */}
          {batchResults.length > 0 && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Batch Results Summary
                </h3>
                <button
                  onClick={() => {
                    setBatchFiles([])
                    setBatchResults([])
                  }}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Start New Batch
                </button>
              </div>

              {/* Grid of processed batch items */}
              <div className="flex flex-col gap-3">
                {batchResults.map((item, idx) => {
                  const isExpanded = expandedIndex === idx
                  const hasSuccess = item.status === 'success' && item.analysis

                  return (
                    <div
                      key={idx}
                      className="card overflow-hidden transition-all duration-200 border-border"
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => {
                          if (hasSuccess) {
                            setExpandedIndex(isExpanded ? null : idx)
                          }
                        }}
                        className={`
                          p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-raised select-none
                          ${isExpanded ? 'border-b border-border bg-surface-raised' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circle Status icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            hasSuccess ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {hasSuccess ? '✓' : '✗'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-primary truncate">{item.filename}</h4>
                            <p className="text-[10px] text-muted mt-0.5">
                              {hasSuccess
                                ? `${item.analysis!.object_detection.length} objects | ${item.analysis!.color_palette.length} primary colors`
                                : 'Failed to analyze'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hasSuccess && (
                            <div className="hidden sm:flex gap-1 items-center">
                              {item.analysis!.color_palette.slice(0, 4).map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          )}
                          {hasSuccess && (
                            <span className="text-xs font-semibold text-magenta">
                              {isExpanded ? 'Hide Details' : 'Expand Details'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && hasSuccess && (
                        <div className="p-5 bg-surface grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-up">
                          {/* Color Swatches */}
                          <div className="md:col-span-6 flex flex-col gap-3">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted">Colors Detected</h5>
                            <div className="flex flex-wrap gap-2">
                              {item.analysis!.color_palette.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  onClick={() => copyToClipboard(c.hex, `Copied hex: ${c.hex}`)}
                                  className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-raised border border-border cursor-pointer hover:border-border-strong"
                                  title={`${c.name} - Click to copy hex`}
                                >
                                  <span className="w-5 h-5 rounded border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                                  <span className="text-xs font-mono font-semibold">{c.hex}</span>
                                  <span className="text-[10px] text-muted">({c.percentage}%)</span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-2">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">Composition Insights</h5>
                              <p className="text-xs text-secondary leading-relaxed bg-surface-raised p-3 rounded-lg border border-border">
                                <strong>Rule of thirds:</strong> {item.analysis!.composition.rule_of_thirds}
                              </p>
                            </div>
                          </div>

                          {/* Styles and Recommendations */}
                          <div className="md:col-span-6 flex flex-col gap-3">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted">Key Objects Detected</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {item.analysis!.object_detection.map((obj, oIdx) => (
                                <span key={oIdx} className="chip bg-teal/10 text-teal border-teal/20 text-xs">
                                  {obj.label} ({Math.round(obj.confidence * 100)}% match)
                                </span>
                              ))}
                              {item.analysis!.object_detection.length === 0 && (
                                <span className="text-xs text-muted">No objects isolated</span>
                              )}
                            </div>

                            <div className="mt-2">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">Artistic Filter Recommendation</h5>
                              <div className="p-3 bg-surface-raised border border-border rounded-lg">
                                <h6 className="text-xs font-bold text-gradient-brand leading-none">{item.analysis!.style_transfer[0]?.style}</h6>
                                <p className="text-[11px] text-secondary mt-1">{item.analysis!.style_transfer[0]?.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error details */}
                      {item.status === 'error' && (
                        <div className="p-4 bg-danger/5 text-danger border-t border-danger/10 text-xs">
                          <strong>Error:</strong> {item.error || 'Failed to complete analysis sweep on this image.'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
