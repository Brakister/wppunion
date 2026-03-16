'use client'
import { useState } from 'react'
import type { Conversation, User, Tag, Department } from '@/types'
import styles from './DetailPanel.module.css'

interface Props {
  conversation: Conversation
  allUsers:     User[]
  allDepts:     Department[]
  allTags:      Tag[]
  token:        string
  onUpdate:     () => void
}

function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

export default function DetailPanel({ conversation, allUsers, allDepts, allTags, token, onUpdate }: Props) {
  const [saving, setSaving] = useState(false)

  async function apiFetch(url: string, body: any) {
    setSaving(true)
    try {
      await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      onUpdate()
    } finally { setSaving(false) }
  }

  async function toggleTag(tagId: number) {
    const current = conversation.tags.map(t => t.id)
    const next    = current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId]
    await apiFetch(`/api/conversations/${conversation.id}/tags`, { tag_ids: next })
  }

  const fmtDate = (ts: string) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <aside className={styles.panel}>
      <div className={styles.section}>
        <h4>Conversa</h4>

        <div className={styles.row}>
          <label>Status</label>
          <select className={styles.sel} value={conversation.status} onChange={e => apiFetch(`/api/conversations/${conversation.id}/status`, { status: e.target.value })}>
            <option value="open">Aberta</option>
            <option value="pending">Pendente</option>
            <option value="closed">Fechada</option>
          </select>
        </div>

        <div className={styles.row}>
          <label>Responsável</label>
          <select className={styles.sel} value={conversation.assignedTo || ''} onChange={e => apiFetch(`/api/conversations/${conversation.id}/assign`, { user_id: e.target.value || null })}>
            <option value="">Sem responsável</option>
            {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className={styles.row}>
          <label>Departamento</label>
          <select className={styles.sel} value={conversation.departmentId || ''} onChange={e => apiFetch(`/api/conversations/${conversation.id}/assign`, { department_id: e.target.value || null })}>
            <option value="">Sem departamento</option>
            {allDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Tags</h4>
        <div className={styles.tagsGrid}>
          {allTags.map(t => {
            const sel = conversation.tags.some(ct => ct.id === t.id)
            return (
              <button key={t.id} className={`${styles.tagBtn} ${sel ? styles.tagSel : ''}`}
                style={sel ? { background: hexAlpha(t.color,.15), color: t.color, borderColor: hexAlpha(t.color,.35) } : {}}
                onClick={() => toggleTag(t.id)}>
                {t.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.section}>
        <h4>Contato</h4>
        <div className={styles.row}><label>Número</label><div className={styles.val}>{conversation.contactNumber}</div></div>
        <div className={styles.row}><label>Desde</label><div className={styles.val}>{fmtDate(conversation.createdAt)}</div></div>
      </div>

      {saving && <div className={styles.saving}>Salvando...</div>}
    </aside>
  )
}
