import React from 'react';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  completedCount: number;
  totalCount: number;
}

const clampProgress = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 184,
  strokeWidth = 12,
  completedCount,
  totalCount,
}) => {
  const clamped = clampProgress(progress);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <div className="relative inline-flex items-center justify-center" data-tour="dashboard-progress">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-primary transition-all duration-300"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-semibold text-foreground">
          {completedCount}/{totalCount}
        </p>
        <p className="text-xs text-muted-foreground">required essays</p>
      </div>
    </div>
  );
};

export default ProgressRing;
