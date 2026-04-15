'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'mark.dyas@merxdigital.co.uk';

type Setting = { key: string; value: string };

const LABELS: Record<string, { label: string; description: string; module: string }> = {
  lumen_cap_solo:      { label: 'LUMEN — Solo monthly limit',    description: 'AI chat messages per month for Solo plan',    module: 'LUMEN' },
  lumen_cap_pro:       { label: 'LUMEN — Pro monthly limit',     description: 'AI chat messages per month for Pro plan',     module: 'LUMEN' },
  lumen_cap_agent:     { label: 'LUMEN — Agent monthly limit',   description: 'AI chat messages per month for Agent plan',   module: 'LUMEN' },
  impensum_cap_solo:   { label: 'IMPENSUM — Solo monthly limit', description: 'Receipt scans per month for Solo plan',       module: 'IMPENSUM' },
  impensum_cap_pro:    { label: 'IMPENSUM — Pro monthly limit',  description: 'Receipt scans per month for Pro plan',        module: 'IMPENSUM' },
  impensum_cap_agent:  { label: 'IMPENSUM — Agent monthly limit',description: 'Receipt scans per month for Agent plan',      module: 'IMPENSUM' },
};

const PLAN_ORDER = ['solo', 'pro', 'agent'];
const MODULE_ORDER = ['LUMEN', 'IMPENSUM'];

export default function AdminSettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        setLoading(false); return;
      }
      setAuthorized(true);

      const { data: settingsData } = await supabase.from('settings').select('key, value').order('key');
      setSettings(settingsData || []);

      const init: Record<string, string> = {};
      (settingsData || []).forEach((s: Setting) => { init[s.key] = s.value; });
      setEdited(init);

      // User stats
      const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: active } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      setUserCount(total || 0);
      setActiveCount(active || 0);

      setLoading(false);
    }
    init();
  }, []);

  async function saveSetting(key: string) {
    setSaving(true); setSavedMsg('');
    const val = edited[key];
    const { error } = await supabase.from('settings').upsert({ key, value: val }, { onConflict: 'key' });
    if (!error) {
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: val } : s));
      setSavedMsg(`${LABELS[key]?.label || key} updated to ${val === '999999' ? 'unlimited' : val}.`);
      setTimeout(() => setSavedMsg(''), 3000);
    }
    setSaving(false);
  }

  async function saveAll() {
    setSaving(true); setSavedMsg('');
    const upserts = Object.entries(edited).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' });
    if (!error) {
      setSavedMsg('All settings saved.');
      setTimeout(() => setSavedMsg(''), 3000);
    }
    setSaving(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: '#9CA3AF' }}>Loading...</div>
    </div>
  );

  if (!authorized) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E', marginBottom: 8 }}>Access denied.</div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>This page is restricted to MerxTax administrators.</div>
        <button onClick={() => { window.location.href = '/dashboard'; }} style={{ padding: '10px 24px', background: '#01D98D', color: '#0A2E1E', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      <header style={{ background: '#0A2E1E', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: '#01D98D' }}>MERXTAX</span>
          <span style={{ color: '#6B9F8E', fontSize: 13 }}>/ Admin Panel</span>
        </div>
        <button onClick={() => { window.location.href = '/dashboard'; }} style={{ fontSize: 12, color: '#01D98D', background: 'none', border: '1px solid #01D98D', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
          Dashboard
        </button>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 26, color: '#0A2E1E', margin: '0 0 6px' }}>Admin Settings</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Manage usage caps and platform configuration without a code deploy.</p>
        </div>

        {/* Platform stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total users', value: userCount.toString() },
            { label: 'Active subscribers', value: activeCount.toString() },
            { label: 'Settings keys', value: settings.length.toString() },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {savedMsg && (
          <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#065F46', fontWeight: 500, marginBottom: 20 }}>
            ✓ {savedMsg}
          </div>
        )}

        {/* Settings by module */}
        {MODULE_ORDER.map(module => (
          <div key={module} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E' }}>{module}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Monthly usage caps by plan</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#E8F8F2', color: '#01D98D' }}>
                {module === 'LUMEN' ? 'AI Chat' : 'Receipt Scans'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {PLAN_ORDER.map(plan => {
                const key = `${module.toLowerCase()}_cap_${plan}`;
                const meta = LABELS[key];
                if (!meta) return null;
                const val = edited[key] || '';
                const isUnlimited = val === '999999';
                return (
                  <div key={key} style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: plan === 'agent' ? '#0A2E1E' : plan === 'pro' ? '#E6F1FB' : '#F3F4F6', color: plan === 'agent' ? '#01D98D' : plan === 'pro' ? '#185FA5' : '#6B7280', textTransform: 'uppercase' }}>
                        {plan}
                      </span>
                      <button onClick={() => setEdited(prev => ({ ...prev, [key]: isUnlimited ? '50' : '999999' }))}
                        style={{ fontSize: 11, color: isUnlimited ? '#EF4444' : '#01D98D', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        {isUnlimited ? 'Set limit' : 'Unlimited'}
                      </button>
                    </div>

                    <input
                      type={isUnlimited ? 'text' : 'number'}
                      min="1"
                      value={isUnlimited ? 'Unlimited' : val}
                      disabled={isUnlimited}
                      onChange={e => setEdited(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', fontSize: isUnlimited ? 16 : 20, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", border: '1px solid #E5E7EB', borderRadius: 8, background: isUnlimited ? '#E8F8F2' : '#fff', color: isUnlimited ? '#01D98D' : '#0A2E1E', textAlign: 'center', marginBottom: 10 }}
                    />

                    <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 10 }}>
                      {isUnlimited ? 'No limit' : `${val} per month`}
                    </div>

                    <button onClick={() => saveSetting(key)} disabled={saving}
                      style={{ width: '100%', padding: '8px', background: '#0A2E1E', color: '#01D98D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      Save
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Save all */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={saveAll} disabled={saving}
            style={{ padding: '14px 36px', background: '#01D98D', color: '#0A2E1E', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? 'Saving...' : 'Save all changes'}
          </button>
        </div>

      </main>
    </div>
  );
}
