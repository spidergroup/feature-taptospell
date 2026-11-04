import React from 'react';
import { MaterialIcon } from './MaterialIcon';

export interface CelebrationScreenProps {
  roundPointsEarned?: number;
  leveledUpTo?: number | null;
  levelName?: string;
  onOneMoreRound: () => void;
  onAllDone: () => void;
}

/**
 * End-of-round celebration screen in `DESIGN.md` style (PRD 4.6, 6.1; Tasks 8.1, 8.2, 8.5, 10.7, 15.5).
 * Shows stars earned this round, a "New level!" banner when the child moved up,
 * and two equally sized, equally weighted buttons ("One more round" and "All done")
 * with neither pre-selected or visually dominant.
 */
export function CelebrationScreen({
  roundPointsEarned,
  leveledUpTo,
  levelName,
  onOneMoreRound,
  onAllDone,
}: CelebrationScreenProps) {
  const equalButtonStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '58px',
    padding: '14px 24px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#121c2c',
    boxShadow: '0 6px 0 0 #006399',
    fontFamily: 'Rubik, system-ui, sans-serif',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
  };

  return (
    <main
      data-testid="celebration-screen"
      style={{
        minHeight: '100vh',
        maxWidth: '440px',
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#dfe7f7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        fontFamily: '"Nunito Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '9999px',
          backgroundColor: '#ffdea8',
          boxShadow: '0 8px 0 0 #ffb800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcon name="star" size={64} color="#ffb800" />
      </div>

      <h1
        style={{
          fontFamily: 'Rubik, system-ui, sans-serif',
          fontSize: '36px',
          fontWeight: 800,
          color: '#121c2c',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Nice work!
      </h1>

      {typeof roundPointsEarned === 'number' && roundPointsEarned > 0 && (
        <div
          data-testid="round-stars-earned"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffb800',
            color: '#271900',
            padding: '8px 20px',
            borderRadius: '9999px',
            boxShadow: '0 4px 0 0 #6b4c00',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          <MaterialIcon name="star" size={22} color="#271900" />
          <span>{`+${roundPointsEarned} Stars earned!`}</span>
        </div>
      )}

      {leveledUpTo && (
        <div
          data-testid="new-level-banner"
          style={{
            backgroundColor: '#ebdcff',
            color: '#270058',
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: '0 4px 0 0 #bca1e8',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 800,
            textAlign: 'center',
          }}
        >
          {`New level! Level ${leveledUpTo}${levelName ? ` • ${levelName}` : ''}`}
        </div>
      )}

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginTop: '8px',
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
