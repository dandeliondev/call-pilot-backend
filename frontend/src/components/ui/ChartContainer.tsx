import type { ReactNode } from 'react'

interface ChartContainerProps {
  title?: string
  description?: string
  height: number
  children: ReactNode
}

export function ChartContainer({
  title,
  description,
  height,
  children,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-semibold text-text">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
      )}
      <div style={{ height }}>{children}</div>
    </div>
  )
}
