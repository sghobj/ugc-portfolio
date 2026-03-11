import { Outlet } from 'react-router-dom'
import { profile } from '@/content/profile'
import { navLinks } from '@/content/siteContent'

export const SiteLayout = () => {
  return (
    <div className="min-h-screen text-[var(--ink)]">
      <header className="nav-shell">
        <div className="layout-wrap flex flex-wrap items-center justify-between gap-4 py-5 md:py-6">
          <a href="#home" className="block">
            <p
              className="text-[1.75rem] leading-none tracking-[-0.01em] text-[var(--ink)] md:text-[2rem]"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
            >
              {profile.name}
            </p>
          </a>

          <nav className="flex flex-wrap items-center gap-5 md:gap-9">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="layout-wrap py-8 md:py-10">
        <Outlet />
      </main>

      <footer className="mt-14 border-t border-[var(--line)] py-5">
        <div className="layout-wrap flex flex-wrap items-center justify-between gap-2">
          <p className="mono text-[0.56rem] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {profile.role}
          </p>
        </div>
      </footer>
    </div>
  )
}
