'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';

const THEMES = [
  { id: 'bright', label: 'Bright', desc: 'Default — white content, green-teal sidebar', sidebar: 'linear-gradient(175deg, #01D98D 0%, #0EBDCA 100%)', bg: '#F8FAFB', text: '#0A2E1E' },
  { id: 'forest', label: 'Forest', desc: 'Dark text on green-teal sidebar', sidebar: 'linear-gradient(175deg, #01D98D 0%, #0EBDCA 100%)', bg: '#F0FDF8', text: '#1C1C1E' },
  { id: 'dark', label: 'Dark', desc: 'Forest sidebar with green accents', sidebar: 'linear-gradient(175deg, #0A2E1E 0%, #1C1C1E 100%)', bg: '#1C1C1E', text: '#01D98D' },
];

export default function ProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [plan, setPlan] = useState('');
  const [theme, setTheme] = useState('bright');
  const [logoUrl, setLogoUrl] = useState('');
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [themeMsg, setThemeMsg] = useState('');
  const [logoMsg, setLogoMsg] = useState('');
  const [sidebarNetProfit, setSidebarNetProfit] = useState(0);
  const [sidebarIncome, setSidebarIncome] = useState(0);
  const [sidebarExpenses, setSidebarExpenses] = useState(0);
  const [sidebarTaxDue, setSidebarTaxDue] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);
      setEmail(user.email || '');

      const { data: profile } = await supabase.from('profiles').select('full_name, plan, theme, logo_url').eq('id', user.id).single();
      setFullName(profile?.full_name || '');
      setPlan(profile?.plan?.toUpperCase() || 'SOLO');
      setTheme(profile?.theme || 'bright');
      setLogoUrl(profile?.logo_url || '');

      const { data: biz } = await supabase.from('businesses').select('name').eq('user_id', user.id).single();
      setBusinessName((!biz?.name || biz.name.includes('@')) ? '' : biz.name);

      const today = new Date();
      const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
      const after = m > 4 || (m === 4 && d >= 6);
      const taxYear = after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
      const { data: txData } = await supabase.from('transactions').select('type, amount_gross, status').eq('tax_year', taxYear).eq('status', 'CONFIRMED');
      const inc = (txData || []).filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
      const exp = (txData || []).filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
      const net = inc - exp;
      setSidebarIncome(inc); setSidebarExpenses(exp); setSidebarNetProfit(net);
      setSidebarTaxDue(Math.max(0, (Math.min(net, 50270) - 12570) * 0.2 + Math.max(0, net - 50270) * 0.4));

      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSaving(true); setSuccessMsg(''); setErrorMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id);
    if (profileError) { setErrorMsg('Failed to save profile.'); setSaving(false); return; }

    // Delete existing business row then insert fresh — avoids upsert constraint issue
    await supabase.from('businesses').delete().eq('user_id', user.id);
    if (businessName.trim()) {
      const { error: bizError } = await supabase.from('businesses').insert({ user_id: user.id, name: businessName.trim() });
      if (bizError) { setErrorMsg('Failed to save business name.'); setSaving(false); return; }
    }

    setSuccessMsg('Profile saved successfully.');
    setSaving(false);
  }

  async function handleChangePassword() {
    setPasswordMsg(''); setPasswordError('');
    if (!newPassword || newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); } else { setPasswordMsg('Password updated successfully.'); setNewPassword(''); setConfirmPassword(''); }
    setSavingPassword(false);
  }

  async function handleSaveTheme() {
    setSavingTheme(true); setThemeMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ theme }).eq('id', user.id);
    setThemeMsg('Theme saved. Reload the dashboard to apply.');
    setSavingTheme(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setLogoMsg('Please upload a PNG, JPG or WebP image.'); return;
    }
    if (file.size > 2 * 1024 * 1024) { setLogoMsg('File must be under 2MB.'); return; }

    setUploadingLogo(true); setLogoMsg('');
    const ext = file.name.split('.').pop();
    const path = `${userId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true });
    if (uploadError) { setLogoMsg('Upload failed. Please try again.'); setUploadingLogo(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(path);
    await supabase.from('profiles').update({ logo_url: publicUrl }).eq('id', userId);
    setLogoUrl(publicUrl);
    setLogoMsg('Logo uploaded successfully.');
    setUploadingLogo(false);
  }

  async function handleRemoveLogo() {
    await supabase.from('profiles').update({ logo_url: null }).eq('id', userId);
    setLogoUrl('');
    setLogoMsg('Logo removed.');
  }

  // Auto-generated initials badge preview
  const initials = businessName.trim()
    ? businessName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : fullName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'MT';

  const planColour = plan === 'AGENT' ? '#7C3AED' : plan === 'PRO' ? '#0A2E1E' : '#01D98D';
  const planText = plan === 'AGENT' ? '#fff' : plan === 'PRO' ? '#fff' : '#0A2E1E';

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: '#9CA3AF', fontSize: 15 }}>Loading your profile...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

        <Sidebar active="Profile" userName={fullName} plan={plan.toUpperCase() || 'SOLO'} netProfit={sidebarNetProfit} income={sidebarIncome} expenses={sidebarExpenses} taxDue={sidebarTaxDue} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 26, color: '#0A2E1E', margin: 0, marginBottom: 6 }}>Account Settings</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Manage your personal details and account preferences.</p>
        </div>

        {/* Personal Details */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 24px' }}>Personal Details</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Email Address</label>
            <input type="email" value={email} disabled style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }} />
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Email cannot be changed here. Contact support if needed.</p>
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Business / Trading Name</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your trading name or company name" style={inputStyle} />
          </div>
          {successMsg && <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#166534', marginBottom: 16 }}>✓ {successMsg}</div>}
          {errorMsg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>{errorMsg}</div>}
          <button onClick={handleSaveProfile} disabled={saving} style={{ background: saving ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Business Logo */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 8px' }}>Business Logo</h2>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>Appears on your invoices. PNG, JPG or WebP, max 2MB.</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
            {/* Logo preview */}
            <div style={{ width: 100, height: 60, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', flexShrink: 0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Business logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 10, background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E' }}>{initials}</span>
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2E1E', marginBottom: 4 }}>
                {logoUrl ? 'Your logo' : `Auto-badge: "${initials}"`}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                {logoUrl ? 'Showing on invoices' : 'No logo uploaded — initials badge used on invoices'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 13, padding: '10px 20px', borderRadius: 10, background: '#01D98D', color: '#0A2E1E', fontWeight: 700, cursor: uploadingLogo ? 'not-allowed' : 'pointer', opacity: uploadingLogo ? 0.6 : 1 }}>
              {uploadingLogo ? 'Uploading...' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
            </label>
            {logoUrl && (
              <button onClick={handleRemoveLogo} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 10, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', fontWeight: 600, cursor: 'pointer' }}>
                Remove
              </button>
            )}
          </div>
          {logoMsg && <div style={{ marginTop: 12, fontSize: 13, color: logoMsg.includes('success') || logoMsg.includes('removed') ? '#166534' : '#991B1B' }}>{logoMsg}</div>}
        </div>

        {/* Theme selector */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 8px' }}>Dashboard Theme</h2>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>Choose how your dashboard looks. Changes apply on next load.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            {THEMES.map(t => {
              const selected = theme === t.id;
              return (
                <div key={t.id} onClick={() => setTheme(t.id)} style={{ border: selected ? '2px solid #01D98D' : '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: selected ? '0 0 0 3px #d1fae5' : 'none' }}>
                  <div style={{ display: 'flex', height: 72 }}>
                    <div style={{ width: 28, background: t.sidebar, flexShrink: 0 }} />
                    <div style={{ flex: 1, background: t.bg, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ height: 7, width: '60%', background: t.text, borderRadius: 3, opacity: 0.7 }} />
                      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                        <div style={{ flex: 1, height: 22, background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 4 }} />
                        <div style={{ flex: 1, height: 22, background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 4 }} />
                      </div>
                      <div style={{ height: 5, width: '80%', background: '#01D98D', borderRadius: 3, opacity: 0.5 }} />
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A2E1E', fontFamily: "'Montserrat', sans-serif" }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.desc}</div>
                      </div>
                      {selected && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#0A2E1E', fontSize: 11, fontWeight: 900 }}>✓</span></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {themeMsg && <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#166534', marginBottom: 16 }}>✓ {themeMsg}</div>}
          <button onClick={handleSaveTheme} disabled={savingTheme} style={{ background: savingTheme ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: savingTheme ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {savingTheme ? 'Saving...' : 'Apply Theme'}
          </button>
        </div>

        {/* Change Password */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 24px' }}>Change Password</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={inputStyle} />
          </div>
          {passwordMsg && <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#166534', marginBottom: 16 }}>✓ {passwordMsg}</div>}
          {passwordError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>{passwordError}</div>}
          <button onClick={handleChangePassword} disabled={savingPassword} style={{ background: savingPassword ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: savingPassword ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Subscription */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 20px' }}>Subscription</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#0A2E1E' }}>{plan}</div>
            </div>
            <button onClick={() => { window.location.href = '/pricing'; }} style={{ background: '#0A2E1E', color: '#01D98D', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              View Plans →
            </button>
          </div>
        </div>
        </div>
        </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
