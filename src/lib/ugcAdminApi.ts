import { env } from '@/config/env'

export type UgcAdminCategory = {
  id: number
  name: string
  slug: string
}

export type UgcAdminCollection = {
  id: number
  name: string
  slug: string
  description?: string | null
  story?: string | null
  sortOrder?: number
}

export type AssetPlacement = 'highlight' | 'video' | null

export type UgcAdminAsset = {
  id: number
  storageProvider?: 'cloudinary' | 'bunny' | string
  title: string
  description?: string | null
  kind: 'photo' | 'video'
  hook?: string | null
  goal?: string | null
  style?: string | null
  instagramUrl?: string | null
  focalPointX?: number | null
  focalPointY?: number | null
  placement?: AssetPlacement
  sortOrder?: number
  secureUrl?: string | null
  thumbnailUrl?: string | null
  cloudinary: {
    secureUrl: string
    thumbnailUrl?: string | null
  }
  bunny?: {
    videoId?: string | null
    libraryId?: number | null
    status?: number | null
    encodeProgress?: number | null
    embedUrl?: string | null
    playbackUrl?: string | null
    fallbackUrl?: string | null
    thumbnailUrl?: string | null
  }
  categories: UgcAdminCategory[]
  collection?: UgcAdminCollection | null
}

export type UgcAdminTestimonial = {
  id: number
  name: string
  role?: string | null
  quote: string
  approved: boolean
  publishedAt?: string | null
  createdAt?: string | null
  avatar?: {
    id?: number | null
    url?: string | null
    alternativeText?: string | null
    width?: number | null
    height?: number | null
  } | null
}

export type UgcAdminConfig = {
  maxUploadMb?: number
  portfolioFolder?: string
  deliveryType?: string
  storageProvider?: string
  imageProvider?: string
  videoProvider?: string
  bunnyConfigured?: boolean
  bunnyLibraryId?: number | null
  bunnyTusUploadUrl?: string
  bunnyEmbedBaseUrl?: string
  bunnyTusExpireSeconds?: number
}

export type CloudinaryUploadSignatureResponse = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  publicId: string
  resourceType: 'image' | 'video'
  deliveryType: string
  uploadUrl: string
}

export type CloudinaryUploadResult = {
  public_id: string
  resource_type: 'image' | 'video' | 'raw'
  type?: string
  version?: number
  format?: string
  bytes?: number
  width?: number
  height?: number
  duration?: number
  secure_url?: string
  [key: string]: unknown
}

export type BunnyUploadStartResponse = {
  storageProvider?: string
  libraryId: number
  videoId: string
  uploadUrl: string
  authorizationSignature: string
  authorizationExpire: number
  embedUrl?: string
}

export type BunnyPlayDataResponse = {
  storageProvider?: string
  libraryId: number
  videoId: string
  status?: number | null
  encodeProgress?: number | null
  embedUrl?: string | null
  thumbnailUrl?: string | null
  playbackUrl?: string | null
  fallbackUrl?: string | null
  bytes?: number | null
  duration?: number | null
  width?: number | null
  height?: number | null
  raw?: unknown
}

const getBaseUrl = (): string => env.strapiBaseUrl.replace(/\/+$/, '')
const getApiBase = (): string => `${getBaseUrl()}/api/ugc-portfolio/admin`

const parseError = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const typed = payload as {
    error?: string | { message?: string }
    message?: string
  }

  if (typeof typed.error === 'string') {
    return typed.error
  }

  if (typed.error && typeof typed.error === 'object' && typeof typed.error.message === 'string') {
    return typed.error.message
  }

  if (typeof typed.message === 'string') {
    return typed.message
  }

  return fallback
}

const parseJsonResponse = async (response: Response): Promise<unknown> => {
  const raw = await response.text()
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return { error: raw }
  }
}

const request = async <T>(
  token: string,
  path: string,
  init: RequestInit = {},
  fallbackError = 'Request failed',
): Promise<T> => {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(parseError(payload, `${fallbackError} (${response.status})`))
  }

  return payload as T
}

export const fetchUgcAdminConfig = async (): Promise<UgcAdminConfig> => {
  const response = await fetch(`${getApiBase()}/config`)
  const payload = (await response.json()) as UgcAdminConfig
  return payload
}

export const listUgcAdminCategories = async (token: string): Promise<UgcAdminCategory[]> => {
  return await request<UgcAdminCategory[]>(token, '/categories')
}

export const createUgcAdminCategory = async (
  token: string,
  payload: { name: string; slug?: string },
): Promise<UgcAdminCategory> => {
  return await request<UgcAdminCategory>(
    token,
    '/categories',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to create category',
  )
}

export const listUgcAdminCollections = async (token: string): Promise<UgcAdminCollection[]> => {
  return await request<UgcAdminCollection[]>(token, '/collections')
}

export const createUgcAdminCollection = async (
  token: string,
  payload: { name: string; slug?: string; description?: string },
): Promise<UgcAdminCollection> => {
  return await request<UgcAdminCollection>(
    token,
    '/collections',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to create collection',
  )
}

export const listUgcAdminAssets = async (token: string): Promise<UgcAdminAsset[]> => {
  return await request<UgcAdminAsset[]>(token, '/assets')
}

export const listUgcAdminTestimonials = async (token: string): Promise<UgcAdminTestimonial[]> => {
  return await request<UgcAdminTestimonial[]>(token, '/testimonials')
}

export const approveUgcAdminTestimonial = async (
  token: string,
  testimonialId: number,
): Promise<UgcAdminTestimonial> => {
  return await request<UgcAdminTestimonial>(
    token,
    `/testimonials/${testimonialId}/approve`,
    {
      method: 'POST',
    },
    'Failed to approve testimonial',
  )
}

export const unpublishUgcAdminTestimonial = async (
  token: string,
  testimonialId: number,
): Promise<UgcAdminTestimonial> => {
  return await request<UgcAdminTestimonial>(
    token,
    `/testimonials/${testimonialId}/unpublish`,
    {
      method: 'POST',
    },
    'Failed to unpublish testimonial',
  )
}

export const createCloudinaryUploadSignature = async (
  token: string,
  payload: {
    filename: string
    kind: 'photo' | 'video'
    collectionName?: string
  },
): Promise<CloudinaryUploadSignatureResponse> => {
  return await request<CloudinaryUploadSignatureResponse>(
    token,
    '/uploads/signature',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to sign Cloudinary upload',
  )
}

export const uploadFileToCloudinary = async (
  signature: CloudinaryUploadSignatureResponse,
  file: File,
): Promise<CloudinaryUploadResult> => {
  const uploadData = new FormData()
  uploadData.append('file', file)
  uploadData.append('api_key', signature.apiKey)
  uploadData.append('timestamp', String(signature.timestamp))
  uploadData.append('signature', signature.signature)
  uploadData.append('folder', signature.folder)
  uploadData.append('public_id', signature.publicId)
  uploadData.append('type', signature.deliveryType)

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: uploadData,
  })

  const payload = (await response.json()) as CloudinaryUploadResult & {
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Cloudinary upload failed (${response.status}).`)
  }

  return payload
}

export const createBunnyVideoUploadStart = async (
  token: string,
  payload: {
    title?: string
    filename?: string
    mimeType?: string
    size: number
    collectionName?: string
  },
): Promise<BunnyUploadStartResponse> => {
  return await request<BunnyUploadStartResponse>(
    token,
    '/uploads/bunny/start',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to start Bunny upload',
  )
}

export const getBunnyVideoPlayData = async (
  token: string,
  videoId: string,
): Promise<BunnyPlayDataResponse> => {
  return await request<BunnyPlayDataResponse>(
    token,
    `/uploads/bunny/${encodeURIComponent(videoId)}/play-data`,
    {
      method: 'GET',
    },
    'Failed to load Bunny play data',
  )
}

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

export const uploadFileToBunnyTus = async (
  file: File,
  uploadStart: BunnyUploadStartResponse,
  onProgress?: (ratio: number) => void,
): Promise<void> => {
  const metadataHeader = [
    ['filename', file.name],
    ['filetype', file.type || 'application/octet-stream'],
    ['title', file.name],
  ]
    .filter((entry) => entry[1])
    .map((entry) => `${entry[0]} ${encodeBase64(entry[1])}`)
    .join(',')

  const createResponse = await fetch(uploadStart.uploadUrl, {
    method: 'POST',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': metadataHeader,
      AuthorizationSignature: uploadStart.authorizationSignature,
      AuthorizationExpire: String(uploadStart.authorizationExpire),
      LibraryId: String(uploadStart.libraryId),
      VideoId: uploadStart.videoId,
    },
  })

  if (!createResponse.ok) {
    const body = await createResponse.text()
    throw new Error(body || `Failed to initialize Bunny upload (${createResponse.status}).`)
  }

  const location = createResponse.headers.get('Location')
  if (!location) {
    throw new Error('Bunny upload did not return an upload location.')
  }

  const uploadUrl = new URL(location, uploadStart.uploadUrl).toString()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PATCH', uploadUrl)
    xhr.setRequestHeader('Tus-Resumable', '1.0.0')
    xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream')
    xhr.setRequestHeader('Upload-Offset', '0')
    xhr.setRequestHeader('AuthorizationSignature', uploadStart.authorizationSignature)
    xhr.setRequestHeader('AuthorizationExpire', String(uploadStart.authorizationExpire))
    xhr.setRequestHeader('LibraryId', String(uploadStart.libraryId))
    xhr.setRequestHeader('VideoId', uploadStart.videoId)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      onProgress?.(event.loaded / event.total)
    }

    xhr.onerror = () => {
      reject(new Error('Failed to upload video to Bunny Stream.'))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        resolve()
        return
      }

      reject(new Error(xhr.responseText || `Bunny upload failed (${xhr.status}).`))
    }

    xhr.send(file)
  })
}

export const createUgcAdminAsset = async (
  token: string,
  payload: Record<string, unknown>,
): Promise<UgcAdminAsset> => {
  return await request<UgcAdminAsset>(
    token,
    '/assets',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to save asset metadata',
  )
}

export const deleteUgcAdminAsset = async (token: string, assetId: number): Promise<void> => {
  await request<{ id: number }>(
    token,
    `/assets/${assetId}?removeFromStorage=true`,
    {
      method: 'DELETE',
    },
    'Failed to delete asset',
  )
}

export const updateUgcAdminAsset = async (
  token: string,
  assetId: number,
  payload: Record<string, unknown>,
): Promise<UgcAdminAsset> => {
  return await request<UgcAdminAsset>(
    token,
    `/assets/${assetId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    'Failed to update asset',
  )
}

export const reorderUgcAdminAssets = async (
  token: string,
  items: Array<{ id: number; sortOrder: number }>,
): Promise<{ updated: number }> => {
  return await request<{ updated: number }>(
    token,
    '/assets/batch/reorder',
    {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    },
    'Failed to reorder assets',
  )
}
