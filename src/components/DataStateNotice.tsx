type DataStateNoticeProps = {
  message: string
  tone?: 'neutral' | 'error'
}

export const DataStateNotice = ({
  message,
  tone = 'neutral',
}: DataStateNoticeProps) => {
  return (
    <div
      className={`border-b py-3 text-sm ${
        tone === 'error' ? 'border-red-300 text-red-700' : 'border-[var(--line)] text-[var(--ink-muted)]'
      }`}
    >
      {message}
    </div>
  )
}
