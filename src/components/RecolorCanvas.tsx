/**
 * RecolorCanvas
 *
 * Two-canvas architecture with Undo/Redo & Zoom/Pan:
 *   visibleCanvas - the image the user sees, with colour strokes painted
 *                    directly on top in real time (semi-transparent).
 *   maskCanvas    - a black canvas that receives identical white strokes,
 *                    exported as a PNG mask sent to the backend.
 *
 * Features:
 *   - Multi-step Undo / Redo (max 20 steps)
 *   - Keyboard shortcuts (Ctrl+Z for Undo, Ctrl+Y / Ctrl+Shift+Z for Redo)
 *   - Zoom In / Zoom Out / Reset Zoom (1x to 4x)
 *   - Custom brush cursor
 *
 * Public API (via ref):
 *   getMaskBlob() -> Promise<Blob>
 *   clearMask()
 *   hasMask()     -> boolean
 *   undo()
 *   redo()
 */

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react'

export interface RecolorCanvasHandle {
  getMaskBlob: () => Promise<Blob>
  clearMask:   () => void
  hasMask:     () => boolean
  undo:        () => void
  redo:        () => void
  canUndo:     boolean
  canRedo:     boolean
}

interface RecolorCanvasProps {
  imageUrl:   string
  brushSize:  number   // CSS px diameter
  brushColor: string   // hex, e.g. "#e83c6d"
  onStroke?:  () => void
  disabled?:  boolean
}

interface HistorySnapshot {
  visibleData: ImageData
  maskData:    ImageData
}

function getCanvasPoint(
  e: MouseEvent | Touch,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect   = canvas.getBoundingClientRect()
  const scaleX = canvas.width  / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  }
}

function hexToRgb(hex: string): string {
  const h    = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r    = parseInt(full.slice(0, 2), 16)
  const g    = parseInt(full.slice(2, 4), 16)
  const b    = parseInt(full.slice(4, 6), 16)
  return `${r},${g},${b}`
}

function drawStroke(
  ctx:       CanvasRenderingContext2D,
  from:      { x: number; y: number },
  to:        { x: number; y: number },
  lineWidth: number,
  style:     string,
  alpha:     number,
) {
  ctx.save()
  ctx.globalAlpha      = alpha
  ctx.strokeStyle      = style
  ctx.lineWidth        = lineWidth
  ctx.lineCap          = 'round'
  ctx.lineJoin         = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x,   to.y)
  ctx.stroke()
  ctx.restore()
}

const RecolorCanvas = forwardRef<RecolorCanvasHandle, RecolorCanvasProps>(
  function RecolorCanvas(
    { imageUrl, brushSize, brushColor, onStroke, disabled = false },
    ref,
  ) {
    const visibleRef  = useRef<HTMLCanvasElement>(null)
    const maskRef     = useRef<HTMLCanvasElement>(null)
    const imgRef      = useRef<HTMLImageElement | null>(null)
    const painting    = useRef(false)
    const lastPoint   = useRef<{ x: number; y: number } | null>(null)

    const [strokeCount, setStrokeCount] = useState(0)
    const [zoomLevel, setZoomLevel]     = useState(1.0)
    const [canUndo, setCanUndo]         = useState(false)
    const [canRedo, setCanRedo]         = useState(false)

    // History stacks
    const historyStack = useRef<HistorySnapshot[]>([])
    const redoStack    = useRef<HistorySnapshot[]>([])

    const MAX_HISTORY = 20

    const updateHistoryStates = useCallback(() => {
      setCanUndo(historyStack.current.length > 0)
      setCanRedo(redoStack.current.length > 0)
    }, [])

    const pushSnapshot = useCallback(() => {
      const visible = visibleRef.current
      const mask    = maskRef.current
      if (!visible || !mask) return

      const vCtx = visible.getContext('2d')
      const mCtx = mask.getContext('2d')
      if (!vCtx || !mCtx) return

      const snapshot: HistorySnapshot = {
        visibleData: vCtx.getImageData(0, 0, visible.width, visible.height),
        maskData:    mCtx.getImageData(0, 0, mask.width, mask.height),
      }

      historyStack.current.push(snapshot)
      if (historyStack.current.length > MAX_HISTORY) {
        historyStack.current.shift()
      }
      redoStack.current = []
      updateHistoryStates()
    }, [updateHistoryStates])

    const handleUndo = useCallback(() => {
      if (historyStack.current.length === 0) return
      const visible = visibleRef.current
      const mask    = maskRef.current
      if (!visible || !mask) return

      const vCtx = visible.getContext('2d')
      const mCtx = mask.getContext('2d')
      if (!vCtx || !mCtx) return

      // Save current state to redo
      const currentSnapshot: HistorySnapshot = {
        visibleData: vCtx.getImageData(0, 0, visible.width, visible.height),
        maskData:    mCtx.getImageData(0, 0, mask.width, mask.height),
      }
      redoStack.current.push(currentSnapshot)

      // Restore last state
      const prev = historyStack.current.pop()!
      vCtx.putImageData(prev.visibleData, 0, 0)
      mCtx.putImageData(prev.maskData, 0, 0)

      setStrokeCount(c => Math.max(0, c - 1))
      updateHistoryStates()
    }, [updateHistoryStates])

    const handleRedo = useCallback(() => {
      if (redoStack.current.length === 0) return
      const visible = visibleRef.current
      const mask    = maskRef.current
      if (!visible || !mask) return

      const vCtx = visible.getContext('2d')
      const mCtx = mask.getContext('2d')
      if (!vCtx || !mCtx) return

      // Save current state to history
      const currentSnapshot: HistorySnapshot = {
        visibleData: vCtx.getImageData(0, 0, visible.width, visible.height),
        maskData:    mCtx.getImageData(0, 0, mask.width, mask.height),
      }
      historyStack.current.push(currentSnapshot)

      // Restore redo state
      const next = redoStack.current.pop()!
      vCtx.putImageData(next.visibleData, 0, 0)
      mCtx.putImageData(next.maskData, 0, 0)

      setStrokeCount(c => c + 1)
      updateHistoryStates()
    }, [updateHistoryStates])

    // Load image & size canvases
    useEffect(() => {
      const visible = visibleRef.current
      const mask    = maskRef.current
      if (!visible || !mask) return

      const img       = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imgRef.current = img

        visible.width  = img.naturalWidth
        visible.height = img.naturalHeight
        mask.width     = img.naturalWidth
        mask.height    = img.naturalHeight

        // Reset mask to solid black
        const mCtx = mask.getContext('2d')!
        mCtx.fillStyle = '#000'
        mCtx.fillRect(0, 0, mask.width, mask.height)

        // Draw base image on visible canvas
        const vCtx = visible.getContext('2d')!
        vCtx.drawImage(img, 0, 0)

        // Reset stacks
        historyStack.current = []
        redoStack.current    = []
        setStrokeCount(0)
        updateHistoryStates()
      }
      img.src = imageUrl
    }, [imageUrl, updateHistoryStates])

    // Core paint segment
    const paintSegment = useCallback(
      (from: { x: number; y: number }, to: { x: number; y: number }) => {
        const visible = visibleRef.current
        const mask    = maskRef.current
        if (!visible || !mask) return

        const rect      = visible.getBoundingClientRect()
        const scale     = visible.width / rect.width
        const lineWidth = brushSize * scale

        // 1. Mask
        const mCtx = mask.getContext('2d')!
        drawStroke(mCtx, from, to, lineWidth, '#ffffff', 1.0)

        // 2. Visible
        const vCtx = visible.getContext('2d')!
        const rgb  = hexToRgb(brushColor)
        drawStroke(vCtx, from, to, lineWidth, `rgba(${rgb}, 0.55)`, 1.0)
      },
      [brushSize, brushColor],
    )

    // Input handlers
    const startPainting = useCallback((e: MouseEvent | Touch) => {
      if (disabled) return
      pushSnapshot() // Save snapshot before stroke
      painting.current  = true
      const pt          = getCanvasPoint(e, visibleRef.current!)
      lastPoint.current = pt
      paintSegment(pt, pt)
    }, [disabled, paintSegment, pushSnapshot])

    const continuePainting = useCallback((e: MouseEvent | Touch) => {
      if (!painting.current || disabled) return
      const pt   = getCanvasPoint(e, visibleRef.current!)
      const last = lastPoint.current ?? pt
      paintSegment(last, pt)
      lastPoint.current = pt
    }, [disabled, paintSegment])

    const stopPainting = useCallback(() => {
      if (painting.current) {
        painting.current  = false
        lastPoint.current = null
        setStrokeCount(c => c + 1)
        onStroke?.()
      }
    }, [onStroke])

    // Event listeners
    useEffect(() => {
      const canvas = visibleRef.current
      if (!canvas) return

      const onMD = (e: MouseEvent) => { e.preventDefault(); startPainting(e) }
      const onMM = (e: MouseEvent) => { e.preventDefault(); continuePainting(e) }
      const onMU = () => stopPainting()
      const onML = () => stopPainting()
      const onTS = (e: TouchEvent) => { e.preventDefault(); startPainting(e.touches[0]) }
      const onTM = (e: TouchEvent) => { e.preventDefault(); continuePainting(e.touches[0]) }
      const onTE = () => stopPainting()

      canvas.addEventListener('mousedown',  onMD, { passive: false })
      canvas.addEventListener('mousemove',  onMM, { passive: false })
      canvas.addEventListener('mouseup',    onMU)
      canvas.addEventListener('mouseleave', onML)
      canvas.addEventListener('touchstart', onTS, { passive: false })
      canvas.addEventListener('touchmove',  onTM, { passive: false })
      canvas.addEventListener('touchend',   onTE)

      return () => {
        canvas.removeEventListener('mousedown',  onMD)
        canvas.removeEventListener('mousemove',  onMM)
        canvas.removeEventListener('mouseup',    onMU)
        canvas.removeEventListener('mouseleave', onML)
        canvas.removeEventListener('touchstart', onTS)
        canvas.removeEventListener('touchmove',  onTM)
        canvas.removeEventListener('touchend',   onTE)
      }
    }, [startPainting, continuePainting, stopPainting])

    // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (disabled) return
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault()
            handleRedo()
          } else {
            e.preventDefault()
            handleUndo()
          }
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault()
          handleRedo()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [disabled, handleUndo, handleRedo])

    // Imperative handle
    useImperativeHandle(ref, () => ({
      getMaskBlob: () =>
        new Promise<Blob>((resolve, reject) => {
          const mask = maskRef.current
          if (!mask) return reject(new Error('Mask canvas not ready'))
          mask.toBlob(
            b => b ? resolve(b) : reject(new Error('Failed to export mask')),
            'image/png',
          )
        }),

      clearMask: () => {
        const mask    = maskRef.current
        const visible = visibleRef.current
        const img     = imgRef.current
        if (!mask || !visible || !img) return

        pushSnapshot()

        const mCtx = mask.getContext('2d')!
        mCtx.fillStyle = '#000'
        mCtx.fillRect(0, 0, mask.width, mask.height)

        const vCtx = visible.getContext('2d')!
        vCtx.clearRect(0, 0, visible.width, visible.height)
        vCtx.drawImage(img, 0, 0)

        setStrokeCount(0)
      },

      hasMask: () => strokeCount > 0,
      undo:    handleUndo,
      redo:    handleRedo,
      canUndo: historyStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    }), [strokeCount, handleUndo, handleRedo, pushSnapshot])

    // Custom cursor
    const rgb = hexToRgb(brushColor)
    const cursorSize = Math.max(brushSize, 8)
    const cursorSvg  = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 ${cursorSize} ${cursorSize}">` +
      `<circle cx="${cursorSize / 2}" cy="${cursorSize / 2}" r="${cursorSize / 2 - 1.5}" ` +
      `fill="rgba(${rgb},0.35)" stroke="rgba(${rgb},1)" stroke-width="2"/>` +
      `</svg>`,
    )
    const cursorStyle = disabled
      ? 'not-allowed'
      : `url("data:image/svg+xml,${cursorSvg}") ${cursorSize / 2} ${cursorSize / 2}, crosshair`

    return (
      <div className="relative w-full rounded-xl border border-border bg-checker shadow-md select-none overflow-auto custom-scrollbar">
        {/* Floating Controls Overlay (Undo, Redo, Zoom) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 p-1 bg-black/65 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo || disabled}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L4.859 6h7.641a6.5 6.5 0 016.5 6.5v2.25a.75.75 0 01-1.5 0V12.5a5 5 0 00-5-5H4.859l2.909 2.708a.75.75 0 11-1.036 1.084l-4.25-3.956a.75.75 0 010-1.084l4.25-3.956a.75.75 0 011.061.036z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo || disabled}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06L15.141 6H7.5a6.5 6.5 0 00-6.5 6.5v2.25a.75.75 0 001.5 0V12.5a5 5 0 015-5h7.641l-2.909 2.708a.75.75 0 001.036 1.084l4.25-3.956a.75.75 0 000-1.084l-4.25-3.956a.75.75 0 00-1.061.036z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="w-px h-4 bg-white/20 my-auto mx-0.5" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.max(1, z - 0.5))}
            disabled={zoomLevel <= 1 || disabled}
            title="Zoom Out"
            className="p-1.5 rounded-md text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6 9a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 016 9z" clipRule="evenodd" />
            </svg>
          </button>

          <span className="text-[11px] font-mono font-medium text-white/90 px-1">
            {Math.round(zoomLevel * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.min(4, z + 0.5))}
            disabled={zoomLevel >= 4 || disabled}
            title="Zoom In"
            className="p-1.5 rounded-md text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M8.25 6.75a.75.75 0 011.5 0v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Reset Zoom */}
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="text-[10px] font-semibold text-white/80 hover:text-white px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Scalable Container */}
        <div
          className="w-full flex items-center justify-center transition-transform duration-200 ease-out origin-top-left"
          style={{ width: `${zoomLevel * 100}%` }}
        >
          {/* Visible canvas */}
          <canvas
            ref={visibleRef}
            className="w-full h-auto block"
            style={{ cursor: cursorStyle, touchAction: 'none' }}
            aria-label="Paint canvas"
            role="img"
          />
        </div>

        {/* Mask canvas (hidden) */}
        <canvas ref={maskRef} className="hidden" aria-hidden="true" />

        {/* Stroke badge */}
        {strokeCount > 0 && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium
              bg-black/65 text-white backdrop-blur-md border border-white/10 shadow-md pointer-events-none"
            aria-live="polite"
          >
            {strokeCount} stroke{strokeCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Painting hint */}
        {strokeCount === 0 && !disabled && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full
              bg-black/65 text-white text-xs font-medium backdrop-blur-md border border-white/10 shadow-md pointer-events-none
              whitespace-nowrap"
            aria-hidden="true"
          >
            🎨 Paint over the area to recolour
          </div>
        )}

        {/* Disabled overlay */}
        {disabled && (
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]
              flex items-center justify-center rounded-xl z-20"
            aria-hidden="true"
          >
            <div className="bg-surface/90 backdrop-blur-sm rounded-lg px-3.5 py-2
              text-xs text-secondary font-medium shadow-sm border border-border">
              Processing...
            </div>
          </div>
        )}
      </div>
    )
  },
)

export default RecolorCanvas
