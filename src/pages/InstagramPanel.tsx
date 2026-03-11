import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { clearInstagramPanelToken } from '@/lib/instagramPanelAuth'

type TaskItem = {
  task: string
  detail: string
}

type PhaseItem = {
  id: number
  label: string
  title: string
  timeline: string
  goal: string
  tasks: TaskItem[]
}

type MetricItem = {
  label: string
  target: string
  why: string
}

type BrandItem = {
  category: string
  examples: string
  approach: string
}

const panelData: {
  phases: PhaseItem[]
  metrics: MetricItem[]
  brands: BrandItem[]
} = {
  phases: [
    {
      id: 1,
      label: 'Phase 1',
      title: 'Foundation',
      timeline: 'Now -> Month 2',
      goal: 'Build a brandable profile that makes your value clear in seconds.',
      tasks: [
        {
          task: 'Craft a keyword-rich bio',
          detail:
            "Example: Luxury travel and city culture | Experiences worth your passport stamp | UGC and collabs",
        },
        {
          task: 'Set a consistent aesthetic',
          detail:
            'Choose 2-3 warm or cinematic tones and keep every post visually aligned.',
        },
        {
          task: 'Shoot 9-12 portfolio posts',
          detail:
            'Create sample work even before brand deals: hotel lobbies, cafes, skylines, car visuals.',
        },
        {
          task: 'Create a basic media kit',
          detail:
            'One page with your niche, audience, style, and content offers.',
        },
        {
          task: 'Post consistently 4-5 times per week',
          detail:
            'Use 3 Reels and 2 carousels minimum to balance reach and saves.',
        },
      ],
    },
    {
      id: 2,
      label: 'Phase 2',
      title: 'Growth Engine',
      timeline: 'Month 2 -> Month 4',
      goal: 'Grow to 1K-3K followers through strong discoverability and daily community activity.',
      tasks: [
        {
          task: 'Use SEO-style captions',
          detail:
            "Include searchable phrases like 'best rooftop in Lisbon' or 'luxury hotel review Rome'.",
        },
        {
          task: 'Apply a structured hashtag mix',
          detail:
            'Use 5 niche, 5 medium, and 3 broad hashtags. Keep total around 15.',
        },
        {
          task: 'Collaborate with micro creators',
          detail:
            'Partner with creators in adjacent niches and similar audience size.',
        },
        {
          task: 'Do daily engagement sessions',
          detail:
            'Spend 30 minutes commenting on relevant creator and brand posts.',
        },
        {
          task: 'Pitch 5-10 local brands',
          detail:
            'Offer value-first UGC packages for boutique hotels, rentals, and tourism brands.',
        },
      ],
    },
    {
      id: 3,
      label: 'Phase 3',
      title: 'UGC Launch',
      timeline: 'Month 3 -> Month 5',
      goal: 'Secure your first paid or gifted UGC deals and build a conversion-ready portfolio.',
      tasks: [
        {
          task: 'Build your UGC portfolio page',
          detail:
            'Show your strongest 6-9 content pieces and clear offer packages.',
        },
        {
          task: 'Start cold outreach',
          detail:
            'Send personalized DM or email pitches to marketing teams.',
        },
        {
          task: 'Join UGC platforms',
          detail:
            'Create profiles on creator marketplaces to access paid briefs.',
        },
        {
          task: 'Publish ad-style sample content',
          detail:
            'Post content that already looks campaign-ready even before paid deals.',
        },
        {
          task: 'Set starter rates',
          detail:
            'Establish base UGC rates and separate usage or posting fees.',
        },
      ],
    },
    {
      id: 4,
      label: 'Phase 4',
      title: 'Scale and Brand',
      timeline: 'Month 5+',
      goal: 'Move into repeat retainers and stronger brand authority with consistent case studies.',
      tasks: [
        {
          task: 'Pitch larger brands with proof',
          detail:
            'Use view, reach, and engagement wins from early projects as social proof.',
        },
        {
          task: 'Launch a repeatable content series',
          detail:
            'A recurring format improves retention and increases pitchability.',
        },
        {
          task: 'Apply for hosted stays and press trips',
          detail:
            'Target tourism boards and destination campaigns with portfolio examples.',
        },
        {
          task: 'Repurpose to TikTok',
          detail:
            'Dual-platform content increases deal value for brands.',
        },
        {
          task: 'Increase rates and offer retainers',
          detail:
            'Shift to monthly packages with clear deliverables and reporting.',
        },
      ],
    },
  ],
  metrics: [
    {
      label: 'Follower Growth Rate',
      target: '>5% monthly',
      why: 'Signals healthy account momentum.',
    },
    {
      label: 'Engagement Rate',
      target: '>3-5%',
      why: 'Brands prioritize this over follower count alone.',
    },
    {
      label: 'Reel Reach',
      target: '2-5x follower count',
      why: 'Shows discovery beyond your existing audience.',
    },
    {
      label: 'Saves per Post',
      target: '>1% of reach',
      why: 'Saves are a strong quality signal to the algorithm.',
    },
    {
      label: 'Profile Visits from Posts',
      target: 'Track weekly',
      why: 'Measures content-to-interest conversion.',
    },
    {
      label: 'Link-in-Bio Clicks',
      target: 'Track weekly',
      why: 'Useful in brand pitch decks and case studies.',
    },
  ],
  brands: [
    {
      category: 'Hotels and Stays',
      examples: 'Marriott Bonvoy, boutique hotels, Airbnb Luxe',
      approach:
        'Tag properties consistently, then outreach with a campaign-style sample reel concept.',
    },
    {
      category: 'Airlines and Airports',
      examples: 'Regional carriers, premium lounges, route campaigns',
      approach:
        'Publish aspirational transit stories and tag airline plus airport profiles together.',
    },
    {
      category: 'Car and Rental Brands',
      examples: 'Hertz, Sixt, Turo, premium local agencies',
      approach:
        'Pitch destination plus vehicle storytelling with clear lifestyle framing.',
    },
    {
      category: 'City Tourism Boards',
      examples: 'Visit Dubai, Visit Portugal, NYC Tourism',
      approach:
        'Use board campaign tags and submit creator applications with your portfolio.',
    },
    {
      category: 'Travel Accessories',
      examples: 'Luggage, carry tech, travel utility products',
      approach:
        'Offer practical product demos mixed with destination storytelling.',
    },
  ],
}

const TAB_ROADMAP = 'roadmap'
const TAB_METRICS = 'metrics'
const TAB_BRANDS = 'brands'

const panelTabs = [
  { id: TAB_ROADMAP, label: 'Growth Roadmap' },
  { id: TAB_METRICS, label: 'Key Metrics' },
  { id: TAB_BRANDS, label: 'Brand Targets' },
] as const

type PanelTab = (typeof panelTabs)[number]['id']
type CheckedTaskMap = Record<string, boolean>

type PhaseTheme = {
  badgeBg: string
  badgeText: string
  border: string
  progress: string
  soft: string
}

const phaseThemes: Record<number, PhaseTheme> = {
  1: {
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    border: 'border-amber-200',
    progress: 'bg-amber-500',
    soft: 'bg-amber-50',
  },
  2: {
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700',
    border: 'border-sky-200',
    progress: 'bg-sky-500',
    soft: 'bg-sky-50',
  },
  3: {
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-200',
    progress: 'bg-emerald-500',
    soft: 'bg-emerald-50',
  },
  4: {
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    border: 'border-rose-200',
    progress: 'bg-rose-500',
    soft: 'bg-rose-50',
  },
}

const getPhaseTheme = (phaseId: number): PhaseTheme => phaseThemes[phaseId] ?? phaseThemes[1]

const getTaskKey = (phaseId: number, index: number): string => `${phaseId}-${index}`

export const InstagramPanel = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<PanelTab>(TAB_ROADMAP)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1)
  const [checkedTasks, setCheckedTasks] = useState<CheckedTaskMap>({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const toggleTask = (phaseId: number, index: number): void => {
    const taskKey = getTaskKey(phaseId, index)
    setCheckedTasks((previous) => ({ ...previous, [taskKey]: !previous[taskKey] }))
  }

  const getPhaseProgress = (phase: PhaseItem): number => {
    const doneCount = phase.tasks.reduce((count, _, index) => {
      const taskKey = getTaskKey(phase.id, index)
      return checkedTasks[taskKey] ? count + 1 : count
    }, 0)

    return Math.round((doneCount / phase.tasks.length) * 100)
  }

  const handleLogout = (): void => {
    clearInstagramPanelToken()
    navigate('/instagram-login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="h-16" aria-hidden />

      <main className="container mx-auto px-6 py-12 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-6 border-b border-border pb-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="space-y-3">
                <p className="font-body text-sm uppercase tracking-[0.3em] text-accent">
                  Private Workspace
                </p>
                <h1 className="font-display text-5xl font-light italic leading-[0.95] text-foreground sm:text-6xl">
                  Instagram Growth Panel
                </h1>
                <p className="max-w-3xl font-body text-base leading-relaxed text-muted-foreground">
                  Keep this page private. It tracks your roadmap, key metrics, and brand targeting
                  in the same design system as your portfolio.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-block border border-foreground px-8 py-4 font-body text-sm uppercase tracking-wider text-foreground transition-all hover:bg-foreground hover:text-background"
              >
                Sign Out
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Current', value: 'Under 1K' },
                { label: 'Phase 1 Target', value: '1K followers' },
                { label: 'First Deal Target', value: 'Month 3-5' },
                { label: 'Niche', value: 'Luxury + Culture' },
              ].map((item) => (
                <div key={item.label} className="border border-border bg-card/60 p-3">
                  <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 font-body text-sm text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </header>

          <nav className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
            {panelTabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    isActive
                      ? 'border border-foreground bg-foreground px-5 py-3 font-body text-xs uppercase tracking-[0.2em] text-background'
                      : 'border border-border bg-background px-5 py-3 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground'
                  }
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {activeTab === TAB_ROADMAP ? (
            <section className="space-y-4">
              <p className="font-body text-sm text-muted-foreground">
                Open each phase and mark tasks complete to track your progress.
              </p>

              {panelData.phases.map((phase) => {
                const theme = getPhaseTheme(phase.id)
                const isExpanded = expandedPhase === phase.id
                const progress = getPhaseProgress(phase)

                return (
                  <article
                    key={phase.id}
                    className={`border bg-card/50 transition-all duration-300 hover:-translate-y-0.5 ${isExpanded ? theme.border : 'border-border'}`}
                  >
                    <button
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center border font-body text-sm font-semibold ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}
                      >
                        {phase.id}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {phase.label}
                        </p>
                        <h2 className="mt-1 font-display text-2xl italic leading-none sm:text-3xl">
                          {phase.title}
                        </h2>
                        <p className="mt-2 font-body text-sm text-muted-foreground">{phase.timeline}</p>
                      </div>

                      <div className="hidden w-32 shrink-0 sm:block">
                        <div className="h-1 w-full bg-muted">
                          <div
                            className={`h-full ${theme.progress}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-right font-body text-xs text-muted-foreground">
                          {progress}%
                        </p>
                      </div>

                      <span className="font-body text-lg text-muted-foreground">
                        {isExpanded ? '-' : '+'}
                      </span>
                    </button>

                    {isExpanded ? (
                      <div className="space-y-4 border-t border-border px-5 py-5">
                        <div className={`border p-4 ${theme.soft} ${theme.border}`}>
                          <p className="font-body text-sm text-foreground">{phase.goal}</p>
                        </div>

                        <div className="space-y-2">
                          {phase.tasks.map((task, index) => {
                            const taskKey = getTaskKey(phase.id, index)
                            const isDone = Boolean(checkedTasks[taskKey])

                            return (
                              <button
                                key={taskKey}
                                onClick={() => toggleTask(phase.id, index)}
                                className={`w-full border p-4 text-left transition-colors ${
                                  isDone
                                    ? `${theme.soft} ${theme.border}`
                                    : 'border-border bg-background hover:bg-muted/40'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[11px] ${
                                      isDone
                                        ? `${theme.progress} ${theme.border} text-white`
                                        : 'border-border text-transparent'
                                    }`}
                                  >
                                    V
                                  </span>
                                  <span className="space-y-1">
                                    <span
                                      className={`block font-body text-sm ${
                                        isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                                      }`}
                                    >
                                      {task.task}
                                    </span>
                                    <span className="block font-body text-sm text-muted-foreground">
                                      {task.detail}
                                    </span>
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </section>
          ) : null}

          {activeTab === TAB_METRICS ? (
            <section className="space-y-5">
              <p className="font-body text-sm text-muted-foreground">
                Track these weekly inside Instagram Insights. They matter more than follower count
                alone when pitching brands.
              </p>

              <div className="grid gap-3">
                {panelData.metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="grid gap-4 border border-border bg-card/50 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <h2 className="font-body text-base text-foreground">{metric.label}</h2>
                      <p className="mt-1 font-body text-sm text-muted-foreground">{metric.why}</p>
                    </div>
                    <p className="border border-border bg-background px-3 py-2 text-center font-body text-xs uppercase tracking-[0.16em] text-foreground">
                      {metric.target}
                    </p>
                  </article>
                ))}
              </div>

              <article className="border border-border bg-muted/35 p-4">
                <h3 className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Where to find insights
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-foreground">
                  Profile to Professional Dashboard to Insights. Check each post using the "View
                  Insights" action and track your weekly trend.
                </p>
              </article>
            </section>
          ) : null}

          {activeTab === TAB_BRANDS ? (
            <section className="space-y-5">
              <p className="font-body text-sm text-muted-foreground">
                Target brands by category and pitch content concepts, not generic collaboration
                requests.
              </p>

              <div className="grid gap-3">
                {panelData.brands.map((brand, index) => {
                  const accentClass =
                    index % 4 === 0
                      ? 'border-l-amber-500'
                      : index % 4 === 1
                        ? 'border-l-sky-500'
                        : index % 4 === 2
                          ? 'border-l-emerald-500'
                          : 'border-l-rose-500'

                  return (
                    <article
                      key={brand.category}
                      className={`border border-border border-l-4 bg-card/50 p-4 ${accentClass}`}
                    >
                      <h2 className="font-body text-base text-foreground">{brand.category}</h2>
                      <p className="mt-2 font-body text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Examples:</span> {brand.examples}
                      </p>
                      <p className="mt-2 font-body text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Approach:</span> {brand.approach}
                      </p>
                    </article>
                  )
                })}
              </div>

              <article className="border border-border bg-muted/35 p-4">
                <h3 className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Pitch prompt
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-foreground">
                  "Hi [Brand], I create luxury travel and city culture content. I would like to
                  produce a [specific deliverable] for [campaign or destination]. Portfolio: [link].
                  I focus on cinematic, conversion-ready UGC for short-form platforms."
                </p>
              </article>
            </section>
          ) : null}
        </div>
      </main>

      <footer className="py-6 text-center font-body text-xs tracking-wider text-muted-foreground">
        (c) 2026 Sarah Ghobj. All rights reserved.
      </footer>
    </div>
  )
}
