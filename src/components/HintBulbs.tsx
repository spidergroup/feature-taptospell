import React from 'react';
import { MaterialIcon } from './MaterialIcon';

export interface HintBulbsProps {
  totalBulbs: number;
  usedBulbs: number;
  disabled?: boolean;
  onUseHint: () => void;
}

/**
 * Light-bulb hint buttons row between the picture card and the letter boxes (PRD 4.4 #36-38, Task 14.4).
 * - Renders `totalBulbs` (`word.length - 1`) buttons, each at least 48x48 CSS pixels.
 * - Used bulbs (`idx < usedBulbs`) are shown in a dimmed/used state and cannot be tapped again.
 * - Tapping an unused bulb triggers `onUseHint()` with zero negative or failure styling.
 */
export function HintBulbs({
  totalBulbs,
  usedBulbs,
  disabled = false,
  onUseHint,
}: HintBulbsProps) {
  if (totalBulbs <= 0) {
    return null;
  }

  return (
    <div
      data-testid="hint-bulbs-row"
      role="group"
      aria-label="Word hints"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      {Array.from({ length: totalBulbs }).map((_, idx) => {
        const isUsed = idx < usedBulbs;
        const isButtonDisabled = disabled || isUsed;

        return (
          <button
            key={idx}
            type="button"
            disabled={isButtonDisabled}
            aria-label={isUsed ? `Hint ${idx + 1} used` : `Use hint ${idx + 1}`}
            data-testid={`hint-bulb-${idx}`}
            data-used={isUsed ? 'true' : 'false'}
            onClick={() => {
              if (!isButtonDisabled) {
                onUseHint();
              }
            }}
            style={{
              minWidth: '50px',
              minHeight: '50px',
              width: '50px',
              height: '50px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: isUsed ? '#e7eeff' : '#ffdea8',
              color: isUsed ? '#837560' : '#7c5800',
              boxShadow: isUsed ? '0 2px 0 0 #d0daf1' : '0 4px 0 0 #ffb800',
              opacity: isUsed ? 0.55 : 1,
              cursor: isButtonDisabled ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 140ms ease, opacity 140ms ease',
            }}
          >
            <MaterialIcon
              name="lightbulb"
              size={26}
              color={isUsed ? '#837560' : '#ffb800'}
            />
          </button>
        );
      })}
    </div>
  );
}

