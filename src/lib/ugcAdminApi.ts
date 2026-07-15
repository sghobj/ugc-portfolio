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

export type AssetVisibility = 'public' | 'preview'

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
  visibility?: AssetVisibility
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

export type UgcAdminClient = {
  id: number
  name: string
  slug?: string | null
  location?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  instagram?: string | null
  notes?: string | null
  logoUrl?: string | null
}

export type UgcAdminClientInput = {
  name: string
  location?: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  instagram?: string
  notes?: string
  logoFileId?: number
}

export const listUgcAdminClients = async (token: string): Promise<UgcAdminClient[]> => {
  return await request<UgcAdminClient[]>(token, '/clients')
}

export const createUgcAdminClient = async (
  token: string,
  payload: UgcAdminClientInput,
): Promise<UgcAdminClient> => {
  return await request<UgcAdminClient>(
    token,
    '/clients',
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to create client',
  )
}

export const uploadStrapiMediaFile = async (
  token: string,
  file: File,
): Promise<{ id: number; url: string }> => {
  const form = new FormData()
  form.append('files', file)

  const response = await fetch(`${getBaseUrl()}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  const payload = await parseJsonResponse(response)
  if (!response.ok) {
    throw new Error(parseError(payload, `Upload failed (${response.status})`))
  }

  const first = Array.isArray(payload) ? payload[0] : payload
  const uploaded = first as { id?: number; url?: string }
  if (!uploaded || typeof uploaded.id !== 'number') {
    throw new Error('Upload did not return a file id.')
  }

  return { id: uploaded.id, url: typeof uploaded.url === 'string' ? uploaded.url : '' }
}

export type UgcAdminPreview = {
  id: number
  title: string
  shareId: string
  previewUrl?: string | null
  clientId?: number | null
  clientName?: string | null
  intro?: string | null
  offer?: string | null
  ctaEmail?: string | null
  accessCode?: string | null
  expiresAt?: string | null
  isActive: boolean
  assetIds: number[]
}

export type UgcAdminPreviewInput = {
  title: string
  clientId?: number | null
  clientName?: string
  intro?: string
  offer?: string
  ctaEmail?: string
  accessCode?: string
  expiresAt?: string
  isActive?: boolean
  assetIds?: number[]
}

export const listUgcAdminPreviews = async (token: string): Promise<UgcAdminPreview[]> => {
  return await request<UgcAdminPreview[]>(token, '/previews')
}

export const createUgcAdminPreview = async (
  token: string,
  payload: UgcAdminPreviewInput,
): Promise<UgcAdminPreview> => {
  return await request<UgcAdminPreview>(
    token,
    '/previews',
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to create preview',
  )
}

export const updateUgcAdminPreview = async (
  token: string,
  previewId: number,
  payload: UgcAdminPreviewInput,
): Promise<UgcAdminPreview> => {
  return await request<UgcAdminPreview>(
    token,
    `/previews/${previewId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'Failed to update preview',
  )
}

export const deleteUgcAdminPreview = async (
  token: string,
  previewId: number,
): Promise<{ id: number }> => {
  return await request<{ id: number }>(
    token,
    `/previews/${previewId}`,
    { method: 'DELETE' },
    'Failed to delete preview',
  )
}

export type UploadAssetOptions = {
  title: string
  kind: 'photo' | 'video'
  visibility?: AssetVisibility
  placement?: AssetPlacement
  collectionId?: number | null
  categoryIds?: number[]
  uploadScope?: string
  onProgress?: (ratio: number) => void
}

/** Full upload + metadata-save flow (Cloudinary photo / Bunny video), reusable across the admin. */
export const uploadAndCreateAsset = async (
  token: string,
  file: File,
  options: UploadAssetOptions,
): Promise<UgcAdminAsset> => {
  const title = options.title.trim() || file.name
  const scope = options.uploadScope || undefined
  const visibility = options.visibility ?? 'public'

  if (options.kind === 'video') {
    const started = await createBunnyVideoUploadStart(token, {
      title,
      filename: file.name,
      mimeType: file.type || undefined,
      size: file.size,
      collectionName: scope,
    })

    await uploadFileToBunnyTus(file, started, options.onProgress)
    const play = await getBunnyVideoPlayData(token, started.videoId)

    return await createUgcAdminAsset(token, {
      title,
      kind: 'video',
      storageProvider: 'bunny',
      visibility,
      placement: options.placement ?? null,
      categoryIds: options.categoryIds ?? [],
      storage: {
        provider: 'bunny',
        libraryId: play.libraryId || started.libraryId,
        videoId: play.videoId || started.videoId,
        status: play.status,
        encodeProgress: play.encodeProgress,
        embedUrl: play.embedUrl || started.embedUrl || undefined,
        playbackUrl: play.playbackUrl || undefined,
        fallbackUrl: play.fallbackUrl || undefined,
        thumbnailUrl: play.thumbnailUrl || undefined,
        bytes: play.bytes,
        duration: play.duration,
        width: play.width,
        height: play.height,
        raw: play.raw ?? play,
      },
    })
  }

  const signature = await createCloudinaryUploadSignature(token, {
    filename: file.name,
    kind: 'photo',
    collectionName: scope,
  })
  const uploaded = await uploadFileToCloudinary(signature, file)

  return await createUgcAdminAsset(token, {
    title,
    kind: 'photo',
    storageProvider: 'cloudinary',
    visibility,
    placement: options.placement ?? null,
    collectionId: options.collectionId ?? null,
    categoryIds: options.categoryIds ?? [],
    cloudinary: {
      provider: 'cloudinary',
      publicId: String(uploaded.public_id ?? ''),
      resourceType: String(uploaded.resource_type || 'image'),
      deliveryType: String(uploaded.type || 'upload'),
      version: uploaded.version,
      format: String(uploaded.format ?? ''),
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      duration: uploaded.duration,
      secureUrl: String(uploaded.secure_url ?? ''),
      raw: uploaded,
    },
  })
}

export const releaseUgcAdminAsset = async (
  token: string,
  assetId: number,
  target: { placement?: AssetPlacement; collectionId?: number | null },
): Promise<UgcAdminAsset> => {
  return await updateUgcAdminAsset(token, assetId, {
    visibility: 'public',
    placement: target.placement ?? null,
    ...(target.collectionId !== undefined ? { collectionId: target.collectionId } : {}),
  })
}
