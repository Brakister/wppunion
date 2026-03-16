'use client'
import { useEffect, useRef, useState } from 'react'
import type { Conversation, Message, User } from '@/types'
import MessageBubble from './MessageBubble'
import styles from './ChatArea.module.css'

interface Props {
  conversation:  Conversation | null
  messages:      Message[]
  loadingMsgs:   boolean
  currentUser:   User
  typingUsers:   Map<number, string>
  token:         string
  onSend:        (content: string, file?: File | null, type?: string) => void
  onNote:        (content: string) => void
  onTyping:      (typing: boolean) => void
  onToggleDetail:() => void
  onAssume:      () => void
  onToggleStatus:() => void
}

export default function ChatArea({ conversation, messages, loadingMsgs, currentUser, typingUsers, onSend, onNote, onTyping, onToggleDetail, onAssume, onToggleStatus }: Props) {
  const [text,      setText]      = useState('')
  const [mode,      setMode]      = useState<'reply'|'note'>('reply')
  const [file,      setFile]      = useState<File | null>(null)
  const [sending,   setSending]   = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const typingTimer               = useRef<ReturnType<typeof setTimeout>>()
  const typingActive              = useRef(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = text.trim()
    if (!content && !file) return
    setSending(true)
    try {
      if (mode === 'note') await onNote(content)
      else                 await onSend(content, file)
      setText(''); setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      stopTyping()
    } finally { setSending(false) }
  }

  function handleKeydown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); return }
    startTyping()
  }

  function startTyping() {
    if (!typingActive.current) { typingActive.current = true; onTyping(true) }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(stopTyping, 2000)
  }

  function stopTyping() {
    if (typingActive.current) { typingActive.current = false; onTyping(false) }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = '44px'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] || null)
  }

  // Group messages by day
  const grouped: { day: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const day = formatDay(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last?.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  }

  const typingNames = [...typingUsers.values()]

  if (!conversation) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💬</div>
        <div className={styles.emptyTitle}>Nenhuma conversa selecionada</div>
        <div className={styles.emptySub}>Selecione uma conversa para começar</div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.hAvatar} style={{ background: avatarBg(conversation.contactName || conversation.contactNumber) }}>
          {initials(conversation.contactName || conversation.contactNumber)}
        </div>
        <div className={styles.hInfo}>
          <div className={styles.hName}>{conversation.contactName || conversation.contactNumber}</div>
          <div className={styles.hSub}>
            {[conversation.contactNumber, conversation.assignedName && `👤 ${conversation.assignedName}`, conversation.departmentName && `🏢 ${conversation.departmentName}`].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className={styles.hActions}>
          {conversation.assignedTo !== currentUser.id && (
            <button className={`${styles.btnSm} ${styles.primary}`} onClick={onAssume}>Assumir</button>
          )}
          <button className={styles.btnSm} onClick={onToggleStatus}>
            {conversation.status === 'open' ? 'Fechar' : 'Reabrir'}
          </button>
          <button className={styles.iconBtn} onClick={onToggleDetail} title="Detalhes">ℹ️</button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.msgs}>
        {loadingMsgs && <div className={styles.loading}>Carregando...</div>}
        {!loadingMsgs && messages.length === 0 && (
          <div className={styles.noMsgs}>📭 Nenhuma mensagem nos últimos 2 dias</div>
        )}
        {grouped.map(group => (
          <div key={group.day}>
            <div className={styles.daySep}><span>{group.day}</span></div>
            {group.msgs.map(msg => (
              <MessageBubble key={msg.id} msg={msg} currentUser={currentUser} contactName={conversation.contactName || conversation.contactNumber} />
            ))}
          </div>
        ))}
        {typingNames.length > 0 && (
          <div className={styles.typing}>
            <span className={styles.dots}><span/><span/><span/></span>
            {typingNames.join(', ')} {typingNames.length === 1 ? 'está' : 'estão'} digitando...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.input}>
        <div className={styles.modeTabs}>
          <button className={`${styles.modeTab} ${mode === 'reply' ? styles.modeActive : ''}`} onClick={() => setMode('reply')}>💬 Responder</button>
          <button className={`${styles.modeTab} ${styles.noteTab} ${mode === 'note'  ? styles.modeActive : ''}`} onClick={() => setMode('note')}>📌 Nota Interna</button>
        </div>

        <div className={styles.inputRow}>
          <label className={styles.attachBtn} title="Anexar arquivo">
            📎
            <input ref={fileInputRef} type="file" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeydown}
            placeholder={mode === 'note' ? '📌 Nota interna (não enviada ao cliente)...' : 'Digite uma mensagem...'}
            rows={1}
            className={`${styles.textarea} ${mode === 'note' ? styles.noteTextarea : ''}`}
          />

          <button className={styles.sendBtn} onClick={handleSend} disabled={sending || (!text.trim() && !file)}>
            ➤
          </button>
        </div>

        {file && (
          <div className={styles.filePreview}>
            📎 <strong>{file.name}</strong> ({formatBytes(file.size)})
            <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className={styles.fileClear}>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

function initials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarBg(name: string) {
  const colors = ['#1a7f5a','#1a5f8f','#6b3fa0','#8f3f1a','#1a7a7a','#7a1a5a','#5a7a1a']
  const i = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[i]
}

function formatDay(ts: string) {
  const d     = new Date(ts)
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay= new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (msgDay.getTime() === today.getTime()) return 'Hoje'
  if (msgDay.getTime() === today.getTime() - 86400000) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatBytes(b: number) {
  if (b < 1024)    return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}
