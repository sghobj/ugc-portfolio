type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) => {
  return (
    <div className="space-y-3.5">
      {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
      <h2 className="page-title">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)] md:text-[0.99rem]">
          {description}
        </p>
      ) : null}
    </div>
  )
}
