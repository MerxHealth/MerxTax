import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MerxTax",
  description: "MTD Income Tax made simple",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antia`}>
      <body className="min-h-full flex flex-col">
        <nav style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          <a href="/pricing" style={{
            color: '#0A2E1E',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            marginRight: '24px',
          }}>
            Pricing
          </a>
          <a href="/dashboard" style={{
            color: '#0A2E1E',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            marginRight: '24px',
          }}>
            Dashboard
          </a>
          <a href="/login" style={{
            color: '#ffffff',
            backgroundColor: '#01D98D',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            padding: '8px 18px',
            borderRadius: '8px',
          }}>
            Sign in
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}