import React from 'react';
import { GRADE_LABELS, type GradeNumber } from '../data/words/schema';
import type { RecentLinkEntry } from '../lib/local-state';
import { MaterialIcon } from './MaterialIcon';

export interface ParentsTabProps {
  recentLinks: RecentLinkEntry[];
  selectedGrade: GradeNumber;
  loading?: boolean;
  onOpenParentView: (slug: string) => void;
  onCreateNewLinkForChild: (grade: GradeNumber) => void;
}

/**
 * Parents tab on the home page (PRD 4.1 #17, Task 11.8):
 * Lists practice links held on this device (label, grade, stars, level),
 * opens each link's `?parent` view, and offers "New link for another child".
 */
export function ParentsTab({
  recentLinks,
  selectedGrade,
  loading = false,
  onOpenParentView,
  onCreateNewLinkForChild,
}: ParentsTabProps) {
  return (
    <section
      data-testid="parents-tab"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 8px 20px -6px rgba(39, 49, 66, 0.08)',
        }}
      >
        <h2
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            color: '#121c2c',
            margin: '0 0 6px 0',
          }}
        >
          Your Practice Links
        </h2>
        <p
          style={{
            fontFamily: '"Nunito Sans", system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            color: '#514532',
            margin: 0,
          }}
        >
          Open any link to see mastered words, add a private name label, or share with another device.
        </p>
      </div>

      {recentLinks.length === 0 ? (
        <div
          data-testid="parents-empty-state"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '20px',
            textAlign: 'center',
            color: '#514532',
            fontFamily: '"Nunito Sans", system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          No practice links on this device yet. Tap below or pick a grade on Home and press Play Now!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentLinks.map((link) => (
            <div
              key={link.slug}
              data-testid={`parent-link-item-${link.slug}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '16px 18px',
                boxShadow: '0 4px 0 0 #d9e3f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'Rubik, system-ui, sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#121c2c',
                  }}
                >
                  {link.label ? `${link.label} — ${GRADE_LABELS[link.grade]}` : GRADE_LABELS[link.grade]}
                </span>
                <span
                  style={{
                    fontFamily: 'Rubik, system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#006399',
                  }}
                >
                  Level {link.currentLevel} • ★ {link.points} Stars
                </span>
              </div>
              <button
                type="button"
                data-testid={`open-parent-view-${link.slug}`}
                onClick={() => onOpenParentView(link.slug)}
                style={{
                  minHeight: '48px',
                  padding: '10px 16px',
                  borderRadius: '14px',
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
                Progress & Share
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        data-testid="new-link-another-child-button"
        disabled={loading}
        onClick={() => onCreateNewLinkForChild(selectedGrade)}
        style={{
          width: '100%',
          minHeight: '56px',
          padding: '14px 20px',
          borderRadius: '18px',
          border: 'none',
          backgroundColor: '#ffb800',
          color: '#271900',
          fontFamily: 'Rubik, system-ui, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          boxShadow: '0 6px 0 0 #6b4c00',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        <MaterialIcon name="person" size={20} color="#271900" />
        <span>New link for another child ({GRADE_LABELS[selectedGrade]})</span>
      </button>
    </section>
  );
}

