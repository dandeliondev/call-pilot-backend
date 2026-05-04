interface PeakCallingHeatmapProps {
  hourLabels: readonly string[]
  dayLabels: readonly string[]
  values: readonly (readonly number[])[]
}

function cellStyle(value: number) {
  const t = Math.min(100, Math.max(0, value)) / 100
  const alpha = 0.1 + t * 0.85
  return { backgroundColor: `rgba(59, 130, 246, ${alpha})` }
}

export function PeakCallingHeatmap({
  hourLabels,
  dayLabels,
  values,
}: PeakCallingHeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full flex-col gap-0.5 text-[11px]">
        <div className="flex gap-0.5">
          <div className="w-10 shrink-0" aria-hidden />
          {dayLabels.map((d) => (
            <div
              key={d}
              className="min-w-[1.75rem] flex-1 text-center font-medium text-muted"
            >
              {d}
            </div>
          ))}
        </div>
        {hourLabels.map((h, hi) => (
          <div key={h} className="flex gap-0.5">
            <div className="w-10 shrink-0 text-right text-muted">{h}</div>
            {dayLabels.map((d, di) => {
              const v = values[hi]?.[di] ?? 0
              return (
                <div
                  key={`${h}-${d}`}
                  title={`${d} ${h}: relative performance ${v}`}
                  className="min-h-[22px] min-w-[1.75rem] flex-1 rounded-sm border border-white/60"
                  style={cellStyle(v)}
                  aria-label={`${d} ${h}, intensity ${v} of 100`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
        <span>Lower</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          {[12, 28, 44, 60, 76, 92].map((v, i) => (
            <div
              key={i}
              className="flex-1 border-r border-white/80 last:border-0"
              style={cellStyle(v)}
            />
          ))}
        </div>
        <span>Higher</span>
      </div>
    </div>
  )
}
