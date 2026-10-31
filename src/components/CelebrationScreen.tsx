import React from 'react';

export interface CelebrationScreenProps {
  onOneMoreRound: () => void;
  onAllDone: () => void;
}

/**
 * End-of-session celebration screen (Screen 6 mockup — Tasks 8.1, 8.2, 8.5).
 * Offers two equally sized, equally weighted buttons ("One more round" and "All done")
 * with neither pre-selected or visually dominant, and never auto-triggers a new session.
 */
export function CelebrationScreen({ onOneMoreRound, onAllDone }: CelebrationScreenProps) {
  const equalButtonStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '56px',
    padding: '14px 24px',
    borderRadius: '18px',
    border: '2px solid #1E8A8A',
    backgroundColor: '#FFFFFF',
    color: '#1D3537',
    fontSize: '1.25rem',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
  };

  return (
    <main
      data-testid="celebration-screen"
      style={{
        minHeight: '100vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#FAF6EE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '9999px',
          backgroundColor: '#FFF3D6',
          border: '3px solid #E06D53',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3.5rem',
        }}
      >
        ★
      </div>

      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#1D3537',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Nice work!
      </h1>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginTop: '12px',
        }}
      >
        <button
          type="button"
          data-testid="one-more-round-button"
          onClick={onOneMoreRound}
          style={equalButtonStyle}
        >
          One more round
        </button>
        <button
          type="button"
          data-testid="all-done-button"
          onClick={onAllDone}
          style={equalButtonStyle}
        >
          All done
        </button>
      </div>
    </main>
  );
}

