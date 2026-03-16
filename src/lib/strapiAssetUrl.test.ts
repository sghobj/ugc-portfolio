import { describe, expect, it } from 'vitest'
import { resolveStrapiAssetUrl } from '@/lib/strapiAssetUrl'

describe('resolveStrapiAssetUrl', () => {
  it('prefixes a relative path with the configured Strapi base URL', () => {
    expect(resolveStrapiAssetUrl('/api/media-proxy/token', 'https://cms.example.com')).toBe(
      'https://cms.example.com/api/media-proxy/token',
    )
  })

  it('rewrites loopback absolute URLs to the configured deployed base URL', () => {
    expect(
      resolveStrapiAssetUrl(
        'http://localhost:1337/api/media-proxy/token?foo=bar',
        'https://cms.example.com',
      ),
    ).toBe('https://cms.example.com/api/media-proxy/token?foo=bar')
  })

  it('keeps external absolute URLs unchanged', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1/example.jpg'

    expect(resolveStrapiAssetUrl(cloudinaryUrl, 'https://cms.example.com')).toBe(cloudinaryUrl)
  })

  it('keeps loopback absolute URLs unchanged when base URL is also loopback', () => {
    const loopbackUrl = 'http://127.0.0.1:1337/api/media-proxy/token'

    expect(resolveStrapiAssetUrl(loopbackUrl, 'http://localhost:1337')).toBe(loopbackUrl)
  })

  it('returns the original value when base URL is missing', () => {
    expect(resolveStrapiAssetUrl('/api/media-proxy/token', '')).toBe('/api/media-proxy/token')
  })
})
