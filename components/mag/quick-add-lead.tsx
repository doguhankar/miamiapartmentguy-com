'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface QuickAddLeadProps {
  open: boolean
  onClose: () => void
}

export function QuickAddLead({ open, onClose }: QuickAddLeadProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ id: number; name: string } | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setPhone('')
      setError(null)
      setDuplicate(null)
      setTimeout(() => nameRef.current?.focus(), 150)
    }
  }, [open])

  // Duplicate check on phone input
  useEffect(() => {
    setDuplicate(null)
    if (!phone.trim() || phone.trim().length < 7) return
    const sb = createClient()
    sb.from('leads')
      .select('id,name')
      .eq('phone', phone.trim())
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDuplicate({ id: data.id, name: data.name ?? phone.trim() })
      })
  }, [phone])

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const sb = createClient()
      const { data: { session } } = await sb.auth.getSession()
      const agentId = session?.user?.email ?? 'doguhankar1@gmail.com'
      const res = await fetch('/api/agent/add-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), agent_id: agentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create contact')
      onClose()
      router.push(`/mag/clients/${json.data.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && phone.trim() && !submitting) handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — slides up on mobile, centered on desktop */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-[#111111] border border-[#262626] rounded-t-3xl p-6 space-y-5
                   md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 md:rounded-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center md:hidden -mt-2 mb-1">
          <div className="w-8 h-1 bg-[#333] rounded-full" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#f5f5f5]">Add Contact</h2>
          <button
            onClick={onClose}
            className="text-[#525252] hover:text-[#f5f5f5] p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <input
            ref={nameRef}
            type="text"
            autoComplete="name"
            placeholder="Full name *"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#262626] focus:border-[#C9A87C]/60 rounded-xl px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#404040] outline-none transition-colors"
          />

          <div className="space-y-1.5">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Phone number *"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] focus:border-[#C9A87C]/60 rounded-xl px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#404040] outline-none transition-colors"
            />
            {duplicate && (
              <div className="flex items-center gap-2 px-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-xs text-[#fb923c]">Already exists —</span>
                <a
                  href={`/mag/clients/${duplicate.id}`}
                  onClick={onClose}
                  className="text-xs text-[#C9A87C] hover:underline font-medium"
                >
                  {duplicate.name}
                </a>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 px-1">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !phone.trim() || submitting}
          className="w-full py-3 rounded-xl bg-[#C9A87C] text-[#0a0a0a] text-sm font-semibold
                     disabled:opacity-30 active:opacity-80 hover:bg-[#d4b88a] transition-colors"
        >
          {submitting ? 'Adding…' : 'Add Contact'}
        </button>

        <p className="text-[10px] text-[#404040] text-center pb-safe">
          Name and phone are required · duplicate check runs automatically
        </p>
      </div>
    </>
  )
}
