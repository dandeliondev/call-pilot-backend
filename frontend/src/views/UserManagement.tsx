import { Card } from '../components/ui/Card'
import { useMockAuth } from '../hooks/useMockAuth'
import type { MockRole } from '../mock/usersStore'

export function UserManagement() {
  const { directory, updateUserRole, resetDemoData, user: me } = useMockAuth()

  return (
    <div className="space-y-4">
      <Card
        title="User management"
        description="Demo directory stored in your browser (localStorage). No server or database."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            Signed in as <strong>{me?.email}</strong>
          </p>
          <button
            type="button"
            onClick={resetDemoData}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-slate-50"
          >
            Reset demo users
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {directory.map((u) => (
                <tr key={u.id} className="border-b border-border/80">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        updateUserRole(u.id, e.target.value as MockRole)
                      }
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="py-2 text-muted">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
