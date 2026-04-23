// src/app/cookie-policy/page.tsx
// MerxTax — Cookie Policy Page
// Platform by Merx Digital Solutions Ltd
// PECR Compliant

export const metadata = {
  title: 'Cookie Policy | MerxTax by Merx Digital Solutions Ltd',
  description: 'How MerxTax uses cookies. PECR compliant cookie policy for MerxTax, a platform by Merx Digital Solutions Ltd.',
};

export default function CookiePolicyPage() {
  const cookies = [
    { name: 'sb-access-token', type: 'Essential', purpose: 'Supabase authentication session token. Keeps you logged in to MerxTax.', duration: 'Session', canOptOut: false },
    { name: 'sb-refresh-token', type: 'Essential', purpose: 'Supabase token refresh. Maintains your session without repeated logins.', duration: '7 days', canOptOut: false },
    { name: 'merxtax-theme', type: 'Essential', purpose: 'Stores your selected dashboard theme (bright/forest/dark).', duration: '1 year', canOptOut: false },
    { name: 'merxtax-csrf', type: 'Essential', purpose: 'Cross-Site Request Forgery protection. Required for form security.', duration: 'Session', canOptOut: false },
    { name: 'cookie-consent', type: 'Essential', purpose: 'Records your cookie consent preferences to avoid repeated prompts.', duration: '1 year', canOptOut: false },
    { name: 'merxtax-onboarding', type: 'Functional', purpose: 'Tracks onboarding completion to avoid showing setup prompts repeatedly.', duration: '30 days', canOptOut: true },
    { name: 'merxtax-last-module', type: 'Functional', purpose: 'Remembers which module you last visited for faster navigation.', duration: '30 days', canOptOut: true },
    { name: '_vercel_insights', type: 'Analytics', purpose: 'Anonymised page-view analytics via Vercel Web Analytics. No personal data. No cross-site tracking.', duration: '90 days', canOptOut: true },
  ];

  const typeColor = (type: string) => {
    if (type === 'Essential') return { bg: '#F0FDF4', text: '#166534', border: '#BBF7E4' };
    if (type === 'Functional') return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
    return { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' };
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: '"DM Sans", Arial, sans-serif', color: '#444444' }}>

      {/* NAV */}
      <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="MerxTax" style={{ height: '38px', width: 'auto' }} />
        </a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/guide" style={{ color: '#0A2E1E', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>Guide</a>
          <a href="/pricing" style={{ color: '#0A2E1E', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>Pricing</a>
          <a href="/login" style={{ backgroundColor: '#01D98D', color: '#FFFFFF', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>Log In</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(175deg, #01D98D 0%, #01D98D 45%, #0EBDCA 100%)', padding: '60px 32px 48px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>Legal Document</p>
          <h1 style={{ color: '#FFFFFF', fontSize: '46px', fontWeight: 900, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 14px', lineHeight: 1.1 }}>Cookie Policy</h1>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '17px', margin: '0 0 24px', maxWidth: '600px' }}>
            MerxTax is a platform by <strong>Merx Digital Solutions Ltd</strong>. We use cookies only where necessary. No advertising cookies. No data selling.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['Version 1.0 — 17 April 2026', 'PECR Compliant', 'No Advertising Cookies'].map(tag => (
              <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#FFFFFF', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Our Commitment */}
        <div style={{ backgroundColor: '#F0FDF4', border: '2px solid #01D98D', borderRadius: '12px', padding: '28px', marginBottom: '48px' }}>
          <h2 style={{ color: '#0A2E1E', fontSize: '18px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 12px' }}>Our Commitment</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              ['No advertising cookies', '✓'],
              ['No cross-site tracking', '✓'],
              ['No Google Analytics', '✓'],
              ['No data selling', '✓'],
              ['Self-hosted fonts', '✓'],
              ['No Google Fonts CDN', '✓'],
            ].map(([label, check]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#01D98D', fontWeight: 800, fontSize: '16px' }}>{check}</span>
                <span style={{ color: '#0A2E1E', fontSize: '14px', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Section title="1. What Are Cookies?">
          <P>Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences and function correctly. This Cookie Policy explains what cookies MerxTax uses, why we use them, and how you can manage them.</P>
          <P>This policy should be read alongside our <a href="/privacy-policy" style={{ color: '#01D98D', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a> and <a href="/terms-of-service" style={{ color: '#01D98D', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>.</P>
        </Section>

        <Section title="2. Cookies We Use">
          <P>We use three categories of cookies. Essential cookies cannot be disabled. Functional and Analytics cookies require your consent.</P>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '20px 0' }}>
            {[
              { label: 'Essential', bg: '#F0FDF4', text: '#166534', border: '#BBF7E4' },
              { label: 'Functional', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
              { label: 'Analytics', bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
            ].map(c => (
              <span key={c.label} style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>{c.label}</span>
            ))}
          </div>

          {/* Cookie Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  {['Cookie Name', 'Type', 'Purpose', 'Duration', 'Opt-Out?'].map(h => (
                    <th key={h} style={{ backgroundColor: '#0A2E1E', color: '#FFFFFF', padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cookies.map((c, i) => {
                  const tc = typeColor(c.type);
                  return (
                    <tr key={c.name} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#0A2E1E', fontFamily: 'monospace', fontSize: '13px' }}>{c.name}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB' }}>
                        <span style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.type}</span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', color: '#444444', lineHeight: '1.5' }}>{c.purpose}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', color: '#6B7280', whiteSpace: 'nowrap' }}>{c.duration}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: c.canOptOut ? '#DC2626' : '#166534', fontSize: '13px' }}>{c.canOptOut ? 'Yes' : 'No'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Cookies We Do NOT Use">
          <P>MerxTax explicitly does not use the following:</P>
          <ul style={{ paddingLeft: '24px', margin: '12px 0' }}>
            {[
              'Advertising or targeting cookies',
              'Social media tracking pixels (Facebook Pixel, Twitter Pixel etc.)',
              'Google Analytics — we use privacy-first Vercel Analytics instead',
              'Google Fonts cookies — all fonts are self-hosted on our servers',
              'Third-party session recording tools (Hotjar, FullStory etc.)',
              'Cross-site tracking cookies of any kind',
            ].map(item => (
              <li key={item} style={{ color: '#444444', fontSize: '15px', lineHeight: '1.75', marginBottom: '6px' }}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="4. Third-Party Cookies">
          <P><strong>Stripe (Payment Processing):</strong> When you visit the Pricing page or complete a subscription payment, Stripe may set cookies on your device for fraud prevention and session management. These are governed by Stripe&apos;s Privacy Policy (stripe.com/privacy). Stripe is ICO-registered.</P>
          <P><strong>No Other Third-Party Providers:</strong> MerxTax does not embed third-party widgets, social share buttons, video players, or any other third-party content that sets additional cookies.</P>
        </Section>

        <Section title="5. Managing Your Cookie Preferences">
          <P><strong>Cookie Consent Banner:</strong> When you first visit merxtax.co.uk, a cookie consent banner allows you to accept all cookies, accept essential cookies only, or customise your preferences. You can change your preferences at any time by clicking &ldquo;Cookie Settings&rdquo; in the website footer.</P>
          <P><strong>Browser Settings:</strong> You can also manage cookies through your browser settings — most browsers allow you to view, delete, or block cookies. Note: blocking essential cookies will prevent MerxTax from functioning correctly.</P>
          <P><strong>Opt-Out Links:</strong></P>
          <ul style={{ paddingLeft: '24px', margin: '0 0 16px' }}>
            <li style={{ color: '#444444', fontSize: '15px', lineHeight: '1.75', marginBottom: '6px' }}>Vercel Analytics: opt-out via the cookie consent banner on merxtax.co.uk</li>
            <li style={{ color: '#444444', fontSize: '15px', lineHeight: '1.75', marginBottom: '6px' }}>Stripe cookies: stripe.com/cookie-settings</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <P>Under PECR and UK GDPR, you have the right to withhold consent for non-essential cookies, withdraw consent at any time, request information about cookie data we hold, and complain to the ICO at ico.org.uk if you believe we are not complying with PECR.</P>
        </Section>

        <Section title="7. Changes to This Policy">
          <P>We may update this Cookie Policy as our use of cookies or applicable regulations change. We will notify you of material changes via the cookie consent banner and by email if you are a registered user.</P>
        </Section>

        {/* Contact Box */}
        <div style={{ backgroundColor: '#0A2E1E', borderRadius: '12px', padding: '36px', marginTop: '48px' }}>
          <h2 style={{ color: '#01D98D', fontSize: '20px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 16px' }}>Contact</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              ['Email', 'privacy@merxdigital.co.uk'],
              ['ICO Complaints', 'ico.org.uk | 0303 123 1113'],
              ['Operator', 'Merx Digital Solutions Ltd'],
              ['Response Time', 'Within 30 days'],
            ].map(([l, v]) => (
              <div key={l}>
                <p style={{ color: '#01D98D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>{l}</p>
                <p style={{ color: '#FFFFFF', fontSize: '14px', margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '40px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <img src="/logo.png" alt="MerxTax" style={{ height: '32px', width: 'auto', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 16px' }}>
            MerxTax is a platform developed and operated by <strong>Merx Digital Solutions Ltd</strong>, registered in England and Wales.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <a href="/privacy-policy" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms-of-service" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>Terms of Service</a>
            <a href="/cookie-policy" style={{ color: '#01D98D', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>Cookie Policy</a>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '16px 0 0' }}>&copy; {new Date().getFullYear()} Merx Digital Solutions Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#0A2E1E', fontSize: '20px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', borderBottom: '3px solid #01D98D', paddingBottom: '10px', margin: '0 0 16px' }}>{title}</h2>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#444444', fontSize: '16px', lineHeight: '1.75', margin: '0 0 14px' }}>{children}</p>;
}
