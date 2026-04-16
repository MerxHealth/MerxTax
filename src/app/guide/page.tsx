'use client';

import { useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Register as Self-Employed with HMRC',
    time: '10 minutes',
    urgent: true,
    summary: 'You must register by 5 October in your second year of trading. Missing this deadline means an automatic £100 penalty.',
    details: [
      'Go to gov.uk/register-for-self-assessment',
      'Select "I am self-employed" or "I have untaxed income"',
      'You\'ll need your National Insurance number and contact details',
      'HMRC will send your Unique Taxpayer Reference (UTR) by post within 10 working days',
      'Your UTR is 10 digits — keep it safe, you\'ll use it forever',
    ],
    tip: 'Register as soon as you start earning — even if it\'s a side income alongside employment. The clock starts from your first pound earned, not when you decide to go full-time.',
    link: 'https://www.gov.uk/register-for-self-assessment',
    linkText: 'Register on GOV.UK →',
  },
  {
    number: '02',
    title: 'Set Up Your National Insurance',
    time: '5 minutes',
    urgent: false,
    summary: 'As a self-employed person you pay Class 2 and Class 4 National Insurance — different from employment NI and often missed by first-timers.',
    details: [
      'Class 2 NI: £3.45/week (paid annually via Self Assessment) — applies if profit over £12,570',
      'Class 4 NI: 9% on profits between £12,570 and £50,270, then 2% above',
      'Both are collected through your January Self Assessment payment',
      'You don\'t need to do anything separately — HMRC calculates it automatically',
      'Voluntary Class 2 contributions protect your State Pension entitlement if profit is low',
    ],
    tip: 'MerxTax calculates your Class 2 and Class 4 NI in real time as you log income. Most self-employed people are surprised how much NI adds to their tax bill — knowing early means no nasty shocks in January.',
    link: null,
    linkText: null,
  },
  {
    number: '03',
    title: 'Open a Separate Business Bank Account',
    time: '15 minutes',
    urgent: false,
    summary: 'Not legally required but practically essential. Mixing personal and business money is the single biggest cause of tax headaches for self-employed people.',
    details: [
      'Starling, Monzo Business, and Tide all offer free business accounts',
      'Keeps your records clean and makes Self Assessment straightforward',
      'HMRC can\'t touch your personal account if you\'re investigated — separation matters',
      'Makes it easy to see profit and loss at a glance',
      'Looks professional when clients pay you',
    ],
    tip: 'Pay yourself a regular "salary" from the business account to your personal account. This creates a clear boundary and stops you accidentally spending money you owe in tax.',
    link: null,
    linkText: null,
  },
  {
    number: '04',
    title: 'Understand Your Tax Deadlines',
    time: '2 minutes to learn, a lifetime to respect',
    urgent: true,
    summary: 'Missing HMRC deadlines triggers automatic penalties that compound quickly. Know these dates before you need them.',
    details: [
      '5 October — register for Self Assessment (if new to self-employment)',
      '31 October — paper Self Assessment tax return deadline',
      '31 January — online Self Assessment deadline AND tax payment due',
      '31 July — second Payment on Account due (if your bill is over £1,000)',
      'Quarterly MTD submissions — due 7 August, 7 November, 7 February, 7 May',
    ],
    tip: 'The 31 January deadline is a double-hit — you pay last year\'s tax bill AND your first Payment on Account for next year simultaneously. If your annual tax bill is £3,000, you\'ll owe £4,500 on that date. Set aside 25-30% of everything you earn from day one.',
    link: null,
    linkText: null,
  },
  {
    number: '05',
    title: 'Know What Expenses You Can Claim',
    time: '20 minutes to learn',
    urgent: false,
    summary: 'Most self-employed people underclaim expenses by hundreds of pounds every year. Every legitimate expense reduces your tax bill.',
    details: [
      'Office costs — stationery, postage, broadband, phone (business proportion)',
      'Travel — mileage at 45p/mile for cars, public transport, parking',
      'Clothing — only workwear/uniforms, not everyday clothes',
      'Staff costs — wages, subcontractor fees, freelancers',
      'Marketing — website, advertising, business cards',
      'Professional fees — accountant, solicitor, bank charges',
      'Equipment — tools, machinery, computers (immediate or capital allowances)',
      'Training — courses directly related to your current work',
      'Use of home — if you work from home, a proportion of bills',
    ],
    tip: 'Keep every receipt. A £50 receipt from Travis Perkins saves a self-employed tradesperson £10 in tax at the basic rate — and £20 at higher rate. Over a year, missed receipts easily cost £500-£1,000 in unnecessary tax.',
    link: null,
    linkText: null,
  },
  {
    number: '06',
    title: 'Set Up Making Tax Digital (MTD)',
    time: '15 minutes',
    urgent: true,
    summary: 'From April 2026, MTD for Income Tax is mandatory for self-employed people earning over £50,000. By 2027 it drops to £30,000. By 2028, everyone is included.',
    details: [
      'MTD requires quarterly digital record submissions to HMRC — not just an annual return',
      'You must use HMRC-approved software (like MerxTax) to submit',
      'Quarterly deadlines: 7 August, 7 November, 7 February, 7 May',
      'Each quarter you submit income and expense summaries electronically',
      'A final end-of-year declaration replaces the traditional Self Assessment return',
      'Penalties for non-compliance start immediately from the relevant April',
    ],
    tip: 'Don\'t wait until you\'re forced. Setting up MTD-compatible software now means your records are already digital, your quarterly submissions become routine, and you avoid the January scramble forever.',
    link: 'https://www.gov.uk/guidance/sign-up-your-business-for-making-tax-digital-for-income-tax',
    linkText: 'Read HMRC MTD guidance →',
  },
  {
    number: '07',
    title: 'Consider VAT Registration',
    time: '30 minutes',
    urgent: false,
    summary: 'Mandatory above £85,000 turnover in any 12-month period. Voluntary registration below this can actually benefit some businesses.',
    details: [
      'Mandatory registration: notify HMRC within 30 days of exceeding £85,000',
      'Voluntary registration: allowed at any turnover level',
      'Standard rate VAT is 20% on most goods and services',
      'Once registered, you charge VAT to clients and pay the net to HMRC quarterly',
      'You reclaim VAT on business purchases — significant for product-based businesses',
      'Flat Rate Scheme available for businesses under £150,000 turnover — often simpler',
      'Becoming VAT registered signals credibility to larger B2B clients',
    ],
    tip: 'If most of your clients are VAT-registered businesses (not consumers), voluntary registration can save you money — you reclaim input VAT on purchases without your clients caring about the extra charge. If your clients are mostly consumers, voluntary registration costs them 20% more.',
    link: 'https://www.gov.uk/vat-registration',
    linkText: 'Check if you should register →',
  },
  {
    number: '08',
    title: 'Keep Records from Day One',
    time: 'Ongoing',
    urgent: false,
    summary: 'HMRC can investigate your records up to 6 years back. Good record-keeping protects you, reduces your accountant\'s fees, and saves hours every January.',
    details: [
      'Keep all invoices issued and received',
      'Bank statements for all business accounts',
      'Receipts for every expense — digital copies are fine',
      'Mileage log if you use a personal vehicle for business',
      'Records of any assets purchased for the business',
      'PAYE records if you employ anyone',
      'Under MTD, digital records must be kept using approved software',
    ],
    tip: 'The 2-second rule: process every receipt within 2 seconds of getting it. Photo it immediately with MerxTax before it goes in your pocket. A receipt in your pocket has a 70% chance of being lost or washed. A photo is permanent.',
    link: null,
    linkText: null,
  },
];

const faqs = [
  {
    q: 'Do I need an accountant?',
    a: 'Not necessarily. Many self-employed people file their own Self Assessment without an accountant. The complexity depends on your situation — if you have multiple income streams, property income, or complex expenses, an accountant earns their fee. For a straightforward sole trader, MTD-compliant software like MerxTax handles everything.',
  },
  {
    q: 'What happens if I don\'t register?',
    a: 'HMRC will find out — through bank data, Companies House, VAT registration, or third-party reports. Penalties include interest on unpaid tax, a £100 late filing penalty (rising to £1,000+), and in serious cases a formal investigation. It\'s always better to register voluntarily than wait to be discovered.',
  },
  {
    q: 'Can I be employed AND self-employed at the same time?',
    a: 'Yes. Many people have a job and a side business. Your employer handles PAYE tax on your employment income. You file a Self Assessment return to declare your self-employed income separately. HMRC adjusts your tax code to account for both.',
  },
  {
    q: 'What is a UTR number?',
    a: 'Your Unique Taxpayer Reference — a 10-digit number HMRC assigns when you register for Self Assessment. You\'ll use it on every tax return, correspondence, and (if you work in construction) for CIS verification. Keep it somewhere permanent.',
  },
  {
    q: 'When do I have to start paying tax?',
    a: 'Your first tax payment is due on 31 January after your first full tax year of self-employment. So if you start in June 2025, your first payment is due 31 January 2027. However, if your bill exceeds £1,000, you\'ll also make Payments on Account — advance payments towards next year\'s bill.',
  },
  {
    q: 'What is Making Tax Digital and does it affect me?',
    a: 'MTD for Income Tax replaces the annual Self Assessment return with quarterly digital submissions. It\'s mandatory from April 2026 for self-employed people earning over £50,000, April 2027 for over £30,000, and April 2028 for everyone else. You need HMRC-approved software to comply.',
  },
];

export default function GuidePage() {
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        .step-card { transition: box-shadow 0.2s; }
        .step-card:hover { box-shadow: 0 4px 20px rgba(1,217,141,0.08); }
        .faq-card { transition: background 0.15s; cursor: pointer; }
        .faq-card:hover { background: #F8FAFB !important; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => window.location.href = '/'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E' }}>mer</span>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#01D98D' }}>X</span>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E' }}>tax</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => window.location.href = '/login'} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Sign in</button>
          <button onClick={() => window.location.href = '/signup'} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Start free →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(160deg, #0A2E1E 0%, #0d3d27 60%, #0A2E1E 100%)', padding: '72px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(1,217,141,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14,189,202,0.06) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(1,217,141,0.12)', border: '1px solid rgba(1,217,141,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 14 }}>🇬🇧</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#01D98D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UK Self-Employment Guide 2026</span>
          </div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(32px, 6vw, 58px)', color: '#fff', lineHeight: 1.05, marginBottom: 20 }}>
            Everything you need to know<br />about going self-employed.
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 40, fontWeight: 300, maxWidth: 560, margin: '0 auto 40px' }}>
            An honest, plain-English guide covering registration, tax deadlines, expenses, Making Tax Digital, and every mistake first-timers make — written by people who've been through it.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 14, padding: '12px 28px', borderRadius: 10, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Read the guide ↓
            </button>
            <button onClick={() => window.location.href = '/signup'} style={{ fontSize: 14, padding: '12px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, cursor: 'pointer' }}>
              Try MerxTax free →
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: '#F8FAFB', padding: '32px 24px', borderBottom: '1px solid #E5E7EB' }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { num: '5 Oct', label: 'Registration deadline year 2' },
            { num: '31 Jan', label: 'Self Assessment & tax payment' },
            { num: '25-30%', label: 'Of income to set aside for tax' },
            { num: '6 years', label: 'HMRC can investigate back' },
          ].map(s => (
            <div key={s.num}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 22, color: '#0A2E1E', marginBottom: 4 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STEPS */}
      <div id="steps" style={{ maxWidth: 820, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#01D98D', marginBottom: 10 }}>The complete checklist</div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 4vw, 36px)', color: '#0A2E1E', marginBottom: 12 }}>8 steps to get it right.</h2>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7 }}>Follow these in order. Don't skip anything — each step builds on the last.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((step, idx) => {
            const isOpen = openStep === idx;
            return (
              <div key={idx} className="step-card" style={{ background: '#fff', border: `1px solid ${isOpen ? '#01D98D' : '#E5E7EB'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <div onClick={() => setOpenStep(isOpen ? null : idx)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isOpen ? '#01D98D' : '#F0FDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 12, color: isOpen ? '#0A2E1E' : '#01D98D' }}>{step.number}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>{step.title}</div>
                      {step.urgent && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEF2F2', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Time sensitive</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>⏱ {step.time}</div>
                  </div>
                  <div style={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 24px 24px' }}>
                    <div style={{ padding: '16px', background: '#F0FDF8', borderRadius: 10, marginBottom: 16, fontSize: 14, color: '#065F46', lineHeight: 1.7, fontWeight: 500 }}>
                      {step.summary}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9CA3AF', marginBottom: 10 }}>What to do</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {step.details.map((d, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#F0FDF8', border: '1px solid #BBF7E4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#01D98D' }}>{i + 1}</span>
                            </div>
                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginBottom: step.link ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400E', marginBottom: 6 }}>💡 MerxTax tip</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{step.tip}</div>
                    </div>

                    {step.link && (
                      <a href={step.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13, fontWeight: 700, color: '#01D98D', textDecoration: 'none' }}>
                        {step.linkText}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MerxTax CTA STRIP */}
      <div style={{ background: '#0A2E1E', padding: '60px 24px' }}>
        <div className="cta-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#01D98D', marginBottom: 12 }}>Built for self-employed people</div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
              MerxTax handles<br />all of this for you.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 28, fontWeight: 300 }}>
              Quarterly MTD submissions, expense tracking, tax liability in real time, CIS deductions, invoice creation — all in one place. Designed for people who run a business, not for accountants.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => window.location.href = '/signup'} style={{ fontSize: 14, padding: '12px 24px', borderRadius: 10, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Start free today →
              </button>
              <button onClick={() => window.location.href = '/pricing'} style={{ fontSize: 14, padding: '12px 24px', borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, cursor: 'pointer' }}>
                See pricing
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📊', title: 'MTD Quarterly Submissions', desc: 'Submit directly to HMRC. No accountant needed.' },
              { icon: '🧾', title: 'Receipt Scanning with AI', desc: 'Photo your receipts. LUMEN categorises everything.' },
              { icon: '💰', title: 'Real-Time Tax Estimate', desc: 'Always know what you owe. No January surprises.' },
              { icon: '📄', title: 'Invoicing (FACTURA)', desc: 'Create and send professional invoices in seconds.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#01D98D', marginBottom: 10 }}>Common questions</div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: '#0A2E1E' }}>Things people always ask.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="faq-card" onClick={() => setOpenFaq(isOpen ? null : idx)} style={{ background: isOpen ? '#F8FAFB' : '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E', lineHeight: 1.4 }}>{faq.q}</div>
                  <span style={{ fontSize: 16, color: '#9CA3AF', flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 12, fontSize: 13, color: '#6B7280', lineHeight: 1.8, borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ background: '#F0FDF8', borderTop: '1px solid #BBF7E4', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 3vw, 28px)', color: '#0A2E1E', marginBottom: 12 }}>
            Ready to do this properly?
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
            MerxTax was built specifically for UK self-employed people. MTD compliant, HMRC connected, and simple enough to use in under 5 minutes a week.
          </p>
          <button onClick={() => window.location.href = '/signup'} style={{ fontSize: 15, padding: '14px 32px', borderRadius: 12, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Start free — no card required →
          </button>
          <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
            Used by self-employed people across the UK · HMRC recognised software
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#fff', borderTop: '1px solid #E5E7EB', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
          This guide is for informational purposes only and does not constitute tax advice. Always verify current rules with HMRC or a qualified tax adviser.
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          © 2026 Merx Digital Solutions Ltd · <a href="/privacy" style={{ color: '#9CA3AF' }}>Privacy</a> · <a href="/terms" style={{ color: '#9CA3AF' }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
