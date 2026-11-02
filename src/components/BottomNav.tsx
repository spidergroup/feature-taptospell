import React from 'react';
import { MaterialIcon } from './MaterialIcon';

export type NavTab = 'home' | 'games' | 'parents';

export interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

/**
 * Bottom navigation bar adapted from `UI_TEMPLATES/home_page` (PRD 4.1 #17, Task 10.6):
 * Three tabs: Home, Games, and Parents. The template's "Grades" tab is removed.
 */
export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const tabs: Array<{ id: NavTab; label: string; icon: string }> = [
    { id: 'home', label: 'Home', icon: 'cottage' },
    { id: 'games', label: 'Games', icon: 'sports_esports' },
    { id: 'parents', label: 'Parents', icon: 'family_restroom' },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Primary navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        backgroundColor: 'rgba(249, 249, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -4px 20px rgba(39, 49, 66, 0.08)',
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
          justifyContent: 'space-around',
          gap: '8px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`nav-tab-${tab.id}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '84px',
                minHeight: '56px',
                padding: '6px 14px',
                borderRadius: '18px',
                border: 'none',
                backgroundColor: isActive ? '#ebdcff' : 'transparent',
                color: isActive ? '#7825ea' : '#514532',
                boxShadow: isActive ? '0 4px 0 0 #d4bbff' : 'none',
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <MaterialIcon name={tab.icon} size={26} color={isActive ? '#7825ea' : '#514532'} />
              <span style={{ marginTop: '4px', lineHeight: 1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

