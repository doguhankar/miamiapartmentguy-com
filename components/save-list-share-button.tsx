'use client'

import { useState } from 'react'
import { useSaveList } from '@/components/save-list-provider'

export function SaveListShareButton() {
  const { user, share } = useSaveList(); const [message, setMessage] = useState('')
  if (!user || !user.shareSlug) return null
  return <button type="button" onClick={async () => { try { await share(); setMessage('Link copied') } catch { setMessage('Could not copy link') } setTimeout(() => setMessage(''), 2200) }} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary">{message || 'Share shortlist'}</button>
}
