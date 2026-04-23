// src/middleware.ts
// MerxTax Platform Middleware
// Sprint 6: Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
// Sprint 7 · Slice 7A · Step 3: Admin route session protection
//
// ARCHITECTURE — DEFENSE IN DEPTH
// ─────────────────────────────────────────────────────────────
// Layer 1 (this file, server-side):  session cookie check → redirect to /login if missing
// Layer 2 (src/app/admin/layout.tsx, client-side): admin_users table role lookup → redirect to /dashboard if not admin
//
// This middleware intentionally does NOT query admin_users on every request — that would hit
// the database hundreds of times per session. Session check here is fast (cookie read only);
// role check is deferred to the layout where the DB query runs once per mount.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ============================================================
  // SPRINT 6 — SECURITY HEADERS (applied to ALL routes)
  // ============================================================
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(self)'
  );

  // ============================================================
  // SPRINT 7 — ADMIN ROUTE SESSION PROTECTION
  // ============================================================
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    // Allow /admin/login to pass through unauthenticated
    // (so users can actually log in to reach the admin area)
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
      return response;
    }

    // Check for Supabase auth cookie presence.
    // Supabase cookie naming: sb-<project-ref>-auth-token  (optionally split .0, .1 for large tokens)
    const hasSessionCookie = request.cookies.getAll().some((cookie) => {
      return (
        cookie.name.startsWith('sb-') &&
        cookie.name.includes('auth-token') &&
        cookie.value.length > 0
      );
    });

    if (!hasSessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Session cookie present — allow request to continue.
    // The admin_users role check happens in src/app/admin/layout.tsx.
  }

  return response;
}

export const config = {
  matcher: '/(.*)',
};
