'use client'

import { useState, useRef } from 'react'

interface VoiceCaptureProps {
  onCapture: (text: string) => void
}

export function VoiceCapture({ onCapture }: VoiceCaptureProps) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  })
  const recognitionRef = useRef<any>(null)

  const startListening = () => {
    if (typeof window === 'undefined') return
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) onCapture(transcript)
    }
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  if (!supported) {
    return (
      <span className="text-xs text-gray-300">voice not supported</span>
    )
  }

  return (
    <button
      onPointerDown={startListening}
      onPointerUp={stopListening}
      onPointerLeave={stopListening}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        listening
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={listening ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      {listening ? 'Listening…' : 'Voice note'}
    </button>
  )
}
