import { useState, useRef, useCallback, useEffect } from 'react';

interface DemoPreset {
  id: string;
  name: string;
  category: string;
  originalUrl: string;
  cutoutUrl: string;
  badge: string;
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'portrait',
    name: 'Fine Hair Strands',
    category: 'Portrait',
    badge: 'BiRefNet Deep Pass',
    originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    cutoutUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'product',
    name: 'E-commerce Sneaker',
    category: 'Product',
    badge: 'Crisp Edge Isolation',
    originalUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    cutoutUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pet',
    name: 'Fluffy Fur Detail',
    category: 'Animals',
    badge: 'Sub-pixel Alpha Matting',
    originalUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    cutoutUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
  },
];

export default function InteractiveDemo() {
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(DEMO_PRESETS[0]);
  const [sliderPosition, setSliderPosition] = useState(50); // percent
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="w-full card bg-surface border border-border p-6 rounded-2xl shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-magenta/10 border border-magenta/20 text-magenta text-[11px] font-semibold uppercase tracking-wider mb-2">
            Interactive AI Demo
          </div>
          <h2 className="text-xl font-display font-bold text-primary">
            Precision Edge Quality Showcase
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Drag the split slider to inspect sub-pixel cutout accuracy and hair strand extraction.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised border border-border rounded-xl self-start sm:self-auto">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPreset.id === preset.id
                  ? 'bg-magenta text-white shadow-sm font-semibold'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              {preset.category}
            </button>
          ))}
        </div>
      </div>

      {/* Split Comparison Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        className="relative w-full h-[360px] sm:h-[440px] rounded-xl overflow-hidden cursor-ew-resize select-none bg-checker shadow-inner border border-border"
      >
        {/* Right side (Background Removed cutout with checkerboard) */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6">
          <img
            src={selectedPreset.cutoutUrl}
            alt="AI Cutout"
            className="max-h-full max-w-full object-contain filter drop-shadow-xl"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        </div>

        {/* Left side (Original Image) clipped by slider */}
        <div
          className="absolute inset-0 overflow-hidden bg-surface"
          style={{ width: `${sliderPosition}%` }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center p-6"
            style={{
              width: containerRef.current?.clientWidth || '100%',
              height: '100%',
            }}
          >
            <img
              src={selectedPreset.originalUrl}
              alt="Original"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* Divider Line & Draggable Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-black shadow-xl border-2 border-magenta flex items-center justify-center pointer-events-auto cursor-ew-resize">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Labels Overlay */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 pointer-events-none z-30">
          Original
        </div>
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-magenta/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 pointer-events-none z-30">
          AI Transparent Cutout
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/70 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span>Sample: <strong className="text-primary">{selectedPreset.name}</strong></span>
        </span>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-raised border border-border">
          {selectedPreset.badge}
        </span>
      </div>
    </div>
  );
}
