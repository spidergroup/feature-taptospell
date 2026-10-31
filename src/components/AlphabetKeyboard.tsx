import React from 'react';
import { sortTilesAlphabetically, type LetterTile } from '../lib/letter-bank';

export interface AlphabetKeyboardProps {
  tiles: LetterTile[];
  consumedTileIds: ReadonlySet<string>;
  shakingTileId: string | null;
  onTileTap: (tile: LetterTile) => void;
}

/**
 * On-screen letter bank arranged strictly in alphabetical order (Tasks 6.4, 6.6, 6.7).
 * Every tile is at least 52x52 CSS pixels (>= 48x48 minimum) with 10px spacing (>= 8px minimum).
 * Incorrect tap shakes the tile neutrally without red colouring, X marks, or error text.
 */
export function AlphabetKeyboard({
  tiles,
  consumedTileIds,
  shakingTileId,
  onTileTap,
}: AlphabetKeyboardProps) {
  const orderedTiles = sortTilesAlphabetically(tiles);

  return (
    <div
      data-testid="alphabet-keyboard"
      role="group"
      aria-label="Letter bank"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 4px',
        maxWidth: '360px',
        margin: '0 auto',
      }}
    >
      {orderedTiles.map((tile) => {
        const isConsumed = consumedTileIds.has(tile.id);
        const isShaking = shakingTileId === tile.id;

        return (
          <button
            key={tile.id}
            type="button"
            disabled={isConsumed}
            data-testid={`letter-tile-${tile.id}`}
            data-letter={tile.letter}
            data-consumed={isConsumed ? 'true' : 'false'}
            data-shaking={isShaking ? 'true' : 'false'}
            onClick={() => {
              if (!isConsumed) {
                onTileTap(tile);
              }
            }}
            style={{
              minWidth: '52px',
              minHeight: '52px',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              border: '2px solid #1E8A8A',
              backgroundColor: isConsumed ? '#EFECE4' : '#FFFFFF',
              color: '#1D3537',
              fontSize: '1.65rem',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              opacity: isConsumed ? 0.2 : 1,
              cursor: isConsumed ? 'default' : 'pointer',
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
    </div>
  );
}

