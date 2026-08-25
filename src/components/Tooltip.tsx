import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
  delay?: number;
}

export default function Tooltip({
  content,
  shortcut,
  position = 'top',
  children,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#1a1a1e] text-white border border-white/10 shadow-lg animate-scale-in flex items-center gap-1.5 ${positionClasses[position]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/15 text-white/90 rounded border border-white/20">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
