import type { ReactNode } from 'react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends object>({
  columns,
  rows,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 font-semibold text-text"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={
                  onRowClick
                    ? 'cursor-pointer border-b border-border/80 transition-colors last:border-0 hover:bg-primary/5'
                    : 'border-b border-border/80 last:border-0'
                }
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-text">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
