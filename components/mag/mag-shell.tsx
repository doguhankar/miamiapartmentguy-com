'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from './bottom-nav'
import { QuickAddLead } from './quick-add-lead'

type AuthStatus = 'loading' | 'idle' | 'checking' | 'approved' | 'denied'

interface User {
  email: string
  name: string
}

export function MagShell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    const sb = supabaseRef.current

    const checkAllowlist = async (email: string, name: string) => {
      if (checkingRef.current) return
      checkingRef.current = true
      setStatus('checking')
      setUser({ email, name })
      try {
        const { data, error } = await sb
          .from('agent_allowlist')
          .select('email')
          .eq('email', email)
          .single()
        if (error || !data) {
          setStatus('denied')
          setError('Your account is not authorized. Contact your team admin.')
        } else {
          setStatus('approved')
        }
      } catch {
        setStatus('denied')
        setError('Error checking authorization.')
      } finally {
        checkingRef.current = false
      }
    }

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const email = session.user.email ?? ''
        const name = session.user.user_metadata?.full_name || email.split('@')[0] || 'Agent'
        checkAllowlist(email, name)
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        setStatus('idle')
      } else if (event === 'SIGNED_OUT') {
        setStatus('idle')
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleSignIn = async () => {
    const sb = supabaseRef.current!
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/mag` },
    })
  }

  const handleSignOut = async () => {
    await supabaseRef.current?.auth.signOut()
  }

  if (status === 'loading' || status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#C9A87C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#525252]">{status === 'checking' ? 'Checking access…' : 'Loading…'}</p>
        </div>
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 pb-safe">
        <div className="w-full max-w-xs space-y-10">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-[#C9A87C]" style={{ fontFamily: 'var(--font-space-grotesk)', letterSpacing: '0.3em' }}>
              MAG
            </div>
            <p className="text-[11px] text-[#404040] tracking-widest uppercase">Intelligence · Lead Dashboard</p>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-[#262626] rounded-2xl text-sm font-medium text-[#737373] hover:border-[#404040] hover:text-[#f5f5f5] active:scale-[0.98] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 pb-safe">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-2xl">🔒</div>
          <p className="font-semibold text-[#f5f5f5]">Access Denied</p>
          <p className="text-sm text-[#525252]">{error}</p>
          <button onClick={handleSignOut} className="text-xs text-[#525252] underline">Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-safe sticky top-0 z-10">
        <div className="flex items-center justify-between h-12">
          <span className="text-sm font-bold tracking-[0.25em] text-[#C9A87C]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            MAG
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#404040]">{user?.name?.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <BottomNav />

      {/* FAB — quick add contact */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 z-30 w-12 h-12 rounded-full bg-[#C9A87C] text-[#0a0a0a] flex items-center justify-center shadow-lg active:scale-95 hover:bg-[#d4b88a] transition-all"
        aria-label="Add contact"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <QuickAddLead open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
