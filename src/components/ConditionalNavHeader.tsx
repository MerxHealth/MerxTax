'use client';
import { usePathname } from 'next/navigation';
import NavHeader from './NavHeader';

export default function ConditionalNavHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <NavHeader />;
}
