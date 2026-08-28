import React, { useState, useRef, useEffect } from 'react'
import UploadZone from '../components/UploadZone'
import DownloadButton from '../components/DownloadButton'
import SendToMenu from '../components/SendToMenu'
import CustomSlider from '../components/CustomSlider'
import { useActiveImage } from '../contexts/ActiveImageContext'

export default function MagicEraserPage() {
  const { activeFile, activePreviewUrl, setActiveImage, setOutput } = useActiveImage()

  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState<number>(30)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImgRef = useRef<HTMLImageElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const inpaintPointsRef = useRef<{ x: number; y: number; radius: number }[]>([])
  const inpaintOriginalBlobRef = useRef<Blob | null>(null)

  // Sync with global ActiveImage context
  useEffect(() => {
    if (activeFile && activePreviewUrl) {
      setOriginalUrl(activePreviewUrl)
    }
  }, [activeFile, activePreviewUrl])

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setActiveImage(file, url)
    setOriginalUrl(url)
    setResultUrl(null)
    setError(null)
  }

  const reset = () => {
    setActiveImage(null, null)
    setOriginalUrl(null)
    setResultUrl(null)
    setError(null)
  }

  useEffect(() => {
    const sourceUrl = resultUrl || originalUrl
    if (!sourceUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      originalImgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return

      const MAX_WIDTH = 800
      const MAX_HEIGHT = 600
      let width = img.naturalWidth
      let height = img.naturalHeight

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }
      if (height > MAX_HEIGHT) {
        width = Math.round((width * MAX_HEIGHT) / height)
        height = MAX_HEIGHT
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
    }
    img.src = sourceUrl
  }, [originalUrl, resultUrl])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const drawStroke = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(255, 0, 128, 0.5)'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    inpaintPointsRef.current.push({ x, y, radius: brushSize / 2 })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true
    inpaintPointsRef.current = []
    const canvas = canvasRef.current
    if (canvas) {
      canvas.toBlob((blob) => {
        inpaintOriginalBlobRef.current = blob
      }, 'image/png')
    }
    const coords = getCanvasCoords(e)
    drawStroke(coords.x, coords.y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const coords = getCanvasCoords(e)
    drawStroke(coords.x, coords.y)
  }

  const handleMouseUp = async () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    if (inpaintPointsRef.current.length === 0 || !inpaintOriginalBlobRef.current) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', inpaintOriginalBlobRef.current, 'image.png')
      formData.append('mask_points', JSON.stringify(inpaintPointsRef.current))

      const token = localStorage.getItem('bgr_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = 'Bearer ' + token
      }

      const res = await fetch('http://localhost:8000/api/inpaint', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to remove object. Please try again.')
      const data = await res.json()

      const fullResultUrl = 'http://localhost:8000' + data.download_url
      setResultUrl(fullResultUrl)
      
      // Update global output for "Send To..."
      setOutput(fullResultUrl, 'magic_eraser_result.png')

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during inpainting.')
      const img = originalImgRef.current
      const canvas = canvasRef.current
      if (img && canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (!originalUrl) {
    return (
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4 w-full">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center mb-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-magenta to-magenta-hover pr-2">
                Magic Eraser
              </span>
            </h1>
            <p className="text-lg text-secondary max-w-xl mx-auto leading-relaxed">
              Brush over any unwanted object or person — AI will remove it and fill in the background naturally.
            </p>
          </div>
          
          <div className="w-full max-w-2xl mx-auto shadow-sm rounded-3xl overflow-hidden bg-surface p-1">
            <UploadZone onFile={handleUpload} disabled={false} />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4 w-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Magic Eraser</h1>
            <p className="text-sm text-secondary mt-1">
              Brush over any unwanted object or person — AI will remove it and fill in the background naturally.
            </p>
          </div>

          <div className="flex flex-col gap-4 animate-fade-up">
            <div className="relative flex items-center justify-center overflow-hidden p-4 rounded-xl border border-border bg-surface-raised min-h-[400px]">
              {isProcessing && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-xl">
                  <div className="w-10 h-10 border-4 border-magenta border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-semibold tracking-wide">Applying Magic Eraser...</p>
                  <p className="text-xs text-white/60 mt-1">This may take a few seconds</p>
                </div>
              )}

              {error && (
                <div className="absolute top-4 left-4 right-4 z-40 bg-danger/10 border border-danger/20 p-3 rounded-lg flex items-center gap-2 text-danger">
                  <span className="text-lg">⚠️</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full max-h-full object-contain cursor-crosshair shadow-xl rounded"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap p-4 bg-surface-raised rounded-xl border border-border">
              <p className="text-sm text-secondary">Draw over the object to remove, then release.</p>
              <div className="flex items-center gap-2">
                <button onClick={reset} className="btn-ghost text-sm">
                  New image
                </button>
                {resultUrl && (
                  <>
                    <SendToMenu excludeRoute="/magic-eraser" />
                    <DownloadButton downloadUrl={resultUrl} filename="magic_eraser_result.png" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4 self-start">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-bold text-primary mb-4">Brush Settings</h3>
            <CustomSlider
              label="Brush Size"
              value={brushSize}
              min={5}
              max={150}
              unit="px"
              presets={[10, 30, 60, 100]}
              onChange={setBrushSize}
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-surface-raised border border-border px-3.5 py-3">
            <p className="text-xs text-muted leading-relaxed">
              Paint over the object to remove. Use a brush slightly larger than the object for best AI results. The first use may take a moment as the AI model loads.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

