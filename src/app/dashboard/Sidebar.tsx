'use client'
import type { Conversation, User, Tag } from '@/types'
import styles from './Sidebar.module.css'

interface Props {
  conversations: Conversation[]
  activeConvId: number | null
  filterStatus: string
  filterAgent: string
  filterTag: string
  allUsers: User[]
  allTags: Tag[]
  onSelectConv: (id: number) => void
  onFilterStatus: (s: string) => void
  onFilterAgent: (s: string) => void
  onFilterTag: (s: string) => void
}

const STATUS_LABELS: Record<string, string> = { open: 'Aberta', closed: 'Fechada', pending: 'Pendente' }

function initials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarBg(name: string) {
  const colors = ['#1a7f5a','#1a5f8f','#6b3fa0','#8f3f1a','#1a7a7a','#7a1a5a','#5a7a1a']
  const i = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[i]
}

function relTime(ts: string) {
  const d    = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000)    return 'agora'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const STATUSES = [
  { value: '',        label: 'Todas'    },
  { value: 'open',    label: 'Abertas'  },
  { value: 'pending', label: 'Pendente' },
  { value: 'closed',  label: 'Fechadas' },
]

export default function Sidebar({ conversations, activeConvId, filterStatus, filterAgent, filterTag, allUsers, allTags, onSelectConv, onFilterStatus, onFilterAgent, onFilterTag }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.head}>
        <div className={styles.tabs}>
          {STATUSES.map(s => (
            <button key={s.value} className={`${styles.tab} ${filterStatus === s.value ? styles.active : ''}`} onClick={() => onFilterStatus(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <select className={styles.fsel} value={filterAgent} onChange={e => onFilterAgent(e.target.value)}>
            <option value="">Todos atendentes</option>
            {allUsers.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
          </select>
          <select className={styles.fsel} value={filterTag} onChange={e => onFilterTag(e.target.value)}>
            <option value="">Todas tags</option>
            {allTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.list}>
        {conversations.length === 0 && <div className={styles.empty}>Nenhuma conversa</div>}
        {conversations.map(c => (
          <div
            key={c.id}
            className={`${styles.item} ${c.id === activeConvId ? styles.active : ''} ${c.unreadCount > 0 ? styles.unread : ''}`}
            onClick={() => onSelectConv(c.id)}
          >
            <div className={styles.avatar} style={{ background: avatarBg(c.contactName || c.contactNumber) }}>
              {initials(c.contactName || c.contactNumber)}
              {c.unreadCount > 0 && <span className={styles.unreadDot} />}
            </div>

            <div className={styles.info}>
              <div className={styles.top}>
                <span className={styles.name}>{c.contactName || c.contactNumber}</span>
                <span className={styles.time}>{relTime(c.lastMessageAt)}</span>
              </div>
              <div className={styles.preview}>{c.lastMessage || ''}</div>
              <div className={styles.bottom}>
                <span className={`${styles.statusDot} ${styles[`s_${c.status}`]}`} title={STATUS_LABELS[c.status]} />
                {c.departmentName && <span className={styles.deptBadge}>{c.departmentName}</span>}
                {c.tags.slice(0, 2).map(t => (
                  <span key={t.id} className={styles.tagPill} style={{ background: hexAlpha(t.color, 0.15), color: t.color, border: `1px solid ${hexAlpha(t.color, 0.3)}` }}>{t.name}</span>
                ))}
                {c.unreadCount > 0 && <span className={styles.unreadCount}>{c.unreadCount > 99 ? '99+' : c.unreadCount}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}
