// src/app/terms-of-service/page.tsx
// MerxTax — Terms of Service Page
// Platform by Merx Digital Solutions Ltd

export const metadata = {
  title: 'Terms of Service | MerxTax by Merx Digital Solutions Ltd',
  description: 'Terms of Service for MerxTax, a platform developed and operated by Merx Digital Solutions Ltd.',
};

export default function TermsOfServicePage() {
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
          <h1 style={{ color: '#FFFFFF', fontSize: '46px', fontWeight: 900, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 14px', lineHeight: 1.1 }}>Terms of Service</h1>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '17px', margin: '0 0 24px', maxWidth: '600px' }}>
            MerxTax is a platform developed and operated by <strong>Merx Digital Solutions Ltd</strong>. By using MerxTax, you agree to these terms.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['Version 1.0 — 17 April 2026', 'Governed by English Law', 'Merx Digital Solutions Ltd'].map(tag => (
              <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#FFFFFF', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Info Box */}
        <div style={{ backgroundColor: '#F0FDF4', border: '2px solid #01D98D', borderRadius: '12px', padding: '28px', marginBottom: '48px' }}>
          <h2 style={{ color: '#0A2E1E', fontSize: '16px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Key Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              ['Operator', 'Merx Digital Solutions Ltd'],
              ['Platform', 'MerxTax — merxtax.co.uk'],
              ['Legal Contact', 'legal@merxdigital.co.uk'],
              ['Governing Law', 'England and Wales'],
              ['Effective Date', '17 April 2026'],
              ['Subscription Support', 'support@merxdigital.co.uk'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px' }}>{label}</p>
                <p style={{ color: '#0A2E1E', fontSize: '15px', fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <Section title="1. Acceptance of Terms">
          <P>By registering for, accessing, or using MerxTax, you (&ldquo;User&rdquo;, &ldquo;you&rdquo;) agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you are using MerxTax on behalf of a business, you represent that you have authority to bind that business to these Terms.</P>
          <P>If you do not agree to these Terms, you must not use MerxTax. We reserve the right to update these Terms at any time. Material changes will be notified 30 days in advance by email.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>MerxTax is a Making Tax Digital (MTD) software platform developed and operated by Merx Digital Solutions Ltd that provides digital record-keeping, receipt capture, MTD quarterly submissions, invoicing, compliance monitoring, AI-powered tax guidance, and SA Agent filing services. Full module details are available at merxtax.co.uk.</P>
          <AlertBox color="#FEF3C7" border="#F59E0B" text="LUMEN AI responses are for general guidance only and do not constitute professional tax advice. Always consult a qualified tax professional for complex matters." />
        </Section>

        <Section title="3. Subscription Plans & Payment">
          <P><strong>Plans:</strong> SOLO at £14.99/month, PRO at £24.99/month, and AGENT at £59.99/month (or annual equivalents). All fees are billed in advance via Stripe. Fees are non-refundable except where required by law. We reserve the right to change pricing with 30 days&apos; notice.</P>
          <P><strong>14-Day Free Trial:</strong> Where offered, your account automatically converts to a paid plan after the trial unless cancelled. No credit card is required to start a trial.</P>
          <P><strong>VAT:</strong> UK VAT may be charged at the prevailing rate where applicable.</P>
        </Section>

        <Section title="4. Your Obligations as a User">
          <P><strong>Accuracy:</strong> You are solely responsible for the accuracy of all information entered into MerxTax. MerxTax transmits data to HMRC exactly as you record it. Penalties arising from inaccurate records are your responsibility.</P>
          <AlertBox color="#FEF2F2" border="#DC2626" text="IMPORTANT: The legal obligation to maintain accurate tax records for a minimum of 5 years after the 31 January Self Assessment deadline rests with YOU — the taxpayer — not with MerxTax. Before cancelling your subscription, you must download a full export of your records." />
          <P><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials and must notify us immediately at security@merxdigital.co.uk if you suspect unauthorised access.</P>
          <P><strong>Acceptable Use:</strong> You must not use MerxTax for any unlawful purpose, to facilitate tax evasion or fraud, attempt to gain unauthorised access to HMRC systems, reverse engineer the platform, or misrepresent your identity to HMRC.</P>
        </Section>

        <Section title="5. AGENT Plan — Special Terms">
          <AlertBox color="#F0FDF4" border="#01D98D" text="The AGENT plan is available only to individuals holding a valid HMRC Self Assessment Agent Code. By subscribing, you represent that you are a registered tax agent authorised to file on behalf of clients." />
          <P><strong>Agent Responsibilities:</strong> You are solely responsible for obtaining valid client authorisation before filing on any client&apos;s behalf, and for complying with all HMRC agent conduct standards. MerxTax provides the technical means to file — professional liability for submission accuracy rests with you as the agent.</P>
          <P><strong>Separation of Roles:</strong> MerxTax acts as a software provider. Where you use MerxTax to file on behalf of clients, you are acting as a tax agent. MerxTax does not hold professional indemnity insurance on your behalf.</P>
        </Section>

        <Section title="6. Data & Privacy">
          <P>Our use of your personal data is governed by our Privacy Policy (merxtax.co.uk/privacy-policy), which forms part of these Terms. We are a data controller under UK GDPR. We store all financial data in Supabase (Frankfurt, EU). We do not sell your data to any third party. You have full rights of access, rectification, erasure, and portability.</P>
        </Section>

        <Section title="7. Intellectual Property">
          <P>All software, design, content, and trademarks on MerxTax are owned by Merx Digital Solutions Ltd. You are granted a limited, non-exclusive, non-transferable licence to use MerxTax for your own tax compliance purposes during your subscription period. Your data remains yours — we claim no ownership over your financial records, invoices, or receipts.</P>
        </Section>

        <Section title="8. Limitation of Liability">
          <AlertBox color="#FEF3C7" border="#F59E0B" text="MerxTax is a software tool. It is not a regulated tax adviser, accountant, or financial adviser. LUMEN AI responses do not constitute professional tax advice." />
          <P>To the maximum extent permitted by law, MerxTax is not liable for any HMRC penalty arising from inaccurate data you enter, any loss of data following account cancellation where you failed to export your records, any loss arising from HMRC API downtime outside our control, or any indirect, consequential, or special loss. Our total liability in any 12-month period shall not exceed the total subscription fees paid by you in that period.</P>
          <P>Nothing in these Terms limits liability for death or personal injury caused by our negligence, or fraud.</P>
        </Section>

        <Section title="9. Service Availability">
          <P>We aim to provide MerxTax with 99.5% uptime. We are not liable for HMRC deadline failures caused by service unavailability where we have provided reasonable advance notice of scheduled maintenance.</P>
        </Section>

        <Section title="10. Termination">
          <P><strong>By You:</strong> You may cancel your subscription at any time from your account settings or by emailing support@merxdigital.co.uk. Cancellation takes effect at the end of the current billing period.</P>
          <P><strong>By Us:</strong> We may suspend or terminate your account immediately if you breach these Terms, fail to pay subscription fees, or we are required to do so by law.</P>
          <P><strong>Data on Termination:</strong> You have 30 days after account closure to download your data. After 30 days, your data will be anonymised or deleted. We will send a reminder email 7 days before deletion. It is your legal responsibility to retain tax records for the statutory period.</P>
        </Section>

        <Section title="11. Consumer Rights">
          <P>If you are a consumer, you have a 14-day cooling-off period from the date of subscription under the Consumer Contracts Regulations 2013. This right may not apply if you have begun using the service within the cooling-off period. To exercise this right, email support@merxdigital.co.uk.</P>
        </Section>

        <Section title="12. Governing Law & Disputes">
          <P>These Terms are governed by the laws of England and Wales. Any dispute shall be subject to the exclusive jurisdiction of the courts of England and Wales. Before commencing legal proceedings, both parties agree to attempt resolution through good-faith negotiation for 30 days.</P>
        </Section>

        <Section title="13. Contact">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '24px', marginTop: '16px' }}>
            {[
              ['General Support', 'support@merxdigital.co.uk'],
              ['Legal & Compliance', 'legal@merxdigital.co.uk'],
              ['Privacy / Data Rights', 'privacy@merxdigital.co.uk'],
              ['Security Incidents', 'security@merxdigital.co.uk'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>{label}</p>
                <p style={{ color: '#0A2E1E', fontSize: '14px', fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Dark Contact Box */}
        <div style={{ backgroundColor: '#0A2E1E', borderRadius: '12px', padding: '36px', marginTop: '48px' }}>
          <h2 style={{ color: '#01D98D', fontSize: '20px', fontWeight: 700, fontFamily: '"Montserrat", Arial, sans-serif', margin: '0 0 12px' }}>MerxTax — A Platform by Merx Digital Solutions Ltd</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', margin: '0 0 8px' }}>Registered in England and Wales. Governed by the laws of England and Wales.</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>Last reviewed: 17 April 2026 | Version 1.0</p>
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
            <a href="/terms-of-service" style={{ color: '#01D98D', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
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

function AlertBox({ color, border, text }: { color: string; border: string; text: string }) {
  return (
    <div style={{ backgroundColor: color, borderLeft: `4px solid ${border}`, borderRadius: '8px', padding: '14px 18px', margin: '16px 0', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
      {text}
    </div>
  );
}
