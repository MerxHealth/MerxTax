// src/components/ImpersonationBanner.tsx — Server Component
import { getActiveImpersonation } from '@/lib/impersonation'
import ImpersonationBannerClient from './ImpersonationBannerClient'

export default async function ImpersonationBanner() {
  const session = await getActiveImpersonation()
  if (!session) return null
  return (
    <ImpersonationBannerClient
      sessionId={session.session_id}
      targetEmail={session.target_email ?? 'Unknown user'}
      targetName={session.target_name ?? ''}
      expiresAt={session.expires_at}
    />
  )
}
