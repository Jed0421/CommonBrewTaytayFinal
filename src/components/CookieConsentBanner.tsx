import React, { useState } from 'react';
import { Cookie } from 'lucide-react';

// Bump the version when the cookie notice changes so visitors see it again
const CONSENT_KEY = 'commonbrew_cookie_consent';
const CONSENT_VERSION = 1;

const hasAccepted = (): boolean => {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return saved?.version === CONSENT_VERSION;
  } catch {
    return false;
  }
};

interface CookieConsentBannerProps {
  onLearnMore: () => void;
}

// The site only uses essential browser storage (sign-in, saved address, theme) - no ads or tracking -
// so this is a notice with an Accept button rather than a list of optional cookie categories.
export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onLearnMore }) => {
  const [visible, setVisible] = useState(() => !hasAccepted());

  if (!visible) return null;

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, acceptedAt: new Date().toISOString() }));
    } catch {
      // Storage blocked (private mode): just hide the banner for this visit
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      style={{
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: '16px',
        maxWidth: '640px',
        margin: '0 auto',
        zIndex: 950,
        background: '#ffffff',
        border: '1px solid #fed7aa',
        borderRadius: '16px',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
        padding: '1rem 1.15rem',
        display: 'flex',
        gap: '0.9rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}
    >
      <div style={{
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '12px',
        background: '#fff7ed',
        color: '#ea580c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Cookie size={20} />
      </div>

      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
          We use cookies
        </p>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.83rem', lineHeight: 1.5 }}>
          CommonBrew uses cookies and similar browser storage only to keep you signed in, remember your delivery
          address, and save your preferences. We don't use advertising or tracking cookies.{' '}
          <button
            onClick={onLearnMore}
            style={{ background: 'none', border: 'none', padding: 0, color: '#ea580c', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
          >
            Learn more
          </button>
        </p>
      </div>

      <button
        onClick={handleAccept}
        style={{
          alignSelf: 'center',
          background: '#ea580c',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          padding: '0.6rem 1.4rem',
          fontWeight: 800,
          fontSize: '0.9rem',
          cursor: 'pointer',
          flexShrink: 0,
          marginLeft: 'auto'
        }}
      >
        Accept
      </button>
    </div>
  );
};
