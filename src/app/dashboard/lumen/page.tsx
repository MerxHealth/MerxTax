'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type UsageInfo = {
  used: number;
  cap: number;
  plan: string;
};

const SUGGESTED_QUESTIONS = [
  'How much tax should I set aside this quarter?',
  'What expenses can I claim working from home?',
  'Am I on track for my next HMRC deadline?',
  'What is my most expensive category this year?',
  'Should I become VAT registered?',
  'Can I claim my phone and internet bill?',
  'What is the difference between cash basis and accrual?',
  'How much can I pay myself without paying more tax?',
];

export default function LumenPage() {
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [userName, setUserName] = useState('');
  const [contextLoaded, setContextLoaded] = useState(false);
  const [financialContext, setFinancialContext] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadContext = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserName(user.email?.split('@')[0] || 'there');

    // Load recent transactions for context
    const { data: txData } = await supabase
      .from('transactions')
      .select('date, type, amount_gross, category, description, status, quarter, tax_year')
      .order('date', { ascending: false })
      .limit(50);

    // Load quarterly submissions
    const { data: subData } = await supabase
      .from('quarterly_submissions')
      .select('quarter, tax_year, status, deadline')
      .order('created_at', { ascending: false })
      .limit(4);

    // Load usage
    const { data: usageData } = await supabase
      .from('usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('feature', 'LUMEN')
      .eq('month', currentMonth)
      .single();

    // Load subscription to determine plan
    const { data: subPlan } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Load settings for cap
    const plan = subPlan?.plan_name?.toLowerCase() || 'solo';
    const capKey = `lumen_cap_${plan.includes('agent') ? 'agent' : plan.includes('pro') ? 'pro' : 'solo'}`;
    const { data: capData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', capKey)
      .single();

    const cap = parseInt(capData?.value || '50');
    const used = usageData?.count || 0;

    setUsage({ used, cap, plan: plan.toUpperCase() });

    // Build financial context string
    const today = new Date().toISOString().split('T')[0];
    const taxYear = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const after = m > 4 || (m === 4 && day >= 6);
      return after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
    })();

    const income = (txData || []).filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
    const expenses = (txData || []).filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
    const net = income - expenses;
    const estTax = Math.max(0, (net - 12570) * 0.2);

    const ctx = `
USER FINANCIAL CONTEXT (live data):
- Today: ${today}
- Tax year: ${taxYear}
- Plan: ${plan.toUpperCase()}
- Total income (tax year): GBP ${income.toFixed(2)}
- Total expenses (tax year): GBP ${expenses.toFixed(2)}
- Net profit (tax year): GBP ${net.toFixed(2)}
- Estimated tax liability: GBP ${estTax.toFixed(2)}
- Recent transactions: ${(txData || []).length} recorded
- Confirmed transactions: ${(txData || []).filter(t => t.status === 'CONFIRMED').length}
- Draft transactions: ${(txData || []).filter(t => t.status === 'DRAFT').length}
- Submissions: ${JSON.stringify(subData || [])}
- Top categories: ${JSON.stringify(
  Object.entries(
    (txData || []).reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount_gross);
      return acc;
    }, {})
  ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)
)}
    `.trim();

    setFinancialContext(ctx);
    setContextLoaded(true);

    // Pick 4 contextual suggestions
    const picked: string[] = [];
    if ((txData || []).filter(t => t.status === 'DRAFT').length > 0) {
      picked.push('How much tax should I set aside this quarter?');
    }
    picked.push('What expenses can I claim working from home?');
    picked.push('Am I on track for my next HMRC deadline?');
    if (picked.length < 4) picked.push('Should I become VAT registered?');
    if (picked.length < 4) picked.push('How much can I pay myself without paying more tax?');
    setSuggestions(picked.slice(0, 4));
  }, []);

  useEffect(() => { loadContext(); }, [loadContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function incrementUsage() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_feature: 'LUMEN',
      p_month: currentMonth,
    }).catch(() => {
      // Fallback: upsert manually
      supabase.from('usage').upsert({
        user_id: user.id,
        feature: 'LUMEN',
        month: currentMonth,
        count: (usage?.used || 0) + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,feature,month' });
    });
    setUsage(u => u ? { ...u, used: u.used + 1 } : u);
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    if (usage && usage.used >= usage.cap) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/lumen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: financialContext,
          userName,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      setMessages([...newMessages, { role: 'assistant', content: json.reply }]);
      await incrementUsage();
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'I had trouble connecting. Please try again in a moment.' }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const atLimit = usage && usage.used >= usage.cap;
  const usagePct = usage ? Math.min(100, Math.round((usage.used / usage.cap) * 100)) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; } .sq-btn:hover { background: #E8F8F2 !important; border-color: #01D98D !important; } .send-btn:hover { opacity: 0.9; }`}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { window.location.href = '/dashboard'; }} style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" }}>Back to Dashboard</button>
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
            LUMEN <span style={{ color: '#01D98D' }}>|</span> Your AI Accountant
          </span>
        </div>
        {usage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{usage.plan} plan</div>
              <div style={{ fontSize: 11, color: atLimit ? '#EF4444' : '#6B7280' }}>{usage.used} / {usage.cap === 999999 ? 'unlimited' : usage.cap} messages</div>
            </div>
            {usage.cap !== 999999 && (
              <div style={{ width: 60, height: 6, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${usagePct}%`, background: atLimit ? '#EF4444' : usagePct > 80 ? '#F59E0B' : '#01D98D', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            )}
          </div>
        )}
      </header>

      {/* Chat area */}
      <div style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '24px 16px 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Welcome state */}
        {messages.length === 0 && contextLoaded && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #01D98D, #0A2E1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2"/>
                  <path d="M10 16C10 16 12 20 16 20C20 20 22 16 22 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="13" r="1.5" fill="white"/>
                  <circle cx="20" cy="13" r="1.5" fill="white"/>
                </svg>
              </div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E', marginBottom: 8 }}>
                Good to see you, {userName}.
              </div>
              <div style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
                I know your numbers. Ask me anything about your accounts, tax, or what you can claim. I will give you straight answers, not jargon.
              </div>
            </div>

            {/* Suggested questions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {suggestions.map((q, i) => (
                <button key={i} className="sq-btn" onClick={() => sendMessage(q)}
                  style={{ padding: '14px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, transition: 'all 0.15s' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !contextLoaded && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 4 }}>Loading your accounts...</div>
              <div style={{ fontSize: 13 }}>Checking your numbers</div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 20, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #01D98D, #0A2E1E)', flexShrink: 0, marginRight: 10, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2.5"/>
                      <circle cx="12" cy="13" r="1.5" fill="white"/>
                      <circle cx="20" cy="13" r="1.5" fill="white"/>
                      <path d="M10 18C10 18 12 21 16 21C20 21 22 18 22 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <div style={{
                  maxWidth: '80%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? '#0A2E1E' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#1C1C1E',
                  border: m.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                  fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #01D98D, #0A2E1E)', flexShrink: 0, marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2.5"/>
                    <circle cx="12" cy="13" r="1.5" fill="white"/>
                    <circle cx="20" cy="13" r="1.5" fill="white"/>
                    <path d="M10 18C10 18 12 21 16 21C20 21 22 18 22 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#01D98D', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ background: '#fff', borderTop: '1px solid #E5E7EB', padding: '16px 24px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {atLimit && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', marginBottom: 12, fontSize: 13, color: '#991B1B', textAlign: 'center' }}>
              You have reached your {usage?.plan} plan limit of {usage?.cap} messages this month.
              <button onClick={() => { window.location.href = '/pricing'; }} style={{ marginLeft: 8, color: '#01D98D', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Upgrade plan
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={atLimit ? 'Message limit reached for this month' : 'Ask me anything about your accounts...'}
              disabled={!!atLimit || loading}
              rows={1}
              style={{
                flex: 1, padding: '12px 16px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 12,
                background: atLimit ? '#F9FAFB' : '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E',
                resize: 'none', outline: 'none', lineHeight: 1.5, maxHeight: 120, overflow: 'auto',
                cursor: atLimit ? 'not-allowed' : 'text',
              }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading || !!atLimit} className="send-btn"
              style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() && !atLimit ? '#01D98D' : '#E5E7EB', border: 'none', cursor: input.trim() && !atLimit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9H15M15 9L9 3M15 9L9 15" stroke={input.trim() && !atLimit ? '#fff' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            LUMEN provides guidance based on your records. Always verify important tax decisions with a qualified accountant.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
