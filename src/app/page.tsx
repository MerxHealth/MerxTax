'use client';

import { useEffect, useState } from 'react';
import NavHeader from '@/components/NavHeader';
import Logo from '@/components/Logo';

const FEATURES = [
  { name: 'REDITUS', desc: 'Income & Expenses', detail: 'Log every penny. Track income, expenses and VAT in real time with full HMRC category mapping.', icon: '📊' },
  { name: 'VIGIL', desc: 'Compliance & Deadlines', detail: 'Never miss a deadline. Penalty point tracking, quarter readiness scores and automated alerts.', icon: '🛡️' },
  { name: 'IMPENSUM', desc: 'Receipt Capture', detail: 'Snap a receipt, speak a transaction, or let GPS log your mileage. AI reads it all.', icon: '📷' },
  { name: 'LUMEN', desc: 'AI Tax Advisor', detail: 'Ask anything. Your personal AI trained on UK tax law — available 24/7, never judges.', icon: '🤖' },
  { name: 'FACTURA', desc: 'Invoicing', detail: 'Create, send and track invoices. Mark paid and it flows straight into your income ledger.', icon: '🧾' },
  { name: 'QUARTUS', desc: 'MTD Submissions', detail: 'One click to submit your quarterly update to HMRC. Pre-flight audit included.', icon: '🏛️' },
];

const PLANS = [
  {
    name: 'SOLO',
    price: '£14.99',
    period: '/mo',
    annual: '£149/yr',
    desc: 'Perfect for sole traders getting started with MTD.',
    features: ['1 income source', 'MTD Income Tax submissions', 'LUMEN AI advisor', 'Receipt capture', 'VIGIL compliance tracker', 'FACTURA invoicing'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '£24.99',
    period: '/mo',
    annual: '£249/yr',
    desc: 'For growing businesses with multiple income streams.',
    features: ['Multiple income sources', 'Open Banking integration', 'Priority LUMEN AI', 'All SOLO features', 'Advanced P&L reporting', 'VAT tracking'],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'AGENT',
    price: '£59.99',
    period: '/mo',
    annual: '£599/yr',
    desc: 'For accountants and bookkeepers managing multiple clients.',
    features: ['Unlimited clients', 'Agent authorisation (SA 0952CH)', 'Multi-client dashboard', 'White-label ready', 'All PRO features', 'Priority support'],
    cta: 'Get Started',
    highlight: false,
  },
];

const STATS = [
  { value: '5M+', label: 'UK self-employed' },
  { value: '£100', label: 'Minimum HMRC fine' },
  { value: '3', label: 'Languages supported' },
  { value: '24', label: 'HMRC APIs connected' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    setVisible(true);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#FFFFFF', color: '#0A2E1E', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hero-title {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .hero-sub {
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s;
        }
        .hero-cta {
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s;
        }
        .hero-badge {
          opacity: 0;
          transition: opacity 0.6s ease 0.45s;
        }
        .page-visible .hero-title,
        .page-visible .hero-sub,
        .page-visible .hero-cta,
        .page-visible .hero-badge {
          opacity: 1; transform: translateY(0);
        }

        .feature-card {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 28px 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(1,217,141,0.12);
          border-color: #01D98D;
        }

        .plan-card {
          background: #fff;
          border: 1.5px solid #E5E7EB;
          border-radius: 20px;
          padding: 32px 28px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.08);
        }
        .plan-card.highlight {
          background: #0A2E1E;
          border-color: #0A2E1E;
        }

        .cta-btn {
          display: inline-block;
          padding: 14px 32px;
          background: #01D98D;
          color: #0A2E1E;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 15px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(1,217,141,0.35);
        }
        .cta-btn-outline {
          display: inline-block;
          padding: 14px 32px;
          background: transparent;
          color: #0A2E1E;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 15px;
          border-radius: 10px;
          text-decoration: none;
          border: 2px solid #0A2E1E;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .cta-btn-outline:hover {
          background: #0A2E1E;
          color: #01D98D;
        }

        .check-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-title-text { font-size: 40px !important; }
          .why-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <NavHeader />

      <div className={visible ? 'page-visible' : ''}>

        {/* ── Hero ── */}
        <section style={{ background: '#FFFFFF', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }} className="hero-grid">

              <div style={{ flex: '1 1 480px', maxWidth: 580 }}>
                {/* Badge */}
                <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 20, padding: '6px 14px', marginBottom: 28 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#01D98D', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>Live · Making Tax Digital compliant</span>
                </div>

                <h1 className="hero-title hero-title-text" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 56, lineHeight: 1.08, color: '#0A2E1E', marginBottom: 20 }}>
                  Your taxes.<br />
                  <span style={{ color: '#01D98D' }}>Your language.</span><br />
                  Your terms.
                </h1>

                <p className="hero-sub" style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
                  MerxTax is the MTD-native platform built for UK self-employed people who want to stay compliant without becoming accountants.
                </p>

                <div className="hero-cta" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a href="/login" className="cta-btn">Get Started — it's free</a>
                  <a href="/guide" className="cta-btn-outline">See how it works</a>
                </div>

                <div className="hero-badge" style={{ marginTop: 28, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {['No accountant needed', 'HMRC MTD certified', 'Cancel anytime'].map(t => (
                    <span key={t} style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: '#01D98D', fontWeight: 700 }}>✓</span> {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hero visual */}
              <div style={{ flex: '1 1 340px', maxWidth: 420, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.07)' }}>
                  {/* Mini dashboard preview */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Profit YTD</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 32, color: '#0A2E1E', marginTop: 2 }}>£18,500</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 13, color: '#01D98D' }}>80</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[['Income', '£19,496', '#01D98D'], ['Expenses', '£995', '#EF4444'], ['Tax due', '£1,542', '#F59E0B'], ['Q1 Ready', '100%', '#01D98D']].map(([l, v, c]) => (
                      <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '0.5px solid #E5E7EB' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: c, marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#065F46', fontWeight: 500 }}>
                    ✓ Q1 submission ready — 7 Aug deadline in 112 days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section style={{ background: 'linear-gradient(135deg, #01D98D 0%, #01D98D 30%, #0ACAAF 60%, #0EBDCA 100%)', padding: '28px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '8px 0', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why MerxTax ── */}
        <section style={{ background: '#fff', padding: '88px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#01D98D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Why MerxTax</div>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 38, color: '#0A2E1E', lineHeight: 1.2 }}>
                MTD is mandatory.<br />Stress is optional.
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', marginTop: 16, maxWidth: 520, margin: '16px auto 0' }}>
                From April 2026, every self-employed person earning over £20,000 must file quarterly with HMRC. MerxTax makes that painless.
              </p>
            </div>
            <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { icon: '⚡', title: 'Built for MTD from day one', desc: 'Not a retrofit. Every module was designed around Making Tax Digital — quarterly submissions, digital record-keeping, and HMRC API integration are core, not add-ons.' },
                { icon: '🧠', title: 'AI that actually understands UK tax', desc: 'LUMEN is trained on HMRC guidance, not generic finance. Ask it about the 45p mileage rate, Class 4 NI, or cash basis accounting — it knows.' },
                { icon: '🔐', title: 'Your data, your business', desc: 'Bank-grade encryption, GDPR compliant, hosted in Frankfurt. We never sell your data or show you ads. MerxTax earns from subscriptions, not from you.' },
              ].map(item => (
                <div key={item.title} style={{ padding: '32px', background: '#F9FAFB', borderRadius: 20, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 17, color: '#0A2E1E', marginBottom: 10 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ background: '#F9FAFB', padding: '88px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#01D98D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Everything included</div>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 38, color: '#0A2E1E', lineHeight: 1.2 }}>Six modules. One platform.</h2>
              <p style={{ fontSize: 16, color: '#6B7280', marginTop: 16, maxWidth: 480, margin: '16px auto 0' }}>Every tool a UK self-employed person needs, designed to work together from day one.</p>
            </div>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {FEATURES.map(f => (
                <div key={f.name} className="feature-card">
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 15, color: '#0A2E1E' }}>{f.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#01D98D', textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.desc}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section style={{ background: '#fff', padding: '88px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#01D98D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Pricing</div>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 38, color: '#0A2E1E', lineHeight: 1.2 }}>Simple, honest pricing.</h2>
              <p style={{ fontSize: 16, color: '#6B7280', marginTop: 16 }}>No setup fees. No hidden charges. Cancel any time.</p>
            </div>
            <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
              {PLANS.map(plan => (
                <div key={plan.name} className={`plan-card${plan.highlight ? ' highlight' : ''}`}>
                  {plan.highlight && (
                    <div style={{ background: '#01D98D', color: '#0A2E1E', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>Most popular</div>
                  )}
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: plan.highlight ? '#01D98D' : '#0A2E1E', marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 36, color: plan.highlight ? '#fff' : '#0A2E1E' }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#9CA3AF' }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: plan.highlight ? '#01D98D' : '#01D98D', marginBottom: 16, fontWeight: 600 }}>{plan.annual} billed annually</div>
                  <p style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>{plan.desc}</p>
                  <a href="/login" className="cta-btn" style={{ display: 'block', textAlign: 'center', marginBottom: 24, background: plan.highlight ? '#01D98D' : '#0A2E1E', color: plan.highlight ? '#0A2E1E' : '#01D98D' }}>
                    {plan.cta}
                  </a>
                  <div style={{ borderTop: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.1)' : '#F3F4F6'}`, paddingTop: 20 }}>
                    {plan.features.map(feat => (
                      <div key={feat} className="check-item">
                        <span style={{ color: '#01D98D', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                        <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : '#374151', fontSize: 13 }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ background: '#0A2E1E', padding: '88px 24px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 42, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
              MTD is coming.<br />
              <span style={{ color: '#01D98D' }}>Be ready.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Join thousands of UK self-employed people who have already switched to digital tax management. Start today — it takes less than 5 minutes.
            </p>
            <a href="/login" className="cta-btn" style={{ fontSize: 16, padding: '16px 40px' }}>Get Started Free</a>
            <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No credit card required · Cancel anytime</div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: '#061A10', padding: '48px 24px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
              <div>
                <Logo height={160} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginTop: 16, maxWidth: 280 }}>
                  Digital Tax. Your Language. Your Terms.<br />
                  Built by Merx Digital Solutions Ltd.
                </p>
              </div>
              {[
                { title: 'Product', links: [['Dashboard', '/login'], ['Pricing', '/pricing'], ['Guide', '/guide'], ['LUMEN AI', '/login']] },
                { title: 'Company', links: [['About', '#'], ['Privacy', '#'], ['Terms', '#'], ['Contact', '#']] },
                { title: 'Support', links: [['Help Centre', '#'], ['MTD Guide', '/guide'], ['API Status', '#'], ['Changelog', '#']] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{col.title}</div>
                  {col.links.map(([label, href]) => (
                    <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#01D98D')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 Merx Digital Solutions Ltd · Company registered in England & Wales</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>HMRC Agent SA: 0952CH · Making Tax Digital certified</div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
