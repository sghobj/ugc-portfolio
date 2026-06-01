import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { SiteFooter } from '@/components/SiteFooter'
import { impressum } from '@/content/impressum'

const sectionClassName = 'border-t border-border/70 pt-8'
const headingClassName = 'font-display text-2xl font-light italic text-foreground sm:text-3xl'
const bodyClassName = 'mt-3 space-y-3 font-body text-sm leading-relaxed text-muted-foreground'

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24">
        <section className="pb-16 lg:pb-20">
          <div className="container mx-auto px-6 lg:px-16">
            <a
              href="/"
              className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to portfolio
            </a>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-10 max-w-3xl"
            >
              <p className="font-body text-sm uppercase tracking-[0.32em] text-accent">
                Datenschutz
              </p>
              <h1 className="mt-4 font-display text-5xl font-light leading-[0.95] text-foreground sm:text-6xl lg:text-7xl">
                Privacy Notice
              </h1>
              <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-muted-foreground">
                This notice explains how personal data is handled when you use this website or submit
                client feedback.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-14 max-w-3xl space-y-8"
            >
              <section className={sectionClassName}>
                <h2 className={headingClassName}>Controller</h2>
                <div className={bodyClassName}>
                  <p>{impressum.providerName}</p>
                  <p>{impressum.providerAddressLines.join(', ')}</p>
                  <a
                    href={`mailto:${impressum.contactEmail}`}
                    className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-accent"
                  >
                    <Mail className="h-4 w-4 text-accent" />
                    {impressum.contactEmail}
                  </a>
                </div>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Website Access</h2>
                <div className={bodyClassName}>
                  <p>
                    When this website is opened, technical access data may be processed by the hosting
                    provider, such as IP address, date and time, requested page, browser information,
                    referrer URL, and server log data.
                  </p>
                  <p>
                    This is used to provide the website, keep it secure, and diagnose technical issues.
                    The legal basis is legitimate interest in operating a secure website, Art. 6(1)(f)
                    GDPR.
                  </p>
                </div>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Feedback And Testimonials</h2>
                <div className={bodyClassName}>
                  <p>
                    If you submit the feedback form, the submitted name, optional role or brand,
                    testimonial text, and related technical submission data are processed to review and
                    manage your feedback.
                  </p>
                  <p>
                    Testimonials are reviewed before publication. Your name, optional role or brand, and
                    testimonial text are only published if you give publication consent in the form. You
                    can withdraw this consent at any time by contacting the email address above.
                  </p>
                  <p>
                    The legal basis for publishing a testimonial is consent, Art. 6(1)(a) GDPR. Feedback
                    that relates to a collaboration may also be processed for contract-related handling or
                    legitimate business documentation, Art. 6(1)(b) or Art. 6(1)(f) GDPR.
                  </p>
                </div>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Processors And Recipients</h2>
                <div className={bodyClassName}>
                  <p>
                    Personal data may be processed by service providers needed to run this website,
                    including hosting, backend, CMS, and technical infrastructure providers. Data is not
                    sold.
                  </p>
                  <p>
                    Published testimonials are visible to visitors of this website until removed.
                  </p>
                </div>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Storage Period</h2>
                <div className={bodyClassName}>
                  <p>
                    Feedback submissions are kept only as long as needed for review, publication, business
                    documentation, or legal obligations. Published testimonials remain online until they
                    are withdrawn, removed, or no longer relevant.
                  </p>
                </div>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Cookies And Similar Technologies</h2>
                <div className={bodyClassName}>
                  <p>
                    This website does not intentionally use analytics or marketing cookies. If optional
                    tracking or marketing tools are added later, they should only run after valid consent.
                  </p>
                  <p>
                    Technically necessary storage may be used when required to provide requested website
                    functionality.
                  </p>
                </div>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Your Rights</h2>
                <div className={bodyClassName}>
                  <p>
                    You can request access, correction, deletion, restriction, portability, or object to
                    certain processing where the legal requirements are met. If processing is based on
                    consent, you can withdraw that consent at any time for the future.
                  </p>
                  <p>
                    You also have the right to lodge a complaint with a competent data protection
                    supervisory authority.
                  </p>
                </div>
              </section>

              <p className="border-t border-border/70 pt-6 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Last updated: June 1, 2026
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default PrivacyPage
