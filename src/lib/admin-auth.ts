// src/lib/admin-auth.ts
// Central admin access check — no DB query, no RLS dependency
// Add UUIDs here to grant admin access

const SUPERADMIN_UUIDS = new Set([
  'f27981eb-7ed8-43af-a1ea-6b86942b3099', // mark.dyas@merxdigital.co.uk
  '9eaed686-96b6-4a59-9c5a-551e77bebebf', // contato@lirolla.com
])

export function isAdmin(userId: string | undefined | null): boolean {
  if (!userId) return false
  return SUPERADMIN_UUIDS.has(userId)
}
