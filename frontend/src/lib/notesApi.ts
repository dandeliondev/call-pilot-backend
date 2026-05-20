import { apiFetch } from './api'

export interface UserNote {
  id: string
  body: string
  authorId: string | null
  authorName: string | null
  createdAt: string | null
}

interface DataEnvelope<T> {
  data: T
}

export async function fetchUserNotes(userId: string): Promise<UserNote[]> {
  const res = await apiFetch<DataEnvelope<UserNote[]>>(`/api/users/${userId}/notes`)
  return res.data
}

export async function createUserNote(userId: string, body: string): Promise<UserNote> {
  const res = await apiFetch<DataEnvelope<UserNote>>(`/api/users/${userId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  return res.data
}

export async function deleteUserNote(userId: string, noteId: string): Promise<void> {
  await apiFetch(`/api/users/${userId}/notes/${noteId}`, { method: 'DELETE' })
}
