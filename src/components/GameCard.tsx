import React from 'react';
import { MaterialIcon } from './MaterialIcon';

export interface GameCardProps {
  mode: 'spelling' | 'reading';
  title: string;
  description: string;
  subtitle: string;
  badgeText: string;
  pointsBadgeText: string;
  imageSrc: string;
  disabled?: boolean;
  comingSoonLabel?: string;
  loading?: boolean;
  onPlayNow?: () => void;
}

/**
 * Game card component built from `UI_TEMPLATES/home_page` "Suggested Daily Game" card (PRD 4.1 #3-4, Task 11.3):
 * - Spelling card is active with a chunky 3D push-button "Play Now" button.
 * - Reading card is visibly shown but disabled, labelled "Coming in v2.0", and cannot be tapped.
 */
export function GameCard({
  mode,
  title,
  description,
  subtitle,
  badgeText,
  pointsBadgeText,
  imageSrc,
  disabled = false,
  comingSoonLabel = 'Coming in v2.0',
  loading = false,
  onPlayNow,
}: GameCardProps) {
  return (
    <div
      data-testid={`game-card-${mode}`}
      data-disabled={disabled ? 'true' : 'false'}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: disabled ? '#f0f3ff' : '#e7eeff',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 10px 24px -6px rgba(39, 49, 66, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: disabled ? 0.85 : 1,
      }}
    >
      {/* Decorative background accent circle */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          width: '144px',
          height: '144px',
          borderRadius: '9999px',
          backgroundColor: '#ebdcff',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: disabled ? '#d9e3f9' : '#ffb800',
              color: disabled ? '#514532' : '#6b4c00',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: disabled ? '0 2px 0 0 #d0daf1' : '0 2px 0 0 #6b4c00',
            }}
          >
            <MaterialIcon name="bolt" size={18} />
          </span>
          <span
            style={{
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              color: disabled ? '#514532' : '#7c5800',
            }}
          >
            {badgeText}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor: '#ffffff',
            color: '#7825ea',
            padding: '4px 12px',
            borderRadius: '9999px',
            boxShadow: '0 2px 0 0 #d9e3f9',
          }}
        >
          {disabled ? comingSoonLabel : pointsBadgeText}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 0 #d0daf1',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <img
            src={imageSrc}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '14px',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              color: '#121c2c',
              lineHeight: 1.25,
            }}
          >
            {title}
          </span>
          <p
            style={{
              fontFamily: '"Nunito Sans", system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              color: '#514532',
              margin: '2px 0 0 0',
            }}
          >
            {description}
          </p>
          <span
            style={{
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              color: '#006399',
              marginTop: '4px',
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>

      {disabled ? (
        <div
          data-testid={`game-card-disabled-badge-${mode}`}
          aria-disabled="true"
          style={{
            marginTop: '8px',
            width: '100%',
            minHeight: '58px',
            backgroundColor: '#d9e3f9',
            color: '#514532',
            borderRadius: '18px',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            boxShadow: '0 4px 0 0 #d0daf1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 1,
            userSelect: 'none',
          }}
        >
          <span>{comingSoonLabel}</span>
        </div>
      ) : (
        <button
          type="button"
          id="quickPlayBtn"
          data-testid="play-now-spelling-button"
          disabled={loading}
          onClick={onPlayNow}
          style={{
            marginTop: '8px',
            width: '100%',
            minHeight: '58px',
            backgroundColor: '#ffb800',
            color: '#271900',
            border: 'none',
            borderRadius: '18px',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            boxShadow: '0 6px 0 0 #6b4c00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: loading ? 'wait' : 'pointer',
            zIndex: 1,
          }}
        >
          <MaterialIcon name="play_arrow" size={26} color="#271900" />
          <span>{loading ? 'Starting...' : 'Play Now'}</span>
        </button>
      )}
    </div>
  );
}

