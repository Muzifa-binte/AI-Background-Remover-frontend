import React from 'react'

export interface ShadowSettings {
  enabled: boolean;
  type: 'shadow' | 'glow';
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

interface ShadowControlsProps {
  settings: ShadowSettings;
  onChange: (settings: Partial<ShadowSettings>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export default function ShadowControls({ settings, onChange, onReset, disabled }: ShadowControlsProps) {
  const isShadow = settings.type === 'shadow';

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Shadow &amp; Glow</h3>
        <button
          onClick={onReset}
          disabled={disabled}
          className="text-xs text-magenta hover:text-magenta-hover disabled:opacity-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Enable Toggle */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={settings.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            disabled={disabled}
          />
          <div className="w-10 h-5 bg-surface-raised rounded-full border border-border peer-checked:bg-magenta peer-checked:border-magenta transition-colors"></div>
          <div className="absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
        </div>
        <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
          Enable Effect
        </span>
      </label>

      {settings.enabled && (
        <div className="flex flex-col gap-4 animate-fade-up">
          {/* Type Switcher */}
          <div className="flex p-1 bg-surface-raised rounded-lg border border-border">
            <button
              onClick={() => onChange({ type: 'shadow', offsetX: 10, offsetY: 10, blur: 15 })}
              disabled={disabled}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isShadow ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-secondary'
              }`}
            >
              Drop Shadow
            </button>
            <button
              onClick={() => onChange({ type: 'glow', offsetX: 0, offsetY: 0, blur: 20 })}
              disabled={disabled}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !isShadow ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-secondary'
              }`}
            >
              Outer Glow
            </button>
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-secondary">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => onChange({ color: e.target.value })}
                disabled={disabled}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-xs text-muted uppercase">{settings.color}</span>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-secondary">Opacity</label>
              <span className="text-xs text-muted">{settings.opacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.opacity}
              onChange={(e) => onChange({ opacity: parseInt(e.target.value) })}
              disabled={disabled}
              className="w-full accent-magenta"
            />
          </div>

          {/* Blur Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-secondary">Size (Blur)</label>
              <span className="text-xs text-muted">{settings.blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.blur}
              onChange={(e) => onChange({ blur: parseInt(e.target.value) })}
              disabled={disabled}
              className="w-full accent-magenta"
            />
          </div>

          {/* Offsets — shadow only */}
          {isShadow && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-secondary">Distance X</label>
                  <span className="text-xs text-muted">{settings.offsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={settings.offsetX}
                  onChange={(e) => onChange({ offsetX: parseInt(e.target.value) })}
                  disabled={disabled}
                  className="w-full accent-magenta"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-secondary">Distance Y</label>
                  <span className="text-xs text-muted">{settings.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={settings.offsetY}
                  onChange={(e) => onChange({ offsetY: parseInt(e.target.value) })}
                  disabled={disabled}
                  className="w-full accent-magenta"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
