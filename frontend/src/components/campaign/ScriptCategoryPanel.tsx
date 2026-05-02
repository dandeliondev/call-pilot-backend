import { useState } from 'react'
import type { ScriptCategory } from '../../mock/ai'

interface ScriptCategoryPanelProps {
  category: ScriptCategory
  defaultOpen?: boolean
  className?: string
}

export function ScriptCategoryPanel({
  category,
  defaultOpen = true,
  className = '',
}: ScriptCategoryPanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const isDtmf = category.id === 'dtmf'

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-[var(--shadow-card)] ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-primary px-3 py-2 text-left text-sm font-semibold text-white"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-white/90" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
          <span className="truncate">{category.title}</span>
        </span>
      </button>
      {open && (
        <ul className="max-h-[min(440px,55vh)] overflow-y-auto p-0 text-sm">
          {category.items.map((line, idx) => (
            <li
              key={`${category.id}-${line.shortcut}-${idx}`}
              className="flex gap-2 border-b border-slate-100 px-2 py-1.5 last:border-0 hover:bg-slate-50/90"
            >
              <span className="w-9 shrink-0 font-mono text-xs font-semibold tabular-nums text-primary">
                {line.shortcut}
              </span>
              <span className="min-w-0 flex-1 leading-snug text-text">
                <span className="text-primary">:</span>{' '}
                {line.text}
                {line.tag && (
                  <span className="ml-1 font-mono text-xs text-muted">{line.tag}</span>
                )}
              </span>
              {isDtmf ? (
                <span className="mt-0.5 shrink-0 text-primary" aria-hidden title="DTMF">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
              ) : (
                <span
                  className="mt-0.5 h-3.5 w-3 shrink-0 rounded-sm border border-amber-300 bg-amber-50"
                  aria-hidden
                  title="Snippet"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
