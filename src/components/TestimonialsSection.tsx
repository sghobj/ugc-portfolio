import { motion } from 'framer-motion'
import { MessageSquareQuote } from 'lucide-react'
import type { Testimonial } from '@/types/portfolio'

type TestimonialsSectionProps = {
  testimonials: Testimonial[]
  isLoading?: boolean
  error?: string | null
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const TestimonialsSection = ({
  testimonials,
  isLoading = false,
  error = null,
}: TestimonialsSectionProps) => {
  return (
    <section id="testimonials" className="bg-secondary/30 py-16 lg:py-20">
      <div className="container mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center"
        >
          <p className="mb-3 font-body text-sm uppercase tracking-[0.3em] text-accent">Testimonials</p>
          <h2 className="font-display text-4xl font-light italic text-foreground sm:text-5xl">
            What clients said
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            Trusted feedback from recent travel and UGC collaborations.
          </p>
        </motion.div>

        {isLoading && testimonials.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center" aria-live="polite">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
              role="status"
              aria-label="Loading testimonials"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
            {testimonials.map((testimonial, index) => (
              <motion.article
                key={testimonial.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="h-full border border-border bg-background p-5 lg:p-6"
              >
                <MessageSquareQuote className="mb-4 h-6 w-6 text-accent" strokeWidth={1.5} />
                <p className="font-body text-sm leading-relaxed text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-border/70 pt-4">
                  {testimonial.avatar?.url ? (
                    <img
                      src={testimonial.avatar.url}
                      alt={testimonial.avatar.alt || testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-body text-xs uppercase text-foreground">
                      {getInitials(testimonial.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-body text-sm text-foreground">{testimonial.name}</p>
                    {testimonial.role ? (
                      <p className="font-body text-xs text-muted-foreground">{testimonial.role}</p>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {error ? <p className="mt-3 font-body text-xs text-muted-foreground">{error}</p> : null}
      </div>
    </section>
  )
}

export default TestimonialsSection
