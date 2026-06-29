'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface Props {
  onSend: (content: string) => Promise<void>
  placeholder?: string
}

export function ChatInput({ onSend, placeholder = 'Type a message...' }: Props): React.JSX.Element {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSend(trimmed)
      setValue('')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex items-end gap-2 p-3 border-t border-[rgb(var(--df-border))] bg-[rgb(var(--df-surface))]"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        maxLength={2000}
        className="flex-1 px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl resize-none focus:outline-none focus:border-[rgb(var(--df-accent))] transition-colors leading-relaxed max-h-[120px] overflow-y-auto"
        style={{ fieldSizing: 'content' } as React.CSSProperties}
      />
      <button
        type="submit"
        disabled={!value.trim() || sending}
        className="w-9 h-9 rounded-xl bg-[rgb(var(--df-accent))] text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  )
}
