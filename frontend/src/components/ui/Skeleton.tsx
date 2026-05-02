interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/90 ${className}`}
      aria-hidden
    />
  )
}

export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === rows - 1 ? 'h-4 w-2/3' : 'h-4 w-full'}
        />
      ))}
    </div>
  )
}
