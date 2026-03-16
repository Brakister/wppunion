'use client'
import { useEffect, useState } from 'react'
import type { User, Department } from '@/types'
import styles from './Modal.module.css'

interface Props {
  token:       string
  currentUser: User
  allDepts:    Department[]
  onClose:     () => void
  onRefresh:   () => void
}

type AdminTab = 'stats' | 'users' | 'tags' | 'depts'

export default function AdminModal({ token, currentUser, allDepts, onClose, onRefresh }: Props) {
  const [tab, setTab]     = useState<AdminTab>('stats')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tags,  setTags]  = useState<any[]>([])
  const [depts, setDepts] = useState<Department[]>([])
  const [newTag,  setNewTag]  = useState({ name: '', color: '#00a884' })
  const [newDept, setNewDept] = useState('')
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser,  setNewUser]  = useState({ name: '', email: '', password: '', role: 'agent', department_id: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [s, u, t, d] = await Promise.all([
      fetch('/api/admin/stats',       { headers }).then(r => r.json()),
      fetch('/api/users',             { headers }).then(r => r.json()),
      fetch('/api/admin/tags',        { headers }).then(r => r.json()),
      fetch('/api/admin/departments', { headers }).then(r => r.json()),
    ])
    setStats(s.stats)
    setUsers(u.users || [])
    setTags(t.tags   || [])
    setDepts(d.departments || [])
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) { setError('Preencha todos os campos'); return }
    setSaving(true); setError('')
    const r = await fetch('/api/users', { method: 'POST', headers, body: JSON.stringify({ ...newUser, department_id: newUser.department_id || null }) })
    const d = await r.json()
    setSaving(false)
    if (!r.ok) { setError(d.error); return }
    setNewUser({ name: '', email: '', password: '', role: 'agent', department_id: '' })
    setShowNewUser(false)
    loadAll(); onRefresh()
  }

  async function deleteUser(id: number) {
    if (!confirm('Remover este usuário?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE', headers })
    loadAll(); onRefresh()
  }

  async function createTag() {
    if (!newTag.name) return
    await fetch('/api/admin/tags', { method: 'POST', headers, body: JSON.stringify(newTag) })
    setNewTag({ name: '', color: '#00a884' })
    loadAll(); onRefresh()
  }

  async function deleteTag(id: number) {
    await fetch(`/api/admin/tags/${id}`, { method: 'DELETE', headers })
    loadAll(); onRefresh()
  }

  async function createDept() {
    if (!newDept) return
    await fetch('/api/admin/departments', { method: 'POST', headers, body: JSON.stringify({ name: newDept }) })
    setNewDept('')
    loadAll(); onRefresh()
  }

  async function deleteDept(id: number) {
    await fetch(`/api/admin/departments/${id}`, { method: 'DELETE', headers })
    loadAll(); onRefresh()
  }

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'stats', label: '📊 Estatísticas' },
    { key: 'users', label: '👥 Usuários' },
    { key: 'tags',  label: '🏷️ Tags' },
    { key: 'depts', label: '🏢 Departamentos' },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalWide}`} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <h3>⚙️ Administração</h3>

        <div className={styles.admTabs}>
          {TABS.map(t => (
            <button key={t.key} className={`${styles.admTab} ${tab === t.key ? styles.active : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* STATS */}
        {tab === 'stats' && stats && (
          <>
            <div className={styles.statGrid}>
              <div className={styles.statCard}><div className={styles.statVal}>{stats.total_conversations}</div><div className={styles.statLbl}>Total Conversas</div></div>
              <div className={styles.statCard}><div className={styles.statVal}>{stats.open_conversations}</div><div className={styles.statLbl}>Conversas Abertas</div></div>
              <div className={styles.statCard}><div className={styles.statVal}>{stats.today_messages}</div><div className={styles.statLbl}>Mensagens Hoje</div></div>
              <div className={styles.statCard}><div className={styles.statVal}>{stats.online_users}</div><div className={styles.statLbl}>Usuários Online</div></div>
            </div>
            <table className={styles.tbl}>
              <thead><tr><th>Atendente</th><th>Conversas</th></tr></thead>
              <tbody>
                {stats.by_agent?.map((a: any) => (
                  <tr key={a.name}><td>{a.name}</td><td>{a.total}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <>
            <div className={styles.topAction}>
              <button className={styles.btnP} onClick={() => setShowNewUser(v => !v)}>
                {showNewUser ? 'Cancelar' : '+ Novo Usuário'}
              </button>
            </div>

            {showNewUser && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
                <div className={styles.fg}><label>Nome</label><input value={newUser.name}     onChange={e => setNewUser({...newUser, name: e.target.value})}     placeholder="Nome completo" /></div>
                <div className={styles.fg}><label>Email</label><input type="email" value={newUser.email}    onChange={e => setNewUser({...newUser, email: e.target.value})}    placeholder="email@empresa.com" /></div>
                <div className={styles.fg}><label>Senha</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Mínimo 6 caracteres" /></div>
                <div className={styles.formRow}>
                  <div className={styles.fg}>
                    <label>Perfil</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="agent">Atendente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className={styles.fg}>
                    <label>Departamento</label>
                    <select value={newUser.department_id} onChange={e => setNewUser({...newUser, department_id: e.target.value})}>
                      <option value="">Nenhum</option>
                      {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.foot}>
                  <button className={styles.btnP} onClick={createUser} disabled={saving}>
                    {saving ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </div>
            )}

            <table className={styles.tbl}>
              <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email}</td>
                    <td><span className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAdmin : styles.badgeAgent}`}>{u.role}</span></td>
                    <td>
                      <span className={`${styles.olDot} ${u.isOnline ? styles.olOn : styles.olOff}`} />
                      {u.isOnline ? 'Online' : 'Offline'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.id !== currentUser.id && (
                        <button onClick={() => deleteUser(u.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 12 }}>
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* TAGS */}
        {tab === 'tags' && (
          <>
            <div className={styles.addRow}>
              <input className={styles.addInput} placeholder="Nome da tag" value={newTag.name} onChange={e => setNewTag({...newTag, name: e.target.value})} onKeyDown={e => e.key === 'Enter' && createTag()} />
              <input type="color" value={newTag.color} onChange={e => setNewTag({...newTag, color: e.target.value})} style={{ width: 40, height: 34, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }} />
              <button className={styles.btnP} onClick={createTag}>Criar</button>
            </div>
            <div className={styles.tagsList}>
              {tags.map(t => (
                <div key={t.id} className={styles.tagChip}
                  style={{ background: hexAlpha(t.color,.15), color: t.color, border: `1px solid ${hexAlpha(t.color,.3)}` }}>
                  {t.name}
                  <button className={styles.chipDel} onClick={() => deleteTag(t.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DEPTS */}
        {tab === 'depts' && (
          <>
            <div className={styles.addRow}>
              <input className={styles.addInput} placeholder="Nome do departamento" value={newDept} onChange={e => setNewDept(e.target.value)} onKeyDown={e => e.key === 'Enter' && createDept()} />
              <button className={styles.btnP} onClick={createDept}>Criar</button>
            </div>
            <div className={styles.deptList}>
              {depts.map(d => (
                <div key={d.id} className={styles.deptItem}>
                  <span>{d.name}</span>
                  <button className={styles.deptDel} onClick={() => deleteDept(d.id)}>Remover</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}
