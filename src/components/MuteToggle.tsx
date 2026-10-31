import React, { useState } from 'react';
import { getMutePreference, setMutePreference, type StorageLike } from '../lib/local-state';

export interface MuteToggleProps {
  storage?: StorageLike | null;
  onChange?: (muted: boolean) => void;
}

/**
 * Persistent mute control shown on every child practice screen (Task 7.10).
 * Persists preference per device via `local-state.ts`.
 */
export function MuteToggle({ storage, onChange }: MuteToggleProps) {
  const [muted, setMuted] = useState<boolean>(() => getMutePreference(storage));

  const handleToggle = () => {
    const next = !muted;
    setMuted(next);
    setMutePreference(next, storage);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      aria-pressed={muted}
      data-testid="mute-toggle"
      style={{
        minWidth: '48px',
        minHeight: '48px',
        padding: '10px',
        borderRadius: '14px',
        border: '2px solid #D5CFC2',
        backgroundColor: '#FAF6EE',
        color: '#234E52',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {muted ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M11 5L6 9H2V15H6L11 19V5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="23" y1="9" x2="17" y2="15" stroke="#E06D53" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="9" x2="23" y2="15" stroke="#E06D53" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M11 5L6 9H2V15H6L11 19V5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53"
            stroke="#1E8A8A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

