// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env, type BackendMode } from '@/config/env'
import { fetchTestimonials, submitTestimonial } from '@/lib/api/testimonialsApi'

const originalEnv = {
  backendMode: env.backendMode,
  strapiBaseUrl: env.strapiBaseUrl,
  strapiToken: env.strapiToken,
  customApiBaseUrl: env.customApiBaseUrl,
  feedbackFormPath: env.feedbackFormPath,
  feedbackSubmitUrl: env.feedbackSubmitUrl,
  feedbackSubmitToken: env.feedbackSubmitToken,
}

const resetEnv = (): void => {
  env.backendMode = originalEnv.backendMode
  env.strapiBaseUrl = originalEnv.strapiBaseUrl
  env.strapiToken = originalEnv.strapiToken
  env.customApiBaseUrl = originalEnv.customApiBaseUrl
  env.feedbackFormPath = originalEnv.feedbackFormPath
  env.feedbackSubmitUrl = originalEnv.feedbackSubmitUrl
  env.feedbackSubmitToken = originalEnv.feedbackSubmitToken
}

describe('testimonialsApi', () => {
  beforeEach(() => {
    resetEnv()
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('stores feedback in localStorage in mock mode', async () => {
    env.backendMode = 'mock'

    await submitTestimonial({
      name: 'Alex Rider',
      role: 'Brand Manager',
      quote: 'Amazing work and clear communication from start to finish.',
    })

    const testimonials = await fetchTestimonials()

    expect(testimonials[0]?.name).toBe('Alex Rider')
    expect(testimonials[0]?.quote).toContain('Amazing work')
  })

  it('loads testimonials from the public Strapi endpoint', async () => {
    env.backendMode = 'strapi' as BackendMode
    env.strapiBaseUrl = 'https://cms.example.com'

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 7,
            name: 'Taylor Lee',
            role: 'Hotel Marketing Lead',
            quote: 'Fast turnaround and excellent creative direction.',
          },
        ],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const testimonials = await fetchTestimonials()

    expect(fetchMock).toHaveBeenCalledWith('https://cms.example.com/api/testimonial-feedback/public', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(testimonials).toHaveLength(1)
    expect(testimonials[0]?.name).toBe('Taylor Lee')
  })

  it('submits testimonials to the Strapi submit endpoint', async () => {
    env.backendMode = 'strapi'
    env.strapiBaseUrl = 'https://cms.example.com'

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { submitted: true } }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    await submitTestimonial({
      name: 'Jordan',
      role: 'Founder',
      quote: 'The campaign content helped us increase engagement this month.',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]

    expect(url).toBe('https://cms.example.com/api/testimonial-feedback/submit')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(
      JSON.stringify({
        data: {
          name: 'Jordan',
          role: 'Founder',
          quote: 'The campaign content helped us increase engagement this month.',
        },
      }),
    )
  })
})
