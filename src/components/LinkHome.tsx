import React from 'react';
import { ProgressBar } from './ProgressBar';
import { MaterialIcon } from './MaterialIcon';
import { getSpellingLevelConfig } from '../lib/levels';

export interface LinkHomeProps {
  label?: string | null;
  currentLevel: number;
  points: number;
  masteredWordsCount: number;
  totalGradeWordsCount: number;
  onStartSpellingRound: () => void;
}

/**
 * Per-link home screen ("All done" destination and header back-button destination — PRD 4.2 #29, 4.6 #46, Task 13.9).
 * Shows the link's overall progress bar, current level badge, total stars, and a button to start another spelling round.
 * Never navigates to the global home page so a child cannot wander into link creation.
 */
export function LinkHome({
  label,
  currentLevel,
  points,
  masteredWordsCount,
  totalGradeWordsCount,
  onStartSpellingRound,
}: LinkHomeProps) {
  const levelConfig = getSpellingLevelConfig(currentLevel);

  return (
    <main
      data-testid="all-done-home"
      style={{
        minHeight: '100vh',
        maxWidth: '440px',
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#f0f3ff',
        color: '#121c2c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        fontFamily: '"Nunito Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '24px',
          width: '100%',
          boxShadow: '0 10px 24px -6px rgba(39, 49, 66, 0.1), 0 6px 0 0 #d9e3f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        {label && (
          <h1
            style={{
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              margin: 0,
              color: '#121c2c',
            }}
          >
            {label}
          </h1>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div
            data-testid="link-home-level"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ebdcff',
              color: '#270058',
              padding: '8px 16px',
              borderRadius: '9999px',
              boxShadow: '0 3px 0 0 #bca1e8',
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            <MaterialIcon name={levelConfig.icon} size={18} color="#7825ea" />
            <span>{`Level ${levelConfig.id} • ${levelConfig.name}`}</span>
          </div>

          <div
            data-testid="link-home-stars"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffb800',
              color: '#271900',
              padding: '8px 16px',
              borderRadius: '9999px',
              boxShadow: '0 3px 0 0 #6b4c00',
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            <MaterialIcon name="star" size={18} color="#271900" />
            <span>{`${points} Stars`}</span>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <ProgressBar completed={masteredWordsCount} total={totalGradeWordsCount} />
        </div>

        <button
          type="button"
          data-testid="start-writing-button"
          onClick={onStartSpellingRound}
          style={{
            width: '100%',
            minHeight: '58px',
            borderRadius: '18px',
            border: 'none',
            backgroundColor: '#ffb800',
            color: '#271900',
            boxShadow: '0 6px 0 0 #6b4c00',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <MaterialIcon name="play_arrow" size={24} color="#271900" />
          <span>Play Spelling Round</span>
        </button>
      </div>
    </main>
  );
}
