import React, { useState } from 'react';
import { GRADE_LABELS } from '../data/words/schema';
import type { ParentProgressSummary } from '../lib/progress';

export interface ParentViewProps {
  summary: ParentProgressSummary;
  baseUrl?: string;
}

export function formatRelativeDate(timestampMs: number, nowMs: number = Date.now()): string {
  const diffMs = Math.max(0, nowMs - timestampMs);
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/**
 * Parent progress view at `?parent` (Screen 7 mockup — Tasks 8.10, 8.11, 8.12).
 * Shows words mastered vs. total, working-on chips, last practised date, and copy-link control.
 * Exposes nothing identifying beyond the parent's chosen label.
 */
export function ParentView({ summary, baseUrl }: ParentViewProps) {
  const [copied, setCopied] = useState(false);

  const gradeName = GRADE_LABELS[summary.grade] ?? 'Grade';
  const headingText = summary.label ? `${summary.label} — ${gradeName}` : gradeName;
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

  return (
    <main
      data-testid="parent-view"
      style={{
        minHeight: '100vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '28px 24px',
        backgroundColor: '#FAF6EE',
        color: '#1D3537',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header>
        <h1
          data-testid="parent-heading"
          style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}
        >
          {headingText}
        </h1>
        <p
          data-testid="parent-mastered-summary"
          style={{ fontSize: '1.1rem', color: '#375A5E', margin: '0 0 12px 0', fontWeight: 600 }}
        >
          {`${summary.masteredCount} of ${summary.totalGradeWords} words mastered`}
        </p>
        <div
          style={{
            width: '100%',
            height: '14px',
            backgroundColor: '#E6E1D6',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid="parent-progress-bar"
            style={{
              width: `${proportion}%`,
              height: '100%',
              backgroundColor: '#1E8A8A',
              borderRadius: '9999px',
            }}
          />
        </div>
      </header>

      <section>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0' }}>
          Working on
        </h2>
        {summary.workingOnWords.length === 0 ? (
          <p style={{ color: '#5A7174', margin: 0 }}>No missed words right now.</p>
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
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #D5CFC2',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <p data-testid="last-practised" style={{ color: '#375A5E', margin: 0, fontWeight: 500 }}>
          Last practised: {formatRelativeDate(summary.lastPractisedAt)}
        </p>
      </section>

      <footer style={{ marginTop: 'auto' }}>
        <button
          type="button"
          data-testid="copy-link-button"
          onClick={handleCopyLink}
          style={{
            width: '100%',
            minHeight: '52px',
            padding: '12px 20px',
            borderRadius: '16px',
            border: '2px solid #1E8A8A',
            backgroundColor: '#1E8A8A',
            color: '#FFFFFF',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {copied ? 'Link copied!' : 'Copy link'}
        </button>
      </footer>
    </main>
  );
}
