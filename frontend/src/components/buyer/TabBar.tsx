type Tab<T extends string> = { id: T; label: string; count?: number }

/* Pill tabs for the buyer pages. On a phone the row scrolls sideways instead of wrapping. */
export default function TabBar<T extends string>({ tabs, value, onChange, label }: {
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((x) => (
        <button
          key={x.id}
          type="button"
          role="tab"
          aria-selected={value === x.id}
          onClick={(e) => {
            onChange(x.id)
            e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
          }}
          className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
            value === x.id ? 'border-teal bg-teal text-on-accent' : 'border-line bg-card/80 text-navy hover:bg-seafoam'
          }`}
        >
          {x.label}{x.count !== undefined ? ` (${x.count})` : ''}
        </button>
      ))}
    </div>
  )
}