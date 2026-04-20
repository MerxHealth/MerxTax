'use client';
// src/components/CookieConsent.tsx
// MerxTax — Cookie Consent Banner
// Platform by Merx Digital Solutions Ltd
// PECR Compliant — Sprint 6
// Add to src/app/layout.tsx: import CookieConsent from '@/components/CookieConsent'
// Then add <CookieConsent /> just before </body>

import { useState, useEffect } from 'react';

type ConsentState = 'pending' | 'all' | 'essential' | 'custom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('merxtax-cookie-consent');
    if (!consent) {
      // Small delay so banner doesn't flash on every page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (state: ConsentState) => {
    localStorage.setItem('merxtax-cookie-consent', state);
    localStorage.setItem('merxtax-cookie-date', new Date().toISOString());
    setVisible(false);
    setShowCustom(false);
  };

  const acceptAll = () => {
    setAnalytics(true);
    setFunctional(true);
    saveConsent('all');
  };

  const acceptEssential = () => {
    setAnalytics(false);
    setFunctional(false);
    saveConsent('essential');
  };

  const saveCustom = () => {
    saveConsent('custom');
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9998 }} />

      {/* Banner */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        backgroundColor: '#FFFFFF', borderTop: '3px solid #01D98D',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        padding: '24px 32px',
        fontFamily: '"DM Sans", Arial, sans-serif',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {!showCustom ? (
            /* Main consent view */
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <img src="/logo.png" alt="MerxTax" style={{ height: '28px', width: 'auto' }} />
                  <span style={{ color: '#0A2E1E', fontSize: '16px', fontWeight: 700 }}>Cookie Settings</span>
                </div>
                <p style={{ color: '#444444', fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px' }}>
                  MerxTax (a platform by <strong>Merx Digital Solutions Ltd</strong>) uses cookies to keep you logged in and improve your experience. We do not use advertising cookies or sell your data.
                </p>
                <p style={{ margin: 0 }}>
                  <a href="/cookie-policy" style={{ color: '#01D98D', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>Read our Cookie Policy →</a>
                  {' '}
                  <a href="/privacy-policy" style={{ color: '#6B7280', fontSize: '13px', textDecoration: 'none', marginLeft: '12px' }}>Privacy Policy</a>
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                <button
                  onClick={acceptAll}
                  style={{ backgroundColor: '#01D98D', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={acceptEssential}
                  style={{ backgroundColor: '#F3F4F6', color: '#0A2E1E', border: '1px solid #D1D5DB', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Essential Only
                </button>
                <button
                  onClick={() => setShowCustom(true)}
                  style={{ backgroundColor: 'transparent', color: '#6B7280', border: 'none', padding: '8px 0', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Customise preferences
                </button>
              </div>
            </div>
          ) : (
            /* Custom preferences view */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#0A2E1E', fontSize: '18px', fontWeight: 700, margin: 0 }}>Cookie Preferences</h3>
                <button onClick={() => setShowCustom(false)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {/* Essential - always on */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #01D98D' }}>
                  <div>
                    <p style={{ color: '#0A2E1E', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Essential Cookies</p>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Required for login and platform functionality. Cannot be disabled.</p>
                  </div>
                  <span style={{ backgroundColor: '#01D98D', color: '#FFFFFF', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>Always On</span>
                </div>

                {/* Functional */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div>
                    <p style={{ color: '#0A2E1E', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Functional Cookies</p>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Remember your preferences and last-visited module.</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={functional}
                      onChange={e => setFunctional(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#01D98D', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#444444', fontSize: '14px' }}>{functional ? 'On' : 'Off'}</span>
                  </label>
                </div>

                {/* Analytics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div>
                    <p style={{ color: '#0A2E1E', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Analytics Cookies</p>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Anonymised page-view data via Vercel Analytics. No personal data. No cross-site tracking.</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={e => setAnalytics(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#01D98D', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#444444', fontSize: '14px' }}>{analytics ? 'On' : 'Off'}</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={acceptEssential} style={{ backgroundColor: '#F3F4F6', color: '#0A2E1E', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Essential Only
                </button>
                <button onClick={saveCustom} style={{ backgroundColor: '#01D98D', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  Save My Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
