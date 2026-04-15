'use client';

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

export default function Sidebar({ active, userName = 'You', plan = 'SOLO', netProfit = 0, income = 0, expenses = 0, taxDue = 0, badge = {} }: SidebarProps) {
  const { theme } = useTheme();
  const s = getSidebarStyles(theme);

  const navItem = (label: string, href: string) => {
    const isActive = active === label;
    const count = badge[label];
    return (
      <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', borderLeft: `3px solid ${isActive ? s.activeBorder : 'transparent'}`, background: isActive ? s.activeBackground : 'transparent', textDecoration: 'none', transition: 'background 0.15s' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? s.activeDot : s.inactiveDot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? s.activeText : s.inactiveText, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        {count ? <span style={{ marginLeft: 'auto', fontSize: 10, background: s.badgeBackground, color: s.badgeColor, padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{count}</span> : null}
      </a>
    );
  };

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.7px', padding: '8px 16px 2px', color: s.sectionColor, fontFamily: "'DM Sans', sans-serif" }}>{text}</div>
  );

  return (
    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: s.background, minHeight: '100vh', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

      {/* Balance panel */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.divider}` }}>
        <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.6px', color: s.balLabel, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Net profit YTD</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: s.balValue, marginBottom: 8, fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{fmt(netProfit)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {[
            { label: 'Income', value: fmt(income), color: s.incomeColor },
            { label: 'Expenses', value: fmt(expenses), color: s.expenseColor },
            { label: 'Tax due', value: fmt(taxDue), color: s.taxColor },
          ].map(item => (
            <div key={item.label} style={{ background: s.tileBackground, borderRadius: 5, padding: '5px 7px' }}>
              <div style={{ fontSize: 8, color: s.tileLabel, marginBottom: 1, fontFamily: "'DM Sans', sans-serif" }}>{item.label}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: item.color, fontFamily: "'Montserrat', sans-serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, paddingTop: 8, overflowY: 'auto' }}>
        {sectionLabel('Modules')}
        {navItem('Dashboard', '/dashboard')}
        {navItem('REDITUS', '/dashboard/reditus')}
        {navItem('VIGIL', '/dashboard/vigil')}
        {navItem('IMPENSUM', '/dashboard/impensum')}
        {navItem('LUMEN', '/dashboard/lumen')}
        {navItem('QUARTUS', '/dashboard/quartus')}
        <div style={{ marginTop: 8 }}>
          {sectionLabel('Tools')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.inactiveDot, opacity: 0.4, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: s.soonColor, fontFamily: "'DM Sans', sans-serif" }}>FACTURA</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: s.soonColor }}>soon</span>
        </div>
        {navItem('Profile', '/dashboard/profile')}
      </div>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${s.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: s.avatarBackground, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.avatarColor, flexShrink: 0 }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.userNameColor, fontFamily: "'DM Sans', sans-serif" }}>{userName}</div>
          <div style={{ fontSize: 10, color: s.userPlanColor, fontFamily: "'DM Sans', sans-serif" }}>{plan} plan</div>
        </div>
      </div>
    </div>
  );
}
