interface CustomSliderProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  presets?: number[];
  disabled?: boolean;
}

export default function CustomSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  presets,
  disabled = false,
}: CustomSliderProps) {
  const handleDecrement = () => {
    const next = Math.max(min, value - step);
    onChange(Number(next.toFixed(2)));
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step);
    onChange(Number(next.toFixed(2)));
  };

  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-secondary uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className="w-5 h-5 rounded flex items-center justify-center bg-surface-raised border border-border hover:border-border-strong text-secondary hover:text-primary text-xs transition-colors"
            title="Decrease"
          >
            -
          </button>
          <span className="min-w-[44px] px-1.5 py-0.5 rounded bg-surface-raised border border-border text-center font-mono text-xs font-medium text-primary">
            {value}
            {unit}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className="w-5 h-5 rounded flex items-center justify-center bg-surface-raised border border-border hover:border-border-strong text-secondary hover:text-primary text-xs transition-colors"
            title="Increase"
          >
            +
          </button>
        </div>
      </div>

      <div className="relative flex items-center py-1">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full relative z-10 cursor-pointer"
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {presets.map((preset) => {
            const isSelected = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                disabled={disabled}
                className={`flex-1 py-1 px-1 text-[11px] font-mono rounded border transition-all ${
                  isSelected
                    ? 'bg-magenta/15 border-magenta text-magenta font-semibold'
                    : 'bg-surface border-border text-muted hover:border-border-strong hover:text-secondary'
                }`}
              >
                {preset}
                {unit}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
