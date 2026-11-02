import React from 'react';
import type { BoxSlotState } from '../lib/hints';

export interface LetterBoxesProps {
  boxes: readonly BoxSlotState[];
  isCelebrationSuccess?: boolean;
  isShaking?: boolean;
}

/**
 * Answer letter boxes adapted from `UI_TEMPLATES/kids_spelling_word_game` (`#letterBoxesRow`) (Tasks 13.1, 14.5, 15.3).
 * - Displays 1-based slot index in the top-left corner, the uppercase/lowercase letter in the centre, and the bottom pill indicator.
 * - Distinct styling for:
 *   - `prefill` / `hint` locked letters (soft violet/gold lock highlight)
 *   - `child` placed letters (white surface with blue shadow)
 *   - `isCelebrationSuccess` (bright sky-blue success state `#cde5ff` with `#006399` shadow)
 * - Strictly zero red or error styling on incorrect answers (`isShaking` gently jiggles neutrally).
 */
export function LetterBoxes({
  boxes,
  isCelebrationSuccess = false,
  isShaking = false,
}: LetterBoxesProps) {
  return (
    <div
      id="letterBoxesRow"
      data-testid="letter-boxes"
      data-shaking={isShaking ? 'true' : 'false'}
      data-success={isCelebrationSuccess ? 'true' : 'false'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        width: '100%',
        transform: isShaking ? 'translateX(-5px)' : 'none',
        transition: 'transform 120ms ease-in-out',
      }}
    >
      {boxes.map((box, idx) => {
        const hasLetter = box.filledLetter.length > 0;
        const isLockedHint = box.source === 'hint';
        const isLockedPrefill = box.source === 'prefill';
        const isLocked = isLockedHint || isLockedPrefill;

        let bgColor = '#ffffff';
        let textColor = '#121c2c';
        let shadowColor = '#c5d7f2';

        if (isCelebrationSuccess) {
          bgColor = '#cde5ff';
          textColor = '#001d32';
          shadowColor = '#006399';
        } else if (isLockedHint) {
          bgColor = '#ebdcff';
          textColor = '#270058';
          shadowColor = '#bca1e8';
        } else if (isLockedPrefill) {
          bgColor = '#ffdea8';
          textColor = '#271900';
          shadowColor = '#e6a700';
        }

        return (
          <div
            key={idx}
            id={`box-${idx}`}
            data-testid={`letter-box-${idx}`}
            data-filled={hasLetter ? 'true' : 'false'}
            data-source={box.source}
            data-locked={isLocked ? 'true' : 'false'}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: boxes.length > 5 ? '54px' : '68px',
              height: boxes.length > 5 ? '64px' : '78px',
              backgroundColor: bgColor,
              color: textColor,
              borderRadius: '18px',
              boxShadow: `0 6px 0 0 ${shadowColor}`,
              transition: 'all 180ms ease',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '5px',
                left: '9px',
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                color: '#837560',
              }}
            >
              {idx + 1}
            </span>
            <span
              className="letter-val"
              style={{
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontSize: boxes.length > 5 ? '26px' : '32px',
                fontWeight: 800,
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {box.filledLetter}
            </span>
            <div
              style={{
                position: 'absolute',
                bottom: '7px',
                width: '26px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: isLocked ? shadowColor : '#d9e3f9',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

