import React from 'react';
import { renderToString } from 'react-dom/server';
import { handleGetLink, handlePatchLinkLabel, handlePostLinks } from './routes/api/links';
import { handlePostProgress } from './routes/api/progress';
import { handlePostSync } from './routes/api/sync';
import { expireInactiveLinks, TWELVE_MONTHS_MS } from './workers/expire-links';
import { HomePage } from './routes/index';
import { PracticeRoute, InvalidLinkScreen } from './routes/$slug';
import { isValidSlug } from './lib/slug';
import { getAuthoritativeLinkState, getParentProgressSummary } from './lib/sync';
import { checkRateLimit } from './lib/rate-limit';

export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
}

function renderHtmlDocument(
  title: string,
  bodyHtml: string,
  initialState: Record<string, unknown>,
  status = 200
): Response {
  const safeJson = JSON.stringify(initialState).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; min-height: 100%; }
    body { overscroll-behavior: none; background: #dfe7f7; color: #121c2c; font-family: "Nunito Sans", system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root">${bodyHtml}</div>
  <script>window.__INITIAL_STATE__ = ${safeJson};</script>
  <script type="module" src="/app.js"></script>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // API Routes
    if (pathname === '/api/links' && request.method === 'POST') {
      return handlePostLinks(request, env.DB);
    }

    if (
      (pathname === '/api/links' || pathname.startsWith('/api/links/')) &&
      request.method === 'PATCH'
    ) {
      const slug = pathname.startsWith('/api/links/')
        ? pathname.slice('/api/links/'.length)
        : undefined;
      return handlePatchLinkLabel(request, env.DB, slug);
    }

    if (
      (pathname === '/api/links' || pathname.startsWith('/api/links/')) &&
      request.method === 'GET'
    ) {
      const slug = pathname.startsWith('/api/links/')
        ? pathname.slice('/api/links/'.length)
        : undefined;
      return handleGetLink(request, env.DB, slug);
    }

    if (pathname === '/api/sync' && request.method === 'POST') {
      return handlePostSync(request, env.DB);
    }

    if (pathname === '/api/progress' && request.method === 'POST') {
      return handlePostProgress(request, env.DB);
    }

    // Home page
    if (pathname === '/' && request.method === 'GET') {
      const html = renderToString(React.createElement(HomePage));
      return renderHtmlDocument(
        'TapToSpell — Free reading and spelling practice',
        html,
        { page: 'home' }
      );
    }

    // Practice link route: /{slug}
    const potentialSlug = pathname.slice(1);
    if (
      request.method === 'GET' &&
      potentialSlug &&
      !potentialSlug.includes('/') &&
      !potentialSlug.includes('.')
    ) {
      const ip =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        '127.0.0.1';
      const rate = checkRateLimit(ip);
      if (!rate.allowed) {
        return new Response('Too many requests', {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        });
      }

      if (!isValidSlug(potentialSlug)) {
        const notFoundHtml = renderToString(React.createElement(InvalidLinkScreen));
        return renderHtmlDocument(
          'TapToSpell — Link Not Found',
          notFoundHtml,
          { page: 'not-found' },
          404
        );
      }

      const state = await getAuthoritativeLinkState(env.DB, potentialSlug);

      if (!state || Date.now() - state.lastActive >= TWELVE_MONTHS_MS) {
        const notFoundHtml = renderToString(React.createElement(InvalidLinkScreen));
        return renderHtmlDocument(
          'TapToSpell — Link Not Found',
          notFoundHtml,
          { page: 'not-found' },
          404
        );
      }

      const isParent = url.searchParams.has('parent');

      if (isParent) {
        const summary = await getParentProgressSummary(env.DB, potentialSlug);
        const html = renderToString(
          React.createElement(PracticeRoute, {
            slug: potentialSlug,
            isParentView: true,
            parentSummary: summary,
          })
        );
        return renderHtmlDocument('TapToSpell — Parent Progress', html, {
          page: 'parent',
          slug: potentialSlug,
          parentSummary: summary,
        });
      }

      const linkData = {
        slug: state.slug,
        grade: state.grade,
        label: state.label,
        points: state.points,
        currentLevel: state.currentLevel,
        progress: state.progress,
      };
      // Version 1.0 always starts spelling ('write') mode per PRD 4.12
      const html = renderToString(
        React.createElement(PracticeRoute, {
          slug: potentialSlug,
          initialMode: 'write',
          linkData,
        })
      );
      return renderHtmlDocument('TapToSpell — Practice', html, {
        page: 'practice',
        slug: potentialSlug,
        initialMode: 'write',
        linkData,
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    await expireInactiveLinks(env.DB);
  },
};
