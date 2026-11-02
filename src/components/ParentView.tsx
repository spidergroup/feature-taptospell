import React, { useState } from 'react';
import { GRADE_LABELS } from '../data/words/schema';
import { getSpellingLevelConfig } from '../lib/levels';
import type { ParentProgressSummary } from '../lib/progress';
import { MaterialIcon } from './MaterialIcon';

export interface ParentViewProps {
  summary: ParentProgressSummary;
  baseUrl?: string;
  onSaveLabel?: (newLabel: string) => Promise<void> | void;
}

export function formatRelativeDate(timestampMs: number, nowMs: number = Date.now()): string {
  const diffMs = Math.max(0, nowMs - timestampMs);
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/**
 * Parent progress view at `?parent` in `DESIGN.md` style (PRD 4.8, 6.1; Tasks 8.10–8.12, 10.7, 11.9, 16.9).
 * Shows label (editable via PATCH), grade, current level (number & name), total stars,
 * words mastered vs. remaining, "Working on" chips, "Needed hints" chips,
 * last practised date, last synced date, and "Copy link" + "Share" controls.
 * Exposes nothing identifying beyond the parent's chosen label.
 */
export function ParentView({ summary, baseUrl, onSaveLabel }: ParentViewProps) {
  const [copied, setCopied] = useState(false);
  const [labelValue, setLabelValue] = useState<string>(summary.label ?? '');
  const [displayedLabel, setDisplayedLabel] = useState<string | null>(summary.label ?? null);
  const [savingLabel, setSavingLabel] = useState(false);

  const currentLevel = summary.currentLevel ?? 1;
  const levelCfg = getSpellingLevelConfig(currentLevel);
  const levelName = summary.currentLevelName ?? levelCfg.name;
  const points = summary.points ?? 0;
  const neededHintsWords = summary.neededHintsWords ?? [];
  const lastSyncedAt = summary.lastSyncedAt ?? summary.lastPractisedAt;

  const gradeName = GRADE_LABELS[summary.grade] ?? 'Grade';
  const headingText = displayedLabel ? `${displayedLabel} — ${gradeName}` : gradeName;
  const proportion =
    summary.totalGradeWords > 0
      ? Math.min(100, Math.round((summary.masteredCount / summary.totalGradeWords) * 100))
      : 0;

  const resolvedBase =
    baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://taptospell.com');
  const cleanBase = resolvedBase.replace(/\/$/, '');
  const shareUrl = `${cleanBase}/${summary.slug}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  const handleShareLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'TapToSpell Practice Link',
          text: 'Open this link to start spelling practice!',
          url: shareUrl,
        });
        return;
      }
    } catch {
      // Fall back to copy
    }
    await handleCopyLink();
  };

  const handleLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLabel(true);
    const trimmed = labelValue.trim() || null;
    try {
      if (onSaveLabel) {
        await onSaveLabel(trimmed ?? '');
      } else {
        await fetch(`/api/links/${summary.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: trimmed }),
        });
      }
      setDisplayedLabel(trimmed);
    } finally {
      setSavingLabel(false);
    }
  };

  return (
    <main
      data-testid="parent-view"
      style={{
        minHeight: '100vh',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '28px 20px',
        backgroundColor: '#f0f3ff',
        color: '#121c2c',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: '"Nunito Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 8px 20px -6px rgba(39, 49, 66, 0.08), 0 4px 0 0 #d9e3f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h1
          data-testid="parent-heading"
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '26px',
            fontWeight: 800,
            margin: 0,
            color: '#121c2c',
          }}
        >
          {headingText}
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span
            data-testid="parent-level-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ebdcff',
              color: '#270058',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {`Level ${currentLevel} • ${levelName}`}
          </span>
          <span
            data-testid="parent-stars-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffdea8',
              color: '#271900',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <MaterialIcon name="star" size={16} color="#ffb800" />
            <span>{`${points} Stars`}</span>
          </span>
        </div>

        <p
          data-testid="parent-mastered-summary"
          style={{
            fontSize: '17px',
            color: '#514532',
            margin: 0,
            fontWeight: 700,
          }}
        >
          {`${summary.masteredCount} of ${summary.totalGradeWords} words mastered`}
        </p>

        <div
          style={{
            width: '100%',
            height: '16px',
            backgroundColor: '#d9e3f9',
            borderRadius: '9999px',
            overflow: 'hidden',
            padding: '2px',
          }}
        >
          <div
            data-testid="parent-progress-bar"
            style={{
              width: `${proportion}%`,
              height: '100%',
              backgroundColor: '#04a8ff',
              borderRadius: '9999px',
            }}
          />
        </div>
      </header>

      {/* Editable private label form (PRD 4.1 #10, Task 11.9) */}
      <form
        onSubmit={handleLabelSubmit}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 4px 0 0 #d9e3f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <label
          htmlFor="parent-private-label"
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            color: '#121c2c',
          }}
        >
          Add a name just for you (optional)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="parent-private-label"
            data-testid="parent-label-input"
            type="text"
            placeholder="Jimmy"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            maxLength={40}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '2px solid #d0daf1',
              backgroundColor: '#f9f9ff',
              fontSize: '15px',
              fontWeight: 600,
            }}
          />
          <button
            type="submit"
            disabled={savingLabel}
            data-testid="save-label-button"
            style={{
              minHeight: '44px',
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#cde5ff',
              color: '#003a5d',
              fontFamily: 'Rubik, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: '0 3px 0 0 #006399',
              cursor: 'pointer',
            }}
          >
            {savingLabel ? 'Saving...' : 'Save'}
          </button>
        </div>
        <small style={{ color: '#514532', fontSize: '13px', fontWeight: 600 }}>
          This name is private — it never appears in the link.
        </small>
      </form>

      <section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 4px 0 0 #d9e3f9',
        }}
      >
        <h2
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 0 10px 0',
          }}
        >
          Working on
        </h2>
        {summary.workingOnWords.length === 0 ? (
          <p style={{ color: '#514532', margin: 0, fontWeight: 600 }}>
            No missed words right now.
          </p>
        ) : (
          <div
            data-testid="working-on-chips"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
          >
            {summary.workingOnWords.map((word) => (
              <span
                key={word}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#f0f3ff',
                  border: '1.5px solid #d0daf1',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 4px 0 0 #d9e3f9',
        }}
      >
        <h2
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 0 10px 0',
          }}
        >
          Needed hints
        </h2>
        {neededHintsWords.length === 0 ? (
          <p style={{ color: '#514532', margin: 0, fontWeight: 600 }}>
            No hints needed so far.
          </p>
        ) : (
          <div
            data-testid="needed-hints-chips"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
          >
            {neededHintsWords.map((word) => (
              <span
                key={word}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffdea8',
                  color: '#271900',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 4px' }}>
        <p data-testid="last-practised" style={{ color: '#514532', margin: 0, fontWeight: 700 }}>
          Last practised: {formatRelativeDate(summary.lastPractisedAt)}
        </p>
        <p data-testid="last-synced" style={{ color: '#514532', margin: 0, fontSize: '14px', fontWeight: 600 }}>
          Last synced: {formatRelativeDate(lastSyncedAt)}
        </p>
      </section>

      <footer style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
        <button
          type="button"
          data-testid="copy-link-button"
          onClick={handleCopyLink}
          style={{
            flex: 1,
            minHeight: '54px',
            padding: '12px 20px',
            borderRadius: '18px',
            border: 'none',
            backgroundColor: '#ffb800',
            color: '#271900',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '17px',
            fontWeight: 700,
            boxShadow: '0 6px 0 0 #6b4c00',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Link copied!' : 'Copy link'}
        </button>

        <button
          type="button"
          data-testid="share-link-button"
          onClick={handleShareLink}
          style={{
            flex: 1,
            minHeight: '54px',
            padding: '12px 20px',
            borderRadius: '18px',
            border: 'none',
            backgroundColor: '#cde5ff',
            color: '#003a5d',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '17px',
            fontWeight: 700,
            boxShadow: '0 6px 0 0 #006399',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <MaterialIcon name="share" size={20} color="#003a5d" />
          <span>Share</span>
        </button>
      </footer>
    </main>
  );
}
