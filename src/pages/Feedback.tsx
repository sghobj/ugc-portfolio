import { useState, type FormEvent } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { submitTestimonial } from '@/lib/api/testimonialsApi'
import { brand } from '@/content/brand'
import { SiteFooter } from '@/components/SiteFooter'

type FeedbackFormState = {
  name: string
  role: string
  quote: string
  publicationConsent: boolean
}

const emptyFormState: FeedbackFormState = {
  name: '',
  role: '',
  quote: '',
  publicationConsent: false,
}

const FeedbackPage = () => {
  const [form, setForm] = useState<FeedbackFormState>(emptyFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!form.publicationConsent) {
      setErrorMessage('Please confirm publication consent before submitting your feedback.')
      setIsSubmitting(false)
      return
    }

    try {
      await submitTestimonial({
        name: form.name,
        role: form.role,
        quote: form.quote,
      })
      setForm(emptyFormState)
      setSuccessMessage('Thanks. Your feedback was submitted successfully.')
    } catch (submitError) {
      setErrorMessage(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : 'Could not submit feedback. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <div className="container mx-auto px-6 py-10 lg:max-w-3xl lg:px-16 lg:py-16">
          <a
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </a>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="border border-border bg-card p-6 shadow-sm lg:p-8"
          >
            <div className="mb-5 flex justify-center">
              <img
                src={brand.logoUrl}
                alt={brand.logoAlt}
                className="h-20 w-20 rounded-full border border-border object-cover sm:h-24 sm:w-24"
                loading="lazy"
              />
            </div>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-accent">Client Feedback</p>
            <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">Share your experience</h1>
            <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
              Thank you for collaborating with me. Your testimonial helps future clients understand how
              we can work together.
            </p>

            <form className="mt-8 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <label className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  required
                  maxLength={90}
                  className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground" htmlFor="role">
                  Role / Brand (optional)
                </label>
                <input
                  id="role"
                  value={form.role}
                  onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value }))}
                  maxLength={120}
                  className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="Marketing Manager, Hotel Name"
                />
              </div>

              <div className="space-y-2">
                <label className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground" htmlFor="quote">
                  Feedback
                </label>
                <textarea
                  id="quote"
                  value={form.quote}
                  onChange={(event) => setForm((previous) => ({ ...previous, quote: event.target.value }))}
                  required
                  minLength={20}
                  maxLength={1200}
                  className="min-h-36 w-full rounded-none border border-input bg-background px-3 py-2 font-body text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="Share a few lines about your experience and results."
                />
              </div>

              <div className="space-y-2 border border-border bg-background/60 p-3">
                <label className="flex items-start gap-3 font-body text-sm leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.publicationConsent}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        publicationConsent: event.target.checked,
                      }))
                    }
                    required
                    className="mt-1 h-4 w-4 shrink-0 accent-foreground"
                  />
                  <span>
                    I agree that my name, optional role / brand, and testimonial may be published on
                    this website after review. I can withdraw this consent at any time.
                  </span>
                </label>
                <p className="font-body text-xs leading-relaxed text-muted-foreground">
                  Details about data processing are available in the{' '}
                  <a href="/datenschutz" className="text-foreground underline underline-offset-4 hover:text-accent">
                    Privacy Notice
                  </a>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-foreground px-6 py-3 font-body text-xs uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Submit feedback'}
              </button>
            </form>

            {successMessage ? (
              <p className="mt-5 border border-emerald-200 bg-emerald-50 px-3 py-2 font-body text-sm text-emerald-800">
                {successMessage} After review, it can be published in the testimonials section.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-5 border border-destructive/30 bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </motion.section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default FeedbackPage
