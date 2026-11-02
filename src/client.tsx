import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { HomePage } from './routes/index';
import { PracticeRoute, InvalidLinkScreen, type PracticeLinkData } from './routes/$slug';
import type { ParentProgressSummary } from './lib/progress';
import type { PracticeMode } from './lib/words';

export interface InitialState {
  page: 'home' | 'practice' | 'parent' | 'not-found';
  slug?: string;
  initialMode?: PracticeMode;
  linkData?: PracticeLinkData | null;
  parentSummary?: ParentProgressSummary | null;
}

declare global {
  interface Window {
    __INITIAL_STATE__?: InitialState;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  const state = window.__INITIAL_STATE__ ?? { page: 'home' };

  let element: React.ReactElement;
  if (state.page === 'home') {
    element = <HomePage />;
  } else if (state.page === 'parent' && state.slug) {
    element = (
      <PracticeRoute
        slug={state.slug}
        isParentView
        parentSummary={state.parentSummary}
      />
    );
  } else if (state.page === 'practice' && state.slug) {
    element = (
      <PracticeRoute
        slug={state.slug}
        initialMode="write"
        linkData={state.linkData}
      />
    );
  } else {
    element = <InvalidLinkScreen />;
  }

  if (rootEl.hasChildNodes()) {
    hydrateRoot(rootEl, element);
  } else {
    createRoot(rootEl).render(element);
  }
}
