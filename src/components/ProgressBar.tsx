import React from 'react';

export interface ProgressBarProps {
  /** Number of items completed (0 to total) */
  completed: number;
  /** Total items in the session or grade */
  total: number;
}

/**
 * Child-facing progress bar (Task 5.4).
 * Strictly fill-only — renders no numbers, no percentage text, and no score attributes.
 */
export function ProgressBar({ completed, total }: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const clampedRatio = Math.max(0, Math.min(1, completed / safeTotal));
  const widthStyle = `${Math.round(clampedRatio * 100)}%`;

  return (
    <div
      data-testid="child-progress-bar"
      aria-label="Practice progress"
      style={{
        width: '100%',
        height: '10px',
        backgroundColor: '#E6E1D6',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="child-progress-fill"
        style={{
          width: widthStyle,
          height: '100%',
          backgroundColor: '#1E8A8A',
          borderRadius: '9999px',
          transition: 'width 240ms ease-out',
        }}
      />
    </div>
  );
}

