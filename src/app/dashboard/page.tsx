'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import DetailPanel from './DetailPanel'
import Topbar from './Topbar'
import QRModal from './modals/QRModal'
import AdminModal from './modals/AdminModal'
import type { Conversation, Message, User, Tag, Department } from '@/types'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const router = useRouter()

  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken]             = useState<string>('')

  // Socket
  const socketRef = useRef<Socket | null>(null)

  // State
  const [conversations,   setConversations]   = useState<Conversation[]>([])
  const [activeConvId,    setActiveConvId]     = useState<number | null>(null)
  const [messages,        setMessages]         = useState<Message[]>([])
  const [allUsers,        setAllUsers]         = useState<User[]>([])
  const [allTags,         setAllTags]          = useState<Tag[]>([])
  const [allDepts,        setAllDepts]         = useState<Department[]>([])
  const [waConnected,     setWaConnected]      = useState(false)
  const [waQR,            setWaQR]             = useState<string | null>(null)
  const [showQR,          setShowQR]           = useState(false)
  const [showAdmin,       setShowAdmin]        = useState(false)
  const [filterStatus,    setFilterStatus]     = useState('')
  const [filterAgent,     setFilterAgent]      = useState('')
  const [filterTag,       setFilterTag]        = useState('')
  const [searchTerm,      setSearchTerm]       = useState('')
  const [notifCount,      setNotifCount]       = useState(0)
  const [typingUsers,     setTypingUsers]      = useState<Map<number, string>>(new Map())
  const [detailOpen,      setDetailOpen]       = useState(false)
  const [loadingMsgs,     setLoadingMsgs]      = useState(false)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

  // ── INIT ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('hd_token')
    const u = localStorage.getItem('hd_user')
    if (!t) { router.replace('/login'); return }

    setToken(t)
    if (u) setCurrentUser(JSON.parse(u))

    // Verify token
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (!r.ok) { localStorage.clear(); router.replace('/login') } else r.json().then(d => setCurrentUser(d.user)) })
      .catch(() => { localStorage.clear(); router.replace('/login') })
  }, [])

  useEffect(() => {
    if (!token) return
    loadConversations()
    loadUsers()
    loadTags()
    loadDepts()
    checkWA()
    connectSocket()
    return () => { socketRef.current?.disconnect() }
  }, [token])

  // ── SOCKET ──────────────────────────────────────────────────────────────────
  function connectSocket() {
    const s = io('/', { auth: { token }, path: '/socket.io' })
    socketRef.current = s

    s.on('wa:qr',          ({ qr })    => { setWaQR(qr); setWaConnected(false); setShowQR(true) })
    s.on('wa:connected',   ()          => { setWaConnected(true); setWaQR(null) })
    s.on('wa:disconnected',()          => setWaConnected(false))

    s.on('conversation:new', ({ conversation }) => {
      setConversations(prev => [conversation, ...prev])
      playNotif(); setNotifCount(n => n + 1)
    })

    s.on('conversation:updated', (update: Partial<Conversation> & { id: number }) => {
      setConversations(prev => prev
        .map(c => c.id === update.id ? { ...c, ...update } : c)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      )
    })

    s.on('message:new', ({ conversationId, message }: { conversationId: number; message: Message }) => {
      if (conversationId === activeConvIdRef.current) {
        setMessages(prev => [...prev, message])
        // mark read
        fetch(`/api/conversations/${conversationId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      } else {
        playNotif(); setNotifCount(n => n + 1)
      }
    })

    s.on('typing:start', ({ conversationId, user }) => {
      if (conversationId === activeConvIdRef.current) {
        setTypingUsers(prev => new Map(prev).set(user.id, user.name))
      }
    })
    s.on('typing:stop', ({ conversationId, userId }) => {
      if (conversationId === activeConvIdRef.current) {
        setTypingUsers(prev => { const m = new Map(prev); m.delete(userId); return m })
      }
    })
  }

  // Keep ref in sync for socket callbacks
  const activeConvIdRef = useRef<number | null>(null)
  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])

  // ── DATA LOADING ────────────────────────────────────────────────────────────
  async function apiFetch(url: string, opts: RequestInit = {}) {
    const r = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } })
    if (r.status === 401) { localStorage.clear(); router.replace('/login'); return null }
    return r.json()
  }

  async function loadConversations() {
    const p = new URLSearchParams()
    if (filterStatus) p.set('status', filterStatus)
    if (filterAgent)  p.set('assigned_to', filterAgent)
    if (filterTag)    p.set('tag', filterTag)
    if (searchTerm)   p.set('search', searchTerm)
    const d = await apiFetch(`/api/conversations?${p}`)
    if (d) setConversations(d.conversations)
  }

  useEffect(() => { if (token) loadConversations() }, [filterStatus, filterAgent, filterTag, searchTerm])

  async function loadUsers()  { const d = await apiFetch('/api/users');                    if (d) setAllUsers(d.users) }
  async function loadTags()   { const d = await apiFetch('/api/admin/tags');               if (d) setAllTags(d.tags) }
  async function loadDepts()  { const d = await apiFetch('/api/admin/departments');        if (d) setAllDepts(d.departments) }

  async function checkWA() {
    const d = await apiFetch('/api/wa/status')
    if (!d) return
    setWaConnected(d.connected)
    if (d.hasQR) { const q = await apiFetch('/api/wa/qr'); if (q?.qr) { setWaQR(q.qr); setShowQR(true) } }
  }

  async function openConversation(id: number) {
    setActiveConvId(id)
    setDetailOpen(false)
    socketRef.current?.emit('join:conversation', id)
    // mark read locally
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c))
    setLoadingMsgs(true)
    const d = await apiFetch(`/api/messages/${id}?limit=200`)
    setLoadingMsgs(false)
    if (d) setMessages(d.messages)
  }

  async function sendMessage(content: string, file?: File | null, messageType = 'text') {
    if (!activeConvId) return
    const form = new FormData()
    if (content)     form.append('content', content)
    form.append('message_type', file ? getFileType(file.type) : messageType)
    if (file)        form.append('file', file)

    const r = await fetch(`/api/messages/${activeConvId}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const d = await r.json()
    if (r.ok) setMessages(prev => [...prev, d.message])
  }

  async function sendNote(content: string) {
    if (!activeConvId || !content.trim()) return
    const d = await apiFetch(`/api/messages/${activeConvId}/note`, { method: 'POST', body: JSON.stringify({ content }) })
    if (d) setMessages(prev => [...prev, d.message])
  }

  function emitTyping(typing: boolean) {
    if (!activeConvId || !socketRef.current) return
    socketRef.current.emit(typing ? 'typing:start' : 'typing:stop', { conversationId: activeConvId })
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────
  function getFileType(mime: string) {
    if (mime.startsWith('image/'))  return 'image'
    if (mime.startsWith('audio/'))  return 'audio'
    if (mime.startsWith('video/'))  return 'video'
    return 'document'
  }

  function playNotif() {
    try {
      const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 880
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }

  if (!currentUser) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Carregando...</div>

  return (
    <div className={styles.layout}>
      <Topbar
        user={currentUser}
        waConnected={waConnected}
        notifCount={notifCount}
        onNotifClear={() => setNotifCount(0)}
        onWAClick={() => { setShowQR(true); checkWA() }}
        onAdmin={() => setShowAdmin(true)}
        onLogout={async () => { await apiFetch('/api/auth/logout', { method: 'POST' }); localStorage.clear(); router.replace('/login') }}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
      />

      <div className={styles.main}>
        <Sidebar
          conversations={conversations}
          activeConvId={activeConvId}
          filterStatus={filterStatus}
          filterAgent={filterAgent}
          filterTag={filterTag}
          allUsers={allUsers}
          allTags={allTags}
          onSelectConv={openConversation}
          onFilterStatus={setFilterStatus}
          onFilterAgent={setFilterAgent}
          onFilterTag={setFilterTag}
        />

        <ChatArea
          conversation={activeConv}
          messages={messages}
          loadingMsgs={loadingMsgs}
          currentUser={currentUser}
          typingUsers={typingUsers}
          token={token}
          onSend={sendMessage}
          onNote={sendNote}
          onTyping={emitTyping}
          onToggleDetail={() => setDetailOpen(d => !d)}
          onAssume={async () => {
            if (!activeConvId) return
            await apiFetch(`/api/conversations/${activeConvId}/assign`, { method: 'POST', body: JSON.stringify({ user_id: currentUser.id }) })
            loadConversations()
          }}
          onToggleStatus={async () => {
            if (!activeConv) return
            const ns = activeConv.status === 'open' ? 'closed' : 'open'
            await apiFetch(`/api/conversations/${activeConvId}/status`, { method: 'POST', body: JSON.stringify({ status: ns }) })
            loadConversations()
          }}
        />

        {detailOpen && activeConv && (
          <DetailPanel
            conversation={activeConv}
            allUsers={allUsers}
            allDepts={allDepts}
            allTags={allTags}
            token={token}
            onUpdate={loadConversations}
          />
        )}
      </div>

      {showQR && <QRModal qr={waQR} connected={waConnected} onClose={() => setShowQR(false)} />}
      {showAdmin && <AdminModal token={token} currentUser={currentUser} allDepts={allDepts} onClose={() => setShowAdmin(false)} onRefresh={() => { loadUsers(); loadTags(); loadDepts() }} />}
    </div>
  )
}
