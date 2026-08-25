import CustomSlider from './CustomSlider';
import EnhancedColorPicker from './EnhancedColorPicker';

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
    <div className="flex flex-col gap-5 p-5 rounded-2xl bg-surface border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-primary">Shadow &amp; Glow Generator</h3>
          <p className="text-[11px] text-muted">Add realistic depth or neon edge lighting</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="text-xs font-semibold text-magenta hover:underline disabled:opacity-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Enable Toggle */}
      <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl bg-surface-raised border border-border">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={settings.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            disabled={disabled}
          />
          <div className="w-10 h-5 bg-border rounded-full peer-checked:bg-magenta transition-colors"></div>
          <div className="absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
        </div>
        <span className="text-xs font-bold text-primary select-none">
          {settings.enabled ? 'Effect Active' : 'Enable Shadow / Glow'}
        </span>
      </label>

      {settings.enabled && (
        <div className="flex flex-col gap-5 animate-fade-up">
          {/* Type Switcher */}
          <div className="flex p-1 bg-surface-raised rounded-xl border border-border">
            <button
              type="button"
              onClick={() => onChange({ type: 'shadow', offsetX: 10, offsetY: 10, blur: 15 })}
              disabled={disabled}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isShadow ? 'bg-surface text-magenta shadow-xs' : 'text-muted hover:text-secondary'
              }`}
            >
              Drop Shadow
            </button>
            <button
              type="button"
              onClick={() => onChange({ type: 'glow', offsetX: 0, offsetY: 0, blur: 20 })}
              disabled={disabled}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !isShadow ? 'bg-surface text-magenta shadow-xs' : 'text-muted hover:text-secondary'
              }`}
            >
              Outer Glow
            </button>
          </div>

          {/* Color Picker */}
          <EnhancedColorPicker
            label="Lighting Color"
            color={settings.color}
            onChange={(color) => onChange({ color })}
          />

          {/* Sliders */}
          <CustomSlider
            label="Intensity (Opacity)"
            value={settings.opacity}
            min={0}
            max={100}
            unit="%"
            presets={[25, 50, 75, 100]}
            onChange={(opacity) => onChange({ opacity })}
            disabled={disabled}
          />

          <CustomSlider
            label="Softness / Blur Radius"
            value={settings.blur}
            min={0}
            max={100}
            unit="px"
            presets={[10, 25, 50, 75]}
            onChange={(blur) => onChange({ blur })}
            disabled={disabled}
          />

          {/* Offsets (Drop shadow only) */}
          {isShadow && (
            <div className="space-y-4 pt-2 border-t border-border">
              <CustomSlider
                label="Horizontal Distance (X)"
                value={settings.offsetX}
                min={-100}
                max={100}
                unit="px"
                presets={[-20, 0, 20]}
                onChange={(offsetX) => onChange({ offsetX })}
                disabled={disabled}
              />

              <CustomSlider
                label="Vertical Distance (Y)"
                value={settings.offsetY}
                min={-100}
                max={100}
                unit="px"
                presets={[-20, 0, 20]}
                onChange={(offsetY) => onChange({ offsetY })}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
