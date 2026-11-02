import React, { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';

export interface ShareBannerProps {
  slug: string;
  baseUrl?: string;
  onDismiss: () => void;
}

/**
 * One-time parent-facing share banner shown over the already-loaded game ONLY on the device
 * that created the link (PRD 4.1 #6, Task 11.7).
 * Includes the full URL, a "Copy link" button, and a "Share" button (Web Share API with copy fallback).
 */
export function ShareBanner({ slug, baseUrl, onDismiss }: ShareBannerProps) {
  const [copied, setCopied] = useState(false);

  const resolvedBase =
    baseUrl ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://taptospell.com');
  const cleanBase = resolvedBase.replace(/\/$/, '');
  const fullUrl = `${cleanBase}/${slug}`;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      }
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'TapToSpell Practice Link',
          text: 'Open this link to start spelling practice!',
          url: fullUrl,
        });
        return;
      }
    } catch {
      // Fall back to copy
    }
    await handleCopy();
  };

  return (
    <section
      data-testid="share-banner"
      aria-label="Share practice link with your child"
      style={{
        backgroundColor: '#ffffff',
        border: '3px solid #04a8ff',
        borderRadius: '24px',
        padding: '16px',
        boxShadow: '0 10px 25px -4px rgba(39, 49, 66, 0.14), 0 6px 0 0 #006399',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            color: '#006399',
          }}
        >
          Parent: Share this practice link with your child
        </span>
        <button
          type="button"
          data-testid="dismiss-share-banner-button"
          onClick={onDismiss}
          style={{
            padding: '6px 12px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: '#e7eeff',
            color: '#121c2c',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>

      <div
        data-testid="share-banner-url"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '14px',
          fontWeight: 700,
          backgroundColor: '#f0f3ff',
          color: '#121c2c',
          padding: '10px 12px',
          borderRadius: '12px',
          overflowWrap: 'anywhere',
        }}
      >
        {fullUrl}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          data-testid="share-banner-copy-button"
          onClick={handleCopy}
          style={{
            flex: 1,
            minHeight: '48px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: '#ffb800',
            color: '#271900',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            boxShadow: '0 4px 0 0 #6b4c00',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          type="button"
          data-testid="share-banner-share-button"
          onClick={handleShare}
          style={{
            flex: 1,
            minHeight: '48px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: '#cde5ff',
            color: '#003a5d',
            fontFamily: 'Rubik, system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            boxShadow: '0 4px 0 0 #006399',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <MaterialIcon name="share" size={18} color="#003a5d" />
          <span>Share</span>
        </button>
      </div>
    </section>
  );
}

