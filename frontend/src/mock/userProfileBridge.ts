/**
 * Maps directory user IDs to `agent` labels in `callReports` mock data so per-user
 * call history shows realistic rows. Unknown users fall back to display name (may be empty).
 */
export const USER_ID_TO_CALL_AGENT: Record<string, string> = {
  u_seed_agent: 'Sarah Chen',
  u_seed_admin: 'Marcus Lee',
}

export function callAgentLabelForUser(userId: string, displayName: string): string {
  return USER_ID_TO_CALL_AGENT[userId] ?? displayName
}
