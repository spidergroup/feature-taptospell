import React, { useState } from 'react';
import { GRADE_LABELS, type GradeNumber } from '../data/words/schema';
import {
  findExistingLinkForGrade,
  loadDeviceState,
  savePerLinkState,
  setSelectedGradePreference,
  upsertRecentLinkOnDevice,
  type StorageLike,
} from '../lib/local-state';
import { READING_MODE_ENABLED } from '../lib/feature-flags';
import { BottomNav, type NavTab } from '../components/BottomNav';
import { GameCard } from '../components/GameCard';
import { ParentsTab } from '../components/ParentsTab';
import { MaterialIcon } from '../components/MaterialIcon';

export interface HomePageProps {
  storage?: StorageLike | null;
  onCreateLink?: (grade: GradeNumber) => Promise<{
    slug: string;
    grade: GradeNumber;
    label: string | null;
    points?: number;
    currentLevel?: number;
  }>;
  onNavigateToSlug?: (slug: string, options?: { isParent?: boolean }) => void;
}

const GRADES: GradeNumber[] = [0, 1, 2, 3, 4];

const GRADE_AGE_LABELS: Record<GradeNumber, string> = {
  0: 'Ages 3–4',
  1: 'Ages 5–6',
  2: 'Ages 6–7',
  3: 'Ages 7–8',
  4: 'Ages 8–9',
};

const GRADE_DATA_SLUGS: Record<GradeNumber, string> = {
  0: 'pre-k',
  1: 'kindergarten',
  2: '1st',
  3: '2nd',
  4: '3rd',
};

/**
 * Home Page rebuilt from `UI_TEMPLATES/home_page` (`code.html`, `DESIGN.md`, `screen.png`) (PRD 4.1, Tasks 11.1–11.10).
 * - Pre-selects last chosen grade on this device (or Kindergarten by default).
 * - Shows 5 tactile grade pills, Spelling game card ("Play Now"), and Reading game card ("Coming in v2.0", disabled).
 * - Tapping "Play Now" reuses an existing link for that grade on this device or automatically creates a new link and navigates straight to `/{slug}`.
 * - Removes out-of-scope template elements (mascot greeting audio button, "Letter of the Day" phonics bar, "Grades" bottom tab).
 */
export function HomePage({
  storage,
  onCreateLink,
  onNavigateToSlug,
}: HomePageProps) {
  const [deviceState, setDeviceState] = useState(() => loadDeviceState(storage));
  const [selectedGrade, setSelectedGrade] = useState<GradeNumber>(
    () => loadDeviceState(storage).selectedGrade
  );
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mostRecentLink = deviceState.recentLinks[0] ?? null;
  const headerStars = mostRecentLink?.points ?? 0;

  const handleSelectGrade = (grade: GradeNumber) => {
    setSelectedGrade(grade);
    setSelectedGradePreference(grade, storage);
    setDeviceState(loadDeviceState(storage));
  };

  const navigateTo = (slug: string, isParent = false) => {
    if (onNavigateToSlug) {
      onNavigateToSlug(slug, { isParent });
    } else if (typeof window !== 'undefined') {
      window.location.assign(isParent ? `/${slug}?parent` : `/${slug}`);
    }
  };

  const createFreshLinkAndOpen = async (grade: GradeNumber) => {
    setLoading(true);
    setError(null);
    try {
      let created: {
        slug: string;
        grade: GradeNumber;
        label: string | null;
        points?: number;
        currentLevel?: number;
      };
      if (onCreateLink) {
        created = await onCreateLink(grade);
      } else {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade }),
        });
        if (!res.ok) {
          throw new Error('Could not create practice link');
        }
        created = (await res.json()) as {
          slug: string;
          grade: GradeNumber;
          label: string | null;
          points?: number;
          currentLevel?: number;
        };
      }

      upsertRecentLinkOnDevice(
        {
          slug: created.slug,
          grade: created.grade,
          label: created.label ?? null,
          points: created.points ?? 0,
          currentLevel: created.currentLevel ?? 1,
          createdHere: true,
          shareBannerShown: false,
        },
        storage
      );

      savePerLinkState(
        {
          version: 1,
          slug: created.slug,
          grade: created.grade,
          label: created.label ?? null,
          points: created.points ?? 0,
          currentLevel: created.currentLevel ?? 1,
          progress: [],
          pendingRounds: [],
          lastSyncedAt: Date.now(),
        },
        storage
      );

      setDeviceState(loadDeviceState(storage));
      navigateTo(created.slug, false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayNowSpelling = async () => {
    const existing = findExistingLinkForGrade(selectedGrade, storage);
    if (existing) {
      upsertRecentLinkOnDevice(existing, storage);
      setDeviceState(loadDeviceState(storage));
      navigateTo(existing.slug, false);
      return;
    }
    await createFreshLinkAndOpen(selectedGrade);
  };

  return (
    <div
      data-testid="screen-home-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#dfe7f7',
        color: '#121c2c',
        fontFamily: '"Nunito Sans", system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Fixed Header from UI_TEMPLATES/home_page */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 50,
          backgroundColor: 'rgba(249, 249, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 16px rgba(39, 49, 66, 0.06)',
        }}
      >
        <div
          style={{
            height: '80px',
            maxWidth: '480px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '9999px',
                backgroundColor: '#04a8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 0 0 #006399',
              }}
            >
              <MaterialIcon name="spellcheck" size={24} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'Rubik, system-ui, sans-serif',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#7c5800',
                  lineHeight: 1,
                }}
              >
                Tap To Spell
              </span>
              <span
                style={{
                  fontFamily: 'Rubik, system-ui, sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#514532',
                  lineHeight: 1,
                  marginTop: '3px',
                }}
              >
                {activeTab === 'parents' ? 'Parents' : activeTab === 'games' ? 'Games' : 'Home'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              data-testid="home-header-stars"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(255, 184, 0, 0.25)',
                padding: '6px 12px',
                borderRadius: '9999px',
                boxShadow: '0 2px 0 0 #ffb800',
              }}
            >
              <MaterialIcon name="star" size={20} color="#ffb800" />
              <span
                style={{
                  fontFamily: 'Rubik, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#6b4c00',
                  lineHeight: 1,
                }}
              >
                {headerStars}
              </span>
            </div>
            <button
              type="button"
              aria-label="Open Parents Tab"
              data-testid="header-person-button"
              onClick={() => setActiveTab('parents')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#7c5800',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 0 0 #5e4200',
                cursor: 'pointer',
              }}
            >
              <MaterialIcon name="person" size={18} color="#ffffff" />
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          width: '100%',
          paddingTop: '88px',
          paddingBottom: '104px',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '8px 20px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Top Friendly Subtitle Tag */}
          <div style={{ textAlign: 'center', paddingTop: '4px' }}>
            <p
              style={{
                fontFamily: '"Nunito Sans", system-ui, sans-serif',
                fontSize: '17px',
                fontWeight: 700,
                color: '#514532',
                margin: 0,
              }}
            >
              Free reading and spelling practice for ages 5–8.
            </p>
          </div>

          {activeTab === 'parents' ? (
            <ParentsTab
              recentLinks={deviceState.recentLinks}
              selectedGrade={selectedGrade}
              loading={loading}
              onOpenParentView={(slug) => navigateTo(slug, true)}
              onCreateNewLinkForChild={(grade) => createFreshLinkAndOpen(grade)}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  {/* Mascot Speech Card (without out-of-scope volume button) */}
                  <div
                    data-testid="mascot-card"
                    style={{
                      position: 'relative',
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      padding: '16px 20px',
                      boxShadow: '0 8px 20px -6px rgba(39, 49, 66, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '9999px',
                          backgroundColor: '#ffdea8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 0 0 #ffb800',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src="/images/ui/mascot-beaver.svg"
                          alt="Barnaby Beaver mascot"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '9999px',
                          backgroundColor: '#04a8ff',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 0 0 #006399',
                        }}
                      >
                        <MaterialIcon name="favorite" size={14} color="#ffffff" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontFamily: 'Rubik, system-ui, sans-serif',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#7c5800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Barnaby Beaver
                      </span>
                      <p
                        style={{
                          fontFamily: 'Rubik, system-ui, sans-serif',
                          fontSize: '22px',
                          fontWeight: 700,
                          color: '#121c2c',
                          lineHeight: 1.25,
                          margin: '2px 0 0 0',
                        }}
                      >
                        Pick your grade to jump in!
                      </p>
                    </div>
                  </div>

                  {/* Grade Level Selection Stack */}
                  <div
                    id="gradeSelectionGroup"
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
                          data-grade={GRADE_DATA_SLUGS[grade]}
                          data-testid={`grade-card-${grade}`}
                          onClick={() => handleSelectGrade(grade)}
                          style={{
                            width: '100%',
                            minHeight: '64px',
                            padding: '16px 24px',
                            borderRadius: '24px',
                            border: 'none',
                            backgroundColor: isSelected ? '#cde5ff' : '#ffffff',
                            boxShadow: isSelected
                              ? '0 4px 0 0 #006399'
                              : '0 4px 0 0 #d9e3f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: isSelected ? '14px' : '12px',
                                height: isSelected ? '14px' : '12px',
                                borderRadius: '9999px',
                                backgroundColor: isSelected ? '#006399' : '#d0daf1',
                                boxShadow: isSelected ? '0 0 0 3px #cde5ff' : 'none',
                              }}
                            />
                            <span
                              style={{
                                fontFamily: 'Rubik, system-ui, sans-serif',
                                fontSize: '26px',
                                fontWeight: 700,
                                color: isSelected ? '#006399' : '#121c2c',
                              }}
                            >
                              {GRADE_LABELS[grade]}
                            </span>
                          </div>

                          {isSelected ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                                color: '#006399',
                                padding: '4px 12px',
                                borderRadius: '9999px',
                                boxShadow: '0 2px 0 0 #95ccff',
                                fontFamily: 'Rubik, system-ui, sans-serif',
                                fontSize: '13px',
                                fontWeight: 700,
                              }}
                            >
                              <MaterialIcon name="check_circle" size={18} color="#006399" />
                              <span>Active</span>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontFamily: 'Rubik, system-ui, sans-serif',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#514532',
                              }}
                            >
                              {GRADE_AGE_LABELS[grade]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#ba1a1a',
                    margin: 0,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              )}

              {/* Game Cards: Spelling (Active) & Reading (Coming in v2.0, Disabled) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <GameCard
                  mode="spelling"
                  title="Spelling Safari"
                  description="Look at the picture & tap letters to spell!"
                  subtitle={`${GRADE_LABELS[selectedGrade]} • 5 Levels`}
                  badgeText="Spelling Mode"
                  pointsBadgeText="+10–30 Stars"
                  imageSrc="/images/ui/spelling-card.svg"
                  loading={loading}
                  onPlayNow={handlePlayNowSpelling}
                />

                <GameCard
                  mode="reading"
                  title="Sight Word Reader"
                  description="Read sight words out loud at your own pace."
                  subtitle={`${GRADE_LABELS[selectedGrade]} • Sight Words`}
                  badgeText="Reading Mode"
                  pointsBadgeText="Coming in v2.0"
                  imageSrc="/images/ui/reading-card.svg"
                  disabled={!READING_MODE_ENABLED}
                  comingSoonLabel="Coming in v2.0"
                />
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

export default HomePage;
