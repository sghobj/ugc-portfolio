import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '@/components/Navbar'
import { Progress } from '@/components/ui/progress'
import { env } from '@/config/env'
import { clearUgcAdminToken, getUgcAdminMe, getUgcAdminToken } from '@/lib/ugcAdminAuth'
import {
  createBunnyVideoUploadStart,
  createCloudinaryUploadSignature,
  createUgcAdminAsset,
  createUgcAdminCategory,
  createUgcAdminCollection,
  deleteUgcAdminAsset,
  fetchUgcAdminConfig,
  getBunnyVideoPlayData,
  listUgcAdminAssets,
  listUgcAdminCategories,
  listUgcAdminCollections,
  reorderUgcAdminAssets,
  updateUgcAdminAsset,
  uploadFileToBunnyTus,
  uploadFileToCloudinary,
  type AssetPlacement,
  type UgcAdminAsset,
  type UgcAdminCategory,
  type UgcAdminConfig,
  type UgcAdminCollection,
} from '@/lib/ugcAdminApi'
import { useNavigate } from 'react-router-dom'

type UploadKind = 'photo' | 'video'

type UserState = {
  username?: string | null
  email?: string | null
  role?: {
    type?: string | null
    name?: string | null
  } | null
} | null

type AssetFormState = {
  kind: UploadKind
  title: string
  description: string
  hook: string
  goal: string
  style: string
  collectionId: string
  placement: string
}

const emptyAssetForm: AssetFormState = {
  kind: 'photo',
  title: '',
  description: '',
  hook: '',
  goal: '',
  style: '',
  collectionId: '',
  placement: '',
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

const sanitizeFolderSegment = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const buildUploadScope = (stage: string, collectionName?: string): string | undefined => {
  const stageSegment = sanitizeFolderSegment(stage)
  const collectionSegment = sanitizeFolderSegment(collectionName || '')
  const segments = [stageSegment, collectionSegment].filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return undefined
  }

  return segments.join('/')
}

const isBunnyAsset = (asset: UgcAdminAsset): boolean =>
  (asset.storageProvider || '').toLowerCase() === 'bunny' || Boolean(asset.bunny?.videoId)

export const InstagramPanel = () => {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserState>(null)
  const [config, setConfig] = useState<UgcAdminConfig | null>(null)
  const [categories, setCategories] = useState<UgcAdminCategory[]>([])
  const [collections, setCollections] = useState<UgcAdminCollection[]>([])
  const [assets, setAssets] = useState<UgcAdminAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false)
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [collectionName, setCollectionName] = useState('')
  const [collectionSlug, setCollectionSlug] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [assetForm, setAssetForm] = useState<AssetFormState>(emptyAssetForm)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [assetsTab, setAssetsTab] = useState<'highlights' | 'videos' | 'collections' | 'unassigned'>('highlights')

  const maxUploadMb = useMemo(() => config?.maxUploadMb ?? 1000, [config?.maxUploadMb])

  const highlightAssets = useMemo(
    () => assets.filter((a) => a.placement === 'highlight').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [assets],
  )
  const videoAssets = useMemo(
    () => assets.filter((a) => a.placement === 'video').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [assets],
  )
  const collectionAssets = useMemo(
    () => assets.filter((a) => !a.placement && a.collection),
    [assets],
  )
  const unassignedAssets = useMemo(
    () => assets.filter((a) => !a.placement && !a.collection),
    [assets],
  )

  useEffect(() => {
    const currentToken = getUgcAdminToken()
    if (!currentToken) {
      navigate('/admin/login', { replace: true })
      return
    }

    setToken(currentToken)
  }, [navigate])

  const loadData = async (activeToken: string): Promise<void> => {
    const [me, cfg, categoryRows, collectionRows, assetRows] = await Promise.all([
      getUgcAdminMe(activeToken),
      fetchUgcAdminConfig(),
      listUgcAdminCategories(activeToken),
      listUgcAdminCollections(activeToken),
      listUgcAdminAssets(activeToken),
    ])

    setUser(me)
    setConfig(cfg)
    setCategories(categoryRows)
    setCollections(collectionRows)
    setAssets(assetRows)
  }

  useEffect(() => {
    if (!token) {
      return
    }

    let mounted = true

    const run = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        await loadData(token)
      } catch (loadError) {
        if (!mounted) {
          return
        }

        const messageText =
          loadError instanceof Error && loadError.message
            ? loadError.message
            : 'Could not load admin dashboard.'
        setError(messageText)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void run()

    return () => {
      mounted = false
    }
  }, [token])

  const handleLogout = (): void => {
    clearUgcAdminToken()
    navigate('/admin/login', { replace: true })
  }

  const handleRefresh = async (): Promise<void> => {
    if (!token) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await loadData(token)
      setMessage('Dashboard data refreshed.')
    } catch (refreshError) {
      const messageText =
        refreshError instanceof Error && refreshError.message
          ? refreshError.message
          : 'Could not refresh dashboard.'
      setError(messageText)
    }
  }

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!token) {
      return
    }

    if (!categoryName.trim()) {
      setError('Category name is required.')
      return
    }

    setIsSubmittingCategory(true)
    setError(null)
    setMessage(null)

    try {
      await createUgcAdminCategory(token, {
        name: categoryName.trim(),
        slug: categorySlug.trim() || undefined,
      })
      setCategoryName('')
      setCategorySlug('')
      await loadData(token)
      setMessage('Category created.')
    } catch (createError) {
      const messageText =
        createError instanceof Error && createError.message
          ? createError.message
          : 'Could not create category.'
      setError(messageText)
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  const handleCreateCollection = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!token) {
      return
    }

    if (!collectionName.trim()) {
      setError('Collection name is required.')
      return
    }

    setIsSubmittingCollection(true)
    setError(null)
    setMessage(null)

    try {
      await createUgcAdminCollection(token, {
        name: collectionName.trim(),
        slug: collectionSlug.trim() || undefined,
        description: collectionDescription.trim() || undefined,
      })
      setCollectionName('')
      setCollectionSlug('')
      setCollectionDescription('')
      await loadData(token)
      setMessage('Collection created.')
    } catch (createError) {
      const messageText =
        createError instanceof Error && createError.message
          ? createError.message
          : 'Could not create collection.'
      setError(messageText)
    } finally {
      setIsSubmittingCollection(false)
    }
  }

  const handleCategoryToggle = (categoryId: number): void => {
    setSelectedCategoryIds((previous) =>
      previous.includes(categoryId)
        ? previous.filter((value) => value !== categoryId)
        : [...previous, categoryId],
    )
  }

  const handleCreateAsset = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!token) {
      return
    }

    if (!selectedFile) {
      setError('Select a file to upload.')
      return
    }

    if (!assetForm.title.trim()) {
      setError('Asset title is required.')
      return
    }

    setIsSubmittingAsset(true)
    setUploadProgress(assetForm.kind === 'video' ? 0 : null)
    setError(null)
    setMessage(assetForm.kind === 'video' ? 'Starting Bunny video upload...' : 'Preparing image upload...')

    try {
      const selectedCollection = collections.find(
        (collection) => String(collection.id) === assetForm.collectionId,
      )
      const uploadScope = buildUploadScope(
        env.uploadStage,
        selectedCollection?.slug || selectedCollection?.name || '',
      )

      if (assetForm.kind === 'video') {
        if (!config?.bunnyConfigured) {
          throw new Error(
            'Bunny Stream is not configured. Set BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_API_KEY in the backend.',
          )
        }

        const started = await createBunnyVideoUploadStart(token, {
          title: assetForm.title.trim(),
          filename: selectedFile.name,
          mimeType: selectedFile.type || undefined,
          size: selectedFile.size,
          collectionName: uploadScope,
        })

        await uploadFileToBunnyTus(selectedFile, started, (ratio) => {
          const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
          setUploadProgress(percent)
        })

        setMessage('Fetching Bunny playback data...')
        const bunnyPlayData = await getBunnyVideoPlayData(token, started.videoId)

        setMessage('Saving asset metadata to Strapi...')
        await createUgcAdminAsset(token, {
          title: assetForm.title.trim(),
          description: assetForm.description.trim() || undefined,
          hook: assetForm.hook.trim() || undefined,
          goal: assetForm.goal.trim() || undefined,
          style: assetForm.style.trim() || undefined,
          kind: 'video',
          storageProvider: 'bunny',
          placement: assetForm.placement || null,
          categoryIds: selectedCategoryIds,
          storage: {
            provider: 'bunny',
            libraryId: bunnyPlayData.libraryId || started.libraryId,
            videoId: bunnyPlayData.videoId || started.videoId,
            status: bunnyPlayData.status,
            encodeProgress: bunnyPlayData.encodeProgress,
            embedUrl: bunnyPlayData.embedUrl || started.embedUrl || undefined,
            playbackUrl: bunnyPlayData.playbackUrl || undefined,
            fallbackUrl: bunnyPlayData.fallbackUrl || undefined,
            thumbnailUrl: bunnyPlayData.thumbnailUrl || undefined,
            bytes: bunnyPlayData.bytes,
            duration: bunnyPlayData.duration,
            width: bunnyPlayData.width,
            height: bunnyPlayData.height,
            raw: bunnyPlayData.raw ?? bunnyPlayData,
          },
        })
      } else {
        setMessage('Uploading image to Cloudinary...')
        const signature = await createCloudinaryUploadSignature(token, {
          filename: selectedFile.name,
          kind: 'photo',
          collectionName: uploadScope,
        })

        const uploaded = await uploadFileToCloudinary(signature, selectedFile)

        setMessage('Saving asset metadata to Strapi...')
        await createUgcAdminAsset(token, {
          title: assetForm.title.trim(),
          description: assetForm.description.trim() || undefined,
          hook: assetForm.hook.trim() || undefined,
          goal: assetForm.goal.trim() || undefined,
          style: assetForm.style.trim() || undefined,
          kind: 'photo',
          storageProvider: 'cloudinary',
          placement: assetForm.placement || null,
          collectionId: assetForm.collectionId ? Number(assetForm.collectionId) : null,
          categoryIds: selectedCategoryIds,
          cloudinary: {
            provider: 'cloudinary',
            publicId: asString(uploaded.public_id),
            resourceType: asString(uploaded.resource_type || 'image'),
            deliveryType: asString(uploaded.type || 'upload'),
            version: uploaded.version,
            format: asString(uploaded.format),
            bytes: uploaded.bytes,
            width: uploaded.width,
            height: uploaded.height,
            duration: uploaded.duration,
            secureUrl: asString(uploaded.secure_url),
            raw: uploaded,
          },
        })
      }

      setAssetForm(emptyAssetForm)
      setSelectedCategoryIds([])
      setSelectedFile(null)
      setUploadProgress(assetForm.kind === 'video' ? 100 : null)
      await loadData(token)
      setMessage('Asset uploaded and metadata saved.')
    } catch (submitError) {
      const messageText =
        submitError instanceof Error && submitError.message
          ? submitError.message
          : 'Could not upload asset.'
      setError(messageText)
    } finally {
      setIsSubmittingAsset(false)
      setUploadProgress(null)
    }
  }

  const handleDeleteAsset = async (asset: UgcAdminAsset): Promise<void> => {
    if (!token) {
      return
    }

    const providerLabel = isBunnyAsset(asset) ? 'Bunny Stream' : 'Cloudinary'
    if (!window.confirm(`Delete this asset and remove it from ${providerLabel}?`)) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await deleteUgcAdminAsset(token, asset.id)
      await loadData(token)
      setMessage('Asset deleted.')
    } catch (deleteError) {
      const messageText =
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : 'Could not delete asset.'
      setError(messageText)
    }
  }

  const handleUpdatePlacement = async (asset: UgcAdminAsset, placement: AssetPlacement): Promise<void> => {
    if (!token) return
    setError(null)
    setMessage(null)
    try {
      await updateUgcAdminAsset(token, asset.id, { placement })
      await loadData(token)
      setMessage(`Placement updated for "${asset.title}".`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update placement.')
    }
  }

  const handleMoveUp = async (asset: UgcAdminAsset, list: UgcAdminAsset[]): Promise<void> => {
    if (!token) return
    const index = list.findIndex((a) => a.id === asset.id)
    if (index <= 0) return
    const reordered = [...list]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    const items = reordered.map((a, i) => ({ id: a.id, sortOrder: i }))
    setError(null)
    setMessage(null)
    try {
      await reorderUgcAdminAssets(token, items)
      await loadData(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder assets.')
    }
  }

  const handleMoveDown = async (asset: UgcAdminAsset, list: UgcAdminAsset[]): Promise<void> => {
    if (!token) return
    const index = list.findIndex((a) => a.id === asset.id)
    if (index < 0 || index >= list.length - 1) return
    const reordered = [...list]
    ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
    const items = reordered.map((a, i) => ({ id: a.id, sortOrder: i }))
    setError(null)
    setMessage(null)
    try {
      await reorderUgcAdminAssets(token, items)
      await loadData(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder assets.')
    }
  }

  const renderAssetCard = (asset: UgcAdminAsset, list: UgcAdminAsset[], showReorder: boolean) => {
    const bunnyAsset = isBunnyAsset(asset)
    const bunnyEmbedUrl = asset.bunny?.embedUrl || asset.secureUrl || ''
    const cloudinaryUrl = asset.cloudinary?.secureUrl || asset.secureUrl || ''
    const imageUrl = asset.cloudinary?.thumbnailUrl || asset.thumbnailUrl || cloudinaryUrl

    return (
      <article key={asset.id} className="overflow-hidden rounded-lg border border-border bg-background">
        {asset.kind === 'video' ? (
          bunnyAsset && bunnyEmbedUrl ? (
            <iframe
              src={bunnyEmbedUrl}
              title={asset.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-48 w-full border-0 bg-muted"
            />
          ) : (
            <video controls preload="metadata" src={cloudinaryUrl} className="h-48 w-full object-cover" />
          )
        ) : (
          <img src={imageUrl} alt={asset.title} className="h-48 w-full object-cover" />
        )}
        <div className="space-y-2 p-4">
          <h3 className="font-body text-sm font-semibold text-foreground">{asset.title}</h3>
          {asset.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{asset.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Provider: {bunnyAsset ? 'Bunny Stream' : 'Cloudinary'}
          </p>
          <p className="text-xs text-muted-foreground">
            Collection: {asset.collection?.name ?? 'None'}
          </p>
          <p className="text-xs text-muted-foreground">
            Categories:{' '}
            {asset.categories.length > 0
              ? asset.categories.map((c) => c.name).join(', ')
              : 'None'}
          </p>
          <div className="space-y-2 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Placement</label>
              <select
                value={asset.placement ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  void handleUpdatePlacement(asset, val === 'highlight' || val === 'video' ? val : null)
                }}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none transition focus:border-primary"
              >
                <option value="">Unassigned</option>
                <option value="highlight">Highlight</option>
                <option value="video">Cinematic Video</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {showReorder ? (
                <>
                  <button
                    onClick={() => void handleMoveUp(asset, list)}
                    disabled={list.indexOf(asset) === 0}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-border text-xs text-foreground transition hover:bg-muted disabled:opacity-30"
                    title="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    onClick={() => void handleMoveDown(asset, list)}
                    disabled={list.indexOf(asset) === list.length - 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-border text-xs text-foreground transition hover:bg-muted disabled:opacity-30"
                    title="Move down"
                  >
                    &darr;
                  </button>
                </>
              ) : null}
              <button
                onClick={() => void handleDeleteAsset(asset)}
                className="inline-flex h-7 items-center justify-center rounded-md border border-destructive/40 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-body text-sm text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="h-16" aria-hidden />

      <main className="container mx-auto px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="space-y-4 border-b border-border pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-body text-sm uppercase tracking-[0.24em] text-accent">
                  Private Workspace
                </p>
                <h1 className="font-display text-4xl italic leading-none text-foreground sm:text-5xl">
                  UGC Portfolio Admin
                </h1>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  Cloudinary image uploads + Bunny Stream video uploads with metadata-only persistence in Strapi.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleRefresh()}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-xs uppercase tracking-[0.16em] text-foreground transition hover:bg-muted"
                >
                  Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-foreground px-4 text-xs uppercase tracking-[0.16em] text-foreground transition hover:bg-foreground hover:text-background"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-card p-3">
                <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Logged in
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {user?.username || user?.email || 'Unknown user'}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Role
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {user?.role?.name || user?.role?.type || 'No role'}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Upload Limit (Info)
                </p>
                <p className="mt-1 text-sm text-foreground">{maxUploadMb} MB</p>
              </div>
            </div>

            {message ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </header>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-2xl italic text-foreground">Categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create categories to tag assets in the portfolio.
              </p>
              <form className="mt-4 space-y-3" onSubmit={(event) => void handleCreateCategory(event)}>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</label>
                  <input
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="Luxury Hotels"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Slug (optional)
                  </label>
                  <input
                    value={categorySlug}
                    onChange={(event) => setCategorySlug(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="luxury-hotels"
                  />
                </div>
                <button
                  disabled={isSubmittingCategory}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmittingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </form>
              <ul className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                  >
                    {category.name}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-2xl italic text-foreground">Collections</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Group assets into branded story collections.
              </p>
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => void handleCreateCollection(event)}
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</label>
                  <input
                    value={collectionName}
                    onChange={(event) => setCollectionName(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="My Summer Campaign"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Slug (optional)
                  </label>
                  <input
                    value={collectionSlug}
                    onChange={(event) => setCollectionSlug(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="my-summer-campaign"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Description (optional)
                  </label>
                  <textarea
                    value={collectionDescription}
                    onChange={(event) => setCollectionDescription(event.target.value)}
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="Story-driven travel collection with lifestyle hooks."
                  />
                </div>
                <button
                  disabled={isSubmittingCollection}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmittingCollection ? 'Creating...' : 'Create Collection'}
                </button>
              </form>
              <ul className="mt-4 flex flex-wrap gap-2">
                {collections.map((collection) => (
                  <li
                    key={collection.id}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                  >
                    {collection.name}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-3xl italic text-foreground">Upload Asset</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Photos upload to Cloudinary. Videos upload to Bunny Stream. Metadata is saved in Strapi.
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Upload stage folder: {env.uploadStage}
            </p>
            <form className="mt-4 grid gap-4" onSubmit={(event) => void handleCreateAsset(event)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">File</label>
                  <input
                    type="file"
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] ?? null)
                      setUploadProgress(null)
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Kind</label>
                  <select
                    value={assetForm.kind}
                    onChange={(event) => {
                      const nextKind = event.target.value as UploadKind
                      setAssetForm((previous) => ({
                        ...previous,
                        kind: nextKind,
                        collectionId: nextKind === 'video' ? '' : previous.collectionId,
                      }))
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Title</label>
                  <input
                    value={assetForm.title}
                    onChange={(event) =>
                      setAssetForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="Beachfront Hotel Reel"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Collection
                  </label>
                  <select
                    value={assetForm.collectionId}
                    onChange={(event) =>
                      setAssetForm((previous) => ({
                        ...previous,
                        collectionId: event.target.value,
                      }))
                    }
                    disabled={assetForm.kind === 'video'}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="">
                      {assetForm.kind === 'video' ? 'Videos cannot be in collections' : 'No collection'}
                    </option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={String(collection.id)}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Placement</label>
                <select
                  value={assetForm.placement}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, placement: event.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  <option value="highlight">Highlight</option>
                  <option value="video">Cinematic Video</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Hook</label>
                  <input
                    value={assetForm.hook}
                    onChange={(event) =>
                      setAssetForm((previous) => ({ ...previous, hook: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Goal</label>
                  <input
                    value={assetForm.goal}
                    onChange={(event) =>
                      setAssetForm((previous) => ({ ...previous, goal: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Style</label>
                  <input
                    value={assetForm.style}
                    onChange={(event) =>
                      setAssetForm((previous) => ({ ...previous, style: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={assetForm.description}
                  onChange={(event) =>
                    setAssetForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = selectedCategoryIds.includes(category.id)

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.id)}
                        className={
                          selected
                            ? 'rounded-full border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground'
                            : 'rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground'
                        }
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {isSubmittingAsset && uploadProgress !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <span>Upload progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 bg-muted" />
                </div>
              ) : null}

              <button
                disabled={isSubmittingAsset}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {isSubmittingAsset
                  ? 'Uploading...'
                  : assetForm.kind === 'video'
                    ? 'Upload Video to Bunny + Save Metadata'
                    : 'Upload Image to Cloudinary + Save Metadata'}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-3xl italic text-foreground">Assets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage uploaded portfolio media items.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3">
              {([
                ['highlights', 'Highlights', highlightAssets.length],
                ['videos', 'Cinematic Videos', videoAssets.length],
                ['collections', 'Collections', collectionAssets.length],
                ['unassigned', 'Unassigned', unassignedAssets.length],
              ] as const).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setAssetsTab(key)}
                  className={
                    assetsTab === key
                      ? 'rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                      : 'rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition hover:bg-muted'
                  }
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assetsTab === 'highlights' &&
                highlightAssets.map((asset) => renderAssetCard(asset, highlightAssets, true))}
              {assetsTab === 'videos' &&
                videoAssets.map((asset) => renderAssetCard(asset, videoAssets, true))}
              {assetsTab === 'collections' &&
                collectionAssets.map((asset) => renderAssetCard(asset, collectionAssets, false))}
              {assetsTab === 'unassigned' &&
                unassignedAssets.map((asset) => renderAssetCard(asset, unassignedAssets, false))}
            </div>

            {assetsTab === 'highlights' && highlightAssets.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">No assets assigned as highlights yet.</p>
            )}
            {assetsTab === 'videos' && videoAssets.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">No assets assigned as cinematic videos yet.</p>
            )}
            {assetsTab === 'collections' && collectionAssets.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">No assets in collections yet.</p>
            )}
            {assetsTab === 'unassigned' && unassignedAssets.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">All assets have been assigned.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
