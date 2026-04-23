'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Theme = 'bright' | 'forest' | 'dark';

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({ theme: 'bright', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('bright');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('theme').eq('id', user.id).single();
      if (data?.theme) setThemeState(data.theme as Theme);
    }
    load();
  }, []);

  async function setTheme(t: Theme) {
    setThemeState(t);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ theme: t }).eq('id', user.id);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

// Sidebar CSS variables per theme
export function getSidebarStyles(theme: Theme) {
  if (theme === 'bright') return {
    background: 'linear-gradient(175deg,#01D98D 0%,#01D98D 45%,#0EBDCA 100%)',
    logoColor: '#fff',
    logoOpacity: 'rgba(255,255,255,0.5)',
    balLabel: 'rgba(255,255,255,0.6)',
    balValue: '#fff',
    tileBackground: 'rgba(0,0,0,0.15)',
    tileLabel: 'rgba(255,255,255,0.6)',
    incomeColor: '#fff',
    expenseColor: '#FFB3B3',
    taxColor: '#FFE8A3',
    divider: 'rgba(255,255,255,0.18)',
    sectionColor: 'rgba(255,255,255,0.5)',
    activeBackground: 'rgba(0,0,0,0.14)',
    activeBorder: '#fff',
    activeText: '#fff',
    inactiveText: 'rgba(255,255,255,0.85)',
    inactiveDot: 'rgba(255,255,255,0.6)',
    activeDot: '#fff',
    soonColor: 'rgba(255,255,255,0.35)',
    userNameColor: '#fff',
    userPlanColor: 'rgba(255,255,255,0.55)',
    avatarBackground: 'rgba(0,0,0,0.15)',
    avatarColor: '#fff',
    badgeBackground: 'rgba(0,0,0,0.2)',
    badgeColor: '#fff',
  };

  if (theme === 'forest') return {
    background: 'linear-gradient(175deg,#01D98D 0%,#01D98D 45%,#0EBDCA 100%)',
    logoColor: '#1C1C1E',
    logoOpacity: 'rgba(28,28,30,0.4)',
    balLabel: 'rgba(28,28,30,0.55)',
    balValue: '#1C1C1E',
    tileBackground: 'rgba(0,0,0,0.08)',
    tileLabel: 'rgba(28,28,30,0.55)',
    incomeColor: '#0A5C3A',
    expenseColor: '#991B1B',
    taxColor: '#92400E',
    divider: 'rgba(0,0,0,0.1)',
    sectionColor: 'rgba(28,28,30,0.4)',
    activeBackground: 'rgba(0,0,0,0.09)',
    activeBorder: '#1C1C1E',
    activeText: '#1C1C1E',
    inactiveText: 'rgba(28,28,30,0.75)',
    inactiveDot: 'rgba(28,28,30,0.35)',
    activeDot: '#1C1C1E',
    soonColor: 'rgba(28,28,30,0.35)',
    userNameColor: '#1C1C1E',
    userPlanColor: 'rgba(28,28,30,0.55)',
    avatarBackground: 'rgba(0,0,0,0.1)',
    avatarColor: '#1C1C1E',
    badgeBackground: 'rgba(0,0,0,0.1)',
    badgeColor: '#1C1C1E',
  };

  // dark
  return {
    background: '#0A2E1E',
    logoColor: '#01D98D',
    logoOpacity: 'rgba(1,217,141,0.4)',
    balLabel: 'rgba(1,217,141,0.5)',
    balValue: '#fff',
    tileBackground: 'rgba(1,217,141,0.08)',
    tileLabel: 'rgba(255,255,255,0.4)',
    incomeColor: '#01D98D',
    expenseColor: '#EF4444',
    taxColor: '#F59E0B',
    divider: 'rgba(1,217,141,0.15)',
    sectionColor: 'rgba(1,217,141,0.4)',
    activeBackground: 'rgba(1,217,141,0.1)',
    activeBorder: '#01D98D',
    activeText: '#01D98D',
    inactiveText: 'rgba(255,255,255,0.75)',
    inactiveDot: 'rgba(255,255,255,0.25)',
    activeDot: '#01D98D',
    soonColor: 'rgba(255,255,255,0.25)',
    userNameColor: '#fff',
    userPlanColor: 'rgba(255,255,255,0.45)',
    avatarBackground: 'rgba(1,217,141,0.15)',
    avatarColor: '#01D98D',
    badgeBackground: 'rgba(1,217,141,0.15)',
    badgeColor: '#01D98D',
  };
}
