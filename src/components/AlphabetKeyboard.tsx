import React from 'react';
import { sortTilesAlphabetically, type LetterTile } from '../lib/letter-bank';
import { MaterialIcon } from './MaterialIcon';

export interface AlphabetKeyboardProps {
  tiles: LetterTile[];
  consumedTileIds: ReadonlySet<string>;
  shakingTileId?: string | null;
  disabled?: boolean;
  onTileTap: (tile: LetterTile) => void;
  onBackspace?: () => void;
  onReset?: () => void;
}

/**
 * Interactive Tactile Letter Keyboard built from `UI_TEMPLATES/kids_spelling_word_game` (PRD 4.2 #20-22, Tasks 6.4, 10.5, 13.1, 13.2).
 * - Tiles are arranged strictly in alphabetical order (never QWERTY).
 * - Every tile is at least 52x52 CSS pixels (>= 48x48 minimum) with >= 8px spacing.
 * - Includes Backspace and a neutral-coloured Reset control (replaces the template's red `text-error` styling per Task 10.5).
 */
export function AlphabetKeyboard({
  tiles,
  consumedTileIds,
  shakingTileId = null,
  disabled = false,
  onTileTap,
  onBackspace,
  onReset,
}: AlphabetKeyboardProps) {
  const orderedTiles = sortTilesAlphabetically(tiles);

  return (
    <div
      data-testid="alphabet-keyboard"
      role="group"
      aria-label="Letter bank"
      style={{
        backgroundColor: '#e7eeff',
        borderRadius: '24px',
        padding: '14px',
        boxShadow: '0 6px 0 0 #cad8ee',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        <span
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            color: '#514532',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <MaterialIcon name="touch_app" size={16} color="#514532" />
          <span>Tap letters to spell</span>
        </span>
        {onReset && (
          <button
            type="button"
            id="clearBtn"
            data-testid="reset-letters-button"
            disabled={disabled}
            onClick={onReset}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: '#514532',
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: disabled ? 'default' : 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
            }}
          >
            <MaterialIcon name="restart_alt" size={16} color="#514532" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '10px',
        }}
      >
        {orderedTiles.map((tile) => {
          const isConsumed = consumedTileIds.has(tile.id);
          const isShaking = shakingTileId === tile.id;
          const isTileDisabled = disabled || isConsumed;

          return (
            <button
              key={tile.id}
              type="button"
              disabled={isTileDisabled}
              data-testid={`letter-tile-${tile.id}`}
              data-letter={tile.letter}
              data-consumed={isConsumed ? 'true' : 'false'}
              data-shaking={isShaking ? 'true' : 'false'}
              onClick={() => {
                if (!isTileDisabled) {
                  onTileTap(tile);
                }
              }}
              style={{
                minWidth: '52px',
                minHeight: '56px',
                height: '56px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: isConsumed ? '#d9e3f9' : '#ffffff',
                color: '#121c2c',
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontSize: '26px',
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: isConsumed ? 'none' : '0 5px 0 0 #bdcef0',
                opacity: isConsumed ? 0.25 : 1,
                cursor: isTileDisabled ? 'default' : 'pointer',
                transform: isShaking ? 'rotate(-6deg) translateX(-4px)' : 'none',
                transition: 'transform 150ms ease-in-out, opacity 180ms ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
              }}
            >
              {tile.letter}
            </button>
          );
        })}

        {onBackspace && (
          <button
            type="button"
            id="backspaceBtn"
            aria-label="Backspace"
            data-testid="backspace-button"
            disabled={disabled}
            onClick={onBackspace}
            style={{
              minWidth: '52px',
              minHeight: '56px',
              height: '56px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#dee8ff',
              color: '#121c2c',
              boxShadow: '0 5px 0 0 #b5c9e6',
              cursor: disabled ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcon name="backspace" size={24} color="#121c2c" />
          </button>
        )}
      </div>
    </div>
  );
}
