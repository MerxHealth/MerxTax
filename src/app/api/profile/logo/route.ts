import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildR2PublicUrl, getR2Client, getR2Config, getR2ObjectKeyFromUrl } from '@/lib/r2'

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const maxFileSize = 2 * 1024 * 1024

function getExtension(fileName: string, contentType: string) {
  const fromName = fileName.split('.').pop()?.toLowerCase()
  if (fromName && ['png', 'jpg', 'jpeg', 'webp'].includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Please upload a PNG, JPG or WebP image.' }, { status: 400 })
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: 'File must be under 2MB.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('logo_url')
      .eq('id', user.id)
      .single()

    const client = getR2Client()
    const config = getR2Config()
    const ext = getExtension(file.name, file.type)
    const key = `${user.id}/logo-${Date.now()}.${ext}`
    const body = Buffer.from(await file.arrayBuffer())

    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    }))

    const publicUrl = buildR2PublicUrl(key)

    await supabase
      .from('profiles')
      .update({ logo_url: publicUrl })
      .eq('id', user.id)

    const previousKey = getR2ObjectKeyFromUrl(profile?.logo_url)
    if (previousKey && previousKey !== key) {
      await client.send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: previousKey,
      }))
    }

    return NextResponse.json({ success: true, publicUrl })
  } catch (error: any) {
    console.error('R2 logo upload error:', error)
    return NextResponse.json({ error: error?.message || 'Upload failed.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('logo_url')
      .eq('id', user.id)
      .single()

    const key = getR2ObjectKeyFromUrl(profile?.logo_url)
    if (key) {
      const client = getR2Client()
      const config = getR2Config()
      await client.send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }))
    }

    await supabase
      .from('profiles')
      .update({ logo_url: null })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('R2 logo delete error:', error)
    return NextResponse.json({ error: error?.message || 'Delete failed.' }, { status: 500 })
  }
}
