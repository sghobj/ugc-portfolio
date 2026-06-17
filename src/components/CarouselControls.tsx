import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, MoveHorizontal } from 'lucide-react'
import { useCarousel } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

type Variant = 'light' | 'dark'

export function CarouselNav({
  className,
  variant = 'light',
}: {
  className?: string
  variant?: Variant
}) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
  if (!canScrollPrev && !canScrollNext) return null

  const isLight = variant === 'light'
  const btnBase =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40'
  const btnTheme = isLight
    ? 'border-accent bg-background/90 text-foreground hover:bg-accent hover:text-accent-foreground'
    : 'border-accent bg-primary-foreground/10 text-primary-foreground hover:bg-accent hover:text-accent-foreground'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        className={cn(btnBase, btnTheme)}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn(btnBase, btnTheme)}
        disabled={!canScrollNext}
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function CarouselProgress({
  total,
  className,
  variant = 'light',
}: {
  total: number
  className?: string
  variant?: Variant
}) {
  const { api } = useCarousel()
  const [shownCount, setShownCount] = useState(0)

  useEffect(() => {
    if (!api) return

    const updateShownCount = () => {
      const selectedSnap = api.selectedScrollSnap()
      const slideRegistry = api.internalEngine().slideRegistry
      const snapSlides = slideRegistry[selectedSnap] ?? []

      if (snapSlides.length > 0) {
        const maxSnapSlideIndex = Math.max(...snapSlides)
        setShownCount(Math.min(total, maxSnapSlideIndex + 1))
        return
      }

      const snapCount = api.scrollSnapList().length
      if (snapCount > 0) {
        const progressRatio = (selectedSnap + 1) / snapCount
        const fallbackShown = Math.max(1, Math.ceil(total * progressRatio))
        setShownCount(Math.min(total, fallbackShown))
        return
      }

      setShownCount(total > 0 ? 1 : 0)
    }

    updateShownCount()
    api.on('select', updateShownCount)
    api.on('reInit', updateShownCount)

    return () => {
      api.off('select', updateShownCount)
      api.off('reInit', updateShownCount)
    }
  }, [api, total])

  if (total <= 1) return null

  const toneClass =
    variant === 'light'
      ? 'text-muted-foreground border-border bg-background/75'
      : 'text-primary-foreground/75 border-primary-foreground/25 bg-primary-foreground/[0.08]'

  return (
    <p
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-1 font-body text-[0.52rem] uppercase tracking-[0.14em] sm:px-2.5 sm:text-[0.58rem] sm:tracking-[0.16em]',
        toneClass,
        className,
      )}
    >
      {shownCount}/{total}
    </p>
  )
}

export function MobileSwipeHint({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 font-body text-[0.56rem] uppercase tracking-[0.16em] sm:hidden',
        className,
      )}
    >
      <MoveHorizontal className="h-3.5 w-3.5" />
      Swipe for more
    </p>
  )
}
