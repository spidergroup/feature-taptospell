import React from 'react';

export interface ProgressBarProps {
  /** Number of items completed (0 to total) */
  completed: number;
  /** Total items in the session or grade */
  total: number;
}

/**
 * Child-facing tactile candy-striped progress bar (Tasks 5.4, 13.1).
 * Strictly fill-only — renders no numbers, no percentage text, and no score attributes inside the bar.
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
        position: 'relative',
        width: '100%',
        height: '20px',
        backgroundColor: '#d9e3f9',
        borderRadius: '9999px',
        padding: '4px',
        boxShadow: 'inset 0 3px 5px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="child-progress-fill"
        style={{
          position: 'relative',
          width: widthStyle,
          height: '100%',
          backgroundColor: '#04a8ff',
          borderRadius: '9999px',
          boxShadow: '0 2px 0 0 #0077b6',
          transition: 'width 350ms ease-out',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.25,
            backgroundImage:
              'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 10px, transparent 10px, transparent 20px)',
          }}
        />
      </div>
    </div>
  );
}
