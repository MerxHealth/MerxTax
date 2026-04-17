'use client';

import { useEffect, useRef, useState } from 'react';

// ── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let t = 0;
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    const COLS = 22, ROWS = 30;
    const pts = Array.from({ length: ROWS * COLS }, (_, k) => ({
      gx: (k % COLS) / (COLS - 1),
      gy: Math.floor(k / COLS) / (ROWS - 1),
      phase: Math.random() * Math.PI * 2,
      size: Math.random() * 2.4 + 0.5,
    }));
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;
      pts.forEach(p => {
        const wx = Math.sin(p.gy * 3.6 + t * 0.55 + p.phase) * 0.065;
        const wy = Math.cos(p.gx * 2.7 + t * 0.38 + p.phase) * 0.045;
        const x = (p.gx + wx) * w;
        const y = (p.gy + wy) * h;
        const ef = Math.min(p.gx * 5, 1) * Math.min((1 - p.gx) * 5, 1)
                 * Math.min(p.gy * 5, 1) * Math.min((1 - p.gy) * 4, 1);
        const wf = 0.28 + 0.72 * Math.abs(Math.sin(p.gy * 2.4 + t * 0.28 + p.phase * 0.5));
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(1,217,141,${ef * wf * 0.58})`;
        ctx.fill();
      });
      t += 0.011;
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

// ── Content ───────────────────────────────────────────────────────────────────
const MODULES = [
  {
    name: 'REDITUS',
    tag: 'Income & Expenses',
    desc: 'Every penny tracked in real time. Full HMRC category mapping, VAT handling, cash basis accounting, and a P&L that updates the moment you add a transaction.',
    unique: 'Instant P&L · HMRC categories · VAT ready',
  },
  {
    name: 'VIGIL',
    tag: 'Compliance & Deadlines',
    desc: 'Your personal compliance score, updated live. Penalty point tracker, quarter readiness indicator, and deadline alerts — so HMRC never surprises you.',
    unique: 'Live compliance score · Penalty risk · Quarter readiness',
  },
  {
    name: 'IMPENSUM',
    tag: 'Receipt Capture — 4 channels',
    desc: 'The only UK tax app with four capture methods: snap a receipt, speak a transaction, let GPS auto-log your mileage at 45p/mile, or connect your bank feed. AI reads it all.',
    unique: '📷 Photo · 🎙 Voice · 📍 GPS mileage · 🏦 Open Banking',
  },
  {
    name: 'LUMEN',
    tag: 'AI Tax Advisor',
    desc: 'Ask anything, any time. Trained on HMRC guidance — Class 4 NI, mileage rates, cash vs accruals, self-assessment deadlines. A £3,000/year accountant in your pocket for £14.99/month.',
    unique: 'UK tax trained · Available 24/7 · No judgement',
  },
  {
    name: 'FACTURA',
    tag: 'Invoicing',
    desc: 'Create professional invoices, save repeat clients as templates, mark paid — and watch the income flow straight into REDITUS automatically. No double entry. Ever.',
    unique: 'Repeat client templates · Auto-posts to ledger · PDF ready',
  },
  {
    name: 'QUARTUS',
    tag: 'MTD Submissions',
    desc: 'Submit your quarterly update to HMRC in one click. Pre-flight audit catches duplicates and anomalies before you submit. Confidence score included.',
    unique: 'Pre-flight audit · Confidence score · HMRC live & sandbox',
  },
];

const WHY = [
  {
    title: 'MTD from day one.',
    body: 'Not retrofitted. Every module was built around Making Tax Digital — quarterly submissions, digital records, HMRC API integration. All core, nothing bolted on. FreshBooks, QuickBooks and Xero added MTD as an afterthought. We started with it.',
    highlight: 'The only MTD-native platform for UK self-employed.',
  },
  {
    title: 'AI that actually knows UK tax.',
    body: 'LUMEN isn\'t a generic chatbot. It\'s trained on HMRC guidance — Class 4 NI, the 45p mileage rate, cash basis accounting, self-assessment rules. Ask it anything at 11pm before a deadline. It knows.',
    highlight: 'No generic finance AI. UK tax, specifically.',
  },
  {
    title: 'Four ways to capture. Zero excuses.',
    body: 'Photo, voice, GPS mileage, bank feed. No other UK tax app gives you four capture channels in one place. The gardener who invoices from their van. The consultant who expenses at airports. Everyone covered.',
    highlight: 'The only UK app with photo + voice + GPS + banking.',
  },
];

const PLANS = [
  {
    name: 'SOLO',
    price: '£14.99',
    annual: '£149/yr',
    saving: 'Save £30.89/yr',
    desc: 'Everything a sole trader needs. One income source, full MTD, AI advisor included.',
    features: [
      'MTD Income Tax quarterly submissions',
      'LUMEN AI tax advisor — unlimited questions',
      'IMPENSUM receipt capture (photo + voice + GPS)',
      'VIGIL compliance score & deadline tracker',
      'FACTURA invoicing with client templates',
      'REDITUS income & expense ledger',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '£24.99',
    annual: '£249/yr',
    saving: 'Save £50.89/yr',
    desc: 'Multiple income streams, Open Banking feed, Priority AI. For growing businesses.',
    features: [
      'Everything in SOLO',
      'Multiple income sources (trading + property + other)',
      'Open Banking bank feed via Yapily',
      'Priority LUMEN AI response',
      'Advanced P&L reporting by quarter',
      'VAT tracking and reporting',
    ],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'AGENT',
    price: '£59.99',
    annual: '£599/yr',
    saving: 'Save £120.89/yr',
    desc: 'For accountants and bookkeepers. Manage all your clients from one dashboard.',
    features: [
      'Everything in PRO',
      'Unlimited client accounts',
      'HMRC agent authorisation (SA: 0952CH)',
      'Multi-client compliance dashboard',
      'Client approval and submission workflow',
      'White-label ready',
    ],
    cta: 'Talk to us',
    highlight: false,
  },
];

const STATS = [
  { val: '5M+',  label: 'UK self-employed people' },
  { val: '£100', label: 'Minimum HMRC fine — avoidable' },
  { val: '4',    label: 'Capture channels — unique to MerxTax' },
  { val: '2026', label: 'MTD mandatory for £20k+ earners' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const S: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#0A2E1E', overflowX: 'hidden' };

  return (
    <div style={S}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .hl { display: block; font-family: 'Montserrat', sans-serif; font-weight: 900; line-height: 0.92; color: #01D98D;
              opacity: 0; transform: translateY(32px); transition: opacity 0.75s ease, transform 0.75s ease; }
        .hl:nth-child(2) { transition-delay: 0.13s; }
        .hl:nth-child(3) { transition-delay: 0.26s; }
        .hs  { opacity: 0; transform: translateY(14px); transition: opacity 0.6s ease 0.44s, transform 0.6s ease 0.44s; }
        .hc  { opacity: 0; transform: translateY(10px); transition: opacity 0.6s ease 0.58s, transform 0.6s ease 0.58s; }
        .go .hl, .go .hs, .go .hc { opacity: 1; transform: translateY(0); }

        .btn-g {
          display: inline-block; padding: 15px 36px;
          background: #01D98D; color: #0A2E1E;
          font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 13px;
          letter-spacing: 0.06em; text-transform: uppercase;
          border-radius: 3px; text-decoration: none; border: none; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-g:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(1,217,141,0.38); }
        .btn-o {
          display: inline-block; padding: 14px 36px; background: transparent; color: #0A2E1E;
          font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 13px;
          letter-spacing: 0.06em; text-transform: uppercase; border-radius: 3px; text-decoration: none;
          border: 1.5px solid rgba(10,46,30,0.22); cursor: pointer; transition: border-color 0.15s, color 0.15s;
        }
        .btn-o:hover { border-color: #01D98D; color: #01D98D; }

        .mrow { border-top: 1px solid #EBEBEB; display: grid; grid-template-columns: 200px 1fr; transition: background 0.12s; }
        .mrow:last-child { border-bottom: 1px solid #EBEBEB; }
        .mrow:hover { background: #FAFAFA; }

        .pc { padding: 36px 32px; border: 1px solid #EBEBEB; }
        .pc.pro { border: 2px solid #01D98D; position: relative; }
        .pro-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
          background: #01D98D; color: #0A2E1E; font-family: 'Montserrat', sans-serif;
          font-weight: 800; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
          padding: 5px 16px; border-radius: 0 0 4px 4px; white-space: nowrap; }

        @media (max-width: 900px) {
          .hlsize { font-size: clamp(40px, 11vw, 80px) !important; }
          .hlayout { flex-direction: column !important; }
          .hpart { min-height: 260px !important; position: relative !important; }
          .pgrid { grid-template-columns: 1fr !important; }
          .sgrid { grid-template-columns: 1fr 1fr !important; }
          .mrow  { grid-template-columns: 1fr !important; }
          .mname { border-right: none !important; border-bottom: 1px solid #EBEBEB !important; }
          .fgrid { flex-direction: column !important; gap: 28px !important; }
          .wnav  { display: none !important; }
          .whycards { flex-direction: column !important; }
          .fcta-inner { flex-direction: column !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="MerxTax" style={{ height: 38, width: 'auto', display: 'block' }} />
          </div>
          <div className="wnav" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {[['How it works', '#modules'], ['Why MerxTax', '#why'], ['Pricing', '#pricing']].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 13, fontWeight: 600, color: '#888', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0A2E1E')}
                onMouseLeave={e => (e.currentTarget.style.color = '#888')}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#888', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0A2E1E')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Sign in</a>
            <a href="/login" className="btn-g" style={{ fontSize: 12, padding: '10px 22px' }}>Get Started Free</a>
          </div>
        </div>
      </nav>

      <div className={mounted ? 'go' : ''}>

        {/* ── HERO ── */}
        <section style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', background: '#fff' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', width: '100%' }} className="hlayout">
            <div style={{ flex: '1 1 480px', padding: '80px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 20, padding: '5px 14px', marginBottom: 32 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#01D98D', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#065F46' }}>Live · Making Tax Digital compliant</span>
              </div>
              <h1 style={{ marginBottom: 44 }}>
                <span className="hl hlsize" style={{ fontSize: 'clamp(44px, 7vw, 80px)' }}>accurate.</span>
                <span className="hl hlsize" style={{ fontSize: 'clamp(44px, 7vw, 80px)' }}>compliant.</span>
                <span className="hl hlsize" style={{ fontSize: 'clamp(44px, 7vw, 80px)' }}>sorted.</span>
              </h1>
              <p className="hs" style={{ fontSize: 17, color: '#5A6370', lineHeight: 1.78, maxWidth: 420, marginBottom: 40 }}>
                The only MTD-native platform built for UK self-employed people. Six modules. Four capture channels. One AI tax advisor. No accountant required.
              </p>
              <div className="hc" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28 }}>
                <a href="/login" className="btn-g">Start Free Trial</a>
                <a href="#modules" className="btn-o">See all features</a>
              </div>
              <div className="hc" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {['HMRC MTD certified', 'No accountant needed', '14-day free trial'].map(t => (
                  <span key={t} style={{ fontSize: 12, color: '#ADADAD', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#01D98D', fontWeight: 800 }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="hpart" style={{ flex: '0 0 460px', position: 'relative', alignSelf: 'stretch', minHeight: '100%' }}>
              <ParticleCanvas />
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <div style={{ background: 'linear-gradient(135deg, #01D98D 0%, #01D98D 30%, #0ACAAF 60%, #0EBDCA 100%)', padding: '22px 28px' }}>
          <div className="sgrid" style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {STATS.map((s, i, a) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '6px 0', borderRight: i < a.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MODULES ── */}
        <section id="modules" style={{ background: '#fff', padding: '100px 28px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 24 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#BDBDBD', marginBottom: 14 }}>The Platform</p>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(34px, 5vw, 52px)', color: '#0A2E1E', lineHeight: 1.0 }}>
                  Six modules.<br /><span style={{ color: '#01D98D' }}>Zero compromises.</span>
                </h2>
              </div>
              <a href="/login" className="btn-g">Access all modules →</a>
            </div>
            {MODULES.map(m => (
              <div key={m.name} className="mrow">
                <div className="mname" style={{ padding: '28px 20px 28px 0', borderRight: '1px solid #EBEBEB' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 12, color: '#0A2E1E', letterSpacing: 1, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#01D98D', fontWeight: 700, letterSpacing: 0.3 }}>{m.tag}</div>
                </div>
                <div style={{ padding: '28px 0 28px 28px' }}>
                  <p style={{ fontSize: 14, color: '#5A6370', lineHeight: 1.7, marginBottom: 10, maxWidth: 620 }}>{m.desc}</p>
                  <div style={{ fontSize: 11, color: '#01D98D', fontWeight: 700, letterSpacing: 0.3 }}>{m.unique}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY — gradient + white cards (Carolina concept) ── */}
        <section id="why" style={{ position: 'relative', padding: '88px 28px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #01D98D 0%, #01D98D 35%, #0ACAAF 65%, #0EBDCA 100%)' }} />
          <div style={{ position: 'relative', maxWidth: 1160, margin: '0 auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 40 }}>Why MerxTax</p>
            <div className="whycards" style={{ display: 'flex', gap: 12 }}>
              {WHY.map(w => (
                <div key={w.title} style={{ flex: 1, background: '#fff', borderRadius: 4, padding: '36px 32px' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, color: '#0A2E1E', lineHeight: 1.2, marginBottom: 14 }}>{w.title}</div>
                  <p style={{ fontSize: 13, color: '#5A6370', lineHeight: 1.75, marginBottom: 16 }}>{w.body}</p>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#01D98D', borderTop: '1px solid #EBEBEB', paddingTop: 14 }}>{w.highlight}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ background: '#fff', padding: '100px 28px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ marginBottom: 56 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#BDBDBD', marginBottom: 16 }}>Pricing</p>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(34px, 5vw, 52px)', color: '#0A2E1E', lineHeight: 1.0 }}>
                Simple.<br /><span style={{ color: '#01D98D' }}>No surprises.</span>
              </h2>
            </div>
            <div className="pgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {PLANS.map((plan, i) => (
                <div key={plan.name} className={`pc${plan.highlight ? ' pro' : ''}`}
                  style={{ borderLeft: i > 0 ? 'none' : undefined, marginTop: plan.highlight ? 0 : 0 }}>
                  {plan.highlight && <div className="pro-badge">Most popular</div>}
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: plan.highlight ? '#01D98D' : '#ADADAD', marginBottom: plan.highlight ? 28 : 20 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 44, color: '#0A2E1E', lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: '#ADADAD' }}>/mo</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#01D98D' }}>{plan.annual} billed annually</span>
                    <span style={{ fontSize: 10, background: '#F0FDF8', color: '#065F46', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{plan.saving}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, marginBottom: 24 }}>{plan.desc}</p>
                  <a href="/login" style={{ display: 'block', textAlign: 'center', padding: '12px', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: 0.06, textTransform: 'uppercase', borderRadius: 3, textDecoration: 'none', marginBottom: 24, background: plan.highlight ? '#01D98D' : '#0A2E1E', color: plan.highlight ? '#0A2E1E' : '#01D98D' }}>
                    {plan.cta}
                  </a>
                  <div style={{ borderTop: '1px solid #EBEBEB', paddingTop: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: '#01D98D', fontWeight: 800, flexShrink: 0, fontSize: 13 }}>✓</span>
                        <span style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#BDBDBD', textAlign: 'center', marginTop: 20 }}>No setup fees · No hidden charges · Cancel any time · 14-day free trial on all plans</p>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ borderTop: '1px solid #EBEBEB', padding: '100px 28px', background: '#fff' }}>
          <div className="fcta-inner" style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(40px, 6vw, 68px)', color: '#0A2E1E', lineHeight: 0.95 }}>
                MTD is coming.<br /><span style={{ color: '#01D98D' }}>Be ready.</span>
              </h2>
            </div>
            <div style={{ maxWidth: 380 }}>
              <p style={{ fontSize: 16, color: '#5A6370', lineHeight: 1.78, marginBottom: 12 }}>
                From April 2026, every self-employed person earning over £20,000 must file quarterly with HMRC. Miss a deadline and the penalty points start. Four and you're fined.
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0A2E1E', marginBottom: 28 }}>MerxTax handles it all. Takes under 5 minutes to set up.</p>
              <a href="/login" className="btn-g">Start Free Trial →</a>
              <p style={{ fontSize: 11, color: '#BDBDBD', marginTop: 12 }}>No credit card required · Cancel anytime</p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#FAFAFA', borderTop: '1px solid #EBEBEB', padding: '52px 28px 32px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div className="fgrid" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 44, flexWrap: 'wrap', gap: 40 }}>
              <div style={{ flex: '0 0 240px' }}>
                <img src="/logo.png" alt="MerxTax" style={{ height: 44, width: 'auto', display: 'block' }} />
                <p style={{ fontSize: 13, color: '#ADADAD', lineHeight: 1.7, marginTop: 16, maxWidth: 220 }}>
                  Digital Tax. Your Language. Your Terms.<br />Merx Digital Solutions Ltd.
                </p>
                <div style={{ marginTop: 12, fontSize: 11, color: '#ADADAD', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#01D98D', display: 'inline-block', marginRight: 6 }} />
                  Live at merxtax.co.uk
                </div>
              </div>
              {[
                { title: 'Product', links: [['Dashboard', '/login'], ['Pricing', '#pricing'], ['Guide', '/guide'], ['LUMEN AI', '/login'], ['FACTURA Invoicing', '/login']] },
                { title: 'Company', links: [['About', '#'], ['Privacy Policy', '#'], ['Terms of Service', '#'], ['Contact', '#'], ['Careers', '#']] },
                { title: 'Support', links: [['Help Centre', '#'], ['MTD Guide', '/guide'], ['API Status', '#'], ['Agent Portal', '/login'], ['Changelog', '#']] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#BDBDBD', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>{col.title}</div>
                  {col.links.map(([label, href]) => (
                    <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: '#888', textDecoration: 'none', marginBottom: 10 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#01D98D')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #EBEBEB', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#BDBDBD' }}>© 2026 Merx Digital Solutions Ltd · Registered in England & Wales</span>
              <span style={{ fontSize: 11, color: '#BDBDBD' }}>HMRC Agent SA: 0952CH · Making Tax Digital certified</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
