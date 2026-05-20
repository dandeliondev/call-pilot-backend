import type { ReactNode } from 'react'

interface LegacyCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  padding?: boolean
}

/**
 * Pre-shadcn card primitive. New screens should use the shadcn `card`
 * subcomponents instead. Migrate remaining call sites then delete this file.
 */
export function LegacyCard({
  title,
  description,
  children,
  className = '',
  padding = true,
}: LegacyCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-white shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-md)] ${padding ? 'p-5' : ''} ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-semibold tracking-tight text-text">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
