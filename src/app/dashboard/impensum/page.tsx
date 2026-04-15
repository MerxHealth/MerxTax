'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type ExtractedData = {
  amount_gross: string;
  date: string;
  description: string;
  category: string;
  vat_rate: string;
  vat_amount: string;
  notes: string;
  confidence: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type VoiceMode = 'idle' | 'listening' | 'processing' | 'questioning' | 'confirming' | 'mileage';
type CaptureTab = 'upload' | 'voice' | 'mileage';

const HMRC_MILEAGE_RATE = 0.45;

const HMRC_CATEGORIES = [
  { value: 'TRADING_INCOME',    label: 'Trading income' },
  { value: 'PROPERTY_INCOME',   label: 'Property / rental income' },
  { value: 'OTHER_INCOME',      label: 'Other income' },
  { value: 'GOODS_MATERIALS',   label: 'Cost of goods / materials' },
  { value: 'TRAVEL',            label: 'Car, van and travel' },
  { value: 'WAGES',             label: 'Wages and salaries' },
  { value: 'RENT_RATES',        label: 'Rent and rates' },
  { value: 'REPAIRS',           label: 'Repairs and maintenance' },
  { value: 'ADMIN',             label: 'General admin' },
  { value: 'MARKETING',         label: 'Advertising and marketing' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional fees' },
  { value: 'FINANCIAL_CHARGES', label: 'Financial charges' },
  { value: 'DEPRECIATION',      label: 'Depreciation / capital allowances' },
  { value: 'OTHER_EXPENSE',     label: 'Other expense' },
];

const VAT_RATES = [
  { value: 'NOT_REGISTERED', label: 'Not VAT Registered' },
  { value: 'EXEMPT',         label: 'Exempt' },
  { value: 'ZERO',           label: '0% Zero Rated' },
  { value: 'REDUCED',        label: '5% Reduced Rate' },
  { value: 'STANDARD',       label: '20% Standard Rate' },
];

function getTaxYear(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const after = m > 4 || (m === 4 && d >= 6);
  return after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

function getHMRCQuarter(date: Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const n = m * 100 + d;
  if (n >= 406 && n <= 705) return 'Q1';
  if (n >= 706 && n <= 1005) return 'Q2';
  if (n >= 1006 || n <= 105) return 'Q3';
  return 'Q4';
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('female'))
    || voices.find(v => v.lang === 'en-GB')
    || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
}

const emptyForm: ExtractedData = {
  amount_gross: '',
  date: todayISO(),
  description: '',
  category: '',
  vat_rate: 'NOT_REGISTERED',
  vat_amount: '0',
  notes: '',
  confidence: '',
};

export default function ImpensumPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [tab, setTab] = useState<CaptureTab>('upload');

  // Upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState('');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [form, setForm] = useState<ExtractedData>(emptyForm);

  // Voice state
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle');
  const [transcript, setTranscript] = useState('');
  const [lumenMessage, setLumenMessage] = useState('');
  const [voiceForm, setVoiceForm] = useState<ExtractedData>(emptyForm);
  const [voiceTxType, setVoiceTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [missingField, setMissingField] = useState('');
  const [followUpCount, setFollowUpCount] = useState(0);
  const [voiceSaveStatus, setVoiceSaveStatus] = useState<SaveStatus>('idle');
  const [voiceSaveError, setVoiceSaveError] = useState('');
  const [conversationHistory, setConversationHistory] = useState<{role: string, text: string}[]>([]);

  // Mileage state
  const [mileageFrom, setMileageFrom] = useState('');
  const [mileageTo, setMileageTo] = useState('');
  const [mileageReturn, setMileageReturn] = useState(true);
  const [mileageMiles, setMileageMiles] = useState('');
  const [mileageDate, setMileageDate] = useState(todayISO());
  const [mileagePurpose, setMileagePurpose] = useState('');
  const [mileageCalc, setMileageCalc] = useState<{miles: number, amount: number} | null>(null);
  const [mileageSaveStatus, setMileageSaveStatus] = useState<SaveStatus>('idle');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [nearbyVenue, setNearbyVenue] = useState('');

  // GPS proximity on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // In production: call Google Places API with pos.coords
          // For now: store coords silently for mileage use
          localStorage.setItem('impensum_lat', pos.coords.latitude.toString());
          localStorage.setItem('impensum_lng', pos.coords.longitude.toString());
        },
        () => {},
        { timeout: 5000 }
      );
    }
    // Load voices for speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Mileage calculator
  useEffect(() => {
    const miles = parseFloat(mileageMiles);
    if (miles > 0) {
      const total = mileageReturn ? miles * 2 : miles;
      setMileageCalc({ miles: total, amount: parseFloat((total * HMRC_MILEAGE_RATE).toFixed(2)) });
    } else {
      setMileageCalc(null);
    }
  }, [mileageMiles, mileageReturn]);

  // --- UPLOAD HANDLERS ---
  function handleFile(file: File) {
    setExtracted(null); setSaveStatus('idle'); setSaveError(''); setReadError(''); setForm(emptyForm);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  async function readReceipt() {
    if (!imagePreview) return;
    setReading(true); setReadError('');
    try {
      const base64 = imagePreview.split(',')[1];
      const mediaType = imagePreview.split(';')[0].split(':')[1];
      const res = await fetch('/api/impensum/read', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const data = json.data as ExtractedData;
      setExtracted(data); setForm(data);
      setTxType(['TRADING_INCOME','PROPERTY_INCOME','OTHER_INCOME'].includes(data.category) ? 'INCOME' : 'EXPENSE');
    } catch {
      setReadError('Could not read this receipt. Please check the image is clear and try again.');
    }
    setReading(false);
  }

  async function saveTransaction() {
    if (!form.amount_gross || !form.category || !form.description) {
      setSaveError('Amount, category and description are required.'); return;
    }
    setSaveStatus('saving'); setSaveError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError('Not authenticated.'); setSaveStatus('error'); return; }
    const dateObj = new Date(form.date || todayISO());
    const gross = parseFloat(form.amount_gross);
    let net = gross; let vat = parseFloat(form.vat_amount || '0');
    if (form.vat_rate === 'STANDARD' && vat === 0) { net = gross / 1.2; vat = gross - net; }
    else if (form.vat_rate === 'REDUCED' && vat === 0) { net = gross / 1.05; vat = gross - net; }
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id, date: form.date || todayISO(), type: txType,
      amount_gross: gross, amount_net: parseFloat(net.toFixed(2)), vat_amount: parseFloat(vat.toFixed(2)),
      vat_rate: form.vat_rate, description: form.description, category: form.category,
      income_source: txType === 'INCOME' ? 'TRADING' : null, accounting_method: 'CASH',
      tax_year: getTaxYear(dateObj), quarter: getHMRCQuarter(dateObj), status: 'CONFIRMED', notes: form.notes || null,
    });
    if (error) { setSaveError(error.message); setSaveStatus('error'); return; }
    setSaveStatus('saved');
  }

  function scanAnother() {
    setImagePreview(null); setExtracted(null); setSaveStatus('idle');
    setSaveError(''); setReadError(''); setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // --- VOICE HANDLERS ---
  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLumenMessage("Your browser doesn't support voice input. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setVoiceMode('listening');
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      processVoiceInput(text);
    };
    recognition.onerror = () => {
      setVoiceMode('idle');
      setLumenMessage("Didn't catch that. Try again?");
    };
    recognition.onend = () => {
      if (voiceMode === 'listening') setVoiceMode('idle');
    };
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setVoiceMode('idle');
  }

  async function processVoiceInput(text: string, isFollowUp = false, currentForm = emptyForm, currentMissing = '') {
    setVoiceMode('processing');

    const history = isFollowUp
      ? [...conversationHistory, { role: 'user', text }]
      : [{ role: 'user', text }];
    setConversationHistory(history);

    try {
      const res = await fetch('/api/impensum/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          isFollowUp,
          currentForm,
          missingField: currentMissing,
          conversationHistory: history,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const { parsed, missingField: nextMissing, lumenReply, txType: detectedType, isQuestion } = json;

      setConversationHistory(prev => [...prev, { role: 'lumen', text: lumenReply }]);

      if (nextMissing && followUpCount < 2) {
        // Need more info — ask one question
        setVoiceForm({ ...currentForm, ...parsed });
        setMissingField(nextMissing);
        setFollowUpCount(prev => prev + 1);
        setLumenMessage(lumenReply);
        setVoiceMode('questioning');
        speak(lumenReply);
      } else {
        // All good — show confirmation
        const finalForm = { ...currentForm, ...parsed };
        if (!finalForm.date) finalForm.date = todayISO();
        if (!finalForm.vat_rate) finalForm.vat_rate = 'NOT_REGISTERED';
        setVoiceForm(finalForm);
        setVoiceTxType(detectedType || 'EXPENSE');
        setLumenMessage(lumenReply);
        setVoiceMode('confirming');
        speak(lumenReply);
      }
    } catch {
      setVoiceMode('idle');
      setLumenMessage("Something went wrong. Try again or type it in.");
      speak("Something went wrong. Try again.");
    }
  }

  function handleFollowUpVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceMode('listening');
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      processVoiceInput(text, true, voiceForm, missingField);
    };
    recognition.onerror = () => { setVoiceMode('questioning'); };
    recognition.start();
  }

  async function saveVoiceTransaction() {
    setVoiceSaveStatus('saving'); setVoiceSaveError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setVoiceSaveError('Not authenticated.'); setVoiceSaveStatus('error'); return; }
    const dateObj = new Date(voiceForm.date || todayISO());
    const gross = parseFloat(voiceForm.amount_gross || '0');
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id, date: voiceForm.date || todayISO(), type: voiceTxType,
      amount_gross: gross, amount_net: gross, vat_amount: 0,
      vat_rate: voiceForm.vat_rate || 'NOT_REGISTERED',
      description: voiceForm.description, category: voiceForm.category,
      income_source: voiceTxType === 'INCOME' ? 'TRADING' : null,
      accounting_method: 'CASH', tax_year: getTaxYear(dateObj),
      quarter: getHMRCQuarter(dateObj), status: 'CONFIRMED', notes: voiceForm.notes || null,
    });
    if (error) { setVoiceSaveError(error.message); setVoiceSaveStatus('error'); return; }
    setVoiceSaveStatus('saved');
    speak("Saved. Your accounts are up to date.");
  }

  function resetVoice() {
    setVoiceMode('idle'); setTranscript(''); setLumenMessage('');
    setVoiceForm(emptyForm); setMissingField(''); setFollowUpCount(0);
    setVoiceSaveStatus('idle'); setVoiceSaveError(''); setConversationHistory([]);
  }

  // --- MILEAGE HANDLERS ---
  async function calculateGPSRoute() {
    if (!mileageTo.trim()) { setGpsError('Please enter a destination.'); return; }
    setGpsLoading(true); setGpsError('');

    const getCoords = (): Promise<{ lat: string; lng: string }> => {
      return new Promise((resolve, reject) => {
        const storedLat = localStorage.getItem('impensum_lat');
        const storedLng = localStorage.getItem('impensum_lng');
        if (storedLat && storedLng) { resolve({ lat: storedLat, lng: storedLng }); return; }
        if (!navigator.geolocation) { reject(new Error('no_gps')); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude.toString();
            const lng = pos.coords.longitude.toString();
            localStorage.setItem('impensum_lat', lat);
            localStorage.setItem('impensum_lng', lng);
            resolve({ lat, lng });
          },
          () => reject(new Error('denied')),
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    };

    try {
      const { lat, lng } = await getCoords();
      const res = await fetch('/api/impensum/distance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `${lat},${lng}`, to: mileageTo }),
      });
      const json = await res.json();
      if (json.miles) {
        setMileageMiles(json.miles.toString());
        setMileageFrom(json.fromName || 'Your location');
        const total = mileageReturn ? json.miles * 2 : json.miles;
        const allowance = (total * HMRC_MILEAGE_RATE).toFixed(2);
        const isLikelyDesktop = !('ontouchstart' in window);
        const accuracyNote = isLikelyDesktop ? ' I am using your approximate desktop location — if that does not look right, enter your exact starting point in the From field.' : '';
        speak(`${mileageTo} is about ${json.miles} miles from you. ${mileageReturn ? `Return trip is ${total} miles — that's £${allowance} at HMRC rates.` : `That's £${allowance} at HMRC rates.`}${accuracyNote}`);
      } else {
        setGpsError("Couldn't calculate that route. Enter miles manually.");
      }
    } catch (err: any) {
      if (err.message === 'denied') {
        setGpsError('Location access denied. Please allow location in your browser settings, or enter miles manually.');
      } else {
        setGpsError("Location not available. Enter miles manually.");
      }
    }
    setGpsLoading(false);
  }

  async function saveMileage() {
    if (!mileageCalc || !mileagePurpose) {
      setGpsError('Please enter a journey purpose.'); return;
    }
    setMileageSaveStatus('saving');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMileageSaveStatus('error'); return; }
    const dateObj = new Date(mileageDate);
    const desc = `Mileage: ${mileageFrom || 'Start'} to ${mileageTo}${mileageReturn ? ' (return)' : ''} — ${mileagePurpose}`;
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id, date: mileageDate, type: 'EXPENSE',
      amount_gross: mileageCalc.amount, amount_net: mileageCalc.amount, vat_amount: 0,
      vat_rate: 'NOT_REGISTERED', description: desc, category: 'TRAVEL',
      accounting_method: 'CASH', tax_year: getTaxYear(dateObj),
      quarter: getHMRCQuarter(dateObj), status: 'CONFIRMED',
      notes: `${mileageCalc.miles} miles at £${HMRC_MILEAGE_RATE}/mile (HMRC approved rate)`,
    });
    if (error) { setMileageSaveStatus('error'); return; }
    setMileageSaveStatus('saved');
    speak(`Done. ${mileageCalc.miles} miles, £${mileageCalc.amount.toFixed(2)} logged.`);
  }

  function resetMileage() {
    setMileageFrom(''); setMileageTo(''); setMileageReturn(true); setMileageMiles('');
    setMileageDate(todayISO()); setMileagePurpose(''); setMileageCalc(null);
    setMileageSaveStatus('idle'); setGpsError('');
  }

  const input: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 8px', fontSize: 13, fontWeight: 700, borderRadius: 10,
    border: `2px solid ${active ? '#01D98D' : '#E5E7EB'}`,
    background: active ? '#E8F8F2' : '#fff', color: active ? '#0A2E1E' : '#9CA3AF',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; } .uz:hover { border-color: #01D98D !important; background: #F0FDF8 !important; } @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} } @keyframes ripple { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.5);opacity:0} }`}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { window.location.href = '/dashboard'; }} style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" }}>Back to Dashboard</button>
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>IMPENSUM <span style={{ color: '#01D98D' }}>|</span> Receipt Capture</span>
        </div>
        <button onClick={() => { window.location.href = '/dashboard/reditus'; }} style={{ fontSize: 12, color: '#01D98D', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" }}>View all transactions</button>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <button style={tabBtn(tab === 'upload')} onClick={() => setTab('upload')}>Receipt Upload</button>
          <button style={tabBtn(tab === 'voice')} onClick={() => setTab('voice')}>Voice Entry</button>
          <button style={tabBtn(tab === 'mileage')} onClick={() => setTab('mileage')}>Mileage Tracker</button>
        </div>

        {/* ─── UPLOAD TAB ─── */}
        {tab === 'upload' && (
          <>
            {!imagePreview && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E', marginBottom: 8 }}>No more receipt piles.</div>
                  <div style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>Drop your receipt below. AI reads it. You confirm it. Done.</div>
                </div>
                <div className="uz" onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragging ? '#01D98D' : '#D1D5DB'}`, borderRadius: 16, padding: '56px 32px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#F0FDF8' : '#fff', transition: 'all 0.2s', marginBottom: 24 }}>
                  <div style={{ marginBottom: 16 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                      <rect width="56" height="56" rx="14" fill="#F0FDF8"/>
                      <path d="M28 36V24M28 24L23 29M28 24L33 29" stroke="#01D98D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 38H36" stroke="#01D98D" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 6 }}>Drop your receipt here</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>or tap to choose a photo from your device</div>
                  <div style={{ display: 'inline-block', padding: '10px 24px', background: '#01D98D', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>Choose Photo</div>
                  <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 16 }}>JPG, PNG, PDF supported</div>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[{ l: 'Web Upload', a: true }, { l: 'Voice Entry', a: true }, { l: 'Mileage Tracker', a: true }, { l: 'Email Forward', a: false }, { l: 'WhatsApp', a: false }, { l: 'Bank Feed', a: false }].map(p => (
                    <span key={p.l} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.a ? '#E8F8F2' : '#F3F4F6', color: p.a ? '#01D98D' : '#9CA3AF', border: `1px solid ${p.a ? '#01D98D' : 'transparent'}` }}>
                      {p.a ? 'Live: ' : 'Coming: '}{p.l}
                    </span>
                  ))}
                </div>
              </>
            )}

            {imagePreview && saveStatus !== 'saved' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E' }}>{extracted ? 'Receipt read' : 'Receipt ready'}</div>
                  <button onClick={scanAnother} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>Use different photo</button>
                </div>
                <img src={imagePreview} alt="Receipt" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 10, background: '#F9FAFB', marginBottom: 16 }} />
                {!extracted && !reading && (
                  <button onClick={readReceipt} style={{ width: '100%', padding: '14px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Read Receipt with AI</button>
                )}
                {reading && (
                  <div style={{ textAlign: 'center', padding: '16px', background: '#F0FDF8', borderRadius: 12 }}>
                    <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 4 }}>Reading your receipt...</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>AI is extracting the details</div>
                  </div>
                )}
                {readError && <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '12px 16px', color: '#991B1B', fontSize: 13, marginTop: 8 }}>{readError}</div>}
              </div>
            )}

            {extracted && saveStatus !== 'saved' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24 }}>
                <div style={{ background: extracted.confidence === 'HIGH' ? '#F0FDF8' : extracted.confidence === 'MEDIUM' ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${extracted.confidence === 'HIGH' ? '#BBF7E4' : extracted.confidence === 'MEDIUM' ? '#FDE68A' : '#FECACA'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: extracted.confidence === 'HIGH' ? '#01D98D' : extracted.confidence === 'MEDIUM' ? '#F59E0B' : '#EF4444', flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    {extracted.confidence === 'HIGH' ? 'Receipt read clearly. Check the details below and confirm.' : extracted.confidence === 'MEDIUM' ? 'Most details extracted. Please check the amounts carefully.' : 'Image quality is low. Please review all fields before saving.'}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Transaction Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setTxType('EXPENSE')} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${txType === 'EXPENSE' ? '#EF4444' : '#E5E7EB'}`, background: txType === 'EXPENSE' ? '#FEF2F2' : '#fff', color: txType === 'EXPENSE' ? '#EF4444' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Expense</button>
                    <button onClick={() => setTxType('INCOME')} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${txType === 'INCOME' ? '#01D98D' : '#E5E7EB'}`, background: txType === 'INCOME' ? '#E8F8F2' : '#fff', color: txType === 'INCOME' ? '#01D98D' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Income</button>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}><label style={lbl}>Amount</label><input type="number" step="0.01" min="0" value={form.amount_gross} onChange={e => setForm(f => ({ ...f, amount_gross: e.target.value }))} style={{ ...input, fontSize: 24, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }} /></div>
                <div style={{ marginBottom: 16 }}><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={input} /></div>
                <div style={{ marginBottom: 16 }}><label style={lbl}>Merchant / Description</label><input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={input} /></div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>HMRC Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={input}>
                    <option value="">Select category</option>
                    <optgroup label="Income">{HMRC_CATEGORIES.filter(c => c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>
                    <optgroup label="Expenses">{HMRC_CATEGORIES.filter(c => !c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>VAT</label>
                  <select value={form.vat_rate} onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))} style={input}>{VAT_RATES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
                </div>
                <div style={{ marginBottom: 24 }}><label style={lbl}>Notes</label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes" style={input} /></div>
                {saveError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 14px', color: '#991B1B', fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
                <button onClick={saveTransaction} disabled={saveStatus === 'saving'} style={{ width: '100%', padding: '14px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", opacity: saveStatus === 'saving' ? 0.7 : 1 }}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Save to My Accounts'}
                </button>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 16L13 21L24 11" stroke="#01D98D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 8 }}>Saved. Your accounts are up to date.</div>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>{form.description} has been added to REDITUS.</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>You are running your business properly. That is what this is about.</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={scanAnother} style={{ padding: '12px 28px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Scan another receipt</button>
                  <button onClick={() => { window.location.href = '/dashboard/reditus'; }} style={{ padding: '12px 28px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View transactions</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── VOICE TAB ─── */}
        {tab === 'voice' && (
          <>
            {voiceSaveStatus !== 'saved' && (
              <>
                {/* LUMEN message bubble */}
                {lumenMessage && (
                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #01D98D, #0A2E1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2.5"/><circle cx="12" cy="13" r="1.5" fill="white"/><circle cx="20" cy="13" r="1.5" fill="white"/><path d="M10 18C10 18 12 21 16 21C20 21 22 18 22 18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ fontSize: 15, color: '#0A2E1E', fontWeight: 500, lineHeight: 1.5 }}>{lumenMessage}</div>
                  </div>
                )}

                {/* Microphone */}
                {(voiceMode === 'idle' || voiceMode === 'listening') && !voiceForm.amount_gross && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '48px 32px', textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E', marginBottom: 8 }}>
                      Just say what you spent.
                    </div>
                    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
                      "Coffee at Costa, six fifty" · "Drove to Leeds, forty miles" · "How much tax do I owe?"
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                      {voiceMode === 'listening' && (
                        <>
                          <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '2px solid #01D98D', animation: 'ripple 1.2s ease-out infinite' }} />
                          <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid #01D98D', animation: 'ripple 1.2s ease-out 0.4s infinite' }} />
                        </>
                      )}
                      <button
                        onClick={voiceMode === 'listening' ? stopListening : startListening}
                        style={{ width: 88, height: 88, borderRadius: '50%', background: voiceMode === 'listening' ? '#EF4444' : '#01D98D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                      >
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                          {voiceMode === 'listening' ? (
                            <rect x="10" y="10" width="16" height="16" rx="3" fill="white"/>
                          ) : (
                            <>
                              <rect x="13" y="4" width="10" height="18" rx="5" fill="white"/>
                              <path d="M6 18C6 24.627 11.373 30 18 30C24.627 30 30 24.627 30 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                              <line x1="18" y1="30" x2="18" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            </>
                          )}
                        </svg>
                      </button>
                    </div>

                    <div style={{ fontSize: 13, color: voiceMode === 'listening' ? '#EF4444' : '#9CA3AF', fontWeight: voiceMode === 'listening' ? 600 : 400 }}>
                      {voiceMode === 'listening' ? 'Listening... tap to stop' : 'Tap the mic to start'}
                    </div>

                    {transcript && (
                      <div style={{ marginTop: 20, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10, fontSize: 14, color: '#374151', fontStyle: 'italic' }}>
                        "{transcript}"
                      </div>
                    )}
                  </div>
                )}

                {/* Processing */}
                {voiceMode === 'processing' && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '48px 32px', textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 8 }}>Understanding that...</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>LUMEN is parsing your input</div>
                  </div>
                )}

                {/* Follow-up question */}
                {voiceMode === 'questioning' && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 16 }}>Just one more thing</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={handleFollowUpVoice} style={{ flex: 1, padding: '12px', background: '#01D98D', color: '#0A2E1E', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        Answer by voice
                      </button>
                      <button onClick={() => setVoiceMode('confirming')} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        Fill in manually
                      </button>
                    </div>
                    {missingField === 'type' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={() => { setVoiceTxType('EXPENSE'); setVoiceMode('confirming'); }} style={{ flex: 1, padding: '10px', background: '#FEF2F2', color: '#EF4444', border: '2px solid #EF4444', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Expense (money out)</button>
                        <button onClick={() => { setVoiceTxType('INCOME'); setVoiceMode('confirming'); }} style={{ flex: 1, padding: '10px', background: '#E8F8F2', color: '#01D98D', border: '2px solid #01D98D', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Income (money in)</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirmation card */}
                {voiceMode === 'confirming' && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 4 }}>Confirm and save</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Check the details — tap any field to edit.</div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Type</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setVoiceTxType('EXPENSE')} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${voiceTxType === 'EXPENSE' ? '#EF4444' : '#E5E7EB'}`, background: voiceTxType === 'EXPENSE' ? '#FEF2F2' : '#fff', color: voiceTxType === 'EXPENSE' ? '#EF4444' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Expense</button>
                        <button onClick={() => setVoiceTxType('INCOME')} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${voiceTxType === 'INCOME' ? '#01D98D' : '#E5E7EB'}`, background: voiceTxType === 'INCOME' ? '#E8F8F2' : '#fff', color: voiceTxType === 'INCOME' ? '#01D98D' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Income</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={lbl}>Amount</label>
                        <input type="number" step="0.01" value={voiceForm.amount_gross} onChange={e => setVoiceForm(f => ({ ...f, amount_gross: e.target.value }))} style={{ ...input, fontSize: 20, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }} />
                      </div>
                      <div>
                        <label style={lbl}>Date</label>
                        <input type="date" value={voiceForm.date} onChange={e => setVoiceForm(f => ({ ...f, date: e.target.value }))} style={input} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Merchant / Description</label>
                      <input type="text" value={voiceForm.description} onChange={e => setVoiceForm(f => ({ ...f, description: e.target.value }))} style={input} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={lbl}>HMRC Category</label>
                      <select value={voiceForm.category} onChange={e => setVoiceForm(f => ({ ...f, category: e.target.value }))} style={input}>
                        <option value="">Select category</option>
                        <optgroup label="Income">{HMRC_CATEGORIES.filter(c => c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>
                        <optgroup label="Expenses">{HMRC_CATEGORIES.filter(c => !c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>
                      </select>
                    </div>

                    {voiceSaveError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 14px', color: '#991B1B', fontSize: 13, marginBottom: 12 }}>{voiceSaveError}</div>}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={saveVoiceTransaction} disabled={voiceSaveStatus === 'saving'} style={{ flex: 2, padding: '14px', background: '#01D98D', color: '#0A2E1E', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        {voiceSaveStatus === 'saving' ? 'Saving...' : 'Save to My Accounts'}
                      </button>
                      <button onClick={resetVoice} style={{ flex: 1, padding: '14px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        Start over
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {voiceSaveStatus === 'saved' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 16L13 21L24 11" stroke="#01D98D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 8 }}>Got it. Accounts updated.</div>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>{voiceForm.description} — £{parseFloat(voiceForm.amount_gross || '0').toFixed(2)} saved to REDITUS.</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={resetVoice} style={{ padding: '12px 28px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Log another</button>
                  <button onClick={() => { window.location.href = '/dashboard/reditus'; }} style={{ padding: '12px 28px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View transactions</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── MILEAGE TAB ─── */}
        {tab === 'mileage' && (
          <>
            {mileageSaveStatus !== 'saved' && (
              <>
                <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>HMRC approved rate</div>
                    <div style={{ fontSize: 13, color: '#374151' }}>45p per mile for the first 10,000 miles · 25p thereafter</div>
                  </div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E' }}>45p/mi</div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 20 }}>Journey details</div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>From (leave blank to use your current location)</label>
                    <input type="text" value={mileageFrom} onChange={e => setMileageFrom(e.target.value)} placeholder="Your location (auto-detected)" style={input} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>To (destination)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={mileageTo} onChange={e => setMileageTo(e.target.value)} placeholder="e.g. Leeds city centre, or a postcode" style={{ ...input, flex: 1 }} />
                      <button onClick={calculateGPSRoute} disabled={gpsLoading} style={{ padding: '10px 16px', background: '#0A2E1E', color: '#01D98D', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                        {gpsLoading ? '...' : 'Calculate'}
                      </button>
                    </div>
                    {gpsError && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>{gpsError}</div>}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Or enter miles manually</label>
                    <input type="number" min="0" step="0.1" value={mileageMiles} onChange={e => setMileageMiles(e.target.value)} placeholder="e.g. 47" style={input} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Journey type</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setMileageReturn(false)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${!mileageReturn ? '#01D98D' : '#E5E7EB'}`, background: !mileageReturn ? '#E8F8F2' : '#fff', color: !mileageReturn ? '#0A2E1E' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>One way</button>
                      <button onClick={() => setMileageReturn(true)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${mileageReturn ? '#01D98D' : '#E5E7EB'}`, background: mileageReturn ? '#E8F8F2' : '#fff', color: mileageReturn ? '#0A2E1E' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Return trip</button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Date</label>
                    <input type="date" value={mileageDate} onChange={e => setMileageDate(e.target.value)} style={input} />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Business purpose</label>
                    <input type="text" value={mileagePurpose} onChange={e => setMileagePurpose(e.target.value)} placeholder="e.g. Client meeting, site visit, materials pickup" style={input} />
                  </div>

                  {mileageCalc && (
                    <div style={{ background: '#0A2E1E', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#6B9F8E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Total miles</div>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#fff' }}>{mileageCalc.miles}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#6B9F8E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>HMRC rate</div>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#fff' }}>45p</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#6B9F8E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Allowance</div>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#01D98D' }}>£{mileageCalc.amount.toFixed(2)}</div>
                        </div>
                      </div>
                      {mileageReturn && mileageMiles && (
                        <div style={{ fontSize: 12, color: '#6B9F8E', textAlign: 'center', marginTop: 10 }}>
                          {parseFloat(mileageMiles)} miles each way · {mileageCalc.miles} miles total
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={saveMileage} disabled={!mileageCalc || mileageSaveStatus === 'saving'} style={{ width: '100%', padding: '14px', background: mileageCalc ? '#01D98D' : '#F3F4F6', color: mileageCalc ? '#0A2E1E' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: mileageCalc ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat', sans-serif" }}>
                    {mileageSaveStatus === 'saving' ? 'Saving...' : 'Log Mileage'}
                  </button>
                </div>
              </>
            )}

            {mileageSaveStatus === 'saved' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 16L13 21L24 11" stroke="#01D98D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 8 }}>Journey logged.</div>
                {mileageCalc && (
                  <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 8 }}>{mileageCalc.miles} miles · £{mileageCalc.amount.toFixed(2)} HMRC allowance claimed.</div>
                )}
                <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>Saved to REDITUS under Car, van and travel.</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={resetMileage} style={{ padding: '12px 28px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Log another journey</button>
                  <button onClick={() => { window.location.href = '/dashboard/reditus'; }} style={{ padding: '12px 28px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View transactions</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
