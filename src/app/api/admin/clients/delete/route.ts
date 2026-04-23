// src/app/api/admin/clients/delete/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin-auth"

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 })

    if (user_id === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { error: profileErr } = await adminDb
      .from("profiles")
      .delete()
      .eq("id", user_id)

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    const { error: authErr } = await adminDb.auth.admin.deleteUser(user_id)
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

    await adminDb.from("admin_audit_log").insert({
      admin_user_id: user.id,
      action_type: "user_deleted",
      target_user_id: user_id,
      details: { deleted_by: user.id },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
