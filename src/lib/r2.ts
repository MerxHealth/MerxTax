import { S3Client } from '@aws-sdk/client-s3'

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID || ''
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')

  return {
    accountId,
    endpoint: endpoint || required('R2_ENDPOINT'),
    bucket: required('R2_BUCKET_NAME'),
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  }
}

export function getR2Client() {
  const config = getR2Config()

  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export function buildR2PublicUrl(key: string) {
  const config = getR2Config()
  const cleanKey = key.replace(/^\/+/, '')

  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl}/${cleanKey}`
  }

  return `${config.endpoint.replace(/\/$/, '')}/${config.bucket}/${cleanKey}`
}

export function getR2ObjectKeyFromUrl(url: string | null | undefined) {
  if (!url) return null

  const config = getR2Config()
  const normalizedPublic = config.publicBaseUrl ? `${config.publicBaseUrl}/` : ''
  const normalizedEndpoint = `${config.endpoint.replace(/\/$/, '')}/${config.bucket}/`

  if (normalizedPublic && url.startsWith(normalizedPublic)) {
    return url.slice(normalizedPublic.length)
  }

  if (url.startsWith(normalizedEndpoint)) {
    return url.slice(normalizedEndpoint.length)
  }

  return null
}
