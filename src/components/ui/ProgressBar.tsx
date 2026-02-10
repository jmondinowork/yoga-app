interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function ProgressBar({ value, className = "", showLabel = false, size = "sm" }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-border rounded-full overflow-hidden ${size === "sm" ? "h-1.5" : "h-2.5"}`}>
        <div
          className="h-full bg-button rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted font-medium whitespace-nowrap">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
