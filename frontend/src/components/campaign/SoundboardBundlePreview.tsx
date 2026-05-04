import type { AgentSoundboardBundle, SoundboardPanel } from '../../types/app'

function SoundboardPanelCard({ panel }: { panel: SoundboardPanel }) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="shrink-0 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white">
        {panel.title}
      </div>
      <ul className="max-h-56 min-h-0 overflow-y-auto text-xs leading-snug">
        {panel.items.map((line) => (
          <li
            key={`${panel.id}-${line.shortcut}-${line.text.slice(0, 24)}`}
            className="flex gap-2 border-b border-border/60 px-2 py-1.5 last:border-0"
          >
            <span className="w-7 shrink-0 font-mono text-[10px] text-muted">{line.shortcut}</span>
            <span className="min-w-0 text-text">
              {line.text}
              {line.tag && (
                <span className="ml-1 text-[10px] text-violet-600">{line.tag}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SoundboardBundlePreview({ bundle }: { bundle: AgentSoundboardBundle }) {
  const rest: SoundboardPanel[] = [
    bundle.rebuttals,
    bundle.faqs,
    bundle.conversation,
    ...(bundle.closing ? [bundle.closing] : []),
    ...(bundle.dispositions ? [bundle.dispositions] : []),
    bundle.pageMessages,
    bundle.dtmf,
  ]
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <SoundboardPanelCard panel={bundle.intro} />
        <SoundboardPanelCard panel={bundle.pitch} />
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Supporting panels (demo copy — editable in campaign wizard)
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((p) => (
          <SoundboardPanelCard key={p.id} panel={p} />
        ))}
      </div>
    </div>
  )
}
