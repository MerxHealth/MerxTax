'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [plan, setPlan] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, plan')
        .eq('id', user.id)
        .single();

      setFullName(profile?.full_name || '');
      setPlan(profile?.plan?.toUpperCase() || 'SOLO');

      const { data: biz } = await supabase
        .from('businesses')
        .select('name')
        .eq('user_id', user.id)
        .single();

      setBusinessName(biz?.name || '');
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);

    if (profileError) {
      setErrorMsg('Failed to save profile. Please try again.');
      setSaving(false);
      return;
    }

    if (businessName.trim()) {
      await supabase
        .from('businesses')
        .upsert({ user_id: user.id, name: businessName.trim() }, { onConflict: 'user_id' });
    }

    setSuccessMsg('Profile saved successfully.');
    setSaving(false);
  }

  async function handleChangePassword() {
    setPasswordMsg('');
    setPasswordError('');
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  }

  const planColour = plan === 'AGENT' ? '#7C3AED' : plan === 'PRO' ? '#0A2E1E' : '#01D98D';
  const planText = plan === 'AGENT' ? '#fff' : plan === 'PRO' ? '#fff' : '#0A2E1E';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: '#9CA3AF', fontSize: 15 }}>Loading your profile...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { window.location.href = '/dashboard'; }} style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" }}>
            ← Back to Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
            My Profile
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, background: planColour, color: planText, padding: '4px 12px', borderRadius: 20 }}>
          {plan} PLAN
        </span>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 26, color: '#0A2E1E', margin: 0, marginBottom: 6 }}>
            Account Settings
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            Manage your personal details and account preferences.
          </p>
        </div>

        {/* Profile card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 24px' }}>
            Personal Details
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif", cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Email cannot be changed here. Contact support if needed.</p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Your trading name or company name"
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}
            />
          </div>

          {successMsg && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#166534', marginBottom: 16 }}>
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ background: saving ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Password card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 24px' }}>
            Change Password
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}
            />
          </div>

          {passwordMsg && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#166534', marginBottom: 16 }}>
              ✓ {passwordMsg}
            </div>
          )}
          {passwordError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>
              {passwordError}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            style={{ background: savingPassword ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: savingPassword ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Plan card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 32px' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', margin: '0 0 20px' }}>
            Subscription
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#0A2E1E' }}>{plan}</div>
            </div>
            <button
              onClick={() => { window.location.href = '/pricing'; }}
              style={{ background: '#0A2E1E', color: '#01D98D', fontWeight: 700, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              View Plans →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
