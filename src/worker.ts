import React from 'react';
import { renderToString } from 'react-dom/server';
import { handleGetLink, handlePostLinks } from './routes/api/links';
import { handlePostProgress } from './routes/api/progress';
import { expireInactiveLinks, TWELVE_MONTHS_MS } from './workers/expire-links';
import { HomePage } from './routes/index';
import { PracticeRoute, InvalidLinkScreen } from './routes/$slug';
import { isValidSlug } from './lib/slug';
import { getParentProgressSummary, getProgressForLink } from './lib/progress';
import { checkRateLimit } from './lib/rate-limit';
import type { GradeNumber } from './data/words/schema';

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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #FAF6EE; color: #1D3537; }
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
      request.method === 'GET'
    ) {
      const slug = pathname.startsWith('/api/links/')
        ? pathname.slice('/api/links/'.length)
        : undefined;
      return handleGetLink(request, env.DB, slug);
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

      const row = await env.DB.prepare(
        'SELECT slug, grade, label, last_active FROM links WHERE slug = ? LIMIT 1'
      )
        .bind(potentialSlug)
        .first<{
          slug: string;
          grade: GradeNumber;
          label: string | null;
          last_active: number;
        }>();

      if (!row || Date.now() - row.last_active >= TWELVE_MONTHS_MS) {
        const notFoundHtml = renderToString(React.createElement(InvalidLinkScreen));
        return renderHtmlDocument(
          'TapToSpell — Link Not Found',
          notFoundHtml,
          { page: 'not-found' },
          404
        );
      }

      const isParent = url.searchParams.has('parent');
      const modeParam = url.searchParams.get('mode') === 'write' ? 'write' : 'read';

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

      const progress = await getProgressForLink(env.DB, potentialSlug);
      const linkData = {
        slug: row.slug,
        grade: row.grade,
        label: row.label,
        progress,
      };
      const html = renderToString(
        React.createElement(PracticeRoute, {
          slug: potentialSlug,
          initialMode: modeParam,
          linkData,
        })
      );
      return renderHtmlDocument('TapToSpell — Practice', html, {
        page: 'practice',
        slug: potentialSlug,
        initialMode: modeParam,
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
