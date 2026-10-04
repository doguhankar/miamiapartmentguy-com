'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type SaveUser = { id: string; firstName: string; shareSlug: string }
type SaveContext = { user: SaveUser | null; savedIds: string[]; beginSave: (buildingId: string) => void; toggleSave: (buildingId: string) => Promise<void>; toggle: (buildingId: string) => Promise<void>; remove: (buildingId: string) => Promise<void>; clear: () => Promise<void>; share: () => Promise<string | null> }
export const SaveListContext = createContext<SaveContext | null>(null)
const Context = SaveListContext
const key = 'mag-save-user'

export function SaveListProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SaveUser | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [pending, setPending] = useState<string | null>(null)
  useEffect(() => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return
    const savedUser = JSON.parse(raw) as SaveUser
    setUser(savedUser)
    fetch(`/api/saves/${savedUser.id}`).then((r) => r.json()).then((data) => setSavedIds((data.savedIds ?? []).map(String))).catch(() => {})
  }, [])
  const beginSave = (buildingId: string) => setPending(buildingId)
  const createUser = async (input: { firstName: string; lastName: string; phone: string }) => {
    const response = await fetch('/api/saves/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    const nextUser = data.user as SaveUser
    window.localStorage.setItem(key, JSON.stringify(nextUser)); setUser(nextUser)
    if (pending) await saveFor(nextUser.id, pending, true)
    setPending(null)
  }
  const saveFor = async (userId: string, buildingId: string, saved: boolean) => {
    const response = await fetch('/api/saves/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, buildingId, saved }) })
    const data = await response.json(); if (!response.ok) throw new Error(data.error)
    setSavedIds((data.savedIds ?? []).map(String))
  }
  const toggleSave = async (buildingId: string) => {
    if (!user) return beginSave(buildingId)
    await saveFor(user.id, buildingId, !savedIds.includes(String(buildingId)))
  }
  const toggle = toggleSave
  const remove = async (buildingId: string) => {
    if (!user) return
    const response = await fetch(`/api/saves/${user.id}?buildingId=${encodeURIComponent(buildingId)}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    setSavedIds((current) => current.filter((id) => id !== String(buildingId)))
  }
  const clear = async () => {
    if (!user) return
    const response = await fetch(`/api/saves/${user.id}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    setSavedIds([])
  }
  const share = async () => {
    if (!user) return null
    const response = await fetch('/api/saves/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
    const data = await response.json(); if (!response.ok) throw new Error(data.error)
    const url = `${window.location.origin}${data.url}`
    await navigator.clipboard.writeText(url)
    return url
  }
  const value = useMemo(() => ({ user, savedIds, beginSave, toggleSave, toggle, remove, clear, share }), [user, savedIds])
  return <Context.Provider value={value}>{children}<SaveIdentityModal pending={pending} onClose={() => setPending(null)} onSubmit={createUser} /></Context.Provider>
}

function SaveIdentityModal({ pending, onClose, onSubmit }: { pending: string | null; onClose: () => void; onSubmit: (input: { firstName: string; lastName: string; phone: string }) => Promise<void> }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (!pending) return null
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"><div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Save your shortlist</p><h2 className="mt-2 text-2xl font-semibold">Keep the buildings you love.</h2></div><button className="text-2xl text-muted-foreground" onClick={onClose} aria-label="Close">×</button></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Add your details once and we&apos;ll create a private share link for your saved buildings.</p><div className="mt-5 flex flex-col gap-3"><input className="rounded-lg border bg-background px-3 py-2" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /><input className="rounded-lg border bg-background px-3 py-2" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /><input className="rounded-lg border bg-background px-3 py-2" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}<button className="mt-5 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60" disabled={busy} onClick={async () => { try { setBusy(true); await onSubmit(form) } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.') } finally { setBusy(false) } }}>{busy ? 'Saving…' : 'Save building'}</button></div></div>
}

export function useSaveList() { const value = useContext(Context); if (!value) throw new Error('useSaveList must be used inside SaveListProvider'); return value }
