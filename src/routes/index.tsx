import React, { useState } from 'react';
import { GRADE_LABELS, type GradeNumber } from '../data/words/schema';

export interface HomePageProps {
  onFetchCandidates?: (grade: GradeNumber) => Promise<string[]>;
  onConfirmLink?: (params: {
    grade: GradeNumber;
    candidateSlug: string;
    label?: string;
  }) => Promise<{ slug: string }>;
  onNavigateToSlug?: (slug: string) => void;
}

const GRADES: GradeNumber[] = [0, 1, 2, 3, 4];

/**
 * Home Page (Screen 1 & Screen 2 mockups — Tasks 4.9, 4.10).
 * - Step 1 (Screen 1): Five grade cards + "Create practice link" button, with book & letter-tile icons above the fold.
 * - Step 2 (Screen 2): Three system-generated candidate URLs, optional private label field ("Jimmy"), and "Create link" button.
 */
export function HomePage({
  onFetchCandidates,
  onConfirmLink,
  onNavigateToSlug,
}: HomePageProps) {
  const [selectedGrade, setSelectedGrade] = useState<GradeNumber>(1);
  const [step, setStep] = useState<'pick-grade' | 'pick-slug'>('pick-grade');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      let slugs: string[];
      if (onFetchCandidates) {
        slugs = await onFetchCandidates(selectedGrade);
      } else {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade: selectedGrade }),
        });
        if (!res.ok) {
          throw new Error('Could not generate practice links');
        }
        const data = (await res.json()) as { candidates: string[] };
        slugs = data.candidates;
      }
      setCandidates(slugs);
      setSelectedCandidate(slugs[0] ?? '');
      setStep('pick-slug');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setLoading(true);
    setError(null);
    try {
      const cleanLabel = label.trim() || undefined;
      let createdSlug = selectedCandidate;

      if (onConfirmLink) {
        const res = await onConfirmLink({
          grade: selectedGrade,
          candidateSlug: selectedCandidate,
          label: cleanLabel,
        });
        createdSlug = res.slug;
      } else {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: selectedGrade,
            candidateSlug: selectedCandidate,
            label: cleanLabel,
          }),
        });
        if (!res.ok) {
          throw new Error('Could not save practice link');
        }
        const data = (await res.json()) as { slug: string };
        createdSlug = data.slug;
      }

      if (onNavigateToSlug) {
        onNavigateToSlug(createdSlug);
      } else if (typeof window !== 'undefined') {
        window.location.assign(`/${createdSlug}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'pick-slug') {
    return (
      <main
        data-testid="screen-slug-choice"
        style={{
          minHeight: '100vh',
          maxWidth: '420px',
          margin: '0 auto',
          padding: '28px 24px',
          backgroundColor: '#FAF6EE',
          color: '#1D3537',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '20px' }}>
          Pick a link for your child
        </h1>

        <form onSubmit={handleConfirmSlug} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div role="radiogroup" aria-label="Candidate practice links" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {candidates.map((slug) => {
              const isSelected = slug === selectedCandidate;
              return (
                <button
                  key={slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`candidate-card-${slug}`}
                  onClick={() => setSelectedCandidate(slug)}
                  style={{
                    width: '100%',
                    minHeight: '56px',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: isSelected ? '3px solid #1E8A8A' : '2px solid #D5CFC2',
                    backgroundColor: isSelected ? '#E6F4F1' : '#FFFFFF',
                    color: '#1D3537',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  taptospell.com/{slug}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="parent-private-label" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Add a name just for you (optional)
            </label>
            <input
              id="parent-private-label"
              data-testid="parent-label-input"
              type="text"
              placeholder="Jimmy"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
              style={{
                minHeight: '48px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: '2px solid #D5CFC2',
                backgroundColor: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
            <small style={{ color: '#5A7174', fontSize: '0.85rem' }}>
              This name is private — it never appears in the link.
            </small>
          </div>

          {error && <p style={{ color: '#B84A39', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !selectedCandidate}
            data-testid="confirm-create-link-button"
            style={{
              marginTop: '12px',
              minHeight: '56px',
              padding: '14px 24px',
              borderRadius: '18px',
              border: '2px solid #1E8A8A',
              backgroundColor: '#1E8A8A',
              color: '#FFFFFF',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create link
          </button>
        </form>
      </main>
    );
  }

  return (
    <main
      data-testid="screen-grade-picker"
      style={{
        minHeight: '100vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '28px 24px',
        backgroundColor: '#FAF6EE',
        color: '#1D3537',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            gap: '12px',
            marginBottom: '8px',
            fontSize: '1.5rem',
          }}
        >
          <span title="Reading mode">📖</span>
          <span title="Spelling mode">🔤</span>
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 6px 0' }}>
          TapToSpell
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#375A5E', margin: 0 }}>
          Free reading and spelling practice for ages 5–8.
        </p>
      </header>

      <section
        role="radiogroup"
        aria-label="Select a grade level"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {GRADES.map((grade) => {
          const isSelected = grade === selectedGrade;
          return (
            <button
              key={grade}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`grade-card-${grade}`}
              onClick={() => setSelectedGrade(grade)}
              style={{
                width: '100%',
                minHeight: '56px',
                padding: '14px 20px',
                borderRadius: '18px',
                border: isSelected ? '3px solid #1E8A8A' : '2px solid #D5CFC2',
                backgroundColor: isSelected ? '#E6F4F1' : '#FFFFFF',
                color: '#1D3537',
                fontSize: '1.2rem',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {GRADE_LABELS[grade]}
            </button>
          );
        })}
      </section>

      {error && <p style={{ color: '#B84A39', margin: 0 }}>{error}</p>}

      <button
        type="button"
        disabled={loading}
        data-testid="create-practice-link-button"
        onClick={handleRequestCandidates}
        style={{
          marginTop: 'auto',
          minHeight: '56px',
          padding: '14px 24px',
          borderRadius: '18px',
          border: '2px solid #E06D53',
          backgroundColor: '#E06D53',
          color: '#FFFFFF',
          fontSize: '1.2rem',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        Create practice link
      </button>
    </main>
  );
}

export default HomePage;

