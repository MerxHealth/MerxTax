// src/app/privacy-policy/page.tsx
// MerxTax — Privacy Policy Page
// Platform by Merx Digital Solutions Ltd
// Sprint 6 — UK GDPR Compliant
// INSTRUCTIONS: Replace ICO-XXXXXXXX with your actual ICO Registration Number after Phase 2

export const metadata = {
  title: 'Privacy Policy | MerxTax by Merx Digital Solutions Ltd',
  description: 'How MerxTax collects, uses and protects your personal data. UK GDPR compliant.',
};

export default function PrivacyPolicyPage() {
  const dataTable = [
    ['Provide MTD tax services', 'Identity, financial, tax data', 'Contract (Art. 6(1)(b))', '5 years post closure'],
    ['HMRC submission & filing', 'UTR, NI, income/expense records', 'Contract + Legal obligation', '5 years minimum (HMRC rules)'],
    ['Receipt capture (IMPENSUM)', 'Receipt images, transaction data', 'Contract (Art. 6(1)(b))', '5 years post closure'],
    ['AI tax advice (LUMEN)', 'Financial queries — no PII', 'Legitimate interests (Art. 6(1)(f))', 'Session only — not retained'],
    ['Payment processing', 'Billing data via Stripe', 'Contract (Art. 6(1)(b))', '7 years (legal/accounting)'],
    ['Security & fraud prevention', 'IP, device, session logs', 'Legitimate interests (Art. 6(1)(f))', '12 months'],
    ['Platform analytics', 'Anonymised usage data', 'Legitimate interests (Art. 6(1)(f))', '24 months'],
  ];

  const processors = [
    ['Supabase Inc.', 'Database & authentication', 'All account & financial data', 'EU — Frankfurt, Germany'],
    ['Cloudflare Inc.', 'Receipt image storage (R2)', 'Receipt images & attachments', 'EU/US — SCCs apply'],
    ['Anthropic PBC', 'AI tax advisor (LUMEN)', 'Query text only — no PII transmitted', 'US — SCCs apply'],
    ['Stripe Inc.', 'Payment processing', 'Billing name, email, subscription', 'EU/US — ICO registered'],
    ['Vercel Inc.', 'Web hosting & deployment', 'HTTP request metadata only', 'EU/US — SCCs apply'],
    ['HMRC', 'Tax authority — MTD submission', 'Tax returns, income & expense summaries', 'UK only'],
    ['Yapily Ltd', 'Open Banking (Phase 8 — not yet active)', 'Bank data (with explicit consent)', 'UK/EU'],
  ];

  const rights = [
    ['Right of Access', 'Request a copy of all personal data we hold about you (Subject Access Request). We respond within 30 days.'],
    ['Right to Rectification', 'Request correction of inaccurate or incomplete personal data.'],
    ['Right to Erasure', 'Request deletion of your data. Note: HMRC requires tax records to be kept for 5 years — this limits erasure of financial records.'],
    ['Right to Restrict Processing', 'Request that we limit how we process your data.'],
    ['Right to Data Portability', 'Request your data in a structured, machine-readable format (CSV/JSON).'],
    ['Right to Object', 'Object to processing based on legitimate interests.'],
    ['Right to Withdraw Consent', 'Where consent is the lawful basis, withdraw it at any time.'],
    ['Right to Complain', 'Complain to the ICO at ico.org.uk or 0303 123 1113.'],
  ];

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: '"DM Sans", Arial, sans-serif', color: '#444444' }}>

      {/* ── NAV ── */}
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

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(175deg, #01D98D 0%, #01D98D 45%, #0EBDCA 100%)', padding: '60px 32px 48px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>Legal Document</p>
          <h1 style={{ color: '#FFFFFF', fontSize: '46px', fontWeight: 900, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 14px', lineHeight: 1.1 }}>Privacy Policy</h1>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '17px', margin: '0 0 24px', maxWidth: '600px' }}>
            MerxTax is a platform developed and operated by <strong>Merx Digital Solutions Ltd</strong>. This policy explains how we handle your personal data.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['Version 1.0 — 17 April 2026', 'UK GDPR Compliant', 'ICO Registered'].map(tag => (
              <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#FFFFFF', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Controller Info Box */}
        <div style={{ backgroundColor: '#F0FDF4', border: '2px solid #01D98D', borderRadius: '12px', padding: '28px', marginBottom: '48px' }}>
          <h2 style={{ color: '#0A2E1E', fontSize: '16px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Data Controller</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              ['Legal Entity', 'Merx Digital Solutions Ltd'],
              ['Platform', 'MerxTax — merxtax.co.uk'],
              ['ICO Registration', 'ICO-XXXXXXXX'],
              ['Privacy Contact', 'privacy@merxdigital.co.uk'],
              ['Effective Date', '17 April 2026'],
              ['Review Date', '17 April 2027'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px' }}>{label}</p>
                <p style={{ color: '#0A2E1E', fontSize: '15px', fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <Section title="1. Introduction">
          <P>Merx Digital Solutions Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is the data controller for personal data processed through MerxTax (merxtax.co.uk). This Privacy Policy explains how we collect, use, store and protect your personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the Privacy and Electronic Communications Regulations (PECR).</P>
          <P>MerxTax is a Making Tax Digital (MTD) financial platform. We handle sensitive tax data and hold ourselves to the highest standard of data protection.</P>
        </Section>

        {/* Section 2 */}
        <Section title="2. What Personal Data We Collect">
          <P><strong>Account &amp; Identity:</strong> Full name, email address, business name, Unique Taxpayer Reference (UTR), National Insurance number, VAT registration number.</P>
          <P><strong>Financial &amp; Tax Data:</strong> Income and expense transaction records, invoice data, receipt images uploaded via IMPENSUM, GPS mileage data, VAT returns, MTD quarterly submission records, bank transaction data (where Open Banking is enabled).</P>
          <P><strong>Agent Relationships:</strong> Agent Reference Number (ARN), SA Agent Code, client-to-agent relationship records, HMRC authorisation tokens.</P>
          <P><strong>Technical &amp; Usage Data:</strong> IP address, browser type, device identifiers, pages visited, session duration, error logs.</P>
          <P><strong>Payment Data:</strong> Subscription plan and billing status. Card details are processed and stored by Stripe — never stored by MerxTax.</P>
        </Section>

        {/* Section 3 */}
        <Section title="3. How and Why We Use Your Data">
          <P>We process your personal data under the following lawful bases:</P>
          <div style={{ overflowX: 'auto', margin: '16px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>{['Purpose', 'Data Used', 'Legal Basis', 'Retention'].map(h => (
                  <th key={h} style={{ backgroundColor: '#0A2E1E', color: '#FFFFFF', padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {dataTable.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', color: '#444444', fontSize: '13px', verticalAlign: 'top' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 4 */}
        <Section title="4. Our Third-Party Data Processors">
          <P>We share your data only with the processors below, under written Data Processing Agreements. We do not sell your personal data to any third party.</P>
          <div style={{ overflowX: 'auto', margin: '16px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>{['Provider', 'Role', 'Data Shared', 'Location'].map(h => (
                  <th key={h} style={{ backgroundColor: '#0A2E1E', color: '#FFFFFF', padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {processors.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', color: j === 0 ? '#0A2E1E' : '#444444', fontSize: '13px', fontWeight: j === 0 ? 600 : 400, verticalAlign: 'top' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 5 */}
        <Section title="5. Your Rights Under UK GDPR">
          <P>Contact privacy@merxdigital.co.uk to exercise any right. We will respond within 30 days.</P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
            {rights.map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: '12px', padding: '14px 16px', backgroundColor: '#F9FAFB', borderRadius: '8px', borderLeft: '4px solid #01D98D' }}>
                <div>
                  <p style={{ color: '#0A2E1E', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>{title}</p>
                  <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 6 */}
        <Section title="6. Data Retention">
          <P><strong>Tax &amp; Financial Records:</strong> In accordance with HMRC requirements, all tax records — including transaction data, receipt images, invoices and MTD submissions — are retained for a minimum of 5 years after the 31 January Self Assessment deadline for each tax year (Taxes Management Act 1970).</P>
          <P><strong>Account Data:</strong> Retained for the duration of your subscription plus 30 days after account closure, after which it is anonymised or deleted.</P>
          <P><strong>Data Export on Cancellation:</strong> Before closing your account, you may download a full export of all your records in CSV and PDF format. It is your legal responsibility as a taxpayer to retain these records for the statutory period.</P>
        </Section>

        {/* Section 7 */}
        <Section title="7. Security">
          <P>We implement appropriate technical and organisational measures including TLS encryption in transit, AES-256 encryption at rest, Row-Level Security policies, HTTP security headers (CSP, HSTS, X-Frame-Options), access controls, and regular security audits. In the event of a personal data breach, we will notify the ICO within 72 hours and inform affected users without undue delay.</P>
        </Section>

        {/* Section 8 */}
        <Section title="8. International Transfers">
          <P>Some processors are located outside the UK (primarily the US). We ensure appropriate safeguards including UK Standard Contractual Clauses (SCCs) and, where available, UK-US Data Bridge certification.</P>
        </Section>

        {/* Section 9 */}
        <Section title="9. Changes to This Policy">
          <P>We may update this Privacy Policy. Material changes will be notified by email and displayed prominently on the platform at least 30 days before taking effect. Continued use after that date constitutes acceptance of the updated policy.</P>
        </Section>

        {/* Contact Dark Box */}
        <div style={{ backgroundColor: '#0A2E1E', borderRadius: '12px', padding: '36px', marginTop: '48px' }}>
          <h2 style={{ color: '#01D98D', fontSize: '20px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 16px' }}>Contact Our Privacy Team</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', margin: '0 0 20px' }}>For privacy questions, Subject Access Requests, or to exercise your rights under UK GDPR:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[['Email', 'privacy@merxdigital.co.uk'],['Legal Entity', 'Merx Digital Solutions Ltd'],['ICO Complaints', 'ico.org.uk'],['Response Time', 'Within 30 days']].map(([l,v]) => (
              <div key={l}><p style={{ color: '#01D98D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>{l}</p><p style={{ color: '#FFFFFF', fontSize: '14px', margin: 0 }}>{v}</p></div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '40px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <img src="/logo.png" alt="MerxTax" style={{ height: '32px', width: 'auto', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 16px' }}>
            MerxTax is a platform developed and operated by <strong>Merx Digital Solutions Ltd</strong>, registered in England and Wales.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <a href="/privacy-policy" style={{ color: '#01D98D', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
            <a href="/terms-of-service" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>Terms of Service</a>
            <a href="/cookie-policy" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>Cookie Policy</a>
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
