// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { impressum } from '@/content/impressum'
import PrivacyPage from './Privacy'

describe('PrivacyPage', () => {
  it('renders the feedback privacy notice and controller contact', () => {
    render(<PrivacyPage />)

    expect(screen.getByRole('heading', { name: 'Privacy Notice' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Feedback And Testimonials' })).toBeInTheDocument()
    expect(screen.getByText(impressum.providerName)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: impressum.contactEmail })).toHaveAttribute(
      'href',
      `mailto:${impressum.contactEmail}`,
    )
    expect(screen.getByText(/does not intentionally use analytics or marketing cookies/i)).toBeInTheDocument()
  })
})
