'use client';

import { useState, useEffect } from 'react';
import { useTheme, getSidebarStyles } from '@/lib/ThemeContext';

type SidebarProps = {
  active: string;
  userName?: string;
  plan?: string;
  netProfit?: number;
  income?: number;
  expenses?: number;
  taxDue?: number;
  badge?: Record<string, number>;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

const NAV_ITEMS = [
  { label: 'DASHBOARD', sub: '', href: '/dashboard' },
  { label: 'REDITUS', sub: 'Income & Expenses', href: '/dashboard/reditus' },
  { label: 'VIGIL', sub: 'Compliance', href: '/dashboard/vigil' },
  { label: 'IMPENSUM', sub: 'Receipts & Expenses', href: '/dashboard/impensum' },
  { label: 'LUMEN', sub: 'AI Tax Advisor', href: '/dashboard/lumen' },
  { label: 'QUARTUS', sub: 'Tax Returns', href: '/dashboard/quartus' },
];

const TOOL_ITEMS = [
  { label: 'FACTURA', sub: 'Invoices', href: '/dashboard/factura' },
  { label: 'AGENT', sub: 'SA Agent Filing', href: '/dashboard/agent' },
];

export default function Sidebar({ active, userName = 'You', plan = 'SOLO', netProfit = 0, income = 0, expenses = 0, taxDue = 0, badge = {} }: SidebarProps) {
  const { theme } = useTheme();
  const s = getSidebarStyles(theme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const go = (href: string) => {
    setMobileOpen(false);
    window.location.href = href;
  };

  const navItem = (label: string, sub: string, href: string) => {
    const isActive = active === label;
    const count = badge[label];
    return (
      <div
        key={label}
        onClick={() => go(href)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 16px',
          borderLeft: `3px solid ${isActive ? s.activeBorder : 'transparent'}`,
          background: isActive ? s.activeBackground : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? s.activeDot : s.inactiveDot, flexShrink: 0, marginTop: sub ? 2 : 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: isActive ? s.activeText : s.inactiveText,
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {label}
            </span>
            {count ? (
              <span style={{ fontSize: 10, background: s.badgeBackground, color: s.badgeColor, padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{count}</span>
            ) : null}
          </div>
          {sub ? (
            <div style={{
              fontSize: 10,
              color: isActive ? 'rgba(255,255,255,0.75)' : s.inactiveText,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              marginTop: 1,
              opacity: isActive ? 1 : 0.75,
            }}>
              {sub}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '10px 16px 4px', color: s.sectionColor, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{text}</div>
  );

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Balance panel */}
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${s.divider}` }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.7px', color: s.balLabel, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Net profit YTD</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: s.balValue, marginBottom: 10, fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{fmt(netProfit)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          {[
            { label: 'Income', value: fmt(income), color: s.incomeColor },
            { label: 'Expenses', value: fmt(expenses), color: s.expenseColor },
            { label: 'Tax due', value: fmt(taxDue), color: s.taxColor },
          ].map(item => (
            <div key={item.label} style={{ background: s.tileBackground, borderRadius: 6, padding: '7px 8px' }}>
              <div style={{ fontSize: 9, color: s.tileLabel, marginBottom: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.color, fontFamily: "'Montserrat', sans-serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, paddingTop: 6, overflowY: 'auto' }}>
        {sectionLabel('Modules')}
        {NAV_ITEMS.map(({ label, sub, href }) => navItem(label, sub, href))}

        <div style={{ marginTop: 6 }}>{sectionLabel('Tools')}</div>
        {TOOL_ITEMS.map(({ label, sub, href }) => navItem(label, sub, href))}
      </div>

      {/* Profile + User */}
      <div style={{ borderTop: `1px solid ${s.divider}` }}>
        {navItem('PROFILE', 'Settings & Subscription', '/dashboard/profile')}
        <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: s.avatarBackground, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.avatarColor, flexShrink: 0 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.userNameColor, fontFamily: "'DM Sans', sans-serif" }}>{userName}</div>
            <div style={{ fontSize: 10, color: s.userPlanColor, fontFamily: "'DM Sans', sans-serif" }}>{plan} plan</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: s.background, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 200, borderBottom: `1px solid ${s.divider}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: s.balValue, fontFamily: "'Montserrat', sans-serif" }}>
            {fmt(netProfit)} <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.7 }}>YTD</span>
          </div>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: 6 }}>
            <div style={{ width: 20, height: 2, background: s.balValue, borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: s.balValue, borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: s.balValue, borderRadius: 2 }} />
          </button>
        </div>
        <div style={{ height: 52, flexShrink: 0 }} />
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
        )}
        <div style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', background: s.background, zIndex: 400, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 14px' }}>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: s.balValue, lineHeight: 1 }}>✕</button>
          </div>
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: s.background, minHeight: '100vh', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
      {sidebarContent}
    </div>
  );
}
