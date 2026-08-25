interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  status?: 'processing' | 'done' | 'error';
}

export default function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  status = 'processing',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background ambient ring glow */}
        <div
          className="absolute inset-0 rounded-full bg-magenta/10 blur-md pointer-events-none"
          style={{ width: size, height: size }}
        />

        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-border/60"
          />

          {/* Animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`transition-all duration-300 ${
              status === 'error'
                ? 'text-danger'
                : status === 'done'
                ? 'text-success'
                : 'text-magenta'
            }`}
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          {status === 'done' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-success animate-scale-in">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z" clipRule="evenodd" />
            </svg>
          ) : status === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-danger animate-scale-in">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
          ) : (
            <>
              <span className="font-mono text-xl font-bold text-primary tracking-tight">
                {Math.round(progress)}%
              </span>
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                Progress
              </span>
            </>
          )}
        </div>
      </div>

      {(label || sublabel) && (
        <div className="text-center max-w-xs">
          {label && <p className="text-sm font-semibold text-primary">{label}</p>}
          {sublabel && <p className="text-xs text-muted mt-0.5">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
