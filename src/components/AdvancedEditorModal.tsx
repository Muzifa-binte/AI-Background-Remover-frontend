import React, { useState, useRef, useEffect, useCallback } from 'react';
import CustomSlider from './CustomSlider';
import Tooltip from './Tooltip';

interface AdvancedEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageUrl: string;
  cutoutImageUrl: string;
  onSaveRefined: (refinedBlob: Blob, previewUrl: string) => void;
}

type ToolMode = 'erase' | 'restore' | 'pan' | 'inpaint';

export default function AdvancedEditorModal({
  isOpen,
  onClose,
  originalImageUrl,
  cutoutImageUrl,
  onSaveRefined,
}: AdvancedEditorModalProps) {
  const [toolMode, setToolMode] = useState<ToolMode>('erase');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);
  const [brushHardness, setBrushHardness] = useState<number>(50);

  // Visual adjustments
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // History state for undo/redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Inpaint State
  const [isProcessing, setIsProcessing] = useState(false);
  const inpaintPointsRef = useRef<{x: number, y: number, radius: number}[]>([]);
  const inpaintOriginalBlobRef = useRef<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const cutoutImgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;

    const originalImg = new Image();
    originalImg.crossOrigin = 'anonymous';
    const cutoutImg = new Image();
    cutoutImg.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const onBothLoaded = () => {
      originalImgRef.current = originalImg;
      cutoutImgRef.current = cutoutImg;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = cutoutImg.naturalWidth || 800;
      canvas.height = cutoutImg.naturalHeight || 600;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cutoutImg, 0, 0);

      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryIndex(0);
    };

    originalImg.onload = () => {
      loadedCount++;
      if (loadedCount === 2) onBothLoaded();
    };
    cutoutImg.onload = () => {
      loadedCount++;
      if (loadedCount === 2) onBothLoaded();
    };

    originalImg.src = originalImageUrl;
    cutoutImg.src = cutoutImageUrl;
  }, [isOpen, originalImageUrl, cutoutImageUrl]);

  const saveHistoryState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), currentData]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(history[newIndex], 0, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(history[newIndex], 0, 0);
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawStroke = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = brushOpacity / 100;

    if (toolMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (toolMode === 'inpaint') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255, 0, 128, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      inpaintPointsRef.current.push({ x, y, radius: brushSize / 2 });
    } else if (toolMode === 'restore' && originalImgRef.current) {
      // Paint from original image into destination
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(originalImgRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    isDrawingRef.current = true;
    
    if (toolMode === 'inpaint') {
      inpaintPointsRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
         canvas.toBlob((blob) => { inpaintOriginalBlobRef.current = blob; }, 'image/png');
      }
    }

    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;
    drawStroke(coords.x, coords.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'pan' && isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    drawStroke(coords.x, coords.y);
    lastPointRef.current = coords;
  };

  const handleMouseUp = async () => {
    if (toolMode === 'pan') {
      setIsPanning(false);
      return;
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      
      if (toolMode === 'inpaint' && inpaintPointsRef.current.length > 0 && inpaintOriginalBlobRef.current) {
        setIsProcessing(true);
        try {
          const formData = new FormData();
          formData.append('file', inpaintOriginalBlobRef.current, 'image.png');
          formData.append('mask_points', JSON.stringify(inpaintPointsRef.current));
          
          const token = localStorage.getItem('token');
          const headers: any = {};
          if (token) headers['Authorization'] = Bearer ;

          const res = await fetch('http://localhost:8000/api/inpaint', {
            method: 'POST',
            headers,
            body: formData
          });

          if (!res.ok) throw new Error('Inpainting failed');
          const data = await res.json();
          
          const newImg = new Image();
          newImg.crossOrigin = 'anonymous';
          newImg.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(newImg, 0, 0);
            }
            saveHistoryState();
            setIsProcessing(false);
          };
          newImg.src = http://localhost:8000;
        } catch (err) {
          console.error(err);
          // Restore canvas
          const prevImg = new Image();
          prevImg.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(prevImg, 0, 0);
                }
            }
            setIsProcessing(false);
          };
          prevImg.src = URL.createObjectURL(inpaintOriginalBlobRef.current);
        }
        return;
      }

      saveHistoryState();
    }
  };

  const handleApplyAndSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create temporary export canvas with filters applied
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    exportCtx.drawImage(canvas, 0, 0);

    exportCanvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onSaveRefined(blob, previewUrl);
        onClose();
      }
    }, 'image/png');
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-up"
    >
      <div className="w-full max-w-6xl h-[90vh] bg-surface border border-border-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden glass-modal">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-magenta/15 text-magenta flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.746 18.746 0 00-3.471 2.987 10.04 10.04 0 014.815 4.81c.972-1.096 1.981-2.27 3.018-3.493l3.384-5.08a2.25 2.25 0 00-.611-3.23A2.25 2.25 0 0020.6 1.5zM9.75 8.75a8.25 8.25 0 00-8.25 8.25c0 1.954.678 3.75 1.815 5.166a.75.75 0 001.077-.075l5.57-6.497A8.25 8.25 0 009.75 8.75z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-primary">Advanced Manual Refinement Canvas</h2>
              <p className="text-xs text-secondary">Touch up edges with Erase & Restore brushes, zoom & visual tuning</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="Undo (Ctrl+Z)">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg border border-border bg-surface hover:border-border-strong text-secondary hover:text-primary disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </Tooltip>

            <Tooltip content="Redo (Ctrl+Y)">
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg border border-border bg-surface hover:border-border-strong text-secondary hover:text-primary disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </Tooltip>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-raised text-xs text-secondary font-medium ml-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyAndSave}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              Apply Refinements
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbar */}
          <div className="w-72 border-r border-border bg-surface-raised/80 p-5 overflow-y-auto space-y-6">
            {/* Tool Selection */}
            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                Refinement Tool
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setToolMode('erase')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    toolMode === 'erase'
                      ? 'bg-magenta text-white font-semibold shadow-sm'
                      : 'text-secondary hover:text-primary hover:bg-surface-raised'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                  <span>Erase BG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolMode('restore')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    toolMode === 'restore'
                      ? 'bg-magenta text-white font-semibold shadow-sm'
                      : 'text-secondary hover:text-primary hover:bg-surface-raised'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.684a1 1 0 01-.633-.632L6.95 5.684z" />
                  </svg>
                  <span>Restore</span>
                </button>


                <button
                  type="button"
                  onClick={() => setToolMode('inpaint')}
                  className={lex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all }
                >
                  <span className="text-lg leading-none">?</span>
                  <span>Magic Eraser</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolMode('pan')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    toolMode === 'pan'
                      ? 'bg-magenta text-white font-semibold shadow-sm'
                      : 'text-secondary hover:text-primary hover:bg-surface-raised'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 2zM10 13a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 13zM2 10a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 012 10zM13 10a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 0113 10z" clipRule="evenodd" />
                  </svg>
                  <span>Pan View</span>
                </button>
              </div>
            </div>

            {/* Brush Settings */}
            <div className="space-y-4 pt-2 border-t border-border">
              <CustomSlider
                label="Brush Size"
                value={brushSize}
                min={5}
                max={150}
                unit="px"
                presets={[10, 30, 60, 100]}
                onChange={setBrushSize}
              />
              <CustomSlider
                label="Brush Opacity"
                value={brushOpacity}
                min={10}
                max={100}
                unit="%"
                presets={[25, 50, 75, 100]}
                onChange={setBrushOpacity}
              />
              <CustomSlider
                label="Hardness"
                value={brushHardness}
                min={0}
                max={100}
                unit="%"
                onChange={setBrushHardness}
              />
            </div>

            {/* Color & Light Adjustments */}
            <div className="space-y-4 pt-2 border-t border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Color & Tone Fine-tuning
              </span>
              <CustomSlider
                label="Brightness"
                value={brightness}
                min={50}
                max={150}
                unit="%"
                presets={[80, 100, 120]}
                onChange={setBrightness}
              />
              <CustomSlider
                label="Contrast"
                value={contrast}
                min={50}
                max={150}
                unit="%"
                presets={[80, 100, 120]}
                onChange={setContrast}
              />
              <CustomSlider
                label="Saturation"
                value={saturation}
                min={0}
                max={200}
                unit="%"
                presets={[0, 50, 100, 150]}
                onChange={setSaturation}
              />
            </div>
          </div>

          {/* Right Canvas Area */}
          <div className="flex-1 bg-checker relative flex items-center justify-center overflow-hidden p-4">
            {isProcessing && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white">
                <div className="w-10 h-10 border-4 border-magenta border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-semibold tracking-wide shadow-sm">Applying Magic Eraser...</p>
              </div>
            )}
            <div
              className="relative shadow-2xl transition-transform duration-75"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  cursor:
                    toolMode === 'pan'
                      ? isPanning
                        ? 'grabbing'
                        : 'grab'
                      : 'crosshair',
                }}
                className="max-w-full max-h-[70vh] object-contain border border-white/20 rounded shadow-xl"
              />
            </div>

            {/* Floating Zoom Bar */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-lg">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-raised text-sm font-bold"
              >
                -
              </button>
              <span className="min-w-[48px] text-center font-mono text-xs font-medium text-primary">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-raised text-sm font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="px-2 py-1 rounded-lg border border-border text-[11px] font-medium text-secondary hover:text-primary hover:bg-surface-raised ml-1"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
