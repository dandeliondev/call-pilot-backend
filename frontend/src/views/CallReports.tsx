import { useEffect, useRef, useState } from 'react'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { SkeletonLines } from '../components/ui/Skeleton'
import { Card } from '../components/ui/Card'
import { evaluateCall, type EvaluationResult } from '../mock/ai'
import { callReports } from '../mock/data'
import type { CallReportRow } from '../types/app'

function AudioPlayerMock() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 2))
    }, 120)
    return () => window.clearInterval(id)
  }, [playing])

  return (
    <div className="rounded-xl border border-border bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform hover:scale-105"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 pl-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Recording (simulated)</span>
            <span>8:42</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        No audio file in this demo — progress animates when play is pressed.
      </p>
    </div>
  )
}

export function CallReports() {
  const [selected, setSelected] = useState<CallReportRow | null>(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const fetchSeq = useRef(0)

  function openReport(row: CallReportRow) {
    const seq = ++fetchSeq.current
    setSelected(row)
    setEvaluation(null)
    setEvalLoading(true)
    evaluateCall(row.id).then((r) => {
      if (seq !== fetchSeq.current) return
      setEvaluation(r)
      setEvalLoading(false)
    })
  }

  function closeModal() {
    fetchSeq.current += 1
    setSelected(null)
    setEvaluation(null)
    setEvalLoading(false)
  }

  const columns: Column<CallReportRow>[] = [
    { key: 'agent', header: 'Agent' },
    { key: 'duration', header: 'Duration' },
    { key: 'outcome', header: 'Outcome' },
    {
      key: 'aiScore',
      header: 'AI Score',
      render: (row) => (
        <span className="font-medium text-primary">{row.aiScore}</span>
      ),
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      render: (row) => (
        <span
          className={
            row.sentiment === 'Positive'
              ? 'text-emerald-600'
              : row.sentiment === 'Negative'
                ? 'text-red-600'
                : 'text-amber-700'
          }
        >
          {row.sentiment}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Click a row to open transcript, simulated audio, and AI evaluation.
      </p>
      <DataTable<CallReportRow>
        columns={columns}
        rows={callReports}
        getRowKey={(r) => r.id}
        onRowClick={openReport}
      />

      <Modal
        open={!!selected}
        onClose={closeModal}
        title={selected ? `Call — ${selected.agent}` : 'Call'}
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <AudioPlayerMock />
            <Card title="Transcript" padding={false} className="p-0 shadow-none border-0">
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm">
                {selected.transcript}
              </pre>
            </Card>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text">AI evaluation</h3>
              {evalLoading && <SkeletonLines rows={3} />}
              {evaluation && !evalLoading && (
                <div className="space-y-3 rounded-xl border border-border bg-slate-50/80 p-4">
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <p className="text-muted">Clarity</p>
                      <p className="text-lg font-semibold text-primary">
                        {evaluation.scoreBreakdown.clarity}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Empathy</p>
                      <p className="text-lg font-semibold text-primary">
                        {evaluation.scoreBreakdown.empathy}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Compliance</p>
                      <p className="text-lg font-semibold text-primary">
                        {evaluation.scoreBreakdown.compliance}
                      </p>
                    </div>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-text">
                    {evaluation.feedback.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
