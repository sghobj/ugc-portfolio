// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FeedbackPage from './Feedback'

describe('FeedbackPage', () => {
  it('requires publication consent and links to the privacy notice', () => {
    render(<FeedbackPage />)

    const consentCheckbox = screen.getByRole('checkbox', {
      name: /testimonial may be published on this website/i,
    })

    expect(consentCheckbox).toBeRequired()
    expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute(
      'href',
      '/datenschutz',
    )
  })
})
